/**
 * Agent / 直聊模型通用对话 Hook
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  directChat,
  executeAgent,
  fetchConversationHistory,
  rollbackConversation,
  submitExecutionInput,
} from '@/api/agent';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  AgentExecutionEvent,
  AgentExecutionState,
  AgentExecutionStateSnapshot,
  ConversationMessage,
  DirectChatDTO,
  ExecutionMode,
} from '@/types/agent';

const MAX_SSE_RETRY = 3;
const SSE_RETRY_DELAYS = [1000, 3000, 8000];

export interface ToolCallProgress {
  toolCode: string;
  status: 'running' | 'done' | 'error';
  args?: string;
  success?: boolean;
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  startedAt?: string;
  completedAt?: string;
  elapsedMs?: number;
  isStreaming?: boolean;
  /** 模型思考过程内容 */
  thinkingContent?: string;
  /** 审批请求元数据（渐进式信任） */
  approvalMeta?: {
    executionId: string;
    approvalId?: string;
    toolCode: string;
    command: string;
  };
  /** 对话轮次索引（用于回滚） */
  turnIndex?: number;
  /** 工具调用进度列表 */
  toolCallProgress?: ToolCallProgress[];
  /** 用户消息携带的附件 ID 列表（用于图片预览） */
  attachmentIds?: string[];
  /** 用户消息携带的图片预览 URL 列表 */
  attachmentImageUrls?: string[];
  /** AI 生成或返回的图片 URL 列表 */
  imageUrls?: string[];
  /** 统一执行状态快照 */
  executionState?: AgentExecutionStateSnapshot;
}

interface UseAgentChatOptions {
  mode: 'agent' | 'model';
  targetId?: string;
  streamEnabled?: boolean;
}

interface SendChatMessageParams {
  message: string;
  attachmentIds?: string[];
  attachmentImageUrls?: string[];
  reasoningStrength?: 'low' | 'medium' | 'high' | string;
  outputFormat?: 'markdown' | 'plain_text' | 'structured_json' | string;
  skillCode?: string;
  executionMode?: ExecutionMode;
  model?: string;
}

function toChatMessages(history: ConversationMessage[] | undefined): ChatMessageItem[] {
  if (!history || history.length === 0) {
    return [];
  }
  let currentTurnIndex = -1;
  let currentTurnStartedAt: string | undefined;
  return history
    .filter((item) => item.messageType === 'USER' || item.messageType === 'AI')
    .map((item, index) => {
      const role = item.messageType === 'USER' ? 'user' : 'assistant';
      const timestamp = resolveTimestamp(item.createdAt);

      if (role === 'user') {
        currentTurnIndex = typeof item.turnIndex === 'number' ? item.turnIndex : currentTurnIndex + 1;
        currentTurnStartedAt = timestamp;
        return {
          id: `${item.messageType}-${item.messageIndex ?? index}`,
          role,
          content: item.textContent ?? '',
          timestamp,
          turnIndex: currentTurnIndex,
          isStreaming: false,
        };
      }

      const resolvedTurnIndex = typeof item.turnIndex === 'number'
        ? item.turnIndex
        : currentTurnIndex >= 0 ? currentTurnIndex : 0;

      return {
        id: `${item.messageType}-${item.messageIndex ?? index}`,
        role,
        content: item.textContent ?? '',
        timestamp,
        startedAt: currentTurnStartedAt,
        completedAt: timestamp,
        elapsedMs: resolveElapsedMs(currentTurnStartedAt, timestamp),
        turnIndex: resolvedTurnIndex,
        isStreaming: false,
      };
    });
}

function buildStorageKey(mode: 'agent' | 'model', targetId?: string) {
  return targetId ? `schemaplexai_chat_${mode}_${targetId}` : '';
}

function resolveTimestamp(input?: string) {
  if (!input) {
    return new Date().toISOString();
  }
  return Number.isNaN(new Date(input).getTime()) ? new Date().toISOString() : input;
}

function resolveElapsedMs(startedAt?: string, completedAt?: string, elapsedMs?: number) {
  if (typeof elapsedMs === 'number' && Number.isFinite(elapsedMs) && elapsedMs >= 0) {
    return elapsedMs;
  }
  if (!startedAt || !completedAt) {
    return undefined;
  }
  const started = new Date(startedAt).getTime();
  const completed = new Date(completedAt).getTime();
  if (Number.isNaN(started) || Number.isNaN(completed)) {
    return undefined;
  }
  return Math.max(0, completed - started);
}

function resolveLastTurnIndex(messages: ChatMessageItem[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const turnIndex = messages[index]?.turnIndex;
    if (typeof turnIndex === 'number') {
      return turnIndex;
    }
  }
  return -1;
}

function stringArrayValue(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const list = value.map((item) => String(item)).filter(Boolean);
  return list.length ? list : undefined;
}

function resolveExecutionStateSnapshot(
  event: AgentExecutionEvent,
  fallbackState: AgentExecutionState,
  message?: string,
): AgentExecutionStateSnapshot {
  const payload = event.payload as Record<string, unknown> | undefined;
  return {
    state: event.executionState ?? fallbackState,
    eventType: event.eventType,
    message: message || event.message,
    traceId: event.traceId ?? (typeof payload?.traceId === 'string' ? payload.traceId : undefined),
    retryable: event.retryable ?? (typeof payload?.retryable === 'boolean' ? payload.retryable : undefined),
    targetUrl: event.targetUrl ?? (typeof payload?.targetUrl === 'string' ? payload.targetUrl : undefined),
    evidence: event.evidence ?? stringArrayValue(payload?.evidence),
    timestamp: event.timestamp,
  };
}

export function useAgentChat({ mode, targetId, streamEnabled = true }: UseAgentChatOptions) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const tenantId = useAuthStore((state) => state.tenantId);

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string>();

  const abortRef = useRef<AbortController | null>(null);
  const connectTokenRef = useRef(0);
  const storageKey = useMemo(() => buildStorageKey(mode, targetId), [mode, targetId]);

  const appendUserMessage = useCallback((content: string, attachmentIds?: string[], attachmentImageUrls?: string[]) => {
    setMessages((prev) => {
      const lastTurnIndex = resolveLastTurnIndex(prev);
      const nextTurnIndex = prev[prev.length - 1]?.role === 'user'
        ? Math.max(lastTurnIndex, 0)
        : lastTurnIndex + 1;
      return [...prev, {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
        turnIndex: Math.max(nextTurnIndex, 0),
        attachmentIds,
        attachmentImageUrls,
      }];
    });
  }, []);

  const appendAssistantPlaceholder = useCallback(() => {
    const startedAt = new Date().toISOString();
    setMessages((prev) => {
      const lastTurnIndex = resolveLastTurnIndex(prev);
      const nextTurnIndex = prev[prev.length - 1]?.role === 'user'
        ? prev[prev.length - 1]?.turnIndex ?? Math.max(lastTurnIndex, 0)
        : Math.max(lastTurnIndex, 0);
      return [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: startedAt,
        startedAt,
        turnIndex: Math.max(nextTurnIndex, 0),
        isStreaming: true,
      }];
    });
  }, []);

  const updateAssistantMessage = useCallback((updater: (current: ChatMessageItem) => ChatMessageItem) => {
    setMessages((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const last = prev[prev.length - 1];
      if (last.role !== 'assistant') {
        return prev;
      }
      return [...prev.slice(0, -1), updater(last)];
    });
  }, []);

  const appendAssistantChunk = useCallback((chunk: string) => {
    updateAssistantMessage((current) => ({
      ...current,
      content: `${current.content}${chunk}`,
      isStreaming: true,
    }));
  }, [updateAssistantMessage]);

  const appendAssistantThinking = useCallback((chunk: string) => {
    updateAssistantMessage((current) => ({
      ...current,
      thinkingContent: `${current.thinkingContent ?? ''}${chunk}`,
      isStreaming: true,
    }));
  }, [updateAssistantMessage]);

  const finishAssistantMessage = useCallback((options?: { content?: string; timestamp?: string; elapsedMs?: number }) => {
    updateAssistantMessage((current) => {
      const completedAt = resolveTimestamp(options?.timestamp);
      return {
        ...current,
        content: options?.content ?? current.content,
        timestamp: completedAt,
        completedAt,
        elapsedMs: resolveElapsedMs(current.startedAt, completedAt, options?.elapsedMs),
        isStreaming: false,
      };
    });
  }, [updateAssistantMessage]);

  const replaceAssistantMessage = useCallback((content: string, options?: {
    timestamp?: string;
    elapsedMs?: number;
    imageUrls?: string[];
    executionState?: AgentExecutionStateSnapshot;
  }) => {
    updateAssistantMessage((current) => {
      const completedAt = resolveTimestamp(options?.timestamp);
      return {
        ...current,
        content,
        imageUrls: options?.imageUrls,
        timestamp: completedAt,
        completedAt,
        elapsedMs: resolveElapsedMs(current.startedAt, completedAt, options?.elapsedMs),
        isStreaming: false,
        executionState: options?.executionState,
      };
    });
  }, [updateAssistantMessage]);

  const persistConversation = useCallback((nextConversationId?: string) => {
    setConversationId(nextConversationId);
    if (!storageKey) {
      return;
    }
    if (nextConversationId) {
      localStorage.setItem(storageKey, nextConversationId);
      return;
    }
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const resetConversation = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    connectTokenRef.current += 1;
    setMessages([]);
    setError(undefined);
    setIsPending(false);
    persistConversation(undefined);
  }, [persistConversation]);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    connectTokenRef.current += 1;
    setMessages([]);
    setError(undefined);
    setIsPending(false);
    if (!storageKey) {
      setConversationId(undefined);
      return;
    }
    const savedConversationId = localStorage.getItem(storageKey) || undefined;
    setConversationId(savedConversationId);
  }, [storageKey]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    fetchConversationHistory(conversationId)
      .then((response) => {
        if (!cancelled) {
          setMessages(toChatMessages(response.data));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('对话历史恢复失败');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const rollbackToTurn = useCallback(async (turnIndex: number) => {
    if (!conversationId || isPending) {
      return false;
    }
    setError(undefined);
    try {
      await rollbackConversation(conversationId, turnIndex);
      const response = await fetchConversationHistory(conversationId);
      setMessages(toChatMessages(response.data));
      return true;
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : '回滚失败';
      setError(message);
      return false;
    }
  }, [conversationId, isPending]);

  const connectExecutionStream = useCallback(async (
    agentId: string,
    executionId: string,
    retryCount = 0,
    connectToken = connectTokenRef.current,
  ): Promise<void> => {
    const controller = abortRef.current;
    const headers: Record<string, string> = { Accept: 'text/event-stream' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    try {
      const response = await fetch(`/api/agents/${agentId}/executions/${executionId}/events`, {
        method: 'GET',
        headers,
        signal: controller?.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error('SSE connect failed');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let completed = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const dataLine = part.split('\n').find((line) => line.startsWith('data:'));
          if (!dataLine) {
            continue;
          }
          let event: AgentExecutionEvent;
          try {
            event = JSON.parse(dataLine.slice(5).trim()) as AgentExecutionEvent;
          } catch {
            continue;
          }
          const payload = event.payload as Record<string, unknown> | undefined;
          const content = typeof payload?.content === 'string'
            ? payload.content
            : (event.message ?? '');

          if (event.eventType === 'CHUNK' || event.eventType === 'STREAM_OUTPUT' || event.eventType === 'STREAM_CHUNK') {
            appendAssistantChunk(content);
          } else if (event.eventType === 'THINKING') {
            appendAssistantThinking(content);
          } else if (event.eventType === 'TOOL_START') {
            const toolPayload = payload as Record<string, string> | undefined;
            const toolCode = toolPayload?.toolCode ?? event.message ?? '';
            updateAssistantMessage((current) => ({
              ...current,
              toolCallProgress: [
                ...(current.toolCallProgress ?? []),
                { toolCode, status: 'running', args: toolPayload?.args },
              ],
            }));
          } else if (event.eventType === 'TOOL_END') {
            const toolPayload = payload as Record<string, unknown> | undefined;
            const toolCode = String(toolPayload?.toolCode ?? '');
            const success = toolPayload?.success !== false;
            updateAssistantMessage((current) => ({
              ...current,
              toolCallProgress: (current.toolCallProgress ?? []).map((t) =>
                t.toolCode === toolCode && t.status === 'running'
                  ? { ...t, status: success ? 'done' : 'error', success }
                  : t
              ),
            }));
          } else if (event.eventType === 'SUGGESTION' || event.eventType === 'TOOL_SUGGEST_PREVIEW' || event.eventType === 'PLAN_STEP') {
            appendAssistantChunk(content);
          } else if (event.eventType === 'APPROVAL_REQUIRED') {
            const approvalPayload = payload as Record<string, unknown> | undefined;
            const command = String(approvalPayload?.command ?? approvalPayload?.args ?? '');
            replaceAssistantMessage(content || '需要您的审批才能继续执行', {
              timestamp: event.timestamp,
              elapsedMs: event.elapsedMs,
            });
            setMessages(prev => prev.map((m, i) =>
              i === prev.length - 1 && m.role === 'assistant'
                ? {
                    ...m,
                    approvalMeta: {
                      executionId: event.executionId ?? '',
                      approvalId: typeof approvalPayload?.approvalId === 'string' ? approvalPayload.approvalId : undefined,
                      toolCode: String(approvalPayload?.toolCode ?? ''),
                      command,
                    },
                  }
                : m
            ));
            completed = true;
            break;
          } else if (
            event.eventType === 'FAILED'
            || event.eventType === 'BLOCKED'
            || event.eventType === 'FAILED_RETRYABLE'
            || event.eventType === 'FAILED_FINAL'
            || event.eventType === 'BLOCKED_BY_BUDGET'
            || event.eventType === 'BLOCKED_BY_SECURITY'
          ) {
            const fallbackState = event.eventType === 'BLOCKED_BY_BUDGET'
              ? 'BLOCKED_BY_BUDGET'
              : event.eventType === 'BLOCKED_BY_SECURITY'
                ? 'BLOCKED_BY_SECURITY'
                : event.eventType === 'FAILED_RETRYABLE'
                  ? 'FAILED_RETRYABLE'
                  : event.eventType === 'FAILED_FINAL'
                    ? 'FAILED_FINAL'
                    : event.eventType === 'BLOCKED'
                      ? 'BLOCKED_BY_SECURITY'
                      : 'FAILED_RETRYABLE';
            const failureMessage = content || event.message || '执行未完成';
            replaceAssistantMessage(failureMessage, {
              timestamp: event.timestamp,
              elapsedMs: event.elapsedMs,
              executionState: resolveExecutionStateSnapshot(event, fallbackState, failureMessage),
            });
            setError(failureMessage);
            completed = true;
            break;
          } else if (event.eventType === 'PAUSED') {
            const pausedMessage = content || '执行已暂停，等待人工处理';
            replaceAssistantMessage(pausedMessage, {
              timestamp: event.timestamp,
              elapsedMs: event.elapsedMs,
              executionState: resolveExecutionStateSnapshot(event, 'PAUSED', pausedMessage),
            });
            completed = true;
            break;
          } else if (event.eventType === 'FALLBACK_USED') {
            const finalOutput = typeof payload?.finalOutput === 'string'
              ? payload.finalOutput
              : content;
            const fallbackReason = typeof payload?.fallbackReason === 'string'
              ? payload.fallbackReason
              : '模型通道异常';
            replaceAssistantMessage(
              `> 规则化兜底结果，需人工复核\n> 原因：${fallbackReason}\n\n${finalOutput || event.message || '已生成规则化兜底结果'}`,
              {
                timestamp: event.timestamp,
                elapsedMs: event.elapsedMs,
                executionState: resolveExecutionStateSnapshot(event, 'FALLBACK_USED', event.message || fallbackReason),
              },
            );
            completed = true;
            break;
          } else if (event.eventType === 'COMPLETED' || event.eventType === 'CANCELLED') {
            const completedContent = typeof payload?.content === 'string' && payload.content
              ? (payload.content as string) : undefined;
            finishAssistantMessage({
              content: completedContent,
              timestamp: event.timestamp,
              elapsedMs: event.elapsedMs,
            });
            completed = true;
            break;
          }
        }

        if (completed) {
          break;
        }
      }

      if (!completed) {
        throw new Error('SSE disconnected');
      }
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : '连接中断';
      if (exception instanceof Error && exception.name === 'AbortError') {
        finishAssistantMessage({ content: '已取消当前请求' });
        return;
      }
      if (connectToken !== connectTokenRef.current) {
        return;
      }
      if (retryCount < MAX_SSE_RETRY) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, SSE_RETRY_DELAYS[retryCount]);
        });
        return connectExecutionStream(agentId, executionId, retryCount + 1, connectToken);
      }
      replaceAssistantMessage(message || '连接中断，请重试');
      setError(message || '连接中断，请重试');
    }
  }, [
    accessToken,
    appendAssistantChunk,
    appendAssistantThinking,
    finishAssistantMessage,
    replaceAssistantMessage,
    tenantId,
    updateAssistantMessage,
  ]);

  const connectDirectChatStream = useCallback(async (
    params: {
      modelId: string;
      userMessage: string;
      conversationId?: string;
      attachmentIds?: string[];
      reasoningStrength?: string;
      outputFormat?: string;
    },
  ): Promise<void> => {
    const controller = abortRef.current;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    try {
      const response = await fetch('/api/chat/direct/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
        signal: controller?.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error('流式连接失败');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const dataLine = part.split('\n').find((line) => line.startsWith('data:'));
          if (!dataLine) {
            continue;
          }
          let event: AgentExecutionEvent;
          try {
            event = JSON.parse(dataLine.slice(5).trim()) as AgentExecutionEvent;
          } catch {
            continue;
          }
          const payload = event.payload as Record<string, unknown> | undefined;
          const content = typeof payload?.content === 'string' ? payload.content : '';

          if (event.eventType === 'STREAM_CHUNK') {
            appendAssistantChunk(content);
          } else if (event.eventType === 'THINKING') {
            appendAssistantThinking(content);
          } else if (event.eventType === 'STREAM_END') {
            const nextConversationId = typeof payload?.conversationId === 'string'
              ? payload.conversationId
              : event.conversationId;
            if (nextConversationId) {
              persistConversation(nextConversationId);
            }
            finishAssistantMessage({
              timestamp: event.timestamp,
              elapsedMs: event.elapsedMs,
            });
            return;
          } else if (event.eventType === 'FAILED') {
            throw new Error(content || '模型调用失败');
          }
        }
      }
      finishAssistantMessage();
    } catch (exception) {
      if (exception instanceof Error && exception.name === 'AbortError') {
        finishAssistantMessage({ content: '已取消当前请求' });
        return;
      }
      const msg = exception instanceof Error ? exception.message : '流式连接中断';
      replaceAssistantMessage(msg);
      setError(msg);
    }
  }, [
    accessToken,
    appendAssistantChunk,
    appendAssistantThinking,
    finishAssistantMessage,
    persistConversation,
    replaceAssistantMessage,
    tenantId,
  ]);

  const sendMessage = useCallback(async ({
    message,
    attachmentIds,
    attachmentImageUrls,
    reasoningStrength,
    outputFormat,
    skillCode,
    executionMode,
    model,
  }: SendChatMessageParams) => {
    if (!targetId || !message.trim() || isPending) {
      return;
    }
    setError(undefined);
    setIsPending(true);
    appendUserMessage(message.trim(), attachmentIds, attachmentImageUrls);
    appendAssistantPlaceholder();
    abortRef.current = new AbortController();
    connectTokenRef.current += 1;
    const connectToken = connectTokenRef.current;

    try {
      if (mode === 'model') {
        if (streamEnabled) {
          await connectDirectChatStream({
            modelId: targetId,
            userMessage: message.trim(),
            conversationId,
            attachmentIds,
            reasoningStrength,
            outputFormat,
          });
        } else {
          const startedAt = Date.now();
          const response = await directChat({
            modelId: targetId,
            userMessage: message.trim(),
            conversationId,
            attachmentIds,
            reasoningStrength,
            outputFormat,
          } satisfies DirectChatDTO);
          persistConversation(response.data.conversationId);
          const completedAt = response.data.createdAt ?? new Date().toISOString();
          replaceAssistantMessage(response.data.reply || '', {
            timestamp: completedAt,
            elapsedMs: resolveElapsedMs(
              new Date(startedAt).toISOString(),
              completedAt,
            ),
          });
        }
        return;
      }

      const response = await executeAgent(targetId, {
        prompt: message.trim(),
        conversationId,
        attachmentIds,
        reasoningStrength,
        outputFormat,
        skillCode,
        executionMode,
        model,
      });
      const submitResult = response.data;
      persistConversation(submitResult.conversationId);

      if (submitResult.status === 'blocked' || submitResult.status === 'failed' || submitResult.status === 'paused') {
        const messageText = submitResult.message
          || submitResult.securityDecision?.message
          || submitResult.budgetAdmission?.message
          || '执行未完成';
        const state: AgentExecutionState = submitResult.status === 'paused'
          ? 'PAUSED'
          : submitResult.budgetAdmission?.strategy === 'block'
            ? 'BLOCKED_BY_BUDGET'
            : submitResult.securityDecision?.decision === 'block' || submitResult.securityDecision?.decision === 'pause'
              ? 'BLOCKED_BY_SECURITY'
              : 'FAILED_RETRYABLE';
        replaceAssistantMessage(messageText, {
          executionState: {
            state,
            eventType: submitResult.status.toUpperCase(),
            message: messageText,
            traceId: submitResult.securityDecision?.traceId,
            retryable: submitResult.status !== 'blocked',
            targetUrl: state === 'BLOCKED_BY_BUDGET'
              ? '/cost'
              : state === 'BLOCKED_BY_SECURITY'
                ? '/security-compliance/risk'
                : undefined,
            evidence: [
              submitResult.budgetAdmission?.message,
              submitResult.securityDecision?.userActionTip,
              submitResult.securityDecision?.adminActionTip,
            ].filter((item): item is string => Boolean(item)),
          },
        });
        return;
      }
      if (!submitResult.executionId) {
        throw new Error('未获取到执行 ID');
      }
      await connectExecutionStream(targetId, submitResult.executionId, 0, connectToken);
    } catch (exception) {
      const messageText = exception instanceof Error ? exception.message : '发送失败';
      replaceAssistantMessage(messageText);
      setError(messageText);
    } finally {
      setIsPending(false);
      abortRef.current = null;
    }
  }, [
    appendAssistantPlaceholder,
    appendUserMessage,
    connectDirectChatStream,
    connectExecutionStream,
    conversationId,
    isPending,
    mode,
    persistConversation,
    replaceAssistantMessage,
    streamEnabled,
    targetId,
  ]);

  const submitApproval = useCallback(async (
    executionId: string,
    decision: 'approve' | 'deny' | 'approve_always',
    toolCode?: string,
    toolCommand?: string,
    approvalId?: string,
  ) => {
    if (!targetId || isPending) {
      return;
    }
    setError(undefined);
    setIsPending(true);
    appendAssistantPlaceholder();
    abortRef.current = new AbortController();
    connectTokenRef.current += 1;
    const connectToken = connectTokenRef.current;

    try {
      await submitExecutionInput(targetId, executionId, {
        approvalDecision: decision,
        approvalId,
        toolCode,
        toolCommand,
      });
      await connectExecutionStream(targetId, executionId, 0, connectToken);
    } catch (exception) {
      const messageText = exception instanceof Error ? exception.message : '审批提交失败';
      replaceAssistantMessage(messageText);
      setError(messageText);
    } finally {
      setIsPending(false);
      abortRef.current = null;
    }
  }, [
    appendAssistantPlaceholder,
    connectExecutionStream,
    isPending,
    replaceAssistantMessage,
    targetId,
  ]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsPending(false);
  }, []);

  return {
    messages,
    conversationId,
    isPending,
    error,
    sendMessage,
    appendUserMessage,
    appendAssistantPlaceholder,
    replaceAssistantMessage,
    submitApproval,
    cancel,
    resetConversation,
    rollbackToTurn,
  };
}

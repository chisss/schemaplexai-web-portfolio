import { useCallback, useEffect, useRef, useState } from 'react';
import { cancelExecution, executeAgent, fetchExecutionDetail, submitExecutionInput } from '@/api/agent';
import { issueWsTicket } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import type { AgentExecutionEvent, AgentExecuteDTO, AgentExecuteResultVO } from '@/types/agent';
import i18n from '@/i18n';

type ExecutionStatus = 'idle' | 'running' | 'waiting_input' | 'waiting_approval' | 'completed' | 'completed_with_fallback' | 'failed' | 'cancelled' | 'blocked' | 'paused';
const MAX_SSE_RETRY = 3;
const RETRY_BASE_MS = 1000;

function mapStatus(status?: string): ExecutionStatus {
  if (status === 'completed') return 'completed';
  if (status === 'completed_with_fallback') return 'completed_with_fallback';
  if (status === 'failed') return 'failed';
  if (status === 'stopped') return 'cancelled';
  if (status === 'blocked') return 'blocked';
  if (status === 'paused') return 'paused';
  if (status === 'running' || status === 'queued') return 'running';
  return 'idle';
}

export function useAgentExecution(agentId?: string) {
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [logs, setLogs] = useState<AgentExecutionEvent[]>([]);
  const [result, setResult] = useState<unknown>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const pollingTimerRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const accessToken = useAuthStore((s) => s.accessToken);
  const tenantId = useAuthStore((s) => s.tenantId);

  const appendLog = useCallback((event: AgentExecutionEvent) => {
    setLogs((prev) => [...prev, event]);
  }, []);

  const clearPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      window.clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  const closeWs = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const pollStatusFallback = useCallback((execId: string) => {
    clearPolling();
    pollingTimerRef.current = window.setInterval(async () => {
      try {
        if (!agentId) return;
        const res = await fetchExecutionDetail(agentId, execId);
        const detail = res.data;
        const mapped = mapStatus(detail.status);
        setStatus(mapped);
        if (mapped === 'completed' || mapped === 'completed_with_fallback' || mapped === 'failed' || mapped === 'cancelled' || mapped === 'paused' || mapped === 'blocked') {
          clearPolling();
        }
      } catch {
        // 兜底轮询不抛错，避免打断页面交互
      }
    }, 2000);
  }, [agentId, clearPolling]);

  const parseSseChunk = useCallback((block: string) => {
    const lines = block.split('\n');
    const dataLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    }
    if (!dataLines.length) return null;
    try {
      return JSON.parse(dataLines.join('\n')) as AgentExecutionEvent;
    } catch {
      return null;
    }
  }, []);

  const sleep = useCallback((ms: number) => new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  }), []);

  const ensureWsConnected = useCallback(async (execId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsTicketRes = await issueWsTicket();
    const wsTicket = wsTicketRes.data.wsTicket;
    const params = new URLSearchParams();
    if (wsTicket) {
      params.set('ws_ticket', wsTicket);
    }
    const wsUrl = `${protocol}//${window.location.host}/ws${params.toString() ? `?${params.toString()}` : ''}`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    await new Promise<void>((resolve, reject) => {
      const openHandler = () => {
        socket.removeEventListener('open', openHandler);
        socket.removeEventListener('error', errorHandler);
        appendLog({
          eventType: 'WS_CONNECTED',
          executionId: execId,
          message: i18n.t('execution.logWsConnected'),
          timestamp: new Date().toISOString(),
        });
        resolve();
      };
      const errorHandler = () => {
        socket.removeEventListener('open', openHandler);
        socket.removeEventListener('error', errorHandler);
        reject(new Error('WebSocket connect failed'));
      };
      socket.addEventListener('open', openHandler);
      socket.addEventListener('error', errorHandler);
    });
  }, [appendLog]);

  const streamEvents = useCallback(async (execId: string) => {
    if (!agentId) return;
    const headers: Record<string, string> = { Accept: 'text/event-stream' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    for (let attempt = 0; attempt <= MAX_SSE_RETRY; attempt += 1) {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(`/api/agents/${agentId}/executions/${execId}/events`, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          throw new Error('SSE connect failed');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            throw new Error('SSE stream closed');
          }
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() || '';

          for (const chunk of chunks) {
            const event = parseSseChunk(chunk);
            if (!event) continue;
            appendLog(event);

            if (event.eventType === 'REQUIRE_INPUT') {
              setStatus('waiting_input');
              void ensureWsConnected(execId);
            } else if (event.eventType === 'APPROVAL_REQUIRED') {
              setStatus('waiting_approval');
            } else if (event.eventType === 'COMPLETED') {
              const payload = event.payload as Record<string, unknown> | null;
              setStatus('completed');
              setResult(payload?.finalOutput ?? event.payload ?? null);
              closeWs();
              controller.abort();
              return;
            } else if (event.eventType === 'FALLBACK_USED') {
              const payload = event.payload as Record<string, unknown> | null;
              setStatus('completed_with_fallback');
              setResult(payload?.finalOutput ?? event.payload ?? null);
              closeWs();
              controller.abort();
              return;
            } else if (event.eventType === 'FAILED') {
              setStatus('failed');
              closeWs();
              controller.abort();
              return;
            } else if (event.eventType === 'PAUSED') {
              setStatus('paused');
            } else if (event.eventType === 'BLOCKED') {
              setStatus('blocked');
              closeWs();
              controller.abort();
              return;
            } else if (event.eventType === 'RESUMED') {
              setStatus('running');
            } else if (event.eventType === 'CANCELLED') {
              setStatus('cancelled');
              closeWs();
              controller.abort();
              return;
            } else {
              setStatus('running');
            }
          }
        }
      } catch {
        if (controller.signal.aborted) {
          return;
        }
        if (attempt < MAX_SSE_RETRY) {
          const delayMs = RETRY_BASE_MS * (2 ** attempt);
          appendLog({
            eventType: 'SSE_RETRY',
            executionId: execId,
            message: i18n.t('execution.logSseRetry', { seconds: delayMs / 1000, attempt: attempt + 1 }),
            timestamp: new Date().toISOString(),
          });
          await sleep(delayMs);
          continue;
        }
        appendLog({
          eventType: 'SSE_FALLBACK_POLL',
          executionId: execId,
          message: i18n.t('execution.logSseFallbackPolling'),
          timestamp: new Date().toISOString(),
        });
        pollStatusFallback(execId);
        return;
      }
    }
  }, [accessToken, agentId, appendLog, closeWs, ensureWsConnected, parseSseChunk, pollStatusFallback, sleep, tenantId]);

  const startExecution = useCallback(async (payload: AgentExecuteDTO) => {
    if (!agentId) return null;
    setLogs([]);
    setResult(null);
    setStatus('running');

    const res = await executeAgent(agentId, payload);
    const submitResult = res.data as AgentExecuteResultVO;
    const execId = submitResult.executionId;
    setExecutionId(execId);
    setConversationId(submitResult.conversationId ?? null);
    if (submitResult.status === 'blocked' || submitResult.status === 'paused' || submitResult.status === 'failed') {
      setStatus(submitResult.status === 'blocked' ? 'blocked' : submitResult.status === 'paused' ? 'paused' : 'failed');
      setResult(submitResult.securityDecision ?? submitResult.budgetAdmission ?? null);
      appendLog({
        eventType: submitResult.status.toUpperCase(),
        executionId: execId,
        message: submitResult.message || submitResult.securityDecision?.message || submitResult.budgetAdmission?.message || '执行未进入队列',
        timestamp: new Date().toISOString(),
        payload: submitResult.securityDecision ?? submitResult.budgetAdmission,
      });
      return submitResult;
    }

    appendLog({
      eventType: 'QUEUED',
      executionId: execId,
      message: submitResult.message || i18n.t('execution.logQueued'),
      timestamp: new Date().toISOString(),
    });
    if (submitResult.securityDecision?.decision === 'warn') {
      appendLog({
        eventType: 'SECURITY_WARN',
        executionId: execId,
        message: submitResult.securityDecision.message || submitResult.securityDecision.userActionTip || '已命中安全告警，请关注风险提示',
        timestamp: new Date().toISOString(),
        payload: submitResult.securityDecision,
      });
    }
    void streamEvents(execId);
    return submitResult;
  }, [agentId, appendLog, streamEvents]);

  const provideInput = useCallback(async (message: string, options?: Record<string, unknown>) => {
    if (!agentId || !executionId) return;
    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'EXECUTION_INPUT',
        executionId,
        agentId,
        message,
        options,
      }));
      appendLog({
        eventType: 'USER_INPUT',
        executionId,
        message: i18n.t('execution.logInputViaWs'),
        timestamp: new Date().toISOString(),
      });
    } else {
      await submitExecutionInput(agentId, executionId, { message, options });
      appendLog({
        eventType: 'USER_INPUT',
        executionId,
        message: i18n.t('execution.logInputViaHttp'),
        timestamp: new Date().toISOString(),
      });
    }
    setStatus('running');
  }, [agentId, appendLog, executionId]);

  const cancel = useCallback(async () => {
    if (!agentId || !executionId) return;
    await cancelExecution(agentId, executionId);
    abortRef.current?.abort();
    closeWs();
    clearPolling();
    setStatus('cancelled');
  }, [agentId, executionId, clearPolling, closeWs]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    closeWs();
    clearPolling();
    setStatus('idle');
    setLogs([]);
    setResult(null);
    setExecutionId(null);
    setConversationId(null);
  }, [clearPolling, closeWs]);

  useEffect(() => () => {
    abortRef.current?.abort();
    closeWs();
    clearPolling();
  }, [clearPolling, closeWs]);

  return {
    status,
    logs,
    result,
    executionId,
    conversationId,
    startExecution,
    provideInput,
    cancel,
    reset,
  };
}

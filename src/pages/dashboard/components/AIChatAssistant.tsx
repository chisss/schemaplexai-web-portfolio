import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { UploadFile, UploadProps } from 'antd';
import {
  Alert,
  App as AntApp,
  Button,
  Grid,
  Input,
  Popover,
  Space,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import {
  ClearOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  DownOutlined,
  PaperClipOutlined,
  PictureOutlined,
  PlusOutlined,
  RobotOutlined,
  SwapOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAgentChat } from '@/hooks/useAgentChat';
import { generateImage, useAllAgents, useSystemAgent, useUploadAgentChatAttachment } from '@/api/agent';
import { useAiModels } from '@/api/system';
import { useSkills } from '@/api/skill';
import { useAppStore } from '@/store/useAppStore';
import AiModelIcon from '@/components/model/AiModelIcon';
import type { AgentChatAttachment, ExecutionMode } from '@/types/agent';
import ChatBubble from './ChatBubble';
import ExecutionStateCard from './ExecutionStateCard';
import './AIChatAssistant.css';

const { Text } = Typography;
const { TextArea } = Input;
const buttonResetStyle: React.CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'transparent',
  appearance: 'none',
  WebkitAppearance: 'none',
};

type UploadedAttachmentFile = UploadFile & {
  fileId?: string;
};

type DropdownChipOption = {
  chipLabel?: React.ReactNode;
  label: React.ReactNode;
  value: string;
};

type ModelVisualState = {
  modelId?: string;
  modelName?: string;
  provider?: string;
  providerCode?: string;
} | null;

function parseSkillDirective(rawMessage: string) {
  const content = rawMessage.trim();
  const matched = content.match(/^\/skill:([a-zA-Z0-9._-]+)\s+(.*)$/s);
  if (!matched) {
    return { skillCode: undefined, message: content };
  }
  return {
    skillCode: matched[1],
    message: matched[2].trim(),
  };
}

interface ChipProps {
  label: string;
  active?: boolean;
  icon?: React.ReactNode;
  isDark: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

function Chip({ label, active, icon, isDark, onClick, style }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...buttonResetStyle,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        minHeight: 32,
        padding: '5px 10px',
        borderRadius: 16,
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: `1px solid ${
          active
            ? isDark ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.3)'
            : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
        }`,
        background: active
          ? isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)'
          : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
        color: active
          ? '#3b82f6'
          : isDark ? '#94a3b8' : '#64748b',
        ...style,
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

interface DropdownChipProps {
  label: string;
  options: DropdownChipOption[];
  value?: string;
  isDark: boolean;
  onChange: (value: string) => void;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
}

interface ModelOptionContentProps {
  compact?: boolean;
  isDark: boolean;
  modelId?: string;
  modelName?: string;
  provider?: string;
  providerCode?: string;
}

function ModelOptionContent({
  compact,
  isDark,
  modelId,
  modelName,
  provider,
  providerCode,
}: ModelOptionContentProps) {
  const iconSlotSize = compact ? 18 : 22;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${iconSlotSize}px minmax(0, 1fr)`,
        alignItems: 'center',
        columnGap: compact ? 8 : 10,
        minWidth: 0,
        width: compact ? 'auto' : '100%',
      }}
    >
      <span
        style={{
          width: iconSlotSize,
          height: iconSlotSize,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
      >
        <AiModelIcon
          modelId={modelId}
          modelName={modelName}
          provider={provider}
          providerCode={providerCode}
          size={compact ? 16 : 18}
          type="color"
        />
      </span>
      {compact ? (
        <span
          style={{
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {modelName}
        </span>
      ) : (
        <div
          style={{
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <span
            style={{
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: isDark ? '#e2e8f0' : '#334155',
              fontWeight: 500,
            }}
          >
            {modelName}
          </span>
          <span
            style={{
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: 11,
              color: isDark ? '#64748b' : '#94a3b8',
            }}
          >
            {modelId}
          </span>
        </div>
      )}
    </div>
  );
}

function DropdownChip({ label, options, value, isDark, onChange, getPopupContainer }: DropdownChipProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover
      getPopupContainer={getPopupContainer}
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="top"
      arrow={false}
      styles={{
        root: {
          background: 'transparent',
        },
        content: {
          padding: 4,
          background: isDark ? '#1e293b' : '#ffffff',
          borderRadius: 12,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          boxShadow: isDark
            ? '0 8px 32px rgba(0,0,0,0.5)'
            : '0 8px 32px rgba(0,0,0,0.12)',
        },
      }}
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 120 }}>
          {options.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                ...buttonResetStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                width: '100%',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 13,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.15s',
                background: opt.value === value
                  ? isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)'
                  : 'transparent',
                color: opt.value === value
                  ? '#3b82f6'
                  : isDark ? '#e2e8f0' : '#334155',
                fontWeight: opt.value === value ? 600 : 400,
              }}
              onMouseEnter={(event) => {
                if (opt.value !== value) {
                  event.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                }
              }}
              onMouseLeave={(event) => {
                if (opt.value !== value) {
                  event.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      }
    >
      <button
        type="button"
        style={{
          ...buttonResetStyle,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          minHeight: 32,
          padding: '5px 10px',
          borderRadius: 16,
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
          color: isDark ? '#94a3b8' : '#64748b',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{selected?.chipLabel ?? selected?.label ?? label}</span>
        <DownOutlined style={{ fontSize: 9, opacity: 0.6 }} />
      </button>
    </Popover>
  );
}

export default function AIChatAssistant() {
  const { t, i18n } = useTranslation();
  const { message } = AntApp.useApp();
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('auto');
  const [selectedAgentId, setSelectedAgentId] = useState<string>();
  const [selectedModelId, setSelectedModelId] = useState<string>();
  const [inputValue, setInputValue] = useState('');
  const [reasoningStrength, setReasoningStrength] = useState<'low' | 'medium' | 'high'>('medium');
  const [outputFormat, setOutputFormat] = useState<'markdown' | 'plain_text' | 'structured_json'>('markdown');
  const [streamEnabled, setStreamEnabled] = useState(true);
  const [imageMode, setImageMode] = useState(false);
  const [fileList, setFileList] = useState<UploadedAttachmentFile[]>([]);
  const [showSkills, setShowSkills] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);
  const [isClosingImmersive, setIsClosingImmersive] = useState(false);
  const [isPanelHovered, setIsPanelHovered] = useState(false);
  const [placeholderHeight, setPlaceholderHeight] = useState<number>();
  const [pendingModelVisual, setPendingModelVisual] = useState<ModelVisualState>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const { data: agents = [] } = useAllAgents();
  const { data: systemAgent } = useSystemAgent();
  const { data: modelList = [] } = useAiModels();
  const { data: skillPage } = useSkills({ page: 1, size: 8, status: 'active' });
  const screens = Grid.useBreakpoint();
  const uploadMutation = useUploadAgentChatAttachment();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const collapseTimerRef = useRef<number | null>(null);
  const closeAnimationTimerRef = useRef<number | null>(null);
  const focusOpenFrameRef = useRef<number | null>(null);
  const pendingAutoCollapseRef = useRef(false);
  const wasPendingRef = useRef(false);

  const activeAgents = agents.filter((item) => item.status === 'active');
  const activeModels = modelList.filter((item) => item.status === 'active');
  const imageModels = activeModels.filter((item) => {
    const useCase = (item.useCase || '').toLowerCase();
    const modelId = (item.modelId || '').toLowerCase();
    return useCase.includes('image') || useCase.includes('生图') || modelId.includes('image');
  });
  const visibleSkills = (skillPage?.records || []).slice(0, 6);
  const resolvedAgentId = selectedAgentId ?? systemAgent?.id ?? activeAgents[0]?.id;
  const resolvedModelId = selectedModelId ?? activeModels[0]?.id;
  const resolvedAgent = useMemo(
    () => activeAgents.find((item) => item.id === resolvedAgentId),
    [activeAgents, resolvedAgentId],
  );
  const resolvedModel = useMemo(
    () => activeModels.find((item) => item.id === resolvedModelId),
    [activeModels, resolvedModelId],
  );
  const resolvedAgentModel = useMemo(() => {
    if (!resolvedAgent?.aiModel) {
      return undefined;
    }
    return activeModels.find((item) => (
      item.id === resolvedAgent.aiModel
      || item.name === resolvedAgent.aiModel
      || item.modelId === resolvedAgent.aiModel
    ));
  }, [activeModels, resolvedAgent]);
  const resolvedChatModel = selectedModelId ? resolvedModel : resolvedAgentModel;
  const preferredImageModel = imageModels.find((item) => item.modelId?.toLowerCase().includes('seedream'))
    ?? imageModels.find((item) => item.name?.toLowerCase().includes('seedream'))
    ?? imageModels.find((item) => item.useCase === 'image_generation')
    ?? imageModels[0];
  const resolvedChatModelVisual = resolvedChatModel
    ? {
        modelId: resolvedChatModel.modelId,
        modelName: resolvedChatModel.name,
        provider: resolvedChatModel.provider,
        providerCode: resolvedChatModel.providerCode,
      }
    : null;
  const currentTargetId = resolvedAgentId;

  const currentModelReasoningEfforts = useMemo(() => {
    const model = selectedModelId ? resolvedModel : resolvedAgentModel;
    if (!model?.supportedReasoningEfforts) return [];
    return model.supportedReasoningEfforts.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  }, [selectedModelId, resolvedAgentModel, resolvedModel]);
  const immersiveEnabled = Boolean(screens.lg);
  const immersiveVisible = immersiveEnabled && (isImmersive || isClosingImmersive);
  const dockedHeight = immersiveEnabled ? 'min(76vh, 820px)' : screens.md ? '520px' : '440px';
  const dockedMinHeight = immersiveEnabled ? 560 : screens.md ? 460 : 380;
  const chat = useAgentChat({
    mode: 'agent',
    targetId: currentTargetId,
    streamEnabled,
  });
  const { rollbackToTurn } = chat;
  const sendButtonModelVisual = chat.isPending
    ? pendingModelVisual ?? resolvedChatModelVisual
    : resolvedChatModelVisual;
  const handleRollback = useCallback(async (turnIndex: number) => {
    const succeeded = await rollbackToTurn(turnIndex);
    if (succeeded) {
      message.success('已回滚到所选对话轮次');
    }
  }, [message, rollbackToTurn]);

  const handleApprovalDecision = useCallback(async (
    executionId: string,
    decision: 'approve' | 'deny' | 'approve_always',
    toolCode: string,
    toolCommand: string,
    approvalId?: string,
  ) => {
    try {
      await chat.submitApproval(executionId, decision, toolCode, toolCommand, approvalId);
      message.success(decision === 'deny' ? '已拒绝' : '已批准');
    } catch {
      message.error('审批操作失败');
    }
  }, [chat, message]);

  const handleRetryFromMessage = useCallback((messageIndex: number) => {
    const previousUserMessage = [...chat.messages.slice(0, messageIndex)]
      .reverse()
      .find((item) => item.role === 'user');
    if (!previousUserMessage?.content) {
      message.warning('没有找到可重试的上一条任务');
      return;
    }
    void chat.sendMessage({
      message: previousUserMessage.content,
      attachmentIds: previousUserMessage.attachmentIds,
      attachmentImageUrls: previousUserMessage.attachmentImageUrls,
      reasoningStrength,
      outputFormat,
      executionMode,
      model: selectedModelId,
    });
  }, [chat, executionMode, message, outputFormat, reasoningStrength, selectedModelId]);

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current !== null) {
      window.clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  }, []);

  const clearCloseAnimationTimer = useCallback(() => {
    if (closeAnimationTimerRef.current !== null) {
      window.clearTimeout(closeAnimationTimerRef.current);
      closeAnimationTimerRef.current = null;
    }
  }, []);

  const clearFocusOpenFrame = useCallback(() => {
    if (focusOpenFrameRef.current !== null) {
      window.cancelAnimationFrame(focusOpenFrameRef.current);
      focusOpenFrameRef.current = null;
    }
  }, []);

  const syncPlaceholderHeight = useCallback(() => {
    const nextHeight = surfaceRef.current?.getBoundingClientRect().height;
    if (nextHeight && Number.isFinite(nextHeight)) {
      setPlaceholderHeight(Math.ceil(nextHeight));
    }
  }, []);

  const focusInputSoon = useCallback(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true });
      });
    });
  }, []);

  const closeImmersive = useCallback(() => {
    clearCollapseTimer();
    clearCloseAnimationTimer();
    setIsPanelHovered(false);
    setShowSkills(false);
    pendingAutoCollapseRef.current = false;
    if (prefersReducedMotion) {
      setIsClosingImmersive(false);
      setIsImmersive(false);
      return;
    }
    setIsClosingImmersive(true);
    setIsImmersive(false);
    closeAnimationTimerRef.current = window.setTimeout(() => {
      setIsClosingImmersive(false);
      closeAnimationTimerRef.current = null;
    }, 220);
  }, [clearCloseAnimationTimer, clearCollapseTimer, prefersReducedMotion]);

  const openImmersive = useCallback((focusInput = false) => {
    if (!immersiveEnabled) {
      return;
    }
    clearCollapseTimer();
    clearCloseAnimationTimer();
    syncPlaceholderHeight();
    setIsClosingImmersive(false);
    setIsImmersive(true);
    if (focusInput) {
      focusInputSoon();
    }
  }, [clearCloseAnimationTimer, clearCollapseTimer, focusInputSoon, immersiveEnabled, syncPlaceholderHeight]);

  const scheduleOpenImmersiveOnFocus = useCallback(() => {
    if (!immersiveEnabled || immersiveVisible) {
      return;
    }
    clearFocusOpenFrame();
    focusOpenFrameRef.current = window.requestAnimationFrame(() => {
      focusOpenFrameRef.current = null;
      openImmersive(true);
    });
  }, [clearFocusOpenFrame, immersiveEnabled, immersiveVisible, openImmersive]);

  const scheduleCollapse = useCallback((delay = 420) => {
    clearCollapseTimer();
    if (!immersiveEnabled || !isImmersive || chat.isPending || isPanelHovered || inputValue.trim()) {
      return;
    }
    collapseTimerRef.current = window.setTimeout(() => {
      collapseTimerRef.current = null;
      if (chat.isPending || isPanelHovered || inputValue.trim()) {
        return;
      }
      closeImmersive();
    }, delay);
  }, [chat.isPending, clearCollapseTimer, closeImmersive, immersiveEnabled, inputValue, isImmersive, isPanelHovered]);

  const resolvePopoverContainer = useCallback((triggerNode: HTMLElement) => {
    return surfaceRef.current ?? triggerNode.parentElement ?? document.body;
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'end' });
  }, [chat.messages, chat.isPending, immersiveVisible, prefersReducedMotion]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };
    handleChange();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    return () => {
      clearCollapseTimer();
      clearCloseAnimationTimer();
      clearFocusOpenFrame();
    };
  }, [clearCloseAnimationTimer, clearCollapseTimer, clearFocusOpenFrame]);

  useEffect(() => {
    if (immersiveEnabled) {
      return;
    }
    clearCollapseTimer();
    clearCloseAnimationTimer();
    const frameId = window.requestAnimationFrame(() => {
      setIsImmersive(false);
      setIsClosingImmersive(false);
      setIsPanelHovered(false);
    });
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [clearCloseAnimationTimer, clearCollapseTimer, immersiveEnabled]);

  useEffect(() => {
    if (!immersiveVisible) {
      return;
    }
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [immersiveVisible]);

  useEffect(() => {
    if (!inputValue.trim()) {
      return;
    }
    pendingAutoCollapseRef.current = false;
    clearCollapseTimer();
  }, [clearCollapseTimer, inputValue]);

  useEffect(() => {
    if (!imageMode) {
      return;
    }
    setInputValue((current) => {
      const zhTemplate = t('chat.imagePromptTemplate', { lng: 'zh-CN' });
      const enTemplate = t('chat.imagePromptTemplate', { lng: 'en-US' });
      if (!current.trim() || current === zhTemplate || current === enTemplate) {
        return t('chat.imagePromptTemplate');
      }
      return current;
    });
  }, [i18n.language, imageMode, t]);

  useEffect(() => {
    const wasPending = wasPendingRef.current;
    wasPendingRef.current = chat.isPending;
    if (!wasPending || chat.isPending || !pendingAutoCollapseRef.current) {
      return;
    }
    if (chat.error) {
      pendingAutoCollapseRef.current = false;
      return;
    }
    scheduleCollapse(960);
  }, [chat.error, chat.isPending, scheduleCollapse]);

  useEffect(() => {
    if (!immersiveVisible) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (chat.isPending) {
        return;
      }
      const target = event.target as Node | null;
      if (target && surfaceRef.current?.contains(target)) {
        return;
      }
      closeImmersive();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeImmersive();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [chat.isPending, closeImmersive, immersiveVisible]);

  const handleSend = async () => {
    if (imageMode) {
      await handleImageGenerate();
      return;
    }
    if (!currentTargetId) {
      message.warning(t('chat.systemAgentLoading'));
      return;
    }
    const parsed = parseSkillDirective(inputValue);
    if (!parsed.message) {
      message.warning(t('chat.emptyMessageWarning'));
      return;
    }
    setPendingModelVisual(resolvedChatModelVisual);
    if (immersiveEnabled) {
      pendingAutoCollapseRef.current = true;
      openImmersive(false);
    }
    const attachmentIds = fileList
      .map((item) => item.fileId)
      .filter((item): item is string => Boolean(item));
    const attachmentImageUrls = fileList
      .filter((item) => item.url && /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(item.name ?? ''))
      .map((item) => item.url)
      .filter((url): url is string => Boolean(url));
    try {
      await chat.sendMessage({
        message: parsed.message,
        attachmentIds,
        attachmentImageUrls,
        reasoningStrength,
        outputFormat,
        skillCode: parsed.skillCode,
        executionMode,
        model: selectedModelId ? resolvedModelId : undefined,
      });
      setInputValue('');
      setFileList([]);
    } catch {
      pendingAutoCollapseRef.current = false;
      setPendingModelVisual(null);
      // Hook 已统一处理错误
    }
  };

  const handleImageGenerate = async () => {
    const prompt = inputValue.trim();
    if (!prompt) {
      message.warning(t('chat.imagePromptRequired'));
      return;
    }
    if (!preferredImageModel) {
      message.warning(t('chat.imageModelMissing'));
      return;
    }
    try {
      if (immersiveEnabled) {
        pendingAutoCollapseRef.current = false;
        openImmersive(false);
      }
      chat.appendUserMessage(prompt);
      chat.appendAssistantPlaceholder();
      const defaultSize = typeof preferredImageModel.defaultParams?.size === 'string' ? preferredImageModel.defaultParams.size : '1536x1024';
      const defaultQuality = typeof preferredImageModel.defaultParams?.quality === 'string' ? preferredImageModel.defaultParams.quality : 'high';
      const res = await generateImage({ modelId: preferredImageModel.id, prompt, size: defaultSize, quality: defaultQuality, n: 1 });
      chat.replaceAssistantMessage(t('chat.imageGenerated', { modelName: res.data.modelName }), { imageUrls: res.data.imageUrls });
      setInputValue('');
    } catch (error) {
      chat.replaceAssistantMessage(error instanceof Error ? error.message : t('chat.imageFailed'));
    }
  };

  const handleToggleImageMode = () => {
    setImageMode((current) => {
      const next = !current;
      if (next) {
        setInputValue((value) => {
          const trimmed = value.trim();
          return trimmed ? t('chat.imagePromptTemplateWithDescription', { description: trimmed }) : t('chat.imagePromptTemplate');
        });
        window.requestAnimationFrame(() => inputRef.current?.focus());
      }
      return next;
    });
  };

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const file = options.file as File;
    const requestUid = typeof options.file === 'object' && 'uid' in options.file
      ? options.file.uid
      : String(options.file);
    try {
      const response = await uploadMutation.mutateAsync(file);
      const payload = response.data as AgentChatAttachment;
      setFileList((prev) => prev.map((item) => (
        item.uid === requestUid
          ? { ...item, status: 'done', name: payload.fileName, url: payload.fileUrl, fileId: payload.fileId }
          : item
      )));
      options.onSuccess?.(payload);
      message.success(`文件 ${payload.fileName} 上传成功`);
    } catch (error) {
      setFileList((prev) => prev.map((item) => (
        item.uid === requestUid ? { ...item, status: 'error' } : item
      )));
      options.onError?.(error as Error);
      message.error(`文件 ${file.name} 上传失败`);
    }
  };

  const handleBeforeUpload: UploadProps['beforeUpload'] = (file) => {
    setFileList((prev) => [...prev, { uid: file.uid, name: file.name, status: 'uploading' }]);
    return true;
  };

  const agentOptions = activeAgents.map((item) => ({
    value: item.id,
    label: `${item.name}${item.isSystemAgent ? ' (默认)' : item.agentType === 'team' ? ' · Team' : ''}`,
  }));
  const modelOptions = activeModels.map((item) => ({
    value: item.id,
    chipLabel: (
      <ModelOptionContent
        compact
        isDark={isDark}
        modelId={item.modelId}
        modelName={item.name}
        provider={item.provider}
        providerCode={item.providerCode}
      />
    ),
    label: (
      <ModelOptionContent
        isDark={isDark}
        modelId={item.modelId}
        modelName={item.name}
        provider={item.provider}
        providerCode={item.providerCode}
      />
    ),
  }));
  const allReasoningOptions = [
    { value: 'low', label: '快速' },
    { value: 'medium', label: '标准' },
    { value: 'high', label: '深度' },
  ];
  const reasoningOptions = currentModelReasoningEfforts.length > 0
    ? allReasoningOptions.filter((o) => currentModelReasoningEfforts.includes(o.value))
    : [];
  const formatOptions = [
    { value: 'markdown', label: 'Markdown' },
    { value: 'plain_text', label: '纯文本' },
    { value: 'structured_json', label: 'JSON' },
  ];
  const executionModeOptions = [
    {
      value: 'auto',
      chipLabel: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ThunderboltOutlined style={{ fontSize: 11 }} />
          <span>自动</span>
        </span>
      ),
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ThunderboltOutlined style={{ fontSize: 11 }} />
          <span>自动</span>
        </span>
      ),
    },
    { value: 'plan', chipLabel: '计划', label: '计划' },
    { value: 'suggest', chipLabel: '建议', label: '建议' },
  ] satisfies DropdownChipOption[];
  const sendButtonIcon = (
    <span className={chat.isPending ? 'ai-chat-send-icon ai-chat-send-icon--spinning' : 'ai-chat-send-icon'}>
      {sendButtonModelVisual ? (
        <AiModelIcon
          modelId={sendButtonModelVisual.modelId}
          modelName={sendButtonModelVisual.modelName}
          provider={sendButtonModelVisual.provider}
          providerCode={sendButtonModelVisual.providerCode}
          size={18}
          type="color"
        />
      ) : (
        <RobotOutlined style={{ fontSize: 16 }} />
      )}
    </span>
  );

  const assistantContent = (
    <div
      ref={surfaceRef}
      style={{
        height: immersiveVisible ? '100%' : dockedHeight,
        minHeight: immersiveVisible ? 0 : dockedMinHeight,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: immersiveVisible ? 28 : 24,
        overflow: 'hidden',
        border: `1px solid ${isDark ? 'rgba(148,163,184,0.14)' : 'rgba(148,163,184,0.18)'}`,
        background: isDark
          ? immersiveVisible
            ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(15,23,42,0.94))'
            : 'linear-gradient(180deg, rgba(15,23,42,0.38), rgba(15,23,42,0.22))'
          : immersiveVisible
            ? 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))'
            : 'linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.66))',
        boxShadow: immersiveVisible
          ? isDark
            ? '0 28px 80px rgba(2,6,23,0.58)'
            : '0 32px 80px rgba(15,23,42,0.18)'
          : isDark
            ? '0 18px 48px rgba(2,6,23,0.22)'
            : '0 20px 48px rgba(15,23,42,0.08)',
        backdropFilter: immersiveVisible ? 'blur(18px)' : 'blur(8px)',
      }}
      onPointerEnter={() => {
        setIsPanelHovered(true);
        clearCollapseTimer();
      }}
      onPointerLeave={() => {
        setIsPanelHovered(false);
        if (pendingAutoCollapseRef.current) {
          scheduleCollapse(260);
        }
      }}
    >
      {immersiveVisible && (
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: screens.xl ? '22px 28px 14px' : '18px 22px 12px',
            borderBottom: `1px solid ${isDark ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.16)'}`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>
              专注模式
            </Text>
            <Text style={{ fontSize: 18, fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a' }}>
              AI 协同工作台
            </Text>
          </div>
          <Space size={8}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                background: chat.isPending
                  ? isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.12)'
                  : isDark ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.16)',
                color: chat.isPending
                  ? '#3b82f6'
                  : isDark ? '#cbd5e1' : '#475569',
              }}
            >
              {chat.isPending ? '回答中' : '已就绪'}
            </div>
            <Button
              type="text"
              size="small"
              icon={<DownOutlined style={{ fontSize: 12 }} />}
              onClick={closeImmersive}
              style={{
                borderRadius: 12,
                height: 36,
                paddingInline: 14,
                color: isDark ? '#cbd5e1' : '#334155',
                background: isDark ? 'rgba(30,41,59,0.72)' : 'rgba(255,255,255,0.72)',
                border: `1px solid ${isDark ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.22)'}`,
              }}
            >
              收起
            </Button>
          </Space>
        </div>
      )}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 消息区 */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            padding: immersiveVisible
              ? screens.xl ? '28px 40px' : '24px 28px'
              : screens.md ? '24px 32px' : '16px',
          }}
        >
          {chat.messages.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 300,
            }}>
              <div style={{ textAlign: 'center', maxWidth: 480 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  background: isDark ? 'rgba(37,99,235,0.18)' : 'rgba(37,99,235,0.1)',
                }}>
                  <RobotOutlined style={{ fontSize: 26, color: '#3b82f6' }} />
                </div>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: isDark ? '#f1f5f9' : '#0f172a',
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  有什么可以帮你？
                </Text>
                <Text style={{ fontSize: 14, color: isDark ? '#64748b' : '#94a3b8' }}>
                  输入你的任务目标，AI 将为你规划并执行
                </Text>
                <div style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'center',
                  marginTop: 24,
                  flexWrap: 'wrap',
                }}>
                  {[
                    { label: '概括任务目标', prompt: '请先概括当前任务的目标、约束、风险和建议执行顺序。' },
                    { label: '生成测试步骤', prompt: '请根据现有上下文生成一组可执行的回归测试步骤和预期结果。' },
                    { label: '代码审查', prompt: '请对当前项目的核心代码进行审查，指出潜在问题和优化建议。' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.label}
                      onClick={() => setInputValue(item.prompt)}
                      style={{
                        ...buttonResetStyle,
                        padding: '8px 16px',
                        borderRadius: 12,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                        background: isDark ? 'rgba(30,41,59,0.92)' : '#FFFFFF',
                        color: isDark ? '#94a3b8' : '#475569',
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.borderColor = isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)';
                        event.currentTarget.style.color = '#3b82f6';
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
                        event.currentTarget.style.color = isDark ? '#94a3b8' : '#475569';
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            chat.messages.map((item, index) => (
              <div key={item.id}>
                <ChatBubble message={item} onRollback={handleRollback} onApprovalDecision={handleApprovalDecision} />
                {item.role === 'assistant' ? (
                  <ExecutionStateCard
                    state={item.executionState}
                    onRetry={item.executionState?.retryable ? () => handleRetryFromMessage(index) : undefined}
                  />
                ) : null}
              </div>
            ))
          )}
          <div ref={messageEndRef} />
        </div>

        {/* 底部输入面板 - 毛玻璃容器 */}
        <div
          style={{
            flexShrink: 0,
            padding: immersiveVisible
              ? screens.xl ? '14px 40px 22px' : '12px 28px 18px'
              : screens.md ? '12px 32px 16px' : '10px 16px 14px',
          }}
        >
          <div
            style={{
              borderRadius: 20,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              background: isDark
                ? 'rgba(15,23,42,0.96)'
                : 'rgba(255,255,255,0.98)',
              boxShadow: isDark
                ? '0 -2px 24px rgba(0,0,0,0.3)'
                : '0 -2px 24px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            {/* 错误提示 */}
            {chat.error && (
              <Alert
                showIcon
                type="warning"
                message={chat.error}
                style={{ margin: '8px 12px 0', borderRadius: 10 }}
              />
            )}

            {/* 已上传文件 */}
            {fileList.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 14px 0' }}>
                {fileList.map((item) => (
                  <div
                    key={item.uid}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 8,
                      fontSize: 12,
                      background: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.06)',
                      color: isDark ? '#93c5fd' : '#3b82f6',
                      border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)'}`,
                    }}
                  >
                    <PaperClipOutlined style={{ fontSize: 11 }} />
                    <span>{item.name}</span>
                    <button
                      type="button"
                      aria-label={`删除 ${String(item.name)}`}
                      onClick={() => setFileList((prev) => prev.filter((file) => file.uid !== item.uid))}
                      style={{
                        ...buttonResetStyle,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 20,
                        height: 20,
                        color: 'inherit',
                        cursor: 'pointer',
                        opacity: 0.6,
                      }}
                    >
                      <ClearOutlined style={{ fontSize: 10 }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 输入框 + 发送按钮 */}
            <div style={{ display: 'flex', alignItems: 'flex-end', padding: '14px 16px 8px' }}>
              <TextArea
                ref={(instance) => {
                  inputRef.current = instance?.resizableTextArea?.textArea ?? null;
                }}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onFocus={scheduleOpenImmersiveOnFocus}
                placeholder={imageMode ? t('chat.imageInputPlaceholder') : t('chat.taskInputPlaceholder')}
                autoSize={{ minRows: 3, maxRows: 10 }}
                variant="borderless"
                onPressEnter={(event) => {
                  if (!event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 16,
                  background: 'transparent',
                  color: isDark ? '#e2e8f0' : '#0f172a',
                  fontSize: 14,
                  lineHeight: 1.6,
                  resize: 'none',
                }}
              />
              <div style={{ flexShrink: 0, marginLeft: 8 }}>
                <Button
                  type="text"
                  size="small"
                  className="ai-chat-send-button"
                  aria-label={chat.isPending ? '停止生成' : '发送消息'}
                  icon={sendButtonIcon}
                  onClick={() => {
                    if (chat.isPending) {
                      pendingAutoCollapseRef.current = false;
                      chat.cancel();
                      return;
                    }
                    void handleSend();
                  }}
                  disabled={!chat.isPending && !inputValue.trim()}
                  style={{
                    borderRadius: 10,
                    height: 36,
                    width: 36,
                    padding: 0,
                  }}
                />
              </div>
            </div>

            {/* 内嵌选项行 - 豆包风格 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 14px 10px',
                flexWrap: 'wrap',
                borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
              }}
            >
              {/* 执行模式选择 */}
              <DropdownChip
                label="模式"
                options={executionModeOptions}
                value={executionMode}
                isDark={isDark}
                onChange={(value) => setExecutionMode(value as ExecutionMode)}
                getPopupContainer={resolvePopoverContainer}
              />

              {/* 分隔线 */}
              <div style={{ width: 1, height: 14, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', flexShrink: 0 }} />

              {/* 模型选择（始终可见） */}
              <DropdownChip
                label="模型"
                options={modelOptions}
                value={selectedModelId ?? resolvedModelId}
                isDark={isDark}
                onChange={setSelectedModelId}
                getPopupContainer={resolvePopoverContainer}
              />

              {/* Agent 选择（高级） */}
              <DropdownChip
                label="Agent"
                options={agentOptions}
                value={selectedAgentId ?? resolvedAgentId}
                isDark={isDark}
                onChange={setSelectedAgentId}
                getPopupContainer={resolvePopoverContainer}
              />

              {/* 推理强度 — 仅模型支持时显示 */}
              {reasoningOptions.length > 0 && (
                <DropdownChip
                  label="推理"
                  options={reasoningOptions}
                  value={reasoningStrength}
                  isDark={isDark}
                  onChange={(value) => setReasoningStrength(value as 'low' | 'medium' | 'high')}
                  getPopupContainer={resolvePopoverContainer}
                />
              )}

              {/* 输出格式 */}
              <DropdownChip
                label="格式"
                options={formatOptions}
                value={outputFormat}
                isDark={isDark}
                onChange={(value) => setOutputFormat(value as 'markdown' | 'plain_text' | 'structured_json')}
                getPopupContainer={resolvePopoverContainer}
              />

              {/* 流式传输 */}
              <Chip
                label="流式"
                active={streamEnabled}
                icon={<SwapOutlined style={{ fontSize: 11 }} />}
                isDark={isDark}
                onClick={() => setStreamEnabled((prev) => !prev)}
              />

              {/* 分隔线 */}
              <div style={{ width: 1, height: 14, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', flexShrink: 0 }} />

              <Chip
                label={imageMode ? t('chat.imageModeActive') : t('chat.imageModeButton')}
                active={imageMode}
                icon={<PictureOutlined style={{ fontSize: 11 }} />}
                isDark={isDark}
                onClick={handleToggleImageMode}
              />

              {/* 附件 */}
              <Upload
                fileList={fileList}
                beforeUpload={handleBeforeUpload}
                customRequest={handleUpload}
                onRemove={(file) => {
                  setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
                  return true;
                }}
                showUploadList={false}
              >
                <Tooltip title="上传附件">
                  <button
                    type="button"
                    aria-label="上传附件"
                    style={{
                      ...buttonResetStyle,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      minHeight: 32,
                      padding: '5px 8px',
                      borderRadius: 16,
                      fontSize: 12,
                      cursor: 'pointer',
                      color: isDark ? '#94a3b8' : '#64748b',
                      transition: 'color 0.2s',
                    }}
                  >
                    <CloudUploadOutlined style={{ fontSize: 13 }} />
                  </button>
                </Tooltip>
              </Upload>

              {/* 技能快捷入口 */}
              {visibleSkills.length > 0 && (
                <Popover
                  getPopupContainer={resolvePopoverContainer}
                  open={showSkills}
                  onOpenChange={setShowSkills}
                  trigger="click"
                  placement="top"
                  arrow={false}
                  styles={{
                    root: {
                      background: 'transparent',
                    },
                    content: {
                      padding: 8,
                      background: isDark ? '#1e293b' : '#ffffff',
                      borderRadius: 14,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                      boxShadow: isDark
                        ? '0 8px 32px rgba(0,0,0,0.5)'
                        : '0 8px 32px rgba(0,0,0,0.12)',
                    },
                  }}
                  content={
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 320 }}>
                      {visibleSkills.map((skill) => (
                        <Tooltip key={skill.id} title={skill.description || skill.skillPrompt}>
                          <button
                            type="button"
                            onClick={() => {
                              setInputValue(`/skill:${skill.name} `);
                              setShowSkills(false);
                              inputRef.current?.focus();
                            }}
                            style={{
                              ...buttonResetStyle,
                              padding: '5px 12px',
                              borderRadius: 10,
                              fontSize: 12,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.12)'}`,
                              background: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.04)',
                              color: isDark ? '#93c5fd' : '#3b82f6',
                            }}
                            onMouseEnter={(event) => {
                              event.currentTarget.style.background = isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)';
                            }}
                            onMouseLeave={(event) => {
                              event.currentTarget.style.background = isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.04)';
                            }}
                          >
                            <ThunderboltOutlined style={{ marginRight: 4, fontSize: 11 }} />
                            {skill.displayName || skill.name}
                          </button>
                        </Tooltip>
                      ))}
                    </div>
                  }
                >
                  <Tooltip title="技能">
                    <button
                      type="button"
                      aria-label="技能"
                      style={{
                        ...buttonResetStyle,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        minHeight: 32,
                        padding: '5px 8px',
                        borderRadius: 16,
                        fontSize: 12,
                        cursor: 'pointer',
                        color: isDark ? '#94a3b8' : '#64748b',
                        transition: 'color 0.2s',
                      }}
                    >
                      <ThunderboltOutlined style={{ fontSize: 13 }} />
                    </button>
                  </Tooltip>
                </Popover>
              )}

              {/* 右侧操作 */}
              <div style={{ flex: 1 }} />

              <Space size={2}>
                <Tooltip title="新对话">
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined style={{ fontSize: 13 }} />}
                    onClick={() => {
                      pendingAutoCollapseRef.current = false;
                      chat.resetConversation();
                    }}
                    style={{
                      borderRadius: 8,
                      color: isDark ? '#64748b' : '#94a3b8',
                      width: 28,
                      height: 28,
                    }}
                  />
                </Tooltip>
                <Tooltip title="清空">
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                    onClick={() => {
                      pendingAutoCollapseRef.current = false;
                      chat.resetConversation();
                      setFileList([]);
                      setInputValue('');
                    }}
                    style={{
                      borderRadius: 8,
                      color: isDark ? '#64748b' : '#94a3b8',
                      width: 28,
                      height: 28,
                    }}
                  />
                </Tooltip>
              </Space>
            </div>
          </div>

          {/* 会话信息 - 极简 */}
          <div style={{ textAlign: 'center', marginTop: 6 }}>
            <Text style={{ fontSize: 11, color: isDark ? '#475569' : '#94a3b8' }}>
              {chat.conversationId ? `${chat.conversationId.slice(0, 8)}...` : '新会话'}
              {chat.messages.length > 0 && ` · ${chat.messages.length} 条`}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );

  if (immersiveVisible && typeof document !== 'undefined') {
    return (
      <>
        <div
          className="ai-chat-assistant-placeholder"
          style={{ height: placeholderHeight ?? dockedHeight, minHeight: dockedMinHeight }}
          aria-hidden
        />
        {createPortal(
          <div className="ai-chat-assistant-overlay" data-state={isClosingImmersive ? 'closing' : 'open'}>
            <div className="ai-chat-assistant-overlay__backdrop" />
            <div className="ai-chat-assistant-overlay__panel">
              {assistantContent}
            </div>
          </div>,
          document.body,
        )}
      </>
    );
  }

  return assistantContent;
}

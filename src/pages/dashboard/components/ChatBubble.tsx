import { Avatar, Button, Popconfirm, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import {
  BulbOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  DownloadOutlined,
  LoadingOutlined,
  RobotOutlined,
  RollbackOutlined,
  SafetyOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import MarkdownPreview from '@/components/MarkdownPreview/MarkdownPreview';
import { useAppStore } from '@/store/useAppStore';
import type { ChatMessageItem, ToolCallProgress } from '@/hooks/useAgentChat';

const { Text } = Typography;

function ThinkingBlock({ content, isDark, isStreaming }: { content: string; isDark: boolean; isStreaming?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const lines = useMemo(() => content.split('\n').length, [content]);

  return (
    <div
      style={{
        marginBottom: 10,
        borderRadius: 10,
        border: `1px solid ${isDark ? 'rgba(168,85,247,0.2)' : 'rgba(168,85,247,0.15)'}`,
        background: isDark ? 'rgba(168,85,247,0.06)' : 'rgba(168,85,247,0.04)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '6px 12px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 500,
          color: isDark ? 'rgba(192,132,252,0.9)' : 'rgba(126,34,206,0.7)',
          appearance: 'none',
          WebkitAppearance: 'none',
        }}
      >
        <BulbOutlined style={{ fontSize: 12 }} />
        <span>思考过程{isStreaming ? '...' : ''}</span>
        <span style={{ fontSize: 11, opacity: 0.6 }}>({lines} 行)</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.5 }}>
          {collapsed ? '展开' : '收起'}
        </span>
      </button>
      {!collapsed && (
        <div
          style={{
            padding: '4px 12px 10px',
            maxHeight: 320,
            overflow: 'auto',
            fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", "Cascadia Code", Menlo, Consolas, monospace',
            fontSize: 12,
            lineHeight: 1.7,
            color: isDark ? 'rgba(203,213,225,0.75)' : 'rgba(71,85,105,0.8)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontStyle: 'italic',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

function GeneratedImages({ urls }: { urls?: string[] }) {
  if (!urls || urls.length === 0) {
    return null;
  }
  return (
    <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
      {urls.map((url, index) => (
        <div key={`${url}-${index}`} style={{ display: 'grid', gap: 6 }}>
          <img
            src={url}
            alt={`AI生成图片${index + 1}`}
            style={{ maxWidth: 'min(420px, 100%)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.24)' }}
          />
          <Button size="small" icon={<DownloadOutlined />} href={url} download={`schemaplexai-image-${index + 1}.png`} target="_blank">
            下载图片
          </Button>
        </div>
      ))}
    </div>
  );
}

interface ApprovalCardProps {
  toolCode: string;
  command: string;
  isDark: boolean;
  onApprove?: () => void;
  onApproveAlways?: () => void;
  onDeny?: () => void;
}

function ApprovalCard({ toolCode, command, isDark, onApprove, onApproveAlways, onDeny }: ApprovalCardProps) {
  return (
    <div
      style={{
        marginTop: 10,
        borderRadius: 10,
        border: `1px solid ${isDark ? 'rgba(251,191,36,0.25)' : 'rgba(251,191,36,0.2)'}`,
        background: isDark ? 'rgba(251,191,36,0.06)' : 'rgba(251,191,36,0.04)',
        padding: '10px 14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <SafetyOutlined style={{ fontSize: 13, color: '#f59e0b' }} />
        <Text style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#fbbf24' : '#d97706' }}>
          需要审批
        </Text>
      </div>
      <div style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569', marginBottom: 4 }}>
        工具: <Text code style={{ fontSize: 11 }}>{toolCode}</Text>
      </div>
      {command && (
        <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 10, wordBreak: 'break-all' }}>
          {command}
        </div>
      )}
      <Space size={6}>
        <Button
          size="small"
          type="primary"
          icon={<CheckOutlined />}
          onClick={onApprove}
          style={{ borderRadius: 6, fontSize: 12 }}
        >
          批准
        </Button>
        <Button
          size="small"
          icon={<SafetyOutlined />}
          onClick={onApproveAlways}
          style={{ borderRadius: 6, fontSize: 12 }}
        >
          始终批准
        </Button>
        <Button
          size="small"
          danger
          icon={<CloseOutlined />}
          onClick={onDeny}
          style={{ borderRadius: 6, fontSize: 12 }}
        >
          拒绝
        </Button>
      </Space>
    </div>
  );
}

interface ChatBubbleProps {
  message: ChatMessageItem;
  onRollback?: (turnIndex: number) => void;
  onApprovalDecision?: (executionId: string, decision: 'approve' | 'deny' | 'approve_always', toolCode: string, command: string, approvalId?: string) => void;
}

function ToolCallProgressCard({ tools, isDark }: { tools: ToolCallProgress[]; isDark: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  if (tools.length === 0) return null;

  return (
    <div
      style={{
        marginBottom: 10,
        borderRadius: 8,
        border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)'}`,
        background: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(239,246,255,0.7)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '6px 12px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 500,
          color: isDark ? 'rgba(96,165,250,0.9)' : 'rgba(37,99,235,0.8)',
          appearance: 'none',
          WebkitAppearance: 'none',
        }}
      >
        <ToolOutlined style={{ fontSize: 12 }} />
        <span>工具调用 ({tools.length})</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.5 }}>{collapsed ? '展开' : '收起'}</span>
      </button>
      {!collapsed && (
        <div style={{ padding: '4px 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {tools.map((tool, index) => (
            <Tag
              key={`${tool.toolCode}-${index}`}
              icon={
                tool.status === 'running'
                  ? <LoadingOutlined spin />
                  : tool.status === 'done'
                    ? <CheckCircleOutlined />
                    : <CloseCircleOutlined />
              }
              color={tool.status === 'running' ? 'processing' : tool.status === 'done' ? 'success' : 'error'}
              style={{ fontSize: 11, borderRadius: 4 }}
            >
              {tool.toolCode}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
}

function formatMessageTime(timestamp?: string) {
  if (!timestamp) {
    return '';
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatElapsedDuration(elapsedMs?: number) {
  if (elapsedMs == null || !Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return '';
  }
  if (elapsedMs < 1000) {
    return '小于 1 秒';
  }
  if (elapsedMs < 60_000) {
    const seconds = elapsedMs / 1000;
    return `${seconds >= 10 ? seconds.toFixed(0) : seconds.toFixed(1)} 秒`;
  }
  const totalSeconds = Math.round(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} 分 ${seconds} 秒`;
}

function normalizeAssistantContent(content: string) {
  const trimmed = content.trim();
  if (!trimmed || trimmed.startsWith('```')) {
    return content;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (typeof parsed === 'string') {
      const nested = parsed.trim();
      if (nested && !nested.startsWith('```')) {
        try {
          const nestedParsed = JSON.parse(nested) as unknown;
          if (typeof nestedParsed === 'string') {
            return nestedParsed;
          }
          return `\`\`\`json\n${JSON.stringify(nestedParsed, null, 2)}\n\`\`\``;
        } catch {
          return parsed;
        }
      }
      return parsed;
    }

    return `\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
  } catch {
    return content;
  }
}

export default function ChatBubble({ message, onRollback, onApprovalDecision }: ChatBubbleProps) {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const isUser = message.role === 'user';
  const assistantContent = isUser ? message.content : normalizeAssistantContent(message.content);
  const messageTime = formatMessageTime(message.timestamp);
  const elapsedLabel = !isUser && !message.isStreaming ? formatElapsedDuration(message.elapsedMs) : '';
  const bubbleBackground = isUser
    ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
    : isDark
      ? 'rgba(30,41,59,0.8)'
      : 'rgba(255,255,255,0.9)';
  const bubbleBorder = isUser
    ? 'none'
    : `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`;
  const bubbleShadow = isUser
    ? '0 4px 16px rgba(59,130,246,0.25)'
    : isDark
      ? '0 4px 16px rgba(0,0,0,0.2)'
      : '0 4px 16px rgba(0,0,0,0.05)';
  const metaColor = isUser ? 'rgba(59,130,246,0.72)' : isDark ? '#475569' : '#94a3b8';
  const showMeta = isUser ? Boolean(messageTime) : !message.isStreaming && Boolean(messageTime || elapsedLabel);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 20,
      }}
    >
      <Space
        align="start"
        size={10}
        style={{
          maxWidth: 'min(82%, 920px)',
          minWidth: 0,
          flexDirection: isUser ? 'row-reverse' : 'row',
        }}
      >
        <Avatar
          size={32}
          icon={isUser ? <UserOutlined /> : <RobotOutlined />}
          style={{
            background: isUser
              ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
              : isDark
                ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))'
                : 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.12))',
            flexShrink: 0,
            color: isUser ? '#fff' : '#3b82f6',
            fontSize: 15,
          }}
        />
        <div
          style={{
            minWidth: 0,
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isUser ? 'flex-end' : 'flex-start',
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              width: 'fit-content',
              maxWidth: '100%',
              padding: isUser ? '10px 16px' : '12px 18px',
              borderRadius: 18,
              background: bubbleBackground,
              border: bubbleBorder,
              backdropFilter: isUser ? undefined : 'blur(12px)',
              WebkitBackdropFilter: isUser ? undefined : 'blur(12px)',
              boxShadow: bubbleShadow,
              minWidth: 80,
            }}
          >
            {message.isStreaming && !message.content && !message.thinkingContent ? (
              <Space size={8}>
                <Spin size="small" />
                <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 13 }}>
                  AI 正在思考...
                </Text>
              </Space>
            ) : isUser ? (
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: '#fff',
                }}
              >
                {message.attachmentImageUrls && message.attachmentImageUrls.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {message.attachmentImageUrls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt=""
                        style={{
                          maxWidth: 180,
                          maxHeight: 180,
                          borderRadius: 6,
                          objectFit: 'cover',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      />
                    ))}
                  </div>
                )}
                {message.content}
              </div>
            ) : (
              <>
                {message.thinkingContent && (
                  <ThinkingBlock
                    content={message.thinkingContent}
                    isDark={isDark}
                    isStreaming={message.isStreaming && !message.content}
                  />
                )}
                {message.toolCallProgress && message.toolCallProgress.length > 0 && (
                  <ToolCallProgressCard tools={message.toolCallProgress} isDark={isDark} />
                )}
                {message.approvalMeta && onApprovalDecision && (
                  <ApprovalCard
                    toolCode={message.approvalMeta.toolCode}
                    command={message.approvalMeta.command}
                    isDark={isDark}
                    onApprove={() => onApprovalDecision(message.approvalMeta!.executionId, 'approve', message.approvalMeta!.toolCode, message.approvalMeta!.command, message.approvalMeta!.approvalId)}
                    onApproveAlways={() => onApprovalDecision(message.approvalMeta!.executionId, 'approve_always', message.approvalMeta!.toolCode, message.approvalMeta!.command, message.approvalMeta!.approvalId)}
                    onDeny={() => onApprovalDecision(message.approvalMeta!.executionId, 'deny', message.approvalMeta!.toolCode, message.approvalMeta!.command, message.approvalMeta!.approvalId)}
                  />
                )}
                {assistantContent ? (
                  <>
                    <MarkdownPreview className="ai-chat-message-markdown" content={assistantContent} />
                    <GeneratedImages urls={message.imageUrls} />
                  </>
                ) : message.isStreaming && message.thinkingContent ? (
                  <Space size={8}>
                    <Spin size="small" />
                    <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}>
                      正在生成回复...
                    </Text>
                  </Space>
                ) : (
                  <MarkdownPreview content=" " />
                )}
              </>
            )}
          </div>
          {showMeta && (
            <div
              style={{
                marginTop: 8,
                minHeight: 18,
                width: '100%',
                maxWidth: '100%',
                paddingInline: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: isUser ? 'flex-end' : 'space-between',
                gap: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                {messageTime && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: metaColor,
                    }}
                  >
                    {messageTime}
                  </Text>
                )}
                {elapsedLabel && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: metaColor,
                    }}
                  >
                    用时 {elapsedLabel}
                  </Text>
                )}
              </div>
              {!isUser && !message.isStreaming && message.turnIndex != null && onRollback && (
                <Popconfirm
                  title="确认回滚？"
                  description="此操作将删除该轮次之后的所有消息记录"
                  onConfirm={() => onRollback(message.turnIndex!)}
                  okText="确认"
                  cancelText="取消"
                >
                  <Tooltip title="回滚到此处">
                    <RollbackOutlined
                      style={{
                        fontSize: 12,
                        cursor: 'pointer',
                        color: metaColor,
                        opacity: 0.6,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(event) => { event.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={(event) => { event.currentTarget.style.opacity = '0.6'; }}
                    />
                  </Tooltip>
                </Popconfirm>
              )}
            </div>
          )}
        </div>
      </Space>
    </div>
  );
}

/**
 * 执行状态卡片组件
 * 支持 Queued/Running/Completed/Fallback/Failed/Paused/Blocked 状态展示
 */
import { Button, Card, Tag, Typography, Tooltip, Space } from 'antd';
import {
  ClockCircleFilled,
  SyncOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

export type ExecutionStatus = 'queued' | 'running' | 'completed' | 'completed_with_fallback' | 'failed' | 'paused' | 'blocked';

interface ExecutionStatusCardProps {
  executionId: string;
  status: ExecutionStatus;
  /** 队列位置（仅 queued 时有效） */
  queuePosition?: number;
  /** 预计等待时间（仅 queued 时有效） */
  estimatedWaitSeconds?: number;
  /** 当前轮次 */
  round?: number;
  /** 输入 token 数 */
  tokenInput?: number;
  /** 输出 token 数 */
  tokenOutput?: number;
  /** 使用的模型 */
  modelUsed?: string;
  /** 运行时间（毫秒） */
  elapsedMs?: number;
  /** 错误信息（仅 failed 时有效） */
  errorMessage?: string;
  /** 是否可重试 */
  retryable?: boolean;
  onRetry?: () => void;
  onViewDetail?: () => void;
}

export default function ExecutionStatusCard({
  status,
  queuePosition,
  estimatedWaitSeconds,
  round,
  tokenInput,
  tokenOutput,
  modelUsed,
  elapsedMs,
  errorMessage,
  retryable,
  onRetry,
  onViewDetail,
}: ExecutionStatusCardProps) {
  const { t } = useTranslation();

  const renderStatusIcon = () => {
    switch (status) {
      case 'queued':
        return <ClockCircleFilled style={{ color: '#64748b' }} />;
      case 'running':
        return <SyncOutlined spin style={{ color: '#165DFF' }} />;
      case 'completed':
        return <CheckCircleFilled style={{ color: '#059669' }} />;
      case 'completed_with_fallback':
        return <ClockCircleFilled style={{ color: '#D97706' }} />;
      case 'failed':
        return <CloseCircleFilled style={{ color: '#F53F3F' }} />;
      case 'paused':
        return <ClockCircleFilled style={{ color: '#FF7D00' }} />;
      case 'blocked':
        return <CloseCircleFilled style={{ color: '#F53F3F' }} />;
    }
  };

  const renderStatusTag = () => {
    const statusMap = {
      queued: { color: 'default', text: t('execution.statusQueued') },
      running: { color: 'processing', text: t('execution.statusRunning') },
      completed: { color: 'success', text: t('execution.statusCompleted') },
      completed_with_fallback: { color: 'warning', text: '兜底完成' },
      failed: { color: 'error', text: t('execution.statusFailed') },
      paused: { color: 'warning', text: '已暂停' },
      blocked: { color: 'error', text: '已阻断' },
    };
    const config = statusMap[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const formatDuration = (ms?: number) => {
    if (ms == null) return '-';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatWaitTime = (seconds?: number) => {
    if (seconds == null) return '-';
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes} ${t('common.minutes')}`;
    return `${seconds} ${t('common.seconds')}`;
  };

  return (
    <Card size="small" style={{ borderRadius: 8 }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {/* 状态行 */}
        <Space>
          {renderStatusIcon()}
          {renderStatusTag()}
        </Space>

        {/* Queued 状态展示队列信息 */}
        {status === 'queued' && (
          <Space direction="vertical" size={4}>
            <Text type="secondary">
              {t('execution.queuePosition')}: <Text strong>{queuePosition ?? '-'}</Text>
            </Text>
            <Text type="secondary">
              {t('execution.estimatedWait')}: <Text strong>{formatWaitTime(estimatedWaitSeconds)}</Text>
            </Text>
          </Space>
        )}

        {/* Running 状态展示运行信息 */}
        {status === 'running' && (
          <Space direction="vertical" size={4}>
            <Text type="secondary">
              {t('execution.round')}: <Text strong>{round ?? 0}</Text>
            </Text>
            <Space>
              <Text type="secondary">
                {t('execution.token')}:
              </Text>
              <Text strong>
                {tokenInput ?? 0} → {tokenOutput ?? 0}
              </Text>
            </Space>
            {modelUsed && (
              <Text type="secondary">
                {t('execution.model')}: <Text code>{modelUsed}</Text>
              </Text>
            )}
            <Text type="secondary">
              {t('execution.elapsed')}: <Text strong>{formatDuration(elapsedMs)}</Text>
            </Text>
          </Space>
        )}

        {/* Completed 状态展示结果摘要 */}
        {(status === 'completed' || status === 'completed_with_fallback') && (
          <Space direction="vertical" size={4}>
            {status === 'completed_with_fallback' && (
              <Text type="warning">规则化兜底结果，需人工复核后交付</Text>
            )}
            <Text type="secondary">
              {t('execution.totalRounds')}: <Text strong>{round ?? 0}</Text>
            </Text>
            <Text type="secondary">
              {t('execution.totalTokens')}: <Text strong>{(tokenInput ?? 0) + (tokenOutput ?? 0)}</Text>
            </Text>
            <Text type="secondary">
              {t('execution.duration')}: <Text strong>{formatDuration(elapsedMs)}</Text>
            </Text>
          </Space>
        )}

        {/* Failed 状态展示错误信息 */}
        {(status === 'failed' || status === 'blocked' || status === 'paused') && errorMessage && (
          <Tooltip title={errorMessage}>
            <Text type={status === 'paused' ? 'warning' : 'danger'} ellipsis>
              {errorMessage}
            </Text>
          </Tooltip>
        )}

        {/* 操作按钮 */}
        {(retryable || onViewDetail) && (
          <Space>
            {retryable && (
              <Button type="link" size="small" onClick={onRetry} style={{ paddingInline: 0 }}>
                {t('common.retry')}
              </Button>
            )}
            {onViewDetail && (
              <Button type="link" size="small" onClick={onViewDetail} style={{ paddingInline: 0 }}>
                {t('common.viewDetail')}
              </Button>
            )}
          </Space>
        )}
      </Space>
    </Card>
  );
}

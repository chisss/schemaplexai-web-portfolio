import { Button, Card, Space, Tag, Typography, message } from 'antd';
import {
  AuditOutlined,
  BranchesOutlined,
  CopyOutlined,
  LinkOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { AgentExecutionStateSnapshot } from '@/types/agent';

const { Text } = Typography;

interface ExecutionStateCardProps {
  state?: AgentExecutionStateSnapshot;
  onRetry?: () => void;
}

const STATE_COLOR: Record<string, string> = {
  QUEUED: 'blue',
  RUNNING: 'processing',
  TOOL_RUNNING: 'processing',
  APPROVAL_REQUIRED: 'gold',
  PAUSED: 'orange',
  BLOCKED_BY_BUDGET: 'red',
  BLOCKED_BY_SECURITY: 'red',
  FAILED_RETRYABLE: 'volcano',
  FAILED_FINAL: 'red',
  FALLBACK_USED: 'purple',
  COMPLETED: 'green',
  CANCELLED: 'default',
};

function resolveTargetUrl(state: AgentExecutionStateSnapshot) {
  if (state.targetUrl) return state.targetUrl;
  if (state.state === 'BLOCKED_BY_BUDGET') return '/cost';
  if (state.state === 'BLOCKED_BY_SECURITY') return '/security-compliance/risk';
  if (state.state === 'APPROVAL_REQUIRED' || state.state === 'PAUSED') return '/approval-center?view=pending';
  if (state.traceId) return `/monitor/traces?traceId=${encodeURIComponent(state.traceId)}`;
  return undefined;
}

export default function ExecutionStateCard({ state, onRetry }: ExecutionStateCardProps) {
  const navigate = useNavigate();
  if (!state) return null;

  const targetUrl = resolveTargetUrl(state);
  const diagnosis = JSON.stringify(state, null, 2);

  return (
    <Card size="small" style={{ marginTop: 8, borderRadius: 8 }}>
      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
        <Space wrap>
          <Tag color={STATE_COLOR[state.state] || 'default'}>{state.state}</Tag>
          {state.eventType ? <Tag>{state.eventType}</Tag> : null}
          {state.retryable ? <Tag color="blue">可重试</Tag> : null}
        </Space>
        <Text>{state.message || '执行状态已更新'}</Text>
        {state.traceId ? <Text type="secondary">Trace: {state.traceId}</Text> : null}
        {state.evidence?.length ? (
          <Space direction="vertical" size={2}>
            {state.evidence.map((item) => <Text key={item} type="secondary">证据: {item}</Text>)}
          </Space>
        ) : null}
        <Space wrap size={8}>
          {state.retryable && onRetry ? (
            <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>重试本步</Button>
          ) : null}
          <Button size="small" icon={<AuditOutlined />} onClick={() => navigate('/approval-center?view=pending')}>转人工审批</Button>
          {state.traceId ? (
            <Button size="small" icon={<BranchesOutlined />} onClick={() => navigate(`/monitor/traces?traceId=${encodeURIComponent(state.traceId || '')}`)}>查看 trace</Button>
          ) : null}
          {targetUrl ? (
            <Button size="small" icon={state.state.includes('SECURITY') ? <SafetyCertificateOutlined /> : <LinkOutlined />} onClick={() => navigate(targetUrl)}>
              治理详情
            </Button>
          ) : null}
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              void navigator.clipboard?.writeText(diagnosis);
              message.success('诊断信息已复制');
            }}
          >
            复制诊断
          </Button>
        </Space>
      </Space>
    </Card>
  );
}

import { Typography } from 'antd';
import {
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import type { ContextSummary } from '@/types/homepage';

const { Text } = Typography;

interface Props {
  summary?: ContextSummary;
}

export default function ContextSummaryCard({ summary }: Props) {
  const isDark = useAppStore((s) => s.theme === 'dark');

  if (!summary) return null;

  const hasIssues =
    summary.pendingApprovalCount > 0 ||
    summary.blockedWorkflowCount > 0 ||
    summary.securityEventCount > 0 ||
    summary.qualityDeviationCount > 0;

  const stats = [
    { label: '待审批', value: summary.pendingApprovalCount, icon: <ClockCircleOutlined />, color: '#f59e0b' },
    { label: '阻塞', value: summary.blockedWorkflowCount, icon: <ExclamationCircleOutlined />, color: '#ef4444' },
    { label: '运行中', value: summary.runningWorkflowCount, icon: <CheckCircleOutlined />, color: '#22c55e' },
    { label: '安全事件', value: summary.securityEventCount, icon: <AlertOutlined />, color: '#ef4444' },
    { label: '质量偏差', value: summary.qualityDeviationCount, icon: <AlertOutlined />, color: '#f59e0b' },
  ].filter((s) => s.value > 0);

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 14,
        background: isDark
          ? 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
        border: `1px solid ${isDark ? 'rgba(51,65,85,0.5)' : 'rgba(226,232,240,0.8)'}`,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          lineHeight: '22px',
          color: isDark ? '#e2e8f0' : '#1e293b',
          display: 'block',
          marginBottom: stats.length ? 12 : 0,
        }}
      >
        {summary.summaryText || (hasIssues ? '有事项需要关注' : '一切运行正常')}
      </Text>

      {stats.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 8,
                background: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(241,245,249,0.8)',
                fontSize: 12,
              }}
            >
              <span style={{ color: s.color, fontSize: 13 }}>{s.icon}</span>
              <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 12 }}>
                {s.label}
              </Text>
              <Text strong style={{ color: isDark ? '#f8fafc' : '#0f172a', fontSize: 13 }}>
                {s.value}
              </Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

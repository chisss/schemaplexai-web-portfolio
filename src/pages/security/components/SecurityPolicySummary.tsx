import { Button, Empty, Progress, Space, Tag, Typography } from 'antd';
import type { SecurityOverview } from '@/types/securityCompliance';

const { Text } = Typography;

interface SecurityPolicySummaryProps {
  overview?: SecurityOverview;
  onConfigureRuntime?: () => void;
}

export default function SecurityPolicySummary({ overview, onConfigureRuntime }: SecurityPolicySummaryProps) {
  const domainStats = overview?.domainStats ?? [];
  const totalPolicies = overview?.totalPolicies ?? 0;
  const activePolicies = overview?.activePolicies ?? 0;
  const coverage = totalPolicies > 0 ? Math.round((activePolicies / totalPolicies) * 100) : 0;

  if (!overview || totalPolicies === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="运行时防护尚未启用，前往策略配置启用。"
      >
        <Button size="small" type="primary" onClick={onConfigureRuntime}>启用策略</Button>
      </Empty>
    );
  }

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <div>
        <Text type="secondary">策略覆盖</Text>
        <Progress percent={coverage} size="small" />
      </div>
      <Space wrap>
        <Tag color="green">启用 {activePolicies}</Tag>
        <Tag color="blue">草稿 {overview.draftPolicies}</Tag>
        <Tag color={overview.criticalPolicies > 0 ? 'red' : 'default'}>高危 {overview.criticalPolicies}</Tag>
      </Space>
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        {domainStats.map((item) => (
          <div key={item.domainCode} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <Text>{item.domainCode}</Text>
            <Text type="secondary">{item.activePolicies}/{item.totalPolicies} · 24h 拦截 {item.blockedEvents24h}</Text>
          </div>
        ))}
      </Space>
    </Space>
  );
}

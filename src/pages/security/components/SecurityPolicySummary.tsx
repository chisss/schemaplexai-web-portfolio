import { Button, Empty, Progress, Space, Tag, Typography } from 'antd';
import type { SecurityOverview } from '@/types/securityCompliance';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const { Text } = Typography;

const DOMAIN_KEYS: Record<string, string> = {
  runtime: 'security.tab.runtime',
  data: 'security.tab.data',
  risk: 'security.tab.risk',
  industry: 'security.tab.industry',
};

function domainLabel(value: string | undefined, t: TFunction) {
  if (!value) {
    return '-';
  }
  return DOMAIN_KEYS[value] ? t(DOMAIN_KEYS[value]) : value;
}

interface SecurityPolicySummaryProps {
  overview?: SecurityOverview;
  onConfigureRuntime?: () => void;
}

export default function SecurityPolicySummary({ overview, onConfigureRuntime }: SecurityPolicySummaryProps) {
  const { t } = useTranslation();
  const domainStats = overview?.domainStats ?? [];
  const totalPolicies = overview?.totalPolicies ?? 0;
  const activePolicies = overview?.activePolicies ?? 0;
  const coverage = totalPolicies > 0 ? Math.round((activePolicies / totalPolicies) * 100) : 0;

  if (!overview || totalPolicies === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('security.summary.empty')}
      >
        <Button size="small" type="primary" onClick={onConfigureRuntime}>{t('security.summary.enablePolicy')}</Button>
      </Empty>
    );
  }

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <div>
        <Text type="secondary">{t('security.summary.coverage')}</Text>
        <Progress percent={coverage} size="small" />
      </div>
      <Space wrap>
        <Tag color="green">{t('security.summary.activeCount', { count: activePolicies })}</Tag>
        <Tag color="blue">{t('security.summary.draftCount', { count: overview.draftPolicies })}</Tag>
        <Tag color={overview.criticalPolicies > 0 ? 'red' : 'default'}>{t('security.summary.criticalCount', { count: overview.criticalPolicies })}</Tag>
      </Space>
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        {domainStats.map((item) => (
          <div key={item.domainCode} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <Text>{domainLabel(item.domainCode, t)}</Text>
            <Text type="secondary">{item.activePolicies}/{item.totalPolicies} · {t('security.summary.blocked24h', { count: item.blockedEvents24h })}</Text>
          </div>
        ))}
      </Space>
    </Space>
  );
}

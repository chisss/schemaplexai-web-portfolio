import { Empty, Space, Typography } from 'antd';
import type { QualityIssueFinding } from '@/types/quality';
import SeverityBadge from './SeverityBadge';
import { useTranslation } from 'react-i18next';

const { Paragraph, Text } = Typography;

interface FindingsListProps {
  findings?: QualityIssueFinding[];
}

export default function FindingsList({ findings }: FindingsListProps) {
  const { t } = useTranslation();
  if (!findings?.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('quality.finding.empty')} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {findings.map((finding, index) => (
        <div
          key={`${finding.title || 'finding'}-${finding.ruleCode || 'rule'}-${index}`}
          style={{
            padding: '12px 0',
            borderBottom: index === findings.length - 1 ? 'none' : '1px solid var(--color-border-secondary)',
          }}
        >
          <Space orientation="vertical" size={8} style={{ width: '100%' }}>
            <Space wrap>
              <SeverityBadge severity={finding.severity} />
              <Text type="secondary">{finding.type || '-'}</Text>
              {finding.ruleCode ? <Text type="secondary">{t('quality.finding.rule', { code: finding.ruleCode })}</Text> : null}
              {finding.confidence != null ? <Text type="secondary">{t('quality.finding.confidence', { value: Math.round(finding.confidence * 100) })}</Text> : null}
            </Space>
            <Text strong>{finding.title}</Text>
            <Paragraph style={{ marginBottom: 0 }}>{finding.description || '-'}</Paragraph>
            {finding.location ? <Text type="secondary">{t('quality.finding.location', { location: finding.location })}</Text> : null}
            {finding.suggestion ? <Text type="secondary">{t('quality.finding.suggestion', { suggestion: finding.suggestion })}</Text> : null}
          </Space>
        </div>
      ))}
    </div>
  );
}

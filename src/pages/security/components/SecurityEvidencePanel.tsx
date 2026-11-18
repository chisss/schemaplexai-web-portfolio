import { Empty, List, Space, Tag, Typography } from 'antd';
import type { SecurityAuditEvent } from '@/types/securityCompliance';
import { formatDateTime } from '@/utils/date';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const { Text } = Typography;

const AUDIT_STATUS_KEYS: Record<string, string> = {
  success: 'security.auditStatus.success',
  warning: 'security.auditStatus.warning',
  blocked: 'security.auditStatus.blocked',
  failed: 'security.auditStatus.failed',
};

function eventStatusLabel(value: string | undefined, t: TFunction) {
  if (!value) {
    return '-';
  }
  return AUDIT_STATUS_KEYS[value] ? t(AUDIT_STATUS_KEYS[value]) : value;
}

interface SecurityEvidencePanelProps {
  events: SecurityAuditEvent[];
}

export default function SecurityEvidencePanel({ events }: SecurityEvidencePanelProps) {
  const { t } = useTranslation();
  return (
    <List
      size="small"
      dataSource={events}
      locale={{
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('security.evidence.empty')} />,
      }}
      renderItem={(item) => (
        <List.Item>
          <Space orientation="vertical" size={4} style={{ width: '100%' }}>
            <Space wrap size={6}>
              <Text strong>{item.eventTitle}</Text>
              <Tag color={item.eventStatus === 'blocked' ? 'red' : item.eventStatus === 'warning' ? 'gold' : 'blue'}>{eventStatusLabel(item.eventStatus, t)}</Tag>
              {item.traceId ? <Tag>{item.traceId}</Tag> : null}
            </Space>
            <Text type="secondary">
              {item.policyCode || item.resourceType || t('security.evidence.defaultName')} · {formatDateTime(item.occurredAt)}
            </Text>
          </Space>
        </List.Item>
      )}
    />
  );
}

import { Button, Empty, List, Space, Tag, Typography } from 'antd';
import { AlertOutlined } from '@ant-design/icons';
import type { SecurityIncident } from '@/types/securityCompliance';
import { formatDateTime } from '@/utils/date';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const { Text } = Typography;

const RISK_LEVEL_KEYS: Record<string, string> = {
  low: 'security.riskLevel.low',
  medium: 'security.riskLevel.medium',
  high: 'security.riskLevel.high',
  critical: 'security.riskLevel.critical',
};

const INCIDENT_STATUS_KEYS: Record<string, string> = {
  new: 'security.incidentStatus.new',
  assigned: 'security.incidentStatus.assigned',
  investigating: 'security.incidentStatus.investigating',
  resolved: 'security.incidentStatus.resolved',
  ignored: 'security.incidentStatus.ignored',
  escalated: 'security.incidentStatus.escalated',
};

function labelOf(keyMap: Record<string, string>, value: string | undefined, t: TFunction) {
  if (!value) {
    return '-';
  }
  return keyMap[value] ? t(keyMap[value]) : value;
}

interface SecurityRiskQueueProps {
  incidents: SecurityIncident[];
  onOpen: (incident: SecurityIncident) => void;
  onRunSimulation?: () => void;
}

export default function SecurityRiskQueue({ incidents, onOpen, onRunSimulation }: SecurityRiskQueueProps) {
  const { t } = useTranslation();
  return (
    <List
      size="small"
      dataSource={incidents}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('security.queue.empty')}
          >
            <Button size="small" icon={<AlertOutlined />} onClick={onRunSimulation}>{t('security.queue.runSimulation')}</Button>
          </Empty>
        ),
      }}
      renderItem={(item) => (
        <List.Item
          actions={[<Button key="open" type="link" size="small" onClick={() => onOpen(item)}>{t('security.queue.handle')}</Button>]}
        >
          <List.Item.Meta
            title={(
              <Space wrap size={6}>
                <Text strong>{item.eventTitle}</Text>
                <Tag color={item.riskLevel === 'critical' || item.riskLevel === 'high' ? 'red' : 'gold'}>{labelOf(RISK_LEVEL_KEYS, item.riskLevel, t)}</Tag>
                <Tag>{labelOf(INCIDENT_STATUS_KEYS, item.status, t)}</Tag>
              </Space>
            )}
            description={`${item.sourceName || item.sourceId || t('security.queue.unknownResource')} · ${formatDateTime(item.createdAt)}`}
          />
        </List.Item>
      )}
    />
  );
}

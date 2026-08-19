import { Empty, List, Space, Tag, Typography } from 'antd';
import type { SecurityAuditEvent } from '@/types/securityCompliance';
import { formatDateTime } from '@/utils/date';

const { Text } = Typography;

interface SecurityEvidencePanelProps {
  events: SecurityAuditEvent[];
}

export default function SecurityEvidencePanel({ events }: SecurityEvidencePanelProps) {
  return (
    <List
      size="small"
      dataSource={events}
      locale={{
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无审计证据，启用策略后将自动沉淀执行记录。" />,
      }}
      renderItem={(item) => (
        <List.Item>
          <Space orientation="vertical" size={4} style={{ width: '100%' }}>
            <Space wrap size={6}>
              <Text strong>{item.eventTitle}</Text>
              <Tag color={item.eventStatus === 'blocked' ? 'red' : item.eventStatus === 'warning' ? 'gold' : 'blue'}>{item.eventStatus}</Tag>
              {item.traceId ? <Tag>{item.traceId}</Tag> : null}
            </Space>
            <Text type="secondary">
              {item.policyCode || item.resourceType || '安全审计'} · {formatDateTime(item.occurredAt)}
            </Text>
          </Space>
        </List.Item>
      )}
    />
  );
}

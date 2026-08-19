import { Button, Empty, List, Space, Tag, Typography } from 'antd';
import { AlertOutlined } from '@ant-design/icons';
import type { SecurityIncident } from '@/types/securityCompliance';
import { formatDateTime } from '@/utils/date';

const { Text } = Typography;

interface SecurityRiskQueueProps {
  incidents: SecurityIncident[];
  onOpen: (incident: SecurityIncident) => void;
  onRunSimulation?: () => void;
}

export default function SecurityRiskQueue({ incidents, onOpen, onRunSimulation }: SecurityRiskQueueProps) {
  return (
    <List
      size="small"
      dataSource={incidents}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="当前没有未结风险，可以运行一次策略模拟检查。"
          >
            <Button size="small" icon={<AlertOutlined />} onClick={onRunSimulation}>运行策略模拟</Button>
          </Empty>
        ),
      }}
      renderItem={(item) => (
        <List.Item
          actions={[<Button key="open" type="link" size="small" onClick={() => onOpen(item)}>处置</Button>]}
        >
          <List.Item.Meta
            title={(
              <Space wrap size={6}>
                <Text strong>{item.eventTitle}</Text>
                <Tag color={item.riskLevel === 'critical' || item.riskLevel === 'high' ? 'red' : 'gold'}>{item.riskLevel}</Tag>
                <Tag>{item.status}</Tag>
              </Space>
            )}
            description={`${item.sourceName || item.sourceId || '未知资源'} · ${formatDateTime(item.createdAt)}`}
          />
        </List.Item>
      )}
    />
  );
}

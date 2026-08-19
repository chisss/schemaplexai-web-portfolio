/**
 * 系统状态卡片组件
 */
import { Card, Progress, Row, Col, Typography } from 'antd';
import { DashboardOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface SystemStatusCardProps {
  systemHealth?: {
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
  };
  isDark: boolean;
}

export default function SystemStatusCard({ systemHealth, isDark }: SystemStatusCardProps) {
  const { t } = useTranslation();

  const statusItems = [
    { label: t('dashboard.cpuUsage'), value: systemHealth?.cpuUsage ?? 0, color: '#165DFF' },
    { label: t('dashboard.memoryUsage'), value: systemHealth?.memoryUsage ?? 0, color: '#F53F3F' },
    { label: t('dashboard.storageUsage'), value: systemHealth?.diskUsage ?? 0, color: '#165DFF' },
  ];

  return (
    <Card
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DashboardOutlined style={{ color: '#165DFF' }} />
          <span style={{ fontWeight: 600 }}>{t('dashboard.systemStatus')}</span>
        </span>
      }
      style={{
        border: isDark ? '1px solid #313233' : '1px solid #e5e7eb',
        borderRadius: 12,
        height: '100%',
      }}
      styles={{ body: { padding: '16px 20px' } }}
    >
      <Row gutter={[0, 16]}>
        {statusItems.map((item, index) => (
          <Col span={24} key={index}>
            <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: isDark ? '#86909C' : '#4E5969', fontWeight: 500 }}>
                {item.label}
              </Text>
              <Text style={{ fontSize: 13, color: isDark ? '#F2F3F5' : '#1D2129' }}>
                {item.value}%
              </Text>
            </div>
            <Progress
              percent={item.value}
              strokeColor={item.color}
              showInfo={false}
              trailColor={isDark ? '#3D3E40' : '#e5e7eb'}
              size="small"
            />
          </Col>
        ))}
      </Row>
    </Card>
  );
}

import { List, Tag, Typography } from 'antd';
import { AlertOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import type { RiskAlert } from '@/types/homepage';

const { Text } = Typography;

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: 'red',
  HIGH: 'volcano',
  MEDIUM: 'orange',
  LOW: 'blue',
};

interface Props {
  alerts: RiskAlert[];
}

export default function RiskAlertList({ alerts }: Props) {
  const navigate = useNavigate();
  const isDark = useAppStore((s) => s.theme === 'dark');

  if (!alerts.length) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <AlertOutlined style={{ fontSize: 13, color: 'var(--color-danger, #ef4444)' }} />
        <Text style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>
          风险告警 ({alerts.length})
        </Text>
      </div>
      <List
        size="small"
        dataSource={alerts}
        split={false}
        renderItem={(alert) => (
          <List.Item
            key={alert.id}
            onClick={() => navigate(alert.targetUrl)}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              cursor: 'pointer',
              marginBottom: 4,
              background: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(248,250,252,0.8)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text ellipsis style={{ fontSize: 12, fontWeight: 500, color: isDark ? '#e2e8f0' : '#1e293b', flex: 1 }}>
                  {alert.title}
                </Text>
                <Tag color={SEVERITY_COLOR[alert.severity] ?? 'default'} style={{ fontSize: 10, margin: 0 }}>
                  {alert.severity}
                </Tag>
              </div>
              {alert.description && (
                <Text ellipsis style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8' }}>
                  {alert.description}
                </Text>
              )}
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}

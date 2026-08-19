import { Badge, List, Tag, Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import type { TaskItem } from '@/types/homepage';

const { Text } = Typography;

interface Props {
  items: TaskItem[];
  isLoading?: boolean;
}

export default function BlockedList({ items, isLoading }: Props) {
  const navigate = useNavigate();
  const isDark = useAppStore((s) => s.theme === 'dark');
  const isHighBlocked = items.length >= 3;

  if (!items.length && !isLoading) return null;

  return (
    <div
      style={{
        borderRadius: 10,
        border: isHighBlocked
          ? `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)'}`
          : undefined,
        padding: isHighBlocked ? 10 : 0,
        background: isHighBlocked
          ? isDark ? 'rgba(239,68,68,0.06)' : 'rgba(254,242,242,0.6)'
          : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <ExclamationCircleOutlined style={{ color: 'var(--color-danger, #ef4444)', fontSize: 13 }} />
        <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-danger, #ef4444)' }}>
          阻塞与风险
        </Text>
        <Badge count={items.length} size="small" />
      </div>
      <List
        size="small"
        loading={isLoading}
        dataSource={items}
        split={false}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            onClick={() => navigate(item.targetUrl)}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              cursor: 'pointer',
              marginBottom: 4,
              background: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(248,250,252,0.8)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Text ellipsis style={{ fontSize: 13, fontWeight: 500, color: isDark ? '#e2e8f0' : '#1e293b', flex: 1 }}>
                  {item.title}
                </Text>
                <Tag color="error" style={{ fontSize: 11, margin: 0 }}>
                  {item.severity ?? 'HIGH'}
                </Tag>
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {item.impactScope || item.ownerRole || '影响范围待确认'}
                {item.evidenceCount ? ` · 证据 ${item.evidenceCount}` : ''}
              </Text>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}

import { List, Tag, Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import type { TaskItem } from '@/types/homepage';

const { Text } = Typography;

interface Props {
  items: TaskItem[];
  isLoading?: boolean;
}

export default function InProgressList({ items, isLoading }: Props) {
  const navigate = useNavigate();
  const isDark = useAppStore((s) => s.theme === 'dark');

  if (!items.length && !isLoading) return null;

  return (
    <div>
      <Text style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 8, display: 'block' }}>
        我负责的运行 ({items.length})
      </Text>
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
              transition: 'background 0.15s',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text ellipsis style={{ fontSize: 13, fontWeight: 500, color: isDark ? '#e2e8f0' : '#1e293b', flex: 1 }}>
                  {item.title}
                </Text>
                <Tag color="processing" style={{ fontSize: 11, margin: 0, lineHeight: '18px' }}>
                  {item.status}
                </Tag>
              </div>
              {item.updatedAt && (
                <Text style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8' }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {item.ownerRole || '负责人'} · {new Date(item.updatedAt).toLocaleString()}
                  {item.slaDueAt ? ` · SLA ${new Date(item.slaDueAt).toLocaleString()}` : ''}
                </Text>
              )}
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}

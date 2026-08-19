import { List, Typography } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import type { TaskItem } from '@/types/homepage';

const { Text } = Typography;

interface Props {
  items: TaskItem[];
}

export default function RecentContextList({ items }: Props) {
  const isDark = useAppStore((s) => s.theme === 'dark');

  if (!items.length) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <HistoryOutlined style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }} />
        <Text style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>
          最近上下文
        </Text>
      </div>
      <List
        size="small"
        dataSource={items.slice(0, 5)}
        split={false}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              marginBottom: 2,
            }}
          >
            <Text ellipsis style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>
              {item.title}
            </Text>
          </List.Item>
        )}
      />
    </div>
  );
}

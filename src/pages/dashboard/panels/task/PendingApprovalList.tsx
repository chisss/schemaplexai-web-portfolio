import { List, Tag, Typography } from 'antd';
import { AuditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import type { TaskItem } from '@/types/homepage';

const { Text } = Typography;

interface Props {
  items: TaskItem[];
  isLoading?: boolean;
}

export default function PendingApprovalList({ items, isLoading }: Props) {
  const navigate = useNavigate();
  const isDark = useAppStore((s) => s.theme === 'dark');

  if (!items.length && !isLoading) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <AuditOutlined style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }} />
        <Text style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>
          待我处理 ({items.length})
        </Text>
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
                <Tag color="warning" style={{ fontSize: 11, margin: 0 }}>
                  待处理
                </Tag>
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {item.ownerRole || '审批人'}{item.slaDueAt ? ` · SLA ${new Date(item.slaDueAt).toLocaleString()}` : ''}
                {item.evidenceCount ? ` · 证据 ${item.evidenceCount}` : ''}
              </Text>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}

import { List, Typography } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import type { BlockChain } from '@/types/homepage';

const { Text } = Typography;

interface Props {
  chains: BlockChain[];
}

export default function BlockChainView({ chains }: Props) {
  const navigate = useNavigate();
  const isDark = useAppStore((s) => s.theme === 'dark');

  if (!chains.length) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <LinkOutlined style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }} />
        <Text style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>
          阻塞链路 ({chains.length})
        </Text>
      </div>
      <List
        size="small"
        dataSource={chains}
        split={false}
        renderItem={(chain) => (
          <List.Item
            key={chain.id}
            onClick={() => navigate(chain.targetUrl)}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              cursor: 'pointer',
              marginBottom: 4,
              background: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(248,250,252,0.8)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
              <Text ellipsis style={{ fontSize: 12, fontWeight: 500, color: isDark ? '#e2e8f0' : '#1e293b' }}>
                {chain.blockerTitle}
              </Text>
              <Text style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8' }}>
                阻塞 → {chain.blockedResource}
              </Text>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}

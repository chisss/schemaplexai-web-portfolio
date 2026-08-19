import { Tag, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';

const { Text } = Typography;

export default function IdentityBadge() {
  const userInfo = useAuthStore((s) => s.userInfo);
  const isDark = useAppStore((s) => s.theme === 'dark');

  const roleName = userInfo?.roles?.[0] ?? '用户';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <UserOutlined style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b' }} />
      <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
        {userInfo?.nickname ?? userInfo?.username ?? '未登录'}
      </Text>
      <Tag
        style={{
          fontSize: 11,
          lineHeight: '18px',
          padding: '0 6px',
          borderRadius: 4,
          margin: 0,
        }}
      >
        {roleName}
      </Tag>
    </div>
  );
}

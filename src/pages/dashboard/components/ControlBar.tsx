import { Badge, Input } from 'antd';
import { BellOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import ModeSwitch from './ModeSwitch';
import IdentityBadge from './IdentityBadge';

export default function ControlBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isDark = useAppStore((s) => s.theme === 'dark');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '10px 0',
        flexWrap: 'wrap',
      }}
    >
      <ModeSwitch />

      <div style={{ flex: 1 }} />

      <IdentityBadge />

      <Input
        prefix={<SearchOutlined style={{ color: isDark ? '#64748b' : '#94a3b8' }} />}
        placeholder={t('controlTower.globalSearch')}
        size="small"
        style={{
          width: 200,
          borderRadius: 8,
          background: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(241,245,249,0.8)',
        }}
        variant="borderless"
        onPressEnter={(e) => {
          const val = (e.target as HTMLInputElement).value.trim();
          if (val) navigate(`/search?q=${encodeURIComponent(val)}`);
        }}
      />

      <Badge count={0} size="small" offset={[-4, 4]}>
        <button
          type="button"
          aria-label={t('controlTower.notifications')}
          onClick={() => navigate('/notification')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: isDark ? '#94a3b8' : '#64748b',
            fontSize: 16,
          }}
        >
          <BellOutlined />
        </button>
      </Badge>
    </div>
  );
}

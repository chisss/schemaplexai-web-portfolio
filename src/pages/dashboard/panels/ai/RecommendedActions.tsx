import { Button, Typography } from 'antd';
import {
  AlertOutlined,
  ArrowRightOutlined,
  AuditOutlined,
  PlayCircleOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import type { RecommendedAction } from '@/types/homepage';

const { Text } = Typography;

const ACTION_ICON: Record<string, React.ReactNode> = {
  CONTINUE: <PlayCircleOutlined />,
  UNBLOCK: <ToolOutlined />,
  APPROVE: <AuditOutlined />,
  INVESTIGATE: <AlertOutlined />,
};

const ACTION_COLOR: Record<string, string> = {
  CONTINUE: '#3b82f6',
  UNBLOCK: '#ef4444',
  APPROVE: '#f59e0b',
  INVESTIGATE: '#ef4444',
};

interface Props {
  actions: RecommendedAction[];
}

export default function RecommendedActions({ actions }: Props) {
  const navigate = useNavigate();
  const isDark = useAppStore((s) => s.theme === 'dark');

  if (!actions.length) return null;

  return (
    <div>
      <Text style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 10, display: 'block' }}>
        推荐动作
      </Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {actions.map((action) => {
          const color = ACTION_COLOR[action.actionType] ?? '#3b82f6';
          return (
            <Button
              key={action.actionId}
              type="text"
              onClick={() => navigate(action.targetUrl)}
              style={{
                height: 'auto',
                padding: '10px 14px',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
                background: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(248,250,252,0.8)',
                border: `1px solid ${isDark ? 'rgba(51,65,85,0.4)' : 'rgba(226,232,240,0.6)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <span style={{ color, fontSize: 16 }}>
                  {ACTION_ICON[action.actionType]}
                </span>
                <Text style={{ fontSize: 13, fontWeight: 500, color: isDark ? '#e2e8f0' : '#1e293b' }}>
                  {action.title}
                </Text>
              </div>
              <ArrowRightOutlined style={{ fontSize: 12, color: isDark ? '#64748b' : '#94a3b8' }} />
            </Button>
          );
        })}
      </div>
    </div>
  );
}

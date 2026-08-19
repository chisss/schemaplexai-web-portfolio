import { Button, Card, Typography } from 'antd';
import {
  BranchesOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

const { Text } = Typography;

export default function QuickActionsPanel() {
  const navigate = useNavigate();
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  const secondaryButtonStyle = {
    borderRadius: 16,
    height: 48,
    justifyContent: 'flex-start' as const,
    background: isDark ? 'rgba(15,23,42,0.58)' : 'rgba(248,250,252,0.9)',
    borderColor: isDark ? 'rgba(71,85,105,0.34)' : 'rgba(148,163,184,0.18)',
    color: isDark ? '#e2e8f0' : '#0f172a',
  };

  return (
    <Card
      variant="borderless"
      style={{
        borderRadius: 24,
        background: isDark
          ? 'linear-gradient(180deg, rgba(30,41,59,0.94) 0%, rgba(15,23,42,0.96) 100%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(245,247,250,0.98) 100%)',
        boxShadow: isDark ? '0 20px 40px rgba(2,6,23,0.24)' : '0 18px 38px rgba(15,23,42,0.08)',
      }}
      styles={{ body: { padding: 20 } }}
    >
      <div style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>快捷入口</Text>
        <div style={{ fontSize: 20, fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>常用操作</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button
          type="primary"
          icon={<RobotOutlined />}
          block
          size="large"
          style={{ borderRadius: 16, height: 50 }}
          onClick={() => navigate('/agent/create')}
        >
          创建 Agent
        </Button>
        <Button
          icon={<FileTextOutlined />}
          block
          size="large"
          style={secondaryButtonStyle}
          onClick={() => navigate('/spec/create')}
        >
          新建 Spec
        </Button>
        <Button
          icon={<BranchesOutlined />}
          block
          size="large"
          style={secondaryButtonStyle}
          onClick={() => navigate('/workflow/create')}
        >
          发起工作流
        </Button>
        <Button
          icon={<PlusCircleOutlined />}
          block
          size="large"
          style={secondaryButtonStyle}
          onClick={() => navigate('/approval-center?view=pending')}
        >
          处理待审批
        </Button>
      </div>
    </Card>
  );
}

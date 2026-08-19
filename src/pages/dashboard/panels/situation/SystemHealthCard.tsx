import { Progress, Tag, Typography } from 'antd';
import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import type { SituationPanel } from '@/types/homepage';

const { Text } = Typography;

interface Props {
  health?: SituationPanel['systemHealth'];
}

export default function SystemHealthCard({ health }: Props) {
  const isDark = useAppStore((s) => s.theme === 'dark');

  if (!health) return null;

  const isHealthy = health.status === 'healthy';

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
        background: isDark ? 'rgba(30,41,59,0.7)' : 'rgba(248,250,252,0.9)',
        border: `1px solid ${isDark ? 'rgba(51,65,85,0.4)' : 'rgba(226,232,240,0.6)'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>
          系统健康
        </Text>
        <Tag
          color={isHealthy ? 'success' : 'warning'}
          icon={isHealthy ? <CheckCircleOutlined /> : <WarningOutlined />}
          style={{ fontSize: 11, margin: 0 }}
        >
          {health.status}
        </Tag>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>CPU</Text>
            <Text style={{ fontSize: 11, color: isDark ? '#cbd5e1' : '#475569' }}>{Math.round(health.cpuUsage)}%</Text>
          </div>
          <Progress percent={Math.round(health.cpuUsage)} size="small" showInfo={false} />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>内存</Text>
            <Text style={{ fontSize: 11, color: isDark ? '#cbd5e1' : '#475569' }}>{Math.round(health.memoryUsage)}%</Text>
          </div>
          <Progress percent={Math.round(health.memoryUsage)} size="small" showInfo={false} />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>存储</Text>
            <Text style={{ fontSize: 11, color: isDark ? '#cbd5e1' : '#475569' }}>{Math.round(health.diskUsage)}%</Text>
          </div>
          <Progress percent={Math.round(health.diskUsage)} size="small" showInfo={false} />
        </div>
      </div>
    </div>
  );
}

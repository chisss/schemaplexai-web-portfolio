import { Button, Typography } from 'antd';
import {
  ApartmentOutlined,
  BarChartOutlined,
  FileTextOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import type { QuickEntry } from '@/types/homepage';

const { Text } = Typography;

const ICON_MAP: Record<string, React.ReactNode> = {
  RobotOutlined: <RobotOutlined />,
  ApartmentOutlined: <ApartmentOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  BarChartOutlined: <BarChartOutlined />,
};

interface Props {
  entries: QuickEntry[];
}

export default function QuickEntryGrid({ entries }: Props) {
  const navigate = useNavigate();
  const isDark = useAppStore((s) => s.theme === 'dark');

  if (!entries.length) return null;

  return (
    <div>
      <Text style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 8, display: 'block' }}>
        快速入口
      </Text>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {entries.map((entry) => (
          <Button
            key={entry.id}
            type="text"
            icon={ICON_MAP[entry.icon]}
            onClick={() => navigate(entry.targetUrl)}
            style={{
              height: 'auto',
              padding: '10px 12px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 8,
              fontSize: 12,
              fontWeight: 500,
              background: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(248,250,252,0.8)',
              color: isDark ? '#cbd5e1' : '#475569',
            }}
          >
            {entry.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

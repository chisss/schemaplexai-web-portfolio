import { Card, Col, Progress, Row, Statistic, Typography } from 'antd';
import {
  FireOutlined,
  LineChartOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useDashboard, useActiveAgents, useSystemHealth } from '@/api/monitor';
import { useAppStore } from '@/store/useAppStore';

const { Text } = Typography;

const accentMap = ['#165DFF', '#0f766e', '#ea580c', '#7c3aed'];

export default function QuickStatsPanel() {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const { data: dashboard } = useDashboard();
  const { data: activeAgents = [] } = useActiveAgents();
  const { data: systemHealth } = useSystemHealth();

  const stats = [
    { title: '运行中 Agent', value: dashboard?.activeAgentCount ?? activeAgents.length, suffix: '个', icon: <FireOutlined /> },
    { title: '待审批事项', value: dashboard?.pendingApprovalCount ?? 0, suffix: '项', icon: <SafetyCertificateOutlined /> },
    { title: '今日 Token', value: dashboard?.todayTokenConsumption ?? 0, suffix: '', icon: <LineChartOutlined /> },
    { title: '成功率', value: dashboard?.taskSuccessRate ?? 0, suffix: '%', icon: <RiseOutlined /> },
  ];

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
      <div style={{ marginBottom: 18 }}>
        <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>快捷统计</Text>
        <div style={{ fontSize: 20, fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
          平台运行概览
        </div>
      </div>
      <Row gutter={[12, 12]}>
        {stats.map((item, index) => (
          <Col span={12} key={item.title}>
            <div
              style={{
                borderRadius: 18,
                padding: 14,
                minHeight: 116,
                background: isDark ? 'rgba(15,23,42,0.7)' : 'rgba(248,250,252,0.88)',
                border: `1px solid ${isDark ? 'rgba(71,85,105,0.34)' : 'rgba(148,163,184,0.12)'}`,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${accentMap[index]}16`,
                  color: accentMap[index],
                  marginBottom: 14,
                }}
              >
                {item.icon}
              </div>
              <Statistic
                title={<span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{item.title}</span>}
                value={item.value}
                suffix={item.suffix}
                styles={{
                  content: {
                    fontSize: 24,
                    color: isDark ? '#f8fafc' : '#0f172a',
                  },
                }}
              />
            </div>
          </Col>
        ))}
      </Row>
      <div
        style={{
          marginTop: 16,
          borderRadius: 18,
          padding: 14,
          background: isDark ? 'rgba(15,23,42,0.7)' : 'rgba(248,250,252,0.88)',
        }}
      >
        <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
          <Text style={{ color: isDark ? '#cbd5e1' : '#334155' }}>系统资源健康</Text>
          <Text style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{systemHealth?.status || 'normal'}</Text>
        </div>
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">CPU</Text>
          <Progress percent={systemHealth?.cpuUsage ?? 0} showInfo={false} strokeColor="#165DFF" />
        </div>
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">内存</Text>
          <Progress percent={systemHealth?.memoryUsage ?? 0} showInfo={false} strokeColor="#0f766e" />
        </div>
        <div>
          <Text type="secondary">磁盘</Text>
          <Progress percent={systemHealth?.diskUsage ?? 0} showInfo={false} strokeColor="#ea580c" />
        </div>
      </div>
    </Card>
  );
}

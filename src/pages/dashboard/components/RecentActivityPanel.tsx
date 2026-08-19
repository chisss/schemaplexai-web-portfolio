import { Card, List, Space, Tag, Typography } from 'antd';
import { BgColorsOutlined, DeploymentUnitOutlined, SyncOutlined } from '@ant-design/icons';
import { useActiveAgents } from '@/api/monitor';
import { useMyPendingReviews } from '@/api/review';
import EmptyState from '@/components/EmptyState/EmptyState';
import { useAppStore } from '@/store/useAppStore';

const { Text } = Typography;

function formatActivityTime(value?: string) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function RecentActivityPanel() {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const { data: activeAgents = [], isLoading: activeLoading } = useActiveAgents();
  const { data: pendingReviews = [], isLoading: reviewLoading } = useMyPendingReviews();

  const activities = [
    ...activeAgents.slice(0, 3).map((item, index) => ({
      key: `agent-${item.agentId}-${item.startTime ?? 'unknown'}-${index}`,
      title: item.agentName,
      subtitle: item.currentTaskId ? `任务 ${item.currentTaskId}` : '运行中的 Agent',
      tag: 'Agent 执行',
      time: item.startTime,
      icon: <DeploymentUnitOutlined style={{ color: '#165DFF' }} />,
    })),
    ...pendingReviews.slice(0, 2).map((item, index) => ({
      key: `review-${item.id}-${item.createdAt ?? 'unknown'}-${index}`,
      title: item.specName || item.documentType || item.id,
      subtitle: item.workflowNodeLabel || '等待审批处理',
      tag: '审批流转',
      time: item.createdAt,
      icon: <BgColorsOutlined style={{ color: '#0f766e' }} />,
    })),
  ].slice(0, 5);

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
      <div style={{ marginBottom: 14 }}>
        <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>最近活动</Text>
        <div style={{ fontSize: 20, fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>系统动态</div>
      </div>
      {activities.length === 0 && !activeLoading && !reviewLoading ? (
        <EmptyState compact icon={<SyncOutlined />} title="暂无最新活动" />
      ) : (
        <List
          loading={activeLoading || reviewLoading}
          dataSource={activities}
          split={false}
          renderItem={(item) => (
            <List.Item
              key={item.key}
              style={{
                padding: '12px 0',
                borderBottom: `1px solid ${isDark ? 'rgba(71,85,105,0.24)' : 'rgba(148,163,184,0.12)'}`,
              }}
            >
              <List.Item.Meta
                avatar={item.icon}
                title={(
                  <Space size={8}>
                    <span style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>{item.title}</span>
                    <Tag color="blue">{item.tag}</Tag>
                  </Space>
                )}
                description={(
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Text type="secondary">{item.subtitle}</Text>
                    <Text type="secondary">{formatActivityTime(item.time)}</Text>
                  </div>
                )}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}

import { Button, Card, List, Space, Tag, Typography } from 'antd';
import { ArrowRightOutlined, ClockCircleOutlined, FileSearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMyPendingReviews } from '@/api/review';
import { useApprovalCenterItems } from '@/api/approvalCenter';
import EmptyState from '@/components/EmptyState/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import type { ReviewSession } from '@/types/workflow';

const { Text } = Typography;

function formatTaskTime(value?: string) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function MyTodoPanel() {
  const navigate = useNavigate();
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const { data: pendingReviews = [], isLoading } = useMyPendingReviews();
  const { data: pendingApprovals } = useApprovalCenterItems({ view: 'pending', page: 1, size: 5 });

  const reviewItems = pendingReviews.slice(0, 4);
  const qualityCount = pendingApprovals?.records.filter((item) => item.approvalType === 'quality_issue').length ?? 0;
  const workflowCount = pendingApprovals?.records.filter((item) => item.approvalType === 'workflow_review').length ?? 0;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>我的待办</Text>
          <div style={{ fontSize: 20, fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>审批与质量提醒</div>
        </div>
        <Button type="link" onClick={() => navigate('/approval-center?view=pending')}>
          查看全部 <ArrowRightOutlined />
        </Button>
      </div>

      <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
        <Tag color="processing">待评审 {pendingReviews.length}</Tag>
        <Tag color="warning">工作流审批 {workflowCount}</Tag>
        <Tag color="error">质量阻断 {qualityCount}</Tag>
      </Space>

      {reviewItems.length === 0 && !isLoading ? (
        <EmptyState
          compact
          icon={<FileSearchOutlined />}
          title="当前没有待处理事项"
          actions={[{ label: '去审批中心', onClick: () => navigate('/approval-center?view=pending') }]}
        />
      ) : (
        <List
          loading={isLoading}
          dataSource={reviewItems}
          split={false}
          renderItem={(item: ReviewSession) => (
            <List.Item
              key={item.id}
              style={{
                borderRadius: 18,
                padding: '12px 14px',
                background: isDark
                  ? 'linear-gradient(180deg, rgba(15,23,42,0.78) 0%, rgba(30,41,59,0.78) 100%)'
                  : 'linear-gradient(180deg, rgba(248,250,252,0.96) 0%, rgba(241,245,249,0.96) 100%)',
                border: `1px solid ${isDark ? 'rgba(71,85,105,0.32)' : 'rgba(148,163,184,0.14)'}`,
                marginBottom: 10,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/approval-center?view=pending')}
            >
              <List.Item.Meta
                avatar={<ClockCircleOutlined style={{ color: '#165DFF', fontSize: 18, marginTop: 4 }} />}
                title={<span style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>{item.specName || item.documentType || item.id}</span>}
                description={(
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Text type="secondary">{item.workflowNodeLabel || '待处理审批'}</Text>
                    <Text type="secondary">{formatTaskTime(item.createdAt)}</Text>
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

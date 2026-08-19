/**
 * 待办事项卡片组件
 * 包含待审批和待阅读的任务
 */
import { Card, List, Tag, Typography, Button, Space, Empty, Spin, Badge } from 'antd';
import {
  ClockCircleOutlined,
  FileTextOutlined,
  RobotOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMyPendingReviews } from '@/api/review';
import type { ReviewSession } from '@/types/workflow';
import { isExternalActionUrl, normalizeActionUrl } from '@/utils/actionUrl';

const { Text } = Typography;

const normalizeTaskType = (documentType: string): 'spec' | 'agent' | 'workflow' => {
  const v = documentType?.toLowerCase() || '';
  if (v.includes('agent')) return 'agent';
  if (v.includes('workflow')) return 'workflow';
  return 'spec';
};

const formatDateTime = (value: string) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const getOwnerDisplayName = (item: ReviewSession, fallback: string) =>
  item.ownerName || item.owner || fallback;

export default function PendingTasksCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: pendingList, isLoading } = useMyPendingReviews();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'spec':
        return <FileTextOutlined style={{ color: '#165DFF' }} />;
      case 'agent':
        return <RobotOutlined style={{ color: '#22c55e' }} />;
      case 'workflow':
        return <CheckCircleOutlined style={{ color: '#FF7D00' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#4E5969' }} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'spec':
        return 'purple';
      case 'agent':
        return 'green';
      case 'workflow':
        return 'orange';
      default:
        return 'default';
    }
  };

  const getReviewTitle = (item: ReviewSession) => {
    switch (item.documentType) {
      case 'requirements':
        return '需求分析';
      case 'design':
        return '方案设计';
      case 'tasks':
        return '任务拆分';
      default:
        return item.documentType || item.specId || item.id;
    }
  };

  const getReviewPath = (item: ReviewSession) => {
    if (item.reviewActionUrl) {
      return normalizeActionUrl(item.reviewActionUrl);
    }
    if (!item.specId) {
      return '/spec';
    }
    const query = new URLSearchParams();
    if (item.workflowInstanceId) {
      query.set('instanceId', item.workflowInstanceId);
    }
    if (item.workflowNodeId) {
      query.set('nodeId', item.workflowNodeId);
    }
    query.set('mode', 'review');
    return `/spec/${item.specId}/edit?${query.toString()}`;
  };

  const openReview = (item: ReviewSession) => {
    const reviewPath = getReviewPath(item);
    if (isExternalActionUrl(reviewPath)) {
      window.location.assign(reviewPath);
      return;
    }
    navigate(reviewPath);
  };

  return (
    <Card
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClockCircleOutlined style={{ color: '#FF7D00' }} />
          <span style={{ fontWeight: 600 }}>{t('dashboard.pendingTasks')}</span>
          {pendingList && pendingList.length > 0 && (
            <Badge count={pendingList.length} style={{ backgroundColor: '#FF7D00' }} />
          )}
        </span>
      }
      extra={
        <Button type="link" size="small" onClick={() => navigate('/approval-center?view=pending')}>
          {t('common.viewAll')} <ArrowRightOutlined />
        </Button>
      }
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        height: '100%',
      }}
      styles={{ body: { padding: 0, maxHeight: 400, overflow: 'auto' } }}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : pendingList && pendingList.length > 0 ? (
        <List
          size="small"
          dataSource={pendingList.slice(0, 8)}
          renderItem={(item: ReviewSession) => {
            const taskType = normalizeTaskType(item.documentType);
            return (
              <List.Item
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--color-border)',
                }}
                onClick={() => openReview(item)}
              >
                <List.Item.Meta
                  avatar={(
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: 'rgba(22, 93, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getTypeIcon(taskType)}
                    </div>
                  )}
                  title={(
                    <Space size={8}>
                      <Text ellipsis style={{ maxWidth: 200 }}>
                        {item.specName || getReviewTitle(item)}
                      </Text>
                      <Tag color={getTypeColor(taskType)} style={{ marginRight: 0 }}>
                        {getReviewTitle(item)}
                      </Tag>
                    </Space>
                  )}
                  description={(
                    <Space size={4}>
                      <ExclamationCircleOutlined style={{ color: '#86909C' }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.workflowNodeLabel || '待审核'} · {getOwnerDisplayName(item, t('dashboard.unknownRequester'))} · {formatDateTime(item.createdAt)}
                      </Text>
                    </Space>
                  )}
                />
              </List.Item>
            );
          }}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: '#86909C' }}>
              {t('dashboard.noPendingTasks')}
            </span>
          }
          style={{ padding: '40px 0' }}
        />
      )}
    </Card>
  );
}

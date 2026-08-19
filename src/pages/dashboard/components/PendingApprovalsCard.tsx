/**
 * 待审批卡片组件
 */
import { Card, List, Tag, Typography, Button, Space, Empty, Spin } from 'antd';
import { ClockCircleOutlined, FileTextOutlined, RobotOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMyPendingReviews } from '@/api/review';
import type { ReviewSession } from '@/types/workflow';
import { isExternalActionUrl, normalizeActionUrl } from '@/utils/actionUrl';

const { Text } = Typography;

const formatDateTime = (value: string) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const getOwnerDisplayName = (item: ReviewSession, fallback: string) =>
  item.ownerName || item.owner || fallback;

export default function PendingApprovalsCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: pendingList, isLoading } = useMyPendingReviews();

  const normalizeTaskType = (documentType: string): 'spec' | 'agent' | 'workflow' => {
    const value = documentType?.toLowerCase() || '';
    if (value.includes('agent')) return 'agent';
    if (value.includes('workflow')) return 'workflow';
    return 'spec';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'spec':
        return <FileTextOutlined style={{ color: '#1677ff' }} />;
      case 'agent':
        return <RobotOutlined style={{ color: '#52c41a' }} />;
      case 'workflow':
        return <ClockCircleOutlined style={{ color: '#fa8c16' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'spec':
        return 'blue';
      case 'agent':
        return 'green';
      case 'workflow':
        return 'orange';
      default:
        return 'orange';
    }
  };

  const getDocumentLabel = (documentType: string) => {
    switch (documentType) {
      case 'requirements':
        return t('spec.requirements');
      case 'design':
        return t('spec.design');
      case 'tasks':
        return t('spec.tasks');
      default:
        return documentType || t('menu.spec');
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
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClockCircleOutlined style={{ color: 'var(--color-warning)' }} />
          {t('dashboard.pendingApprovals')}
          {pendingList && pendingList.length > 0 && (
            <Tag color="orange" style={{ marginLeft: 8 }}>{pendingList.length}</Tag>
          )}
        </div>
      }
      extra={
        <Button type="link" size="small" onClick={() => navigate('/approval-center?view=pending')}>
          {t('common.viewAll')} <ArrowRightOutlined />
        </Button>
      }
      style={{ border: `1px solid var(--color-border)` }}
      styles={{ body: { padding: 0 } }}
    >
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Spin />
        </div>
      ) : pendingList && pendingList.length > 0 ? (
        <List
          size="small"
          dataSource={pendingList.slice(0, 5)}
          renderItem={(item: ReviewSession) => {
            const type = normalizeTaskType(item.documentType);
            return (
              <List.Item
                style={{ padding: '12px 16px', cursor: 'pointer' }}
                onClick={() => openReview(item)}
              >
                <List.Item.Meta
                  avatar={getTypeIcon(type)}
                  title={(
                    <Space>
                      <Text ellipsis style={{ maxWidth: 200 }}>{item.specName || getDocumentLabel(item.documentType)}</Text>
                      <Tag color={getTypeColor(type)}>{getDocumentLabel(item.documentType)}</Tag>
                    </Space>
                  )}
                  description={(
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.workflowNodeLabel || t('approvalCenter.status.pending')} · {getOwnerDisplayName(item, t('dashboard.unknownRequester'))} · {formatDateTime(item.createdAt)}
                    </Text>
                  )}
                />
              </List.Item>
            );
          }}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('dashboard.noPendingApprovals')}
          style={{ padding: '32px 0' }}
        />
      )}
    </Card>
  );
}

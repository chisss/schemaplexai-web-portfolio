import { useMemo, useState } from 'react';
import { Card, Col, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useQualityIssueStatistics, useQualityIssues } from '@/api/quality';
import type { QualityIssue, QualityIssueQueryDTO } from '@/types/quality';
import QualityIssueHandleDrawer from './components/QualityIssueHandleDrawer';
import SeverityBadge from './components/SeverityBadge';
import GateDecisionTag from './components/GateDecisionTag';
import QualityActionColumn from './components/QualityActionColumn';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface QualityOverviewProps {
  embedded?: boolean;
}

const ISSUE_TYPE_COLOR_MAP: Record<string, string> = {
  deviation: 'orange',
  intent_defect: 'blue',
  both: 'purple',
};

export default function QualityOverview({ embedded = false }: QualityOverviewProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState<QualityIssueQueryDTO>({ page: 1, size: 10 });
  const [selectedIssue, setSelectedIssue] = useState<QualityIssue | null>(null);

  const issuesQuery = useQualityIssues(query);
  const stats = useQualityIssueStatistics();
  const blockedCount = (stats.data?.open ?? 0) + (stats.data?.acknowledged ?? 0);

  const statsCards = useMemo(() => ([
    { title: t('quality.issue.statusOpen'), value: stats.data?.open ?? 0, color: '#cf1322', icon: <ExclamationCircleOutlined /> },
    { title: t('quality.issue.statusAcknowledged'), value: stats.data?.acknowledged ?? 0, color: '#fa8c16', icon: <ClockCircleOutlined /> },
    { title: t('quality.issue.statusResolved'), value: stats.data?.resolved ?? 0, color: '#52c41a', icon: <CheckCircleOutlined /> },
    { title: t('quality.overview.blocking'), value: blockedCount, color: '#f5222d', icon: <StopOutlined /> },
  ]), [blockedCount, stats.data?.acknowledged, stats.data?.open, stats.data?.resolved, t]);

  const columns = [
    {
      title: t('quality.overview.columnTitle'),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (value: string, record: QualityIssue) => (
        <Space orientation="vertical" size={2}>
          <Text strong>{value}</Text>
          <Text type="secondary">{record.specId || '-'}</Text>
        </Space>
      ),
    },
    {
      title: t('quality.overview.columnType'),
      dataIndex: 'issueType',
      key: 'issueType',
      width: 120,
      render: (value: string) => <Tag color={ISSUE_TYPE_COLOR_MAP[value] || 'default'}>{value === 'deviation' ? t('quality.issue.typeDeviation') : value === 'intent_defect' ? t('quality.issue.typeIntentDefect') : value || '-'}</Tag>,
    },
    {
      title: t('quality.overview.columnSeverity'),
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (value: string) => <SeverityBadge severity={value} />,
    },
    {
      title: t('quality.overview.columnGateDecision'),
      dataIndex: 'gateDecision',
      key: 'gateDecision',
      width: 110,
      render: (value: string) => <GateDecisionTag decision={value} />,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value: string) => <Tag>{value === 'open' ? t('quality.issue.statusOpen') : value === 'acknowledged' ? t('quality.issue.statusAcknowledged') : value === 'resolving' ? t('quality.issue.statusResolving') : value === 'resolved' ? t('quality.issue.statusResolved') : value === 'ignored' ? t('quality.issue.statusIgnored') : value || '-'}</Tag>,
    },
    {
      title: t('common.createTime'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => value || '-',
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 120,
      render: (_: unknown, record: QualityIssue) => (
        <QualityActionColumn record={record} onHandle={setSelectedIssue} />
      ),
    },
  ];

  const content = (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        {statsCards.map((item) => (
          <Col key={item.title} xs={12} md={6}>
            <Card size="small">
              <Statistic
                title={item.title}
                value={item.value}
                prefix={item.icon}
                styles={{ content: { color: item.color } }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card size="small" title={t('quality.overview.title')}>
        <Space wrap style={{ marginBottom: 12 }}>
          <Select
            allowClear
            placeholder={t('quality.filter.status')}
            style={{ width: 140 }}
            value={query.status}
            onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, status: value }))}
            options={[
              { label: t('quality.issue.statusOpen'), value: 'open' },
              { label: t('quality.issue.statusAcknowledged'), value: 'acknowledged' },
              { label: t('quality.issue.statusResolved'), value: 'resolved' },
              { label: t('quality.issue.statusIgnored'), value: 'ignored' },
            ]}
          />
          <Select
            allowClear
            placeholder={t('quality.filter.severity')}
            style={{ width: 140 }}
            value={query.severity}
            onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, severity: value }))}
            options={[
              { label: t('quality.severity.critical'), value: 'critical' },
              { label: t('quality.severity.warning'), value: 'warning' },
              { label: t('quality.severity.info'), value: 'info' },
            ]}
          />
          <Select
            allowClear
            placeholder={t('quality.filter.issueType')}
            style={{ width: 160 }}
            value={query.issueType}
            onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, issueType: value }))}
            options={[
              { label: t('quality.issue.typeDeviation'), value: 'deviation' },
              { label: t('quality.issue.typeIntentDefect'), value: 'intent_defect' },
            ]}
          />
        </Space>

        <Table
          rowKey="id"
          loading={issuesQuery.isLoading}
          columns={columns}
          dataSource={issuesQuery.data?.records || []}
          scroll={{ x: 1100 }}
          pagination={{
            current: query.page || 1,
            pageSize: query.size || 10,
            total: issuesQuery.data?.total || 0,
            onChange: (page, size) => setQuery((prev) => ({ ...prev, page, size })),
            showSizeChanger: true,
            showTotal: (total) => t('common.total', { total }),
          }}
        />
      </Card>

      <QualityIssueHandleDrawer
        open={!!selectedIssue}
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onSuccess={() => {
          setSelectedIssue(null);
          void issuesQuery.refetch();
          void stats.refetch();
        }}
      />
    </Space>
  );

  if (embedded) {
    return content;
  }

  return <div>{content}</div>;
}

import { useMemo, useState } from 'react';
import { Card, Col, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useQualityIssueStatistics, useQualityIssues } from '@/api/quality';
import type { QualityIssue, QualityIssueQueryDTO } from '@/types/quality';
import QualityIssueHandleDrawer from './components/QualityIssueHandleDrawer';
import SeverityBadge from './components/SeverityBadge';
import GateDecisionTag from './components/GateDecisionTag';
import QualityActionColumn from './components/QualityActionColumn';

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
  const [query, setQuery] = useState<QualityIssueQueryDTO>({ page: 1, size: 10 });
  const [selectedIssue, setSelectedIssue] = useState<QualityIssue | null>(null);

  const issuesQuery = useQualityIssues(query);
  const stats = useQualityIssueStatistics();
  const blockedCount = (stats.data?.open ?? 0) + (stats.data?.acknowledged ?? 0);

  const statsCards = useMemo(() => ([
    { title: '待处理', value: stats.data?.open ?? 0, color: '#cf1322', icon: <ExclamationCircleOutlined /> },
    { title: '已确认', value: stats.data?.acknowledged ?? 0, color: '#fa8c16', icon: <ClockCircleOutlined /> },
    { title: '已解决', value: stats.data?.resolved ?? 0, color: '#52c41a', icon: <CheckCircleOutlined /> },
    { title: '阻断中', value: blockedCount, color: '#f5222d', icon: <StopOutlined /> },
  ]), [blockedCount, stats.data?.acknowledged, stats.data?.open, stats.data?.resolved]);

  const columns = [
    {
      title: '标题',
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
      title: '类型',
      dataIndex: 'issueType',
      key: 'issueType',
      width: 120,
      render: (value: string) => <Tag color={ISSUE_TYPE_COLOR_MAP[value] || 'default'}>{value || '-'}</Tag>,
    },
    {
      title: '严重度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (value: string) => <SeverityBadge severity={value} />,
    },
    {
      title: '闸门决策',
      dataIndex: 'gateDecision',
      key: 'gateDecision',
      width: 110,
      render: (value: string) => <GateDecisionTag decision={value} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value: string) => <Tag>{value || '-'}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => value || '-',
    },
    {
      title: '操作',
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

      <Card size="small" title="质量总览">
        <Space wrap style={{ marginBottom: 12 }}>
          <Select
            allowClear
            placeholder="状态"
            style={{ width: 140 }}
            value={query.status}
            onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, status: value }))}
            options={[
              { label: '待处理', value: 'open' },
              { label: '已确认', value: 'acknowledged' },
              { label: '已解决', value: 'resolved' },
              { label: '已忽略', value: 'ignored' },
            ]}
          />
          <Select
            allowClear
            placeholder="严重度"
            style={{ width: 140 }}
            value={query.severity}
            onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, severity: value }))}
            options={[
              { label: '严重', value: 'critical' },
              { label: '警告', value: 'warning' },
              { label: '提示', value: 'info' },
            ]}
          />
          <Select
            allowClear
            placeholder="问题类型"
            style={{ width: 160 }}
            value={query.issueType}
            onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, issueType: value }))}
            options={[
              { label: '偏离检测', value: 'deviation' },
              { label: '意图缺陷', value: 'intent_defect' },
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
            showTotal: (total) => `共 ${total} 条`,
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

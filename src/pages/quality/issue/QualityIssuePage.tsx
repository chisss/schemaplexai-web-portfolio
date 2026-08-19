import React, { useState } from 'react';
import { Table, Tag, Space, Button, Card, Statistic, Row, Col, Select, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import {
  useQualityIssues,
  useQualityIssueStatistics,
  useAcknowledgeQualityIssue,
  useIgnoreQualityIssue,
} from '@/api/quality';
import type { QualityIssue, QualityIssueQueryDTO } from '@/types/quality';
import type { ColumnsType } from 'antd/es/table';
import { formatDateTime } from '@/utils/date';

const severityColorMap: Record<string, string> = {
  critical: 'red',
  warning: 'orange',
  info: 'blue',
};

const statusColorMap: Record<string, string> = {
  open: 'red',
  acknowledged: 'orange',
  resolving: 'blue',
  resolved: 'green',
  ignored: 'default',
};

const gateDecisionColorMap: Record<string, string> = {
  pass: 'green',
  warn: 'gold',
  pause: 'orange',
  fail: 'red',
  retry: 'blue',
};

const QualityIssuePage: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useState<QualityIssueQueryDTO>({ page: 1, size: 20 });
  const { data: issuesData, isLoading } = useQualityIssues(params);
  const { data: statistics } = useQualityIssueStatistics({});
  const acknowledgeMutation = useAcknowledgeQualityIssue();
  const ignoreMutation = useIgnoreQualityIssue();

  const columns: ColumnsType<QualityIssue> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <Link to={`/quality/issues/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: '类型',
      dataIndex: 'issueType',
      key: 'issueType',
      width: 100,
      render: (type: string) => type === 'deviation' ? '偏离检测' : '意图缺陷',
    },
    {
      title: '严重度',
      dataIndex: 'severity',
      key: 'severity',
      width: 80,
      render: (severity: string) => (
        <Tag color={severityColorMap[severity] || 'default'}>{severity}</Tag>
      ),
    },
    {
      title: '闸门决策',
      dataIndex: 'gateDecision',
      key: 'gateDecision',
      width: 90,
      render: (decision: string) => decision ? (
        <Tag color={gateDecisionColorMap[decision] || 'default'}>{decision}</Tag>
      ) : '-',
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      width: 60,
      render: (score: number) => score ?? '-',
    },
    {
      title: '问题数',
      dataIndex: 'findingCount',
      key: 'findingCount',
      width: 70,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => (
        <Tag color={statusColorMap[status] || 'default'}>{status}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (val: string) => formatDateTime(val),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: any, record: QualityIssue) => (
        <Space size="small">
          <Button size="small" onClick={() => navigate(`/quality/issues/${record.id}`)}>详情</Button>
          {record.status === 'open' && (
            <Button
              size="small"
              type="link"
              onClick={() => {
                acknowledgeMutation.mutate({ id: record.id }, {
                  onSuccess: () => message.success('已确认'),
                });
              }}
            >
              确认
            </Button>
          )}
          {(record.status === 'open' || record.status === 'acknowledged') && (
            <Button
              size="small"
              type="link"
              onClick={() => {
                ignoreMutation.mutate({ id: record.id, data: {} }, {
                  onSuccess: () => message.success('已忽略'),
                });
              }}
            >
              忽略
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}><Card size="small"><Statistic title="待处理" value={statistics?.open ?? 0} valueStyle={{ color: '#cf1322' }} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="已确认" value={statistics?.acknowledged ?? 0} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="已解决" value={statistics?.resolved ?? 0} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="已忽略" value={statistics?.ignored ?? 0} /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="总计" value={statistics?.total ?? 0} /></Card></Col>
      </Row>

      <Space style={{ marginBottom: 12 }}>
        <Select
          style={{ width: 120 }}
          placeholder="状态"
          allowClear
          onChange={(val) => setParams((p) => ({ ...p, status: val, page: 1 }))}
          options={[
            { label: '待处理', value: 'open' },
            { label: '已确认', value: 'acknowledged' },
            { label: '已解决', value: 'resolved' },
            { label: '已忽略', value: 'ignored' },
          ]}
        />
        <Select
          style={{ width: 120 }}
          placeholder="严重度"
          allowClear
          onChange={(val) => setParams((p) => ({ ...p, severity: val, page: 1 }))}
          options={[
            { label: 'Critical', value: 'critical' },
            { label: 'Warning', value: 'warning' },
            { label: 'Info', value: 'info' },
          ]}
        />
        <Select
          style={{ width: 120 }}
          placeholder="类型"
          allowClear
          onChange={(val) => setParams((p) => ({ ...p, issueType: val, page: 1 }))}
          options={[
            { label: '偏离检测', value: 'deviation' },
            { label: '意图缺陷', value: 'intent_defect' },
          ]}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={issuesData?.records ?? []}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{
          current: params.page,
          pageSize: params.size,
          total: issuesData?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, size) => setParams((p) => ({ ...p, page, size })),
        }}
      />
    </div>
  );
};

export default QualityIssuePage;

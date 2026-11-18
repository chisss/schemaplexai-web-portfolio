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
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

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

const SEVERITY_LABEL_KEYS: Record<string, string> = {
  critical: 'quality.severity.critical',
  high: 'quality.severity.high',
  warning: 'quality.severity.warning',
  medium: 'quality.severity.medium',
  info: 'quality.severity.info',
  low: 'quality.severity.low',
};

const GATE_DECISION_LABEL_KEYS: Record<string, string> = {
  pass: 'quality.gateDecision.pass',
  warn: 'quality.gateDecision.warn',
  pause: 'quality.gateDecision.pause',
  fail: 'quality.gateDecision.fail',
  retry: 'quality.gateDecision.retry',
};

const ISSUE_STATUS_LABEL_KEYS: Record<string, string> = {
  open: 'quality.issue.statusOpen',
  acknowledged: 'quality.issue.statusAcknowledged',
  resolving: 'quality.issue.statusResolving',
  resolved: 'quality.issue.statusResolved',
  ignored: 'quality.issue.statusIgnored',
};

function labelOf(keyMap: Record<string, string>, value: string | undefined, t: TFunction) {
  if (!value) {
    return '-';
  }
  return keyMap[value] ? t(keyMap[value]) : value;
}

const severityLabel = (value: string, t: TFunction) => labelOf(SEVERITY_LABEL_KEYS, value, t);
const gateDecisionLabel = (value: string, t: TFunction) => labelOf(GATE_DECISION_LABEL_KEYS, value, t);
const issueStatusLabel = (value: string, t: TFunction) => labelOf(ISSUE_STATUS_LABEL_KEYS, value, t);

const QualityIssuePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useState<QualityIssueQueryDTO>({ page: 1, size: 20 });
  const { data: issuesData, isLoading } = useQualityIssues(params);
  const { data: statistics } = useQualityIssueStatistics({});
  const acknowledgeMutation = useAcknowledgeQualityIssue();
  const ignoreMutation = useIgnoreQualityIssue();

  const columns: ColumnsType<QualityIssue> = [
    {
      title: t('quality.issue.columnTitle'),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <Link to={`/quality/issues/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: t('quality.issue.columnType'),
      dataIndex: 'issueType',
      key: 'issueType',
      width: 100,
      render: (type: string) => type === 'deviation' ? t('quality.issue.typeDeviation') : t('quality.issue.typeIntentDefect'),
    },
    {
      title: t('quality.issue.columnSeverity'),
      dataIndex: 'severity',
      key: 'severity',
      width: 80,
      render: (severity: string) => (
        <Tag color={severityColorMap[severity] || 'default'}>{severityLabel(severity, t)}</Tag>
      ),
    },
    {
      title: t('quality.issue.columnGateDecision'),
      dataIndex: 'gateDecision',
      key: 'gateDecision',
      width: 90,
      render: (decision: string) => decision ? (
        <Tag color={gateDecisionColorMap[decision] || 'default'}>{gateDecisionLabel(decision, t)}</Tag>
      ) : '-',
    },
    {
      title: t('quality.issue.columnScore'),
      dataIndex: 'score',
      key: 'score',
      width: 60,
      render: (score: number) => score ?? '-',
    },
    {
      title: t('quality.issue.columnFindingCount'),
      dataIndex: 'findingCount',
      key: 'findingCount',
      width: 70,
    },
    {
      title: t('quality.issue.columnStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => (
        <Tag color={statusColorMap[status] || 'default'}>{issueStatusLabel(status, t)}</Tag>
      ),
    },
    {
      title: t('quality.issue.columnCreatedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (val: string) => formatDateTime(val),
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 160,
      render: (_: any, record: QualityIssue) => (
        <Space size="small">
          <Button size="small" onClick={() => navigate(`/quality/issues/${record.id}`)}>{t('common.detail')}</Button>
          {record.status === 'open' && (
            <Button
              size="small"
              type="link"
              onClick={() => {
                acknowledgeMutation.mutate({ id: record.id }, {
                  onSuccess: () => message.success(t('quality.issue.msgAcknowledged')),
                });
              }}
            >
              {t('quality.issue.acknowledge')}
            </Button>
          )}
          {(record.status === 'open' || record.status === 'acknowledged') && (
            <Button
              size="small"
              type="link"
              onClick={() => {
                ignoreMutation.mutate({ id: record.id, data: {} }, {
                  onSuccess: () => message.success(t('quality.issue.msgIgnored')),
                });
              }}
            >
              {t('quality.issue.ignore')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}><Card size="small"><Statistic title={t('quality.issue.statusOpen')} value={statistics?.open ?? 0} valueStyle={{ color: '#cf1322' }} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title={t('quality.issue.statusAcknowledged')} value={statistics?.acknowledged ?? 0} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title={t('quality.issue.statusResolved')} value={statistics?.resolved ?? 0} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title={t('quality.issue.statusIgnored')} value={statistics?.ignored ?? 0} /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title={t('quality.issue.total')} value={statistics?.total ?? 0} /></Card></Col>
      </Row>

      <Space style={{ marginBottom: 12 }}>
        <Select
          style={{ width: 120 }}
          placeholder={t('quality.filter.status')}
          allowClear
          onChange={(val) => setParams((p) => ({ ...p, status: val, page: 1 }))}
          options={[
            { label: t('quality.issue.statusOpen'), value: 'open' },
            { label: t('quality.issue.statusAcknowledged'), value: 'acknowledged' },
            { label: t('quality.issue.statusResolved'), value: 'resolved' },
            { label: t('quality.issue.statusIgnored'), value: 'ignored' },
          ]}
        />
        <Select
          style={{ width: 120 }}
          placeholder={t('quality.filter.severity')}
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
          placeholder={t('quality.filter.issueType')}
          allowClear
          onChange={(val) => setParams((p) => ({ ...p, issueType: val, page: 1 }))}
          options={[
            { label: t('quality.issue.typeDeviation'), value: 'deviation' },
            { label: t('quality.issue.typeIntentDefect'), value: 'intent_defect' },
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
          showTotal: (total) => t('common.total', { total }),
          onChange: (page, size) => setParams((p) => ({ ...p, page, size })),
        }}
      />
    </div>
  );
};

export default QualityIssuePage;

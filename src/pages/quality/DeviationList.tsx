import { useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Input, Progress, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDeviations, useDeviationStatistics } from '@/api/quality';
import { useSpecList } from '@/api/spec';
import { useWorkspaces } from '@/api/workspace';
import type { Deviation, DeviationQueryDTO } from '@/types/quality';
import { formatDateTime } from '@/utils/date';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const STATUS_COLOR_MAP: Record<string, string> = {
  open: 'error',
  resolved: 'success',
  acknowledged: 'processing',
  ignored: 'default',
};

const SEVERITY_COLOR_MAP: Record<string, string> = {
  critical: 'red',
  warning: 'orange',
  info: 'blue',
};

interface DeviationListProps {
  embedded?: boolean;
}

function normalizeDeviationStatus(record: Deviation): string {
  return (record.status || '').toLowerCase() || 'open';
}

export default function DeviationList({ embedded = false }: DeviationListProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filters, setFilters] = useState<DeviationQueryDTO>({ page: 1, size: 10 });
  const [keywordInput, setKeywordInput] = useState('');

  const statusLabelMap = useMemo<Record<string, string>>(() => ({
    open: t('quality.deviation.statusOpen'),
    resolved: t('quality.deviation.statusResolved'),
    acknowledged: t('quality.deviation.statusAcknowledged'),
    ignored: t('quality.deviation.statusIgnored'),
  }), [t]);

  const severityLabelMap = useMemo<Record<string, string>>(() => ({
    critical: t('quality.deviation.severityCritical'),
    warning: t('quality.deviation.severityWarning'),
    info: t('quality.deviation.severityInfo'),
  }), [t]);

  const { data: deviationData, isLoading } = useDeviations(filters);
  const { data: statistics, isLoading: statisticsLoading } = useDeviationStatistics({ specId: filters.specId });
  const { data: workspacePage } = useWorkspaces({ page: 1, size: 200 });
  const { data: specPage } = useSpecList({
    page: 1,
    size: 200,
    projectId: filters.workspaceId,
  });

  const workspaceOptions = (workspacePage?.records || []).map((item) => ({
    label: item.name,
    value: item.id,
  }));

  const specOptions = (specPage?.records || []).map((item) => ({
    label: item.name,
    value: item.id,
  }));

  const records = useMemo(() => {
    const source = deviationData?.records || [];
    if (!filters.status) {
      return source;
    }
    return source.filter((item) => normalizeDeviationStatus(item) === filters.status);
  }, [deviationData?.records, filters.status]);

  const resolvedRate = statistics?.totalCount
    ? Math.round((((statistics.resolvedCount || 0) + (statistics.acknowledgedCount || 0)) / statistics.totalCount) * 100)
    : 0;

  const columns = [
    {
      title: t('quality.deviation.columnTitle'),
      dataIndex: 'title',
      key: 'title',
      width: 260,
      render: (value: string, record: Deviation) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/quality/${record.id}`)}>{value}</Button>
      ),
    },
    {
      title: t('quality.deviation.columnType'),
      dataIndex: 'deviationType',
      key: 'deviationType',
      width: 140,
      render: (value: string, record: Deviation) => <Tag>{record.deviationTypeLabel || value}</Tag>,
    },
    {
      title: t('quality.deviation.columnSeverity'),
      dataIndex: 'severity',
      key: 'severity',
      width: 120,
      render: (value: string) => <Tag color={SEVERITY_COLOR_MAP[value] || 'default'}>{severityLabelMap[value] || value}</Tag>,
    },
    {
      title: t('quality.deviation.columnProject'),
      dataIndex: 'projectName',
      key: 'projectName',
      width: 180,
      ellipsis: true,
      render: (value: string) => value || '-',
    },
    {
      title: 'Spec',
      dataIndex: 'specName',
      key: 'specName',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('quality.deviation.columnStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (_value: string, record: Deviation) => {
        const normalized = normalizeDeviationStatus(record);
        const statusLabel = statusLabelMap[normalized] || record.statusLabel || normalized;
        const badgeStatus = STATUS_COLOR_MAP[normalized] as 'success' | 'processing' | 'default' | 'error';
        return <Badge status={badgeStatus} text={statusLabel} />;
      },
    },
    {
      title: t('quality.deviation.columnSource'),
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 120,
      render: (value: string) => <Tag color={value === 'manual' ? 'purple' : 'green'}>{value || '-'}</Tag>,
    },
    {
      title: t('quality.deviation.columnDetectedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
  ];

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card variant="borderless" className="shadow-sm" loading={statisticsLoading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Statistic title={t('quality.deviation.totalCount')} value={statistics?.totalCount || 0} prefix={<WarningOutlined style={{ color: 'var(--color-warning)' }} />} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title={t('quality.deviation.resolvedCount')} value={statistics?.resolvedCount || 0} prefix={<CheckCircleOutlined style={{ color: 'var(--color-success)' }} />} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title={t('quality.deviation.openCount')} value={statistics?.openCount || 0} prefix={<ExclamationCircleOutlined style={{ color: 'var(--color-error)' }} />} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text type="secondary">{t('quality.deviation.closedLoopRate')}</Text>
              <div className="mt-2 text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>{resolvedRate}%</div>
              <Progress percent={resolvedRate} size="small" status={resolvedRate >= 80 ? 'success' : 'active'} style={{ marginTop: 8 }} />
            </div>
          </Col>
        </Row>
      </Card>

      <Card variant="borderless" className="shadow-sm" title={t('quality.deviation.recordCardTitle')}>
        <Space wrap style={{ marginBottom: 12 }}>
          <Select
            allowClear
            placeholder={t('quality.deviation.filterTypePlaceholder')}
            style={{ width: 140 }}
            value={filters.deviationType}
            onChange={(value) => setFilters((prev) => ({ ...prev, page: 1, deviationType: value }))}
            options={[
              { label: t('quality.deviation.typeStructural'), value: 'structural' },
              { label: t('quality.deviation.typeSemantic'), value: 'semantic' },
              { label: t('quality.deviation.typeSecurity'), value: 'security' },
              { label: t('quality.deviation.typePerformance'), value: 'performance' },
              { label: t('quality.deviation.typeProcess'), value: 'process' },
            ]}
          />
          <Select
            allowClear
            placeholder={t('quality.deviation.filterSeverityPlaceholder')}
            style={{ width: 140 }}
            value={filters.severity}
            onChange={(value) => setFilters((prev) => ({ ...prev, page: 1, severity: value }))}
            options={[
              { label: t('quality.deviation.severityCritical'), value: 'critical' },
              { label: t('quality.deviation.severityWarning'), value: 'warning' },
              { label: t('quality.deviation.severityInfo'), value: 'info' },
            ]}
          />
          <Select
            allowClear
            showSearch
            placeholder={t('quality.deviation.filterProjectPlaceholder')}
            style={{ width: 180 }}
            value={filters.workspaceId}
            onChange={(value) => setFilters((prev) => ({ ...prev, page: 1, workspaceId: value, specId: undefined }))}
            options={workspaceOptions}
          />
          <Select
            allowClear
            showSearch
            placeholder="Spec"
            style={{ width: 200 }}
            value={filters.specId}
            onChange={(value) => setFilters((prev) => ({ ...prev, page: 1, specId: value }))}
            options={specOptions}
          />
          <Select
            allowClear
            placeholder={t('quality.deviation.filterStatusPlaceholder')}
            style={{ width: 140 }}
            value={filters.status}
            onChange={(value) => setFilters((prev) => ({ ...prev, page: 1, status: value }))}
            options={[
              { label: t('quality.deviation.statusOpen'), value: 'open' },
              { label: t('quality.deviation.statusResolved'), value: 'resolved' },
              { label: t('quality.deviation.statusAcknowledged'), value: 'acknowledged' },
              { label: t('quality.deviation.statusIgnored'), value: 'ignored' },
            ]}
          />
          <Input
            allowClear
            placeholder={t('quality.deviation.keywordPlaceholder')}
            prefix={<SearchOutlined />}
            style={{ width: 260 }}
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onPressEnter={() => setFilters((prev) => ({ ...prev, page: 1, keyword: keywordInput || undefined }))}
          />
          <Button type="primary" onClick={() => setFilters((prev) => ({ ...prev, page: 1, keyword: keywordInput || undefined }))}>
            {t('quality.deviation.search')}
          </Button>
          <Button
            onClick={() => {
              setKeywordInput('');
              setFilters({ page: 1, size: 10 });
            }}
          >
            {t('quality.deviation.reset')}
          </Button>
        </Space>
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={records}
          scroll={{ x: 1360 }}
          pagination={{
            current: filters.page || 1,
            pageSize: filters.size || 10,
            total: deviationData?.total || 0,
            onChange: (page, size) => setFilters((prev) => ({ ...prev, page, size })),
            showSizeChanger: true,
            showTotal: (total: number) => t('common.total', { total }),
          }}
        />
      </Card>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <PageContainer title={t('quality.deviation.pageTitle')}>
      {content}
    </PageContainer>
  );
}

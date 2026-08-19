import { useCallback, useMemo, useState } from 'react';
import { App as AntApp, Badge, Button, Card, Col, Descriptions, Drawer, Input, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { PlayCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAnalyzeIntentDefect, useIntentDefects, useUpdateIntentDefectStatus } from '@/api/quality';
import { useSpecList } from '@/api/spec';
import type { IntentDefectQueryDTO, IntentDefect } from '@/types/quality';
import { useAppStore } from '@/store/useAppStore';
import { formatDateTime } from '@/utils/date';
import PageContainer from '@/components/PageContainer/PageContainer';

const { Paragraph } = Typography;

interface IntentDefectListProps {
  embedded?: boolean;
}

export default function IntentDefectList({ embedded = false }: IntentDefectListProps) {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [queryParams, setQueryParams] = useState<IntentDefectQueryDTO>({ page: 1, size: 10 });
  const [keywordInput, setKeywordInput] = useState('');
  const [analyzeSpecId, setAnalyzeSpecId] = useState<string>();
  const [analyzeDocType, setAnalyzeDocType] = useState<string>('requirements');
  const [detail, setDetail] = useState<IntentDefect | null>(null);

  const { data: specPage } = useSpecList({ page: 1, size: 200 });
  const { data, isLoading } = useIntentDefects(queryParams);
  const analyzeMutation = useAnalyzeIntentDefect();
  const updateStatusMutation = useUpdateIntentDefectStatus();

  const specOptions = useMemo(() => (specPage?.records || []).map((item) => ({
    label: item.name,
    value: item.id,
  })), [specPage?.records]);

  const defectTypeLabelMap = useMemo<Record<string, string>>(() => ({
    ambiguity: t('quality.defect.typeAmbiguity'),
    contradiction: t('quality.defect.typeContradiction'),
    omission: t('quality.defect.typeOmission'),
    vagueness: t('quality.defect.typeVagueness'),
  }), [t]);

  const docTypeLabelMap = useMemo<Record<string, string>>(() => ({
    requirements: t('quality.defect.docTypeRequirements'),
    design: t('quality.defect.docTypeDesign'),
    tasks: t('quality.defect.docTypeTasks'),
  }), [t]);

  const statusLabelMap = useMemo<Record<string, string>>(() => ({
    open: t('quality.defect.statusOpen'),
    resolved: t('quality.defect.statusResolved'),
    accepted: t('quality.defect.statusAccepted'),
  }), [t]);

  const getStatusBadge = useCallback((status?: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'resolved') {
      return { status: 'success' as const, text: statusLabelMap.resolved };
    }
    if (normalized === 'accepted') {
      return { status: 'processing' as const, text: statusLabelMap.accepted };
    }
    return { status: 'error' as const, text: statusLabelMap.open };
  }, [statusLabelMap]);

  const columns = [
    {
      title: t('quality.defect.columnTitle'),
      dataIndex: 'title',
      key: 'title',
      width: 300,
      render: (value: string, record: IntentDefect) => <Button type="link" style={{ padding: 0 }} onClick={() => setDetail(record)}>{value}</Button>,
    },
    {
      title: 'Spec',
      dataIndex: 'specName',
      key: 'specName',
      width: 180,
      ellipsis: true,
    },
    {
      title: t('quality.defect.columnDocType'),
      dataIndex: 'docType',
      key: 'docType',
      width: 120,
      render: (value: string, record: IntentDefect) => record.docTypeLabel || docTypeLabelMap[value] || value,
    },
    {
      title: t('quality.defect.columnDefectType'),
      dataIndex: 'defectType',
      key: 'defectType',
      width: 120,
      render: (value: string, record: IntentDefect) => (
        <Tag color="purple">{record.defectTypeLabel || defectTypeLabelMap[value] || value}</Tag>
      ),
    },
    {
      title: t('quality.defect.columnSeverity'),
      dataIndex: 'severity',
      key: 'severity',
      width: 120,
      render: (value: string) => {
        const lower = (value || '').toLowerCase();
        const color = lower === 'critical' ? 'red' : lower === 'warning' ? 'orange' : 'blue';
        return <Tag color={color}>{lower === 'critical' ? t('quality.defect.severityCritical') : lower === 'warning' ? t('quality.defect.severityWarning') : t('quality.defect.severityInfo')}</Tag>;
      },
    },
    {
      title: t('quality.defect.columnStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: string) => {
        const cfg = getStatusBadge(value);
        return <Badge status={cfg.status} text={cfg.text} />;
      },
    },
    {
      title: t('quality.defect.columnCreatedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: t('quality.defect.columnAction'),
      key: 'action',
      width: 130,
      render: (_: unknown, record: IntentDefect) => (
          <Select
            size="small"
            value={(record.status || 'open').toLowerCase()}
            style={{ width: 100 }}
            onChange={(status) => {
              updateStatusMutation.mutate(
                { id: record.id, status },
                { onSuccess: () => message.success(t('quality.defect.statusUpdated')) },
              );
            }}
            options={[
              { label: t('quality.defect.statusOpen'), value: 'open' },
              { label: t('quality.defect.statusResolved'), value: 'resolved' },
              { label: t('quality.defect.statusAccepted'), value: 'accepted' },
            ]}
          />
      ),
    },
  ];

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card variant="borderless" className="shadow-sm" title={t('quality.defect.analyzeCardTitle')}>
        <Space wrap>
          <Select
            showSearch
            allowClear
            placeholder={t('quality.defect.selectSpecPlaceholder')}
            style={{ width: 300 }}
            value={analyzeSpecId}
            onChange={setAnalyzeSpecId}
            options={specOptions}
          />
          <Select
            style={{ width: 140 }}
            value={analyzeDocType}
            onChange={setAnalyzeDocType}
            options={[
              { label: t('quality.defect.docTypeRequirements'), value: 'requirements' },
              { label: t('quality.defect.docTypeDesign'), value: 'design' },
              { label: t('quality.defect.docTypeTasks'), value: 'tasks' },
            ]}
          />
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={analyzeMutation.isPending}
            onClick={() => {
              if (!analyzeSpecId) {
                message.warning(t('quality.defect.pleaseSelectSpec'));
                return;
              }
              analyzeMutation.mutate(
                { specId: analyzeSpecId, docType: analyzeDocType },
                { onSuccess: () => message.success(t('quality.defect.analyzeSubmitted')) },
              );
            }}
          >
            {t('quality.defect.startAnalysis')}
          </Button>
        </Space>
      </Card>

      <Card variant="borderless" className="shadow-sm" title={t('quality.defect.recordCardTitle')}>
        <Space wrap style={{ marginBottom: 12 }}>
          <Select
            allowClear
            showSearch
            placeholder="Spec"
            style={{ width: 220 }}
            value={queryParams.specId}
            onChange={(value) => setQueryParams((prev) => ({ ...prev, page: 1, specId: value }))}
            options={specOptions}
          />
          <Select
            allowClear
            placeholder={t('quality.defect.filterDocTypePlaceholder')}
            style={{ width: 140 }}
            value={queryParams.docType}
            onChange={(value) => setQueryParams((prev) => ({ ...prev, page: 1, docType: value }))}
            options={[
              { label: t('quality.defect.docTypeRequirements'), value: 'requirements' },
              { label: t('quality.defect.docTypeDesign'), value: 'design' },
              { label: t('quality.defect.docTypeTasks'), value: 'tasks' },
            ]}
          />
          <Select
            allowClear
            placeholder={t('quality.defect.filterDefectTypePlaceholder')}
            style={{ width: 140 }}
            value={queryParams.defectType}
            onChange={(value) => setQueryParams((prev) => ({ ...prev, page: 1, defectType: value }))}
            options={[
              { label: t('quality.defect.typeAmbiguity'), value: 'ambiguity' },
              { label: t('quality.defect.typeContradiction'), value: 'contradiction' },
              { label: t('quality.defect.typeOmission'), value: 'omission' },
              { label: t('quality.defect.typeVagueness'), value: 'vagueness' },
            ]}
          />
          <Select
            allowClear
            placeholder={t('quality.defect.filterSeverityPlaceholder')}
            style={{ width: 140 }}
            value={queryParams.severity}
            onChange={(value) => setQueryParams((prev) => ({ ...prev, page: 1, severity: value }))}
            options={[
              { label: t('quality.defect.severityCritical'), value: 'critical' },
              { label: t('quality.defect.severityWarning'), value: 'warning' },
              { label: t('quality.defect.severityInfo'), value: 'info' },
            ]}
          />
          <Select
            allowClear
            placeholder={t('quality.defect.filterStatusPlaceholder')}
            style={{ width: 140 }}
            value={queryParams.status}
            onChange={(value) => setQueryParams((prev) => ({ ...prev, page: 1, status: value }))}
            options={[
              { label: t('quality.defect.statusOpen'), value: 'open' },
              { label: t('quality.defect.statusResolved'), value: 'resolved' },
              { label: t('quality.defect.statusAccepted'), value: 'accepted' },
            ]}
          />
          <Input
            allowClear
            placeholder={t('quality.defect.keywordPlaceholder')}
            prefix={<SearchOutlined />}
            style={{ width: 220 }}
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onPressEnter={() => setQueryParams((prev) => ({ ...prev, page: 1, keyword: keywordInput || undefined }))}
          />
          <Button type="primary" onClick={() => setQueryParams((prev) => ({ ...prev, page: 1, keyword: keywordInput || undefined }))}>
            {t('quality.defect.search')}
          </Button>
          <Button
            onClick={() => {
              setKeywordInput('');
              setQueryParams({ page: 1, size: 10 });
            }}
          >
            {t('quality.defect.reset')}
          </Button>
        </Space>

        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={data?.records || []}
          columns={columns}
          scroll={{ x: 1320 }}
          pagination={{
            current: queryParams.page || 1,
            pageSize: queryParams.size || 10,
            total: data?.total || 0,
            onChange: (page, size) => setQueryParams((prev) => ({ ...prev, page, size })),
            showSizeChanger: true,
            showTotal: (total) => t('common.total', { total }),
          }}
        />
      </Card>

      <Drawer
        size={typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 680}
        title={t('quality.defect.drawerTitle')}
        open={!!detail}
        onClose={() => setDetail(null)}
      >
        {detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card
              variant="borderless"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                  : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              }}
            >
              <Space wrap style={{ marginBottom: 12 }}>
                <Tag color="blue">{detail.specName || t('quality.defect.noLinkedSpec')}</Tag>
                <Tag color="purple">{detail.defectTypeLabel || defectTypeLabelMap[detail.defectType] || detail.defectType}</Tag>
                <Tag>{detail.docTypeLabel || docTypeLabelMap[detail.docType] || detail.docType}</Tag>
                <Tag color={detail.severity === 'critical' ? 'red' : detail.severity === 'warning' ? 'orange' : 'blue'}>
                  {detail.severity === 'critical' ? t('quality.defect.severityCritical') : detail.severity === 'warning' ? t('quality.defect.severityWarning') : t('quality.defect.severityInfo')}
                </Tag>
              </Space>
              <Paragraph style={{ marginBottom: 0, fontSize: 18, fontWeight: 600 }}>{detail.title}</Paragraph>
            </Card>

            <Card title={t('quality.defect.basicInfo')} size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label={t('quality.defect.labelStatus')}>{getStatusBadge(detail.status).text}</Descriptions.Item>
                <Descriptions.Item label={t('quality.defect.labelCreatedAt')}>{formatDateTime(detail.createdAt)}</Descriptions.Item>
                <Descriptions.Item label={t('quality.defect.labelLocation')}>{detail.location || '-'}</Descriptions.Item>
                <Descriptions.Item label="Spec">{detail.specName || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title={t('quality.defect.descriptionTitle')} size="small">
                  <Paragraph style={{ marginBottom: 0 }}>{detail.description || '-'}</Paragraph>
                </Card>
              </Col>
              <Col span={24}>
                <Card title={t('quality.defect.suggestionTitle')} size="small">
                  <Paragraph style={{ marginBottom: 0 }}>{detail.suggestion || '-'}</Paragraph>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Drawer>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <PageContainer title={t('quality.defect.pageTitle')}>
      {content}
    </PageContainer>
  );
}

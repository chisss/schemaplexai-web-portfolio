import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ApartmentOutlined,
  BranchesOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntApp,
  Button,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import EmptyState from '@/components/EmptyState/EmptyState';
import {
  useCreateSemanticModel,
  useCreateSemanticVersion,
  useDeleteSemanticModel,
  useSemanticModels,
} from '@/api/semantic';
import type {
  SemanticModel,
  SemanticModelCreateDTO,
  SemanticModelQueryDTO,
  SemanticModelStatus,
  SemanticVersionStatus,
} from '@/types/semantic';
import { formatDateTime } from '@/utils/date';
import './semantic.css';

const { Text, Paragraph } = Typography;

const versionColor: Record<SemanticVersionStatus, string> = {
  draft: 'blue',
  validating: 'processing',
  invalid: 'error',
  published: 'success',
  archived: 'default',
};

export default function SemanticModelCatalog() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm<SemanticModelCreateDTO>();
  const [query, setQuery] = useState<SemanticModelQueryDTO>({ page: 1, size: 20 });
  const [keyword, setKeyword] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const modelsQuery = useSemanticModels(query);
  const createModel = useCreateSemanticModel();
  const createVersion = useCreateSemanticVersion();
  const deleteModel = useDeleteSemanticModel();
  const records = useMemo(() => modelsQuery.data?.records ?? [], [modelsQuery.data?.records]);

  const statistics = useMemo(() => ({
    total: modelsQuery.data?.total ?? 0,
    published: records.filter((item) => item.validationStatus === 'published').length,
    draft: records.filter((item) => ['draft', 'invalid'].includes(item.validationStatus ?? '')).length,
    averageCoverage: records.length
      ? Math.round(records.reduce((sum, item) => sum + (item.mappingCoverage ?? 0), 0) / records.length)
      : 0,
  }), [modelsQuery.data?.total, records]);

  const statusLabel = (status: SemanticModelStatus) =>
    t(`semantic.status.model.${status}`);

  const versionStatusLabel = (status?: SemanticVersionStatus) =>
    status ? t(`semantic.status.version.${status}`) : t('semantic.catalog.notPublished');

  const submitCreate = async () => {
    const values = await form.validateFields();
    const response = await createModel.mutateAsync({
      name: values.name.trim(),
      domain: values.domain.trim(),
      description: values.description?.trim(),
    });
    message.success(t('semantic.catalog.createSuccess'));
    setCreateOpen(false);
    form.resetFields();
    navigate(`/data-management/semantic-models/${response.data.id}`);
  };

  const handleCreateDraft = async (model: SemanticModel) => {
    const response = await createVersion.mutateAsync({ modelId: model.id, data: {} });
    message.success(t('semantic.catalog.draftCreated'));
    navigate(`/data-management/semantic-models/${model.id}?version=${response.data.id}`);
  };

  const handleDelete = async (model: SemanticModel) => {
    await deleteModel.mutateAsync(model.id);
    message.success(t('common.deleteSuccess'));
  };

  const columns: ColumnsType<SemanticModel> = [
    {
      title: t('semantic.catalog.columns.model'),
      key: 'model',
      width: 290,
      render: (_, record) => (
        <button
          type="button"
          className="semantic-model-link"
          onClick={() => navigate(`/data-management/semantic-models/${record.id}`)}
        >
          <span className="semantic-model-link__icon"><ApartmentOutlined /></span>
          <span className="semantic-model-link__content">
            <strong>{record.name}</strong>
            <span>{record.description || t('common.noDescription')}</span>
          </span>
        </button>
      ),
    },
    {
      title: t('semantic.catalog.columns.domain'),
      dataIndex: 'domain',
      width: 150,
      render: (domain: string) => <Tag variant="filled">{domain}</Tag>,
    },
    {
      title: t('semantic.catalog.columns.version'),
      width: 150,
      render: (_, record) => (
        <Space size={6}>
          <Text>{record.activeVersionNo ? `v${record.activeVersionNo}` : '-'}</Text>
          <Tag color={record.validationStatus ? versionColor[record.validationStatus] : 'default'}>
            {versionStatusLabel(record.validationStatus)}
          </Tag>
        </Space>
      ),
    },
    {
      title: t('semantic.catalog.columns.coverage'),
      dataIndex: 'mappingCoverage',
      width: 170,
      render: (coverage?: number) => (
        <Progress
          percent={coverage ?? 0}
          size="small"
          strokeColor={(coverage ?? 0) >= 80 ? '#16a34a' : '#1677ff'}
        />
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      width: 110,
      render: (status: SemanticModelStatus) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>{statusLabel(status)}</Tag>
      ),
    },
    {
      title: t('common.updateTime'),
      dataIndex: 'updatedAt',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/data-management/semantic-models/${record.id}`)}
          >
            {t('semantic.catalog.openWorkbench')}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<BranchesOutlined />}
            loading={createVersion.isPending && createVersion.variables?.modelId === record.id}
            onClick={() => void handleCreateDraft(record)}
          >
            {t('semantic.catalog.newDraft')}
          </Button>
          {record.status === 'archived' && (
            <Popconfirm
              title={t('semantic.catalog.deleteConfirm')}
              onConfirm={() => void handleDelete(record)}
            >
              <Button type="text" danger size="small" icon={<DeleteOutlined />} aria-label={t('common.delete')} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title={t('semantic.catalog.title')}
      description={t('semantic.catalog.description')}
      extra={(
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          {t('semantic.catalog.create')}
        </Button>
      )}
    >
      <section className="semantic-metrics" aria-label={t('semantic.catalog.overview')}>
        <div><span>{t('semantic.catalog.metrics.total')}</span><strong>{statistics.total}</strong></div>
        <div><span>{t('semantic.catalog.metrics.published')}</span><strong>{statistics.published}</strong></div>
        <div><span>{t('semantic.catalog.metrics.draft')}</span><strong>{statistics.draft}</strong></div>
        <div><span>{t('semantic.catalog.metrics.coverage')}</span><strong>{statistics.averageCoverage}%</strong></div>
      </section>

      <section className="semantic-surface">
        <div className="semantic-filterbar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            value={keyword}
            placeholder={t('semantic.catalog.searchPlaceholder')}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={() => setQuery((current) => ({ ...current, page: 1, keyword: keyword.trim() || undefined }))}
          />
          <Input
            allowClear
            placeholder={t('semantic.catalog.domainPlaceholder')}
            value={query.domain}
            onChange={(event) => setQuery((current) => ({ ...current, page: 1, domain: event.target.value || undefined }))}
          />
          <Select
            allowClear
            placeholder={t('semantic.catalog.statusPlaceholder')}
            value={query.status}
            options={(['active', 'archived'] as SemanticModelStatus[]).map((status) => ({
              value: status,
              label: statusLabel(status),
            }))}
            onChange={(status) => setQuery((current) => ({ ...current, page: 1, status }))}
          />
          <Button
            icon={<SearchOutlined />}
            onClick={() => setQuery((current) => ({ ...current, page: 1, keyword: keyword.trim() || undefined }))}
          >
            {t('common.search')}
          </Button>
        </div>

        {modelsQuery.isError && (
          <Alert
            showIcon
            type="error"
            message={t('semantic.catalog.loadFailed')}
            description={t('semantic.catalog.loadFailedDescription')}
            action={<Button icon={<ReloadOutlined />} onClick={() => void modelsQuery.refetch()}>{t('common.retry')}</Button>}
          />
        )}

        {!modelsQuery.isError && !modelsQuery.isLoading && records.length === 0 ? (
          <EmptyState
            icon={<ApartmentOutlined />}
            title={t('semantic.catalog.emptyTitle')}
            description={t('semantic.catalog.emptyDescription')}
            actions={[{ label: t('semantic.catalog.create'), onClick: () => setCreateOpen(true), icon: <PlusOutlined /> }]}
          />
        ) : (
          <Table
            rowKey="id"
            loading={modelsQuery.isLoading}
            columns={columns}
            dataSource={records}
            scroll={{ x: 1280 }}
            pagination={{
              current: query.page,
              pageSize: query.size,
              total: modelsQuery.data?.total ?? 0,
              showSizeChanger: true,
              showTotal: (total) => t('semantic.catalog.totalItems', { total }),
              onChange: (page, size) => setQuery((current) => ({ ...current, page, size })),
            }}
          />
        )}
      </section>

      <Drawer
        title={t('semantic.catalog.create')}
        open={createOpen}
        size={440}
        onClose={() => setCreateOpen(false)}
        extra={(
          <Space>
            <Button onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
            <Button type="primary" loading={createModel.isPending} onClick={() => void submitCreate()}>
              {t('common.create')}
            </Button>
          </Space>
        )}
      >
        <Paragraph type="secondary">{t('semantic.catalog.createHint')}</Paragraph>
        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item name="name" label={t('semantic.catalog.form.name')} rules={[{ required: true }, { max: 80 }]}>
            <Input placeholder={t('semantic.catalog.form.namePlaceholder')} />
          </Form.Item>
          <Form.Item name="domain" label={t('semantic.catalog.form.domain')} rules={[{ required: true }, { max: 80 }]}>
            <Input placeholder={t('semantic.catalog.form.domainPlaceholder')} />
          </Form.Item>
          <Form.Item name="description" label={t('common.description')} rules={[{ max: 500 }]}>
            <Input.TextArea rows={4} showCount maxLength={500} placeholder={t('semantic.catalog.form.descriptionPlaceholder')} />
          </Form.Item>
        </Form>
      </Drawer>
    </PageContainer>
  );
}

/**
 * AI 模型列表组件
 * 支持卡片视图和表格列表视图切换
 */
import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import {
  Button,
  Row,
  Col,
  Card,
  Tag,
  Tooltip,
  Popconfirm,
  Table,
  Skeleton,
  Empty,
  Space,
  message,
  Pagination,
  Modal,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  RetweetOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDeleteAiModel, useDisableAiModel, useModelGroups, useRoutes, useTestModelConnectivity } from '@/api/system';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import AiModelIcon from '@/components/model/AiModelIcon';
import type { AiModel } from '@/types/system';
import { formatModelUseCaseLabel, getModelUseCaseMeta } from '@/utils/aiModel';

interface ModelCardListProps {
  models: AiModel[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (m: AiModel) => void;
  onDelete: (id: string) => void;
}

/** 状态配置 */
const STATUS_CONFIG: Record<string, { color: string; labelKey: string }> = {
  active: { color: 'success', labelKey: 'system.model.statusActive' },
  ACTIVE: { color: 'success', labelKey: 'system.model.statusActive' },
  inactive: { color: 'default', labelKey: 'system.model.statusInactive' },
  INACTIVE: { color: 'default', labelKey: 'system.model.statusInactive' },
  error: { color: 'error', labelKey: 'system.model.statusError' },
  ERROR: { color: 'error', labelKey: 'system.model.statusError' },
};

/** 单张模型卡片 - 重构布局 */
function ModelCard({
  model,
  onEdit,
  onConfirmDelete,
  onDisable,
  onTest,
  isTesting,
  isDark,
  canUpdate,
}: {
  model: AiModel;
  onEdit: (m: AiModel) => void;
  onConfirmDelete: (id: string) => void;
  onDisable: (model: AiModel) => void;
  onTest: (id: string) => void;
  isTesting: boolean;
  isDark: boolean;
  canUpdate: boolean;
}) {
  const { t } = useTranslation();
  const cfg = STATUS_CONFIG[model.status] ?? { color: 'default', labelKey: model.status };
  const useCaseMeta = getModelUseCaseMeta(model.useCase);

  const testStatusIcon = model.lastTestStatus === 'success'
    ? <CheckCircleOutlined style={{ color: 'var(--color-success)' }} />
    : model.lastTestStatus === 'failed' || model.lastTestStatus === 'timeout'
    ? <CloseCircleOutlined style={{ color: 'var(--color-error)' }} />
    : <QuestionCircleOutlined style={{ color: 'var(--color-text-tertiary)' }} />;

  const testStatusLabel = model.lastTestStatus === 'success'
    ? t('system.model.connectivitySuccessWithLatency', { latency: model.lastTestLatency })
    : model.lastTestStatus === 'failed'
    ? t('system.model.connectivityFailed')
    : model.lastTestStatus === 'timeout'
    ? t('system.model.connectivityTimeout')
    : t('system.model.notTested');

  return (
    <Card
      hoverable
      style={{
        height: '100%',
        border: isDark ? '1px solid #313233' : '1px solid #f0f0f0',
        borderRadius: 12,
      }}
      styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
    >
      {/* 卡片头部：渐变条 + 图标 + 名称 */}
      <div
        style={{
          padding: '20px 20px 16px',
          background: isDark
            ? 'linear-gradient(135deg, rgba(14,66,210,0.15) 0%, rgba(14,66,210,0.1) 100%)'
            : 'linear-gradient(135deg, rgba(22,93,255,0.08) 0%, rgba(14,66,210,0.06) 100%)',
          borderRadius: '12px 12px 0 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                background: useCaseMeta.gradient,
                color: '#fff',
                boxShadow: `0 4px 12px ${useCaseMeta.accent}40`,
                flexShrink: 0,
              }}
            >
              <AiModelIcon
                modelId={model.modelId}
                modelName={model.name}
                provider={model.provider}
                providerCode={model.providerCode}
                size={24}
                type="color"
              />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: isDark ? '#F2F3F5' : '#1D2129', lineHeight: 1.4, wordBreak: 'break-word' }}>
                {model.name}
              </div>
              <div style={{ fontSize: 12, color: isDark ? '#4E5969' : '#86909C', marginTop: 2 }}>
                {model.provider}
              </div>
            </div>
          </div>
          <Tag
            color={cfg.color}
            style={{ borderRadius: 12, fontWeight: 500, margin: 0, flexShrink: 0 }}
          >
            {t(cfg.labelKey)}
          </Tag>
        </div>
      </div>

      {/* 卡片内容 */}
      <div style={{ padding: '16px 20px', flex: 1 }}>
        {/* Model ID */}
        <div style={{ marginBottom: 14 }}>
          <Tooltip title="Model ID">
            <code
              style={{
                fontSize: 12,
                background: isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f5',
                color: isDark ? '#86909C' : '#4E5969',
                padding: '4px 10px',
                borderRadius: 6,
                display: 'inline-block',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                border: isDark ? '1px solid #3D3E40' : '1px solid #e8e8e8',
              }}
            >
              {model.modelId}
            </code>
          </Tooltip>
        </div>

        {/* 模型用途 */}
        <div style={{ marginBottom: 14 }}>
          <Tag color={useCaseMeta.accent} style={{ borderRadius: 6, color: useCaseMeta.accent, background: `${useCaseMeta.accent}12`, borderColor: `${useCaseMeta.accent}33` }}>
            {formatModelUseCaseLabel(model.useCase)}
          </Tag>
          <Tag color="geekblue" style={{ borderRadius: 6 }}>
            {model.protocol || 'openai'}
          </Tag>
        </div>

        {/* 配置参数 - 横排图标布局 */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Tooltip title={t('system.model.timeout')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: isDark ? '#86909C' : '#4E5969' }}>
              <ClockCircleOutlined style={{ color: 'var(--color-primary)' }} />
              {model.timeoutSeconds ?? 60}s
            </span>
          </Tooltip>
          <Tooltip title={t('system.model.retryCount')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: isDark ? '#86909C' : '#4E5969' }}>
              <RetweetOutlined style={{ color: 'var(--color-warning)' }} />
              {t('system.model.retryCountValue', { count: model.retryCount ?? 3 })}
            </span>
          </Tooltip>
          {(model.inputPrice != null || model.outputPrice != null) && (
            <Tooltip title={t('system.model.priceInOut')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: isDark ? '#86909C' : '#4E5969' }}>
                <DollarOutlined style={{ color: 'var(--color-success)' }} />
                ${model.inputPrice ?? '-'}/{model.outputPrice ?? '-'}
              </span>
            </Tooltip>
          )}
          {model.maxQuotaTokens != null && (
            <Tooltip title="模型累计 Tokens 限额">
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: isDark ? '#86909C' : '#4E5969' }}>
                <ThunderboltOutlined style={{ color: 'var(--color-primary)' }} />
                {model.maxQuotaTokens}
              </span>
            </Tooltip>
          )}
        </div>

        {/* 连通性状态 */}
        <div style={{ marginTop: 10 }}>
          <Tooltip title={model.lastTestError ?? testStatusLabel}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: isDark ? '#86909C' : '#4E5969' }}>
              {testStatusIcon}
              {testStatusLabel}
            </span>
          </Tooltip>
        </div>

        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Tag color={(model.runtimeErrorRate1m ?? 0) >= 20 ? 'red' : (model.runtimeErrorRate1m ?? 0) >= 5 ? 'gold' : 'green'}>
            Error {(model.runtimeErrorRate1m ?? 0).toFixed(2)}%
          </Tag>
          <Tag color="blue">
            P95 {model.runtimeP95LatencyMs ?? 0}ms
          </Tag>
        </div>
      </div>

      {/* 操作按钮 */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: isDark ? '1px solid #313233' : '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: 4,
        }}
      >
        <Button
          size="small"
          type="text"
          icon={<ThunderboltOutlined />}
          loading={isTesting}
          onClick={() => onTest(model.id)}
          disabled={!canUpdate}
          style={{ color: 'var(--color-success)', fontWeight: 500 }}
        >
          {t('system.model.test')}
        </Button>
        <Button
          size="small"
          type="text"
          icon={<EditOutlined />}
          onClick={() => onEdit(model)}
          disabled={!canUpdate}
          style={{ color: 'var(--color-primary)', fontWeight: 500 }}
        >
          {t('common.edit')}
        </Button>
        <Popconfirm
          title={t('common.confirmDelete')}
          description={t('system.model.deleteConfirm', { name: model.name })}
          onConfirm={() => onConfirmDelete(model.id)}
          okText={t('common.delete')}
          cancelText={t('common.cancel')}
          okButtonProps={{ danger: true }}
          disabled={!canUpdate}
        >
          <Button size="small" type="text" danger icon={<DeleteOutlined />} disabled={!canUpdate} style={{ fontWeight: 500 }}>
            {t('common.delete')}
          </Button>
        </Popconfirm>
        {model.status === 'active' && (
          <Button
            size="small"
            type="text"
            icon={<StopOutlined />}
            onClick={() => onDisable(model)}
            disabled={!canUpdate}
            style={{ color: 'var(--color-warning)', fontWeight: 500 }}
          >
            {t('system.model.disable')}
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function ModelCardList({
  models,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
}: ModelCardListProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const { theme } = useAppStore();
  const { hasPermission } = useAuthStore();
  const canUpdate = hasPermission('system:config:update');
  const isDark = theme === 'dark';
  const deleteMutation = useDeleteAiModel();
  const disableMutation = useDisableAiModel();
  const testMutation = useTestModelConnectivity();
  const { data: routes = [] } = useRoutes();
  const { data: modelGroups = [] } = useModelGroups();
  const pagedModels = models.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(models.length / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [models.length, page, pageSize]);

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      message.success(t('system.model.deleteSuccess'));
      onDelete(id);
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await testMutation.mutateAsync(id);
      const result = (res as {
        data?: {
          status?: string;
          latencyMs?: number;
          errorMessage?: string;
          errorCode?: string;
        };
      }).data;
      if (result?.status === 'success') {
        message.success(t('system.model.testSuccessWithLatency', { latency: result.latencyMs }));
      } else {
        message.error(t('system.model.testFailWithReason', {
          reason: result?.errorMessage ?? result?.errorCode ?? t('system.model.unknownError'),
        }));
      }
    } catch {
      message.error(t('system.model.testRequestFail'));
    } finally {
      setTestingId(null);
    }
  };

  const findModelReferences = (modelId: string) => {
    const routeNames = routes
      .filter((route) => [route.primaryModelId, route.secondaryModelId, route.tertiaryModelId].includes(modelId))
      .map((route) => route.name);
    const groupNames = modelGroups
      .filter((group) => group.items?.some((item) => item.modelId === modelId))
      .map((group) => group.name);
    return { routeNames, groupNames };
  };

  const handleDisable = (model: AiModel) => {
    const { routeNames, groupNames } = findModelReferences(model.id);
    const hasReferences = routeNames.length > 0 || groupNames.length > 0;
    const hasRuntimeTraffic = (model.runtimeRequestCount1m ?? 0) > 0;
    Modal.confirm({
      title: t('system.model.disableConfirmTitle'),
      content: hasReferences || hasRuntimeTraffic ? (
        <Space direction="vertical" size={8}>
          {hasRuntimeTraffic && <span>{t('system.model.disableRuntimeWarning', { count: model.runtimeRequestCount1m })}</span>}
          <span>{t('system.model.disableReferenceWarning')}</span>
          {routeNames.length > 0 && <span>{t('system.model.disableRouteRefs', { names: routeNames.join('、') })}</span>}
          {groupNames.length > 0 && <span>{t('system.model.disableGroupRefs', { names: groupNames.join('、') })}</span>}
        </Space>
      ) : t('system.model.disableConfirm', { name: model.name }),
      okText: t('system.model.disable'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        await disableMutation.mutateAsync(model.id);
        message.success(t('system.model.disableSuccess'));
      },
    });
  };

  const columns: ColumnsType<AiModel> = [
    {
      title: t('system.model.modelName'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space size={8}>
          <AiModelIcon
            modelId={record.modelId}
            modelName={record.name}
            provider={record.provider}
            providerCode={record.providerCode}
            size={18}
            type="color"
          />
          <span style={{ fontWeight: 500, color: isDark ? '#F2F3F5' : '#1D2129' }} className="truncate block max-w-xs">{name}</span>
        </Space>
      ),
    },
    {
      title: t('system.model.provider'),
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string, record) => (
        <Space size={8}>
          <AiModelIcon
            modelId={record.modelId}
            modelName={record.name}
            provider={record.provider}
            providerCode={record.providerCode}
            size={16}
            type="color"
          />
          <span>{provider}</span>
        </Space>
      ),
    },
    {
      title: t('system.model.protocol'),
      dataIndex: 'protocol',
      key: 'protocol',
      render: (protocol: string) => <Tag color="geekblue">{protocol || 'openai'}</Tag>,
    },
    {
      title: '模型用途',
      dataIndex: 'useCase',
      key: 'useCase',
      render: (useCase: string) => {
        const meta = getModelUseCaseMeta(useCase);
        const Icon = meta.icon as ComponentType;
        return (
          <Tag color="default" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon />
            {formatModelUseCaseLabel(useCase)}
          </Tag>
        );
      },
    },
    {
      title: t('system.model.modelId'),
      dataIndex: 'modelId',
      key: 'modelId',
      render: (modelId: string) => (
        <code
          style={{
            fontSize: 12,
            background: isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f5',
            color: isDark ? '#86909C' : '#4E5969',
            padding: '2px 8px',
            borderRadius: 4,
          }}
        >
          {modelId}
        </code>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const cfg = STATUS_CONFIG[status] ?? { color: 'default', labelKey: status };
        return <Tag color={cfg.color}>{t(cfg.labelKey)}</Tag>;
      },
    },
    {
      title: '实时指标',
      key: 'runtimeMetrics',
      render: (_: unknown, record: AiModel) => (
        <Space size={[4, 4]} wrap>
          <Tag color={(record.runtimeErrorRate1m ?? 0) >= 20 ? 'red' : (record.runtimeErrorRate1m ?? 0) >= 5 ? 'gold' : 'green'}>
            Error {(record.runtimeErrorRate1m ?? 0).toFixed(2)}%
          </Tag>
          <Tag color="blue">P95 {record.runtimeP95LatencyMs ?? 0}ms</Tag>
        </Space>
      ),
    },
    { title: t('system.model.timeoutSeconds'), dataIndex: 'timeoutSeconds', key: 'timeoutSeconds', render: (v: number) => v ?? 60 },
    { title: t('system.model.retryCount'), dataIndex: 'retryCount', key: 'retryCount', render: (v: number) => v ?? 3 },
    {
      title: t('common.actions'),
      key: 'action',
      render: (_: unknown, record: AiModel) => (
        <Space>
          <Button
            type="link" size="small"
            icon={<ThunderboltOutlined />}
            loading={testingId === record.id}
            onClick={() => handleTest(record.id)}
            disabled={!canUpdate}
          >
            {t('system.model.test')}
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} disabled={!canUpdate}>
            {t('common.edit')}
          </Button>
          {record.status === 'active' && (
            <Button type="link" size="small" icon={<StopOutlined />} onClick={() => handleDisable(record)} disabled={!canUpdate}>
              {t('system.model.disable')}
            </Button>
          )}
          <Popconfirm
            title={t('common.confirmDelete')}
            description={t('system.model.deleteConfirm', { name: record.name })}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.delete')}
            cancelText={t('common.cancel')}
            okButtonProps={{ danger: true }}
            disabled={!canUpdate}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={!canUpdate}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 顶部操作栏 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <span style={{ fontSize: 14, color: isDark ? '#86909C' : '#4E5969' }}>
          {t('system.model.totalCount', { count: models.length })}
        </span>
        <Space>
          <Button
            size="small"
            type={viewMode === 'card' ? 'primary' : 'default'}
            icon={<AppstoreOutlined />}
            onClick={() => setViewMode('card')}
          />
          <Button
            size="small"
            type={viewMode === 'list' ? 'primary' : 'default'}
            icon={<UnorderedListOutlined />}
            onClick={() => setViewMode('list')}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd} disabled={!canUpdate}>
            {t('system.model.addModel')}
          </Button>
        </Space>
      </div>

      {/* 卡片视图 */}
      {viewMode === 'card' && (
        <>
          {isLoading ? (
            <Row gutter={[20, 20]}>
              {[1, 2, 3].map((i) => (
                <Col key={i} xs={24} sm={12} md={12} lg={12} xl={8} xxl={6}>
                  <Card style={{ borderRadius: 12 }}>
                    <Skeleton active avatar paragraph={{ rows: 3 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : models.length === 0 ? (
            <Empty description={t('system.model.empty')} />
          ) : (
            <>
              <Row gutter={[20, 20]}>
                {pagedModels.map((model) => (
                  <Col key={model.id} xs={24} sm={12} md={12} lg={12} xl={8} xxl={6}>
                    <ModelCard
                      model={model}
                      onEdit={onEdit}
                      onConfirmDelete={handleDelete}
                      onDisable={handleDisable}
                      onTest={handleTest}
                      isTesting={testingId === model.id}
                      isDark={isDark}
                      canUpdate={canUpdate}
                    />
                  </Col>
                ))}
              </Row>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={models.length}
                  showSizeChanger
                  showTotal={(total) => t('common.total', { total })}
                  onChange={(nextPage, nextPageSize) => {
                    setPage(nextPage);
                    setPageSize(nextPageSize);
                  }}
                />
              </div>
            </>
          )}
        </>
      )}

      {/* 列表视图 */}
      {viewMode === 'list' && (
        <Table
          columns={columns}
          dataSource={pagedModels}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: models.length,
            showSizeChanger: true,
            showTotal: (total) => t('common.total', { total }),
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
          scroll={{ x: 900 }}
          locale={{ emptyText: t('system.model.empty') }}
        />
      )}
    </div>
  );
}

/**
 * 路由规则列表组件
 * 表格展示路由规则，支持降级链路可视化和删除操作
 */
import { Alert, Button, Table, Tag, Tooltip, Popconfirm, message, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDeleteRoute } from '@/api/system';
import { useAuthStore } from '@/store/useAuthStore';
import type { AiModel, AiModelRoute } from '@/types/system';

interface RouteRuleListProps {
  routes: AiModelRoute[];
  isLoading: boolean;
  models: AiModel[];
  onAdd: () => void;
  onEdit: (r: AiModelRoute) => void;
  onDelete: (id: string) => void;
}

/** 匹配维度 Tag 颜色 */
const DIMENSION_COLOR: Record<string, string> = {
  task_type: 'blue',
  model_capability: 'purple',
  cost_budget: 'orange',
};

/** 状态颜色映射 */
const STATUS_COLOR: Record<string, string> = {
  active: 'green',
  ACTIVE: 'green',
  inactive: 'default',
  INACTIVE: 'default',
  error: 'red',
  ERROR: 'red',
};

/** 根据模型 ID 查找模型名称 */
function getModelName(modelId: string | undefined, models: AiModel[]): string | undefined {
  if (!modelId) return undefined;
  const found = models.find((m) => m.id === modelId);
  return found?.name;
}

/** 降级链路显示组件 */
function FallbackChain({
  route,
  models,
  t,
}: {
  route: AiModelRoute;
  models: AiModel[];
  t: (key: string, options?: any) => string;
}) {
  /* 优先使用后端返回的 name 字段，fallback 到本地 models 查找 */
  const primaryName =
    route.primaryModelName || getModelName(route.primaryModelId, models) || route.primaryModelId;
  const secondaryName =
    route.secondaryModelName || getModelName(route.secondaryModelId, models);
  const tertiaryName =
    route.tertiaryModelName || getModelName(route.tertiaryModelId, models);

  const triggerCondition = route.primaryTriggerCondition;
  const tooltipContent = triggerCondition
    ? t('system.route.triggerCondition', {
      timeout: triggerCondition.timeoutMs ?? '-',
      errorRate: triggerCondition.errorRatePercent ?? '-',
    })
    : t('system.route.noTriggerCondition');

  return (
    <div className="flex items-center flex-wrap gap-1">
      {/* 主模型 */}
      <Tooltip title={t('system.route.primaryModelId', { id: route.primaryModelId })}>
        <Tag color="blue" className="cursor-default">
          {primaryName}
        </Tag>
      </Tooltip>

      {/* 主 → 备用 */}
      {secondaryName && (
        <>
          <Tooltip title={tooltipContent}>
            <ArrowRightOutlined className="text-gray-400 text-xs cursor-help" />
          </Tooltip>
          <Tooltip title={t('system.route.secondaryModelId', { id: route.secondaryModelId })}>
            <Tag color="cyan" className="cursor-default">
              {secondaryName}
            </Tag>
          </Tooltip>
        </>
      )}

      {/* 备用 → 三级兜底 */}
      {tertiaryName && (
        <>
          <ArrowRightOutlined className="text-gray-400 text-xs" />
          <Tooltip title={t('system.route.tertiaryModelId', { id: route.tertiaryModelId })}>
            <Tag color="geekblue" className="cursor-default">
              {tertiaryName}
            </Tag>
          </Tooltip>
        </>
      )}
    </div>
  );
}

export default function RouteRuleList({
  routes,
  isLoading,
  models,
  onAdd,
  onEdit,
  onDelete,
}: RouteRuleListProps) {
  const { t } = useTranslation();
  const { hasPermission } = useAuthStore();
  const canUpdate = hasPermission('system:config:update');
  const deleteMutation = useDeleteRoute();
  const dimensionLabel: Record<string, string> = {
    task_type: t('system.route.dimensionTaskType'),
    model_capability: t('system.route.dimensionModelCapability'),
    cost_budget: t('system.route.dimensionCostBudget'),
  };
  const statusLabel: Record<string, string> = {
    active: t('common.enabled'),
    ACTIVE: t('common.enabled'),
    inactive: t('common.disabled'),
    INACTIVE: t('common.disabled'),
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      message.success(t('system.route.deleteSuccess'));
      onDelete(id);
    } catch {
      message.error(t('common.error'));
    }
  };

  const columns: ColumnsType<AiModelRoute> = [
    {
      title: t('system.route.ruleName'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{name}</span>
      ),
    },
    {
      title: t('system.route.priority'),
      dataIndex: 'priority',
      key: 'priority',
      sorter: (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
      render: (priority: number) => (
        <span className="font-mono text-sm">{priority ?? '-'}</span>
      ),
    },
    {
      title: t('system.route.matchDimension'),
      dataIndex: 'matchDimension',
      key: 'matchDimension',
      render: (dimension: string) => (
        <Tag color={DIMENSION_COLOR[dimension] ?? 'default'}>
          {dimensionLabel[dimension] ?? dimension}
        </Tag>
      ),
    },
    {
      title: t('system.route.fallbackChain'),
      key: 'fallbackChain',
      render: (_: unknown, record: AiModelRoute) => (
        <FallbackChain route={record} models={models} t={t} />
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_COLOR[status] ?? 'default'}>
          {statusLabel[status] ?? status}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'action',
      render: (_: unknown, record: AiModelRoute) => (
        <div className="flex gap-2">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            disabled={!canUpdate}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('common.confirmDelete')}
            description={t('system.route.deleteConfirm', { name: record.name })}
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
        </div>
      ),
    },
  ];

  return (
    <div>
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message="路由规则说明"
        description="当 Agent 绑定的是单个模型时，如果主模型调用失败，会按这里配置的主模型 → 备用模型 → 兜底模型顺序依次降级。"
      />

      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {t('system.route.totalRules', { count: routes.length })}
        </span>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAdd}
          disabled={!canUpdate}
          className="gradient-primary"
          style={{ border: 'none' }}
        >
          {t('system.route.addRule')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={routes}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        locale={{
          emptyText: <Empty description={t('system.route.empty')} />,
        }}
      />
    </div>
  );
}

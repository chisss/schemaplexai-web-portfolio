/**
 * 路由规则创建/编辑 Modal 组件
 * 支持三级降级模型配置，触发条件通过两个输入字段展示
 */
import { useEffect } from 'react';
import { Alert, Modal, Form, Input, Select, InputNumber, Space, Typography, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCreateRoute, useUpdateRoute } from '@/api/system';
import AiModelIcon from '@/components/model/AiModelIcon';
import type { AiModel, AiModelRoute } from '@/types/system';
import { formatModelUseCaseLabel, isSameUseCase } from '@/utils/aiModel';

interface RouteRuleFormModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  models: AiModel[];
  editingRoute?: AiModelRoute;
}

export default function RouteRuleFormModal({
  open,
  onCancel,
  onSuccess,
  models,
  editingRoute,
}: RouteRuleFormModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const isEdit = !!editingRoute;
  const primaryModelId = Form.useWatch('primaryModelId', form);

  /** 匹配维度选项（依赖 t） */
  const MATCH_DIMENSION_OPTIONS = [
    { label: t('system.route.matchDimTaskType'), value: 'task_type' },
    { label: t('system.route.matchDimModelCap'), value: 'model_capability' },
    { label: t('system.route.matchDimCostBudget'), value: 'cost_budget' },
  ];

  const createMutation = useCreateRoute();
  const updateMutation = useUpdateRoute();

  const loading = createMutation.isPending || updateMutation.isPending;
  const { Text } = Typography;

  const primaryModel = models.find((model) => model.id === primaryModelId);
  const selectableModels = primaryModel
    ? models.filter((model) => isSameUseCase(model.useCase, primaryModel.useCase))
    : models;

  /* 构建模型下拉选项 */
  const modelOptions = selectableModels.map((m) => ({
    label: (
      <Space size={8}>
        <AiModelIcon
          modelId={m.modelId}
          modelName={m.name}
          provider={m.provider}
          providerCode={m.providerCode}
          size={18}
          type="color"
        />
        <span>{m.name} ({m.modelId})</span>
      </Space>
    ),
    searchText: `${m.name} ${m.modelId} ${m.provider ?? ''}`,
    value: m.id,
  }));
  const primaryModelOptions = models.map((m) => ({
    label: (
      <div className="flex items-center justify-between gap-3">
        <Space size={8}>
          <AiModelIcon
            modelId={m.modelId}
            modelName={m.name}
            provider={m.provider}
            providerCode={m.providerCode}
            size={18}
            type="color"
          />
          <span>{m.name}</span>
        </Space>
        <Text type="secondary" className="text-xs">{formatModelUseCaseLabel(m.useCase)}</Text>
      </div>
    ),
    searchText: `${m.name} ${m.modelId} ${m.provider ?? ''} ${formatModelUseCaseLabel(m.useCase)}`,
    value: m.id,
  }));

  /* 编辑时回填数据 */
  useEffect(() => {
    if (open) {
      if (editingRoute) {
        const triggerCondition = editingRoute.primaryTriggerCondition ?? {};
        form.setFieldsValue({
          name: editingRoute.name,
          priority: editingRoute.priority ?? 100,
          matchDimension: editingRoute.matchDimension,
          primaryModelId: editingRoute.primaryModelId,
          secondaryModelId: editingRoute.secondaryModelId,
          tertiaryModelId: editingRoute.tertiaryModelId,
          triggerTimeoutMs: triggerCondition.timeoutMs,
          triggerErrorRatePercent: triggerCondition.errorRatePercent,
          description: editingRoute.description,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ priority: 100 });
      }
    }
  }, [open, editingRoute, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      /* 组装 primaryTriggerCondition */
      const primaryTriggerCondition: Record<string, number> = {};
      if (values.triggerTimeoutMs != null) {
        primaryTriggerCondition.timeoutMs = values.triggerTimeoutMs;
      }
      if (values.triggerErrorRatePercent != null) {
        primaryTriggerCondition.errorRatePercent = values.triggerErrorRatePercent;
      }

      const payload = {
        name: values.name,
        priority: values.priority,
        matchDimension: values.matchDimension,
        primaryModelId: values.primaryModelId,
        secondaryModelId: values.secondaryModelId || undefined,
        tertiaryModelId: values.tertiaryModelId || undefined,
        primaryTriggerCondition:
          Object.keys(primaryTriggerCondition).length > 0
            ? primaryTriggerCondition
            : undefined,
        description: values.description || undefined,
      };

      if (isEdit && editingRoute) {
        await updateMutation.mutateAsync({ id: editingRoute.id, data: payload });
        message.success(t('system.route.updateSuccess'));
      } else {
        await createMutation.mutateAsync(payload);
        message.success(t('system.route.createSuccess'));
      }

      onSuccess();
    } catch {
      /* 表单校验失败时静默处理 */
    }
  };

  return (
    <Modal
      title={isEdit ? t('system.route.editTitle') : t('system.route.createTitle')}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={680}
      destroyOnHidden
      okText={isEdit ? t('common.save') : t('common.create')}
      cancelText={t('common.cancel')}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        className="mt-4"
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="路由规则使用说明"
          description="当 Agent 绑定的是单个模型时，模型调用失败会按这里配置的降级链路继续尝试。每条链路只允许使用同一 use_case 的模型。"
        />

        {/* 基础信息 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Form.Item
            label={t('system.route.name')}
            name="name"
            rules={[{ required: true, message: t('system.route.nameRequired') }]}
          >
            <Input placeholder={t('system.route.namePlaceholder')} />
          </Form.Item>

          <Form.Item
            label={t('system.route.priority')}
            name="priority"
            
          >
            <InputNumber min={1} max={9999} className="w-full" />
          </Form.Item>
        </div>

        <Form.Item
          label={t('system.route.matchDimension')}
          name="matchDimension"
          rules={[{ required: true, message: t('system.route.matchDimRequired') }]}
        >
          <Select placeholder={t('system.route.matchDimensionPlaceholder')} options={MATCH_DIMENSION_OPTIONS} />
        </Form.Item>

        {/* 降级链路 */}
        <Form.Item
          label={t('system.route.primaryModel')}
          name="primaryModelId"
          rules={[{ required: true, message: t('system.route.primaryModelRequired') }]}
          extra={primaryModel ? `当前链路用途：${formatModelUseCaseLabel(primaryModel.useCase)}` : '请选择主模型后，备用/兜底模型将自动限制为同一用途'}
        >
          <Select
            showSearch
            placeholder={t('system.route.primaryModelPlaceholder')}
            options={primaryModelOptions}
            optionFilterProp="searchText"
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item label={t('system.route.secondaryModel')} name="secondaryModelId">
            <Select
              showSearch
              allowClear
              placeholder={t('system.route.secondaryModelPlaceholder')}
              options={modelOptions}
              optionFilterProp="searchText"
            />
          </Form.Item>

          <Form.Item label={t('system.route.tertiaryModel')} name="tertiaryModelId">
            <Select
              showSearch
              allowClear
              placeholder={t('system.route.tertiaryModelPlaceholder')}
              options={modelOptions}
              optionFilterProp="searchText"
            />
          </Form.Item>
        </div>

        {/* 主模型触发条件 */}
        <div
          className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50"
        >
          <div className="text-sm font-medium text-gray-600 mb-3">
            {t('system.route.triggerConditionTitle')}
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              label={t('system.route.timeoutThreshold')}
              name="triggerTimeoutMs"
              className="mb-0"
            >
              <InputNumber
                min={100}
                step={100}
                className="w-full"
                placeholder={t('system.route.timeoutPlaceholder')}
              />
            </Form.Item>
            <Form.Item
              label={t('system.route.errorRateThreshold')}
              name="triggerErrorRatePercent"
              className="mb-0"
            >
              <InputNumber
                min={0}
                max={100}
                step={1}
                className="w-full"
                placeholder={t('system.route.errorRatePlaceholder')}
              />
            </Form.Item>
          </div>
        </div>

        {/* 描述 */}
        <Form.Item label={t('common.description')} name="description">
          <Input.TextArea
            rows={3}
            placeholder={t('system.route.descriptionPlaceholder')}
            showCount
            maxLength={200}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/**
 * AI 模型创建/编辑 Modal 组件
 * - 供应商从字典 ai_model_provider 加载，选中后自动填充 baseUrl 和 useCase
 * - 模型版本从字典 ai_model_versions_{provider} 加载，支持下拉选择或自定义输入
 * - 连通性测试：编辑模式直接测试，创建模式在表单填写后可预测试
 */
import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, message, Button, Space, Tag, Switch } from 'antd';
import { ThunderboltOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCreateAiModel, useUpdateAiModel, useTestModelConnectivity, useDictItems } from '@/api/system';
import AiModelIcon from '@/components/model/AiModelIcon';
import type { AiModel, AiModelCreateDTO, AiModelUpdateDTO, ConnectivityTestResult } from '@/types/system';

const DOUBAO_MULTIMODAL_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3/embeddings/multimodal';
const DOUBAO_EMBEDDING_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3/embeddings';
const PROTOCOL_OPTIONS = [
  { label: 'OpenAI 协议', value: 'openai' },
  { label: 'Anthropic 协议', value: 'anthropic' },
];

const EXTRA_PROVIDER_OPTIONS = [
  'Claude', 'Ollama', 'Azure', 'Meta', 'Midjourney', 'HuggingFace', 'ByteDance', 'OpenRouter',
  'Cohere', 'Zhipu', 'Grok', 'Bedrock', 'BaiLian', 'Hunyuan', 'LlamaIndex', 'Minimax', 'New API',
  'opencode', 'Stepfun', 'Yuanbao',
];

const normalizeProviderValue = (value: string) => value.replace(/\s+/g, '');

const isImageUseCase = (value?: string) => {
  const normalized = (value ?? '').toLowerCase();
  return normalized.includes('image') || normalized.includes('生图');
};

interface ModelFormModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  editingModel?: AiModel;
}

export default function ModelFormModal({
  open,
  onCancel,
  onSuccess,
  editingModel,
}: ModelFormModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const isEdit = !!editingModel;

  const [testResult, setTestResult] = useState<ConnectivityTestResult | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [modelIdMode, setModelIdMode] = useState<'select' | 'input'>('select');
  const selectedUseCase = Form.useWatch('useCase', form);

  const { data: providerItems = [] } = useDictItems('ai_model_provider');
  const { data: useCaseItems = [] } = useDictItems('ai_model_use_case');
  const { data: versionItems = [] } = useDictItems(
    selectedProvider ? `ai_model_versions_${selectedProvider.toLowerCase()}` : ''
  );

  const createMutation = useCreateAiModel();
  const updateMutation = useUpdateAiModel();
  const testMutation = useTestModelConnectivity();

  const loading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setTestResult(null);
      if (editingModel) {
        setSelectedProvider(editingModel.provider ?? '');
        form.setFieldsValue({
          name: editingModel.name,
          provider: editingModel.provider,
          protocol: editingModel.protocol ?? 'openai',
          modelId: editingModel.modelId,
          useCase: editingModel.useCase ?? '',
          apiKey: '',
          baseUrl: editingModel.baseUrl,
          timeoutSeconds: editingModel.timeoutSeconds ?? 60,
          retryCount: editingModel.retryCount ?? 3,
          retryIntervalSeconds: editingModel.retryIntervalSeconds ?? 5,
          maxTokens: editingModel.maxTokens,
          maxQuotaTokens: editingModel.maxQuotaTokens,
          multimodal: editingModel.multimodal ?? false,
          inputPrice: editingModel.inputPrice,
          outputPrice: editingModel.outputPrice,
          imagePrice: editingModel.imagePrice,
        });
      } else {
        setSelectedProvider('');
        form.resetFields();
        form.setFieldsValue({ protocol: 'openai', timeoutSeconds: 60, retryCount: 3, retryIntervalSeconds: 5 });
      }
    }
  }, [open, editingModel, form]);

  const handleProviderChange = (value: string) => {
    setSelectedProvider(value);
    const item = providerItems.find((p) => p.itemValue === value);
    if (item?.extra?.apiUrl) {
      const apiUrl = item.extra?.apiUrl as string | undefined;
      form.setFieldValue('baseUrl', apiUrl);
    } else if (value.toLowerCase() === 'doubao') {
      form.setFieldValue('baseUrl', DOUBAO_EMBEDDING_BASE_URL);
    }
    form.setFieldValue('modelId', undefined);
    setModelIdMode('select');
  };

  const handleModelIdChange = (value?: string) => {
    if (!value) {
      return;
    }
    if (value.toLowerCase().includes('embedding') && !form.getFieldValue('useCase')) {
      form.setFieldValue('useCase', 'embedding');
    }
    if (value.toLowerCase() === 'doubao-embedding-vision-251215') {
      form.setFieldsValue({
        baseUrl: DOUBAO_MULTIMODAL_BASE_URL,
      });
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (isEdit && editingModel) {
        const updateData: AiModelUpdateDTO = {
          name: values.name,
          provider: values.provider,
          providerCode: values.provider,
          protocol: values.protocol,
          modelId: values.modelId,
          useCase: values.useCase || undefined,
          baseUrl: values.baseUrl || undefined,
          timeoutSeconds: values.timeoutSeconds,
          retryCount: values.retryCount,
          retryIntervalSeconds: values.retryIntervalSeconds,
          maxTokens: values.maxTokens || undefined,
          maxQuotaTokens: values.maxQuotaTokens || undefined,
          inputPrice: values.inputPrice || undefined,
          outputPrice: values.outputPrice || undefined,
          imagePrice: values.imagePrice || undefined,
          multimodal: values.multimodal ?? false,
        };
        if (values.apiKey) updateData.apiKey = values.apiKey;
        await updateMutation.mutateAsync({ id: editingModel.id, data: updateData });
        message.success(t('system.model.updateSuccess'));
      } else {
        const createData: AiModelCreateDTO = {
          name: values.name,
          provider: values.provider,
          providerCode: values.provider,
          protocol: values.protocol,
          modelId: values.modelId,
          apiKey: values.apiKey,
          useCase: values.useCase || undefined,
          baseUrl: values.baseUrl || undefined,
          timeoutSeconds: values.timeoutSeconds,
          retryCount: values.retryCount,
          retryIntervalSeconds: values.retryIntervalSeconds,
          maxTokens: values.maxTokens || undefined,
          maxQuotaTokens: values.maxQuotaTokens || undefined,
          inputPrice: values.inputPrice || undefined,
          outputPrice: values.outputPrice || undefined,
          imagePrice: values.imagePrice || undefined,
          multimodal: values.multimodal ?? false,
        };
        await createMutation.mutateAsync(createData);
        message.success(t('system.model.createSuccess'));
      }
      onSuccess();
    } catch {
      /* 表单校验失败时不做额外处理 */
    }
  };

  const handleTest = async () => {
    if (!editingModel?.id) return;
    try {
      const res = await testMutation.mutateAsync(editingModel.id);
      setTestResult(res.data);
    } catch {
      message.error(t('system.model.testRequestFail'));
    }
  };

  const providerMap = new Map(providerItems.map((item) => [normalizeProviderValue(item.itemValue).toLowerCase(), item]));
  const mergedProviderItems = [
    ...providerItems,
    ...EXTRA_PROVIDER_OPTIONS
      .filter((label) => !providerMap.has(normalizeProviderValue(label).toLowerCase()))
      .map((label, index) => ({
        itemLabel: label,
        itemValue: normalizeProviderValue(label),
        sortOrder: providerItems.length + index + 1,
      })),
  ];

  const providerOptions = mergedProviderItems.map((item) => ({
    label: (
      <Space size={8}>
        <AiModelIcon provider={item.itemValue} providerCode={item.itemValue} size={18} type="color" />
        <span>{item.itemLabel}</span>
      </Space>
    ),
    searchText: `${item.itemLabel} ${item.itemValue}`,
    value: item.itemValue,
  }));

  const useCaseOptions = useCaseItems.map((item) => ({
    label: item.itemLabel,
    value: item.itemValue,
  }));

  const versionOptions = versionItems.map((item) => ({
    label: (
      <Space size={8}>
        <AiModelIcon
          modelId={item.itemValue}
          modelName={item.itemLabel}
          provider={selectedProvider}
          providerCode={selectedProvider}
          size={18}
          type="color"
        />
        <span>{item.itemLabel} ({item.itemValue})</span>
      </Space>
    ),
    searchText: `${item.itemLabel} ${item.itemValue} ${selectedProvider}`,
    value: item.itemValue,
  }));

  return (
    <Modal
      title={isEdit ? t('system.model.editTitle') : t('system.model.createTitle')}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={680}
      destroyOnHidden
      okText={isEdit ? t('common.save') : t('common.create')}
      cancelText={t('common.cancel')}
    >
      <Form form={form} layout="vertical" requiredMark="optional" className="mt-4">

        {/* 基础信息 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Form.Item
            label={t('system.model.name')}
            name="name"
            rules={[{ required: true, message: t('system.model.nameRequired') }]}
          >
            <Input placeholder={t('system.model.nameExample')} />
          </Form.Item>

          <Form.Item
            label={t('system.model.provider')}
            name="provider"
            rules={[{ required: true, message: t('system.model.providerRequired') }]}
          >
            <Select
              placeholder={t('system.model.providerPlaceholder')}
              options={providerOptions}
              onChange={handleProviderChange}
              showSearch
              optionFilterProp="searchText"
            />
          </Form.Item>

          <Form.Item
            label={t('system.model.protocol')}
            name="protocol"
            rules={[{ required: true, message: t('system.model.protocolRequired') }]}
          >
            <Select options={PROTOCOL_OPTIONS} placeholder={t('system.model.protocolPlaceholder')} />
          </Form.Item>
        </div>

        {/* 模型用途分类 */}
        <Form.Item label={t('system.model.useCase')} name="useCase">
          <Select
            placeholder={t('system.model.useCasePlaceholder')}
            options={useCaseOptions}
            allowClear
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        {/* 模型版本 */}
        <Form.Item
          label={
            <Space>
              <span>{t('system.model.modelId')}</span>
              {versionItems.length > 0 && (
                <Button
                  type="link"
                  size="small"
                  className="p-0 h-auto text-xs"
                  onClick={() => setModelIdMode((m) => (m === 'select' ? 'input' : 'select'))}
                >
                  {modelIdMode === 'select' ? t('system.model.customInput') : t('system.model.selectVersion')}
                </Button>
              )}
            </Space>
          }
          name="modelId"
          rules={[{ required: true, message: t('system.model.modelIdRequired') }]}
        >
          {modelIdMode === 'select' && versionItems.length > 0 ? (
            <Select
              placeholder={t('system.model.versionPlaceholder')}
              options={versionOptions}
              showSearch
              optionFilterProp="searchText"
              onChange={handleModelIdChange}
            />
          ) : (
            <Input placeholder={t('system.model.modelIdExample')} onChange={(e) => handleModelIdChange(e.target.value)} />
          )}
        </Form.Item>

        {/* API Key + 连通性测试 */}
        <Form.Item
          label={
            <Space>
              <span>{t('system.model.apiKey')}</span>
              {isEdit && (
                <Button
                  type="link"
                  size="small"
                  icon={<ThunderboltOutlined />}
                  loading={testMutation.isPending}
                  onClick={handleTest}
                  className="p-0 h-auto"
                >
                  {t('system.model.testConnectivity')}
                </Button>
              )}
            </Space>
          }
          name="apiKey"
          rules={isEdit ? [] : [{ required: true, message: t('system.model.apiKeyRequired') }]}
        >
          <Input.Password
            placeholder={isEdit ? t('system.model.apiKeyKeepEmpty') : t('system.model.apiKeyRequired')}
            autoComplete="new-password"
          />
        </Form.Item>

        {/* 连通性测试结果 */}
        {testResult && (
          <div
            className="mb-4 p-3 rounded border"
            style={{
              borderColor: testResult.status === 'success' ? '#b7eb8f' : '#ffa39e',
              background: testResult.status === 'success' ? '#f6ffed' : '#fff2f0',
            }}
          >
            <Space wrap>
              {testResult.status === 'success' ? (
                <Tag icon={<CheckCircleOutlined />} color="success">{t('system.model.connectivitySuccess')}</Tag>
              ) : (
                <Tag icon={<CloseCircleOutlined />} color="error">
                  {testResult.status === 'timeout' ? t('system.model.timeoutShort') : t('system.model.failShort')}
                </Tag>
              )}
              {testResult.latencyMs !== undefined && (
                <span className="text-xs text-gray-500">{testResult.latencyMs}ms</span>
              )}
              {testResult.modelName && (
                <span className="text-xs text-gray-500">{t('system.model.modelLabel')}{testResult.modelName}</span>
              )}
              {testResult.errorMessage && (
                <span className="text-xs text-red-500">{testResult.errorMessage}</span>
              )}
            </Space>
          </div>
        )}

        <Form.Item label={t('system.model.baseUrl')} name="baseUrl">
          <Input placeholder={t('system.model.baseUrlExample')} />
        </Form.Item>

        <Form.Item
          label={t('system.model.multimodal')}
          name="multimodal"
          valuePropName="checked"
          extra={t('system.model.multimodalExtra')}
        >
          <Switch />
        </Form.Item>

        {/* 请求配置 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
          <Form.Item label={t('system.model.timeout')} name="timeoutSeconds">
            <InputNumber min={1} max={600} className="w-full" />
          </Form.Item>
          <Form.Item label={t('system.model.retryCount')} name="retryCount">
            <InputNumber min={0} max={10} className="w-full" />
          </Form.Item>
          <Form.Item label={t('system.model.retryInterval')} name="retryIntervalSeconds">
            <InputNumber min={1} max={60} className="w-full" />
          </Form.Item>
        </div>

        {/* 计费配置 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
          <Form.Item label={t('system.model.maxTokens')} name="maxTokens">
            <InputNumber min={1} className="w-full" placeholder={t('system.model.unlimited')} />
          </Form.Item>
          <Form.Item
            label={t('system.model.maxQuotaTokens')}
            name="maxQuotaTokens"
            extra={t('system.model.maxQuotaTokensExtra')}
            rules={[
              {
                validator: async (_, value) => {
                  if (value == null || value === '') {
                    return;
                  }
                  if (value <= 0) {
                    throw new Error(t('system.model.maxQuotaTokensInvalid'));
                  }
                },
              },
            ]}
          >
            <InputNumber min={1} max={1000000000} className="w-full" placeholder={t('system.model.maxQuotaTokensPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('system.model.inputPrice')} name="inputPrice" extra="$/1K tokens">
            <InputNumber min={0} step={0.001} className="w-full" placeholder={t('system.model.pricePlaceholder')} />
          </Form.Item>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Form.Item label={t('system.model.outputPrice')} name="outputPrice" extra="$/1K tokens">
            <InputNumber min={0} step={0.001} className="w-full" placeholder={t('system.model.pricePlaceholder')} />
          </Form.Item>
          {isImageUseCase(selectedUseCase) && (
            <Form.Item label={t('system.model.imagePrice')} name="imagePrice" extra={t('system.model.imagePriceExtra')}>
              <InputNumber min={0} step={0.001} className="w-full" placeholder={t('system.model.pricePlaceholder')} />
            </Form.Item>
          )}
        </div>
      </Form>
    </Modal>
  );
}

import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import MarkdownPreview from '@/components/MarkdownPreview/MarkdownPreview';
import PageContainer from '@/components/PageContainer/PageContainer';
import {
  useCreateMessageTemplate,
  useDeleteMessageTemplate,
  useMessageTemplateDefinitions,
  useMessageTemplates,
  useUpdateMessageTemplate,
} from '@/api/messageTemplate';
import { getChannelTypeOptions } from '@/pages/integration/channel/channelMeta';
import type {
  MessageTemplate,
  MessageTemplateCreateDTO,
  MessageTemplateDefinition,
  MessageTemplateQueryDTO,
  MessageTemplateUpdateDTO,
} from '@/types/integration';

const { Text } = Typography;
const { TextArea } = Input;
const VARIABLE_PATTERN = /\$\{([a-zA-Z0-9_]+)}/g;

function renderPreview(template: string, definition?: MessageTemplateDefinition) {
  if (!template) {
    return '';
  }
  const samples = Object.fromEntries(
    (definition?.supportedVariables ?? []).map((item) => [item.key, item.sampleValue ?? '-']),
  );
  return template.replace(VARIABLE_PATTERN, (_match, key) => samples[key] ?? '-');
}

export default function MessageTemplateList() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [query, setQuery] = useState<MessageTemplateQueryDTO>({ page: 1, size: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [selectedVariableKey, setSelectedVariableKey] = useState<string>();
  const { data: templateData, isLoading } = useMessageTemplates(query);
  const { data: definitions = [] } = useMessageTemplateDefinitions();
  const createMutation = useCreateMessageTemplate();
  const updateMutation = useUpdateMessageTemplate();
  const deleteMutation = useDeleteMessageTemplate();
  const currentTemplateType = Form.useWatch('templateType', form);
  const currentTitleTemplate = Form.useWatch('titleTemplate', form);
  const currentContentTemplate = Form.useWatch('contentTemplate', form);

  const definitionMap = useMemo(
    () => Object.fromEntries(definitions.map((item) => [item.templateType, item])),
    [definitions],
  );
  const currentDefinition = currentTemplateType ? definitionMap[currentTemplateType] : undefined;
  const templates = templateData?.records ?? [];
  const channelOptions = useMemo(() => getChannelTypeOptions(t), [t]);
  const channelLabelMap = useMemo(
    () => Object.fromEntries(channelOptions.map((item) => [item.value, item.label])),
    [channelOptions],
  );

  const openCreateModal = () => {
    setEditingTemplate(null);
    setSelectedVariableKey(undefined);
    form.resetFields();
    if (definitions[0]) {
      form.setFieldsValue({
        templateType: definitions[0].templateType,
        status: 'active',
        supportedChannels: [],
        titleTemplate: definitions[0].defaultTitleTemplate,
        contentTemplate: definitions[0].defaultContentTemplate,
      });
    }
    setModalOpen(true);
  };

  const openEditModal = (record: MessageTemplate) => {
    setEditingTemplate(record);
    setSelectedVariableKey(undefined);
    form.setFieldsValue({
      name: record.name,
      templateType: record.templateType,
      status: record.status,
      titleTemplate: record.titleTemplate,
      contentTemplate: record.contentTemplate,
      description: record.description,
      supportedChannels: record.supportedChannels ?? [],
    });
    setModalOpen(true);
  };

  const handleTemplateTypeChange = (templateType: string) => {
    const definition = definitionMap[templateType];
    if (!definition || editingTemplate) {
      return;
    }
    form.setFieldsValue({
      titleTemplate: definition.defaultTitleTemplate,
      contentTemplate: definition.defaultContentTemplate,
    });
  };

  const insertVariable = (field: 'titleTemplate' | 'contentTemplate') => {
    if (!selectedVariableKey) {
      message.warning(t('messageTemplate.variableRequired'));
      return;
    }
    const token = `\${${selectedVariableKey}}`;
    const currentValue = form.getFieldValue(field) ?? '';
    form.setFieldValue(field, currentValue ? `${currentValue}${token}` : token);
  };

  const handleSubmit = async (values: MessageTemplateUpdateDTO & { name: string }) => {
    try {
      const payload: MessageTemplateCreateDTO = {
        name: values.name,
        templateType: values.templateType || currentTemplateType || definitions[0]?.templateType || '',
        status: values.status,
        titleTemplate: values.titleTemplate || '',
        contentTemplate: values.contentTemplate || '',
        description: values.description,
        supportedChannels: values.supportedChannels?.length ? values.supportedChannels : undefined,
      };
      if (editingTemplate) {
        await updateMutation.mutateAsync({ id: editingTemplate.id, data: payload });
        message.success(t('messageTemplate.updateSuccess'));
      } else {
        await createMutation.mutateAsync(payload);
        message.success(t('messageTemplate.createSuccess'));
      }
      setModalOpen(false);
    } catch {
      // 请求异常由全局拦截器处理
    }
  };

  return (
    <PageContainer
      title={t('messageTemplate.management')}
      extra={(
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          {t('messageTemplate.create')}
        </Button>
      )}
    >
      <Card variant="borderless" className="shadow-sm rounded-xl">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t('messageTemplate.namePlaceholder')}
            style={{ width: 240 }}
            onChange={(e) => setQuery((current) => ({ ...current, name: e.target.value, page: 1 }))}
          />
          <Select
            allowClear
            placeholder={t('common.status')}
            style={{ width: 160 }}
            options={[
              { value: 'active', label: t('common.active') },
              { value: 'inactive', label: t('common.inactive') },
            ]}
            onChange={(value) => setQuery((current) => ({ ...current, status: value, page: 1 }))}
          />
          <Input
            allowClear
            placeholder={t('messageTemplate.createdByPlaceholder')}
            style={{ width: 220 }}
            onChange={(e) => setQuery((current) => ({ ...current, createdByKeyword: e.target.value, page: 1 }))}
          />
        </div>

        {templates.length === 0 ? (
          <Empty description={t('messageTemplate.empty')} />
        ) : (
          <Table<MessageTemplate>
            rowKey="id"
            loading={isLoading}
            dataSource={templates}
            pagination={{
              current: templateData?.current ?? query.page ?? 1,
              pageSize: templateData?.size ?? query.size ?? 10,
              total: templateData?.total ?? 0,
              onChange: (page, size) => setQuery((current) => ({ ...current, page, size })),
            }}
            columns={[
              {
                title: t('messageTemplate.name'),
                dataIndex: 'name',
                render: (value: string, record) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{value}</div>
                    <Text type="secondary">{definitionMap[record.templateType]?.templateName ?? record.templateType}</Text>
                  </div>
                ),
              },
              {
                title: t('messageTemplate.supportedChannels'),
                dataIndex: 'supportedChannels',
                width: 220,
                render: (value?: string[]) => (
                  value && value.length > 0
                    ? (
                      <Space size={[4, 4]} wrap>
                        {value.map((item) => <Tag key={item}>{channelLabelMap[item] || item}</Tag>)}
                      </Space>
                    )
                    : '-'
                ),
              },
              {
                title: t('messageTemplate.createdByName'),
                dataIndex: 'createdByName',
                width: 140,
                render: (value?: string) => value || '-',
              },
              {
                title: t('common.status'),
                dataIndex: 'status',
                width: 120,
                render: (value: string) => (
                  <Tag color={value === 'active' ? 'green' : 'default'}>
                    {value === 'active' ? t('common.active') : t('common.inactive')}
                  </Tag>
                ),
              },
              {
                title: t('messageTemplate.titleTemplate'),
                dataIndex: 'titleTemplate',
                ellipsis: true,
              },
              {
                title: t('common.actions'),
                width: 150,
                render: (_value, record) => (
                  <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                    <Popconfirm
                      title={t('common.confirmDelete')}
                      onConfirm={() => deleteMutation.mutate(record.id)}
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Modal
        title={editingTemplate ? t('messageTemplate.edit') : t('messageTemplate.create')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width="80%"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 20 }}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="name" label={t('messageTemplate.name')} rules={[{ required: true }]}>
                <Input placeholder={t('messageTemplate.namePlaceholder')} />
              </Form.Item>
              <Form.Item name="templateType" label={t('messageTemplate.type')} rules={[{ required: true }]}>
                <Select
                  placeholder={t('messageTemplate.selectTypePlaceholder')}
                  onChange={handleTemplateTypeChange}
                  options={definitions.map((item) => ({
                    value: item.templateType,
                    label: item.templateName,
                  }))}
                />
              </Form.Item>
              <Form.Item name="status" label={t('common.status')} initialValue="active">
                <Select
                  options={[
                    { value: 'active', label: t('common.active') },
                    { value: 'inactive', label: t('common.inactive') },
                  ]}
                />
              </Form.Item>
              <Form.Item name="supportedChannels" label={t('messageTemplate.supportedChannels')}>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder={t('messageTemplate.supportedChannelsPlaceholder')}
                  options={channelOptions}
                />
              </Form.Item>
            </div>

            <Alert showIcon type="info" message={t('messageTemplate.variableHint')} style={{ marginBottom: 12 }} />
            <Alert showIcon type="success" message={t('messageTemplate.markdownHint')} style={{ marginBottom: 16 }} />

            <Form.Item name="titleTemplate" label={t('messageTemplate.titleTemplate')} rules={[{ required: true }]}>
              <Input placeholder={t('messageTemplate.titlePlaceholder')} />
            </Form.Item>
            <Form.Item name="contentTemplate" label={t('messageTemplate.contentTemplate')} rules={[{ required: true }]}>
              <TextArea
                rows={16}
                placeholder={t('messageTemplate.contentPlaceholder')}
                style={{ fontFamily: 'SFMono-Regular, Consolas, monospace' }}
              />
            </Form.Item>
            <Form.Item name="description" label={t('messageTemplate.description')}>
              <TextArea rows={3} />
            </Form.Item>
          </Form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card size="small" title={t('messageTemplate.supportedVariables')}>
              <Select
                allowClear
                value={selectedVariableKey}
                placeholder={t('messageTemplate.selectVariable')}
                onChange={(value) => setSelectedVariableKey(value)}
                style={{ width: '100%', marginBottom: 12 }}
                options={(currentDefinition?.supportedVariables ?? []).map((item) => ({
                  value: item.key,
                  label: `${item.label} (${item.key})`,
                }))}
              />
              <Space>
                <Button onClick={() => insertVariable('titleTemplate')}>{t('messageTemplate.insertToTitle')}</Button>
                <Button onClick={() => insertVariable('contentTemplate')}>{t('messageTemplate.insertToContent')}</Button>
              </Space>
            </Card>

            <Card size="small" title={t('messageTemplate.preview')}>
              <div style={{ marginBottom: 16 }}>
                <Text strong>{renderPreview(currentTitleTemplate ?? '', currentDefinition) || '-'}</Text>
              </div>
              {currentContentTemplate ? (
                <MarkdownPreview content={renderPreview(currentContentTemplate, currentDefinition)} />
              ) : (
                <Text type="secondary">-</Text>
              )}
            </Card>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}

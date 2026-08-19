import { useState } from 'react';
import {
  Table, Card, Space, Tag, Button, Input, Select, Switch, Statistic, Row, Col,
  Modal, Form, Drawer, Timeline, Radio, message, Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  SearchOutlined, PlayCircleOutlined, ClockCircleOutlined, ThunderboltOutlined,
  SettingOutlined, LinkOutlined, PlusOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/PageContainer/PageContainer';
import {
  useTriggerStats, useTriggerConfigs, useFireTrigger, useToggleTrigger,
  useUpdateTriggerConfig, useRecentExecutions, useWorkflowTemplates,
} from '@/api/workflow';
import type { TriggerConfigVO, TriggerQueryDTO } from '@/types/workflow';
import { formatDateTime } from '@/utils/date';

const { Text } = Typography;

const TRIGGER_TYPE_META: Record<string, { color: string; icon: React.ReactNode; labelKey: string }> = {
  trigger_manual: { color: 'blue', icon: <PlayCircleOutlined />, labelKey: 'trigger.triggerManual' },
  trigger_cron:   { color: 'orange', icon: <ClockCircleOutlined />, labelKey: 'trigger.triggerCron' },
  trigger_event:  { color: 'purple', icon: <ThunderboltOutlined />, labelKey: 'trigger.triggerEvent' },
  start:          { color: 'blue', icon: <PlayCircleOutlined />, labelKey: 'trigger.triggerManual' },
};

const WORKFLOW_STATUS_COLOR: Record<string, string> = {
  draft: 'default',
  published: 'success',
  archived: 'warning',
};

const EXEC_STATUS_COLOR: Record<string, string> = {
  running: 'processing',
  completed: 'success',
  failed: 'error',
  pending: 'default',
  cancelled: 'default',
};

interface TriggerConfigFormValues {
  triggerType?: string;
  cronExpression?: string;
  timezone?: string;
  eventType?: string;
  eventHook?: string;
  eventFilter?: string;
  enabled?: boolean;
  triggerInputs?: string;
}

export default function WorkflowTriggerList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [queryParams, setQueryParams] = useState<TriggerQueryDTO>({ page: 1, size: 20 });
  const [keyword, setKeyword] = useState('');
  const [triggerTypeFilter, setTriggerTypeFilter] = useState('');

  // 手动执行 Modal
  const [fireModalOpen, setFireModalOpen] = useState(false);
  const [fireRecord, setFireRecord] = useState<TriggerConfigVO | null>(null);
  const [fireForm] = Form.useForm();

  // 触发配置 Drawer
  const [configRecord, setConfigRecord] = useState<TriggerConfigVO | null>(null);
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);

  // 新建触发 Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: stats } = useTriggerStats();
  const { data: pageData, isLoading } = useTriggerConfigs({
    ...queryParams,
    keyword: keyword || undefined,
    triggerType: triggerTypeFilter || undefined,
  });
  const fireMutation = useFireTrigger();
  const toggleMutation = useToggleTrigger();
  const updateConfigMutation = useUpdateTriggerConfig();

  const records = pageData?.records ?? [];
  const total = pageData?.total ?? 0;

  const handleSearch = () => setQueryParams((p) => ({ ...p, page: 1 }));

  const handleOpenFire = (record: TriggerConfigVO) => {
    setFireRecord(record);
    fireForm.resetFields();
    setFireModalOpen(true);
  };

  const handleFireSubmit = async () => {
    if (!fireRecord) return;
    const values = await fireForm.validateFields();
    let variables: Record<string, unknown> | undefined;
    if (values.variables) {
      try { variables = JSON.parse(values.variables); }
      catch { message.error('输入参数 JSON 格式错误'); return; }
    }
    fireMutation.mutate(
      { templateId: fireRecord.templateId, data: { name: values.name, variables } },
      {
        onSuccess: (res) => {
          setFireModalOpen(false);
          const result = res.data;
          Modal.success({
            title: t('trigger.triggerSuccess'),
            content: <Space direction="vertical"><Text>{result.instanceName}</Text></Space>,
            okText: t('trigger.viewInstance'),
            onOk: () => navigate(`/workflow/executions?instanceId=${result.instanceId}`),
          });
        },
        onError: () => message.error(t('trigger.triggerFailed')),
      },
    );
  };

  const handleToggle = (templateId: string, enabled: boolean) => {
    toggleMutation.mutate(
      { templateId, enabled },
      {
        onSuccess: () => message.success(t('trigger.toggleSuccess')),
        onError: () => message.error(t('trigger.toggleFailed')),
      },
    );
  };

  const handleOpenConfig = (record: TriggerConfigVO) => {
    setConfigRecord(record);
    setConfigDrawerOpen(true);
  };

  const handleSaveConfig = (values: TriggerConfigFormValues, triggerInputs: Record<string, unknown> | undefined) => {
    if (!configRecord) return;
    updateConfigMutation.mutate(
      {
        templateId: configRecord.templateId,
        data: {
          triggerType: values.triggerType,
          cronExpression: values.cronExpression,
          timezone: values.timezone,
          eventType: values.eventType,
          eventHook: values.eventHook,
          eventFilter: values.eventFilter,
          enabled: Boolean(values.enabled),
          triggerInputs,
        },
      },
      {
        onSuccess: () => { message.success(t('trigger.saveSuccess')); setConfigDrawerOpen(false); },
        onError: () => message.error(t('trigger.saveFailed')),
      },
    );
  };

  const columns: TableColumnsType<TriggerConfigVO> = [
    {
      title: t('trigger.templateName'),
      dataIndex: 'templateName',
      key: 'templateName',
      width: 360,
      fixed: 'left',
      render: (name: string, record: TriggerConfigVO) => (
        <Space size={6} wrap className="workflow-trigger-table__name">
          <Text className="workflow-trigger-table__name-text">{name}</Text>
          <Tag color={WORKFLOW_STATUS_COLOR[record.templateStatus] || 'default'} style={{ marginInlineEnd: 0 }}>
            {record.templateStatus}
          </Tag>
        </Space>
      ),
    },
    {
      title: t('trigger.triggerType'),
      dataIndex: 'triggerType',
      key: 'triggerType',
      width: 130,
      render: (type: string) => {
        const meta = TRIGGER_TYPE_META[type] || TRIGGER_TYPE_META.start;
        return <Tag icon={meta.icon} color={meta.color}>{t(meta.labelKey)}</Tag>;
      },
    },
    {
      title: t('trigger.configSummary'),
      key: 'configSummary',
      width: 260,
      render: (_: unknown, record: TriggerConfigVO) => {
        if (record.triggerType === 'trigger_cron') {
          return <Text type="secondary">{record.cronHumanReadable || record.cronExpression || '-'}</Text>;
        }
        if (record.triggerType === 'trigger_event') {
          return <Text type="secondary">{record.eventHook || record.eventType || '-'}</Text>;
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: t('trigger.status'),
      key: 'enabled',
      width: 140,
      render: (_: unknown, record: TriggerConfigVO) => {
        const isCronOrEvent = record.triggerType === 'trigger_cron' || record.triggerType === 'trigger_event';
        if (!isCronOrEvent) return <Text type="secondary">-</Text>;
        return (
          <Switch
            checked={record.enabled}
            size="small"
            checkedChildren={t('trigger.enabled')}
            unCheckedChildren={t('trigger.disabled')}
            loading={toggleMutation.isPending}
            onChange={(checked) => handleToggle(record.templateId, checked)}
          />
        );
      },
    },
    {
      title: t('trigger.lastTriggered'),
      key: 'lastTriggered',
      width: 260,
      render: (_: unknown, record: TriggerConfigVO) => {
        if (!record.lastTriggeredAt) return <Text type="secondary">-</Text>;
        return (
          <Space size={4}>
            <Text>{formatDateTime(record.lastTriggeredAt)}</Text>
            {record.lastTriggerStatus && (
              <Tag color={EXEC_STATUS_COLOR[record.lastTriggerStatus] || 'default'} style={{ marginInlineEnd: 0 }}>
                {record.lastTriggerStatus}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: t('trigger.actions'),
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_: unknown, record: TriggerConfigVO) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => handleOpenConfig(record)}>
            {t('trigger.configure')}
          </Button>
          <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleOpenFire(record)}>
            {t('trigger.fire')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title={t('trigger.title')}>
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card size="small">
              <Statistic title={t('trigger.manualCount')} value={stats.manualCount} prefix={<PlayCircleOutlined />} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title={t('trigger.cronCount')}
                value={stats.cronCount}
                prefix={<ClockCircleOutlined />}
                suffix={<Text type="secondary" style={{ fontSize: 13 }}>({stats.cronEnabledCount} {t('trigger.cronEnabled')})</Text>}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title={t('trigger.eventCount')}
                value={stats.eventCount}
                prefix={<ThunderboltOutlined />}
                suffix={<Text type="secondary" style={{ fontSize: 13 }}>({stats.eventEnabledCount} {t('trigger.eventEnabled')})</Text>}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder={t('trigger.templateName')}
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 240 }}
            allowClear
          />
          <Select
            value={triggerTypeFilter}
            onChange={(v) => { setTriggerTypeFilter(v); setQueryParams((p) => ({ ...p, page: 1 })); }}
            style={{ width: 160 }}
            options={[
              { value: '', label: t('trigger.all') },
              { value: 'trigger_manual', label: t('trigger.triggerManual') },
              { value: 'trigger_cron', label: t('trigger.triggerCron') },
              { value: 'trigger_event', label: t('trigger.triggerEvent') },
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            {t('common.search')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            {t('trigger.createTrigger')}
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          className="fixed-columns-table workflow-trigger-table"
          rowKey="templateId"
          columns={columns}
          dataSource={records}
          loading={isLoading}
          scroll={{ x: 1400 }}
          pagination={{
            current: queryParams.page,
            pageSize: queryParams.size,
            total,
            showSizeChanger: true,
            showTotal: (n) => `共 ${n} 条`,
            onChange: (page, size) => setQueryParams({ page, size }),
          }}
          expandable={{
            expandedRowRender: (record) => <RecentExecutionsPanel templateId={record.templateId} />,
            expandRowByClick: false,
          }}
        />
      </Card>

      {/* 手动执行 Modal */}
      <Modal
        title={`${t('trigger.manualTriggerTitle')}${fireRecord ? ` — ${fireRecord.templateName}` : ''}`}
        open={fireModalOpen}
        onOk={handleFireSubmit}
        onCancel={() => setFireModalOpen(false)}
        confirmLoading={fireMutation.isPending}
        okText={t('trigger.fire')}
        destroyOnClose
      >
        <Form form={fireForm} layout="vertical">
          <Form.Item name="name" label={t('trigger.instanceName')}>
            <Input placeholder={t('trigger.instanceNamePlaceholder')} />
          </Form.Item>
          <Form.Item name="variables" label={t('trigger.inputVariables')}>
            <Input.TextArea rows={4} placeholder={t('trigger.inputVariablesPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 触发配置 Drawer */}
      {configRecord && (
        <ConfigDrawer
          key={configRecord.templateId}
          record={configRecord}
          open={configDrawerOpen}
          saving={updateConfigMutation.isPending}
          onClose={() => setConfigDrawerOpen(false)}
          onSave={handleSaveConfig}
        />
      )}

      {/* 新建触发 Modal */}
      <CreateTriggerModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </PageContainer>
  );
}

// ── 新建触发 Modal ──────────────────────────────────────────────────────────

interface CreateTriggerModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateTriggerModal({ open, onClose }: CreateTriggerModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [selectedTriggerType, setSelectedTriggerType] = useState('trigger_manual');
  const [templateSearch, setTemplateSearch] = useState('');
  const updateConfigMutation = useUpdateTriggerConfig();

  const { data: templatesPage } = useWorkflowTemplates({
    page: 1,
    size: 50,
    keyword: templateSearch || undefined,
  });
  const templateOptions = (templatesPage?.records ?? [])
    .filter((tpl) => tpl.status !== 'archived')
    .map((tpl) => ({ value: tpl.id, label: tpl.name }));

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const triggerType = values.triggerType as string;
    const templateId = values.templateId as string;

    let triggerInputs: Record<string, unknown> | undefined;
    if (values.triggerInputs) {
      try { triggerInputs = JSON.parse(values.triggerInputs); }
      catch { message.error('触发参数 JSON 格式错误'); return; }
    }

    updateConfigMutation.mutate(
      {
        templateId,
        data: {
          triggerType,
          cronExpression: values.cronExpression,
          timezone: values.timezone,
          eventType: values.eventType,
          eventHook: values.eventHook,
          eventFilter: values.eventFilter,
          triggerInputs,
          enabled: values.enabled ?? true,
        },
      },
      {
        onSuccess: () => {
          message.success(t('trigger.createSuccess'));
          form.resetFields();
          setSelectedTriggerType('trigger_manual');
          onClose();
        },
        onError: () => message.error(t('trigger.saveFailed')),
      },
    );
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedTriggerType('trigger_manual');
    onClose();
  };

  return (
    <Modal
      title={t('trigger.createTrigger')}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={updateConfigMutation.isPending}
      okText={t('trigger.saveConfig')}
      width={560}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ triggerType: 'trigger_manual', timezone: 'Asia/Shanghai', enabled: true }}
      >
        <Form.Item
          name="templateId"
          label={t('trigger.selectWorkflow')}
          rules={[{ required: true, message: t('trigger.selectWorkflowPlaceholder') }]}
        >
          <Select
            showSearch
            placeholder={t('trigger.selectWorkflowPlaceholder')}
            filterOption={false}
            onSearch={setTemplateSearch}
            options={templateOptions}
          />
        </Form.Item>

        <Form.Item name="triggerType" label={t('trigger.selectTriggerType')} rules={[{ required: true }]}>
          <Radio.Group
            onChange={(e) => setSelectedTriggerType(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="trigger_manual">
              <Space size={4}><PlayCircleOutlined />{t('trigger.triggerManual')}</Space>
            </Radio.Button>
            <Radio.Button value="trigger_cron">
              <Space size={4}><ClockCircleOutlined />{t('trigger.triggerCron')}</Space>
            </Radio.Button>
            <Radio.Button value="trigger_event">
              <Space size={4}><ThunderboltOutlined />{t('trigger.triggerEvent')}</Space>
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
          {selectedTriggerType === 'trigger_manual' && t('trigger.triggerTypeManualDesc')}
          {selectedTriggerType === 'trigger_cron' && t('trigger.triggerTypeCronDesc')}
          {selectedTriggerType === 'trigger_event' && t('trigger.triggerTypeEventDesc')}
        </Text>

        {selectedTriggerType === 'trigger_cron' && (
          <>
            <Form.Item name="cronExpression" label={t('trigger.cronExpression')} rules={[{ required: true }]}>
              <Input placeholder={t('trigger.cronExpressionPlaceholder')} style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="timezone" label={t('trigger.timezone')}>
              <Select
                showSearch
                options={[
                  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST +8)' },
                  { value: 'UTC', label: 'UTC' },
                  { value: 'America/New_York', label: 'America/New_York (EST)' },
                  { value: 'Europe/London', label: 'Europe/London (GMT)' },
                  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST +9)' },
                ]}
              />
            </Form.Item>
          </>
        )}

        {selectedTriggerType === 'trigger_event' && (
          <>
            <Form.Item name="eventType" label={t('trigger.eventType')} rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'spec_change', label: 'Spec Change' },
                  { value: 'git_push', label: 'Git Push' },
                  { value: 'webhook', label: 'Webhook' },
                  { value: 'custom', label: 'Custom' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="eventHook"
              label="触发钩子/触发点"
              tooltip="可填写 webhook 地址、MQ routingKey 或业务事件编码"
            >
              <Input placeholder="例如：webhook:/api/workflows/events/design-approved 或 spec.change.completed" />
            </Form.Item>
            <Form.Item name="eventFilter" label={t('trigger.eventFilter')}>
              <Input.TextArea rows={2} placeholder={t('trigger.eventFilterPlaceholder')} />
            </Form.Item>
          </>
        )}

        {selectedTriggerType !== 'trigger_manual' && (
          <Form.Item name="enabled" label={t('trigger.status')} valuePropName="checked">
            <Switch checkedChildren={t('trigger.enabled')} unCheckedChildren={t('trigger.disabled')} />
          </Form.Item>
        )}

        <Form.Item name="triggerInputs" label={t('trigger.triggerInputs')}>
          <Input.TextArea rows={4} placeholder={t('trigger.triggerInputsPlaceholder')} style={{ fontFamily: 'monospace', fontSize: 12 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── 触发配置 Drawer ──────────────────────────────────────────────────────────

interface ConfigDrawerProps {
  record: TriggerConfigVO;
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (values: TriggerConfigFormValues, triggerInputs: Record<string, unknown> | undefined) => void;
}

function ConfigDrawer({ record, open, saving, onClose, onSave }: ConfigDrawerProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const selectedTriggerType = Form.useWatch('triggerType', form) || record.triggerType || 'trigger_manual';
  const isCron = selectedTriggerType === 'trigger_cron';
  const isEvent = selectedTriggerType === 'trigger_event';

  const handleSave = async () => {
    const values = await form.validateFields() as TriggerConfigFormValues;
    let triggerInputs: Record<string, unknown> | undefined;
    if (values.triggerInputs) {
      try { triggerInputs = JSON.parse(values.triggerInputs); }
      catch { message.error('触发参数 JSON 格式错误'); return; }
    }
    onSave(values, triggerInputs);
  };

  return (
    <Drawer
      title={`${t('trigger.configure')} — ${record.templateName}`}
      open={open}
      onClose={onClose}
      width={500}
      destroyOnClose
      extra={
        <Button type="primary" loading={saving} onClick={handleSave}>
          {t('trigger.saveConfig')}
        </Button>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          triggerType: record.triggerType || 'trigger_manual',
          cronExpression: record.cronExpression,
          timezone: record.timezone || 'Asia/Shanghai',
          eventType: record.eventType,
          eventHook: record.eventHook,
          eventFilter: record.eventFilter,
          enabled: record.enabled,
          triggerInputs: record.triggerInputs ? JSON.stringify(record.triggerInputs, null, 2) : '',
        }}
      >
        <Form.Item name="triggerType" label={t('trigger.selectTriggerType')} rules={[{ required: true }]}>
          <Radio.Group optionType="button" buttonStyle="solid">
            <Radio.Button value="trigger_manual">
              <Space size={4}><PlayCircleOutlined />{t('trigger.triggerManual')}</Space>
            </Radio.Button>
            <Radio.Button value="trigger_cron">
              <Space size={4}><ClockCircleOutlined />{t('trigger.triggerCron')}</Space>
            </Radio.Button>
            <Radio.Button value="trigger_event">
              <Space size={4}><ThunderboltOutlined />{t('trigger.triggerEvent')}</Space>
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {isCron && (
          <>
            <Form.Item name="cronExpression" label={t('trigger.cronExpression')} rules={[{ required: true }]}>
              <Input placeholder={t('trigger.cronExpressionPlaceholder')} />
            </Form.Item>
            <Form.Item name="timezone" label={t('trigger.timezone')}>
              <Select
                showSearch
                options={[
                  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST +8)' },
                  { value: 'UTC', label: 'UTC' },
                  { value: 'America/New_York', label: 'America/New_York (EST)' },
                  { value: 'Europe/London', label: 'Europe/London (GMT)' },
                  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST +9)' },
                ]}
              />
            </Form.Item>
          </>
        )}

        {isEvent && (
          <>
            <Form.Item name="eventType" label={t('trigger.eventType')} rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'spec_change', label: 'Spec Change' },
                  { value: 'git_push', label: 'Git Push' },
                  { value: 'webhook', label: 'Webhook' },
                  { value: 'custom', label: 'Custom' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="eventHook"
              label="触发钩子/触发点"
              tooltip="可填写 webhook 地址、MQ routingKey 或业务事件编码"
            >
              <Input placeholder="例如：webhook:/api/workflows/events/design-approved 或 spec.change.completed" />
            </Form.Item>
            <Form.Item name="eventFilter" label={t('trigger.eventFilter')}>
              <Input.TextArea rows={2} placeholder={t('trigger.eventFilterPlaceholder')} />
            </Form.Item>
          </>
        )}
        {selectedTriggerType !== 'trigger_manual' && (
          <Form.Item name="enabled" label={t('trigger.status')} valuePropName="checked">
            <Switch checkedChildren={t('trigger.enabled')} unCheckedChildren={t('trigger.disabled')} />
          </Form.Item>
        )}
        <Form.Item name="triggerInputs" label={t('trigger.triggerInputs')}>
          <Input.TextArea rows={5} placeholder={t('trigger.triggerInputsPlaceholder')} />
        </Form.Item>
      </Form>

      <RecentExecutionsPanel templateId={record.templateId} />
    </Drawer>
  );
}

// ── 最近执行面板 ──────────────────────────────────────────────────────────────

function RecentExecutionsPanel({ templateId }: { templateId: string }) {
  const { t } = useTranslation();
  const { data: executions, isLoading } = useRecentExecutions(templateId, 5);

  if (isLoading) return <Text type="secondary">...</Text>;
  if (!executions || executions.length === 0) {
    return (
      <div style={{ marginTop: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>{t('trigger.recentExecutions')}</Text>
        <Text type="secondary">{t('trigger.noExecutions')}</Text>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>{t('trigger.recentExecutions')}</Text>
      <Timeline
        items={executions.map((exec) => ({
          color: exec.status === 'completed' ? 'green' : exec.status === 'failed' ? 'red' : 'blue',
          children: (
            <Space size={4} wrap>
              <Text ellipsis style={{ maxWidth: 160 }}>{exec.name}</Text>
              <Tag color={EXEC_STATUS_COLOR[exec.status] || 'default'} style={{ marginInlineEnd: 0 }}>
                {exec.status}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDateTime(exec.startedAt || exec.createdAt)}
              </Text>
              <Button
                type="link"
                size="small"
                icon={<LinkOutlined />}
                style={{ padding: 0 }}
                href={`/workflow/executions?instanceId=${exec.id}`}
              />
            </Space>
          ),
        }))}
      />
    </div>
  );
}

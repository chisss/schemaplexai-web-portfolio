import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  App as AntApp,
  Button,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  DatabaseOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  PushpinOutlined,
  ReloadOutlined,
  SafetyOutlined,
  SaveOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import PageContainer from '@/components/PageContainer/PageContainer';
import {
  useCreateUserMemory,
  useDeleteUserMemory,
  useUpdateUserMemory,
  useUpdateUserMemorySetting,
  useUserMemories,
  useUserMemorySetting,
} from '@/api/userMemory';
import type {
  UserMemory,
  UserMemoryCreateRequest,
  UserMemoryQueryRequest,
  UserMemorySettingUpdateRequest,
  UserMemoryUpdateRequest,
} from '@/api/userMemory';
import { formatDateTime } from '@/utils/date';
import './UserMemoryPreferences.css';

const { Paragraph, Text } = Typography;
const { TextArea } = Input;

interface OptionItem {
  label: string;
  value: string;
}

interface MemoryEditorValues {
  agentId?: string;
  projectId?: string;
  workspaceId?: string;
  memoryScope?: string;
  memoryKind?: string;
  status?: string;
  content: string;
  pinned?: boolean;
  expiresAt?: string;
}

const STATUS_COLORS: Record<string, string> = {
  CANDIDATE: 'gold',
  ACTIVE: 'green',
  REJECTED: 'red',
  ARCHIVED: 'default',
};

const KIND_COLORS: Record<string, string> = {
  PROFILE_FACT: 'blue',
  PREFERENCE: 'green',
  COMMUNICATION_STYLE: 'cyan',
  WORKFLOW_RULE: 'orange',
  TOOL_PREFERENCE: 'purple',
  AVOIDANCE: 'red',
  EPISODIC_SUMMARY: 'geekblue',
};

function compactObject<T extends object>(value: T): Partial<T> {
  return Object.entries(value as Record<string, unknown>).reduce((acc, [key, item]) => {
    if (item !== undefined && item !== null && item !== '') {
      (acc as Record<string, unknown>)[key] = item;
    }
    return acc;
  }, {} as Partial<T>);
}

export default function UserMemoryPreferences() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const [filterForm] = Form.useForm<UserMemoryQueryRequest>();
  const [settingForm] = Form.useForm<UserMemorySettingUpdateRequest>();
  const [editorForm] = Form.useForm<MemoryEditorValues>();
  const [filters, setFilters] = useState<UserMemoryQueryRequest>({ status: 'ACTIVE' });
  const [editingMemory, setEditingMemory] = useState<UserMemory | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const { data: memories = [], isLoading, refetch } = useUserMemories(filters);
  const { data: setting, isLoading: settingLoading } = useUserMemorySetting();
  const createMutation = useCreateUserMemory();
  const updateMutation = useUpdateUserMemory();
  const deleteMutation = useDeleteUserMemory();
  const updateSettingMutation = useUpdateUserMemorySetting();

  const scopeOptions = useMemo<OptionItem[]>(() => [
    { label: t('userMemory.scope.USER_GLOBAL'), value: 'USER_GLOBAL' },
    { label: t('userMemory.scope.USER_AGENT'), value: 'USER_AGENT' },
    { label: t('userMemory.scope.USER_PROJECT'), value: 'USER_PROJECT' },
    { label: t('userMemory.scope.USER_WORKSPACE'), value: 'USER_WORKSPACE' },
  ], [t]);

  const kindOptions = useMemo<OptionItem[]>(() => [
    { label: t('userMemory.kind.PROFILE_FACT'), value: 'PROFILE_FACT' },
    { label: t('userMemory.kind.PREFERENCE'), value: 'PREFERENCE' },
    { label: t('userMemory.kind.COMMUNICATION_STYLE'), value: 'COMMUNICATION_STYLE' },
    { label: t('userMemory.kind.WORKFLOW_RULE'), value: 'WORKFLOW_RULE' },
    { label: t('userMemory.kind.TOOL_PREFERENCE'), value: 'TOOL_PREFERENCE' },
    { label: t('userMemory.kind.AVOIDANCE'), value: 'AVOIDANCE' },
    { label: t('userMemory.kind.EPISODIC_SUMMARY'), value: 'EPISODIC_SUMMARY' },
  ], [t]);

  const statusOptions = useMemo<OptionItem[]>(() => [
    { label: t('userMemory.status.CANDIDATE'), value: 'CANDIDATE' },
    { label: t('userMemory.status.ACTIVE'), value: 'ACTIVE' },
    { label: t('userMemory.status.REJECTED'), value: 'REJECTED' },
    { label: t('userMemory.status.ARCHIVED'), value: 'ARCHIVED' },
  ], [t]);

  const sensitivePolicyOptions = useMemo<OptionItem[]>(() => [
    { label: t('userMemory.policy.EXPLICIT_ONLY'), value: 'EXPLICIT_ONLY' },
    { label: t('userMemory.policy.MASK'), value: 'MASK' },
    { label: t('userMemory.policy.REVIEW'), value: 'REVIEW' },
    { label: t('userMemory.policy.REJECT'), value: 'REJECT' },
  ], [t]);

  const scopeLabelMap = useMemo(() => Object.fromEntries(scopeOptions.map((item) => [item.value, item.label])), [scopeOptions]);
  const kindLabelMap = useMemo(() => Object.fromEntries(kindOptions.map((item) => [item.value, item.label])), [kindOptions]);
  const statusLabelMap = useMemo(() => Object.fromEntries(statusOptions.map((item) => [item.value, item.label])), [statusOptions]);

  useEffect(() => {
    settingForm.setFieldsValue({
      memoryEnabled: setting?.memoryEnabled ?? true,
      referenceSavedMemory: setting?.referenceSavedMemory ?? true,
      referenceChatHistory: setting?.referenceChatHistory ?? true,
      autoExtractEnabled: setting?.autoExtractEnabled ?? true,
      sensitiveMemoryPolicy: setting?.sensitiveMemoryPolicy || 'EXPLICIT_ONLY',
      retentionDays: setting?.retentionDays ?? 365,
    });
  }, [setting, settingForm]);

  const stats = useMemo(() => {
    const active = memories.filter((item) => item.status === 'ACTIVE').length;
    const pinned = memories.filter((item) => item.pinned).length;
    const candidate = memories.filter((item) => item.status === 'CANDIDATE').length;
    const latest = memories
      .map((item) => item.updatedAt || item.createdAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    return { active, pinned, candidate, latest };
  }, [memories]);

  const applyFilters = (values: UserMemoryQueryRequest) => {
    setFilters(compactObject({
      keyword: values.keyword?.trim(),
      memoryScope: values.memoryScope,
      memoryKind: values.memoryKind,
      status: values.status,
      agentId: values.agentId?.trim(),
    }) as UserMemoryQueryRequest);
  };

  const resetFilters = () => {
    const next = { status: 'ACTIVE' };
    filterForm.setFieldsValue(next);
    setFilters(next);
  };

  const openCreateModal = () => {
    setEditingMemory(null);
    editorForm.resetFields();
    editorForm.setFieldsValue({
      memoryScope: 'USER_GLOBAL',
      memoryKind: 'PREFERENCE',
      status: 'ACTIVE',
      pinned: false,
    });
    setEditorOpen(true);
  };

  const openEditModal = (memory: UserMemory) => {
    setEditingMemory(memory);
    editorForm.setFieldsValue({
      agentId: memory.agentId,
      projectId: memory.projectId,
      workspaceId: memory.workspaceId,
      memoryScope: memory.memoryScope,
      memoryKind: memory.memoryKind,
      status: memory.status,
      content: memory.content,
      pinned: memory.pinned,
      expiresAt: memory.expiresAt,
    });
    setEditorOpen(true);
  };

  const saveMemory = async () => {
    const values = await editorForm.validateFields();
    const basePayload = compactObject({
      agentId: values.agentId?.trim(),
      projectId: values.projectId?.trim(),
      workspaceId: values.workspaceId?.trim(),
      memoryScope: values.memoryScope,
      memoryKind: values.memoryKind,
      content: values.content?.trim(),
      pinned: Boolean(values.pinned),
      expiresAt: values.expiresAt?.trim(),
    }) as UserMemoryCreateRequest;

    if (editingMemory) {
      const updatePayload: UserMemoryUpdateRequest = {
        memoryScope: basePayload.memoryScope,
        memoryKind: basePayload.memoryKind,
        status: values.status,
        content: basePayload.content,
        pinned: basePayload.pinned,
        expiresAt: basePayload.expiresAt,
      };
      await updateMutation.mutateAsync({ id: editingMemory.id, data: compactObject(updatePayload) as UserMemoryUpdateRequest });
      message.success(t('userMemory.message.updateSuccess'));
    } else {
      await createMutation.mutateAsync(basePayload as UserMemoryCreateRequest);
      message.success(t('userMemory.message.createSuccess'));
    }
    setEditorOpen(false);
  };

  const saveSetting = async () => {
    const values = await settingForm.validateFields();
    await updateSettingMutation.mutateAsync(values);
    message.success(t('userMemory.message.settingSaved'));
  };

  const columns: TableColumnsType<UserMemory> = [
    {
      title: t('userMemory.table.content'),
      dataIndex: 'content',
      key: 'content',
      minWidth: 320,
      render: (content: string, record) => (
        <div className="user-memory-content-cell">
          <div className="user-memory-content-head">
            {record.pinned && <PushpinOutlined className="user-memory-pin-icon" />}
            <Tag color={KIND_COLORS[record.memoryKind] || 'default'}>
              {kindLabelMap[record.memoryKind] || record.memoryKind}
            </Tag>
          </div>
          <Paragraph ellipsis={{ rows: 2, expandable: true }} className="user-memory-content-text">
            {content}
          </Paragraph>
        </div>
      ),
    },
    {
      title: t('userMemory.table.scope'),
      dataIndex: 'memoryScope',
      key: 'memoryScope',
      width: 132,
      render: (scope: string) => <Tag>{scopeLabelMap[scope] || scope}</Tag>,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 108,
      render: (status: string) => <Tag color={STATUS_COLORS[status] || 'default'}>{statusLabelMap[status] || status}</Tag>,
    },
    {
      title: t('userMemory.table.source'),
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 108,
      render: (sourceType: string) => <Text type="secondary">{sourceType || '-'}</Text>,
    },
    {
      title: t('userMemory.table.metrics'),
      key: 'metrics',
      width: 150,
      render: (_, record) => (
        <div className="user-memory-metrics-cell">
          <span>{t('userMemory.table.importance')}: {record.importanceScore ?? '-'}</span>
          <span>{t('userMemory.table.usage')}: {record.useCount ?? 0}</span>
        </div>
      ),
    },
    {
      title: t('common.updateTime'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 168,
      render: (value: string, record) => formatDateTime(value || record.createdAt),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      fixed: 'right',
      width: 116,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title={t('common.edit')}>
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          </Tooltip>
          <Popconfirm
            title={t('userMemory.message.deleteConfirm')}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
            onConfirm={async () => {
              await deleteMutation.mutateAsync(record.id);
              message.success(t('common.deleteSuccess'));
            }}
          >
            <Tooltip title={t('common.delete')}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title={t('userMemory.pageTitle')}>
      <div className="user-memory-page">
        <section className="user-memory-command-bar">
          <div className="user-memory-command-copy">
            <div className="user-memory-eyebrow">
              <UserOutlined />
              <span>{t('userMemory.sectionTag')}</span>
            </div>
            <h2>{t('userMemory.title')}</h2>
            <Text type="secondary">{t('userMemory.description')}</Text>
          </div>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
              {t('common.refresh')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              {t('userMemory.action.newMemory')}
            </Button>
          </Space>
        </section>

        <section className="user-memory-stats-grid">
          <div className="user-memory-stat-tile">
            <Statistic title={t('userMemory.stats.active')} value={stats.active} prefix={<DatabaseOutlined />} />
          </div>
          <div className="user-memory-stat-tile">
            <Statistic title={t('userMemory.stats.pinned')} value={stats.pinned} prefix={<PushpinOutlined />} />
          </div>
          <div className="user-memory-stat-tile">
            <Statistic title={t('userMemory.stats.candidate')} value={stats.candidate} prefix={<SafetyOutlined />} />
          </div>
          <div className="user-memory-stat-tile user-memory-stat-tile--wide">
            <Text type="secondary">{t('userMemory.stats.latest')}</Text>
            <strong>{stats.latest ? formatDateTime(stats.latest) : '-'}</strong>
          </div>
        </section>

        <section className="user-memory-settings-panel">
          <div className="user-memory-section-header">
            <div>
              <h3>{t('userMemory.settings.title')}</h3>
              <Text type="secondary">{t('userMemory.settings.description')}</Text>
            </div>
            <Button
              icon={<SaveOutlined />}
              onClick={saveSetting}
              loading={updateSettingMutation.isPending || settingLoading}
            >
              {t('common.save')}
            </Button>
          </div>
          <Form form={settingForm} layout="vertical" className="user-memory-settings-form">
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12} xl={6}>
                <Form.Item name="memoryEnabled" label={t('userMemory.settings.memoryEnabled')} valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} xl={6}>
                <Form.Item name="referenceSavedMemory" label={t('userMemory.settings.referenceSavedMemory')} valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} xl={6}>
                <Form.Item name="autoExtractEnabled" label={t('userMemory.settings.autoExtractEnabled')} valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} xl={6}>
                <Form.Item name="referenceChatHistory" label={t('userMemory.settings.referenceChatHistory')} valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="sensitiveMemoryPolicy" label={t('userMemory.settings.sensitiveMemoryPolicy')}>
                  <Select options={sensitivePolicyOptions} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="retentionDays" label={t('userMemory.settings.retentionDays')}>
                  <InputNumber min={1} max={3650} precision={0} className="user-memory-full-width" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </section>

        <section className="user-memory-list-panel">
          <div className="user-memory-section-header">
            <div>
              <h3>{t('userMemory.list.title')}</h3>
              <Text type="secondary">{t('userMemory.list.description')}</Text>
            </div>
          </div>
          <Form
            form={filterForm}
            layout="inline"
            initialValues={filters}
            onFinish={applyFilters}
            className="user-memory-filter-form"
          >
            <Form.Item name="keyword">
              <Input prefix={<SearchOutlined />} allowClear placeholder={t('userMemory.filter.keyword')} />
            </Form.Item>
            <Form.Item name="memoryScope">
              <Select allowClear className="user-memory-filter-select" placeholder={t('userMemory.filter.scope')} options={scopeOptions} />
            </Form.Item>
            <Form.Item name="memoryKind">
              <Select allowClear className="user-memory-filter-select" placeholder={t('userMemory.filter.kind')} options={kindOptions} />
            </Form.Item>
            <Form.Item name="status">
              <Select allowClear className="user-memory-filter-select" placeholder={t('userMemory.filter.status')} options={statusOptions} />
            </Form.Item>
            <Form.Item name="agentId">
              <Input allowClear placeholder={t('userMemory.filter.agentId')} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  {t('common.search')}
                </Button>
                <Button onClick={resetFilters}>{t('common.reset')}</Button>
              </Space>
            </Form.Item>
          </Form>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={memories}
            loading={isLoading}
            pagination={{ pageSize: 12, showSizeChanger: true }}
            scroll={{ x: 1100 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('userMemory.empty')}
                />
              ),
            }}
          />
        </section>
      </div>

      <Modal
        title={
          <Space>
            <SettingOutlined />
            {editingMemory ? t('userMemory.action.editMemory') : t('userMemory.action.newMemory')}
          </Space>
        }
        open={editorOpen}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        onOk={saveMemory}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        onCancel={() => setEditorOpen(false)}
        width={720}
        destroyOnHidden
      >
        <Form form={editorForm} layout="vertical" className="user-memory-editor-form">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="memoryScope" label={t('userMemory.form.scope')} rules={[{ required: true }]}>
                <Select options={scopeOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="memoryKind" label={t('userMemory.form.kind')} rules={[{ required: true }]}>
                <Select options={kindOptions} />
              </Form.Item>
            </Col>
            {editingMemory && (
              <Col xs={24} md={12}>
                <Form.Item name="status" label={t('common.status')} rules={[{ required: true }]}>
                  <Select options={statusOptions} />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} md={12}>
              <Form.Item name="pinned" label={t('userMemory.form.pinned')} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="agentId" label={t('userMemory.form.agentId')}>
                <Input allowClear placeholder={t('userMemory.form.agentIdPlaceholder')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="projectId" label={t('userMemory.form.projectId')}>
                <Input allowClear placeholder={t('userMemory.form.projectIdPlaceholder')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="workspaceId" label={t('userMemory.form.workspaceId')}>
                <Input allowClear placeholder={t('userMemory.form.workspaceIdPlaceholder')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="expiresAt" label={t('userMemory.form.expiresAt')}>
                <Input allowClear placeholder="2026-12-31T23:59:59" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="content"
                label={t('userMemory.form.content')}
                rules={[
                  { required: true, message: t('userMemory.form.contentRequired') },
                  { max: 2000, message: t('userMemory.form.contentMax') },
                ]}
              >
                <TextArea rows={5} showCount maxLength={2000} placeholder={t('userMemory.form.contentPlaceholder')} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </PageContainer>
  );
}

import { useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Typography, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useBranchRules, useCreateBranchRule, useDeleteBranchRule, useUpdateBranchRule, useWorkspaces } from '@/api/workspace';
import type { BranchRule, BranchRuleSaveDTO } from '@/types/integration';
import { formatDateTime } from '@/utils/date';

const { Text } = Typography;

function parseBoolean(input: any, fallbackValue: boolean) {
  if (typeof input === 'boolean') {
    return input;
  }
  return fallbackValue;
}

export default function BranchRuleManagement() {
  const { t } = useTranslation();
  const [workspaceFilter, setWorkspaceFilter] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BranchRule | null>(null);
  const [form] = Form.useForm();

  const { data: workspacePage } = useWorkspaces({ page: 1, size: 200 });
  const { data: rules, isLoading } = useBranchRules(workspaceFilter);
  const createRuleMutation = useCreateBranchRule();
  const updateRuleMutation = useUpdateBranchRule();
  const deleteRuleMutation = useDeleteBranchRule();

  const workspaceOptions = (workspacePage?.records || []).map((item) => ({
    label: item.name,
    value: item.id,
  }));

  const openCreate = () => {
    setEditingRule(null);
    form.setFieldsValue({
      autoCreateForSpec: true,
      requirePullRequest: true,
      minReviewers: 1,
      requireStatusChecks: false,
      disallowForcePush: true,
      branchNameTemplate: 'feature/{requirementNo}-{slug}',
    });
    setOpen(true);
  };

  const openEdit = (rule: BranchRule) => {
    const protectionRules = rule.protectionRules || {};
    setEditingRule(rule);
    form.setFieldsValue({
      workspaceId: rule.workspaceId,
      branchPattern: rule.branchPattern,
      branchNameTemplate: rule.branchNameTemplate,
      autoCreateForSpec: parseBoolean(rule.autoCreateForSpec, false),
      requirePullRequest: parseBoolean(protectionRules.requirePullRequest, true),
      minReviewers: Number(protectionRules.minReviewers ?? 1),
      requireStatusChecks: parseBoolean(protectionRules.requireStatusChecks, false),
      disallowForcePush: parseBoolean(protectionRules.disallowForcePush, true),
    });
    setOpen(true);
  };

  const saveRule = async () => {
    const values = await form.validateFields();
    const payload: BranchRuleSaveDTO = {
      workspaceId: values.workspaceId,
      branchPattern: values.branchPattern,
      branchNameTemplate: values.branchNameTemplate,
      autoCreateForSpec: !!values.autoCreateForSpec,
      protectionRules: {
        requirePullRequest: !!values.requirePullRequest,
        minReviewers: Number(values.minReviewers ?? 0),
        requireStatusChecks: !!values.requireStatusChecks,
        disallowForcePush: !!values.disallowForcePush,
      },
    };
    if (editingRule) {
      await updateRuleMutation.mutateAsync({ id: editingRule.id, data: payload });
      message.success(t('workspace.branchRuleUpdated'));
    } else {
      await createRuleMutation.mutateAsync(payload);
      message.success(t('workspace.branchRuleCreated'));
    }
    setOpen(false);
  };

  const removeRule = async (id: string) => {
    await deleteRuleMutation.mutateAsync(id);
    message.success(t('common.deleteSuccess'));
  };

  return (
    <PageContainer
      title={t('workspace.branchRuleManagement')}
      extra={(
        <Space>
          <Select
            allowClear
            style={{ width: 260 }}
            placeholder={t('workspace.selectWorkspace')}
            options={workspaceOptions}
            value={workspaceFilter}
            onChange={setWorkspaceFilter}
            showSearch
            filterOption={(input, option) =>
              String(option?.label || '').toLowerCase().includes(input.toLowerCase())
            }
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('workspace.createBranchRule')}
          </Button>
        </Space>
      )}
    >
      <Card variant="borderless" className="shadow-sm rounded-xl">
        <Table<BranchRule>
          rowKey="id"
          loading={isLoading}
          dataSource={rules || []}
          columns={[
            {
              title: t('workspace.name'),
              dataIndex: 'workspaceName',
              width: 220,
              render: (val, record) => val || record.workspaceId,
            },
            {
              title: t('workspace.targetBranch'),
              dataIndex: 'branchPattern',
              width: 180,
              render: (val) => <Tag color="blue">{val}</Tag>,
            },
            {
              title: t('workspace.branchNameTemplate'),
              dataIndex: 'branchNameTemplate',
              ellipsis: true,
              render: (val) => <Text code>{val}</Text>,
            },
            {
              title: t('workspace.autoCreateBranch'),
              dataIndex: 'autoCreateForSpec',
              width: 140,
              render: (val) => (
                val ? <Tag color="success">{t('common.enabled')}</Tag> : <Tag>{t('common.disabled')}</Tag>
              ),
            },
            {
              title: t('workspace.protectionRules'),
              width: 280,
              render: (_, record) => {
                const protectionRules = record.protectionRules || {};
                return (
                  <Space size={4} wrap>
                    <Tag>{t('workspace.requirePullRequest')}: {protectionRules.requirePullRequest ? t('common.yes') : t('common.no')}</Tag>
                    <Tag>{t('workspace.minReviewers')}: {protectionRules.minReviewers ?? 0}</Tag>
                    <Tag>{t('workspace.requireStatusChecks')}: {protectionRules.requireStatusChecks ? t('common.yes') : t('common.no')}</Tag>
                    <Tag>{t('workspace.disallowForcePush')}: {protectionRules.disallowForcePush ? t('common.yes') : t('common.no')}</Tag>
                  </Space>
                );
              },
            },
            {
              title: t('common.updateTime'),
              dataIndex: 'updatedAt',
              width: 180,
              render: (val) => (val ? formatDateTime(val) : '-'),
            },
            {
              title: t('common.actions'),
              key: 'action',
              width: 150,
              render: (_, record) => (
                <Space>
                  <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
                    {t('common.edit')}
                  </Button>
                  <Popconfirm
                    title={t('workspace.deleteBranchRuleConfirm')}
                    onConfirm={() => removeRule(record.id)}
                  >
                    <Button type="link" danger icon={<DeleteOutlined />} loading={deleteRuleMutation.isPending}>
                      {t('common.delete')}
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editingRule ? t('workspace.editBranchRule') : t('workspace.createBranchRule')}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={saveRule}
        confirmLoading={createRuleMutation.isPending || updateRuleMutation.isPending}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="workspaceId"
            label={t('workspace.name')}
            rules={[{ required: true, message: t('workspace.selectWorkspace') }]}
          >
            <Select
              showSearch
              placeholder={t('workspace.selectWorkspace')}
              options={workspaceOptions}
              filterOption={(input, option) =>
                String(option?.label || '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item
            name="branchPattern"
            label={t('workspace.targetBranch')}
            rules={[{ required: true, message: t('workspace.targetBranchRequired') }]}
          >
            <Input placeholder={t('workspace.targetBranchPlaceholder')} />
          </Form.Item>
          <Form.Item
            name="branchNameTemplate"
            label={t('workspace.branchNameTemplate')}
            rules={[{ required: true, message: t('workspace.branchTemplateRequired') }]}
            extra={t('workspace.branchTemplateHint')}
          >
            <Input placeholder="feature/{requirementNo}-{slug}" />
          </Form.Item>
          <Form.Item name="autoCreateForSpec" valuePropName="checked" label={t('workspace.autoCreateBranch')}>
            <Switch />
          </Form.Item>

          <Card size="small" title={t('workspace.protectionRules')} style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item name="requirePullRequest" valuePropName="checked" label={t('workspace.requirePullRequest')} style={{ marginBottom: 0 }}>
                <Switch />
              </Form.Item>
              <Form.Item name="minReviewers" label={t('workspace.minReviewers')} style={{ marginBottom: 0 }}>
                <InputNumber min={0} max={10} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="requireStatusChecks" valuePropName="checked" label={t('workspace.requireStatusChecks')} style={{ marginBottom: 0 }}>
                <Switch />
              </Form.Item>
              <Form.Item name="disallowForcePush" valuePropName="checked" label={t('workspace.disallowForcePush')} style={{ marginBottom: 0 }}>
                <Switch />
              </Form.Item>
            </Space>
          </Card>
        </Form>
      </Modal>
    </PageContainer>
  );
}

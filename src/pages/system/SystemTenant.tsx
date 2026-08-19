import { useMemo, useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Switch, Select, message, Popconfirm, Tag, Alert } from 'antd';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useTenants, useCreateTenant, useUpdateTenant, useDeleteTenant, useUpdateTenantStatus } from '@/api/system';
import { useAuthStore } from '@/store/useAuthStore';
import TenantIndustrySetup from './components/TenantIndustrySetup';
import dayjs from 'dayjs';
import type { Tenant } from '@/types/system';

export default function SystemTenant() {
  const { t } = useTranslation();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('system:tenant:create');
  const canUpdate = hasPermission('system:tenant:update');
  const canDelete = hasPermission('system:tenant:delete');
  const canStatus = hasPermission('system:tenant:status');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [industrySetupTenant, setIndustrySetupTenant] = useState<Tenant | null>(null);
  const [form] = Form.useForm();
  const [queryParams, setQueryParams] = useState({ page: 1, size: 10 });

  const { data: tenantData, isLoading } = useTenants(queryParams);
  const createTenantMutation = useCreateTenant();
  const updateTenantMutation = useUpdateTenant();
  const deleteTenantMutation = useDeleteTenant();
  const updateTenantStatusMutation = useUpdateTenantStatus();

  const initStatusConfig = useMemo<Record<string, { color: string; label: string }>>(() => ({
    pending: { color: 'default', label: t('system.tenant.initStatusPending') },
    running: { color: 'processing', label: t('system.tenant.initStatusRunning') },
    done: { color: 'success', label: t('system.tenant.initStatusDone') },
    failed: { color: 'error', label: t('system.tenant.initStatusFailed') },
  }), [t]);

  const handleAdd = () => {
    setEditingTenant(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active' });
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingTenant(record);
    form.setFieldsValue({
      ...record,
      expireDate: record.updatedAt ? dayjs(record.updatedAt) : null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteTenantMutation.mutate(id, {
      onSuccess: () => {
        message.success(t('common.deleteSuccess'));
      },
    });
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (editingTenant) {
        updateTenantMutation.mutate(
          { id: editingTenant.id, data: values },
          {
            onSuccess: () => {
              message.success(t('common.editSuccess'));
              setIsModalVisible(false);
            },
          },
        );
      } else {
        createTenantMutation.mutate(values, {
          onSuccess: () => {
            message.success(t('common.createSuccess'));
            setIsModalVisible(false);
          },
        });
      }
    });
  };

  const columns = [
    {
      title: t('system.tenant.tenantName'),
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text: string) => <span className="font-semibold whitespace-nowrap">{text}</span>,
    },
    { title: t('system.tenant.tenantCode'), dataIndex: 'code', key: 'code', width: 160 },
    {
      title: t('system.tenant.industry'),
      dataIndex: 'industry',
      key: 'industry',
      width: 220,
      render: (industry: string) => industry ? <Tag>{industry}</Tag> : <span className="text-gray-400">{t('system.tenant.industryUnconfigured')}</span>,
    },
    {
      title: t('system.tenant.templateStatus'),
      dataIndex: 'initStatus',
      key: 'initStatus',
      width: 180,
      render: (status: string) => {
      const cfg = initStatusConfig[status ?? 'pending'] ?? initStatusConfig.pending;
      return <Tag color={cfg.color}>{cfg.label}</Tag>;
    }},
    { title: t('common.status'), dataIndex: 'status', key: 'status', width: 120, render: (status: string, record: any) => (
      <Switch
        size="small"
        checked={status === 'active'}
        disabled={!canStatus}
        onChange={(checked) => {
          updateTenantStatusMutation.mutate(
            { id: record.id, status: checked ? 'active' : 'inactive' },
            { onSuccess: () => message.success(t('common.updateSuccess')) },
          );
        }}
      />
    )},
    { title: t('common.createTime'), dataIndex: 'createdAt', key: 'createdAt', width: 220 },
    { title: t('common.actions'), key: 'action', width: 220, render: (_: any, record: any) => (
      <Space className="whitespace-nowrap">
        {canUpdate && (
          <Button type="link" size="small" onClick={() => handleEdit(record)} style={{ paddingInline: 0 }}>
            {t('common.edit')}
          </Button>
        )}
        {canUpdate && (
          <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => setIndustrySetupTenant(record)} style={{ paddingInline: 0 }}>
            {t('system.tenant.industryConfig')}
          </Button>
        )}
        {canDelete && (
          <Popconfirm title={t('common.deleteConfirm')} onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger style={{ paddingInline: 0 }}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        )}
      </Space>
    )}
  ];

  return (
    <PageContainer title={t('system.tenant.title')}>
      <Card variant="borderless" className="shadow-sm">
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message={t('system.tenant.securityTipTitle')}
          description={t('system.tenant.securityTipDesc')}
        />
        <div className="mb-4 flex justify-end">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!canCreate}>{t('system.tenant.createTenant')}</Button>
        </div>
        <Table
          columns={columns}
          dataSource={tenantData?.records ?? []}
          rowKey="id"
          scroll={{ x: 1160 }}
          loading={isLoading}
          pagination={{
            current: queryParams.page,
            pageSize: queryParams.size,
            total: tenantData?.total ?? 0,
            onChange: (page, size) => setQueryParams({ page, size }),
            showSizeChanger: true,
            showTotal: (total) => t('common.total', { total }),
          }}
        />
      </Card>

      <Modal
        title={editingTenant ? t('system.tenant.editTenant') : t('system.tenant.createTenant')}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={createTenantMutation.isPending || updateTenantMutation.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={t('system.tenant.tenantName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label={t('system.tenant.tenantCode')} rules={[{ required: true }]}>
            <Input disabled={!!editingTenant} />
          </Form.Item>
          <Form.Item name="description" label={t('common.description')}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="logoUrl" label={t('system.tenant.logoUrl')}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label={t('common.status')}>
            <Select>
              <Select.Option value="active">{t('system.tenant.statusActive')}</Select.Option>
              <Select.Option value="inactive">{t('system.tenant.statusInactive')}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 行业配置向导 */}
      {industrySetupTenant && (
        <TenantIndustrySetup
          tenant={industrySetupTenant}
          open={!!industrySetupTenant}
          onClose={() => setIndustrySetupTenant(null)}
          onSuccess={() => {
            setIndustrySetupTenant(null);
            message.success(t('system.tenant.industryInitCompleted'));
          }}
        />
      )}
    </PageContainer>
  );
}

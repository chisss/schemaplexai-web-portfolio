import { useState } from 'react';
import { Card, Table, Button, Input, Space, Tag, Modal, Form, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useAllRoles } from '@/api/system';
import { useAuthStore } from '@/store/useAuthStore';

export default function SystemUser() {
  const { t } = useTranslation();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('system:user:create');
  const canUpdate = hasPermission('system:user:update');
  const canDelete = hasPermission('system:user:delete');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();
  const [queryParams, setQueryParams] = useState({ page: 1, size: 10 });
  const [searchKeyword, setSearchKeyword] = useState('');

  const { data: userData, isLoading } = useUsers(queryParams);
  const { data: allRoles } = useAllRoles();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active' });
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingUser(record);
    form.setFieldsValue({
      ...record,
      roleIds: record.roles?.map((r: any) => r.id) ?? [],
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteUserMutation.mutate(id, {
      onSuccess: () => {
        message.success(t('common.deleteSuccess'));
      },
    });
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (editingUser) {
        updateUserMutation.mutate(
          { id: editingUser.id, data: values },
          {
            onSuccess: () => {
              message.success(t('system.user.editSuccess'));
              setIsModalVisible(false);
            },
          },
        );
      } else {
        createUserMutation.mutate(values, {
          onSuccess: () => {
            message.success(t('system.user.addSuccess'));
            setIsModalVisible(false);
          },
        });
      }
    });
  };

  const handleSearch = () => {
    setQueryParams((prev) => ({ ...prev, page: 1, keyword: searchKeyword }));
  };

  const columns = [
    { title: t('system.user.username'), dataIndex: 'username', key: 'username', ellipsis: true },
    { title: t('system.user.nickname'), dataIndex: 'realName', key: 'realName', ellipsis: true },
    {
      title: t('system.user.role'),
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: any[]) =>
        roles?.map((r) => (
          <Tag color="blue" key={r.id}>
            {r.name}
          </Tag>
        )) ?? '-',
    },
    { title: t('system.user.email'), dataIndex: 'email', key: 'email', ellipsis: true },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? t('system.user.statusNormal') : t('system.user.statusDisabled')}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          {canUpdate && (
            <Button type="link" size="small" onClick={() => handleEdit(record)} style={{ paddingInline: 0 }}>
              {t('common.edit')}
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
      ),
    },
  ];

  return (
    <PageContainer title={t('system.user.title')}>
      <Card variant="borderless" className="shadow-sm">
        <div className="mb-4 flex justify-between flex-wrap gap-2">
          <Space wrap>
            <Input
              placeholder={t('common.search') + '...'}
              prefix={<SearchOutlined />}
              className="w-56"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Button onClick={handleSearch}>{t('common.search')}</Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!canCreate}>{t('system.user.addUser')}</Button>
        </div>
        <Table
          columns={columns}
          dataSource={userData?.records ?? []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: queryParams.page,
            pageSize: queryParams.size,
            total: userData?.total ?? 0,
            onChange: (page, size) => setQueryParams({ page, size }),
            showSizeChanger: true,
            showTotal: (total) => t('common.total', { total }),
          }}
        />
      </Card>

      <Modal
        title={editingUser ? t('system.user.editUser') : t('system.user.addUser')}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={createUserMutation.isPending || updateUserMutation.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label={t('system.user.username')} rules={[{ required: true }]}>
            <Input disabled={!!editingUser} />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label={t('system.user.initialPassword')} rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="realName" label={t('system.user.nickname')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label={t('system.user.email')}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label={t('system.user.phone')}>
            <Input />
          </Form.Item>
          <Form.Item name="roleIds" label={t('system.user.role')}>
            <Select
              mode="multiple"
              allowClear
              placeholder={t('system.user.selectRole')}
              options={allRoles?.map((r: any) => ({ label: r.name, value: r.id })) ?? []}
            />
          </Form.Item>
          <Form.Item name="status" label={t('system.user.enabled')}>
            <Select>
              <Select.Option value="active">{t('system.user.statusNormal')}</Select.Option>
              <Select.Option value="inactive">{t('system.user.statusDisabled')}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

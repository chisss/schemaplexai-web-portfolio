/**
 * 角色管理页面
 * 支持卡片视图和表格列表视图切换
 */
import { memo, useState } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Drawer, Tree,
  Row, Col, Skeleton, Empty, Popconfirm, Switch, message,
} from 'antd';
import {
  PlusOutlined, AppstoreOutlined, UnorderedListOutlined,
  EditOutlined, DeleteOutlined, TeamOutlined, KeyOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, useUpdateRoleStatus, useAllPermissions } from '@/api/system';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';

/** 单张角色卡片（提取到组件外避免重复渲染） */
interface RoleCardProps {
  role: any;
  isDark: boolean;
  canAssign: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onAssignMenu: (role: any) => void;
  onEdit: (role: any) => void;
  onDelete: (id: string) => void;
}

const RoleCard = memo(function RoleCard({ role, isDark, canAssign, canUpdate, canDelete, onAssignMenu, onEdit, onDelete }: RoleCardProps) {
  const { t } = useTranslation();
  const isSystem = role.code === 'SUPER_ADMIN' || role.code === 'ADMIN';
  const isActive = role.status === 'active';
  const permCount = role.permissions?.length ?? 0;

  return (
    <Card
      hoverable
      style={{
        height: '100%',
        border: `1px solid var(--color-border)`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
      styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
    >
      {/* 头部：图标 + 名称 + 状态 */}
      <div
        style={{
          padding: '20px 20px 16px',
          background: isDark
            ? `rgba(22,93,255,0.06)`
            : `rgba(22,93,255,0.04)`,
          borderRadius: '12px 12px 0 0',
        }}
      >
        {/* 第一行：图标 + 角色名 + 状态标签 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
              background: isSystem
                ? 'var(--color-warning)'
                : 'var(--color-primary)',
              color: '#fff',
              boxShadow: 'none',
            }}
          >
            <TeamOutlined />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={{
              fontSize: 18, fontWeight: 600,
              color: 'var(--color-text-primary)',
              lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {role.name}
            </div>
          </div>
          <Tag
            color={isActive ? 'success' : 'error'}
            style={{ borderRadius: 12, fontWeight: 500, margin: 0, flexShrink: 0 }}
          >
            {isActive ? t('system.user.statusNormal') : t('system.user.statusDisabled')}
          </Tag>
        </div>
        {/* 第二行：角色代码 + 系统角色标签 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <Tag style={{ margin: 0, borderRadius: 4, fontSize: 11 }}>{role.code}</Tag>
          {isSystem && <Tag color="warning" style={{ margin: 0, borderRadius: 4, fontSize: 11 }}>{t('system.role.systemRole')}</Tag>}
        </div>
      </div>

      {/* 内容 */}
      <div style={{ padding: '16px 20px', flex: 1, overflow: 'hidden' }}>
        {role.description && (
          <p style={{
            fontSize: 13, color: 'var(--color-text-secondary)',
            margin: '0 0 12px', lineHeight: 1.5,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {role.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          <KeyOutlined style={{ color: 'var(--color-primary)' }} />
          <span>{t('system.role.permissionCount')}</span>
          <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{permCount}</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 4,
          flexWrap: 'wrap',
        }}
      >
        {canAssign && (
          <Button
              size="small"
              type="text"
              icon={<KeyOutlined />}
              onClick={() => onAssignMenu(role)}
              style={{ color: 'var(--color-primary)', fontWeight: 500, fontSize: 12, padding: '0 6px' }}
          >
            {t('system.role.assignMenu')}
          </Button>
        )}
        {canUpdate && (
          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(role)}
            style={{ color: 'var(--color-primary)', fontWeight: 500, fontSize: 12, padding: '0 6px' }}
          >
            {t('common.edit')}
          </Button>
        )}
        {canDelete && (
          <Popconfirm title={t('common.deleteConfirm')} onConfirm={() => onDelete(role.id)}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} style={{ fontWeight: 500, fontSize: 12, padding: '0 6px' }}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        )}
      </div>
    </Card>
  );
});

export default function SystemRole() {
  const { t } = useTranslation();
  const { theme } = useAppStore();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('system:role:create');
  const canUpdate = hasPermission('system:role:update');
  const canDelete = hasPermission('system:role:delete');
  const canAssign = hasPermission('system:role:assign');
  const canStatus = hasPermission('system:role:status');
  const isDark = theme === 'dark';
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [checkedMenuKeys, setCheckedMenuKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();
  const [queryParams, setQueryParams] = useState({ page: 1, size: 10 });

  const { data: roleData, isLoading } = useRoles(queryParams);
  const { data: menuTreeData } = useAllPermissions();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const updateRoleStatusMutation = useUpdateRoleStatus();

  const roles = roleData?.records ?? [];

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRole(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteRoleMutation.mutate(id, {
      onSuccess: () => {
        message.success(t('common.deleteSuccess'));
      },
    });
  };

  const handleAssignMenu = (record: any) => {
    setEditingRole(record);
    // 用 menu + button 类型的 permission ID 初始化（两者均为树中叶子节点，排除 dir）
    const leafKeys = (record.permissions ?? [])
      .filter((p: any) => p.type === 'menu' || p.type === 'button')
      .map((p: any) => p.id);
    setCheckedMenuKeys(leafKeys);
    setIsDrawerVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (editingRole) {
        updateRoleMutation.mutate(
          { id: editingRole.id, data: values },
          {
            onSuccess: () => {
              message.success(t('common.editSuccess'));
              setIsModalVisible(false);
            },
          },
        );
      } else {
        createRoleMutation.mutate(values, {
          onSuccess: () => {
            message.success(t('common.createSuccess'));
            setIsModalVisible(false);
          },
        });
      }
    });
  };

  const handleSaveMenu = () => {
    if (!editingRole || !menuTreeData) return;
    // 1. 过滤出真实 permission IDs（排除虚拟节点：__dir__ / __pages__ / __group__）
    const realIds = (checkedMenuKeys as string[]).filter(
      (k) => !k.startsWith('__dir__') && !k.startsWith('__pages__') && !k.startsWith('__group__'),
    );
    // 2. 根据已选权限，自动补全所属模块的 dir 权限
    const selectedDirCodes = new Set<string>();
    const realIdSet = new Set(realIds);
    menuTreeData.forEach((p: any) => {
      if ((p.type === 'menu' || p.type === 'button') && realIdSet.has(p.id)) {
        selectedDirCodes.add((p.code || '').split(':')[0]);
      }
    });
    const dirIds: string[] = [];
    menuTreeData.forEach((p: any) => {
      if (p.type === 'dir' && selectedDirCodes.has(p.code)) {
        dirIds.push(p.id);
      }
    });
    // 3. 合并去重（menu + button + dir）
    const permissionIds = [...new Set([...realIds, ...dirIds])];
    updateRoleMutation.mutate(
      { id: editingRole.id, data: { permissionIds } },
      {
        onSuccess: () => {
          message.success(t('system.role.assignSuccess'));
          setIsDrawerVisible(false);
        },
      },
    );
  };

  /**
   * 智能分组权限树：dir → 页面访问(menu) + 操作权限(button)
   * - menu 权限作为可勾选叶子节点，放在「页面访问」分组下
   * - button 权限：2 段 code 直接挂 dir，3+ 段按中间段分组
   * - 虚拟节点 key: __dir__xxx / __pages__xxx / __group__xxx
   * - 真实权限节点 key: permission.id（menu 和 button 均可勾选）
   */
  const toTreeData = (permissions: any[] | undefined): any[] => {
    if (!permissions || permissions.length === 0) return [];

    const dirs: any[] = [];
    const menusByDirCode: Record<string, any[]> = {};
    const simpleButtonsByDir: Record<string, any[]> = {};
    const groupedButtons: Record<string, Record<string, any[]>> = {};

    permissions.forEach((p) => {
      if (p.type === 'dir') {
        dirs.push(p);
      } else if (p.type === 'menu') {
        const dirCode = (p.code || '').split(':')[0];
        if (!menusByDirCode[dirCode]) menusByDirCode[dirCode] = [];
        menusByDirCode[dirCode].push(p);
      } else if (p.type === 'button') {
        const parts = (p.code || '').split(':');
        const dirCode = parts[0];
        if (parts.length === 2) {
          if (!simpleButtonsByDir[dirCode]) simpleButtonsByDir[dirCode] = [];
          simpleButtonsByDir[dirCode].push(p);
        } else {
          const subGroup = parts.slice(1, -1).join(':');
          if (!groupedButtons[dirCode]) groupedButtons[dirCode] = {};
          if (!groupedButtons[dirCode][subGroup]) groupedButtons[dirCode][subGroup] = [];
          groupedButtons[dirCode][subGroup].push(p);
        }
      }
    });

    return dirs.map((dir) => {
      const dirCode = dir.code;
      const children: any[] = [];

      // 「页面访问」分组：menu 权限作为可勾选叶子节点
      const menus = menusByDirCode[dirCode] || [];
      if (menus.length > 0) {
        children.push({
          title: <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>📄 {t('system.role.pageAccess')}</span>,
          key: `__pages__${dirCode}`,
          children: menus.map((menu) => ({
            title: <span>{menu.name} <code style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{menu.code}</code></span>,
            key: menu.id,
          })),
        });
      }

      // 简单 button 直接作为 dir 子节点
      (simpleButtonsByDir[dirCode] || []).forEach((btn) => {
        children.push({
          title: <span>{btn.name} <code style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{btn.code}</code></span>,
          key: btn.id,
        });
      });

      // 复合 button 按 sub-group 分组
      const groups = groupedButtons[dirCode] || {};
      Object.entries(groups).forEach(([subGroup, buttons]) => {
        const groupKey = `${dirCode}:${subGroup}`;
        const displayName = subGroup.charAt(0).toUpperCase() + subGroup.slice(1);
        children.push({
          title: <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{displayName}</span>,
          key: `__group__${groupKey}`,
          children: buttons.map((btn) => ({
            title: <span>{btn.name} <code style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{btn.code}</code></span>,
            key: btn.id,
          })),
        });
      });

      return {
        title: <span style={{ fontWeight: 600 }}>{dir.name}</span>,
        key: `__dir__${dirCode}`,
        children,
      };
    });
  };

  /** 表格列定义 */
  const columns = [
    { title: t('system.role.roleName'), dataIndex: 'name', key: 'name' },
    { title: t('system.role.roleCode'), dataIndex: 'code', key: 'code', render: (code: string) => <Tag>{code}</Tag> },
    { title: t('common.description'), dataIndex: 'description', key: 'description' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => {
        const isSystem = record.code === 'SUPER_ADMIN' || record.code === 'ADMIN';
        return (
          <Switch
            size="small"
            checked={status === 'active'}
            disabled={isSystem || !canStatus}
            onChange={(checked) => {
              updateRoleStatusMutation.mutate(
                { id: record.id, status: checked ? 'active' : 'inactive' },
                { onSuccess: () => message.success(t('common.updateSuccess')) },
              );
            }}
          />
        );
      },
    },
    { title: t('common.actions'), key: 'action', render: (_: any, record: any) => (
      <Space>
        {canAssign && (
          <Button type="link" size="small" onClick={() => handleAssignMenu(record)}>
            {t('system.role.assignMenu')}
          </Button>
        )}
        {canUpdate && (
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            {t('common.edit')}
          </Button>
        )}
        {canDelete && (
          <Popconfirm title={t('common.deleteConfirm')} onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        )}
      </Space>
    )}
  ];

  return (
    <PageContainer title={t('system.role.title')}>
      <Card variant="borderless" className="shadow-sm">
        {/* 顶部操作栏 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            {t('system.role.totalRolesPrefix')} <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{roles.length}</span> {t('system.role.totalRolesSuffix')}
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
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!canCreate}>
              {t('system.role.createRole')}
            </Button>
          </Space>
        </div>

        {/* 卡片视图 */}
        {viewMode === 'card' && (
          <>
            {isLoading ? (
              <Row gutter={[20, 20]}>
                {[1, 2, 3].map((i) => (
                  <Col key={i} xs={24} sm={12} lg={8}>
                    <Card style={{ borderRadius: 12 }}>
                      <Skeleton active avatar paragraph={{ rows: 3 }} />
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : roles.length === 0 ? (
              <Empty description={t('system.role.noData')} />
            ) : (
              <Row gutter={[20, 20]}>
                {roles.map((role: any) => (
                  <Col key={role.id} xs={24} sm={12} lg={8}>
                    <RoleCard
                      role={role}
                      isDark={isDark}
                      canAssign={canAssign}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      onAssignMenu={handleAssignMenu}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </>
        )}

        {/* 列表视图 */}
        {viewMode === 'list' && (
          <Table
            columns={columns}
            dataSource={roles}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: queryParams.page,
              pageSize: queryParams.size,
              total: roleData?.total ?? 0,
              onChange: (page, size) => setQueryParams({ page, size }),
              showSizeChanger: true,
              showTotal: (total) => t('common.total', { total }),
            }}
          />
        )}
      </Card>

      <Modal
        title={editingRole ? t('system.role.editRole') : t('system.role.createRole')}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={createRoleMutation.isPending || updateRoleMutation.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={t('system.role.roleName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label={t('system.role.roleCode')} rules={[{ required: true }]}>
            <Input disabled={!!editingRole} />
          </Form.Item>
          <Form.Item name="description" label={t('common.description')}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={t('system.role.assignMenuTitle', { name: editingRole?.name })}
        placement="right"
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        width={400}
        extra={
          <Button type="primary" onClick={handleSaveMenu} loading={updateRoleMutation.isPending}>
            {t('system.role.saveAssignment')}
          </Button>
        }
      >
        <Tree
          checkable
          defaultExpandAll
          checkedKeys={checkedMenuKeys}
          onCheck={(keys) => setCheckedMenuKeys(keys as React.Key[])}
          treeData={toTreeData(menuTreeData)}
        />
      </Drawer>
    </PageContainer>
  );
}

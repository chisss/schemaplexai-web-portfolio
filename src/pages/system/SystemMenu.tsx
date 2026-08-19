import { useState, useMemo } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, InputNumber,
  Select, Switch, message, Popconfirm, TreeSelect, Tooltip,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useMenuTree, useCreateMenu, useUpdateMenu, useDeleteMenu } from '@/api/system';
import { useAuthStore } from '@/store/useAuthStore';
import type { Menu } from '@/types/system';
interface ParentTreeNode {
  title: string;
  value: string;
  disabled?: boolean;
  children?: ParentTreeNode[];
}

/** 菜单类型配置 */
const MENU_TYPE_CONFIG = {
  dir:    { color: 'purple', labelKey: 'system.menu.typeDirectory' },
  menu:   { color: 'blue', labelKey: 'system.menu.typeMenu' },
  button: { color: 'green', labelKey: 'system.menu.typeButton' },
};

/** 将菜单树转为 TreeSelect 数据，仅允许选 dir/menu 作为父级 */
function toParentTreeData(tree: Menu[]): ParentTreeNode[] {
  return tree
    .filter((m) => m.menuType === 'dir' || m.menuType === 'menu')
    .map((m) => ({
      title: m.name,
      value: m.id,
      disabled: m.menuType === 'button',
      children: m.children?.length ? toParentTreeData(m.children) : undefined,
    }));
}

export default function SystemMenu() {
  const { t } = useTranslation();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('system:menu:create');
  const canUpdate = hasPermission('system:menu:update');
  const canDelete = hasPermission('system:menu:delete');

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [menuTypeValue, setMenuTypeValue] = useState<string>('menu');
  const [form] = Form.useForm();

  const { data: menuTree, isLoading } = useMenuTree();
  const createMenuMutation = useCreateMenu();
  const updateMenuMutation = useUpdateMenu();
  const deleteMenuMutation = useDeleteMenu();

  const parentTreeData = useMemo(() => toParentTreeData(menuTree ?? []), [menuTree]);

  const handleAdd = () => {
    setEditingMenu(null);
    setMenuTypeValue('menu');
    form.resetFields();
    form.setFieldsValue({ menuType: 'menu', sortOrder: 1, visible: true });
    setIsModalVisible(true);
  };

  const handleEdit = (record: Menu) => {
    setEditingMenu(record);
    setMenuTypeValue(record.menuType);
    form.setFieldsValue({
      ...record,
      visible: record.visible !== false,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteMenuMutation.mutate(id, {
      onSuccess: () => message.success(t('common.deleteSuccess')),
    });
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (editingMenu) {
        updateMenuMutation.mutate(
          { id: editingMenu.id, data: values },
          {
            onSuccess: () => {
              message.success(t('common.editSuccess'));
              setIsModalVisible(false);
            },
          },
        );
      } else {
        createMenuMutation.mutate(values, {
          onSuccess: () => {
            message.success(t('common.createSuccess'));
            setIsModalVisible(false);
          },
        });
      }
    });
  };

  const isButtonType = menuTypeValue === 'button';

  const columns: TableColumnsType<Menu> = [
    {
      title: t('system.menu.menuName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: t('system.menu.menuType'),
      dataIndex: 'menuType',
      key: 'menuType',
      width: 80,
      render: (type: string) => {
        const cfg = MENU_TYPE_CONFIG[type as keyof typeof MENU_TYPE_CONFIG];
        return cfg ? (
          <Tag color={cfg.color}>{t(cfg.labelKey)}</Tag>
        ) : (
          <Tag>{type}</Tag>
        );
      },
    },
    {
      title: t('system.menu.routePath'),
      dataIndex: 'path',
      key: 'path',
      width: 180,
      render: (v: string) => v || '-',
    },
    {
      title: t('system.menu.icon'),
      dataIndex: 'icon',
      key: 'icon',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: t('system.menu.permissionCode'),
      dataIndex: 'permissionCode',
      key: 'permissionCode',
      width: 200,
      render: (v: string) => v ? <code style={{ fontSize: 11 }}>{v}</code> : '-',
    },
    {
      title: t('common.sortOrder'),
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 70,
    },
    {
      title: t('system.menu.visible'),
      dataIndex: 'visible',
      key: 'visible',
      width: 60,
      render: (v: boolean) => (
        <Tag color={v !== false ? 'success' : 'default'}>
          {v !== false
            ? t('system.menu.visibleYes')
            : t('system.menu.visibleNo')}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 120,
      render: (_value, record) => (
        <Space>
          {canUpdate && (
            <Tooltip title={t('common.edit')}>
              <Button type="link" size="small" onClick={() => handleEdit(record)} style={{ paddingInline: 0 }}>
                {t('common.edit')}
              </Button>
            </Tooltip>
          )}
          {canDelete && (
            <Popconfirm
              title={t('common.deleteConfirm')}
              onConfirm={() => handleDelete(record.id)}
            >
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
    <PageContainer title={t('system.menu.title')}>
      <Card variant="borderless" className="shadow-sm">
        <div className="mb-4 flex justify-end">
          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              {t('system.menu.createMenu')}
            </Button>
          )}
        </div>
        <Table
          columns={columns}
          dataSource={menuTree ?? []}
          rowKey="id"
          loading={isLoading}
          defaultExpandAllRows
          pagination={false}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Modal
        title={editingMenu ? t('system.menu.editMenu') : t('system.menu.createMenu')}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={createMenuMutation.isPending || updateMenuMutation.isPending}
        destroyOnHidden
        width={560}
      >
        <Form form={form} layout="vertical">
          {/* 菜单类型 */}
          <Form.Item name="menuType" label={t('system.menu.menuType')} rules={[{ required: true }]}>
            <Select
              onChange={(val) => setMenuTypeValue(val)}
              options={[
                { value: 'dir', label: <span><Tag color="purple">{t('system.menu.typeDirectory')}</Tag> {t('system.menu.moduleDirectory')}</span> },
                { value: 'menu', label: <span><Tag color="blue">{t('system.menu.typeMenu')}</Tag> {t('system.menu.pageMenu')}</span> },
                { value: 'button', label: <span><Tag color="green">{t('system.menu.typeButton')}</Tag> {t('system.menu.buttonAction')}</span> },
              ]}
            />
          </Form.Item>

          {/* 父级菜单 */}
          <Form.Item name="parentId" label={t('system.menu.parentMenu')}>
            <TreeSelect
              treeData={parentTreeData}
              allowClear
              placeholder={t('system.menu.parentMenuPlaceholder')}
              showSearch
              treeNodeFilterProp="title"
              style={{ width: '100%' }}
            />
          </Form.Item>

          {/* 菜单名称 */}
          <Form.Item name="name" label={t('system.menu.menuName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          {/* 路由路径：按钮类型隐藏 */}
          {!isButtonType && (
            <Form.Item name="path" label={t('system.menu.routePath')} rules={[{ required: !isButtonType }]}>
              <Input placeholder={t('system.menu.routePathExample')} />
            </Form.Item>
          )}

          {/* 组件路径：按钮类型隐藏 */}
          {!isButtonType && (
            <Form.Item name="component" label={t('system.menu.componentPath')}>
              <Input placeholder={t('system.menu.componentPathExample')} />
            </Form.Item>
          )}

          {/* 图标：按钮类型隐藏 */}
          {!isButtonType && (
            <Form.Item name="icon" label={t('system.menu.icon')}>
              <Input placeholder={t('system.menu.iconExample')} />
            </Form.Item>
          )}

          {/* 权限标识 */}
          <Form.Item name="permissionCode" label={t('system.menu.permissionCode')}>
            <Input placeholder={t('system.menu.permissionCodeExample')} />
          </Form.Item>

          {/* 排序号 */}
          <Form.Item name="sortOrder" label={t('common.sortOrder')}>
            <InputNumber min={1} max={9999} style={{ width: '100%' }} />
          </Form.Item>

          {/* 可见性 */}
          <Form.Item name="visible" label={t('system.menu.visibleSwitch')} valuePropName="checked">
            <Switch
              checkedChildren={t('system.menu.show')}
              unCheckedChildren={t('system.menu.hide')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

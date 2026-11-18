import React from 'react';
import { Card, Table, Button, Space, Tag, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

/**
 * 维度配置页面
 */
const DimensionConfigPage: React.FC = () => {
  const { t } = useTranslation();
  const columns = [
    { title: t('quality.dimension.code'), dataIndex: 'code', key: 'code' },
    { title: t('quality.dimension.name'), dataIndex: 'name', key: 'name' },
    { title: t('quality.dimension.category'), dataIndex: 'category', key: 'category' },
    {
      title: t('common.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>{active ? t('common.enable') : t('common.disable')}</Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'action',
      render: () => (
        <Space>
          <Tooltip title={t('common.edit')}><Button type="text" size="small" icon={<EditOutlined />} /></Tooltip>
          <Tooltip title={t('common.delete')}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={t('quality.dimension.pageTitle')}
      variant="borderless"
      className="shadow-sm"
      extra={<Button type="primary" icon={<PlusOutlined />}>{t('quality.dimension.create')}</Button>}
    >
      <Table columns={columns} dataSource={[]} loading={false} />
    </Card>
  );
};

export default DimensionConfigPage;

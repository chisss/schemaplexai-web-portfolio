import React from 'react';
import { Card, Table, Button, Space, Tag, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

/**
 * 维度配置页面
 */
const DimensionConfigPage: React.FC = () => {
  const columns = [
    { title: '维度代码', dataIndex: 'code', key: 'code' },
    { title: '维度名称', dataIndex: 'name', key: 'name' },
    { title: '类别', dataIndex: 'category', key: 'category' },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>{active ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Tooltip title="编辑"><Button type="text" size="small" icon={<EditOutlined />} /></Tooltip>
          <Tooltip title="删除"><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="评估维度配置"
      variant="borderless"
      className="shadow-sm"
      extra={<Button type="primary" icon={<PlusOutlined />}>新建维度</Button>}
    >
      <Table columns={columns} dataSource={[]} loading={false} />
    </Card>
  );
};

export default DimensionConfigPage;

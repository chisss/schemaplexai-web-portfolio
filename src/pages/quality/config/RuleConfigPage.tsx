import React from 'react';
import { Card, Table, Button, Space, Tag, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

/**
 * 规则配置页面
 */
const RuleConfigPage: React.FC = () => {
  const columns = [
    { title: '规则代码', dataIndex: 'code', key: 'code' },
    { title: '规则名称', dataIndex: 'name', key: 'name' },
    { title: '维度', dataIndex: 'dimensionCode', key: 'dimensionCode' },
    { title: '类型', dataIndex: 'ruleType', key: 'ruleType' },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const color = severity === 'critical' ? 'red' : severity === 'warning' ? 'orange' : 'blue';
        return <Tag color={color}>{severity}</Tag>;
      },
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
      title="检测规则配置"
      variant="borderless"
      className="shadow-sm"
      extra={<Button type="primary" icon={<PlusOutlined />}>新建规则</Button>}
    >
      <Table columns={columns} dataSource={[]} loading={false} />
    </Card>
  );
};

export default RuleConfigPage;

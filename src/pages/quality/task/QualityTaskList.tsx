import React from 'react';
import { Card, Table, Tag } from 'antd';

/**
 * 质量任务列表
 */
const QualityTaskList: React.FC = () => {
  const columns = [
    { title: '任务ID', dataIndex: 'id', key: 'id', width: 200 },
    { title: '任务类型', dataIndex: 'taskType', key: 'taskType' },
    { title: 'Spec ID', dataIndex: 'specId', key: 'specId' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'default',
          running: 'processing',
          completed: 'success',
          failed: 'error',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  ];

  return (
    <Card title="质量任务监控" variant="borderless" className="shadow-sm">
      <Table columns={columns} dataSource={[]} loading={false} />
    </Card>
  );
};

export default QualityTaskList;

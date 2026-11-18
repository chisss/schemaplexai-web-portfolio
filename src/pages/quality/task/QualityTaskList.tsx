import React from 'react';
import { Card, Table, Tag } from 'antd';
import { useTranslation } from 'react-i18next';

/**
 * 质量任务列表
 */
const QualityTaskList: React.FC = () => {
  const { t } = useTranslation();
  const STATUS_LABEL_KEYS: Record<string, string> = {
    pending: 'quality.task.statusPending',
    running: 'quality.task.statusRunning',
    completed: 'quality.task.statusSucceeded',
    failed: 'quality.task.statusFailed',
  };
  const columns = [
    { title: t('quality.task.taskId'), dataIndex: 'id', key: 'id', width: 200 },
    { title: t('quality.task.taskType'), dataIndex: 'taskType', key: 'taskType' },
    { title: 'Spec ID', dataIndex: 'specId', key: 'specId' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'default',
          running: 'processing',
          completed: 'success',
          failed: 'error',
        };
        return <Tag color={colorMap[status] || 'default'}>{STATUS_LABEL_KEYS[status] ? t(STATUS_LABEL_KEYS[status]) : status}</Tag>;
      },
    },
    { title: t('common.createTime'), dataIndex: 'createdAt', key: 'createdAt' },
  ];

  return (
    <Card title={t('quality.task.monitorTitle')} variant="borderless" className="shadow-sm">
      <Table columns={columns} dataSource={[]} loading={false} />
    </Card>
  );
};

export default QualityTaskList;

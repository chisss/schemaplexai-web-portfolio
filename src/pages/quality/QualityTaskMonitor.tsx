import { useState } from 'react';
import { Badge, Card, Progress, Table, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { fetchQualityTasks } from '@/api/quality';
import type { QualityTask } from '@/types/quality';

interface QualityTaskMonitorProps {
  embedded?: boolean;
}

const STATUS_MAP: Record<string, 'default' | 'processing' | 'success' | 'error' | 'warning'> = {
  pending: 'default',
  running: 'processing',
  succeeded: 'success',
  failed: 'error',
  cancelled: 'warning',
};

export default function QualityTaskMonitor({ embedded = false }: QualityTaskMonitorProps) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const tasksQuery = useQuery({
    queryKey: ['quality-task-monitor', page, size],
    queryFn: async () => (await fetchQualityTasks({ page, size })).data,
    refetchInterval: 10_000,
  });

  const content = (
    <Card size="small" title="质量任务监控">
      <Table
        rowKey="id"
        loading={tasksQuery.isLoading}
        dataSource={tasksQuery.data?.records || []}
        scroll={{ x: 960 }}
        columns={[
          { title: '任务号', dataIndex: 'taskNo', width: 180 },
          {
            title: '问题类型',
            dataIndex: 'issueType',
            width: 120,
            render: (value: string) => <Tag>{value || '-'}</Tag>,
          },
          { title: '触发方式', dataIndex: 'triggerMode', width: 120, render: (value: string) => value || '-' },
          {
            title: '状态',
            dataIndex: 'status',
            width: 120,
            render: (value: string) => <Badge status={STATUS_MAP[(value || '').toLowerCase()] || 'default'} text={value || '-'} />,
          },
          {
            title: '进度',
            key: 'progress',
            width: 180,
            render: (_: unknown, record: QualityTask) => {
              const totalItems = record.totalItems || 0;
              const successItems = record.successItems || 0;
              const percent = totalItems > 0 ? Math.round((successItems / totalItems) * 100) : (record.progress || 0);
              return <Progress percent={percent} size="small" status={record.status === 'failed' ? 'exception' : undefined} />;
            },
          },
          { title: '失败数', dataIndex: 'failedItems', width: 100, render: (value: number) => value ?? 0 },
          { title: '创建时间', dataIndex: 'createdAt', width: 180, render: (value: string) => value || '-' },
        ]}
        pagination={{
          current: page,
          pageSize: size,
          total: tasksQuery.data?.total || 0,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage);
            setSize(nextSize);
          },
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </Card>
  );

  if (embedded) {
    return content;
  }

  return <div>{content}</div>;
}

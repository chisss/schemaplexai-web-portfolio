import { useState } from 'react';
import { Badge, Card, Progress, Table, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { fetchQualityTasks } from '@/api/quality';
import type { QualityTask } from '@/types/quality';
import { useTranslation } from 'react-i18next';

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

const STATUS_LABEL_KEYS: Record<string, string> = {
  pending: 'quality.task.statusPending',
  running: 'quality.task.statusRunning',
  succeeded: 'quality.task.statusSucceeded',
  failed: 'quality.task.statusFailed',
  cancelled: 'quality.task.statusCancelled',
};

const ISSUE_TYPE_LABEL_KEYS: Record<string, string> = {
  deviation: 'quality.ruleConfig.issueTypeDeviation',
  intent_defect: 'quality.ruleConfig.issueTypeIntentDefect',
};

export default function QualityTaskMonitor({ embedded = false }: QualityTaskMonitorProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const tasksQuery = useQuery({
    queryKey: ['quality-task-monitor', page, size],
    queryFn: async () => (await fetchQualityTasks({ page, size })).data,
    refetchInterval: 10_000,
  });

  const content = (
    <Card size="small" title={t('quality.task.monitorTitle')}>
      <Table
        rowKey="id"
        loading={tasksQuery.isLoading}
        dataSource={tasksQuery.data?.records || []}
        scroll={{ x: 960 }}
        columns={[
          { title: t('quality.task.taskNo'), dataIndex: 'taskNo', width: 180 },
          {
            title: t('quality.task.issueType'),
            dataIndex: 'issueType',
            width: 120,
            render: (value: string) => <Tag>{ISSUE_TYPE_LABEL_KEYS[value] ? t(ISSUE_TYPE_LABEL_KEYS[value]) : value || '-'}</Tag>,
          },
          { title: t('quality.task.triggerMode'), dataIndex: 'triggerMode', width: 120, render: (value: string) => value || '-' },
          {
            title: t('common.status'),
            dataIndex: 'status',
            width: 120,
            render: (value: string) => <Badge status={STATUS_MAP[(value || '').toLowerCase()] || 'default'} text={STATUS_LABEL_KEYS[(value || '').toLowerCase()] ? t(STATUS_LABEL_KEYS[(value || '').toLowerCase()]) : value || '-'} />,
          },
          {
            title: t('quality.task.progress'),
            key: 'progress',
            width: 180,
            render: (_: unknown, record: QualityTask) => {
              const totalItems = record.totalItems || 0;
              const successItems = record.successItems || 0;
              const percent = totalItems > 0 ? Math.round((successItems / totalItems) * 100) : (record.progress || 0);
              return <Progress percent={percent} size="small" status={record.status === 'failed' ? 'exception' : undefined} />;
            },
          },
          { title: t('quality.task.failedItems'), dataIndex: 'failedItems', width: 100, render: (value: number) => value ?? 0 },
          { title: t('common.createTime'), dataIndex: 'createdAt', width: 180, render: (value: string) => value || '-' },
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
          showTotal: (total) => t('common.total', { total }),
        }}
      />
    </Card>
  );

  if (embedded) {
    return content;
  }

  return <div>{content}</div>;
}

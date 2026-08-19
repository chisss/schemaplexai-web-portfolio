/**
 * 工作流执行详情列表页
 */
import { useMemo, useState } from 'react';
import { Table, Input, Select, Tag, Card, Modal, Spin, Button } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import EmptyState from '@/components/EmptyState/EmptyState';
import { useWorkflowInstances } from '@/api/workflow';
import type { WorkflowInstance } from '@/types/workflow';
import { formatDateTime } from '@/utils/date';
import WorkflowInstanceDetailContent from './components/WorkflowInstanceDetailContent';

const TRIGGER_TYPE_COLOR: Record<string, string> = {
  manual: 'blue',
  'trigger_manual': 'blue',
  'trigger_cron': 'orange',
  'trigger_event': 'purple',
  'spec-review': 'green',
  'spec-workbench': 'cyan',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'default',
  running: 'processing',
  paused: 'warning',
  completed: 'success',
  failed: 'error',
  cancelled: 'default',
};

export default function WorkflowExecutionList() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [triggerType, setTriggerType] = useState('');
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [queryParams, setQueryParams] = useState({ page: 1, size: 20 });

  // 详情弹窗状态
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | undefined>();
  const queryInstanceId = searchParams.get('instanceId') ?? undefined;
  const activeInstanceId = useMemo(
    () => selectedInstanceId ?? queryInstanceId,
    [queryInstanceId, selectedInstanceId],
  );
  const modalOpen = Boolean(activeInstanceId);

  const { data: instanceData, isLoading } = useWorkflowInstances({
    ...queryParams,
    status: status || undefined,
    triggerType: triggerType || undefined,
    keyword: keyword || undefined,
  });

  const instances = instanceData?.records ?? [];
  const total = instanceData?.total ?? 0;

  const triggerTypeOptions = [
    { value: '', label: t('workflow.categoryAll') },
    { value: 'manual', label: t('workflow.triggerManual') },
    { value: 'trigger_manual', label: t('workflow.triggerManual') },
    { value: 'trigger_cron', label: t('workflow.triggerCron') },
    { value: 'trigger_event', label: t('workflow.triggerEvent') },
    { value: 'spec-review', label: t('workflow.triggerSpecReview') },
    { value: 'spec-workbench', label: t('workflow.triggerSpecWorkbench') },
  ];

  const statusOptions = [
    { value: '', label: t('workflow.categoryAll') },
    { value: 'pending', label: t('workflow.statusPending') },
    { value: 'running', label: t('workflow.statusRunning') },
    { value: 'paused', label: t('workflow.statusPaused') },
    { value: 'completed', label: t('workflow.statusCompleted') },
    { value: 'failed', label: t('workflow.statusFailed') },
    { value: 'cancelled', label: t('workflow.statusCancelled') },
  ];

  const getTriggerTypeLabel = (type?: string) => {
    if (!type) return t('workflow.triggerUnknown');
    const option = triggerTypeOptions.find((o) => o.value === type);
    return option?.label || type;
  };

  const handleViewDetail = (record: WorkflowInstance) => {
    setSelectedInstanceId(record.id);
  };

  const handleCloseDetail = () => {
    // 关闭时同步清理 URL 参数，避免分享链接打开后保留过期弹窗状态。
    if (queryInstanceId) {
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete('instanceId');
      setSearchParams(nextSearchParams, { replace: true });
    }
    setSelectedInstanceId(undefined);
  };

  const columns = [
    {
      title: t('workflow.instanceName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('workflow.triggerType'),
      key: 'triggerType',
      width: 120,
      render: (_: unknown, record: WorkflowInstance) => {
        const type = record.triggerType || (record.variables?.triggerType as string);
        return (
          <Tag color={TRIGGER_TYPE_COLOR[type || ''] || 'default'}>
            {getTriggerTypeLabel(type)}
          </Tag>
        );
      },
    },
    {
      title: t('workflow.filterStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: string) => (
        <Tag color={STATUS_COLOR[val] || 'default'}>
          {t(`workflow.status${val.charAt(0).toUpperCase() + val.slice(1)}`) || val}
        </Tag>
      ),
    },
    {
      title: t('workflow.templateName'),
      dataIndex: 'templateName',
      key: 'templateName',
      width: 160,
      ellipsis: true,
      render: (val: string) => val || '-',
    },
    {
      title: t('workflow.relatedSpec'),
      dataIndex: 'specId',
      key: 'specId',
      width: 140,
      ellipsis: true,
      render: (val: string) => val ? <span className="font-mono text-xs">{val.slice(0, 8)}...</span> : '-',
    },
    {
      title: t('workflow.startedAt'),
      dataIndex: 'startedAt',
      key: 'startedAt',
      width: 170,
      render: (val: string) => val ? formatDateTime(val) : '-',
    },
    {
      title: t('workflow.completedAt'),
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: 170,
      render: (val: string) => val ? formatDateTime(val) : '-',
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: WorkflowInstance) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          {t('workflow.executionView')}
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <PageContainer title={t('workflow.executionList')}>
        <div className="flex justify-center py-20"><Spin size="large" /></div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={t('workflow.executionList')}>
      <Card variant="borderless" className="shadow-sm rounded-xl">
        {/* 筛选条件栏 */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
          <Input
            placeholder={t('workflow.filterKeyword')}
            prefix={<SearchOutlined style={{ color: 'var(--color-text-tertiary)' }} />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => setQueryParams((p) => ({ ...p, page: 1 }))}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            value={triggerType}
            onChange={(val) => { setTriggerType(val); setQueryParams((p) => ({ ...p, page: 1 })); }}
            style={{ width: 140 }}
            options={triggerTypeOptions}
            placeholder={t('workflow.filterTriggerType')}
          />
          <Select
            value={status}
            onChange={(val) => { setStatus(val); setQueryParams((p) => ({ ...p, page: 1 })); }}
            style={{ width: 140 }}
            options={statusOptions}
            placeholder={t('workflow.filterStatus')}
          />
        </div>

        <Table
          columns={columns}
          dataSource={instances}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            current: queryParams.page,
            pageSize: queryParams.size,
            total,
            onChange: (page, size) => setQueryParams({ page, size }),
            showSizeChanger: true,
            showTotal: (count) => t('workflow.totalCount', { count }),
          }}
          locale={{
            emptyText: <EmptyState compact icon={<EyeOutlined />} title={t('workflow.emptySearchTitle')} />,
          }}
        />
      </Card>

      {/* 实例详情 Modal */}
      <Modal
        title={t('workflow.executionDetail')}
        open={modalOpen}
        onCancel={handleCloseDetail}
        footer={null}
        width="85%"
        style={{ top: 16 }}
        styles={{ body: { maxHeight: 'calc(100vh - 110px)', overflowY: 'auto', padding: '20px 32px' } }}
        destroyOnClose
      >
        {activeInstanceId && <WorkflowInstanceDetailContent instanceId={activeInstanceId} />}
      </Modal>
    </PageContainer>
  );
}

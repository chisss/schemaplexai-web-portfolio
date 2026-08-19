import { useState } from 'react';
import { Table, Button, Input, Select, Space, Tag, Badge, Modal, message } from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { formatDateTime } from '@/utils/date';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { usePipelines, useDeletePipeline, useTriggerPipeline } from '@/api/cicd';
import type { CicdPipeline, CicdPipelineQueryDTO } from '@/types/integration';
import { useAuthStore } from '@/store/useAuthStore';

const typeColorMap: Record<string, string> = {
  jenkins: 'red',
  gitlab_ci: 'orange',
  github_actions: 'blue',
};

const statusMap: Record<string, { color: string; textKey: string }> = {
  inactive: { color: 'default', textKey: 'common.inactive' },
  active: { color: 'success', textKey: 'common.active' },
};

const runStatusMap: Record<string, { color: string; textKey: string }> = {
  pending: { color: 'default', textKey: 'cicd.runStatusPending' },
  running: { color: 'processing', textKey: 'cicd.runStatusRunning' },
  success: { color: 'success', textKey: 'cicd.runStatusSuccess' },
  failed: { color: 'error', textKey: 'cicd.runStatusFailed' },
  cancelled: { color: 'warning', textKey: 'cicd.runStatusCancelled' },
};

export default function CicdList() {
  const { t } = useTranslation();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('integration:cicd:create');
  const canDelete = hasPermission('integration:cicd:delete');
  const navigate = useNavigate();
  const [query, setQuery] = useState<CicdPipelineQueryDTO>({ page: 1, size: 20 });
  const { data, isLoading } = usePipelines(query);
  const deleteMutation = useDeletePipeline();
  const triggerMutation = useTriggerPipeline();

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: t('common.confirmDelete'),
      content: `${t('common.confirmDeleteContent')} ${name}?`,
      onOk: () => deleteMutation.mutateAsync(id).then(() => message.success(t('common.deleteSuccess'))),
    });
  };

  const handleTrigger = (id: string) => {
    triggerMutation.mutateAsync(id).then(() => {
      message.success(t('cicd.triggerSuccess'));
    }).catch(() => {
      message.error(t('cicd.triggerFailed'));
    });
  };

  const columns = [
    {
      title: t('cicd.name'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CicdPipeline) => (
        <Link to={`/integration/cicd/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: t('cicd.pipelineType'),
      dataIndex: 'pipelineType',
      key: 'pipelineType',
      render: (val: string) => <Tag color={typeColorMap[val] || 'default'}>{val}</Tag>,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => {
        const s = statusMap[val] || { color: 'default', textKey: val };
        return <Badge status={s.color as any} text={t(s.textKey)} />;
      },
    },
    {
      title: t('cicd.lastRunStatus'),
      dataIndex: 'lastRunStatus',
      key: 'lastRunStatus',
      render: (val: string) => {
        if (!val) return '-';
        const s = runStatusMap[val] || { color: 'default', textKey: val };
        return <Badge status={s.color as any} text={t(s.textKey)} />;
      },
    },
    { title: t('cicd.lastRunAt'), dataIndex: 'lastRunAt', key: 'lastRunAt', render: (v: string) => v || '-' },
    { title: t('common.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (val: string) => formatDateTime(val) },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: CicdPipeline) => (
        <Space>
          <Button type="link" icon={<PlayCircleOutlined />} onClick={() => handleTrigger(record.id)}>
            {t('cicd.trigger')}
          </Button>
          {canDelete && (
            <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id, record.name)} />
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title={t('cicd.management')}
      extra={
        canCreate ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/integration/cicd/create')}>
            {t('cicd.create')}
          </Button>
        ) : null
      }
    >
      <Space className="mb-4" wrap>
        <Input
          placeholder={t('common.search')}
          prefix={<SearchOutlined />}
          allowClear
          onChange={(e) => setQuery((q) => ({ ...q, keyword: e.target.value, page: 1 }))}
          style={{ width: 240 }}
        />
        <Select
          placeholder={t('cicd.pipelineType')}
          allowClear
          onChange={(val) => setQuery((q) => ({ ...q, pipelineType: val, page: 1 }))}
          style={{ width: 180 }}
          options={[
            { label: t('cicd.typeJenkins'), value: 'jenkins' },
            { label: t('cicd.typeGitlabCi'), value: 'gitlab_ci' },
            { label: t('cicd.typeGithubActions'), value: 'github_actions' },
          ]}
        />
        <Select
          placeholder={t('common.status')}
          allowClear
          onChange={(val) => setQuery((q) => ({ ...q, status: val, page: 1 }))}
          style={{ width: 150 }}
          options={[
            { label: t('common.active'), value: 'active' },
            { label: t('common.inactive'), value: 'inactive' },
          ]}
        />
      </Space>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.records ?? []}
        pagination={{
          current: query.page,
          pageSize: query.size,
          total: data?.total ?? 0,
          onChange: (page, size) => setQuery((q) => ({ ...q, page, size })),
        }}
      />
    </PageContainer>
  );
}

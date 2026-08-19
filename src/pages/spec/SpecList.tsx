/**
 * Spec 列表页面
 * 支持列表/卡片/看板三种视图 + 状态/分类/优先级筛选
 */
import { useState, useMemo } from 'react';
import { Table, Button, Input, Space, Card, Popconfirm, message, Tag, Radio, Row, Col, Typography, Avatar, Select, Tooltip, Pagination } from 'antd';
import EmptyState from '@/components/EmptyState/EmptyState';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpecList, useDeleteSpec } from '@/api/spec';
import StatusTag from '@/components/StatusTag/StatusTag';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useAuthStore } from '@/store/useAuthStore';
import type { Spec, SpecPriority, SpecStatus, SpecCategory } from '@/types/spec';
import type { ColumnsType } from 'antd/es/table';
import { formatDateTime } from '@/utils/date';

const { Paragraph } = Typography;

const INLINE_ELLIPSIS_STYLE = {
  display: 'inline-block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  verticalAlign: 'bottom',
} as const;

/** 所有状态选项 */
const ALL_STATUSES: SpecStatus[] = [
  'draft',
  'requirements_review',
  'requirements_approved',
  'design_review',
  'design_approved',
  'tasks_review',
  'ready',
  'in_progress',
  'failed',
  'completed',
  'acceptance',
  'archived',
];

/** 所有分类选项 */
const ALL_CATEGORIES: SpecCategory[] = [
  'feature-development',
  'bug-fix',
  'refactoring',
  'data-analysis',
  'config-change',
];

/** 所有优先级选项 */
const ALL_PRIORITIES: SpecPriority[] = ['low', 'medium', 'high', 'critical'];

/** 看板列定义 - 按阶段分组，每列有专属色 */
const KANBAN_COLUMNS: { key: string; titleKey: string; statuses: SpecStatus[]; color: string }[] = [
  { key: 'draft', titleKey: 'spec.kanbanDraft', statuses: ['draft'], color: '#86909C' },
  { key: 'review', titleKey: 'spec.kanbanReview', statuses: ['requirements_review', 'design_review', 'tasks_review'], color: '#FF7D00' },
  { key: 'approved', titleKey: 'spec.kanbanApproved', statuses: ['requirements_approved', 'design_approved'], color: '#06b6d4' },
  { key: 'execution', titleKey: 'spec.kanbanExecution', statuses: ['ready', 'in_progress'], color: '#165DFF' },
  { key: 'failed', titleKey: 'spec.kanbanFailed', statuses: ['failed'], color: '#F53F3F' },
  { key: 'done', titleKey: 'spec.kanbanDone', statuses: ['completed', 'acceptance', 'archived'], color: '#10b981' },
];

type ViewMode = 'list' | 'card' | 'kanban';

export default function SpecList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('spec:create');
  const canDelete = hasPermission('spec:delete');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined);

  // 获取列表数据
  const { data, isLoading, refetch } = useSpecList({
    keyword,
    page,
    size,
    status: statusFilter,
    category: categoryFilter,
    priority: priorityFilter,
  });

  // 删除 Mutation
  const deleteSpec = useDeleteSpec();

  // 搜索
  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  // 删除
  const handleDelete = async (id: string) => {
    try {
      await deleteSpec.mutateAsync(id);
      message.success(t('common.deleteSuccess'));
      refetch();
    } catch {
      // 错误已在拦截器中处理
    }
  };

  // 优先级标签颜色
  const priorityColors: Record<string, string> = {
    low: 'default',
    medium: 'blue',
    high: 'orange',
    critical: 'red',
  };

  const priorityLabels: Record<string, string> = {
    low: t('spec.priorityLow'),
    medium: t('spec.priorityMedium'),
    high: t('spec.priorityHigh'),
    critical: t('spec.priorityCritical'),
  };

  const categoryLabels: Record<string, string> = {
    'feature-development': t('spec.categoryFeature'),
    'bug-fix': t('spec.categoryBugFix'),
    'refactoring': t('spec.categoryRefactoring'),
    'data-analysis': t('spec.categoryDataAnalysis'),
    'config-change': t('spec.categoryConfigChange'),
  };

  const categoryColors: Record<string, string> = {
    'feature-development': 'blue',
    'bug-fix': 'red',
    'refactoring': 'orange',
    'data-analysis': 'purple',
    'config-change': 'cyan',
  };

  /** 分类对应的卡片顶部色条 hex 及 Avatar 底色 */
  const categoryHex: Record<string, string> = {
    'feature-development': '#165DFF',
    'bug-fix': '#F53F3F',
    'refactoring': '#FF7D00',
    'data-analysis': '#8b5cf6',
    'config-change': '#06b6d4',
  };
  const categoryAvatarColors: Record<string, { bg: string; color: string }> = {
    'feature-development': { bg: 'rgba(22,93,255,0.12)', color: '#165DFF' },
    'bug-fix': { bg: 'rgba(245,63,63,0.12)', color: '#F53F3F' },
    'refactoring': { bg: 'rgba(255,125,0,0.12)', color: '#FF7D00' },
    'data-analysis': { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
    'config-change': { bg: 'rgba(6,182,212,0.12)', color: '#06b6d4' },
  };

  const statusLabels: Record<string, string> = {
    draft: t('spec.statusDraft'),
    requirements_review: t('spec.statusReqReview'),
    requirements_approved: t('spec.statusReqApproved'),
    design_review: t('spec.statusDesignReview'),
    design_approved: t('spec.statusDesignApproved'),
    tasks_review: t('spec.statusTaskReview'),
    ready: t('spec.statusReady'),
    in_progress: t('spec.statusInProgress'),
    failed: t('spec.statusFailed'),
    completed: t('spec.statusCompleted'),
    acceptance: t('spec.statusAcceptance'),
    archived: t('spec.statusArchived'),
  };

  const getLifecycleStatus = (spec: Spec) => {
    if (spec.lifecycleMode === 'workflow' && spec.workflowStatusSnapshot) {
      return spec.workflowStatusSnapshot;
    }
    return spec.status;
  };

  const getLifecycleTagType = (spec: Spec) =>
    (spec.lifecycleMode === 'workflow' && spec.workflowStatusSnapshot ? 'workflow' : 'spec') as 'workflow' | 'spec';

  const getKanbanBucket = (spec: Spec) => {
    if (spec.lifecycleMode !== 'workflow') {
      const matched = KANBAN_COLUMNS.find((col) => col.statuses.includes(spec.status as SpecStatus));
      return matched?.key || 'draft';
    }
    const workflowStatus = spec.workflowStatusSnapshot;
    if (!workflowStatus || workflowStatus === 'pending') {
      return 'draft';
    }
    if (workflowStatus === 'paused') {
      return 'review';
    }
    if (workflowStatus === 'completed') {
      return 'done';
    }
    if (workflowStatus === 'failed' || workflowStatus === 'cancelled') {
      return 'failed';
    }
    return 'execution';
  };

  // 前端二次过滤（优先级不通过后端筛选）
  const filteredRecords = useMemo(() => {
    let records = data?.records || [];
    if (priorityFilter) {
      records = records.filter((s) => s.priority === priorityFilter);
    }
    return records;
  }, [data?.records, priorityFilter]);

  // 看板数据分组
  const kanbanData = useMemo(() => {
    const result: Record<string, Spec[]> = {};
    KANBAN_COLUMNS.forEach((col) => {
      result[col.key] = filteredRecords.filter((s) => getKanbanBucket(s) === col.key);
    });
    return result;
  }, [filteredRecords]);

  // 表格列配置
  const columns: ColumnsType<Spec> = [
    {
      title: t('spec.name'),
      dataIndex: 'name',
      key: 'name',
      width: 250,
      fixed: 'left',
      onHeaderCell: () => ({ style: { zIndex: 20 } }),
      onCell: () => ({ style: { zIndex: 10 } }),
      render: (text, record) => (
        <Link to={`/spec/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: t('spec.category'),
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (category: string) =>
        category ? <Tag color={categoryColors[category]}>{categoryLabels[category] || category}</Tag> : '-',
    },
    {
      title: t('spec.version'),
      dataIndex: 'version',
      key: 'version',
      width: 100,
    },
    {
      title: 'Jira号',
      dataIndex: 'jiraTicket',
      key: 'jiraTicket',
      width: 210,
      render: (jiraTicket?: string) => jiraTicket ? (
        <Tooltip title={jiraTicket}>
          <Tag color="geekblue" style={{ maxWidth: 180, marginInlineEnd: 0 }}>
            <span style={{ ...INLINE_ELLIPSIS_STYLE, maxWidth: '100%' }}>{jiraTicket}</span>
          </Tag>
        </Tooltip>
      ) : '-',
    },
    {
      title: '所有者',
      dataIndex: 'ownerName',
      key: 'ownerName',
      width: 150,
      render: (_: string, record) => record.ownerName || record.owner || '-',
    },
    {
      title: '分支名称',
      dataIndex: 'targetBranch',
      key: 'targetBranch',
      width: 240,
      render: (targetBranch?: string) => targetBranch ? (
        <Tooltip title={targetBranch}>
          <span
            className="font-mono text-xs"
            style={{ ...INLINE_ELLIPSIS_STYLE, maxWidth: 210 }}
          >
            {targetBranch}
          </span>
        </Tooltip>
      ) : '-',
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (_status, record) => <StatusTag status={getLifecycleStatus(record) as any} type={getLifecycleTagType(record)} />,
    },
    {
      title: '当前节点',
      dataIndex: 'currentNodeLabel',
      key: 'currentNodeLabel',
      width: 180,
      render: (_currentNodeLabel, record) => record.currentNodeLabel || '-',
    },
    {
      title: t('spec.priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: SpecPriority) => (
        <Tag color={priorityColors[priority]}>{priorityLabels[priority]}</Tag>
      ),
    },
    {
      title: t('spec.tags'),
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <>
          {tags?.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      width: 220,
      ellipsis: true,
    },
    {
      title: t('common.updateTime'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 200,
      render: (time: string) => (
        <span style={{ whiteSpace: 'nowrap' }}>{formatDateTime(time)}</span>
      ),
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 210,
      fixed: 'right',
      onHeaderCell: () => ({ style: { zIndex: 20 } }),
      onCell: () => ({ style: { zIndex: 10 } }),
      render: (_, record) => (
        <Space size={0} style={{ flexWrap: 'nowrap' }}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/spec/${record.id}`)}
          >
            {t('spec.view')}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/spec/${record.id}/edit`)}
          >
            {t('spec.edit')}
          </Button>
          {canDelete && (
            <Popconfirm
              title={t('spec.deleteConfirm')}
              onConfirm={() => handleDelete(record.id)}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  /** 渲染卡片视图中的单个卡片 */
  const renderSpecCard = (spec: Spec) => {
    const accentColor = categoryHex[spec.category] || '#86909C';
    const avatarStyle = categoryAvatarColors[spec.category] || { bg: 'rgba(22,93,255,0.12)', color: '#165DFF' };
    const cleanDesc = (spec.description || '').replace(/^#+\s*/gm, '').trim();
    return (
      <Col xs={24} sm={12} lg={8} xl={6} key={spec.id} style={{ display: 'flex' }}>
        <Card
          hoverable
          className="shadow-sm rounded-xl"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--color-border)',
            boxShadow: `inset 0 3px 0 ${accentColor}, 0 1px 6px rgba(0,0,0,0.06)`,
            overflow: 'hidden',
          }}
          styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 } }}
          actions={[
            <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/spec/${spec.id}`)} key="view" style={{ color: 'var(--color-primary)' }}>
              {t('spec.view')}
            </Button>,
            <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/spec/${spec.id}/edit`)} key="edit" style={{ color: 'var(--color-text-secondary)' }}>
              {t('spec.edit')}
            </Button>,
            ...(canDelete ? [
              <Popconfirm title={t('common.deleteConfirm')} onConfirm={() => handleDelete(spec.id)} key="delete">
                <Button type="link" danger icon={<DeleteOutlined />}>{t('common.delete')}</Button>
              </Popconfirm>,
            ] : []),
          ]}
        >
          {/* 内容区 — flex:1 确保所有卡片等高，actions 底部对齐 */}
          <div style={{ padding: '16px 18px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Avatar + 标题 + 版本 */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
              <Avatar size={40} icon={<FileTextOutlined />} style={{ flexShrink: 0, background: avatarStyle.bg, color: avatarStyle.color }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.4, marginBottom: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                  title={spec.name}
                >
                  {spec.name}
                </div>
                <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>v{spec.version}</span>
              </div>
            </div>
            {/* 状态 + 分类标签 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              <StatusTag status={getLifecycleStatus(spec) as any} type={getLifecycleTagType(spec)} />
              {spec.category && (
                <Tag color={categoryColors[spec.category]} style={{ borderRadius: 10, margin: 0 }}>
                  {categoryLabels[spec.category] || spec.category}
                </Tag>
              )}
            </div>
            {spec.currentNodeLabel && (
              <div style={{ marginBottom: 10 }}>
                <Tag color="geekblue" style={{ borderRadius: 10, margin: 0 }}>
                  {spec.currentNodeLabel}
                </Tag>
              </div>
            )}
            {/* 描述 — flex:1 撑满剩余空间，push 用户标签到底部 */}
            <div style={{ flex: 1, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              {cleanDesc ? (
                <Paragraph style={{ color: 'inherit', fontSize: 'inherit', marginBottom: 0, lineHeight: 'inherit' }} ellipsis={{ rows: 2 }}>
                  {cleanDesc}
                </Paragraph>
              ) : (
                <span style={{ color: 'var(--color-text-tertiary)' }}>{t('common.noDescription')}</span>
              )}
            </div>
            {/* 用户标签 */}
            {spec.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {spec.tags.slice(0, 3).map((tag) => (
                  <Tag key={tag} style={{ borderRadius: 10, margin: 0, fontSize: 12 }}>{tag}</Tag>
                ))}
                {spec.tags.length > 3 && <Tag style={{ borderRadius: 10, margin: 0, fontSize: 12 }}>+{spec.tags.length - 3}</Tag>}
              </div>
            )}
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              <span>Jira: {spec.jiraTicket || '-'}</span>
              <span>Owner: {spec.ownerName || spec.owner || '-'}</span>
              <span>Branch: {spec.targetBranch || '-'}</span>
            </div>
          </div>
        </Card>
      </Col>
    );
  };

  /** 渲染看板视图 */
  const renderKanbanView = () => (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 500 }}>
      {KANBAN_COLUMNS.map((col) => (
        <div
          key={col.key}
          className="flex-shrink-0 rounded-xl"
          style={{
            width: 280,
            background: 'var(--color-bg-layout)',
            border: '1px solid var(--color-border)',
            borderTop: `3px solid ${col.color}`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 看板列头 */}
          <div
            className="px-4 py-3 font-semibold text-sm flex justify-between items-center"
            style={{
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-bg-layout)',
              borderRadius: '10px 10px 0 0',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, display: 'inline-block', flexShrink: 0 }} />
              {t(col.titleKey)}
            </span>
            <Tag style={{ background: `${col.color}18`, color: col.color, border: `1px solid ${col.color}40`, borderRadius: 10 }}>{kanbanData[col.key]?.length || 0}</Tag>
          </div>
          {/* 看板卡片区域 */}
          <div className="p-3 flex flex-col gap-3 flex-1 overflow-y-auto" style={{ maxHeight: 600 }}>
            {kanbanData[col.key]?.length > 0 ? (
              kanbanData[col.key].map((spec) => (
                <Card
                  key={spec.id}
                  size="small"
                  hoverable
                  className="rounded-lg shadow-sm cursor-pointer"
                  onClick={() => navigate(`/spec/${spec.id}`)}
                  styles={{ body: { padding: 12 } }}
                >
                  <div className="font-medium text-sm mb-2 line-clamp-2">{spec.name}</div>
                  <div className="flex items-center justify-between mb-2">
                    <StatusTag status={getLifecycleStatus(spec) as any} type={getLifecycleTagType(spec)} />
                    <Tag color={priorityColors[spec.priority]} className="text-xs">
                      {priorityLabels[spec.priority]}
                    </Tag>
                  </div>
                  {spec.currentNodeLabel && (
                    <div className="mb-2">
                      <Tag color="geekblue" className="text-xs">{spec.currentNodeLabel}</Tag>
                    </div>
                  )}
                  {spec.category && (
                    <Tag color={categoryColors[spec.category]} className="text-xs mb-2">{categoryLabels[spec.category] || spec.category}</Tag>
                  )}
                  <Paragraph className="text-gray-400 text-xs mb-0" ellipsis={{ rows: 2 }}>
                    {spec.description || t('common.noDescription')}
                  </Paragraph>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {spec.tags?.slice(0, 2).map((tag) => (
                      <Tag key={tag} className="text-xs">{tag}</Tag>
                    ))}
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState
                compact
                icon={<FileTextOutlined />}
                title={t('common.noData')}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <PageContainer
      title={t('spec.center')}
      extra={
        <Space>
          <Input.Search
            placeholder={t('spec.searchPlaceholder')}
            allowClear
            onSearch={handleSearch}
            style={{ width: 240 }}
            prefix={<SearchOutlined />}
          />
          <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
            <Radio.Button value="list"><UnorderedListOutlined /></Radio.Button>
            <Radio.Button value="card"><AppstoreOutlined /></Radio.Button>
            <Radio.Button value="kanban"><ProjectOutlined /></Radio.Button>
          </Radio.Group>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/spec/create')}
            disabled={!canCreate}
          >
            {t('spec.createSpec')}
          </Button>
        </Space>
      }
    >
      {/* 列表视图：筛选栏 + 表格在同一 Card */}
      {viewMode === 'list' && (
        <Card variant="borderless" className="shadow-sm rounded-xl">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
            <Select
              placeholder={t('spec.filterStatus')}
              allowClear
              style={{ width: 180 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={ALL_STATUSES.map((s) => ({ label: statusLabels[s] || s, value: s }))}
            />
            <Select
              placeholder={t('spec.filterCategory')}
              allowClear
              style={{ width: 180 }}
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={ALL_CATEGORIES.map((c) => ({ label: categoryLabels[c] || c, value: c }))}
            />
            <Select
              placeholder={t('spec.filterPriority')}
              allowClear
              style={{ width: 160 }}
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={ALL_PRIORITIES.map((p) => ({ label: priorityLabels[p] || p, value: p }))}
            />
          </div>
          <Table
            className="fixed-columns-table"
            columns={columns}
            dataSource={filteredRecords}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 1940 }}
            pagination={{
              current: page,
              pageSize: size,
              total: data?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => t('common.total', { total }),
              onChange: (p, s) => { setPage(p); setSize(s); },
            }}
          />
        </Card>
      )}

      {/* 卡片视图 */}
      {viewMode === 'card' && (
        filteredRecords.length === 0 ? (
          <Card variant="borderless" className="shadow-sm rounded-xl">
            <EmptyState
              icon={<FileTextOutlined />}
              title={t('spec.noSpecs')}
              description={t('spec.noSpecsDesc')}
              actions={canCreate ? [{ label: t('spec.createSpec'), onClick: () => navigate('/spec/create'), icon: <PlusOutlined /> }] : []}
            />
          </Card>
        ) : (
          <>
            <Row gutter={[24, 24]}>
              {filteredRecords.map((spec) => renderSpecCard(spec))}
            </Row>
            {(data?.total || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <Pagination
                  current={page}
                  pageSize={size}
                  total={data?.total || 0}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total) => t('common.total', { total })}
                  onChange={(p, s) => { setPage(p); setSize(s); }}
                />
              </div>
            )}
          </>
        )
      )}

      {/* 看板视图 */}
      {viewMode === 'kanban' && renderKanbanView()}
    </PageContainer>
  );
}

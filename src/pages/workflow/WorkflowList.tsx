import { useDeferredValue, useState } from 'react';
import { Table, Button, Input, Space, Tag, Card, Modal, message, Row, Col, Radio, Select, Typography, Spin, Grid, Pagination } from 'antd';
import {
  PlusOutlined, SearchOutlined, PlayCircleOutlined,
  AppstoreOutlined, UnorderedListOutlined, CrownOutlined,
  EditOutlined, DeleteOutlined, CheckCircleOutlined,
  PercentageOutlined, ThunderboltOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import EmptyState from '@/components/EmptyState/EmptyState';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useWorkflowTemplates, useDeleteWorkflowTemplate, useWorkflowTemplateStats, useToggleWorkflowTemplateStatus } from '@/api/workflow';
import type { WorkflowTemplate } from '@/types/workflow';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { formatDateTime } from '@/utils/date';

const { Text, Paragraph } = Typography;

const CATEGORY_COLOR: Record<string, string> = {
  'feature-development': 'blue',
  'bug-fix': 'red',
  'review': 'green',
  'custom': 'purple',
};

const TRIGGER_TYPE_COLOR: Record<string, string> = {
  'trigger_manual': 'blue',
  'trigger_cron': 'orange',
  'trigger_event': 'purple',
};

const CARD_ACTION_GROUP_BASE_STYLE: React.CSSProperties = {
  borderTop: '1px solid var(--color-border)',
  paddingTop: 10,
  gap: 8,
  alignItems: 'stretch',
};

const CARD_ACTION_BUTTON_STYLE: React.CSSProperties = {
  width: '100%',
  margin: 0,
  justifyContent: 'center',
};

export default function WorkflowList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hasPermission } = useAuthStore();
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const screens = Grid.useBreakpoint();
  const canCreate = hasPermission('workflow:create');
  const canUpdate = hasPermission('workflow:update');
  const canDelete = hasPermission('workflow:delete');
  const stackCardActions = !screens.lg;
  const cardActionGroupStyle: React.CSSProperties = {
    ...CARD_ACTION_GROUP_BASE_STYLE,
    display: 'flex',
    flexDirection: stackCardActions ? 'column' : 'row',
  };
  const cardActionButtonStyle: React.CSSProperties = {
    ...CARD_ACTION_BUTTON_STYLE,
    flex: stackCardActions ? undefined : 1,
  };

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [queryParams, setQueryParams] = useState({ page: 1, size: 20 });
  const deferredKeyword = useDeferredValue(keyword.trim());
  const filtersActive = Boolean(keyword.trim() || category);

  const { data: templateData, isLoading } = useWorkflowTemplates({
    ...queryParams,
    keyword: deferredKeyword || undefined,
    category: category || undefined,
  });
  const { data: statsData } = useWorkflowTemplateStats();
  const deleteTemplate = useDeleteWorkflowTemplate();
  const toggleStatus = useToggleWorkflowTemplateStatus();

  const templates = templateData?.records ?? [];
  const total = templateData?.total ?? 0;
  const categoryOptions = [
    { value: '', label: t('workflow.categoryAll') },
    { value: 'feature-development', label: t('workflow.categoryFeature') },
    { value: 'bug-fix', label: t('workflow.categoryBugFix') },
    { value: 'review', label: t('workflow.categoryReview') },
    { value: 'custom', label: t('workflow.categoryCustom') },
  ];

  const handleDelete = (record: WorkflowTemplate) => {
    if (record.isBuiltin) {
      message.warning(t('workflow.builtinCannotDelete'));
      return;
    }
    Modal.confirm({
      title: t('workflow.deleteTitle'),
      content: t('workflow.deleteContentWithName', { name: record.name }),
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: () =>
        deleteTemplate.mutateAsync(record.id).then(() => {
          message.success(t('common.deleteSuccess'));
        }),
    });
  };

  const handleToggleStatus = (record: WorkflowTemplate, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isPublished = record.status === 'published';
    const actionText = isPublished ? t('workflow.disable') : t('workflow.enable');
    Modal.confirm({
      title: `${actionText}${t('workflow.template')}`,
      content: t('workflow.toggleStatusContent', { name: record.name, action: actionText }),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: () =>
        toggleStatus.mutateAsync(record.id).then(() => {
          message.success(`${actionText}${t('common.success')}`);
        }),
    });
  };

  const handleOpenDesigner = (workflowId: string) => {
    navigate(`/workflow/designer?id=${workflowId}`);
  };

  // 仪表盘指标卡片
  const dashboardMetrics = (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      {[
        {
          icon: <CheckCircleOutlined style={{ fontSize: 22 }} />,
          label: t('workflow.statsActiveWorkflows'),
          value: statsData?.activeWorkflows ?? '-',
          color: '#165DFF',
          bgColor: isDark ? 'rgba(22, 93, 255, 0.15)' : 'rgba(22, 93, 255, 0.08)',
        },
        {
          icon: <PercentageOutlined style={{ fontSize: 22 }} />,
          label: t('workflow.statsAvgSuccessRate'),
          value: statsData?.avgSuccessRate != null ? `${statsData.avgSuccessRate}%` : '-',
          color: '#00B42A',
          bgColor: isDark ? 'rgba(0, 180, 42, 0.15)' : 'rgba(0, 180, 42, 0.08)',
        },
        {
          icon: <ThunderboltOutlined style={{ fontSize: 22 }} />,
          label: t('workflow.statsTotalRuns24h'),
          value: statsData?.totalRuns24h ?? '-',
          color: '#FF7D00',
          bgColor: isDark ? 'rgba(255, 125, 0, 0.15)' : 'rgba(255, 125, 0, 0.08)',
        },
      ].map((metric) => (
        <Col key={metric.label} xs={24} sm={8}>
          <Card
            variant="borderless"
            className="rounded-xl"
            style={{
              background: isDark ? '#2A2B2D' : '#FFFFFF',
              border: `1px solid ${isDark ? '#3D3E40' : '#E2E8F0'}`,
            }}
            styles={{ body: { padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 } }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: metric.bgColor,
                color: metric.color,
                flexShrink: 0,
              }}
            >
              {metric.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: isDark ? '#A0A1A3' : '#86909C', marginBottom: 4 }}>
                {metric.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: isDark ? '#E5E6EB' : '#1E293B', lineHeight: 1.2 }}>
                {metric.value}
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  // 表格列定义
  const columns = [
    {
      title: t('common.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (text: string, record: WorkflowTemplate) => (
        <div className="flex items-center gap-2">
          <Button
            type="link"
            className="!px-0 !font-medium"
            style={{ maxWidth: '100%' }}
            onClick={() => handleOpenDesigner(record.id)}
          >
            <span className="truncate">{text}</span>
          </Button>
          {record.isBuiltin && (
            <Tag icon={<CrownOutlined />} color="gold" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', flexShrink: 0 }}>
              {t('workflow.builtin')}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: t('workflow.category'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (cat: string) => (
        <Tag color={CATEGORY_COLOR[cat] || 'default'}>
          {categoryOptions.find((c) => c.value === cat)?.label || cat}
        </Tag>
      ),
    },
    {
      title: t('workflow.triggerType'),
      dataIndex: 'triggerType',
      key: 'triggerType',
      width: 120,
      render: (triggerType: string) =>
        triggerType ? (
          <Tag color={TRIGGER_TYPE_COLOR[triggerType] || 'default'}>
            {t(`workflow.${triggerType}`, { defaultValue: triggerType })}
          </Tag>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
        ),
    },
    {
      title: t('workflow.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const isPublished = status === 'published';
        return (
          <Tag color={isPublished ? 'green' : 'default'}>
            {isPublished ? t('workflow.statusPublished') : t('workflow.statusArchived')}
          </Tag>
        );
      },
    },
    {
      title: t('workflow.nodeCountShort'),
      key: 'nodes',
      width: 80,
      render: (_value: unknown, record: WorkflowTemplate) => (
        <span>{record.definition?.nodes?.length || 0}</span>
      ),
    },
    {
      title: t('agent.skills'),
      dataIndex: 'recommendedAgentSkills',
      key: 'skills',
      width: 200,
      ellipsis: true,
      render: (skills: string[]) =>
        skills?.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 3).map((s) => (
              <Tag key={s} style={{ fontSize: 10, padding: '0 4px' }}>{s}</Tag>
            ))}
            {skills.length > 3 && (
              <Tag style={{ fontSize: 10, padding: '0 4px' }}>+{skills.length - 3}</Tag>
            )}
          </div>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
        ),
    },
    {
      title: t('common.updateTime'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      render: (val: string) => (
        <Text style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{formatDateTime(val)}</Text>
      ),
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_value: unknown, record: WorkflowTemplate) => (
        <Space size={4} wrap={false}>
          {canUpdate && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenDesigner(record.id)}
            >
              {t('workflow.orchestrate')}
            </Button>
          )}
          {canUpdate && (
            <Button
              type="link"
              size="small"
              icon={record.status === 'published' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleToggleStatus(record)}
            >
              {record.status === 'published' ? t('workflow.disable') : t('workflow.enable')}
            </Button>
          )}
          {canDelete && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              disabled={record.isBuiltin}
            >
              {t('common.delete')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  /* 搜索栏 + 视图切换（公用） */
  const filterBar = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginBottom: 20,
        paddingBottom: 20,
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: screens.md ? 'center' : 'stretch',
          justifyContent: 'space-between',
          flexDirection: screens.md ? 'row' : 'column',
          gap: 16,
        }}
      >
        <Space orientation={screens.md ? 'horizontal' : 'vertical'} size={12} style={{ width: screens.md ? 'auto' : '100%' }}>
        <Input
          size="large"
          placeholder={t('workflow.searchPlaceholder')}
          prefix={<SearchOutlined style={{ color: 'var(--color-text-tertiary)' }} />}
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setQueryParams((prev) => ({ ...prev, page: 1 }));
          }}
          style={{ width: screens.md ? 280 : '100%' }}
          allowClear
        />
        <Select
          size="large"
          value={category}
          onChange={(val) => { setCategory(val); setQueryParams((p) => ({ ...p, page: 1 })); }}
          style={{ width: screens.md ? 168 : '100%' }}
          options={categoryOptions}
        />
      </Space>
        <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} size="middle">
        <Radio.Button value="card"><AppstoreOutlined /></Radio.Button>
        <Radio.Button value="list"><UnorderedListOutlined /></Radio.Button>
      </Radio.Group>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Tag color="blue">{t('workflow.totalCount', { count: total })}</Tag>
        {category && (
          <Tag color="cyan">
            {categoryOptions.find((item) => item.value === category)?.label || category}
          </Tag>
        )}
        {keyword.trim() && (
          <Tag color="geekblue">{keyword.trim()}</Tag>
        )}
        <Text type="secondary">
          {viewMode === 'card' ? t('spec.cardView') : t('spec.listView')}
        </Text>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <PageContainer title={t('workflow.center')}>
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={t('workflow.center')}
      description={t('workflow.designerEntry')}
      extra={
        canCreate ? (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/workflow/create')}
          >
            {t('workflow.createWorkflow')}
          </Button>
        ) : null
      }
    >
      {/* 仪表盘指标 */}
      {dashboardMetrics}

      {templates.length === 0 && !keyword && !category ? (
        /* 无数据空状态 */
        <Card variant="borderless" className="shadow-sm rounded-xl">
          <EmptyState
            icon={<PlayCircleOutlined />}
            title={t('workflow.emptyTitle')}
            description={t('workflow.emptyDescription')}
            actions={canCreate ? [{ label: t('workflow.emptyCreateAction'), onClick: () => navigate('/workflow/create'), icon: <PlusOutlined /> }] : []}
          />
        </Card>
      ) : viewMode === 'list' ? (
        /* 列表视图：搜索栏 + 表格同一 Card */
        <Card variant="borderless" className="shadow-sm rounded-xl">
          {filterBar}
          <Table
            columns={columns}
            dataSource={templates}
            rowKey="id"
            scroll={{ x: 1100 }}
            pagination={{
              current: queryParams.page,
              pageSize: queryParams.size,
              total,
              onChange: (page, size) => setQueryParams({ page, size }),
              showSizeChanger: screens.md,
              showTotal: (count) => t('workflow.totalCount', { count }),
            }}
            locale={{
              emptyText: (
                <EmptyState compact icon={<PlayCircleOutlined />} title={t('workflow.emptySearchTitle')} />
              ),
            }}
          />
        </Card>
      ) : (
        /* 卡片视图：搜索栏 + 卡片网格同一 Card */
        <Card variant="borderless" className="shadow-sm rounded-xl">
          {filterBar}
          {templates.length === 0 && filtersActive ? (
            <EmptyState compact icon={<PlayCircleOutlined />} title={t('workflow.emptySearchTitle')} />
          ) : templates.length === 0 ? (
            <EmptyState compact icon={<PlayCircleOutlined />} title={t('workflow.emptyTitle')} description={t('workflow.emptyDescription')} />
          ) : (
            <>
              <Row gutter={[16, 16]}>
                {templates.map((tpl) => {
                const nodeCount = tpl.definition?.nodes?.length || 0;
                const catColor = CATEGORY_COLOR[tpl.category] || 'default';
                const isPublished = tpl.status === 'published';
                return (
                  <Col key={tpl.id} xs={24} sm={12} lg={8} xl={6}>
                    <Card
                      hoverable
                      className="rounded-xl"
                      style={{
                        position: 'relative',
                        border: '1px solid var(--color-border)',
                        background: isDark
                          ? 'linear-gradient(180deg, rgba(22, 93, 255, 0.14), transparent 40%)'
                          : 'linear-gradient(180deg, rgba(22, 93, 255, 0.08), transparent 40%)',
                      }}
                      styles={{ body: { padding: '20px 20px 16px' } }}
                    >
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          aria-label={tpl.name}
                          onClick={() => handleOpenDesigner(tpl.id)}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            padding: 0,
                            border: 'none',
                            borderRadius: 16,
                            background: 'transparent',
                            cursor: 'pointer',
                          }}
                        />
                        <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
                          {/* 标题行 */}
                          <div className="flex items-center gap-2 mb-2">
                            <Text strong className="flex-1 truncate" style={{ fontSize: 14 }}>
                              {tpl.name}
                            </Text>
                            {tpl.isBuiltin && (
                              <CrownOutlined style={{ color: 'var(--color-warning)', fontSize: 14 }} />
                            )}
                            <Tag
                              color={isPublished ? 'green' : 'default'}
                              style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0 }}
                            >
                              {isPublished ? t('workflow.statusPublished') : t('workflow.statusArchived')}
                            </Tag>
                          </div>
                          {/* 描述 */}
                          <Paragraph
                            ellipsis={{ rows: 2 }}
                            style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12, minHeight: 36 }}
                          >
                            {tpl.description || t('common.noDescription')}
                          </Paragraph>
                          <div className="mb-3">
                            <Text style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                              {t('common.updateTime')} · {formatDateTime(tpl.updatedAt)}
                            </Text>
                          </div>
                          {/* 底部信息 */}
                          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                            <div className="flex items-center gap-2">
                              <Tag color={catColor} style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0 }}>
                                {categoryOptions.find((c) => c.value === tpl.category)?.label || tpl.category}
                              </Tag>
                              {tpl.triggerType && (
                                <Tag color={TRIGGER_TYPE_COLOR[tpl.triggerType] || 'default'} style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0 }}>
                                  {t(`workflow.${tpl.triggerType}`, { defaultValue: tpl.triggerType })}
                                </Tag>
                              )}
                              <Text style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                                {t('workflow.nodeCountText', { count: nodeCount })}
                              </Text>
                            </div>
                            {tpl.recommendedAgentSkills?.length > 0 && (
                              <Text style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                                {t('workflow.skillCountText', { count: tpl.recommendedAgentSkills.length })}
                              </Text>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* 操作按钮 */}
                      <div
                        style={cardActionGroupStyle}
                      >
                        {canUpdate && (
                          <Button
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={(e) => { e.stopPropagation(); handleOpenDesigner(tpl.id); }}
                            style={cardActionButtonStyle}
                          >
                            {t('workflow.orchestrate')}
                          </Button>
                        )}
                        {canUpdate && (
                          <Button
                            type="link"
                            size="small"
                            icon={isPublished ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                            onClick={(e) => handleToggleStatus(tpl, e)}
                            style={cardActionButtonStyle}
                          >
                            {isPublished ? t('workflow.disable') : t('workflow.enable')}
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            type="link"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => { e.stopPropagation(); handleDelete(tpl); }}
                            disabled={tpl.isBuiltin}
                            style={cardActionButtonStyle}
                          >
                            {t('common.delete')}
                          </Button>
                        )}
                      </div>
                    </Card>
                  </Col>
                );
                })}
              </Row>
              {total > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                  <Pagination
                    current={queryParams.page}
                    pageSize={queryParams.size}
                    total={total}
                    showSizeChanger={screens.md}
                    showTotal={(count) => t('workflow.totalCount', { count })}
                    onChange={(page, size) => setQueryParams({ page, size })}
                  />
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </PageContainer>
  );
}

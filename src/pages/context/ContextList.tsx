import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Tag, Card, Radio, Row, Col, Typography, Avatar, message, Modal, Select, Pagination } from 'antd';
import { PlusOutlined, SearchOutlined, AppstoreOutlined, UnorderedListOutlined, DatabaseOutlined, ApartmentOutlined, ClockCircleOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import KnowledgeGraph from './KnowledgeGraph';
import { useContextList, useDeleteContext, fetchContextRelations, useAllContexts } from '@/api/context';
import { useAuthStore } from '@/store/useAuthStore';
import EmptyState from '@/components/EmptyState/EmptyState';
import { formatDateTime } from '@/utils/date';


/** contextLevel → antd Tag 颜色 */
const LEVEL_COLOR_MAP: Record<string, string> = {
  global: 'purple',
  project: 'blue',
  task: 'cyan',
  agent: 'orange',
};

/** contextLevel → Avatar 背景色和图标色 */
const LEVEL_AVATAR_MAP: Record<string, { bg: string; color: string }> = {
  global: { bg: '#f3e8ff', color: 'var(--color-purple)' },
  project: { bg: '#e0f2fe', color: '#165DFF' },
  task: { bg: '#cffafe', color: '#0284c7' },
  agent: { bg: '#ffedd5', color: '#FF7D00' },
};

/** contextLevel → 卡片顶部色条 hex */
const LEVEL_HEX_MAP: Record<string, string> = {
  global: '#8b5cf6',
  project: '#165DFF',
  task: '#0284c7',
  agent: '#FF7D00',
};

const VECTOR_STATUS_MAP: Record<string, { color: string; label: string }> = {
  completed: { color: 'success', label: '已向量化' },
  processing: { color: 'processing', label: '处理中' },
  failed: { color: 'error', label: '失败' },
  none: { color: 'default', label: '未构建' },
};

export default function ContextList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('context:create');
  const canUpdate = hasPermission('context:update');
  const canDelete = hasPermission('context:delete');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [queryParams, setQueryParams] = useState<{ page: number; size: number; keyword?: string; contextLevel?: string }>({ page: 1, size: 10 });
  const { data: contextData, isLoading } = useContextList(queryParams);
  const { data: allContextData, isLoading: allLoading } = useAllContexts();
  const deleteContextMutation = useDeleteContext();

  // 使用全量数据构建知识图谱
  const allContextRecords = allContextData?.records || [];

  // 聚合所有上下文的关联关系，用于知识图谱实线边
  const [allRelations, setAllRelations] = useState<any[]>([]);
  useEffect(() => {
    if (!allContextRecords.length) return;
    Promise.all(allContextRecords.map((ctx: any) => fetchContextRelations(ctx.id).catch(() => [])))
      .then((results) => {
        const merged: any[] = [];
        const seen = new Set<string>();
        for (const list of results) {
          for (const rel of list) {
            if (!seen.has(rel.id)) {
              seen.add(rel.id);
              merged.push(rel);
            }
          }
        }
        setAllRelations(merged);
      });
  }, [allContextRecords.length]);

  // 筛选表单状态
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterLevel, setFilterLevel] = useState<string | undefined>(undefined);

  const handleSearch = () => {
    setQueryParams(prev => ({
      ...prev,
      page: 1,
      keyword: filterKeyword || undefined,
      contextLevel: filterLevel || undefined,
    }));
  };

  const columns = [
    {
      title: t('context.name'),
      dataIndex: 'name',
      key: 'name',
      width: 160,
      ellipsis: true,
      render: (text: string, record: any) => (
        <Link to={`/context/${record.id}`} className="font-medium text-primary">
          {text}
        </Link>
      ),
    },
    {
      title: t('context.level'),
      dataIndex: 'contextLevel',
      key: 'contextLevel',
      width: 100,
      render: (level: string) => {
        const labelMap: Record<string, string> = {
          'global': t('context.levelGlobal'),
          'project': t('context.levelProject'),
          'task': t('context.levelTask'),
          'agent': t('context.levelAgent'),
        };
        return <Tag color={LEVEL_COLOR_MAP[level] || 'default'}>{labelMap[level] || level}</Tag>;
      },
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('context.entityCount'),
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 80,
    },
    {
      title: '向量状态',
      dataIndex: 'vectorStatus',
      key: 'vectorStatus',
      width: 150,
      render: (_: string, record: any) => {
        const status = VECTOR_STATUS_MAP[record.vectorStatus || 'none'] || VECTOR_STATUS_MAP.none;
        return (
          <Space size={6}>
            <Tag color={status.color}>{status.label}</Tag>
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>
              {record.vectorChunkCount ?? 0} chunks
            </span>
          </Space>
        );
      },
    },
    {
      title: t('common.updateTime'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (val: string) => formatDateTime(val),
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      onCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      render: (_: any, record: any) => (
        <Space size={8} wrap={false}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            style={{ paddingInline: 0 }}
            onClick={() => navigate(`/context/${record.id}`)}
          >
            {t('common.detail')}
          </Button>
          {canUpdate && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              style={{ paddingInline: 0 }}
              onClick={() => navigate(`/context/${record.id}/edit`)}
            >
              {t('common.edit')}
            </Button>
          )}
          {canDelete && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              style={{ paddingInline: 0 }}
              onClick={() => {
                Modal.confirm({
                  title: t('context.deleteTitle'),
                  content: t('context.deleteContent', { name: record.name }),
                  okText: t('common.delete'),
                  okType: 'danger',
                  cancelText: t('common.cancel'),
                  onOk: () => {
                    deleteContextMutation.mutate(record.id, {
                      onSuccess: () => message.success(t('common.deleteSuccess')),
                    });
                  },
                });
              }}
            >
              {t('common.delete')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const data = contextData?.records ?? [];

  return (
    <PageContainer
      title={t('context.center')}
      extra={
        <Space>
          <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)}>
            <Radio.Button value="list"><UnorderedListOutlined /></Radio.Button>
            <Radio.Button value="card"><AppstoreOutlined /></Radio.Button>
          </Radio.Group>
          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/context/create')}>
              {t('context.createContext')}
            </Button>
          )}
        </Space>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* 知识图谱 */}
        <Card
          title={
            <Space>
              <ApartmentOutlined style={{ color: 'var(--color-purple)' }} />
              <span>{t('context.knowledgeGraph')}</span>
            </Space>
          }
          variant="borderless"
          className="shadow-sm"
          style={{ borderRadius: 12 }}
        >
          <KnowledgeGraph data={allContextRecords} relations={allRelations} loading={allLoading} height={400} />
        </Card>

        {/* 列表/卡片视图 */}
        {viewMode === 'list' ? (
        <Card variant="borderless" className="shadow-sm" style={{ borderRadius: 12 }}>
          {/* 搜索筛选区 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
            <Select
              allowClear
              placeholder={t('context.allLevel')}
              style={{ width: 160 }}
              value={filterLevel}
              onChange={(val) => setFilterLevel(val)}
            >
              <Select.Option value="global">{t('context.levelGlobal')}</Select.Option>
              <Select.Option value="project">{t('context.levelProject')}</Select.Option>
              <Select.Option value="task">{t('context.levelTask')}</Select.Option>
              <Select.Option value="agent">{t('context.levelAgent')}</Select.Option>
            </Select>
            <Input
              placeholder={t('context.searchPlaceholder')}
              prefix={<SearchOutlined style={{ color: 'var(--color-text-tertiary)' }} />}
              style={{ width: 240 }}
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Button type="primary" onClick={handleSearch}>{t('common.search')}</Button>
          </div>
          {/* 表格 */}
          <Table
            className="fixed-columns-table"
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 900 }}
            pagination={{
              current: queryParams.page,
              pageSize: queryParams.size,
              total: contextData?.total,
              showSizeChanger: true,
              showTotal: (total) => t('common.total', { total }),
              onChange: (page, size) => setQueryParams(prev => ({ ...prev, page, size })),
            }}
          />
        </Card>
      ) : data.length === 0 ? (
        <Card variant="borderless" className="shadow-sm rounded-xl">
          <EmptyState
            icon={<DatabaseOutlined />}
            title={t('context.noContexts')}
            description={t('context.noContextsDesc')}
            actions={canCreate ? [{ label: t('context.createContext'), onClick: () => navigate('/context/create'), icon: <PlusOutlined /> }] : []}
          />
        </Card>
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {data.map(item => {
            const levelKey = item.contextLevel;
            const accentColor = LEVEL_HEX_MAP[levelKey] || '#86909C';
            const avatarStyle = LEVEL_AVATAR_MAP[levelKey] || { bg: '#f0f4ff', color: '#165DFF' };
            const levelLabelMap: Record<string, string> = {
              'global': t('context.levelGlobal'),
              'project': t('context.levelProject'),
              'task': t('context.levelTask'),
              'agent': t('context.levelAgent'),
            };
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={item.id} style={{ display: 'flex' }}>
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
                    <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/context/${item.id}`)} key="detail" style={{ color: 'var(--color-primary)' }}>
                      {t('common.detail')}
                    </Button>,
                    <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/context/${item.id}/edit`)} key="edit" style={{ color: 'var(--color-text-secondary)' }}>
                      {t('common.edit')}
                    </Button>,
                  ]}
                >
                  {/* 内容区 */}
                  <div style={{ padding: '16px 18px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Avatar + 标题 + Level Tag */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                      <Avatar
                        size={40}
                        icon={<DatabaseOutlined />}
                        style={{ flexShrink: 0, background: avatarStyle.bg, color: avatarStyle.color }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.4, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                          title={item.name}
                        >
                          {item.name}
                        </div>
                        <Tag color={LEVEL_COLOR_MAP[levelKey]} style={{ margin: 0, borderRadius: 10 }}>
                          {levelLabelMap[levelKey] || levelKey}
                        </Tag>
                        <Tag
                          color={(VECTOR_STATUS_MAP[item.vectorStatus || 'none'] || VECTOR_STATUS_MAP.none).color}
                          style={{ marginLeft: 8, borderRadius: 10 }}
                        >
                          {(VECTOR_STATUS_MAP[item.vectorStatus || 'none'] || VECTOR_STATUS_MAP.none).label}
                        </Tag>
                      </div>
                    </div>
                    {/* 描述 — flex:1 撑满，保证底部 stats 对齐 */}
                    <div style={{ flex: 1, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                      {item.description ? (
                        <Typography.Paragraph
                          style={{ color: 'inherit', fontSize: 'inherit', marginBottom: 0, lineHeight: 'inherit' }}
                          ellipsis={{ rows: 2 }}
                        >
                          {item.description}
                        </Typography.Paragraph>
                      ) : (
                        <span style={{ color: 'var(--color-text-tertiary)' }}>{t('common.noDescription')}</span>
                      )}
                    </div>
                    {/* 统计信息 */}
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        <DatabaseOutlined style={{ fontSize: 12, flexShrink: 0 }} />
                        <span>{t('context.entityCount')}：</span>
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{item.itemCount ?? 0}</span>
                        <span style={{ color: 'var(--color-text-tertiary)' }}> / 向量 {item.vectorChunkCount ?? 0}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        <ClockCircleOutlined style={{ fontSize: 12, flexShrink: 0 }} />
                        <span>{t('common.updateTime')}：</span>
                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>{formatDateTime(item.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            );
            })}
          </Row>
          {(contextData?.total || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <Pagination
                current={queryParams.page}
                pageSize={queryParams.size}
                total={contextData?.total}
                showSizeChanger
                showTotal={(total) => t('common.total', { total })}
                onChange={(page, size) => setQueryParams(prev => ({ ...prev, page, size }))}
              />
            </div>
          )}
        </>
      )}
      </div>
    </PageContainer>
  );
}

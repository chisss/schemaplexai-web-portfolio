/**
 * Agent 列表页面
 * 优化版：状态色彩增强、移除Skills列、增加workType/configCompleted展示
 */
import { useState } from 'react';
import {
  Table, Button, Input, Space, Card, Tag, Popconfirm, message,
  Radio, Row, Col, Typography, Avatar, Badge, Pagination,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  AppstoreOutlined, UnorderedListOutlined, RobotOutlined,
  TeamOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAgentList, useDeleteAgent } from '@/api/agent';
import PageContainer from '@/components/PageContainer/PageContainer';
import EmptyState from '@/components/EmptyState/EmptyState';
import { useAuthStore } from '@/store/useAuthStore';
import type { Agent } from '@/types/agent';
import type { ColumnsType } from 'antd/es/table';
import { formatDateTime } from '@/utils/date';

const { Text, Paragraph } = Typography;

/** 状态配置：Badge 状态与文字颜色，使用 CSS 变量适配深浅色主题 */
const STATUS_CONFIG: Record<string, { color: string; labelKey: string; badge: 'success' | 'processing' | 'default' | 'error' | 'warning' }> = {
  active:   { color: 'var(--color-success)', labelKey: 'agent.statusActive', badge: 'success' },
  running:  { color: 'var(--color-primary)', labelKey: 'agent.statusRunning', badge: 'processing' },
  inactive: { color: 'var(--color-text-tertiary)', labelKey: 'agent.statusInactive', badge: 'default' },
  error:    { color: 'var(--color-error)', labelKey: 'agent.statusError', badge: 'error' },
};

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive;
  return (
    <Badge
      status={cfg.badge}
      text={<span style={{ color: cfg.color, fontWeight: 500, fontSize: 12 }}>{t(cfg.labelKey)}</span>}
    />
  );
}

export default function AgentList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('agent:create');
  const canDelete = hasPermission('agent:delete');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');

  const { data, isLoading, refetch } = useAgentList({ keyword, page, size });
  const deleteAgent = useDeleteAgent();

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAgent.mutateAsync(id);
      message.success(t('common.deleteSuccess'));
      refetch();
    } catch {
      // 错误已在拦截器处理
    }
  };

  const columns: ColumnsType<Agent> = [
    {
      title: t('agent.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
      render: (text, record) => (
        <Space>
          <Avatar
            size={32}
            icon={record.agentType === 'team' ? <TeamOutlined /> : <RobotOutlined />}
            style={{
              background: record.agentType === 'team' ? '#e0e7ff' : '#f3e8ff',
              color: record.agentType === 'team' ? 'var(--color-primary-dark)' : 'var(--color-purple)',
            }}
          />
          <Link to={`/agent/${record.id}`} className="font-medium">{text}</Link>
        </Space>
      ),
    },
    {
      title: t('agent.type'),
      dataIndex: 'agentType',
      key: 'agentType',
      width: 90,
      render: (type: string) => (
          <Tag color={type === 'team' ? 'blue' : 'purple'} style={{ borderRadius: 12 }}>
            {type === 'team' ? t('agent.teamAgent') : t('agent.soloAgent')}
          </Tag>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => <StatusBadge status={status} t={t} />,
    },
    {
      title: t('agent.create.workType'),
      dataIndex: 'workType',
      key: 'workType',
      width: 120,
      render: (_workType: string, record) => record.workType ? <Tag>{record.templateName ?? record.workType}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: t('agent.agentTag'),
      dataIndex: 'agentTag',
      key: 'agentTag',
      width: 180,
      render: (agentTag: string, record: Agent) => (
        <Space size={4} wrap>
          {record.builtin && <Tag color="gold" style={{ borderRadius: 10, fontSize: 11 }}>{t('agent.builtinTag')}</Tag>}
          {agentTag?.split(',').filter(Boolean).map(tag => (
            <Tag key={tag} style={{ borderRadius: 10, fontSize: 11 }}>{tag}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('agent.model'),
      dataIndex: 'aiModel',
      key: 'aiModel',
      width: 200,
      render: (model: string) => model ? <Tag color="geekblue">{model}</Tag> : '-',
    },
    {
      title: t('agent.configStatus'),
      dataIndex: 'configCompleted',
      key: 'configCompleted',
      width: 100,
      render: (completed: boolean) => completed
        ? <Tag icon={<CheckCircleOutlined />} color="success">{t('agent.configCompleted')}</Tag>
        : <Tag icon={<ExclamationCircleOutlined />} color="warning">{t('agent.configPending')}</Tag>,
    },
    {
      title: t('common.updateTime'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (time: string) => formatDateTime(time),
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/agent/${record.id}`)}
          >
            {t('agent.detail')}
          </Button>
          {canDelete && (
            <Popconfirm
              title={t('agent.deleteConfirm')}
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

  return (
    <PageContainer
      title={t('agent.center')}
      extra={
        <Space>
          <Input.Search
            placeholder={t('agent.searchPlaceholder')}
            allowClear
            onSearch={handleSearch}
            style={{ width: 280 }}
            prefix={<SearchOutlined />}
          />
          <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)}>
            <Radio.Button value="card"><AppstoreOutlined /></Radio.Button>
            <Radio.Button value="list"><UnorderedListOutlined /></Radio.Button>
          </Radio.Group>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/agent/create')}
            disabled={!canCreate}
            style={{ background: canCreate ? 'var(--color-primary)' : undefined, border: 'none' }}
          >
            {t('agent.createAgent')}
          </Button>
        </Space>
      }
    >
      {viewMode === 'list' ? (
        <Card variant="borderless" className="shadow-sm">
          <Table
            className="fixed-columns-table"
            columns={columns}
            dataSource={data?.records || []}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 1200 }}
            locale={{ emptyText: <EmptyState compact icon={<RobotOutlined />} title={t('agent.noAgents')} /> }}
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
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {(data?.records || []).map(agent => {
            const statusCfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.inactive;
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={agent.id}>
                <Card
                  hoverable
                  className="h-full rounded-xl"
                  style={{
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.2s',
                    height: '100%',
                  }}
                  styles={{ body: { padding: '20px 24px', display: 'flex', flexDirection: 'column', height: '100%' } }}
                >
                  {/* 卡片内容区域 */}
                  <div style={{ flex: 1 }}>
                    {/* 头部：头像 + 名称 + 状态 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <Avatar
                        size={44}
                        icon={agent.agentType === 'team' ? <TeamOutlined /> : <RobotOutlined />}
                        style={{
                          background: agent.agentType === 'team'
                            ? 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)'
                            : 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                          color: agent.agentType === 'team' ? 'var(--color-primary-dark)' : 'var(--color-purple)',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <div
                          style={{
                            fontWeight: 600, fontSize: 16, lineHeight: 1.3, cursor: 'pointer',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                          onClick={() => navigate(`/agent/${agent.id}`)}
                        >
                          {agent.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                          <Tag
                            color={agent.agentType === 'team' ? 'blue' : 'purple'}
                            style={{ margin: 0, borderRadius: 10, fontSize: 11 }}
                          >
                            {agent.agentType === 'team' ? t('agent.teamAgent') : t('agent.soloAgent')}
                          </Tag>
                          {agent.builtin && (
                            <Tag color="gold" style={{ margin: 0, borderRadius: 10, fontSize: 11 }}>{t('agent.isBuiltin')}</Tag>
                          )}
                        </div>
                      </div>
                      {/* 状态点 */}
                      <Badge status={statusCfg.badge} style={{ flexShrink: 0 }} />
                    </div>

                    {/* 描述 */}
                    <Paragraph
                      className="text-gray-400"
                      style={{
                        fontSize: 12, margin: '0 0 12px',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}
                      ellipsis={{ rows: 2 }}
                    >
                      {agent.description || t('common.noDescription')}
                    </Paragraph>

                    {/* 元信息 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                        <Text type="secondary">{t('common.status')}</Text>
                        <span style={{ color: statusCfg.color, fontWeight: 500 }}>{t(statusCfg.labelKey)}</span>
                      </div>
                      {agent.workType && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                          <Text type="secondary">{t('agent.create.workType')}</Text>
                          <Tag style={{ margin: 0, fontSize: 11 }}>{agent.templateName ?? agent.workType}</Tag>
                        </div>
                      )}
                      {agent.agentTag && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 12 }}>
                          <Text type="secondary" style={{ flexShrink: 0 }}>{t('agent.agentTag')}</Text>
                          <Space size={2} wrap style={{ justifyContent: 'flex-end' }}>
                            {agent.agentTag.split(',').filter(Boolean).map((tag: string) => (
                              <Tag key={tag} style={{ margin: 0, fontSize: 10, borderRadius: 8 }}>{tag}</Tag>
                            ))}
                          </Space>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                        <Text type="secondary">{t('agent.configStatus')}</Text>
                        {agent.configCompleted
                          ? <span style={{ color: 'var(--color-success)', fontSize: 11 }}>✓ {t('agent.configCompleted')}</span>
                          : <span style={{ color: 'var(--color-warning)', fontSize: 11 }}>⚠ {t('agent.configPending')}</span>
                        }
                      </div>
                      {agent.aiModel && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, overflow: 'hidden' }}>
                          <Text type="secondary" style={{ flexShrink: 0 }}>{t('agent.modelLabel')}</Text>
                          <Text style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 8 }}>
                            {agent.aiModel}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 底部操作区 — ant-card-actions 保证多卡片横向对齐 */}
                  <div className="ant-card-actions" style={{ justifyContent: 'flex-end', gap: 8 }}>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => navigate(`/agent/${agent.id}`)}
                      style={{ fontSize: 12 }}
                    >
                      {t('agent.detail')}
                    </Button>
                    {canDelete && (
                      <Popconfirm
                        title={t('common.deleteConfirm')}
                        onConfirm={() => handleDelete(agent.id)}
                      >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} style={{ fontSize: 12 }}>
                          {t('common.delete')}
                        </Button>
                      </Popconfirm>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
            {(!data?.records || data.records.length === 0) && !isLoading && (
              <Col span={24}>
                <EmptyState
                  icon={<RobotOutlined />}
                  title={t('agent.noAgents')}
                  description={t('agent.noAgentsDesc')}
                  actions={canCreate ? [
                    {
                      label: t('agent.createAgent'),
                      onClick: () => navigate('/agent/create'),
                      icon: <PlusOutlined />,
                    },
                  ] : []}
                />
              </Col>
            )}
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
      )}
    </PageContainer>
  );
}

import { useState } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Badge,
  Modal,
  message,
  Card,
  Radio,
  Row,
  Col,
  Pagination,
  Typography,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { formatDateTime } from '@/utils/date';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import EmptyState from '@/components/EmptyState/EmptyState';
import { useSkills, useDeleteSkill } from '@/api/skill';
import type { Skill, SkillQueryDTO } from '@/types/integration';
import { useAuthStore } from '@/store/useAuthStore';
import type { ColumnsType } from 'antd/es/table';

const { Text, Paragraph } = Typography;

const categoryColorMap: Record<string, string> = {
  builtin: 'blue',
  custom: 'green',
  mcp: 'purple',
};

type SkillStatusBadge = 'success' | 'default' | 'warning' | 'processing' | 'error';

const statusMap: Record<string, { color: SkillStatusBadge; textKey: string }> = {
  active: { color: 'success', textKey: 'common.active' },
  inactive: { color: 'default', textKey: 'common.inactive' },
  deprecated: { color: 'warning', textKey: 'skill.deprecated' },
};

const categoryTextKeyMap: Record<string, string> = {
  builtin: 'skill.categoryBuiltin',
  custom: 'skill.categoryCustom',
  mcp: 'skill.categoryMcp',
};

export default function SkillList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('integration:skill:create');
  const canUpdate = hasPermission('integration:skill:update');
  const canDelete = hasPermission('integration:skill:delete');
  const [query, setQuery] = useState<SkillQueryDTO>({ page: 1, size: 20 });
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const { data, isLoading } = useSkills(query);
  const deleteMutation = useDeleteSkill();

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: t('common.confirmDelete'),
      content: `${t('common.confirmDeleteContent')} ${name}?`,
      onOk: () => deleteMutation.mutateAsync(id).then(() => message.success(t('common.deleteSuccess'))),
    });
  };

  const resolveDisplayName = (record: Skill) => record.displayName?.trim() || record.name;

  const resolveCategoryLabel = (category: string) => {
    const textKey = categoryTextKeyMap[category];
    return textKey ? t(textKey) : category;
  };

  const renderDescription = (description?: string, rows = 2) => {
    const content = description?.trim() || t('common.noDescription');
    return (
      <Tooltip title={content} placement="topLeft">
        <Paragraph
          style={{
            marginBottom: 0,
            fontSize: 12,
            color: 'var(--color-text-secondary)',
          }}
          ellipsis={{ rows, tooltip: false }}
        >
          {content}
        </Paragraph>
      </Tooltip>
    );
  };

  const columns: ColumnsType<Skill> = [
    {
      title: t('skill.displayName'),
      dataIndex: 'displayName',
      key: 'displayName',
      render: (_: string | undefined, record: Skill) => (
        <Space size={[8, 8]} wrap>
          <Link to={`/integration/skill/${record.id}`}>{resolveDisplayName(record)}</Link>
          {record.builtIn && <Tag color="gold">{t('agent.builtinTag')}</Tag>}
        </Space>
      ),
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      width: 320,
      render: (description?: string) => renderDescription(description),
    },
    {
      title: t('skill.category'),
      dataIndex: 'category',
      key: 'category',
      render: (val: string) => <Tag color={categoryColorMap[val] || 'default'}>{resolveCategoryLabel(val)}</Tag>,
    },
    { title: t('skill.version'), dataIndex: 'version', key: 'version' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => {
        const s = statusMap[val] || { color: 'default', textKey: val };
        return <Badge status={s.color} text={t(s.textKey)} />;
      },
    },
    { title: t('common.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (val: string) => formatDateTime(val) },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Skill) => (
        <Space>
          {!record.builtIn && canUpdate && (
            <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/integration/skill/${record.id}`)} />
          )}
          {!record.builtIn && canDelete && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id, resolveDisplayName(record))}
            />
          )}
          {record.builtIn && <span className="text-gray-400 text-xs">内置不可操作</span>}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title={t('skill.management')}
      description={t('skill.pageDescription')}
      extra={
        <Space wrap>
          <Input.Search
            placeholder={t('common.search')}
            allowClear
            prefix={<SearchOutlined />}
            onChange={(e) => setQuery((q) => ({ ...q, keyword: e.target.value, page: 1 }))}
            style={{ width: 260 }}
          />
          <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
            <Radio.Button value="card"><AppstoreOutlined /></Radio.Button>
            <Radio.Button value="list"><UnorderedListOutlined /></Radio.Button>
          </Radio.Group>
          {canCreate ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/integration/skill/create')}>
              {t('skill.create')}
            </Button>
          ) : null}
        </Space>
      }
    >
      <Space className="mb-4" wrap size={[12, 12]}>
        <Select
          placeholder={t('skill.category')}
          allowClear
          onChange={(val) => setQuery((q) => ({ ...q, category: val, page: 1 }))}
          style={{ width: 150 }}
          options={[
            { label: t('skill.categoryBuiltin'), value: 'builtin' },
            { label: t('skill.categoryCustom'), value: 'custom' },
            { label: t('skill.categoryMcp'), value: 'mcp' },
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
            { label: t('skill.deprecated'), value: 'deprecated' },
          ]}
        />
      </Space>
      {viewMode === 'list' ? (
        <Card variant="borderless" className="shadow-sm">
          <Table
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={data?.records ?? []}
            locale={{
              emptyText: (
                <EmptyState
                  compact
                  icon={<ToolOutlined />}
                  title={t('skill.emptyTitle')}
                />
              ),
            }}
            pagination={{
              current: query.page,
              pageSize: query.size,
              total: data?.total ?? 0,
              onChange: (page, size) => setQuery((q) => ({ ...q, page, size })),
            }}
          />
        </Card>
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {(data?.records ?? []).map((record) => {
              const displayName = resolveDisplayName(record);
              const status = statusMap[record.status] || { color: 'default', textKey: record.status };
              return (
                <Col xs={24} md={12} xl={8} key={record.id}>
                  <Card
                    hoverable
                    className="h-full rounded-xl"
                    style={{
                      boxShadow: '0 2px 12px rgba(15, 23, 42, 0.06)',
                      height: '100%',
                    }}
                    styles={{
                      body: {
                        padding: '20px 22px',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        gap: 16,
                      },
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            background: 'rgba(22, 93, 255, 0.08)',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <ToolOutlined />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 600,
                              color: 'var(--color-text-primary)',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            onClick={() => navigate(`/integration/skill/${record.id}`)}
                          >
                            {displayName}
                          </div>
                          <Space size={[6, 6]} wrap style={{ marginTop: 8 }}>
                            <Tag color={categoryColorMap[record.category] || 'default'} style={{ margin: 0, borderRadius: 10 }}>
                              {resolveCategoryLabel(record.category)}
                            </Tag>
                            {record.builtIn && (
                              <Tag color="gold" style={{ margin: 0, borderRadius: 10 }}>
                                {t('agent.builtinTag')}
                              </Tag>
                            )}
                            {record.version && (
                              <Tag style={{ margin: 0, borderRadius: 10 }}>
                                {record.version}
                              </Tag>
                            )}
                          </Space>
                        </div>
                      </div>
                      <Badge status={status.color} />
                    </div>

                    {renderDescription(record.description, 3)}

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        paddingTop: 14,
                        borderTop: '1px solid var(--color-border)',
                        marginTop: 'auto',
                      }}
                      >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <Text type="secondary">{t('common.status')}</Text>
                        <Badge status={status.color} text={t(status.textKey)} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <Text type="secondary">{t('common.createdAt')}</Text>
                        <Text style={{ fontSize: 12 }}>{formatDateTime(record.createdAt)}</Text>
                      </div>
                    </div>

                    <div className="ant-card-actions" style={{ justifyContent: 'flex-end', gap: 8 }}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/integration/skill/${record.id}`)}
                      >
                        {t('common.detail')}
                      </Button>
                      {!record.builtIn && canDelete && (
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(record.id, displayName)}
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

          {(!data?.records || data.records.length === 0) && !isLoading && (
            <EmptyState
              icon={<ToolOutlined />}
              title={t('skill.emptyTitle')}
              description={t('skill.emptyDescription')}
              actions={canCreate ? [
                {
                  label: t('skill.create'),
                  onClick: () => navigate('/integration/skill/create'),
                  icon: <PlusOutlined />,
                },
              ] : []}
            />
          )}

          {(data?.records?.length ?? 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <Pagination
                current={query.page}
                pageSize={query.size}
                total={data?.total ?? 0}
                showSizeChanger
                onChange={(page, size) => setQuery((q) => ({ ...q, page, size }))}
              />
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Card,
  Radio,
  Row,
  Col,
  Typography,
  Tooltip,
  Badge,
  Pagination,
  Popconfirm,
  Tabs,
  message,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ApiOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useApiGateways, useDeleteApiGateway } from '../../../api/apiGateway';
import { useDictItemsByCode } from '@/api/system';
import type { ApiGateway, ApiGatewayQueryDTO } from '../../../types/integration';
import type { ColumnsType } from 'antd/es/table';
import PageContainer from '@/components/PageContainer/PageContainer';
import EmptyState from '@/components/EmptyState/EmptyState';
import { formatDateTime } from '@/utils/date';
import RouteAnalysisPanel from './RouteAnalysisPanel';

const { Text, Paragraph } = Typography;

const API_GATEWAY_CATEGORY_DICT_CODE = 'api_gateway_category';

type GatewayBadgeStatus = 'success' | 'default' | 'warning' | 'processing' | 'error';

const methodColors: Record<string, string> = {
  GET: 'green',
  POST: 'blue',
  PUT: 'orange',
  DELETE: 'red',
  PATCH: 'purple',
};

const statusMap: Record<string, { color: GatewayBadgeStatus; label: string }> = {
  active: { color: 'success', label: '启用' },
  inactive: { color: 'default', label: '停用' },
  deprecated: { color: 'warning', label: '废弃' },
};

export default function ApiGatewayList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState<ApiGatewayQueryDTO>({ page: 1, size: 20 });
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [activeTab, setActiveTab] = useState<'gateways' | 'analysis'>('gateways');
  const { data, isLoading } = useApiGateways(query);
  const { data: categoryItems = [] } = useDictItemsByCode(API_GATEWAY_CATEGORY_DICT_CODE);
  const deleteMutation = useDeleteApiGateway();

  const categoryOptions = categoryItems.map((item) => ({
    label: item.itemLabel,
    value: item.itemValue,
  }));

  const resolveCategoryLabel = (category?: string) =>
    categoryItems.find((item) => item.itemValue === category)?.itemLabel || category || '-';

  const resolveDirectionLabel = (direction: string) =>
    direction === 'outbound' ? '出网关' : '入网关';

  const resolveStatus = (status?: string) =>
    statusMap[status || 'inactive'] || { color: 'default' as GatewayBadgeStatus, label: status || '-' };

  const renderDescription = (description?: string, rows = 2) => {
    const content = description?.trim() || t('common.noDescription');
    return (
      <Tooltip title={content} placement="topLeft">
        <Paragraph
          style={{ marginBottom: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}
          ellipsis={{ rows, tooltip: false }}
        >
          {content}
        </Paragraph>
      </Tooltip>
    );
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    message.success(t('common.deleteSuccess'));
  };

  const columns: ColumnsType<ApiGateway> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text: string, record: ApiGateway) => (
        <Tooltip title={text}>
          <a
            onClick={() => navigate(`/data-management/ai-gateway/${record.id}`)}
            style={{
              display: 'inline-block',
              maxWidth: 150,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              verticalAlign: 'bottom',
            }}
          >
            {text}
          </a>
        </Tooltip>
      ),
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      width: 300,
      render: (description?: string) => renderDescription(description),
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 96,
      render: (method: string) => <Tag color={methodColors[method] || 'default'}>{method}</Tag>,
    },
    {
      title: '请求地址',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      render: (url: string) => (
        <Tooltip title={url}>
          <span>{url}</span>
        </Tooltip>
      ),
    },
    {
      title: '方向',
      dataIndex: 'direction',
      key: 'direction',
      width: 96,
      render: (direction: string) => (
        <Tag color={direction === 'outbound' ? 'blue' : 'cyan'}>
          {resolveDirectionLabel(direction)}
        </Tag>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (category?: string) => <Tag>{resolveCategoryLabel(category)}</Tag>,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status?: string) => {
        const resolvedStatus = resolveStatus(status);
        return <Badge status={resolvedStatus.color} text={resolvedStatus.label} />;
      },
    },
    {
      title: t('common.updateTime'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (updatedAt?: string) => (updatedAt ? formatDateTime(updatedAt) : '-'),
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 160,
      render: (_: unknown, record: ApiGateway) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/data-management/ai-gateway/${record.id}`)}
          >
            {t('common.detail')}
          </Button>
          <Popconfirm
            title={t('common.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title={t('menu.integrationAiGateway')}
      description={t('apiGateway.pageDescription')}
      extra={
        <Space wrap>
          <Input.Search
            placeholder={t('apiGateway.searchPlaceholder')}
            allowClear
            prefix={<SearchOutlined />}
            onChange={(e) => setQuery((prev) => ({ ...prev, keyword: e.target.value, page: 1 }))}
            style={{ width: 280 }}
          />
          <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
            <Radio.Button value="card"><AppstoreOutlined /></Radio.Button>
            <Radio.Button value="list"><UnorderedListOutlined /></Radio.Button>
          </Radio.Group>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/data-management/ai-gateway/create')}
          >
            新建 API
          </Button>
        </Space>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'gateways' | 'analysis')}
        items={[
          { key: 'gateways', label: t('apiGateway.gatewayTab') },
          { key: 'analysis', label: t('apiGateway.analysisTab') },
        ]}
      />

      {activeTab === 'analysis' ? (
        <RouteAnalysisPanel />
      ) : (
        <>
      <Space style={{ marginBottom: 16 }} wrap size={[12, 12]}>
        <Select
          placeholder={t('apiGateway.filterCategoryPlaceholder')}
          allowClear
          style={{ width: 180 }}
          value={query.category}
          onChange={(value) => setQuery((prev) => ({ ...prev, category: value, page: 1 }))}
          options={categoryOptions}
        />
        <Select
          placeholder="方向"
          allowClear
          style={{ width: 120 }}
          value={query.direction}
          onChange={(value) => setQuery((prev) => ({ ...prev, direction: value, page: 1 }))}
          options={[
            { label: '出网关', value: 'outbound' },
            { label: '入网关', value: 'inbound' },
          ]}
        />
        <Select
          placeholder={t('common.status')}
          allowClear
          style={{ width: 120 }}
          value={query.status}
          onChange={(value) => setQuery((prev) => ({ ...prev, status: value, page: 1 }))}
          options={[
            { label: '启用', value: 'active' },
            { label: '停用', value: 'inactive' },
            { label: '废弃', value: 'deprecated' },
          ]}
        />
      </Space>

      {viewMode === 'list' ? (
        <Card variant="borderless" className="shadow-sm">
          <Table
            columns={columns}
            dataSource={data?.records || []}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 1320 }}
            locale={{
              emptyText: (
                <EmptyState
                  compact
                  icon={<ApiOutlined />}
                  title={t('apiGateway.emptyTitle')}
                />
              ),
            }}
            pagination={{
              current: query.page,
              pageSize: query.size,
              total: data?.total || 0,
              showSizeChanger: true,
              showTotal: (total) => t('common.total', { total }),
              onChange: (page, size) => setQuery((prev) => ({ ...prev, page, size })),
            }}
          />
        </Card>
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {(data?.records || []).map((gateway) => {
              const resolvedStatus = resolveStatus(gateway.status);
              return (
                <Col xs={24} sm={12} lg={8} xl={6} key={gateway.id}>
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
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
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
                        <ApiOutlined />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Tooltip title={gateway.name}>
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
                            onClick={() => navigate(`/data-management/ai-gateway/${gateway.id}`)}
                          >
                            {gateway.name}
                          </div>
                        </Tooltip>
                        <Space size={[6, 6]} wrap style={{ marginTop: 8 }}>
                          <Tag color={methodColors[gateway.method] || 'default'} style={{ margin: 0, borderRadius: 10 }}>
                            {gateway.method}
                          </Tag>
                          <Tag color={gateway.direction === 'outbound' ? 'blue' : 'cyan'} style={{ margin: 0, borderRadius: 10 }}>
                            {resolveDirectionLabel(gateway.direction)}
                          </Tag>
                          {gateway.category && (
                            <Tag style={{ margin: 0, borderRadius: 10 }}>
                              {resolveCategoryLabel(gateway.category)}
                            </Tag>
                          )}
                        </Space>
                      </div>
                      <Badge status={resolvedStatus.color} />
                    </div>

                    {renderDescription(gateway.description, 3)}

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
                        <Badge status={resolvedStatus.color} text={resolvedStatus.label} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <Text type="secondary" style={{ flexShrink: 0 }}>URL</Text>
                        <Tooltip title={gateway.url}>
                          <Text
                            style={{
                              fontSize: 12,
                              maxWidth: 180,
                              textAlign: 'right',
                            }}
                            ellipsis
                          >
                            {gateway.url}
                          </Text>
                        </Tooltip>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <Text type="secondary">{t('common.updateTime')}</Text>
                        <Text style={{ fontSize: 12 }}>
                          {gateway.updatedAt ? formatDateTime(gateway.updatedAt) : '-'}
                        </Text>
                      </div>
                    </div>

                    <div className="ant-card-actions" style={{ justifyContent: 'flex-end', gap: 8 }}>
                      <Button
                        type="text"
                        size="small"
                        icon={<LinkOutlined />}
                        onClick={() => navigate(`/data-management/ai-gateway/${gateway.id}`)}
                      >
                        {t('common.detail')}
                      </Button>
                      <Popconfirm
                        title={t('common.deleteConfirm')}
                        onConfirm={() => handleDelete(gateway.id)}
                        okText={t('common.confirm')}
                        cancelText={t('common.cancel')}
                      >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />}>
                          {t('common.delete')}
                        </Button>
                      </Popconfirm>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {(!data?.records || data.records.length === 0) && !isLoading && (
            <EmptyState
              icon={<ApiOutlined />}
              title={t('apiGateway.emptyTitle')}
              description={t('apiGateway.emptyDescription')}
              actions={[
                {
                  label: '新建 API',
                  onClick: () => navigate('/data-management/ai-gateway/create'),
                  icon: <PlusOutlined />,
                },
              ]}
            />
          )}

          {(data?.records?.length ?? 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <Pagination
                current={query.page}
                pageSize={query.size}
                total={data?.total || 0}
                showSizeChanger
                onChange={(page, size) => setQuery((prev) => ({ ...prev, page, size }))}
              />
            </div>
          )}
        </>
      )}
        </>
      )}
    </PageContainer>
  );
}

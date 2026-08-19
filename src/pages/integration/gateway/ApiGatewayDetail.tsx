import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Button, Space, Tabs, Table, Spin, Badge, Alert,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useApiGatewayDetail, useApiGatewayLogs } from '../../../api/apiGateway';
import { useDictItemsByCode } from '@/api/system';
import type { ApiGatewayLogQueryDTO } from '../../../types/integration';
import ApiTestPanel from './components/ApiTestPanel';
import PolicyConfigForm from './components/PolicyConfigForm';
import PageContainer from '@/components/PageContainer/PageContainer';

const API_GATEWAY_CATEGORY_DICT_CODE = 'api_gateway_category';

export default function ApiGatewayDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: gateway, isLoading } = useApiGatewayDetail(id || '');
  const { data: categoryItems = [] } = useDictItemsByCode(API_GATEWAY_CATEGORY_DICT_CODE);
  const [logQuery, setLogQuery] = useState<ApiGatewayLogQueryDTO>({ page: 1, size: 10 });
  const { data: logsData, isLoading: logsLoading } = useApiGatewayLogs(id || '', logQuery);
  const pageTitle = gateway?.name || 'AI 网关详情';
  const pageDescription = gateway?.description || '查看网关接入配置、策略与调用日志。';
  const pageExtra = (
    <Space>
      {gateway && (
        <Button icon={<EditOutlined />} onClick={() => navigate(`/data-management/ai-gateway/${id}/edit`)}>
          编辑
        </Button>
      )}
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/data-management/ai-gateway')}>
        返回列表
      </Button>
    </Space>
  );

  if (isLoading) {
    return (
      <PageContainer title={pageTitle} description={pageDescription} extra={pageExtra}>
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!gateway) {
    return (
      <PageContainer title={pageTitle} description={pageDescription} extra={pageExtra}>
        <Alert type="error" showIcon message="未找到 AI 网关信息" />
      </PageContainer>
    );
  }

  const methodColors: Record<string, string> = {
    GET: 'green', POST: 'blue', PUT: 'orange', DELETE: 'red', PATCH: 'purple',
  };
  const categoryLabel = categoryItems.find((item) => item.itemValue === gateway.category)?.itemLabel || gateway.category;

  const logColumns = [
    {
      title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 180,
      render: (t: string) => t ? new Date(t).toLocaleString() : '-',
    },
    {
      title: '调用方', dataIndex: 'callerType', key: 'callerType', width: 80,
      render: (t: string) => <Tag>{t || '-'}</Tag>,
    },
    {
      title: '状态码', dataIndex: 'responseStatus', key: 'responseStatus', width: 80,
      render: (s: number) => (
        <Tag color={s && s < 400 ? 'green' : 'red'}>{s || '-'}</Tag>
      ),
    },
    {
      title: '耗时', dataIndex: 'durationMs', key: 'durationMs', width: 80,
      render: (ms: number) => ms ? `${ms}ms` : '-',
    },
    {
      title: '结果', dataIndex: 'success', key: 'success', width: 60,
      render: (s: boolean) => (
        <Badge status={s ? 'success' : 'error'} text={s ? '成功' : '失败'} />
      ),
    },
    {
      title: '错误信息', dataIndex: 'errorMessage', key: 'errorMessage', ellipsis: true,
    },
  ];

  return (
    <PageContainer
      title={pageTitle}
      description={pageDescription}
      extra={pageExtra}
    >
      <Card title="基础信息">
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label="请求方法">
            <Tag color={methodColors[gateway.method] || 'default'}>{gateway.method}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="网关方向">
            <Tag color={gateway.direction === 'outbound' ? 'blue' : 'cyan'}>
              {gateway.direction === 'outbound' ? '出网关' : '入网关'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={gateway.status === 'active' ? 'success' : 'default'}>
              {gateway.status === 'active' ? '启用' : '停用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="请求地址" span={3}>
            <code>{gateway.url}</code>
          </Descriptions.Item>
          <Descriptions.Item label="认证方式">{gateway.authType || '无'}</Descriptions.Item>
          <Descriptions.Item label="Content-Type">{gateway.contentType}</Descriptions.Item>
          <Descriptions.Item label="超时">{gateway.timeoutMs}ms</Descriptions.Item>
          {gateway.description && (
            <Descriptions.Item label="描述" span={3}>{gateway.description}</Descriptions.Item>
          )}
          {gateway.category && (
            <Descriptions.Item label="分类">{categoryLabel}</Descriptions.Item>
          )}
          <Descriptions.Item label="重试次数">{gateway.retryCount || 0}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs
        defaultActiveKey="test"
        style={{ marginTop: 16 }}
        items={[
          {
            key: 'test',
            label: 'API 测试',
            children: <ApiTestPanel gatewayId={id!} />,
          },
          {
            key: 'policy',
            label: '策略配置',
            children: <PolicyConfigForm gatewayId={id!} />,
          },
          {
            key: 'logs',
            label: '调用日志',
            children: (
              <Card style={{ marginTop: 16 }}>
                <Table
                  columns={logColumns}
                  dataSource={logsData?.records || []}
                  rowKey="id"
                  loading={logsLoading}
                  pagination={{
                    current: logQuery.page,
                    pageSize: logQuery.size,
                    total: logsData?.total || 0,
                    showTotal: total => `共 ${total} 条`,
                    onChange: (page, size) => setLogQuery(q => ({ ...q, page, size })),
                  }}
                  size="small"
                />
              </Card>
            ),
          },
        ]}
      />
    </PageContainer>
  );
}

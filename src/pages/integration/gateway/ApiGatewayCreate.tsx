import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  InputNumber,
  message,
  Divider,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import {
  useCreateApiGateway,
  useApiGatewayDetail,
  useUpdateApiGateway,
} from '../../../api/apiGateway';
import { useDictItemsByCode } from '@/api/system';
import PageContainer from '@/components/PageContainer/PageContainer';
import type { ApiGatewayCreateDTO } from '../../../types/integration';

const { TextArea } = Input;
const API_GATEWAY_CATEGORY_DICT_CODE = 'api_gateway_category';

interface ApiGatewayFormValues {
  name: string;
  description?: string;
  direction: string;
  method: string;
  url: string;
  authType?: string;
  authToken?: string;
  authUsername?: string;
  authPassword?: string;
  authKeyName?: string;
  authKeyValue?: string;
  authKeyPosition?: string;
  headersRaw?: string;
  queryParamsRaw?: string;
  requestBodySchemaRaw?: string;
  responseBodySchemaRaw?: string;
  contentType?: string;
  timeoutMs?: number;
  retryCount?: number;
  category?: string;
}

export default function ApiGatewayCreate() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm<ApiGatewayFormValues>();
  const authType = Form.useWatch('authType', form) || 'none';

  const createMutation = useCreateApiGateway();
  const updateMutation = useUpdateApiGateway();
  const { data: categoryItems = [], isLoading: categoryLoading } = useDictItemsByCode(API_GATEWAY_CATEGORY_DICT_CODE);

  const { data: gatewayDetail, isLoading: detailLoading } = useApiGatewayDetail(id || '');

  const categoryOptions = categoryItems.map((item) => ({
    label: item.itemLabel,
    value: item.itemValue,
  }));

  const stringifyJson = (value?: Record<string, unknown>): string | undefined =>
    value ? JSON.stringify(value, null, 2) : undefined;

  useEffect(() => {
    if (!isEdit || !gatewayDetail) {
      return;
    }

    const authConfig = gatewayDetail.authConfig ?? {};
    const authConfigRecord = authConfig as Record<string, unknown>;

    form.setFieldsValue({
      name: gatewayDetail.name,
      description: gatewayDetail.description,
      direction: gatewayDetail.direction,
      method: gatewayDetail.method,
      url: gatewayDetail.url,
      authType: gatewayDetail.authType || 'none',
      authToken: typeof authConfigRecord.token === 'string' ? authConfigRecord.token : undefined,
      authUsername: typeof authConfigRecord.username === 'string' ? authConfigRecord.username : undefined,
      authPassword: typeof authConfigRecord.password === 'string' ? authConfigRecord.password : undefined,
      authKeyName: typeof authConfigRecord.key === 'string' ? authConfigRecord.key : undefined,
      authKeyValue: typeof authConfigRecord.value === 'string' ? authConfigRecord.value : undefined,
      authKeyPosition: typeof authConfigRecord.position === 'string' ? authConfigRecord.position : 'header',
      headersRaw: stringifyJson(gatewayDetail.headers),
      queryParamsRaw: stringifyJson(gatewayDetail.queryParams),
      requestBodySchemaRaw: stringifyJson(gatewayDetail.requestBodySchema),
      responseBodySchemaRaw: stringifyJson(gatewayDetail.responseBodySchema),
      contentType: gatewayDetail.contentType,
      timeoutMs: gatewayDetail.timeoutMs,
      retryCount: gatewayDetail.retryCount,
      category: gatewayDetail.category,
    });
  }, [form, gatewayDetail, isEdit]);

  const handleSubmit = async (values: ApiGatewayFormValues) => {
    const data: ApiGatewayCreateDTO = {
      name: values.name,
      description: values.description,
      direction: values.direction,
      method: values.method,
      url: values.url,
      authType: values.authType || 'none',
      authConfig: buildAuthConfig(values),
      headers: values.headersRaw ? parseJson(values.headersRaw) : undefined,
      queryParams: values.queryParamsRaw ? parseJson(values.queryParamsRaw) : undefined,
      requestBodySchema: values.requestBodySchemaRaw ? parseJson(values.requestBodySchemaRaw) : undefined,
      responseBodySchema: values.responseBodySchemaRaw ? parseJson(values.responseBodySchemaRaw) : undefined,
      contentType: values.contentType,
      timeoutMs: values.timeoutMs,
      retryCount: values.retryCount,
      category: values.category,
    };

    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, data });
        message.success('更新成功');
      } else {
        await createMutation.mutateAsync(data);
        message.success('创建成功');
      }
      navigate('/data-management/ai-gateway');
    } catch {
      message.error(isEdit ? '更新失败' : '创建失败');
    }
  };

  const buildAuthConfig = (values: ApiGatewayFormValues): Record<string, unknown> | undefined => {
    switch (values.authType) {
      case 'bearer':
        return { token: values.authToken };
      case 'basic':
        return { username: values.authUsername, password: values.authPassword };
      case 'api_key':
        return {
          key: values.authKeyName,
          value: values.authKeyValue,
          position: values.authKeyPosition || 'header',
        };
      default:
        return undefined;
    }
  };

  const parseJson = (str: string): Record<string, unknown> | undefined => {
    try {
      return JSON.parse(str) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  };

  return (
    <PageContainer
      title={isEdit ? '编辑 AI 网关' : '新建 AI 网关'}
      description={isEdit ? '更新网关接入参数、认证方式与分类配置。' : '创建一个统一受管的 API 网关接入项。'}
      extra={(
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/data-management/ai-gateway')}>
          返回列表
        </Button>
      )}
      contentClassName="max-w-5xl"
    >
      <Card loading={isEdit && detailLoading}>
        <Form<ApiGatewayFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            direction: 'outbound',
            method: 'GET',
            authType: 'none',
            contentType: 'application/json',
            timeoutMs: 30000,
            retryCount: 0,
          }}
        >
          <Divider titlePlacement="start">基础信息</Divider>

          <Form.Item name="name" label="API 名称" rules={[{ required: true, message: '请输入 API 名称' }]}>
            <Input placeholder="如：获取天气数据" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="API 用途说明" />
          </Form.Item>

          <Space style={{ width: '100%' }} size="large" wrap>
            <Form.Item name="direction" label="网关方向" rules={[{ required: true }]}>
              <Select
                style={{ width: 180 }}
                options={[
                  { label: '出网关（调用外部）', value: 'outbound' },
                  { label: '入网关（暴露内部）', value: 'inbound' },
                ]}
              />
            </Form.Item>

            <Form.Item name="method" label="请求方法" rules={[{ required: true }]}>
              <Select
                style={{ width: 120 }}
                options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((method) => ({
                  label: method,
                  value: method,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="category"
              label="分类"
              rules={[{ required: true, message: '请选择分类' }]}
              help={!categoryLoading && categoryOptions.length === 0 ? '请先在系统字典中配置 api_gateway_category 分类项' : undefined}
            >
              <Select
                showSearch
                allowClear
                loading={categoryLoading}
                style={{ width: 220 }}
                placeholder="请选择字典分类"
                options={categoryOptions}
                disabled={!categoryLoading && categoryOptions.length === 0}
                optionFilterProp="label"
                notFoundContent="暂无可用分类，请先维护系统字典"
              />
            </Form.Item>
          </Space>

          <Form.Item name="url" label="请求地址" rules={[{ required: true, message: '请输入请求地址' }]}>
            <Input placeholder="https://api.example.com/v1/resource" />
          </Form.Item>

          <Divider titlePlacement="start">认证配置</Divider>

          <Form.Item name="authType" label="认证方式">
            <Select
              style={{ width: 200 }}
              options={[
                { label: '无认证', value: 'none' },
                { label: 'Bearer Token', value: 'bearer' },
                { label: 'Basic Auth', value: 'basic' },
                { label: 'API Key', value: 'api_key' },
              ]}
            />
          </Form.Item>

          {authType === 'bearer' && (
            <Form.Item name="authToken" label="Token">
              <Input.Password placeholder="Bearer Token" />
            </Form.Item>
          )}

          {authType === 'basic' && (
            <Space wrap>
              <Form.Item name="authUsername" label="用户名">
                <Input placeholder="Username" />
              </Form.Item>
              <Form.Item name="authPassword" label="密码">
                <Input.Password placeholder="Password" />
              </Form.Item>
            </Space>
          )}

          {authType === 'api_key' && (
            <Space wrap>
              <Form.Item name="authKeyName" label="Key 名称">
                <Input placeholder="X-API-Key" />
              </Form.Item>
              <Form.Item name="authKeyValue" label="Key 值">
                <Input.Password placeholder="your-api-key" />
              </Form.Item>
              <Form.Item name="authKeyPosition" label="位置">
                <Select
                  style={{ width: 120 }}
                  defaultValue="header"
                  options={[
                    { label: 'Header', value: 'header' },
                    { label: 'Query', value: 'query' },
                  ]}
                />
              </Form.Item>
            </Space>
          )}

          <Divider titlePlacement="start">参数配置</Divider>

          <Form.Item name="headersRaw" label="请求头 (JSON)">
            <TextArea rows={3} placeholder='{"Content-Type":"application/json"}' />
          </Form.Item>

          <Form.Item name="queryParamsRaw" label="查询参数 (JSON)">
            <TextArea rows={2} placeholder='{"page":1,"limit":10}' />
          </Form.Item>

          <Form.Item name="requestBodySchemaRaw" label="请求体 Schema (JSON)">
            <TextArea rows={4} placeholder='{"example":{"title":"test","body":"content"}}' />
          </Form.Item>

          <Form.Item name="responseBodySchemaRaw" label="响应体 Schema (JSON)">
            <TextArea rows={4} placeholder='{"type":"object","properties":{}}' />
          </Form.Item>

          <Divider titlePlacement="start">高级配置</Divider>

          <Space size="large" wrap>
            <Form.Item name="contentType" label="Content-Type">
              <Select
                style={{ width: 220 }}
                options={[
                  { label: 'application/json', value: 'application/json' },
                  { label: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded' },
                  { label: 'multipart/form-data', value: 'multipart/form-data' },
                  { label: 'text/plain', value: 'text/plain' },
                ]}
              />
            </Form.Item>

            <Form.Item name="timeoutMs" label="超时 (ms)">
              <InputNumber min={1000} max={120000} style={{ width: 140 }} />
            </Form.Item>

            <Form.Item name="retryCount" label="重试次数">
              <InputNumber min={0} max={5} style={{ width: 100 }} />
            </Form.Item>
          </Space>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {isEdit ? '保存修改' : '创建 API'}
              </Button>
              <Button onClick={() => navigate('/data-management/ai-gateway')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
}

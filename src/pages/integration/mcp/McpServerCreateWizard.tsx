/**
 * MCP Server 创建向导
 * 分步引导用户创建 MCP Server 连接
 */
import { useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Steps,
  Space,
  Table,
  Divider,
  message,
  Alert,
  Radio,
  Tag,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  GlobalOutlined,
  LockOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useCreateMcpServer } from '@/api/mcp';
import { useMcpDraftStore } from '@/store/mcpDraftStore';
import type { HeaderConfig, McpServerAuthConfig } from '@/store/mcpDraftStore';

const { TextArea } = Input;
type AuthType = 'none' | 'bearer' | 'api_key' | 'basic';
interface HeaderTableRow {
  rowKey: number;
  headerKey: string;
  value: string;
}

const authTypeOptions = [
  {
    value: 'none' as AuthType,
    label: '无认证',
    icon: <GlobalOutlined />,
    description: '公开的 MCP Server',
  },
  {
    value: 'bearer' as AuthType,
    label: 'Bearer Token',
    icon: <LockOutlined />,
    description: '使用 Authorization: Bearer <token>',
  },
  {
    value: 'api_key' as AuthType,
    label: 'API Key',
    icon: <ApiOutlined />,
    description: '自定义 Header 的 API Key',
  },
  {
    value: 'basic' as AuthType,
    label: 'Basic Auth',
    icon: <LockOutlined />,
    description: '用户名密码认证',
  },
];

export default function McpServerCreateWizard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { draft, currentStep, resetDraft, updateField, updateAuthConfig, setCurrentStep } =
    useMcpDraftStore();
  const createMutation = useCreateMcpServer();

  useEffect(() => {
    return () => {
      resetDraft();
    };
  }, [resetDraft]);

  const handleAuthTypeChange = (authType: AuthType) => {
    updateField('authType', authType);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const authConfig: McpServerAuthConfig = {};

      switch (draft.authType) {
        case 'bearer':
          authConfig.token = draft.authConfig.token;
          break;
        case 'api_key':
          authConfig.apiKey = draft.authConfig.apiKey;
          authConfig.apiKeyHeader = draft.authConfig.apiKeyHeader || 'X-API-Key';
          break;
        case 'basic':
          authConfig.username = draft.authConfig.username;
          authConfig.password = draft.authConfig.password;
          break;
      }

      const payload = {
        ...values,
        authType: draft.authType,
        authConfig,
        headers: draft.headers.filter((h) => h.key.trim() && h.value.trim()),
      };

      createMutation.mutate(payload, {
        onSuccess: () => {
          message.success(t('common.createSuccess'));
          navigate('/integration/mcp');
        },
        onError: () => {
          message.error(t('common.createFail'));
        },
      });
    } catch {
      // 表单校验失败
    }
  };

  const headerColumns: TableColumnsType<HeaderTableRow> = [
    {
      title: 'Header 名称',
      dataIndex: 'headerKey',
      width: 200,
      render: (value, _record, index) => (
        <Input
          value={value}
          placeholder="例如: X-Custom-Header"
          onChange={(e) => {
            const headers: HeaderConfig[] = [...draft.headers];
            headers[index] = { ...headers[index], key: e.target.value };
            updateField('headers', headers);
          }}
        />
      ),
    },
    {
      title: 'Header 值',
      dataIndex: 'value',
      render: (value, _record, index) => (
        <Input
          value={value}
          placeholder="Header 值"
          onChange={(e) => {
            const headers: HeaderConfig[] = [...draft.headers];
            headers[index] = { ...headers[index], value: e.target.value };
            updateField('headers', headers);
          }}
        />
      ),
    },
    {
      title: '操作',
      width: 60,
      render: (_value, _record, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            const headers = draft.headers.filter((_, headerIndex) => headerIndex !== index);
            updateField('headers', headers);
          }}
        />
      ),
    },
  ];

  const renderAuthConfig = () => {
    switch (draft.authType) {
      case 'bearer':
        return (
          <Form.Item label="Token" required>
            <Input.Password
              placeholder="Bearer Token"
              value={draft.authConfig.token}
              onChange={(e) => updateAuthConfig({ token: e.target.value })}
            />
          </Form.Item>
        );
      case 'api_key':
        return (
          <>
            <Form.Item label="API Key" required>
              <Input.Password
                placeholder="API Key"
                value={draft.authConfig.apiKey}
                onChange={(e) => updateAuthConfig({ apiKey: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Header 名称">
              <Input
                placeholder="X-API-Key"
                value={draft.authConfig.apiKeyHeader}
                onChange={(e) => updateAuthConfig({ apiKeyHeader: e.target.value })}
              />
            </Form.Item>
          </>
        );
      case 'basic':
        return (
          <>
            <Form.Item label="用户名" required>
              <Input
                placeholder="用户名"
                value={draft.authConfig.username}
                onChange={(e) => updateAuthConfig({ username: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="密码" required>
              <Input.Password
                placeholder="密码"
                value={draft.authConfig.password}
                onChange={(e) => updateAuthConfig({ password: e.target.value })}
              />
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  const renderStep1 = () => (
    <Card variant="borderless" className="shadow-sm rounded-xl">
      <Form form={form} layout="vertical" initialValues={draft}>
        <div className="mb-6">
          <h3 className="text-base font-medium mb-2">基本信息</h3>
          <p className="text-gray-500 text-sm">填写 MCP Server 的基本连接信息</p>
        </div>

        <Form.Item
          name="name"
          label="服务器名称"
          rules={[{ required: true, message: '请输入服务器名称' }]}
        >
          <Input
            placeholder="例如: My MCP Server"
            onChange={(e) => updateField('name', e.target.value)}
          />
        </Form.Item>

        <Form.Item
          name="url"
          label="SSE 端点 URL"
          rules={[
            { required: true, message: '请输入 SSE 端点 URL' },
            { type: 'url', message: '请输入有效的 URL' },
          ]}
        >
          <Input
            placeholder="https://mcp.example.com/sse"
            onChange={(e) => updateField('url', e.target.value)}
          />
        </Form.Item>

        <Form.Item name="description" label="描述">
          <TextArea
            rows={3}
            placeholder="服务器用途说明"
            onChange={(e) => updateField('description', e.target.value)}
          />
        </Form.Item>
      </Form>

      <Divider />
      <div className="flex justify-end">
        <Space>
          <Button onClick={() => navigate('/integration/mcp')}>{t('common.cancel')}</Button>
          <Button type="primary" onClick={() => setCurrentStep(1)}>
            下一步
          </Button>
        </Space>
      </div>
    </Card>
  );

  const renderStep2 = () => (
    <Card variant="borderless" className="shadow-sm rounded-xl">
      <div className="mb-6">
        <h3 className="text-base font-medium mb-2">认证配置</h3>
        <p className="text-gray-500 text-sm">选择并配置认证方式</p>
      </div>

      <Radio.Group
        value={draft.authType}
        onChange={(e) => handleAuthTypeChange(e.target.value as AuthType)}
        className="flex flex-col gap-3 mb-6"
      >
        {authTypeOptions.map((opt) => (
          <Card
            key={opt.value}
            hoverable
            className={`cursor-pointer ${draft.authType === opt.value ? 'border-blue-500 bg-blue-50' : ''}`}
            onClick={() => handleAuthTypeChange(opt.value)}
          >
            <div className="flex items-start gap-3">
              <Radio value={opt.value} />
              <div>
                <div className="flex items-center gap-2">
                  {opt.icon}
                  <span className="font-medium">{opt.label}</span>
                </div>
                <div className="text-gray-500 text-sm mt-1">{opt.description}</div>
              </div>
            </div>
          </Card>
        ))}
      </Radio.Group>

      {draft.authType !== 'none' && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-3">认证参数</h4>
          {renderAuthConfig()}
        </div>
      )}

      <Divider />
      <div className="flex justify-between">
        <Button onClick={() => setCurrentStep(0)}>上一步</Button>
        <Button type="primary" onClick={() => setCurrentStep(2)}>
          下一步
        </Button>
      </div>
    </Card>
  );

  const renderStep3 = () => (
    <Card variant="borderless" className="shadow-sm rounded-xl">
      <div className="mb-6">
        <h3 className="text-base font-medium mb-2">自定义请求头</h3>
        <p className="text-gray-500 text-sm">添加额外的 HTTP 请求头（可选）</p>
      </div>

      <Alert
        message="请求头说明"
        description="这些请求头会在每次 MCP 请求时附加到请求中，常用于传递额外的上下文信息"
        type="info"
        showIcon
        className="mb-4"
      />

      <Table
        rowKey="rowKey"
        dataSource={draft.headers.map((header, index) => ({
          rowKey: index,
          headerKey: header.key,
          value: header.value,
        }))}
        columns={headerColumns}
        pagination={false}
        size="small"
        bordered
        className="mb-4"
      />

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => useMcpDraftStore.getState().addHeader()}
        className="w-full mb-6"
      >
        添加请求头
      </Button>

      <Divider />
      <div className="flex justify-between">
        <Button onClick={() => setCurrentStep(1)}>上一步</Button>
        <Button type="primary" onClick={() => setCurrentStep(3)}>
          下一步
        </Button>
      </div>
    </Card>
  );

  const renderStep4 = () => (
    <Card variant="borderless" className="shadow-sm rounded-xl">
      <div className="mb-6">
        <h3 className="text-base font-medium mb-2">预览确认</h3>
        <p className="text-gray-500 text-sm">确认 MCP Server 配置信息</p>
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">连接信息</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-500">服务器名称:</div>
            <div>{draft.name}</div>
            <div className="text-gray-500">SSE 端点:</div>
            <div className="font-mono text-blue-600">{draft.url}</div>
            <div className="text-gray-500">描述:</div>
            <div>{draft.description || '-'}</div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">认证配置</h4>
          <div className="flex items-center gap-2">
            <Tag color={draft.authType === 'none' ? 'green' : 'blue'}>
              {authTypeOptions.find((a) => a.value === draft.authType)?.label}
            </Tag>
            {draft.authType !== 'none' && (
              <span className="text-gray-500 text-sm">
                {draft.authType === 'bearer' && 'Token 已配置'}
                {draft.authType === 'api_key' && `Header: ${draft.authConfig.apiKeyHeader || 'X-API-Key'}`}
                {draft.authType === 'basic' && '用户名密码已配置'}
              </span>
            )}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">自定义请求头</h4>
          {draft.headers.length === 0 ? (
            <p className="text-gray-400 text-sm">无自定义请求头</p>
          ) : (
            <div className="space-y-2">
              {draft.headers.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <code className="text-blue-600">{h.key}</code>
                  <span className="text-gray-400">=</span>
                  <span className="font-mono">{h.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Divider />
      <div className="flex justify-between">
        <Button onClick={() => setCurrentStep(2)}>上一步</Button>
        <Button type="primary" loading={createMutation.isPending} onClick={handleSubmit}>
          创建 MCP Server
        </Button>
      </div>
    </Card>
  );

  const stepTitles = ['基本信息', '认证配置', '自定义请求头', '预览确认'];

  return (
    <PageContainer
      title="创建 MCP Server"
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/integration/mcp')}>
          {t('common.back')}
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <Steps
          current={currentStep}
          className="mb-8 mt-4"
          items={stepTitles.map((title) => ({ title }))}
        />

        {currentStep === 0 && renderStep1()}
        {currentStep === 1 && renderStep2()}
        {currentStep === 2 && renderStep3()}
        {currentStep === 3 && renderStep4()}
      </div>
    </PageContainer>
  );
}

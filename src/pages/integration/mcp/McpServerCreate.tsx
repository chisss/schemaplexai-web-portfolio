import { Alert, Button, Card, Divider, Form, Input, Select, Space, Switch, Typography, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useCreateMcpServer } from '@/api/mcp';
import { DATABASE_PRESET_OPTIONS, findDatabasePreset } from './mcpPresetConfig';
import type { DatabasePresetCode, McpServerCreateDTO, McpServerType, McpTransportType } from '@/types/integration';

const { Text, Title } = Typography;
const { TextArea } = Input;

type KeyValueRow = {
  key?: string;
  value?: string;
};

type McpFormValues = {
  name: string;
  description?: string;
  serverType: McpServerType;
  presetCode?: DatabasePresetCode;
  transportType: McpTransportType;
  url?: string;
  authType?: 'none' | 'bearer' | 'api_key' | 'basic' | 'oauth';
  bearerToken?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  basicUsername?: string;
  basicPassword?: string;
  oauthToken?: string;
  headers?: KeyValueRow[];
  command?: string;
  commandArgs?: string;
  environmentRows?: KeyValueRow[];
  connectionUri?: string;
  host?: string;
  port?: string;
  database?: string;
  username?: string;
  password?: string;
  sslMode?: string;
  readOnly?: boolean;
  sqlBinaryPath?: string;
  oracleConnectionHint?: string;
};

function toKeyValueMap(rows?: KeyValueRow[]) {
  return (rows ?? []).reduce<Record<string, string>>((accumulator, item) => {
    const key = item?.key?.trim();
    const value = item?.value?.trim();
    if (key && value !== undefined) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
}

export default function McpServerCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<McpFormValues>();
  const createMutation = useCreateMcpServer();

  const initialServerType = (searchParams.get('serverType') as McpServerType | null) ?? 'generic';
  const initialPreset = searchParams.get('preset') as DatabasePresetCode | null;

  const serverType = Form.useWatch('serverType', form);
  const presetCode = Form.useWatch('presetCode', form);
  const transportType = Form.useWatch('transportType', form);
  const authType = Form.useWatch('authType', form);

  useEffect(() => {
    if (serverType === 'database' && presetCode) {
      const preset = findDatabasePreset(presetCode);
      if (preset) {
        form.setFieldValue('transportType', preset.transportType);
      }
    }
  }, [form, presetCode, serverType]);

  const handleSubmit = async () => {
    const values = await form.validateFields();

    let authConfig: Record<string, string> | undefined;
    if (values.authType === 'bearer') {
      authConfig = values.bearerToken ? { token: values.bearerToken } : undefined;
    } else if (values.authType === 'oauth') {
      authConfig = values.oauthToken ? { access_token: values.oauthToken } : undefined;
    } else if (values.authType === 'api_key') {
      authConfig = values.apiKey
        ? {
            apiKey: values.apiKey,
            apiKeyHeader: values.apiKeyHeader || 'X-API-Key',
          }
        : undefined;
    } else if (values.authType === 'basic') {
      authConfig = values.basicUsername
        ? {
            username: values.basicUsername,
            password: values.basicPassword || '',
          }
        : undefined;
    }

    const headers = toKeyValueMap(values.headers);
    const environment = toKeyValueMap(values.environmentRows);

    let connectionConfig: Record<string, string | boolean> | undefined;
    if (values.serverType === 'database') {
      if (values.presetCode === 'postgresql') {
        connectionConfig = {
          connectionUri: values.connectionUri?.trim() || '',
          host: values.host?.trim() || '',
          port: values.port?.trim() || '5432',
          database: values.database?.trim() || '',
          username: values.username?.trim() || '',
          password: values.password?.trim() || '',
          sslMode: values.sslMode?.trim() || '',
          readOnly: values.readOnly ?? true,
        };
      } else if (values.presetCode === 'mysql') {
        connectionConfig = {
          host: values.host?.trim() || '',
          port: values.port?.trim() || '3306',
          database: values.database?.trim() || '',
          username: values.username?.trim() || '',
          password: values.password?.trim() || '',
          readOnly: values.readOnly ?? true,
        };
      } else if (values.presetCode === 'oracle') {
        connectionConfig = {
          sqlBinaryPath: values.sqlBinaryPath?.trim() || 'sql',
          savedConnection: values.oracleConnectionHint?.trim() || '',
        };
      }
    }

    let transportConfig: Record<string, unknown> | undefined;
    if (values.transportType === 'stdio' && values.serverType === 'generic') {
      const commandParts = [
        values.command?.trim(),
        ...(values.commandArgs
          ?.split(' ')
          .map((item) => item.trim())
          .filter(Boolean) ?? []),
      ].filter(Boolean) as string[];
      transportConfig = {
        command: commandParts,
        environment,
      };
    } else if (Object.keys(environment).length > 0) {
      transportConfig = {
        environment,
      };
    }

    const payload: McpServerCreateDTO = {
      name: values.name.trim(),
      description: values.description?.trim(),
      url: values.url?.trim() || undefined,
      transportType: values.transportType,
      authType: values.authType ?? 'none',
      authConfig,
      headers,
      serverType: values.serverType,
      presetCode: values.presetCode,
      connectionConfig,
      transportConfig,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        message.success('MCP Server 创建成功');
        navigate('/integration/mcp');
      },
      onError: () => {
        message.error('MCP Server 创建失败');
      },
    });
  };

  const renderAuthFields = () => {
    if (authType === 'bearer') {
      return (
        <Form.Item name="bearerToken" label="Bearer Token" rules={[{ required: true, message: '请输入 Bearer Token' }]}>
          <Input.Password placeholder="粘贴访问 Token" />
        </Form.Item>
      );
    }
    if (authType === 'oauth') {
      return (
        <Form.Item name="oauthToken" label="OAuth Access Token" rules={[{ required: true, message: '请输入 Access Token' }]}>
          <Input.Password placeholder="access_token" />
        </Form.Item>
      );
    }
    if (authType === 'api_key') {
      return (
        <Space size={12} style={{ width: '100%' }} align="start">
          <Form.Item name="apiKey" label="API Key" rules={[{ required: true, message: '请输入 API Key' }]} style={{ flex: 1 }}>
            <Input.Password placeholder="API Key" />
          </Form.Item>
          <Form.Item name="apiKeyHeader" label="Header 名称" initialValue="X-API-Key" style={{ flex: 1 }}>
            <Input placeholder="X-API-Key" />
          </Form.Item>
        </Space>
      );
    }
    if (authType === 'basic') {
      return (
        <Space size={12} style={{ width: '100%' }} align="start">
          <Form.Item name="basicUsername" label="用户名" rules={[{ required: true, message: '请输入用户名' }]} style={{ flex: 1 }}>
            <Input placeholder="用户名" />
          </Form.Item>
          <Form.Item name="basicPassword" label="密码" rules={[{ required: true, message: '请输入密码' }]} style={{ flex: 1 }}>
            <Input.Password placeholder="密码" />
          </Form.Item>
        </Space>
      );
    }
    return null;
  };

  const renderDatabaseConfig = () => {
    if (serverType !== 'database' || !presetCode) {
      return null;
    }
    const preset = findDatabasePreset(presetCode);
    return (
      <Card
        title="数据库连接参数"
        style={{ marginTop: 20 }}
        extra={preset ? <Text type="secondary">{preset.commandPreview}</Text> : null}
      >
        {preset && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={preset.label}
            description={preset.description}
          />
        )}

        {presetCode === 'postgresql' && (
          <>
            <Form.Item name="connectionUri" label="连接 URI">
              <Input placeholder="postgresql://user:password@host:5432/database" />
            </Form.Item>
            <Text type="secondary">可直接填写完整 URI；如果不填，则使用下方 host/port/database/username 组合生成。</Text>
            <Space size={12} style={{ width: '100%', marginTop: 16 }} align="start">
              <Form.Item name="host" label="Host" style={{ flex: 1 }}>
                <Input placeholder="localhost" />
              </Form.Item>
              <Form.Item name="port" label="Port" initialValue="5432" style={{ width: 140 }}>
                <Input placeholder="5432" />
              </Form.Item>
            </Space>
            <Space size={12} style={{ width: '100%' }} align="start">
              <Form.Item name="database" label="Database" style={{ flex: 1 }}>
                <Input placeholder="schemaplexai" />
              </Form.Item>
              <Form.Item name="username" label="用户名" style={{ flex: 1 }}>
                <Input placeholder="postgres" />
              </Form.Item>
            </Space>
            <Space size={12} style={{ width: '100%' }} align="start">
              <Form.Item name="password" label="密码" style={{ flex: 1 }}>
                <Input.Password placeholder="可为空" />
              </Form.Item>
              <Form.Item name="sslMode" label="SSL Mode" style={{ flex: 1 }}>
                <Input placeholder="disable / require / verify-full" />
              </Form.Item>
            </Space>
            <Form.Item name="readOnly" label="只读模式" valuePropName="checked" initialValue>
              <Switch checkedChildren="只读" unCheckedChildren="可写" />
            </Form.Item>
          </>
        )}

        {presetCode === 'mysql' && (
          <>
            <Space size={12} style={{ width: '100%' }} align="start">
              <Form.Item name="host" label="Host" rules={[{ required: true, message: '请输入 MySQL Host' }]} style={{ flex: 1 }}>
                <Input placeholder="127.0.0.1" />
              </Form.Item>
              <Form.Item name="port" label="Port" initialValue="3306" style={{ width: 140 }}>
                <Input placeholder="3306" />
              </Form.Item>
            </Space>
            <Space size={12} style={{ width: '100%' }} align="start">
              <Form.Item name="database" label="Database" rules={[{ required: true, message: '请输入数据库名' }]} style={{ flex: 1 }}>
                <Input placeholder="schemaplexai" />
              </Form.Item>
              <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]} style={{ flex: 1 }}>
                <Input placeholder="root" />
              </Form.Item>
            </Space>
            <Form.Item name="password" label="密码">
              <Input.Password placeholder="数据库密码" />
            </Form.Item>
            <Form.Item name="readOnly" label="只读模式" valuePropName="checked" initialValue>
              <Switch checkedChildren="只读" unCheckedChildren="可写" />
            </Form.Item>
          </>
        )}

        {presetCode === 'oracle' && (
          <>
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="Oracle SQLcl 依赖"
              description="Oracle 预设默认通过 `sql -mcp` 启动 SQLcl MCP。请先在目标机器安装 SQLcl，并准备好可用的保存连接。"
            />
            <Form.Item name="sqlBinaryPath" label="SQLcl 可执行路径" initialValue="sql">
              <Input placeholder="sql 或 /opt/oracle/sqlcl/bin/sql" />
            </Form.Item>
            <Form.Item name="oracleConnectionHint" label="连接提示（可选）">
              <Input placeholder="例如：DEV_ORACLE_RW。用于备注要在 SQLcl 中使用的保存连接别名。" />
            </Form.Item>
          </>
        )}
      </Card>
    );
  };

  return (
    <PageContainer title="创建 MCP Server">
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <Card styles={{ body: { paddingBottom: 12 } }}>
          <Space direction="vertical" size={4}>
            <Title level={3} style={{ margin: 0 }}>
              MCP 连接配置
            </Title>
            <Text type="secondary">
              支持通用 MCP Server，也支持 PostgreSQL、MySQL、Oracle SQLcl 三种数据库预设。数据库预设会由后端自动生成默认 stdio 启动命令。
            </Text>
          </Space>
        </Card>

        <Form<McpFormValues>
          form={form}
          layout="vertical"
          initialValues={{
            serverType: initialServerType,
            presetCode: initialPreset ?? undefined,
            transportType: initialServerType === 'database' && initialPreset ? findDatabasePreset(initialPreset)?.transportType ?? 'stdio' : 'streamable_http',
            authType: 'none',
            headers: [],
            environmentRows: [],
            readOnly: true,
          }}
          onFinish={handleSubmit}
        >
          <Card title="1. 基本信息">
            <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入 MCP 名称' }]}>
              <Input placeholder="例如：PostgreSQL 生产库只读 MCP" />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <TextArea rows={3} placeholder="说明这个 MCP 用来做什么，以及它面向哪个环境。" />
            </Form.Item>
            <Space size={12} style={{ width: '100%' }} align="start">
              <Form.Item name="serverType" label="服务类型" style={{ flex: 1 }}>
                <Select
                  options={[
                    { label: '通用 MCP Server', value: 'generic' },
                    { label: '数据库 MCP', value: 'database' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="transportType" label="传输方式" style={{ flex: 1 }}>
                <Select
                  options={[
                    { label: 'streamable_http', value: 'streamable_http' },
                    { label: 'sse（使用 streamable_http subsidiary channel）', value: 'sse' },
                    { label: 'stdio', value: 'stdio' },
                  ]}
                />
              </Form.Item>
            </Space>
            {serverType === 'database' && (
              <Form.Item
                name="presetCode"
                label="数据库预设"
                rules={[{ required: true, message: '请选择数据库预设' }]}
              >
                <Select
                  options={DATABASE_PRESET_OPTIONS.map((item) => ({
                    label: `${item.label} · ${item.description}`,
                    value: item.code,
                  }))}
                />
              </Form.Item>
            )}
            {(transportType === 'streamable_http' || transportType === 'sse') && (
              <Form.Item
                name="url"
                label="服务地址"
                rules={[
                  { required: true, message: '当前传输方式必须填写 URL' },
                  { type: 'url', message: '请输入合法的 URL' },
                ]}
              >
                <Input placeholder={transportType === 'sse' ? 'https://mcp.example.com/sse' : 'https://mcp.example.com/mcp'} />
              </Form.Item>
            )}
            {transportType === 'stdio' && serverType === 'generic' && (
              <>
                <Space size={12} style={{ width: '100%' }} align="start">
                  <Form.Item name="command" label="命令" rules={[{ required: true, message: '请输入 stdio 启动命令' }]} style={{ flex: 1 }}>
                    <Input placeholder="例如：npx" />
                  </Form.Item>
                  <Form.Item name="commandArgs" label="参数" style={{ flex: 1 }}>
                    <Input placeholder='例如：-y @modelcontextprotocol/server-filesystem /tmp' />
                  </Form.Item>
                </Space>
                <Text type="secondary">命令和参数会被组合成 `transportConfig.command` 数组传给后端。</Text>
              </>
            )}
          </Card>

          {renderDatabaseConfig()}

          <Card title="2. 认证配置" style={{ marginTop: 20 }}>
            <Form.Item name="authType" label="认证方式">
              <Select
                options={[
                  { label: 'none', value: 'none' },
                  { label: 'bearer', value: 'bearer' },
                  { label: 'api_key', value: 'api_key' },
                  { label: 'basic', value: 'basic' },
                  { label: 'oauth', value: 'oauth' },
                ]}
              />
            </Form.Item>
            {renderAuthFields()}
          </Card>

          <Card title="3. 自定义 Headers" style={{ marginTop: 20 }}>
            <Form.List name="headers">
              {(fields, { add, remove }) => (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {fields.map((field) => (
                    <Space key={field.key} size={12} align="start" style={{ display: 'flex' }}>
                      <Form.Item name={[field.name, 'key']} label={field.name === 0 ? 'Header Key' : ''} style={{ width: 280 }}>
                        <Input placeholder="X-Tenant-Id" />
                      </Form.Item>
                      <Form.Item name={[field.name, 'value']} label={field.name === 0 ? 'Header Value' : ''} style={{ width: 360 }}>
                        <Input placeholder="tenant-demo" />
                      </Form.Item>
                      <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
                    </Space>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ key: '', value: '' })}>
                    添加 Header
                  </Button>
                </Space>
              )}
            </Form.List>
          </Card>

          <Card title="4. 运行环境变量" style={{ marginTop: 20 }}>
            <Form.List name="environmentRows">
              {(fields, { add, remove }) => (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Alert
                    type="info"
                    showIcon
                    message="说明"
                    description="数据库预设会自动生成必要环境变量；这里填写的是额外覆盖项。对于通用 stdio MCP，可在这里补充启动环境。"
                  />
                  {fields.map((field) => (
                    <Space key={field.key} size={12} align="start" style={{ display: 'flex' }}>
                      <Form.Item name={[field.name, 'key']} label={field.name === 0 ? 'Env Key' : ''} style={{ width: 280 }}>
                        <Input placeholder="HTTP_PROXY" />
                      </Form.Item>
                      <Form.Item name={[field.name, 'value']} label={field.name === 0 ? 'Env Value' : ''} style={{ width: 360 }}>
                        <Input placeholder="http://127.0.0.1:7890" />
                      </Form.Item>
                      <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
                    </Space>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ key: '', value: '' })}>
                    添加环境变量
                  </Button>
                </Space>
              )}
            </Form.List>
          </Card>

          <Divider />
          <Space>
            <Button onClick={() => navigate('/integration/mcp')}>取消</Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              创建 MCP Server
            </Button>
          </Space>
        </Form>
      </Space>
    </PageContainer>
  );
}

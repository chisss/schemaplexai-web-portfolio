import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Badge, Button, Card, Descriptions, Form, Input, Modal, Select, Space, Spin, Table, Tag, Typography, message } from 'antd';
import { DeleteOutlined, EditOutlined, HeartOutlined, ToolOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useDeleteMcpServer, useDiscoverMcpServerTools, useHealthCheckMcpServer, useMcpServerDetail, useUpdateMcpServer } from '@/api/mcp';
import { DATABASE_PRESET_OPTIONS } from './mcpPresetConfig';

const { Text } = Typography;
const { TextArea } = Input;

type McpEditFormValues = {
  name?: string;
  description?: string;
  url?: string;
  transportType?: string;
  authType?: string;
  status?: string;
  serverType?: string;
  presetCode?: string;
  authConfigJson?: string;
  headersJson?: string;
  connectionConfigJson?: string;
  transportConfigJson?: string;
};

function formatJson(value: unknown) {
  if (value == null) {
    return '-';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function McpServerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: server, isLoading } = useMcpServerDetail(id!);
  const updateMutation = useUpdateMcpServer();
  const deleteMutation = useDeleteMcpServer();
  const healthCheckMutation = useHealthCheckMcpServer();
  const discoverToolsMutation = useDiscoverMcpServerTools();
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm<McpEditFormValues>();
  const initialMaskedRef = useRef<{ authConfigJson: string; connectionConfigJson: string }>({
    authConfigJson: '{}',
    connectionConfigJson: '{}',
  });

  const handleEdit = () => {
    const authConfigJson = server?.authConfig ? JSON.stringify(server.authConfig, null, 2) : '{}';
    const connectionConfigJson = server?.connectionConfig ? JSON.stringify(server.connectionConfig, null, 2) : '{}';
    initialMaskedRef.current = {
      authConfigJson,
      connectionConfigJson,
    };
    form.setFieldsValue({
      name: server?.name,
      description: server?.description,
      url: server?.url,
      transportType: server?.transportType,
      authType: server?.authType,
      status: server?.status,
      serverType: server?.serverType,
      presetCode: server?.presetCode,
      authConfigJson,
      headersJson: server?.headers ? JSON.stringify(server.headers, null, 2) : '{}',
      connectionConfigJson,
      transportConfigJson: server?.transportConfig ? JSON.stringify(server.transportConfig, null, 2) : '{}',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    let authConfig;
    let headers;
    let connectionConfig;
    let transportConfig;

    try {
      authConfig = values.authConfigJson ? JSON.parse(values.authConfigJson) : {};
      headers = values.headersJson ? JSON.parse(values.headersJson) : {};
      connectionConfig = values.connectionConfigJson ? JSON.parse(values.connectionConfigJson) : {};
      transportConfig = values.transportConfigJson ? JSON.parse(values.transportConfigJson) : {};
    } catch {
      message.error('JSON 字段解析失败，请检查认证 / Headers / Connection / Transport 配置');
      return;
    }

    updateMutation.mutate(
      {
        id: id!,
        data: {
          name: values.name?.trim(),
          description: values.description?.trim(),
          url: values.url?.trim(),
          transportType: values.transportType as any,
          authType: values.authType,
          status: values.status,
          serverType: values.serverType as any,
          presetCode: values.presetCode,
          authConfig:
            values.authConfigJson !== initialMaskedRef.current.authConfigJson
              ? authConfig
              : undefined,
          headers,
          connectionConfig:
            values.connectionConfigJson !== initialMaskedRef.current.connectionConfigJson
              ? connectionConfig
              : undefined,
          transportConfig,
        },
      },
      {
        onSuccess: () => {
          message.success('MCP Server 更新成功');
          setEditing(false);
        },
      },
    );
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除 MCP Server？',
      onOk: () =>
        deleteMutation.mutateAsync(id!).then(() => {
          message.success('MCP Server 删除成功');
          navigate('/integration/mcp');
        }),
    });
  };

  if (isLoading) {
    return <Spin className="flex justify-center p-20" />;
  }
  if (!server) {
    return null;
  }

  const presetLabel = DATABASE_PRESET_OPTIONS.find((item) => item.code === server.presetCode)?.label;

  return (
    <PageContainer
      title={server.name}
      extra={
        <Space>
          <Button icon={<HeartOutlined />} onClick={() => healthCheckMutation.mutate(id!)}>
            健康检查
          </Button>
          <Button icon={<ToolOutlined />} onClick={() => discoverToolsMutation.mutate(id!)}>
            发现工具
          </Button>
          <Button icon={<EditOutlined />} onClick={handleEdit}>
            编辑
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            删除
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <Card>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="名称">{server.name}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge status={server.status === 'active' ? 'success' : 'default'} text={server.status} />
            </Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>
              {server.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="服务类型">{server.serverType || '-'}</Descriptions.Item>
            <Descriptions.Item label="预设">{presetLabel || server.presetCode || '-'}</Descriptions.Item>
            <Descriptions.Item label="传输方式">
              <Space>
                <Tag color="blue">{server.transportType || '-'}</Tag>
                {server.transportType === 'sse' ? <Text type="secondary">当前使用 Streamable HTTP + subsidiary channel</Text> : null}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="服务地址">{server.url || '-'}</Descriptions.Item>
            <Descriptions.Item label="认证方式">{server.authType || 'none'}</Descriptions.Item>
            <Descriptions.Item label="最近健康检查">{server.lastHealthCheck || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{server.createdAt}</Descriptions.Item>
          </Descriptions>
        </Card>

        {server.transportType === 'sse' ? (
          <Alert
            type="info"
            showIcon
            message="SSE 实现已升级"
            description="当前不再使用已废弃的 HttpMcpTransport，而是统一走 StreamableHttpMcpTransport，并在 SSE 模式下开启 subsidiaryChannel(true)。"
          />
        ) : null}

        <Card title="认证配置">
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{formatJson(server.authConfig)}</pre>
        </Card>

        <Card title="自定义 Headers">
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{formatJson(server.headers)}</pre>
        </Card>

        <Card title="连接配置">
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{formatJson(server.connectionConfig)}</pre>
        </Card>

        <Card title="传输配置">
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{formatJson(server.transportConfig)}</pre>
        </Card>

        <Card title="工具列表">
          <Table
            rowKey="name"
            columns={[
              { title: '工具名', dataIndex: 'name', key: 'name' },
              { title: '描述', dataIndex: 'description', key: 'description' },
            ]}
            dataSource={(server.tools as any[] | undefined) ?? []}
            pagination={false}
          />
        </Card>
      </Space>

      <Modal
        title="编辑 MCP Server"
        open={editing}
        onCancel={() => setEditing(false)}
        onOk={handleSave}
        confirmLoading={updateMutation.isPending}
        width={920}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} />
          </Form.Item>

          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item name="serverType" label="服务类型" style={{ flex: 1 }}>
              <Select
                options={[
                  { label: 'generic', value: 'generic' },
                  { label: 'database', value: 'database' },
                ]}
              />
            </Form.Item>
            <Form.Item name="presetCode" label="预设" style={{ flex: 1 }}>
              <Select
                allowClear
                options={DATABASE_PRESET_OPTIONS.map((item) => ({ label: item.label, value: item.code }))}
              />
            </Form.Item>
            <Form.Item name="transportType" label="传输方式" style={{ flex: 1 }}>
              <Select
                options={[
                  { label: 'streamable_http', value: 'streamable_http' },
                  { label: 'sse（内部映射为 streamable_http + subsidiaryChannel）', value: 'sse' },
                  { label: 'stdio', value: 'stdio' },
                ]}
              />
            </Form.Item>
          </Space>

          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item name="url" label="服务地址" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="authType" label="认证方式" style={{ flex: 1 }}>
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
            <Form.Item name="status" label="状态" style={{ flex: 1 }}>
              <Select
                options={[
                  { label: 'active', value: 'active' },
                  { label: 'inactive', value: 'inactive' },
                  { label: 'error', value: 'error' },
                ]}
              />
            </Form.Item>
          </Space>

          <Form.Item name="authConfigJson" label="认证配置 JSON">
            <TextArea rows={6} />
          </Form.Item>
          <Form.Item name="headersJson" label="Headers JSON">
            <TextArea rows={6} />
          </Form.Item>
          <Form.Item name="connectionConfigJson" label="连接配置 JSON">
            <TextArea rows={8} />
          </Form.Item>
          <Form.Item name="transportConfigJson" label="传输配置 JSON">
            <TextArea rows={8} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

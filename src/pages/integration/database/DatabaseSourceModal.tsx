import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  useCreateDatabaseSource,
  useTestDraftDatabaseSource,
  useUpdateDatabaseSource,
} from '@/api/database';
import type { DatabaseSource, DatabaseSourceSaveDTO } from '@/types/database';
import {
  DATABASE_TYPE_OPTIONS,
  isPresetSupported,
  parseCommandText,
  resolveDatabaseTypeMeta,
  stringifyCommand,
} from './databaseMeta';

const { Text, Title } = Typography;

type KeyValueRow = {
  key?: string;
  value?: string;
};

type FormValues = {
  name: string;
  databaseType: string;
  description?: string;
  connectionMode: 'preset' | 'custom';
  presetCode?: string;
  transportType?: 'streamable_http' | 'sse' | 'stdio';
  url?: string;
  host?: string;
  port?: string;
  database?: string;
  schema?: string;
  username?: string;
  password?: string;
  connectionUri?: string;
  sslMode?: string;
  readOnly?: boolean;
  queryToolName?: string;
  tags?: string[];
  commandText?: string;
  environmentRows?: KeyValueRow[];
};

function toMap(rows?: KeyValueRow[]) {
  return (rows ?? []).reduce<Record<string, string>>((acc, item) => {
    const key = item.key?.trim();
    const value = item.value?.trim();
    if (key && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function toRows(source?: Record<string, string>) {
  return Object.entries(source ?? {}).map(([key, value]) => ({ key, value }));
}

interface DatabaseSourceModalProps {
  open: boolean;
  initialValue?: DatabaseSource | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function DatabaseSourceModal({
  open,
  initialValue,
  onCancel,
  onSuccess,
}: DatabaseSourceModalProps) {
  const [form] = Form.useForm<FormValues>();
  const createMutation = useCreateDatabaseSource();
  const updateMutation = useUpdateDatabaseSource();
  const testMutation = useTestDraftDatabaseSource();
  const [testMessage, setTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const databaseType = Form.useWatch('databaseType', form);
  const connectionMode = Form.useWatch('connectionMode', form);
  const transportType = Form.useWatch('transportType', form);
  const meta = useMemo(() => resolveDatabaseTypeMeta(databaseType), [databaseType]);
  const editing = !!initialValue?.id;

  useEffect(() => {
    if (!open) {
      return;
    }
    const nextDatabaseType = initialValue?.databaseType ?? 'postgresql';
    const nextConnectionMode = initialValue?.connectionMode
      ?? (isPresetSupported(nextDatabaseType) ? 'preset' : 'custom');

    form.setFieldsValue({
      name: initialValue?.name ?? '',
      databaseType: nextDatabaseType,
      description: initialValue?.description ?? '',
      connectionMode: nextConnectionMode,
      presetCode: initialValue?.presetCode ?? (isPresetSupported(nextDatabaseType) ? nextDatabaseType : undefined),
      transportType: initialValue?.transportType ?? (isPresetSupported(nextDatabaseType) ? 'stdio' : 'stdio'),
      url: initialValue?.url ?? '',
      host: initialValue?.host ?? '',
      port: initialValue?.port ?? resolveDatabaseTypeMeta(nextDatabaseType).defaultPort,
      database: initialValue?.database ?? '',
      schema: initialValue?.schema ?? '',
      username: initialValue?.username ?? '',
      password: '',
      connectionUri: initialValue?.connectionUri?.includes('***') ? '' : (initialValue?.connectionUri ?? ''),
      sslMode: initialValue?.sslMode ?? '',
      readOnly: initialValue?.readOnly ?? true,
      queryToolName: initialValue?.queryToolName ?? '',
      tags: initialValue?.tags ?? [],
      commandText: stringifyCommand(initialValue?.command),
      environmentRows: toRows(initialValue?.environment),
    });
    setTestMessage(null);
  }, [form, initialValue, open]);

  useEffect(() => {
    if (!open || !databaseType) {
      return;
    }
    if (isPresetSupported(databaseType) && connectionMode !== 'custom') {
      form.setFieldsValue({
        connectionMode: 'preset',
        presetCode: databaseType,
        transportType: 'stdio',
        port: form.getFieldValue('port') || meta.defaultPort,
      });
      return;
    }
    if (!isPresetSupported(databaseType)) {
      form.setFieldsValue({
        connectionMode: 'custom',
        presetCode: undefined,
        transportType: form.getFieldValue('transportType') || 'stdio',
        port: form.getFieldValue('port') || meta.defaultPort,
      });
    }
  }, [connectionMode, databaseType, form, meta.defaultPort, open]);

  const buildPayload = (values: FormValues): DatabaseSourceSaveDTO => ({
    name: values.name.trim(),
    databaseType: values.databaseType,
    description: values.description?.trim() || undefined,
    connectionMode: values.connectionMode,
    presetCode: values.connectionMode === 'preset'
      ? (values.presetCode || values.databaseType)
      : undefined,
    transportType: values.connectionMode === 'preset'
      ? 'stdio'
      : values.transportType,
    url: values.connectionMode === 'custom' && values.transportType !== 'stdio'
      ? values.url?.trim() || undefined
      : undefined,
    host: values.host?.trim() || undefined,
    port: values.port?.trim() || undefined,
    database: values.database?.trim() || undefined,
    schema: values.schema?.trim() || undefined,
    username: values.username?.trim() || undefined,
    password: values.password?.trim() || undefined,
    connectionUri: values.connectionUri?.trim() || undefined,
    sslMode: values.sslMode?.trim() || undefined,
    readOnly: values.readOnly ?? true,
    queryToolName: values.queryToolName?.trim() || undefined,
    tags: values.tags?.filter(Boolean),
    command: values.connectionMode === 'custom' && values.transportType === 'stdio'
      ? parseCommandText(values.commandText)
      : undefined,
    environment: values.connectionMode === 'custom'
      ? toMap(values.environmentRows)
      : undefined,
  });

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = buildPayload(values);
    const action = editing
      ? updateMutation.mutateAsync({ id: initialValue!.id, data: payload })
      : createMutation.mutateAsync(payload);

    await action;
    message.success(editing ? '数据源已更新' : '数据源已创建');
    onSuccess();
  };

  const handleTest = async () => {
    const values = await form.validateFields();
    const payload = buildPayload(values);
    const result = await testMutation.mutateAsync(payload);
    const nextMessage = result.data;
    if (nextMessage.recommendedQueryTool && !form.getFieldValue('queryToolName')) {
      form.setFieldValue('queryToolName', nextMessage.recommendedQueryTool);
    }
    setTestMessage({
      type: nextMessage.connected ? 'success' : 'error',
      text: nextMessage.connected
        ? `${nextMessage.message || '连接成功'}，发现 ${nextMessage.toolCount ?? 0} 个工具`
        : nextMessage.message || '连接失败',
    });
  };

  return (
    <Modal
      open={open}
      title={editing ? '编辑数据源' : '新建数据源'}
      width={980}
      destroyOnClose
      onCancel={onCancel}
      footer={(
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button loading={testMutation.isPending} onClick={handleTest}>
            测试连接
          </Button>
          <Button
            type="primary"
            loading={createMutation.isPending || updateMutation.isPending}
            onClick={handleSubmit}
          >
            {editing ? '保存变更' : '完成绑定'}
          </Button>
        </Space>
      )}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="配置说明"
          description={meta.description}
        />
        {testMessage && (
          <Alert
            type={testMessage.type}
            showIcon
            message={testMessage.text}
          />
        )}
        <Form form={form} layout="vertical" initialValues={{ readOnly: true, connectionMode: 'preset' }}>
          <Title level={5} style={{ marginBottom: 12 }}>基础信息</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="数据源名称" rules={[{ required: true, message: '请输入数据源名称' }]}>
                <Input placeholder="如：订单主库 / 用户画像仓" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="databaseType" label="数据库类型" rules={[{ required: true, message: '请选择数据库类型' }]}>
                <Select
                  options={DATABASE_TYPE_OPTIONS.map((item) => ({ label: item.label, value: item.code }))}
                  placeholder="选择数据库类型"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述">
            <Input placeholder="描述此数据源的业务用途、环境或负责人" />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select
              mode="tags"
              placeholder="输入业务标签，如：生产、报表、只读"
              tokenSeparators={[',']}
            />
          </Form.Item>

          <Divider />
          <Title level={5} style={{ marginBottom: 12 }}>接入模式</Title>
          <Form.Item name="connectionMode" label="接入方式">
            <Select
              options={[
                { label: '预设接入', value: 'preset', disabled: !isPresetSupported(databaseType) },
                { label: '自定义 MCP', value: 'custom' },
              ]}
            />
          </Form.Item>
          {connectionMode === 'preset' && (
            <Alert
              type="success"
              showIcon
              message={`当前将使用 ${meta.label} 预设能力`}
              description="保存后会沿用现有数据库 MCP 预设解析器自动生成命令与环境变量。"
            />
          )}
          {connectionMode === 'custom' && (
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="transportType" label="传输类型" rules={[{ required: true, message: '请选择传输类型' }]}>
                  <Select
                    options={[
                      { label: 'STDIO', value: 'stdio' },
                      { label: 'HTTP', value: 'streamable_http' },
                      { label: 'SSE', value: 'sse' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={16}>
                {transportType !== 'stdio' ? (
                  <Form.Item
                    name="url"
                    label="MCP URL"
                    rules={[{ required: true, message: '请输入 MCP URL' }]}
                  >
                    <Input placeholder="https://mcp.example.com/database" />
                  </Form.Item>
                ) : (
                  <Form.Item
                    name="commandText"
                    label="启动命令"
                    rules={[{ required: true, message: '请输入 MCP 启动命令' }]}
                  >
                    <Input placeholder='如：npx -y your-mcp-server --mode readonly' />
                  </Form.Item>
                )}
              </Col>
            </Row>
          )}

          <Divider />
          <Title level={5} style={{ marginBottom: 12 }}>连接信息</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="connectionUri" label="连接 URI">
                <Input placeholder="如：postgresql://user:password@host:5432/db" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="queryToolName" label="查询工具名">
                <Input placeholder="留空则由系统根据发现工具自动推断" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="host" label="Host">
                <Input placeholder="localhost" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="port" label="Port">
                <Input placeholder={meta.defaultPort} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="database" label="数据库名">
                <Input placeholder="数据库名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="schema" label="默认 Schema">
                <Input placeholder="如：public / dbo" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="username" label="用户名">
                <Input placeholder="数据库用户名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="password"
                label={editing ? '密码（留空表示保持不变）' : '密码'}
              >
                <Input.Password placeholder={editing ? '留空则沿用当前密码' : '数据库密码'} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sslMode" label="SSL 模式">
                <Input placeholder="disable / require / verify-full" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="readOnly" label="只读模式" valuePropName="checked">
            <Switch checkedChildren="只读" unCheckedChildren="可写" />
          </Form.Item>

          {connectionMode === 'custom' && transportType === 'stdio' && (
            <>
              <Divider />
              <Space align="center">
                <Title level={5} style={{ margin: 0 }}>环境变量</Title>
                <Tag color="blue">用于自定义 MCP 启动</Tag>
              </Space>
              <Form.List name="environmentRows">
                {(fields, { add, remove }) => (
                  <Space direction="vertical" size={12} style={{ width: '100%', marginTop: 12 }}>
                    {fields.map((field) => (
                      <Space key={field.key} align="start" style={{ display: 'flex' }}>
                        <Form.Item name={[field.name, 'key']} rules={[{ required: true, message: '请输入变量名' }]}>
                          <Input placeholder="变量名" />
                        </Form.Item>
                        <Form.Item name={[field.name, 'value']} rules={[{ required: true, message: '请输入变量值' }]}>
                          <Input placeholder="变量值" />
                        </Form.Item>
                        <Button icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
                      </Space>
                    ))}
                    <Button icon={<PlusOutlined />} onClick={() => add()}>
                      添加环境变量
                    </Button>
                  </Space>
                )}
              </Form.List>
            </>
          )}
        </Form>
        <Text type="secondary">
          编辑模式下，若不修改密码与脱敏连接 URI，系统会继续保留原有密钥配置。
        </Text>
      </Space>
    </Modal>
  );
}


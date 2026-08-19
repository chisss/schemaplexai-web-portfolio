import { Alert, Button, Card, Divider, Form, Input, Select, Space, Switch, Typography, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useCreateSkill } from '@/api/skill';
import { useMcpServers } from '@/api/mcp';
import type { SkillCreateDTO, SkillParameter, SkillResource } from '@/types/integration';

const { Text, Title } = Typography;
const { TextArea } = Input;

type SkillFormValues = {
  name: string;
  displayName?: string;
  description?: string;
  skillPrompt?: string;
  version?: string;
  category: 'custom' | 'mcp' | 'builtin';
  searchBehavior?: 'searchable' | 'always_visible';
  progressiveDisclosure?: boolean;
  lazyLoad?: boolean;
  parameters?: Array<SkillParameter & { enumValuesText?: string }>;
  resources?: SkillResource[];
  implementationType: 'mcp' | 'script' | 'api';
  implementationServerId?: string;
  implementationToolName?: string;
  implementationScriptLanguage?: string;
  implementationScriptContent?: string;
  implementationApiUrl?: string;
  implementationApiMethod?: string;
};

export default function SkillCreate() {
  const navigate = useNavigate();
  const [form] = Form.useForm<SkillFormValues>();
  const createMutation = useCreateSkill();
  const { data: mcpPage } = useMcpServers({ page: 1, size: 100, status: 'active' });

  const mcpServers = mcpPage?.records ?? [];
  const selectedServerId = Form.useWatch('implementationServerId', form);

  const mcpServerOptions = useMemo(
    () =>
      mcpServers.map((server) => ({
        label: `${server.name}${server.serverType === 'database' ? ' · 数据库' : ''}`,
        value: server.id,
      })),
    [mcpServers],
  );

  const selectedServer = useMemo(
    () => mcpServers.find((server) => server.id === selectedServerId),
    [mcpServers, selectedServerId],
  );

  const selectedToolOptions = useMemo(() => {
    if (!selectedServer?.tools?.length) {
      return [];
    }
    return selectedServer.tools
      .map((tool) => {
        const name = typeof tool?.name === 'string' ? tool.name : '';
        const description = typeof tool?.description === 'string' ? tool.description : '';
        if (!name) {
          return null;
        }
        return {
          label: description ? `${name} · ${description}` : name,
          value: name,
        };
      })
      .filter(Boolean) as Array<{ label: string; value: string }>;
  }, [selectedServer]);

  const implementationType = Form.useWatch('implementationType', form);

  const handleSubmit = async () => {
    const values = await form.validateFields();

    const parameters = (values.parameters ?? [])
      .filter((item) => item?.name?.trim())
      .map((item) => ({
        name: item.name.trim(),
        type: item.type,
        required: item.required ?? false,
        description: item.description?.trim(),
        default: item.default,
        enumValues: item.enumValuesText
          ?.split(',')
          .map((part) => part.trim())
          .filter(Boolean),
      }));

    const resources = (values.resources ?? [])
      .filter((item) => item?.relativePath?.trim() && item?.content?.trim())
      .map((item) => ({
        relativePath: item.relativePath.trim(),
        content: item.content.trim(),
      }));

    let implementation: Record<string, unknown>;
    if (values.implementationType === 'mcp') {
      implementation = {
        type: 'mcp',
        serverId: values.implementationServerId,
        toolName: values.implementationToolName,
      };
    } else if (values.implementationType === 'api') {
      implementation = {
        type: 'api',
        url: values.implementationApiUrl,
        method: values.implementationApiMethod ?? 'POST',
        status: 'draft',
      };
    } else {
      implementation = {
        type: 'script',
        language: values.implementationScriptLanguage ?? 'javascript',
        content: values.implementationScriptContent,
        status: 'draft',
      };
    }

    const payload: SkillCreateDTO = {
      name: values.name.trim(),
      displayName: values.displayName?.trim(),
      description: values.description?.trim(),
      skillPrompt: values.skillPrompt?.trim(),
      version: values.version?.trim() || '1.0.0',
      category: values.category,
      parameters,
      resources,
      exposureConfig: {
        searchBehavior: values.searchBehavior ?? 'searchable',
        progressiveDisclosure: values.progressiveDisclosure ?? true,
        lazyLoad: values.lazyLoad ?? true,
      },
      implementation,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        message.success('Skill 创建成功');
        navigate('/integration/skill');
      },
      onError: () => {
        message.error('Skill 创建失败');
      },
    });
  };

  return (
    <PageContainer title="创建 Skill">
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <Card styles={{ body: { paddingBottom: 12 } }}>
          <Space direction="vertical" size={4}>
            <Title level={3} style={{ margin: 0 }}>
              LangChain4j Skill 配置
            </Title>
            <Text type="secondary">
              按“基本信息 → 激活提示词 → 渐进式披露 → 实现方式”组织配置。默认优先支持 MCP Skill，避免用户直接编辑 JSON。
            </Text>
          </Space>
        </Card>

        <Form<SkillFormValues>
          form={form}
          layout="vertical"
          initialValues={{
            version: '1.0.0',
            category: 'mcp',
            searchBehavior: 'searchable',
            progressiveDisclosure: true,
            lazyLoad: true,
            implementationType: 'mcp',
            parameters: [],
            resources: [{ relativePath: 'usage.md', content: '' }],
          }}
          onFinish={handleSubmit}
        >
          <Card title="1. 基本信息">
            <Form.Item
              name="name"
              label="Skill 标识"
              rules={[
                { required: true, message: '请输入 Skill 标识' },
                { pattern: /^[a-z][a-z0-9._-]*$/, message: '仅支持小写字母、数字、点、下划线和中划线' },
              ]}
            >
              <Input placeholder="例如：skill.database-postgres-analyzer" />
            </Form.Item>
            <Form.Item name="displayName" label="显示名称" rules={[{ required: true, message: '请输入显示名称' }]}>
              <Input placeholder="例如：数据库分析助手" />
            </Form.Item>
            <Form.Item name="description" label="用途描述" rules={[{ required: true, message: '请输入用途描述' }]}>
              <TextArea rows={3} placeholder="描述这个 Skill 应该在什么场景被模型激活。" />
            </Form.Item>
            <Space size={16} style={{ width: '100%' }} align="start">
              <Form.Item name="version" label="版本" style={{ flex: 1 }}>
                <Input placeholder="1.0.0" />
              </Form.Item>
              <Form.Item name="category" label="分类" style={{ flex: 1 }}>
                <Select
                  options={[
                    { label: 'MCP Skill', value: 'mcp' },
                    { label: '自定义 Skill', value: 'custom' },
                    { label: '内置 Skill（仅平台维护）', value: 'builtin' },
                  ]}
                />
              </Form.Item>
            </Space>
          </Card>

          <Card title="2. 激活提示词与渐进式披露" style={{ marginTop: 20 }}>
            <Form.Item
              name="skillPrompt"
              label="Skill Prompt"
              rules={[{ required: true, message: '请输入 Skill 激活提示词' }]}
            >
              <TextArea
                rows={6}
                placeholder="说明模型在什么情况下应该激活这个 Skill、需要先确认哪些参数、缺少信息时如何处理。"
              />
            </Form.Item>
            <Space size={16} style={{ width: '100%' }} align="start">
              <Form.Item name="searchBehavior" label="搜索暴露策略" style={{ flex: 1 }}>
                <Select
                  options={[
                    { label: 'searchable · 默认隐藏，按需搜索后暴露', value: 'searchable' },
                    { label: 'always_visible · 始终直接暴露给模型', value: 'always_visible' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="progressiveDisclosure" label="渐进式披露" valuePropName="checked" style={{ minWidth: 180 }}>
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
              <Form.Item name="lazyLoad" label="Lazy Load" valuePropName="checked" style={{ minWidth: 160 }}>
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
            </Space>
            <Alert
              type="info"
              showIcon
              message="建议"
              description="大多数业务 Skill 推荐使用 searchable + progressiveDisclosure，这样 Agent 会先搜工具再暴露具体 Skill，避免上下文被一次性塞满。"
            />
          </Card>

          <Card title="3. Skill 资源" style={{ marginTop: 20 }}>
            <Form.List name="resources">
              {(fields, { add, remove }) => (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  {fields.map((field) => (
                    <Card
                      key={field.key}
                      size="small"
                      title={`资源 ${field.name + 1}`}
                      extra={<Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />}
                    >
                      <Form.Item
                        name={[field.name, 'relativePath']}
                        label="资源路径"
                        rules={[{ required: true, message: '请输入资源路径' }]}
                      >
                        <Input placeholder="例如：usage.md" />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'content']}
                        label="资源内容"
                        rules={[{ required: true, message: '请输入资源内容' }]}
                      >
                        <TextArea rows={5} placeholder="填写可被模型按需读取的资源内容，例如使用说明、约束或示例。" />
                      </Form.Item>
                    </Card>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ relativePath: '', content: '' })}>
                    添加资源
                  </Button>
                </Space>
              )}
            </Form.List>
          </Card>

          <Card title="4. 参数定义" style={{ marginTop: 20 }}>
            <Form.List name="parameters">
              {(fields, { add, remove }) => (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  {fields.map((field) => (
                    <Card
                      key={field.key}
                      size="small"
                      title={`参数 ${field.name + 1}`}
                      extra={<Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />}
                    >
                      <Space size={12} style={{ width: '100%' }} align="start">
                        <Form.Item
                          name={[field.name, 'name']}
                          label="参数名"
                          rules={[{ required: true, message: '请输入参数名' }]}
                          style={{ flex: 1 }}
                        >
                          <Input placeholder="例如：topic" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, 'type']}
                          label="类型"
                          initialValue="string"
                          style={{ width: 160 }}
                        >
                          <Select
                            options={[
                              { label: 'string', value: 'string' },
                              { label: 'number', value: 'number' },
                              { label: 'boolean', value: 'boolean' },
                              { label: 'object', value: 'object' },
                              { label: 'array', value: 'array' },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item name={[field.name, 'required']} label="必填" valuePropName="checked" style={{ width: 100 }}>
                          <Switch />
                        </Form.Item>
                      </Space>
                      <Form.Item name={[field.name, 'description']} label="参数说明">
                        <Input placeholder="告诉模型这个参数的用途和期望格式" />
                      </Form.Item>
                      <Space size={12} style={{ width: '100%' }} align="start">
                        <Form.Item name={[field.name, 'default']} label="默认值" style={{ flex: 1 }}>
                          <Input placeholder="可选" />
                        </Form.Item>
                        <Form.Item name={[field.name, 'enumValuesText']} label="枚举值" style={{ flex: 1 }}>
                          <Input placeholder="可选，多个值用英文逗号分隔" />
                        </Form.Item>
                      </Space>
                    </Card>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ type: 'string', required: false })}>
                    添加参数
                  </Button>
                </Space>
              )}
            </Form.List>
          </Card>

          <Card title="5. 实现方式" style={{ marginTop: 20 }}>
            <Form.Item name="implementationType" label="实现类型">
              <Select
                options={[
                  { label: 'MCP 工具绑定（推荐）', value: 'mcp' },
                  { label: 'Script 脚本（预留）', value: 'script' },
                  { label: 'HTTP API（预留）', value: 'api' },
                ]}
              />
            </Form.Item>

            {implementationType === 'mcp' && (
              <>
                <Form.Item
                  name="implementationServerId"
                  label="MCP Server"
                  rules={[{ required: true, message: '请选择一个 MCP Server' }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="选择已注册并激活的 MCP Server"
                    options={mcpServerOptions}
                  />
                </Form.Item>
                <Form.Item
                  name="implementationToolName"
                  label="工具名"
                  rules={[{ required: true, message: '请输入或选择工具名' }]}
                >
                  {selectedToolOptions.length ? (
                    <Select
                      showSearch
                      allowClear
                      optionFilterProp="label"
                      placeholder="从已发现工具中选择"
                      options={selectedToolOptions}
                    />
                  ) : (
                    <Input placeholder="先选择 MCP Server，或手动输入工具名" />
                  )}
                </Form.Item>
                {selectedServer?.tools?.length ? (
                  <Text type="secondary">当前服务器已发现 {selectedServer.tools.length} 个工具，可直接从下拉列表中选择。</Text>
                ) : (
                  <Alert
                    style={{ marginTop: 8 }}
                    type="warning"
                    showIcon
                    message="未发现工具清单"
                    description="如果这里没有候选工具，请先到 MCP 管理页执行“发现工具”，或者手动填写 toolName。"
                  />
                )}
              </>
            )}

            {implementationType === 'script' && (
              <>
                <Alert
                  type="warning"
                  showIcon
                  message="脚本模式暂为预留"
                  description="当前平台的 Agent Loop 优先围绕 LangChain4j MCP / Skills 实现。脚本字段会保留到 implementation 中，但默认不会在创建页内自动接入执行链路。"
                  style={{ marginBottom: 16 }}
                />
                <Space size={12} style={{ width: '100%' }} align="start">
                  <Form.Item name="implementationScriptLanguage" label="脚本语言" style={{ width: 200 }}>
                    <Select options={[{ label: 'JavaScript', value: 'javascript' }, { label: 'Python', value: 'python' }]} />
                  </Form.Item>
                </Space>
                <Form.Item name="implementationScriptContent" label="脚本内容">
                  <TextArea rows={10} placeholder="填写脚本内容或占位说明。" />
                </Form.Item>
              </>
            )}

            {implementationType === 'api' && (
              <>
                <Space size={12} style={{ width: '100%' }} align="start">
                  <Form.Item name="implementationApiMethod" label="HTTP 方法" style={{ width: 160 }}>
                    <Select options={[
                      { label: 'POST', value: 'POST' },
                      { label: 'GET', value: 'GET' },
                      { label: 'PUT', value: 'PUT' },
                      { label: 'PATCH', value: 'PATCH' },
                      { label: 'DELETE', value: 'DELETE' },
                    ]} />
                  </Form.Item>
                  <Form.Item name="implementationApiUrl" label="接口地址" style={{ flex: 1 }}>
                    <Input placeholder="https://api.example.com/skills/run" />
                  </Form.Item>
                </Space>
              </>
            )}
          </Card>

          <Divider />
          <Space>
            <Button onClick={() => navigate('/integration/skill')}>取消</Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              创建 Skill
            </Button>
          </Space>
        </Form>
      </Space>
    </PageContainer>
  );
}

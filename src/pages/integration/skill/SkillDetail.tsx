import { useParams, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, Descriptions, Divider, Form, Input, Modal, Select, Space, Spin, Switch, Tag, Typography, message } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useState } from 'react';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useDeleteSkill, useSkillDetail, useUpdateSkill } from '@/api/skill';

const { Paragraph, Text } = Typography;
const { TextArea } = Input;

type SkillEditFormValues = {
  displayName?: string;
  description?: string;
  skillPrompt?: string;
  version?: string;
  category?: string;
  status?: string;
  searchBehavior?: 'searchable' | 'always_visible';
  progressiveDisclosure?: boolean;
  lazyLoad?: boolean;
  parametersJson?: string;
  resourcesJson?: string;
  implementationJson?: string;
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

export default function SkillDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: skill, isLoading } = useSkillDetail(id!);
  const updateMutation = useUpdateSkill();
  const deleteMutation = useDeleteSkill();
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm<SkillEditFormValues>();

  const handleEdit = () => {
    form.setFieldsValue({
      displayName: skill?.displayName,
      description: skill?.description,
      skillPrompt: skill?.skillPrompt,
      version: skill?.version,
      category: skill?.category,
      status: skill?.status,
      searchBehavior: skill?.exposureConfig?.searchBehavior ?? 'searchable',
      progressiveDisclosure: skill?.exposureConfig?.progressiveDisclosure ?? true,
      lazyLoad: skill?.exposureConfig?.lazyLoad ?? true,
      parametersJson: skill?.parameters ? JSON.stringify(skill.parameters, null, 2) : '[]',
      resourcesJson: skill?.resources ? JSON.stringify(skill.resources, null, 2) : '[]',
      implementationJson: skill?.implementation ? JSON.stringify(skill.implementation, null, 2) : '{}',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    let parameters;
    let resources;
    let implementation;

    try {
      parameters = values.parametersJson ? JSON.parse(values.parametersJson) : [];
      resources = values.resourcesJson ? JSON.parse(values.resourcesJson) : [];
      implementation = values.implementationJson ? JSON.parse(values.implementationJson) : {};
    } catch {
      message.error('JSON 字段解析失败，请检查参数 / 资源 / 实现配置');
      return;
    }

    updateMutation.mutate(
      {
        id: id!,
        data: {
          displayName: values.displayName?.trim(),
          description: values.description?.trim(),
          skillPrompt: values.skillPrompt?.trim(),
          version: values.version?.trim(),
          category: values.category,
          status: values.status,
          parameters,
          resources,
          implementation,
          exposureConfig: {
            searchBehavior: values.searchBehavior ?? 'searchable',
            progressiveDisclosure: values.progressiveDisclosure ?? true,
            lazyLoad: values.lazyLoad ?? true,
          },
        },
      },
      {
        onSuccess: () => {
          message.success('Skill 更新成功');
          setEditing(false);
        },
      },
    );
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除 Skill？',
      content: skill?.builtIn ? '这是系统内置 Skill，删除前请确认是否真的需要移除。' : undefined,
      onOk: () =>
        deleteMutation.mutateAsync(id!).then(() => {
          message.success('Skill 删除成功');
          navigate('/integration/skill');
        }),
    });
  };

  if (isLoading) {
    return <Spin className="flex justify-center p-20" />;
  }
  if (!skill) {
    return null;
  }

  return (
    <PageContainer
      title={skill.displayName || skill.name}
      extra={
        <Space>
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
            <Descriptions.Item label="Skill 标识">
              <Space>
                <Text code>{skill.name}</Text>
                {skill.builtIn ? <Tag color="gold">系统内置</Tag> : null}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="显示名称">{skill.displayName || '-'}</Descriptions.Item>
            <Descriptions.Item label="分类">
              <Tag color={skill.category === 'builtin' ? 'blue' : skill.category === 'mcp' ? 'purple' : 'green'}>{skill.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="版本">{skill.version || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge status={skill.status === 'active' ? 'success' : 'default'} text={skill.status} />
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{skill.createdAt}</Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>
              {skill.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Skill Prompt" span={2}>
              <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{skill.skillPrompt || '-'}</Paragraph>
            </Descriptions.Item>
            <Descriptions.Item label="曝光策略">{skill.exposureConfig?.searchBehavior || '-'}</Descriptions.Item>
            <Descriptions.Item label="渐进式披露">
              <Space>
                <Tag color={skill.exposureConfig?.progressiveDisclosure ? 'green' : 'default'}>
                  {skill.exposureConfig?.progressiveDisclosure ? '开启' : '关闭'}
                </Tag>
                <Tag color={skill.exposureConfig?.lazyLoad ? 'blue' : 'default'}>
                  Lazy Load {skill.exposureConfig?.lazyLoad ? '开启' : '关闭'}
                </Tag>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="参数定义">
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{formatJson(skill.parameters)}</pre>
        </Card>

        <Card title="Skill 资源">
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{formatJson(skill.resources)}</pre>
        </Card>

        <Card title="实现配置">
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{formatJson(skill.implementation)}</pre>
        </Card>
      </Space>

      <Modal
        title="编辑 Skill"
        open={editing}
        onCancel={() => setEditing(false)}
        onOk={handleSave}
        confirmLoading={updateMutation.isPending}
        width={880}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="displayName" label="显示名称">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="skillPrompt" label="Skill Prompt">
            <TextArea rows={6} />
          </Form.Item>

          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item name="version" label="版本" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="category" label="分类" style={{ flex: 1 }}>
              <Select
                options={[
                  { label: 'builtin', value: 'builtin' },
                  { label: 'custom', value: 'custom' },
                  { label: 'mcp', value: 'mcp' },
                ]}
              />
            </Form.Item>
            <Form.Item name="status" label="状态" style={{ flex: 1 }}>
              <Select
                options={[
                  { label: 'active', value: 'active' },
                  { label: 'inactive', value: 'inactive' },
                  { label: 'deprecated', value: 'deprecated' },
                ]}
              />
            </Form.Item>
          </Space>

          <Divider titlePlacement="left">Exposure Config</Divider>
          <Space size={12} style={{ width: '100%' }} align="start">
            <Form.Item name="searchBehavior" label="搜索暴露策略" style={{ flex: 1 }}>
              <Select
                options={[
                  { label: 'searchable', value: 'searchable' },
                  { label: 'always_visible', value: 'always_visible' },
                ]}
              />
            </Form.Item>
            <Form.Item name="progressiveDisclosure" label="渐进式披露" valuePropName="checked" style={{ minWidth: 180 }}>
              <Switch />
            </Form.Item>
            <Form.Item name="lazyLoad" label="Lazy Load" valuePropName="checked" style={{ minWidth: 160 }}>
              <Switch />
            </Form.Item>
          </Space>

          <Form.Item name="parametersJson" label="参数定义 JSON">
            <TextArea rows={8} />
          </Form.Item>
          <Form.Item name="resourcesJson" label="资源 JSON">
            <TextArea rows={8} />
          </Form.Item>
          <Form.Item name="implementationJson" label="实现配置 JSON">
            <TextArea rows={8} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

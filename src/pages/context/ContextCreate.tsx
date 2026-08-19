import { useEffect, useState, useMemo } from 'react';
import { Card, Form, Input, Select, Button, Space, Typography, message, Tag, Collapse, Alert, Tooltip } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, LinkOutlined, RobotOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import MarkdownEditor from '@/components/MarkdownEditor/MarkdownEditor';
import { useCreateContext, useContextList } from '@/api/context';
import { useAgentList } from '@/api/agent';
import { useAllWorkspaces } from '@/api/workspace';
import CopilotDrawer from '@/components/CopilotDrawer';
import { useAgentExecution } from '@/hooks/useAgentExecution';
import type { Agent } from '@/types/agent';
import type { Context, ContextCreateDTO } from '@/types/context';
import type { Workspace } from '@/types/integration';

const { Title, Paragraph } = Typography;
interface ContextOption {
  label: string;
  value: string;
  level: string;
}

interface ProjectOption {
  label: string;
  value: string;
  localPath?: string;
}

type ContextCreateFormValues = ContextCreateDTO & {
  initialContent?: string;
  linkedProjectIds?: string[];
};

/** 上下文层级对应颜色 */
const LEVEL_COLOR: Record<string, string> = {
  global: 'purple',
  project: 'blue',
  task: 'cyan',
  agent: 'orange',
};

/** 项目路径前缀标识（不可编辑区域） */
const PROJECT_PATH_PREFIX = '## 已选项目路径\n';

export default function ContextCreate() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form] = Form.useForm<ContextCreateFormValues>();
  const createContext = useCreateContext();
  const [selectedLevel, setSelectedLevel] = useState<string>('project');

  // 加载已有上下文列表，用于关联多选
  const { data: contextPage } = useContextList({ page: 1, size: 100 });
  const contextRecords = contextPage?.records ?? [];
  const contextOptions: ContextOption[] = contextRecords.map((ctx: Context) => ({
    label: ctx.name,
    value: ctx.id,
    level: ctx.contextLevel,
  }));

  // 加载工作空间列表（sf_workspace）
  const { data: allWorkspaces = [] } = useAllWorkspaces();
  const projectOptions = useMemo<ProjectOption[]>(() => {
    return allWorkspaces.map((p: Workspace) => ({
      label: p.name,
      value: p.id,
      localPath: p.localPath,
    }));
  }, [allWorkspaces]);

  // 选中的项目
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  // Agent 辅助编写：按内置位置筛选，返回该位置内置Agent
  const { data: agentPage } = useAgentList({ page: 1, size: 100, builtinPosition: 'context-create' });
  const agentRecords = agentPage?.records ?? [];
  const agentOptions = agentRecords.map((a: Agent) => {
    const isInactive = a.status !== 'active';
    return {
      label: isInactive ? `${a.name}（未激活，请激活后使用）` : a.name,
      value: a.id,
      disabled: isInactive,
    };
  });
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentAssistLoading, setAgentAssistLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { status, logs, result, executionId, startExecution, provideInput, cancel } = useAgentExecution(selectedAgentId);

  // 拼接项目路径前缀（不可编辑）
  const projectPathBlock = useMemo(() => {
    if (selectedProjects.length === 0) return '';
    const paths = selectedProjects
      .map((pid) => {
        const proj = projectOptions.find((p) => p.value === pid);
        return proj?.localPath ? `【${proj.label}】: ${proj.localPath}` : null;
      })
      .filter(Boolean);
    if (paths.length === 0) return '';
    return PROJECT_PATH_PREFIX + paths.join('\n') + '\n\n';
  }, [selectedProjects, projectOptions]);

  // 项目变更时，自动将路径前缀填入 agentPrompt（仅首次追加）
  useEffect(() => {
    if (projectPathBlock && !agentPrompt.startsWith(PROJECT_PATH_PREFIX)) {
      setAgentPrompt(projectPathBlock);
    }
  }, [projectPathBlock]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAgentGenerate = async () => {
    if (!selectedAgentId) {
      message.warning(t('context.agentAssist.selectAgentFirst'));
      return;
    }
    const selectedAgent = agentRecords.find((a: Agent) => a.id === selectedAgentId);
    if (selectedAgent?.status !== 'active') {
      message.warning(t('context.agentAssist.agentInactive'));
      return;
    }
    if (!agentPrompt.trim()) {
      message.warning(t('context.agentAssist.promptRequired'));
      return;
    }
    setAgentAssistLoading(true);
    try {
      setDrawerOpen(true);
      const submitResult = await startExecution({ prompt: agentPrompt });
      if (!submitResult) {
        return;
      }
      if (submitResult.status === 'blocked') {
        message.error(submitResult.message || '内容命中安全策略，已阻断此次辅助生成');
      } else if (submitResult.status === 'paused') {
        message.warning(submitResult.message || '内容命中安全策略，已暂停等待人工处理');
      } else {
        message.success(t('context.agentAssist.started', { id: submitResult.executionId ?? '-' }));
      }
    } catch {
      // 错误已在拦截器中处理
    } finally {
      setAgentAssistLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'completed' || !result) return;
    if (typeof result === 'string') {
      form.setFieldValue('initialContent', result);
      message.success(t('context.agentAssist.generatedFilledContent'));
      return;
    }

    const data = result as Record<string, unknown>;
    const nextValues: Partial<ContextCreateFormValues> = {};
    if (typeof data.name === 'string') nextValues.name = data.name;
    if (typeof data.description === 'string') nextValues.description = data.description;
    if (typeof data.initialContent === 'string') nextValues.initialContent = data.initialContent;
    if (typeof data.content === 'string') nextValues.initialContent = data.content;
    if (Object.keys(nextValues).length > 0) {
      form.setFieldsValue(nextValues);
      message.success(t('context.agentAssist.generatedFilledForm'));
    }
  }, [form, result, status, t]);

  const onFinish = (values: ContextCreateFormValues) => {
    // 关联项目取选中的 workspace ID 列表
    const linkedProjectIds = selectedProjects.filter(Boolean);
    const payload: ContextCreateFormValues = { ...values, linkedProjectIds };
    createContext.mutate(
      payload,
      {
        onSuccess: () => {
          message.success(t('common.createSuccess'));
          navigate('/context');
        },
      },
    );
  };

  // 判断 agentPrompt 中项目路径前缀是否可编辑（去掉只读前缀后才是用户可编辑区）
  const editablePrompt = useMemo(() => {
    return agentPrompt.startsWith(PROJECT_PATH_PREFIX)
      ? agentPrompt.slice(PROJECT_PATH_PREFIX.length)
      : agentPrompt;
  }, [agentPrompt]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    if (newVal.startsWith(PROJECT_PATH_PREFIX)) {
      // 用户在只读前缀之后编辑
      setAgentPrompt(PROJECT_PATH_PREFIX + newVal.slice(PROJECT_PATH_PREFIX.length));
    } else {
      // 用户可能删掉了前缀，允许
      setAgentPrompt(newVal);
    }
  };

  return (
    <PageContainer
      title={t('context.create.title')}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {t('common.back')}
        </Button>
      }
    >
      <div className="max-w-3xl mx-auto">
        <Card variant="borderless" className="shadow-sm rounded-xl">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ contextLevel: 'project' }}
          >
            <Title level={5} className="mb-4">{t('context.create.basicInfo')}</Title>
            <Paragraph type="secondary" className="mb-6">
              {t('context.create.description')}
            </Paragraph>

            <Form.Item
              name="name"
              label={t('context.create.contextName')}
              rules={[{ required: true, message: t('context.create.nameRequired') }]}
            >
              <Input placeholder={t('context.create.namePlaceholder')} size="large" />
            </Form.Item>

            <Form.Item
              name="contextLevel"
              label={t('context.create.contextLevel')}
              rules={[{ required: true }]}
            >
              <Select size="large" onChange={(val) => setSelectedLevel(val)}>
                <Select.Option value="global">{t('context.create.levelGlobalDesc')}</Select.Option>
                <Select.Option value="project">{t('context.create.levelProjectDesc')}</Select.Option>
                <Select.Option value="task">{t('context.create.levelTaskDesc')}</Select.Option>
                <Select.Option value="agent">{t('context.create.levelAgentDesc')}</Select.Option>
              </Select>
            </Form.Item>

            {selectedLevel !== 'global' && (
              <Form.Item
                label={t('context.create.linkedProject')}
                extra={t('context.create.linkedProjectHint')}
              >
                <Select
                  mode="multiple"
                  size="large"
                  placeholder={t('context.create.linkedProjectPlaceholder')}
                  allowClear
                  showSearch
                  value={selectedProjects}
                  onChange={setSelectedProjects}
                  filterOption={(input, opt) =>
                    String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={projectOptions}
                  notFoundContent={
                    projectOptions.length === 0
                      ? t('context.create.noProjects') || '无可用工作空间，请先在工作空间管理中创建'
                      : undefined
                  }
                />
              </Form.Item>
            )}

            <Form.Item name="description" label={t('context.create.contextDesc')}>
              <Input.TextArea rows={3} placeholder={t('context.create.descPlaceholder')} />
            </Form.Item>

            {/* 关联上下文多选：支持知识图谱连线 */}
            <Form.Item
              name="linkedContextIds"
              label={
                <Space>
                  <LinkOutlined />
                  {t('context.create.linkedContexts')}
                </Space>
              }
              extra={t('context.create.linkedContextsHint')}
            >
              <Select
                mode="multiple"
                size="large"
                placeholder={t('context.create.linkedContextsPlaceholder')}
                allowClear
                showSearch
                filterOption={(input, opt) =>
                  String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                optionRender={(opt) => (
                  <Space>
                    <Tag color={LEVEL_COLOR[(opt.data as ContextOption).level] || 'default'} style={{ fontSize: 10 }}>
                      {(opt.data as ContextOption).level}
                    </Tag>
                    {opt.label}
                  </Space>
                )}
                options={contextOptions}
              />
            </Form.Item>

            {/* Agent 辅助编写面板：移动到关联上下文下方 */}
            <Collapse
              ghost
              className="mb-4"
              style={{ background: 'transparent' }}
              items={[{
                key: 'agent-assist',
                label: (
                  <Space>
                    <RobotOutlined style={{ color: '#165DFF' }} />
                    <span style={{ fontWeight: 500 }}>{t('context.agentAssist.title')}</span>
                    {selectedProjects.length > 0 && (
                      <Tag color="blue">{selectedProjects.length} {t('context.create.projectSelected') || '个项目'}</Tag>
                    )}
                  </Space>
                ),
                children: (
                  <div style={{ padding: '8px 0' }}>
                    <Alert
                      type="info"
                      showIcon
                      message={t('context.agentAssist.hint')}
                      style={{ marginBottom: 12 }}
                    />
                    <Space direction="vertical" style={{ width: '100%' }} size={12}>
                      <Select
                        allowClear
                        showSearch
                        placeholder={t('context.agentAssist.selectAgentPlaceholder')}
                        options={agentOptions}
                        value={selectedAgentId}
                        onChange={(val) => setSelectedAgentId(val)}
                        filterOption={(input, opt) =>
                          String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        style={{ width: '100%' }}
                      />

                      {/* 输入框：只读项目路径前缀 + 可编辑区域 */}
                      <div>
                        {/* 只读项目路径提示 */}
                        {projectPathBlock && (
                          <Alert
                            type="success"
                            showIcon
                            message={
                              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                <span style={{ fontWeight: 500 }}>{t('context.agentAssist.projectPaths')}:</span>
                                {selectedProjects.map((pid) => {
                                  const proj = projectOptions.find((p) => p.value === pid);
                                  return proj?.localPath ? (
                                    <code key={pid} style={{ fontSize: 12 }}>{proj.localPath}</code>
                                  ) : null;
                                })}
                              </Space>
                            }
                            style={{ marginBottom: 8, background: '#f6ffed', borderColor: '#b7eb8f' }}
                          />
                        )}
                        {/* 可编辑输入框 + 上传按钮 */}
                        <Input.Group compact style={{ display: 'flex' }}>
                          <Input.TextArea
                            rows={4}
                            placeholder={t('context.agentAssist.promptPlaceholder')}
                            value={editablePrompt}
                            onChange={handlePromptChange}
                            style={{ flex: 1, borderRadius: '6px 0 0 6px' }}
                          />
                          <Tooltip title={t('context.agentAssist.fileUploadHint') || '文件上传能力即将开放，请先使用提示词或直接粘贴内容。'}>
                            <Button
                              icon={<PlusOutlined />}
                              disabled
                              style={{
                                height: 'auto',
                                minHeight: 96,
                                borderRadius: '0 6px 6px 0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: 4,
                                padding: '0 12px',
                                fontSize: 12,
                                whiteSpace: 'normal',
                                textAlign: 'center',
                                width: 64,
                              }}
                            >
                              {t('context.agentAssist.uploadFile') || '上传文件'}
                            </Button>
                          </Tooltip>
                        </Input.Group>
                      </div>

                      <Button
                        type="primary"
                        loading={agentAssistLoading}
                        disabled={
                          !selectedAgentId ||
                          agentRecords.find((a: Agent) => a.id === selectedAgentId)?.status !== 'active'
                        }
                        onClick={handleAgentGenerate}
                        icon={<RobotOutlined />}
                        style={{ background: 'linear-gradient(135deg, #165DFF 0%, #0E42D2 100%)', border: 'none' }}
                      >
                        {t('context.agentAssist.generate')}
                      </Button>
                    </Space>
                  </div>
                ),
              }]}
            />

            {/* Markdown 内容编辑器（用于上下文初始内容/说明，可选） */}
            <Form.Item
              name="initialContent"
              label={t('context.create.initialContent')}
              extra={t('context.create.initialContentHint')}
            >
              <MarkdownEditor
                placeholder={t('context.create.contentPlaceholder')}
                rows={8}
              />
            </Form.Item>

            <div className="mt-8 flex justify-end">
              <Space>
                <Button size="large" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
                <Button size="large" type="primary" htmlType="submit" icon={<SaveOutlined />} loading={createContext.isPending}>
                  {t('context.create.createContext')}
                </Button>
              </Space>
            </div>
          </Form>
        </Card>
      </div>
      <CopilotDrawer
        open={drawerOpen}
        status={status}
        logs={logs}
        executionId={executionId}
        onClose={() => setDrawerOpen(false)}
        onCancel={cancel}
        onProvideInput={provideInput}
      />
    </PageContainer>
  );
}

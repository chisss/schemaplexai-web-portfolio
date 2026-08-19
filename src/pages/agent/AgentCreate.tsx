import { useEffect, useMemo, useRef, useState } from 'react';
import {
  App as AntApp,
  Card,
  Descriptions,
  Form,
  Input,
  Select,
  Button,
  Space,
  Steps,
  Table,
  InputNumber,
  Radio,
  Tag,
  Alert,
  Typography,
  Divider,
  Spin,
  Empty,
  Grid,
  Progress,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useBeforeUnload, useBlocker, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useAvailableTools, useCreateAgent, useSaveTeamMembers, useCreateContextBinding, useDeleteContextBinding, useSaveAgentToolBindings } from '@/api/agent';
import { useAiModels, useTeamTemplates, useDictItemsByCode, useModelGroups } from '@/api/system';
import type { AgentTeamMember, AvailableTool } from '@/types/agent';
import { formatModelUseCaseLabel, isEmbeddingModel, isEmbeddingUseCase } from '@/utils/aiModel';
import {
  useAgentDraftStore,
  type AgentDraftBinding,
  type AgentDraftSnapshot,
} from '@/store/agentDraftStore';
import type { GitLabContextSourceConfig } from '@/types/agent';
import ToolSelectorModal from './components/ToolSelectorModal';
import GitLabContextPicker from './components/GitLabContextPicker';
import { buildToolSelectionKey } from './components/toolSelection';

const { TextArea } = Input;
const { Text } = Typography;

/** 步骤1表单字段 */
interface Step1Values {
  name: string;
  agentType: 'team' | 'solo';
  description?: string;
  aiModel?: string;
  aiModelType?: 'model' | 'model_group';
  aiModelGroupId?: string;
  agentTag?: string[] | string;
}

/** 步骤3绑定类型 */
type BindingSourceType = 'manual' | 'context_module' | 'gitlab';

/** 已添加的绑定条目（key 对应后端 id，用于删除） */
interface BindingEntry {
  key: string;   // 后端返回的 binding id
  title: string;
  content: string;
  sourceType: BindingSourceType;
}

export default function AgentCreate() {
  const { t } = useTranslation();
  const { message, modal } = AntApp.useApp();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const draft = useAgentDraftStore((state) => state.draft);
  const lastSavedAt = useAgentDraftStore((state) => state.lastSavedAt);
  const saveDraft = useAgentDraftStore((state) => state.saveDraft);
  const clearDraft = useAgentDraftStore((state) => state.clearDraft);

  // -- 步骤状态 --
  const [currentStep, setCurrentStep] = useState(0);
  const [agentId, setAgentId] = useState<string>('');
  // useRef 保证闭包中拿到最新 agentId
  const agentIdRef = useRef<string>('');
  const [agentType, setAgentType] = useState<'team' | 'solo'>('team');
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string | undefined>();

  // -- 步骤2成员列表 --
  const [members, setMembers] = useState<AgentTeamMember[]>([
    { roleName: 'Lead Agent', roleType: 'lead_agent', quantity: 1 },
  ]);

  // -- 步骤3绑定相关 --
  const [bindingSourceType, setBindingSourceType] = useState<BindingSourceType>('manual');
  const [manualForm] = Form.useForm();
  const [bindings, setBindings] = useState<BindingEntry[]>([]);

  // -- Solo Agent 工具绑定相关 --
  const [toolSelectorOpen, setToolSelectorOpen] = useState(false);
  const [selectedToolKeys, setSelectedToolKeys] = useState<Set<string>>(new Set());

  // -- 表单实例 --
  const [step1Form] = Form.useForm<Step1Values>();
  const step1Values = Form.useWatch([], step1Form);
  const restorePromptShownRef = useRef(false);
  const leavePromptShownRef = useRef(false);
  const draftReadyRef = useRef(false);
  const currentAgentId = agentId;

  // -- API Hooks --
  const { mutateAsync: createAgent, isPending: isCreating } = useCreateAgent();
  const { mutateAsync: saveTeamMembers, isPending: isSavingMembers } = useSaveTeamMembers();
  const { mutateAsync: createContextBinding, isPending: isSavingBinding } = useCreateContextBinding();
  const { mutateAsync: deleteContextBindingApi } = useDeleteContextBinding();
  const { mutateAsync: saveAgentToolBindingsApi, isPending: isSavingTools } = useSaveAgentToolBindings();

  // -- 数据查询 --
  const { data: aiModels = [] } = useAiModels();
  const { data: modelGroups = [] } = useModelGroups();
  const { data: teamTemplates = [] } = useTeamTemplates();
  const { data: agentTagItems = [] } = useDictItemsByCode('agent_tag');
  const { data: availableTools = [], isLoading: isLoadingAvailableTools } = useAvailableTools(currentAgentId);
  const selectableAiModels = aiModels.filter((model) => !isEmbeddingModel(model));
  const selectableModelGroups = modelGroups.filter((group) => !isEmbeddingUseCase(group.useCase));
  const stepItems = [
    {
      title: t('agent.create.basicInfo'),
      content: t('agent.create.identity'),
    },
    {
      title: t('agent.create.capabilityConfig'),
      content: t('agent.create.modelAndSkills'),
    },
    {
      title: t('agent.create.contextBinding'),
      content: t('agent.create.linkKnowledge'),
    },
  ];
  const progressPercent = Math.round(((currentStep + 1) / stepItems.length) * 100);

  const normalizedSelectedToolKeys = useMemo(() => {
    if (availableTools.length === 0 || selectedToolKeys.size === 0) {
      return selectedToolKeys;
    }
    const normalizedKeys = new Set<string>();
    selectedToolKeys.forEach((key) => {
      if (key.includes(':')) {
        normalizedKeys.add(key);
        return;
      }
      const matchedBuiltinTool = availableTools.find((tool) => tool.sourceType === 'builtin' && tool.toolCode === key);
      if (matchedBuiltinTool) {
        normalizedKeys.add(buildToolSelectionKey(matchedBuiltinTool));
        return;
      }
      normalizedKeys.add(key);
    });
    return normalizedKeys;
  }, [availableTools, selectedToolKeys]);

  const effectiveSelectedToolKeys = useMemo(() => {
    if (normalizedSelectedToolKeys.size > 0) {
      return normalizedSelectedToolKeys;
    }
    if (agentType !== 'solo' || !currentAgentId || availableTools.length === 0) {
      return normalizedSelectedToolKeys;
    }
    return new Set(
      availableTools
        .filter((tool) => tool.alreadyBound)
        .map((tool) => buildToolSelectionKey(tool)),
    );
  }, [agentType, availableTools, currentAgentId, normalizedSelectedToolKeys]);

  // -- 模型绑定类型 --
  const [aiModelType, setAiModelType] = useState<'model' | 'model_group'>('model');
  const selectedAgentTags = Array.isArray(step1Values?.agentTag)
    ? step1Values.agentTag
    : step1Values?.agentTag
      ? [step1Values.agentTag]
      : [];
  const selectedAgentTagLabels = selectedAgentTags.map(
    (value) => agentTagItems.find((item) => item.itemValue === value)?.itemLabel || value,
  );
  const selectedModelLabel = aiModelType === 'model_group'
    ? selectableModelGroups.find((group) => group.id === step1Values?.aiModelGroupId)?.name
    : step1Values?.aiModel;
  const draftStatusText = lastSavedAt
    ? t('agent.create.draftSavedAt', { time: new Date(lastSavedAt).toLocaleString() })
    : t('agent.create.draftNotSaved');
  const currentFocusText = currentStep === 0
    ? t('agent.create.identity')
    : currentStep === 1
      ? (agentType === 'solo' ? t('agent.create.soloToolBindingHint') : t('agent.create.membersTableDesc'))
      : t('agent.create.contextBindingHint');

  const hasDraftContent = Boolean(
    (step1Values?.name && step1Values.name.trim())
      || (step1Values?.description && step1Values.description.trim())
      || (Array.isArray(step1Values?.agentTag) && step1Values.agentTag.length > 0)
      || currentStep > 0
      || agentId
      || bindings.length > 0
      || effectiveSelectedToolKeys.size > 0
      || members.some((member, index) => index > 0 || member.roleName !== 'Lead Agent'),
  );

  const selectedTools = useMemo(
    () => availableTools.filter((tool) => {
      const fullKey = buildToolSelectionKey(tool);
      return effectiveSelectedToolKeys.has(fullKey)
        || (tool.sourceType === 'builtin' && effectiveSelectedToolKeys.has(tool.toolCode));
    }),
    [availableTools, effectiveSelectedToolKeys],
  );

  useEffect(() => {
    if (restorePromptShownRef.current) {
      return;
    }
    restorePromptShownRef.current = true;
    if (!draft) {
      draftReadyRef.current = true;
      return;
    }
    modal.confirm({
      title: '恢复未完成的 Agent 草稿？',
      content: lastSavedAt
        ? `检测到一份未完成的创建草稿，上次保存于 ${new Date(lastSavedAt).toLocaleString()}。`
        : '检测到一份未完成的创建草稿，是否恢复？',
      okText: '恢复草稿',
      cancelText: '从空白开始',
      onOk: () => {
        const restoredDraft = draft as AgentDraftSnapshot & { selectedToolKeys?: string[] };
        step1Form.setFieldsValue(restoredDraft.step1Values);
        setCurrentStep(restoredDraft.currentStep ?? 0);
        setAgentId(restoredDraft.agentId ?? '');
        agentIdRef.current = restoredDraft.agentId ?? '';
        setAgentType(restoredDraft.agentType ?? 'team');
        setAiModelType(restoredDraft.aiModelType ?? 'model');
        setSelectedTemplateCode(restoredDraft.selectedTemplateCode);
        setBindingSourceType(restoredDraft.bindingSourceType ?? 'manual');
        setSelectedToolKeys(new Set(restoredDraft.selectedToolKeys ?? restoredDraft.selectedBuiltinTools ?? []));
        setMembers(restoredDraft.members?.length > 0
          ? restoredDraft.members
          : [{ roleName: 'Lead Agent', roleType: 'lead_agent', quantity: 1 }]);
        setBindings((restoredDraft.bindings ?? []) as BindingEntry[]);
        draftReadyRef.current = true;
      },
      onCancel: () => {
        clearDraft();
        draftReadyRef.current = true;
      },
    });
  }, [clearDraft, draft, lastSavedAt, modal, step1Form]);

  useEffect(() => {
    if (!draftReadyRef.current || !hasDraftContent) {
      return;
    }
    const timer = window.setTimeout(() => {
      const snapshot: AgentDraftSnapshot = {
        currentStep,
        agentId: agentId || undefined,
        agentType,
        aiModelType,
        selectedTemplateCode,
        bindingSourceType,
        selectedBuiltinTools: Array.from(effectiveSelectedToolKeys),
        members,
        bindings: bindings as AgentDraftBinding[],
        step1Values: step1Values ?? {},
      };
      (snapshot as AgentDraftSnapshot & { selectedToolKeys?: string[] }).selectedToolKeys = Array.from(effectiveSelectedToolKeys);
      saveDraft(snapshot);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [
    agentId,
    agentType,
    aiModelType,
    bindingSourceType,
    bindings,
    currentStep,
    effectiveSelectedToolKeys,
    hasDraftContent,
    members,
    saveDraft,
    selectedTemplateCode,
    step1Values,
  ]);

  useBeforeUnload((event) => {
    if (!hasDraftContent) {
      return;
    }
    event.preventDefault();
    event.returnValue = '';
  });

  const blocker = useBlocker(hasDraftContent);

  useEffect(() => {
    if (blocker.state !== 'blocked' || leavePromptShownRef.current) {
      return;
    }
    leavePromptShownRef.current = true;
    modal.confirm({
      title: '离开当前创建向导？',
      content: '草稿已自动保存，离开后可以稍后继续编辑。',
      okText: '离开页面',
      cancelText: '继续编辑',
      onOk: () => {
        leavePromptShownRef.current = false;
        blocker.proceed();
      },
      onCancel: () => {
        leavePromptShownRef.current = false;
        blocker.reset();
      },
    });
  }, [blocker, modal]);

  // ===== 步骤1：提交基本信息，创建 Agent =====
  const handleStep1Next = async () => {
    try {
      const values = await step1Form.validateFields();
      setAgentType(values.agentType);
      setAiModelType(values.aiModelType ?? 'model');

      // 如果已有 agentId，说明是从后续步骤返回的，直接进入下一步
      if (agentIdRef.current || agentId) {
        setCurrentStep(1);
        return;
      }

      const result = await createAgent({
        name: values.name,
        agentType: values.agentType,
        description: values.description,
        aiModel: values.aiModelType === 'model_group' ? undefined : values.aiModel,
        aiModelType: values.aiModelType ?? 'model',
        aiModelGroupId: values.aiModelType === 'model_group' ? values.aiModelGroupId : undefined,
        agentTag: Array.isArray(values.agentTag) ? values.agentTag.join(',') : values.agentTag,
      });
      const newAgentId = result.data.id;
      setAgentId(newAgentId);
      agentIdRef.current = newAgentId;

      if (values.agentType === 'solo') {
        // solo 类型：保存空成员列表，进入步骤2（SoloToolBindingSection）
        await saveTeamMembers({ id: newAgentId, data: { members: [] } });
        setCurrentStep(1);
      } else {
        setCurrentStep(1);
      }
    } catch (err: unknown) {
      // validateFields 抛出的 errorFields 对象表示表单校验失败，inline 已展示错误，不需要 toast
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error(t('agent.create.createFail'));
    }
  };

  // ===== 步骤2：模板选中时自动填充成员 =====
  const handleTemplateChange = (code?: string) => {
    setSelectedTemplateCode(code);
    if (!code) return;
    const template = teamTemplates.find((t) => t.code === code);
    if (!template) return;

    const newMembers: AgentTeamMember[] = [
      // 固定第一行 Lead Agent
      { roleName: 'Lead Agent', roleType: 'lead_agent', quantity: 1 },
      // 过滤掉模板中的 lead_agent，避免重复
      ...template.recommendedRoles
        .filter((r) => r.roleType !== 'lead_agent')
        .map((r) => ({
          roleName: r.roleName,
          roleType: r.roleType,
          quantity: r.quantity,
          modelOverride: undefined,
        })),
    ];
    setMembers(newMembers);
  };

  // ===== 步骤2：成员表格行操作 =====
  const handleMemberChange = <K extends keyof AgentTeamMember>(
    index: number,
    field: K,
    value: AgentTeamMember[K],
  ) => {
    setMembers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddMember = () => {
    setMembers((prev) => [...prev, { roleName: '', roleType: 'member', quantity: 1 }]);
  };

  const handleRemoveMember = (index: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  // ===== 步骤2：保存成员/工具，进入步骤3 =====
  const handleStep2Next = async () => {
    try {
      if (!currentAgentId) {
        message.error(t('agent.create.createFail'));
        return;
      }
      if (agentType === 'solo') {
        if (isLoadingAvailableTools) {
          message.warning('工具列表加载中，请稍后再试');
          return;
        }
        const tools = selectedTools.map((tool, index) => ({
          toolCode: tool.toolCode,
          sourceType: tool.sourceType,
          sourceRefId: tool.sourceRefId,
          enabled: true,
          priority: 100 + index,
        }));
        await saveAgentToolBindingsApi({ id: currentAgentId, data: { tools } });
      } else {
        const hasEmptyRole = members.some((member) => !member.roleName?.trim() || !member.roleType?.trim());
        if (hasEmptyRole) {
          message.warning('团队成员必须填写角色名称和角色类型');
          return;
        }
        const hasLeader = members.some((member) => member.roleType === 'lead_agent');
        if (!hasLeader) {
          message.warning('团队 Agent 至少需要一个 Lead Agent');
          return;
        }
        // Team Agent：保存团队成员
        await saveTeamMembers({
          id: currentAgentId,
          data: {
            workType: selectedTemplateCode ?? '',
            members,
          },
        });
      }
      setCurrentStep(2);
    } catch {
      message.error(
        agentType === 'solo'
          ? t('agent.create.saveToolsFail')
          : t('agent.create.saveMembersFail'),
      );
    }
  };

  // ===== 步骤3：添加手动绑定 =====
  const handleAddManualBinding = async () => {
    try {
      const values = await manualForm.validateFields();
      const result = await createContextBinding({
        id: agentIdRef.current || agentId,
        data: {
          sourceType: 'manual',
          title: values.title,
          content: values.content,
        },
      });
      setBindings((prev) => [
        ...prev,
        {
          key: result.data.id ?? String(Date.now()),
          title: values.title,
          content: values.content,
          sourceType: 'manual',
        },
      ]);
      manualForm.resetFields();
      message.success(t('agent.create.bindingAdded'));
    } catch {
      message.error(t('agent.create.bindingFail'));
    }
  };

  const handleAddGitlabBinding = async (payload: { title: string; sourceConfig: GitLabContextSourceConfig }) => {
    try {
      if (!currentAgentId) {
        message.error(t('agent.create.createFail'));
        return;
      }
      const result = await createContextBinding({
        id: currentAgentId,
        data: {
          sourceType: 'gitlab',
          title: payload.title,
          sourceConfig: payload.sourceConfig,
        },
      });
      setBindings((prev) => [
        ...prev,
        {
          key: result.data.id ?? String(Date.now()),
          title: payload.title,
          content: '',
          sourceType: 'gitlab',
        },
      ]);
      message.success('GitLab 绑定已添加');
    } catch {
      message.error(t('agent.create.bindingFail'));
    }
  };

  const handleToolSelectorConfirm = (tools: AvailableTool[]) => {
    setSelectedToolKeys(new Set(tools.map((tool) => buildToolSelectionKey(tool))));
    setToolSelectorOpen(false);
  };

  // ===== 步骤3：完成配置 =====
  const handleFinish = () => {
    clearDraft();
    message.success(t('agent.create.configSuccess'));
    navigate(`/agent/${agentIdRef.current || agentId}`);
  };

  // ===== 步骤3：跳过绑定 =====
  const handleSkip = () => {
    clearDraft();
    navigate(`/agent/${agentIdRef.current || agentId}`);
  };

  // ===== 成员表格列定义 =====
  const memberColumns = [
    {
      title: t('agent.create.roleName'),
      dataIndex: 'roleName',
      render: (value: string, _: AgentTeamMember, index: number) => (
        <Input
          value={value}
          disabled={index === 0}
          onChange={(e) => handleMemberChange(index, 'roleName', e.target.value)}
          placeholder={t('agent.create.roleNamePlaceholder')}
        />
      ),
    },
    {
      title: t('agent.create.roleType'),
      dataIndex: 'roleType',
      render: (value: string, _: AgentTeamMember, index: number) => (
        <Input
          value={value}
          disabled={index === 0}
          onChange={(e) => handleMemberChange(index, 'roleType', e.target.value)}
          placeholder={t('agent.create.roleTypePlaceholder')}
        />
      ),
    },
    {
      title: t('agent.create.quantity'),
      dataIndex: 'quantity',
      width: 100,
      render: (value: number, _: AgentTeamMember, index: number) => (
        <InputNumber
          min={1}
          value={value}
          disabled={index === 0}
          onChange={(v) => handleMemberChange(index, 'quantity', v ?? 1)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: t('agent.create.assignedModel'),
      dataIndex: 'modelOverride',
      render: (value: string | undefined, _: AgentTeamMember, index: number) => (
        <Select
          allowClear
          value={value}
          style={{ width: '100%' }}
          placeholder={t('agent.create.modelOptional')}
          options={selectableAiModels.map((m) => ({ value: m.name, label: `${m.name}（${formatModelUseCaseLabel(m.useCase)}）` }))}
          onChange={(v) => handleMemberChange(index, 'modelOverride', v)}
        />
      ),
    },
    {
      title: t('common.action'),
      width: 60,
      render: (_: unknown, __: AgentTeamMember, index: number) =>
        index === 0 ? null : (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveMember(index)}
          />
        ),
    },
  ];

  // ===== 步骤1内容 =====
  const renderStep1 = () => (
    <Card
      variant="borderless"
      className="shadow-sm rounded-xl"
      styles={{ body: { padding: screens.md ? '28px 32px' : 20 } }}
    >
      <Form
        form={step1Form}
        layout="vertical"
        initialValues={{ agentType: 'team', aiModelType: 'model' }}
        onValuesChange={(changedValues) => {
          if (changedValues.agentType) {
            setAgentType(changedValues.agentType);
          }
        }}
      >
        <div className="mb-6">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--color-primary)' }}>
            {t('agent.create.basicInfo')}
          </h3>
        </div>

        <Form.Item
          name="name"
          label={t('agent.name')}
          rules={[{ required: true, message: t('agent.namePlaceholder') }]}
        >
          <Input
            size="large"
            placeholder={t('agent.namePlaceholder')}
          />
        </Form.Item>

        <Form.Item
          name="agentType"
          label={t('agent.create.agentType')}
          rules={[{ required: true }]}
        >
          <Select
            size="large"
            options={[
              { value: 'team', label: t('agent.create.teamAgentDesc') },
              { value: 'solo', label: t('agent.create.soloAgentDesc') },
            ]}
          />
        </Form.Item>

        <Form.Item name="description" label={t('agent.create.description')}>
          <TextArea
            rows={4}
            placeholder={t('agent.create.descPlaceholder')}
          />
        </Form.Item>

        <Form.Item name="aiModel" label={t('agent.create.drivingModel')}>
          <div className="space-y-2">
            <Alert
              type="info"
              showIcon
              title="模型绑定说明"
              description="Agent 不允许直接绑定向量模型。绑定单模型时会走“路由规则”页的降级链路；绑定模型组时会按模型组内顺序逐级降级。"
            />
            <Radio.Group
              value={aiModelType}
              onChange={(e) => {
                setAiModelType(e.target.value);
                step1Form.setFieldsValue({ aiModelType: e.target.value });
              }}
            >
              <Radio value="model">单个模型</Radio>
              <Radio value="model_group">模型组（支持自动降级）</Radio>
            </Radio.Group>
            <Form.Item name="aiModelType" hidden>
              <Input />
            </Form.Item>
            {aiModelType === 'model' ? (
              <Form.Item name="aiModel" noStyle>
                <Select
                  size="large"
                  allowClear
                  placeholder={t('agent.create.modelPlaceholder')}
                  options={selectableAiModels.map((m) => ({
                    value: m.name,
                    label: `${m.name}（${formatModelUseCaseLabel(m.useCase)}）`,
                  }))}
                />
              </Form.Item>
            ) : (
              <Form.Item name="aiModelGroupId" noStyle>
                <Select
                  size="large"
                  allowClear
                  placeholder="选择模型组（按优先级自动降级）"
                  options={selectableModelGroups.map((g) => ({
                    value: g.id,
                    label: `${g.name}（${formatModelUseCaseLabel(g.useCase)} / ${g.items.length} 个模型）`,
                  }))}
                />
              </Form.Item>
            )}
          </div>
        </Form.Item>

        <Form.Item name="agentTag" label={t('agent.agentTag')}>
          <Select
            size="large"
            mode="multiple"
            allowClear
            placeholder={t('agent.agentTagPlaceholder')}
            options={agentTagItems.map((item) => ({ value: item.itemValue, label: item.itemLabel }))}
          />
        </Form.Item>
      </Form>

      {/* 底部按钮 */}
      <Divider />
      <div className="flex justify-end">
        <Space>
          <Button size="large" onClick={() => navigate(-1)}>
            {t('common.cancel')}
          </Button>
          <Button
            size="large"
            type="primary"
            loading={isCreating}
            onClick={handleStep1Next}
          >
            {t('agent.create.nextStep')}
          </Button>
        </Space>
      </div>
    </Card>
  );

  // ===== 步骤2内容 =====
  const renderStep2 = () => (
    <Card
      variant="borderless"
      className="shadow-sm rounded-xl"
      styles={{ body: { padding: screens.md ? '28px 32px' : 20 } }}
    >
      {agentType === 'solo' ? (
        <>
          <div className="mb-6">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--color-primary)' }}>
              {t('agent.create.capabilityConfig')}
            </h3>
            <Alert
              type="info"
              icon={<InfoCircleOutlined />}
              showIcon
              title={t('agent.create.soloToolBindingHint')}
              className="mb-4"
            />
          </div>
          {isLoadingAvailableTools ? (
            <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
          ) : (
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div>
                  <Text strong style={{ fontSize: 14 }}>工具选择</Text>
                  <div style={{ color: 'var(--color-text-secondary)', marginTop: 4, fontSize: 13 }}>
                    已选择 {selectedTools.length} 项，可从内置工具、Skill、MCP 中搜索并筛选。
                  </div>
                </div>
                <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => setToolSelectorOpen(true)}>
                  搜索并选择工具
                </Button>
              </div>

              {selectedTools.length === 0 ? (
                <Empty description="暂未选择工具，后续也可以在详情页继续调整。" />
              ) : (
                <Space size={[8, 8]} wrap>
                  {selectedTools.map((tool) => (
                    <Tag
                      key={buildToolSelectionKey(tool)}
                      closable
                      onClose={(event) => {
                        event.preventDefault();
                        setSelectedToolKeys((prev) => {
                          const next = new Set(prev);
                          next.delete(buildToolSelectionKey(tool));
                          return next;
                        });
                      }}
                    >
                      {tool.name || tool.toolCode} [{tool.sourceType}]
                    </Tag>
                  ))}
                </Space>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-6">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--color-primary)' }}>
              {t('agent.create.capabilityConfig')}
            </h3>
          </div>

          {/* 工作类型（模板选择） */}
          <Form layout="vertical">
            <Form.Item label={t('agent.create.workType')}>
              <Select
                size="large"
                allowClear
                value={selectedTemplateCode}
                placeholder={t('agent.create.workTypePlaceholder')}
                options={teamTemplates.map((tpl) => ({ value: tpl.code, label: tpl.name }))}
                onChange={handleTemplateChange}
              />
            </Form.Item>
          </Form>

          {/* 成员表格 */}
          <div className="mb-4">
            <Text type="secondary" className="text-sm">
              {t('agent.create.membersTableDesc')}
            </Text>
          </div>
          <Table
            dataSource={members.map((m, i) => ({ ...m, key: i }))}
            columns={memberColumns}
            pagination={false}
            size="middle"
            bordered
            className="mb-4"
          />

          {/* 添加成员按钮 */}
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddMember}
            className="w-full mb-2"
          >
            {t('agent.create.addMember')}
          </Button>
        </>
      )}

      {/* 底部按钮 */}
      <Divider />
      <div className="flex justify-between">
        <Button size="large" onClick={() => setCurrentStep(0)}>
          {t('agent.create.prevStep')}
        </Button>
        <Button
          size="large"
          type="primary"
          loading={isSavingMembers || isSavingTools}
          onClick={handleStep2Next}
        >
          {t('agent.create.nextStep')}
        </Button>
      </div>
    </Card>
  );

  // ===== 步骤3内容 =====
  const renderStep3 = () => (
    <Card
      variant="borderless"
      className="shadow-sm rounded-xl"
      styles={{ body: { padding: screens.md ? '28px 32px' : 20 } }}
    >
      <div className="mb-6">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
          {t('agent.create.contextBinding')}
        </h3>
        <Alert
          type="warning"
          showIcon
          icon={<InfoCircleOutlined />}
          title={t('agent.create.contextBindingHint')}
          className="mb-4"
        />
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          title={t('agent.create.autoInstructionsHint')}
          className="mb-4"
        />
      </div>

      {/* 绑定类型切换 */}
      <div className="mb-6">
        <Radio.Group
          value={bindingSourceType}
          onChange={(e) => setBindingSourceType(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="manual">{t('agent.create.manualInput')}</Radio.Button>
          <Radio.Button value="context_module">{t('agent.create.fromContext')}</Radio.Button>
          <Radio.Button value="gitlab">{t('agent.create.fromGitlab')}</Radio.Button>
        </Radio.Group>
      </div>

      {/* 手动输入 */}
      {bindingSourceType === 'manual' && (
        <Card
          size="small"
          className="mb-6 bg-gray-50 border-gray-200"
        >
          <Form form={manualForm} layout="vertical">
            <Form.Item
              name="title"
              label={t('agent.create.bindingTitle')}
              rules={[{ required: true, message: t('agent.create.bindingTitleRequired') }]}
            >
              <Input placeholder={t('agent.create.bindingTitlePlaceholder')} />
            </Form.Item>
            <Form.Item
              name="content"
              label={t('agent.create.bindingContent')}
              rules={[{ required: true, message: t('agent.create.bindingContentRequired') }]}
            >
              <TextArea rows={4} placeholder={t('agent.create.bindingContentPlaceholder')} />
            </Form.Item>
            <Button
              type="primary"
              ghost
              icon={<PlusOutlined />}
              loading={isSavingBinding}
              onClick={handleAddManualBinding}
            >
              {t('agent.create.addBinding')}
            </Button>
          </Form>
        </Card>
      )}

      {/* 从上下文模块（开发中） */}
      {bindingSourceType === 'context_module' && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 mb-6">
          <InfoCircleOutlined style={{ fontSize: 40, marginBottom: 12 }} />
          <p className="text-base">{t('agent.create.featureComingSoon')}</p>
        </div>
      )}

      {/* GitLab 导入 */}
      {bindingSourceType === 'gitlab' && (
        <Card
          size="small"
          className="mb-6 bg-gray-50 border-gray-200"
        >
          <GitLabContextPicker loading={isSavingBinding} onAdd={handleAddGitlabBinding} />
        </Card>
      )}

      {/* 已添加绑定列表 */}
      {bindings.length > 0 && (
        <div className="mb-6">
          <Text className="text-sm font-medium block mb-2">
            {t('agent.create.addedBindings')}（{bindings.length}）
          </Text>
          <Space size={[8, 8]} wrap>
            {bindings.map((b) => (
              <Tag
                key={b.key}
                color="blue"
                icon={<CheckCircleOutlined />}
                closable
                onClose={async (e) => {
                  e.preventDefault();
                  try {
                    // 同步删除后端绑定记录
                    await deleteContextBindingApi({ id: agentIdRef.current || agentId, bindingId: b.key });
                    setBindings((prev) => prev.filter((item) => item.key !== b.key));
                  } catch {
                    message.error(t('agent.create.bindingFail'));
                  }
                }}
              >
                {b.title}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* 底部按钮 */}
      <Divider />
      <div className="flex justify-between">
        <Button size="large" onClick={() => setCurrentStep(agentType === 'solo' ? 0 : 1)}>
          {t('agent.create.prevStep')}
        </Button>
        <Space>
          <Button size="large" ghost onClick={handleSkip}>
            {t('agent.create.skipForNow')}
          </Button>
          <Button
            size="large"
            type="primary"
            onClick={handleFinish}
          >
            {t('agent.create.finishConfig')}
          </Button>
        </Space>
      </div>
    </Card>
  );

  return (
    <PageContainer
      title={t('agent.create.title')}
      description={t('agent.create.pageDescription')}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {t('common.back')}
        </Button>
      }
    >
      <div className="mx-auto max-w-7xl">
        <div
          style={{
            display: 'grid',
            gap: 24,
            gridTemplateColumns: screens.xl ? 'minmax(0, 1fr) 320px' : 'minmax(0, 1fr)',
          }}
        >
          <div className="flex flex-col gap-6">
            <Card
              variant="borderless"
              className="shadow-sm rounded-xl"
              styles={{ body: { padding: screens.md ? '26px 30px' : 20 } }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: screens.md ? 'center' : 'flex-start',
                  flexDirection: screens.md ? 'row' : 'column',
                  gap: 16,
                }}
              >
                <div>
                  <Text type="secondary">{t('agent.create.progressOverview')}</Text>
                  <div style={{ fontSize: screens.md ? 28 : 22, fontWeight: 700, marginTop: 6, marginBottom: 8 }}>
                    {stepItems[currentStep].title}
                  </div>
                  <Text type="secondary">{stepItems[currentStep].content}</Text>
                </div>
                <Space size={[8, 8]} wrap>
                  <Tag color="blue">
                    {t('agent.create.stepCounter', { current: currentStep + 1, total: stepItems.length })}
                  </Tag>
                  <Tag color={agentType === 'solo' ? 'geekblue' : 'cyan'}>
                    {agentType === 'solo' ? t('agent.soloAgent') : t('agent.teamAgent')}
                  </Tag>
                  {hasDraftContent && (
                    <Tag color="processing">{draftStatusText}</Tag>
                  )}
                </Space>
              </div>
              <Progress
                percent={progressPercent}
                showInfo={false}
                strokeColor="var(--color-primary)"
                railColor="var(--color-fill-light)"
                style={{ margin: '20px 0 22px' }}
              />
              <Steps
                current={currentStep}
                orientation={screens.md ? 'horizontal' : 'vertical'}
                items={stepItems.map((item) => ({
                  title: item.title,
                  content: item.content,
                }))}
              />
            </Card>

            {currentStep === 0 && renderStep1()}
            {currentStep === 1 && renderStep2()}
            {currentStep === 2 && renderStep3()}
          </div>

          <div
            className="flex flex-col gap-6"
            style={screens.xl ? { position: 'sticky', top: 96, alignSelf: 'start' } : undefined}
          >
            <Card
              variant="borderless"
              className="shadow-sm rounded-xl"
              styles={{ body: { padding: screens.md ? '24px 24px 20px' : 20 } }}
            >
              <Text strong style={{ fontSize: 16 }}>
                {t('agent.create.snapshotTitle')}
              </Text>
              <Descriptions
                column={1}
                colon={false}
                size="small"
                style={{ marginTop: 16 }}
                styles={{
                  label: { width: 108, color: 'var(--color-text-tertiary)' },
                  content: { color: 'var(--color-text-primary)', fontWeight: 500 },
                }}
              >
                <Descriptions.Item label={t('agent.name')}>
                  {step1Values?.name?.trim() || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('agent.create.agentType')}>
                  {agentType === 'solo' ? t('agent.soloAgent') : t('agent.teamAgent')}
                </Descriptions.Item>
                <Descriptions.Item label={t('agent.create.drivingModel')}>
                  {selectedModelLabel || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('agent.create.capabilityConfig')}>
                  {agentType === 'solo'
                    ? t('agent.create.selectedToolsLabel', { count: selectedTools.length })
                    : t('agent.create.memberCount', { count: members.length })}
                </Descriptions.Item>
                <Descriptions.Item label={t('agent.create.contextBinding')}>
                  {t('agent.create.bindingCount', { count: bindings.length })}
                </Descriptions.Item>
              </Descriptions>

              {selectedAgentTagLabels.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                    {t('agent.agentTag')}
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgentTagLabels.map((label) => (
                      <Tag key={label} color="blue">{label}</Tag>
                    ))}
                  </div>
                </div>
              )}

              <Alert
                type="info"
                showIcon
                title={t('agent.create.focusHint')}
                description={currentFocusText}
                style={{ marginTop: 18 }}
              />
            </Card>
          </div>
        </div>
      </div>

      {agentType === 'solo' && currentAgentId && (
        <ToolSelectorModal
          open={toolSelectorOpen}
          agentId={currentAgentId}
          initialSelectedKeys={Array.from(effectiveSelectedToolKeys)}
          allowAlreadyBoundSelection
          onCancel={() => setToolSelectorOpen(false)}
          onConfirm={handleToolSelectorConfirm}
        />
      )}
    </PageContainer>
  );
}

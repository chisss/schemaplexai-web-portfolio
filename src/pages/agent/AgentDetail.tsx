/**
 * Agent 详情页
 * 包含：概览、团队配置、上下文绑定、运行日志、系统配置 五个 Tab
 * configCompleted 守卫：配置未完成时激活按钮禁用
 */
import { useMemo, useState } from 'react';
import {
  Card, Descriptions, Button, Tag, Space, Tabs, Typography,
  Spin, message, Alert, Table, Tooltip, Popconfirm, Badge, Empty,
  Form, Input, InputNumber, Select, Modal, Switch,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TabsProps } from 'antd';
import {
  ArrowLeftOutlined, PlayCircleOutlined, StopOutlined,
  DeleteOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  EditOutlined, PlusOutlined, SaveOutlined, ToolOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import {
  useAgentDetail, useActivateAgent, useDeactivateAgent,
  useTeamMembers, useContextBindings,
  useDeleteTeamMember, useDeleteContextBinding,
  useSaveTeamMembers, useExecutions, useStopExecution, useExecutionDetail,
  useCheckAgentInstructions, useInitAgentInstructions,
  useAgentConfigs, useSaveAgentConfig, useCreateContextBinding,
  useAgentToolBindings, useAvailableTools, useSaveAgentToolBindings,
  useMemberToolBindings, useMemberContextBindings,
  useMemberToolBindingsBatch, useMemberContextBindingsBatch,
  useSaveMemberToolBindings, useSaveMemberContextBindings,
  useDeleteMemberContextBinding,
} from '@/api/agent';
import { useAiModels, useDictItemsByCode, useTeamTemplates } from '@/api/system';
import { formatDateTime } from '@/utils/date';
import { useContextList } from '@/api/context';
import type {
  AgentConfig, AgentTeamMember, AgentContextBinding, AgentExecution, InitInstructionsDTO,
  AgentToolBinding, AvailableTool, MemberContextBindingDTO, MemberToolBindingDTO,
} from '@/types/agent';
import type { Context } from '@/types/context';
import { useAuthStore } from '@/store/useAuthStore';
import { buildToolSelectionKey } from './components/toolSelection';
import MemberToolConfigModal from './components/MemberToolConfigModal';
import MemberContextConfigModal from './components/MemberContextConfigModal';
import ExecutionDetailModal from './components/ExecutionDetailModal';
import AmendmentRulesTab from './components/AmendmentRulesTab';
import AgentMemoryTab from './components/AgentMemoryTab';

const { Text, Paragraph } = Typography;

const getGeneralTemplateDefault = (t: (key: string) => string) => t('agent.generalTemplateDefault');

/** 状态配置：Badge 状态与文字颜色，使用 CSS 变量适配深浅色主题 */
const STATUS_CONFIG: Record<string, {
  color: string;
  labelKey: string;
  badge: 'success' | 'processing' | 'default' | 'error' | 'warning';
}> = {
  active: { color: 'var(--color-success)', labelKey: 'agent.statusActive', badge: 'success' },
  running: { color: 'var(--color-primary)', labelKey: 'agent.statusRunning', badge: 'processing' },
  inactive: { color: 'var(--color-text-tertiary)', labelKey: 'agent.statusInactive', badge: 'default' },
  error: { color: 'var(--color-error)', labelKey: 'agent.statusError', badge: 'error' },
};

const DISABLED_ACTION_BUTTON_STYLE: React.CSSProperties = {
  background: 'var(--color-fill-light)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text-quaternary)',
  boxShadow: 'none',
};

const START_ACTION_BUTTON_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, #165DFF 0%, #0E42D2 100%)',
  border: 'none',
};

const MAX_AGENT_TOOL_BINDINGS = 20;

function buildBindingSelectionKey(binding: Pick<AgentToolBinding, 'sourceType' | 'sourceRefId' | 'toolCode'>) {
  return buildToolSelectionKey({
    sourceType: (binding.sourceType || 'builtin') as AvailableTool['sourceType'],
    sourceRefId: binding.sourceRefId,
    toolCode: binding.toolCode,
  });
}

type ContextBindingRow = Omit<AgentContextBinding, 'sourceType'> & {
  sourceType: string;
  bindingScope: 'agent' | 'member';
};

type ToolBindingRow = AgentToolBinding & {
  bindingScope: 'agent' | 'member';
};

export default function AgentDetail() {
  const { t } = useTranslation();
  const { hasPermission } = useAuthStore();
  const canStatus = hasPermission('agent:status');
  const canConfig = hasPermission('agent:config');

  /** 上下文绑定源类型文本（依赖 t 函数，置于组件内） */
  const SOURCE_TYPE_LABEL: Record<string, string> = {
    manual: t('agent.create.manualInput'),
    context_module: t('agent.create.fromContext'),
    gitlab: 'GitLab',
  };
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  // 团队配置编辑态
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editMembers, setEditMembers] = useState<AgentTeamMember[]>([]);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string | undefined>();
  const [toolBindingsDraft, setToolBindingsDraft] = useState<ToolBindingRow[] | null>(null);
  // 成员工具配置弹窗
  const [memberToolConfig, setMemberToolConfig] = useState<{
    memberId: string;
    memberName: string;
  } | null>(null);
  const [memberContextConfig, setMemberContextConfig] = useState<{
    memberId: string;
    memberName: string;
    memberRoleType: string;
  } | null>(null);

  // 实时获取成员的工具绑定（避免 boundTools 可选字段为空的问题）
  const { data: memberBindings = [] } = useMemberToolBindings(memberToolConfig?.memberId ?? '');
  const { data: memberContextBindings = [] } = useMemberContextBindings(memberContextConfig?.memberId ?? '');

  const { data: agent, isLoading, isError } = useAgentDetail(id!);
  const { data: teamMembers = [] } = useTeamMembers(id!);
  const { data: contextBindings = [] } = useContextBindings(id!);
  const teamMemberIds = useMemo(
    () => teamMembers
      .map((member) => member.id)
      .filter((memberId): memberId is string => !!memberId),
    [teamMembers],
  );
  const {
    data: memberToolBindingsMap = {},
    isLoading: isLoadingMemberToolBindings,
    refetch: refetchMemberToolBindings,
  } = useMemberToolBindingsBatch(teamMemberIds);
  const {
    data: memberContextBindingsMap = {},
    isLoading: isLoadingMemberContextBindings,
    refetch: refetchMemberContextBindings,
  } = useMemberContextBindingsBatch(teamMemberIds);
  const { mutate: activateAgent, isPending: isActivating } = useActivateAgent();
  const { mutate: deactivateAgent, isPending: isDeactivating } = useDeactivateAgent();
  const deleteMember = useDeleteTeamMember();
  const deleteBinding = useDeleteContextBinding();
  const deleteMemberContextBinding = useDeleteMemberContextBinding();
  const { mutateAsync: saveTeamMembersApi, isPending: isSavingMembers } = useSaveTeamMembers();
  const saveMemberToolBindings = useSaveMemberToolBindings();
  const saveMemberContextBindings = useSaveMemberContextBindings();
  const { data: aiModels = [] } = useAiModels();
  const { data: teamTemplates = [] } = useTeamTemplates();
  const { data: agentConfigs = [] } = useAgentConfigs(id!);
  const { data: builtinPositionItems = [] } = useDictItemsByCode('agent_builtin_position');
  const { data: outputFormatItems = [] } = useDictItemsByCode('agent_output_format');
  const { data: toolSourceTypeItems = [] } = useDictItemsByCode('agent_tool_source_type');
  const saveAgentConfig = useSaveAgentConfig();
  const { data: executions } = useExecutions(id!, { page: 1, size: 20 });
  useCheckAgentInstructions(id!);
  const initInstructions = useInitAgentInstructions();
  const [showInitInstructions, setShowInitInstructions] = useState(false);
  const [initTemplate, setInitTemplate] = useState<InitInstructionsDTO['template']>('general');
  const [initContent, setInitContent] = useState(() => getGeneralTemplateDefault(t));
  const [showBindContext, setShowBindContext] = useState(false);
  const [selectedContextId, setSelectedContextId] = useState<string | undefined>();
  const [selectedContextMemberId, setSelectedContextMemberId] = useState<string | undefined>();
  const createContextBinding = useCreateContextBinding();
  const { data: contextListData } = useContextList({ page: 1, size: 100 });
  const stopExecution = useStopExecution();
  const [detailModal, setDetailModal] = useState<{ open: boolean; executionId: string | null }>({
    open: false,
    executionId: null,
  });
  const { data: detailExecution, isLoading: detailLoading } = useExecutionDetail(id!, detailModal.executionId ?? '');
  const { data: agentTools = [], refetch: refetchAgentTools } = useAgentToolBindings(id!);
  const { data: availableTools = [] } = useAvailableTools(id!);
  const saveAgentToolBindings = useSaveAgentToolBindings();
  const memberMap = useMemo(
    () => Object.fromEntries(teamMembers.map((member) => [member.id, member])),
    [teamMembers],
  );
  const toolBindingBaseRows = useMemo<ToolBindingRow[]>(() => {
    const globalRows = agentTools.map((item) => ({
      ...item,
      bindingScope: 'agent' as const,
    }));
    const memberRows = teamMembers.flatMap((member) => {
      const memberId = member.id;
      if (!memberId) {
        return [];
      }
      return (memberToolBindingsMap[memberId] ?? []).map((item) => ({
        ...item,
        memberId,
        memberRoleName: member.roleName,
        memberRoleType: member.roleType,
        bindingScope: 'member' as const,
      }));
    });
    return [...globalRows, ...memberRows];
  }, [agentTools, memberToolBindingsMap, teamMembers]);
  const toolBindings = toolBindingsDraft ?? toolBindingBaseRows;
  const toolSourceOptions = useMemo(
    () => {
      const dictOptions = toolSourceTypeItems
        .filter((item) => item.status === 'active')
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({
          label: item.itemLabel,
          value: item.itemValue,
        }));
      if (dictOptions.length > 0) {
        return dictOptions;
      }
      return [
        { label: t('agent.sourceSkill'), value: 'skill' },
        { label: t('agent.sourceExternalApi'), value: 'api_gateway' },
        { label: t('agent.sourceMcp'), value: 'mcp' },
        { label: t('agent.sourceBuiltin'), value: 'builtin' },
      ];
    },
    [t, toolSourceTypeItems],
  );
  const toolSourceLabelMap = useMemo(
    () => Object.fromEntries(toolSourceOptions.map((item) => [item.value, item.label])),
    [toolSourceOptions],
  );
  const availableToolMap = useMemo(() => {
    const map = new Map<string, AvailableTool>();
    availableTools.forEach((tool) => {
      map.set(buildToolSelectionKey(tool), tool);
    });
    return map;
  }, [availableTools]);
  const availableToolsBySource = useMemo(() => {
    const map = new Map<string, AvailableTool[]>();
    availableTools.forEach((tool) => {
      const current = map.get(tool.sourceType) ?? [];
      current.push(tool);
      map.set(tool.sourceType, current);
    });
    return map;
  }, [availableTools]);
  const selectedBindingKeys = useMemo(
    () => new Set(
      toolBindings
        .filter((item) => item.toolCode && item.sourceType)
        .map((item) => buildBindingSelectionKey(item)),
    ),
    [toolBindings],
  );
  const skillNameMap = useMemo(() => {
    const map = new Map<string, string>();
    availableTools
      .filter((tool) => tool.sourceType === 'skill')
      .forEach((tool) => {
        if (tool.toolCode) {
          map.set(tool.toolCode, tool.name || tool.toolCode);
        }
      });
    return map;
  }, [availableTools]);
  const overviewSkillNames = agent?.skillDisplayNames?.length
    ? agent.skillDisplayNames
    : (agent?.skills ?? []).map((skill) => skillNameMap.get(skill) ?? skill);
  const memberRoleOptions = useMemo(
    () => teamMembers
      .filter((member) => !!member.id)
      .map((member) => ({
        value: member.id!,
        label: member.roleName,
      })),
    [teamMembers],
  );
  const contextBindingRows = useMemo<ContextBindingRow[]>(() => {
    const globalRows = contextBindings.map((item) => ({
      ...item,
      bindingScope: 'agent' as const,
    }));
    const memberRows = teamMembers.flatMap((member) => {
      const memberId = member.id;
      if (!memberId) {
        return [];
      }
      return (memberContextBindingsMap[memberId] ?? []).map((item) => ({
        ...item,
        memberId,
        memberRoleName: member.roleName,
        memberRoleType: member.roleType,
        bindingScope: 'member' as const,
      }));
    });
    return [...globalRows, ...memberRows];
  }, [contextBindings, memberContextBindingsMap, teamMembers]);
  const canAddToolBinding = toolBindings.length < MAX_AGENT_TOOL_BINDINGS;
  const isTeamAgent = agent?.agentType === 'team';

  const getBindingMemberLabel = (binding?: { memberId?: string; memberRoleName?: string; memberRoleType?: string }) => {
    if (!binding?.memberId) {
      return t('agent.allMembers');
    }
    return binding.memberRoleName || memberMap[binding.memberId]?.roleName || binding.memberRoleType || '-';
  };

  const getToolOptionsBySource = (sourceType?: string, binding?: ToolBindingRow) => {
    if (!sourceType) {
      return [];
    }
    const currentKey = binding?.toolCode ? buildBindingSelectionKey(binding) : undefined;
    const baseOptions = (availableToolsBySource.get(sourceType) ?? []).map((tool) => {
      const key = buildToolSelectionKey(tool);
      const duplicated = toolBindings.some((item) =>
        item.memberId === binding?.memberId
        && item.sourceType === tool.sourceType
        && (item.sourceRefId ?? '') === (tool.sourceRefId ?? '')
        && item.toolCode === tool.toolCode
        && buildBindingSelectionKey(item) !== currentKey);
      return {
        label: tool.name || tool.toolCode,
        value: key,
        disabled: duplicated || (binding?.memberId ? false : (selectedBindingKeys.has(key) && key !== currentKey)),
      };
    });
    if (!binding?.toolCode || !currentKey || baseOptions.some((item) => item.value === currentKey)) {
      return baseOptions;
    }
    return [
      {
        label: binding.toolCode,
        value: currentKey,
      },
      ...baseOptions,
    ];
  };

  const handleActivate = () => {
    activateAgent(id!, {
      onSuccess: () => message.success(t('agent.startSuccess')),
      onError: () => message.error(t('agent.startFail')),
    });
  };

  const handleDeactivate = () => {
    deactivateAgent(id!, {
      onSuccess: () => message.success(t('agent.stopSuccess')),
      onError: () => message.error(t('agent.stopFail')),
    });
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      await deleteMember.mutateAsync({ id: id!, memberId });
      message.success(t('common.deleteSuccess'));
    } catch {
      // 错误已在拦截器处理
    }
  };

  const handleDeleteBinding = async (binding: ContextBindingRow) => {
    if (!binding.id) {
      return;
    }
    try {
      if (binding.memberId) {
        await deleteMemberContextBinding.mutateAsync({ memberId: binding.memberId, bindingId: binding.id });
        await refetchMemberContextBindings();
      } else {
        await deleteBinding.mutateAsync({ id: id!, bindingId: binding.id });
      }
      message.success(t('common.deleteSuccess'));
    } catch {
      // 错误已在拦截器处理
    }
  };

  const handleBindContext = async () => {
    if (!selectedContextId) {
      message.warning(t('agent.selectContextToBind'));
      return;
    }
    if (selectedContextMemberId && isLoadingMemberContextBindings) {
      message.warning(t('common.loading'));
      return;
    }
    if (!selectedContextMemberId && contextBindings.length >= 5) {
      message.warning(t('agent.maxContextBindings'));
      return;
    }
    const ctx = (contextListData?.records ?? []).find((c: Context) => c.id === selectedContextId);
    try {
      if (selectedContextMemberId) {
        const memberBindings = memberContextBindingsMap[selectedContextMemberId] ?? [];
        const payload: MemberContextBindingDTO[] = [
          ...memberBindings.map((item, index) => ({
            contextId: item.contextId,
            sourceType: item.sourceType,
            sourceConfig: item.sourceConfig,
            content: item.content,
            title: item.title,
            sortOrder: item.sortOrder ?? index,
          })),
          {
            contextId: selectedContextId,
            sourceType: 'context_module',
            title: ctx?.name,
            sortOrder: memberBindings.length,
          },
        ];
        await saveMemberContextBindings.mutateAsync({
          memberId: selectedContextMemberId,
          data: payload,
        });
        await refetchMemberContextBindings();
      } else {
        await createContextBinding.mutateAsync({
          id: id!,
          data: { contextId: selectedContextId, sourceType: 'context_module', title: ctx?.name },
        });
      }
      message.success(t('agent.contextBindSuccess'));
      setShowBindContext(false);
      setSelectedContextId(undefined);
      setSelectedContextMemberId(undefined);
    } catch {
      // 错误已在拦截器处理
    }
  };

  // --- 团队编辑相关 ---
  const handleEnterEditTeam = () => {
    // 进入编辑态时复制当前成员列表
    setEditMembers(teamMembers.map((m) => ({ ...m })));
    setSelectedTemplateCode(agent?.workType || undefined);
    setIsEditingTeam(true);
  };

  const applyTemplateMembers = (code?: string) => {
    setSelectedTemplateCode(code);
    if (!code) {
      return;
    }
    const template = teamTemplates.find((item) => item.code === code);
    if (!template) {
      return;
    }
    setEditMembers([
      { roleName: 'Lead Agent', roleType: 'lead_agent', quantity: 1 },
      ...template.recommendedRoles
        .filter((role) => role.roleType !== 'lead_agent')
        .map((role) => ({
          roleName: role.roleName,
          roleType: role.roleType,
          quantity: role.quantity,
          description: role.description,
        })),
    ]);
  };

  const handleEditMemberChange = <K extends keyof AgentTeamMember>(
    index: number,
    field: K,
    value: AgentTeamMember[K],
  ) => {
    setEditMembers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddEditMember = () => {
    setEditMembers((prev) => [...prev, { roleName: '', roleType: 'member', quantity: 1 }]);
  };

  const handleRemoveEditMember = (index: number) => {
    setEditMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveTeamMembers = async () => {
    const leaderCount = editMembers.filter((member) => member.roleType === 'lead_agent').length;
    if (leaderCount !== 1) {
      message.warning('Team Agent 必须且只能配置一个 Leader 角色');
      return;
    }
    try {
      await saveTeamMembersApi({
        id: id!,
        data: {
          workType: selectedTemplateCode ?? '',
          members: editMembers,
        },
      });
      message.success(t('agent.create.saveMembersSuccess'));
      setIsEditingTeam(false);
    } catch {
      message.error(t('agent.create.saveMembersFail'));
    }
  };

  const handleAddToolBinding = () => {
    if (isTeamAgent && isLoadingMemberToolBindings) {
      message.warning(t('common.loading'));
      return;
    }
    if (!canAddToolBinding) {
      message.warning(t('agent.maxToolBindings', { count: MAX_AGENT_TOOL_BINDINGS }));
      return;
    }
    const defaultSourceType = toolSourceOptions[0]?.value ?? 'skill';
    setToolBindingsDraft((prev) => [
      ...(prev ?? toolBindingBaseRows.map((item) => ({ ...item }))),
      {
        toolCode: '',
        sourceType: defaultSourceType,
        sourceRefId: undefined,
        memberId: undefined,
        memberRoleName: undefined,
        memberRoleType: undefined,
        bindingScope: 'agent',
        enabled: true,
        priority: 100,
      },
    ]);
  };

  const handleToolBindingChange = <K extends keyof ToolBindingRow>(
    index: number,
    key: K,
    value: ToolBindingRow[K],
  ) => {
    setToolBindingsDraft((prev) => {
      const next = [...(prev ?? toolBindingBaseRows.map((item) => ({ ...item })))];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleToolBindingSourceChange = (index: number, sourceType: string) => {
    setToolBindingsDraft((prev) => {
      const next = [...(prev ?? toolBindingBaseRows.map((item) => ({ ...item })))];
      next[index] = {
        ...next[index],
        sourceType,
        toolCode: '',
        sourceRefId: undefined,
      };
      return next;
    });
  };

  const handleToolBindingToolChange = (index: number, selectionKey?: string) => {
    setToolBindingsDraft((prev) => {
      const next = [...(prev ?? toolBindingBaseRows.map((item) => ({ ...item })))];
      const selectedTool = selectionKey ? availableToolMap.get(selectionKey) : undefined;
      next[index] = {
        ...next[index],
        sourceType: selectedTool?.sourceType ?? next[index]?.sourceType,
        toolCode: selectedTool?.toolCode ?? '',
        sourceRefId: selectedTool?.sourceRefId,
      };
      return next;
    });
  };

  const handleToolBindingMemberChange = (index: number, memberId?: string) => {
    setToolBindingsDraft((prev) => {
      const next = [...(prev ?? toolBindingBaseRows.map((item) => ({ ...item })))];
      const member = memberId ? memberMap[memberId] : undefined;
      next[index] = {
        ...next[index],
        memberId,
        memberRoleName: member?.roleName,
        memberRoleType: member?.roleType,
        bindingScope: memberId ? 'member' : 'agent',
      };
      return next;
    });
  };

  const handleRemoveToolBinding = (index: number) => {
    setToolBindingsDraft((prev) => (prev ?? toolBindingBaseRows).filter((_, i) => i !== index));
  };

  const handleSaveToolBindings = async () => {
    if (isTeamAgent && isLoadingMemberToolBindings) {
      message.warning(t('common.loading'));
      return;
    }
    const normalizedRows = toolBindings
      .filter((item) => item.toolCode && item.sourceType)
      .map((item) => ({
        ...item,
        toolCode: item.toolCode.trim(),
        sourceType: item.sourceType,
        sourceRefId: item.sourceRefId || undefined,
        enabled: item.enabled ?? true,
        priority: item.priority ?? 100,
      }));

    if (normalizedRows.length > MAX_AGENT_TOOL_BINDINGS) {
      message.warning(t('agent.maxToolBindings', { count: MAX_AGENT_TOOL_BINDINGS }));
      return;
    }

    try {
      const globalTools = Array.from(new Map(normalizedRows
        .filter((item) => !item.memberId)
        .map((item) => ({
          toolCode: item.toolCode,
          sourceType: item.sourceType,
          sourceRefId: item.sourceRefId,
          enabled: item.enabled,
          priority: item.priority,
          configOverride: item.configOverride,
        }))
        .map((item) => [`${item.sourceType}|${item.sourceRefId ?? ''}|${item.toolCode.toLowerCase()}`, item]))
        .values());
      await saveAgentToolBindings.mutateAsync({
        id: id!,
        data: { tools: globalTools },
      });

      await Promise.all(teamMemberIds.map(async (memberId) => {
        const memberTools = Array.from(new Map(normalizedRows
          .filter((item) => item.memberId === memberId)
          .map((item) => ({
            toolCode: item.toolCode,
            sourceType: item.sourceType,
            sourceRefId: item.sourceRefId,
            enabled: item.enabled,
            priority: item.priority,
            configOverride: item.configOverride,
          } satisfies MemberToolBindingDTO))
          .map((item) => [`${item.sourceType}|${item.sourceRefId ?? ''}|${item.toolCode.toLowerCase()}`, item]))
          .values());
        await saveMemberToolBindings.mutateAsync({
          memberId,
          data: memberTools,
        });
      }));

      setToolBindingsDraft(null);
      await Promise.all([refetchAgentTools(), refetchMemberToolBindings()]);
      message.success(t('agent.toolBindingUpdated'));
    } catch {
      // 统一拦截器处理
    }
  };

  // --- 加载中 ---
  if (isLoading) {
    return (
      <PageContainer title={t('agent.detailTitle')}>
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  // --- 加载失败 ---
  if (isError || !agent) {
    return (
      <PageContainer
        title={t('agent.detailTitle')}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            {t('common.back')}
          </Button>
        }
      >
        <Alert type="error" title={t('agent.loadFail')} showIcon />
      </PageContainer>
    );
  }

  const statusCfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.inactive;
  const canActivate = !!agent.configCompleted;
  const isRunning = agent.status === 'running' || agent.status === 'active';

  // --- 团队成员列定义 ---
  const memberColumns: ColumnsType<AgentTeamMember> = [
    {
      title: t('agent.create.roleName'),
      dataIndex: 'roleName',
      key: 'roleName',
      width: 150,
      render: (v, record) => (
        <Space>
          {record.roleType === 'lead_agent' && <Tag color="gold" style={{ marginRight: 0 }}>{t('agent.teamLeadTag')}</Tag>}
          <span className="font-medium">{v}</span>
        </Space>
      ),
    },
    {
      title: t('agent.create.roleType'),
      dataIndex: 'roleType',
      key: 'roleType',
      width: 100,
      render: (v) => <Tag color={v === 'lead_agent' ? 'gold' : 'default'}>{v}</Tag>,
    },
    {
      title: t('agent.create.memberQuantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center',
    },
    {
      title: t('agent.create.memberModel'),
      dataIndex: 'modelOverride',
      key: 'modelOverride',
      width: 180,
      render: (v) => v ? <Tag color="geekblue">{v}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: t('agent.memberTools.tools'),
      key: 'boundTools',
      width: 160,
      render: (_: unknown, record: AgentTeamMember) => {
        if (!record.id) return null;
        if (record.boundToolCount && record.boundToolCount > 0) {
          return <Tag color="blue">{t('agent.memberTools.toolsCount', { count: record.boundToolCount })}</Tag>;
        }
        return <Tag color="secondary">{t('agent.memberTools.noTools')}</Tag>;
      },
    },
    {
      title: t('agent.memberContexts.contexts'),
      key: 'boundContexts',
      width: 180,
      render: (_: unknown, record: AgentTeamMember) => {
        if (record.boundContextCount && record.boundContextCount > 0) {
          return <Tag color="cyan">{t('agent.memberContexts.contextCount', { count: record.boundContextCount })}</Tag>;
        }
        return <Tag>{t('agent.memberContexts.noContexts')}</Tag>;
      },
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 220,
      align: 'center' as const,
      render: (_: unknown, record: AgentTeamMember) => (
        !record.id ? null : (
          <Space size={4}>
            <Button
              type="link"
              size="small"
              onClick={() =>
                setMemberToolConfig({
                  memberId: record.id!,
                  memberName: record.roleName,
                })
              }
            >
              {t('agent.memberTools.configureTools')}
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() =>
                setMemberContextConfig({
                  memberId: record.id!,
                  memberName: record.roleName,
                  memberRoleType: record.roleType,
                })
              }
            >
              {t('agent.memberContexts.configureContexts')}
            </Button>
            {record.roleType !== 'lead_agent' && (
              <Popconfirm
                title={t('agent.deleteTeamMemberConfirm')}
                onConfirm={() => handleDeleteMember(record.id!)}
                okButtonProps={{ danger: true }}
                okText={t('common.delete')}
                cancelText={t('common.cancel')}
              >
                <Button type="link" danger size="small" icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        )
      ),
    },
  ];

  // --- 上下文绑定列定义 ---
  const bindingColumns: ColumnsType<ContextBindingRow> = [
    {
      title: t('agent.bindingTitle'),
      dataIndex: 'title',
      key: 'title',
      width: 160,
      render: (v) => v || <Text type="secondary">-</Text>,
    },
    ...(isTeamAgent ? [{
      title: t('agent.boundMemberRole'),
      dataIndex: 'memberRoleName',
      key: 'memberRoleName',
      width: 160,
      render: (_: unknown, record: ContextBindingRow) => (
        <Tag color={record.memberId ? 'blue' : 'default'}>
          {getBindingMemberLabel(record)}
        </Tag>
      ),
    }] : []),
    {
      title: t('agent.bindingType'),
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 120,
      render: (v) => (
        <Tag color={v === 'manual' ? 'default' : v === 'context_module' ? 'blue' : 'purple'}>
          {SOURCE_TYPE_LABEL[v] ?? v}
        </Tag>
      ),
    },
    {
      title: t('agent.contentPreview'),
      dataIndex: 'content',
      key: 'content',
      render: (v) => v ? (
        <Paragraph
          ellipsis={{ rows: 1 }}
          style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}
        >
          {v}
        </Paragraph>
      ) : <Text type="secondary">-</Text>,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v) => v ? (
        <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag>
      ) : '-',
    },
    {
      title: t('common.createTime'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v) => v ? formatDateTime(v) : '-',
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 80,
      align: 'center' as const,
      render: (_: unknown, record: ContextBindingRow) => (
        <Popconfirm
          title={t('agent.deleteContextBindingConfirm')}
          onConfirm={() => handleDeleteBinding(record)}
          okButtonProps={{ danger: true }}
          okText={t('common.delete')}
          cancelText={t('common.cancel')}
        >
          <Button type="link" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  // --- Tab 配置 ---
  const tabItems: TabsProps['items'] = [
    {
      key: 'overview',
      label: t('agent.overview'),
      children: (
        <Card variant="borderless" className="shadow-sm">
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Agent ID" span={2}>
              <Text code copyable>{agent.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('common.name')}>{agent.name}</Descriptions.Item>
            <Descriptions.Item label={t('agent.type')}>
              <Tag color={agent.agentType === 'team' ? 'blue' : 'purple'}>
                {agent.agentType === 'team' ? t('agent.teamAgent') : t('agent.soloAgent')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('common.status')}>
              <Badge status={statusCfg.badge} text={
                <span style={{ color: statusCfg.color, fontWeight: 500 }}>{t(statusCfg.labelKey)}</span>
              } />
            </Descriptions.Item>
            <Descriptions.Item label={t('agent.create.workType')}>
              {agent.workType ? <Tag>{agent.templateName ?? agent.workType}</Tag> : <Text type="secondary">-</Text>}
            </Descriptions.Item>
            <Descriptions.Item label={t('agent.model')}>
              {agent.aiModel
                ? <Tag color="geekblue">{agent.aiModel}</Tag>
                : <Text type="secondary">-</Text>}
            </Descriptions.Item>
            <Descriptions.Item label={t('agent.configStatus')}>
              {agent.configCompleted
                ? <Tag icon={<CheckCircleOutlined />} color="success">{t('agent.configCompleted')}</Tag>
                : <Tag icon={<ExclamationCircleOutlined />} color="warning">{t('agent.configPending')}</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label={t('common.createTime')}>
              {formatDateTime(agent.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label={t('common.updateTime')}>
              {formatDateTime(agent.updatedAt)}
            </Descriptions.Item>
            {overviewSkillNames.length > 0 && (
              <Descriptions.Item label={t('agent.skills')} span={2}>
                <Space wrap>
                  {overviewSkillNames.map((skill) => <Tag key={skill}>{skill}</Tag>)}
                </Space>
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t('common.description')} span={2}>
              {agent.description || <Text type="secondary">{t('common.noDescription')}</Text>}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'team',
      label: t('agent.teamConfiguration'),
      children: (
        <Card
          variant="borderless"
          className="shadow-sm"
          extra={
            agent.agentType === 'team' && !isEditingTeam && canConfig && (
              <Space>
                {teamMembers.length === 0 && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleEnterEditTeam}
                  >
                    {t('agent.create.selectTemplate')}
                  </Button>
                )}
                <Button
                  icon={<EditOutlined />}
                  onClick={handleEnterEditTeam}
                >
                  {t('agent.editTeamConfig')}
                </Button>
              </Space>
            )
          }
        >
          {agent.agentType !== 'team' ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<Text type="secondary">{t('agent.create.soloNoTeam')}</Text>}
            />
          ) : isEditingTeam ? (
            <>
              <Form layout="vertical" className="mb-4">
                <Form.Item
                  label={t('agent.create.workType')}
                  extra={t('agent.create.templatePlaceholder')}
                >
                  <Select
                    allowClear
                    value={selectedTemplateCode}
                    placeholder={t('agent.create.workTypePlaceholder')}
                    options={teamTemplates.map((tpl) => ({ value: tpl.code, label: tpl.name }))}
                    onChange={applyTemplateMembers}
                  />
                </Form.Item>
              </Form>
              {/* 编辑态：可编辑成员表格 */}
              <Table
                dataSource={editMembers.map((m, i) => ({ ...m, key: i }))}
                rowKey="key"
                pagination={false}
                size="small"
                bordered
                className="mb-4"
                columns={[
                  {
                    title: t('agent.create.roleName'),
                    dataIndex: 'roleName',
                    render: (value: string, _: AgentTeamMember, index: number) => (
                      <Input
                        value={value}
                        disabled={editMembers[index]?.roleType === 'lead_agent'}
                        onChange={(e) => handleEditMemberChange(index, 'roleName', e.target.value)}
                        placeholder={t('agent.create.roleName')}
                      />
                    ),
                  },
                  {
                    title: t('agent.create.roleType'),
                    dataIndex: 'roleType',
                    width: 140,
                    render: (value: string, _: AgentTeamMember, index: number) => (
                      <Input
                        value={value}
                        disabled={editMembers[index]?.roleType === 'lead_agent'}
                        onChange={(e) => handleEditMemberChange(index, 'roleType', e.target.value)}
                        placeholder={t('agent.create.roleType')}
                      />
                    ),
                  },
                  {
                    title: t('agent.create.memberQuantity'),
                    dataIndex: 'quantity',
                    width: 90,
                    render: (value: number, _: AgentTeamMember, index: number) => (
                      <InputNumber
                        min={1}
                        value={value}
                        disabled={editMembers[index]?.roleType === 'lead_agent'}
                        onChange={(v) => handleEditMemberChange(index, 'quantity', v ?? 1)}
                        style={{ width: '100%' }}
                      />
                    ),
                  },
                  {
                    title: t('agent.create.memberModel'),
                    dataIndex: 'modelOverride',
                    render: (value: string | undefined, _: AgentTeamMember, index: number) => (
                      <Select
                        allowClear
                        value={value}
                        style={{ width: '100%' }}
                        placeholder={t('agent.create.memberModel')}
                        options={aiModels.map((m) => ({ value: m.name, label: m.name }))}
                        onChange={(v) => handleEditMemberChange(index, 'modelOverride', v)}
                      />
                    ),
                  },
                  {
                    title: t('common.actions'),
                    width: 60,
                    align: 'center' as const,
                    render: (_: unknown, record: AgentTeamMember, index: number) =>
                      record.roleType === 'lead_agent' ? null : (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveEditMember(index)}
                        />
                      ),
                  },
                ]}
              />
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddEditMember}
                className="w-full mb-4"
              >
                {t('agent.create.addMember')}
              </Button>
              <Space>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={isSavingMembers}
                  onClick={handleSaveTeamMembers}
                >
                  {t('agent.saveTeamConfig')}
                </Button>
                <Button onClick={() => setIsEditingTeam(false)}>{t('common.cancel')}</Button>
              </Space>
            </>
          ) : (
            <Table
              columns={memberColumns}
              dataSource={teamMembers}
              rowKey={(r) => r.id ?? r.roleName}
              pagination={false}
              size="small"
              locale={{
                emptyText: (
                  <Space direction="vertical" size={12} style={{ alignItems: 'center' }}>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={<Text type="secondary">{t('agent.noTeamMemberHint')}</Text>}
                    />
                    {canConfig && (
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleEnterEditTeam}>
                        {t('agent.create.selectTemplate')}
                      </Button>
                    )}
                  </Space>
                ),
              }}
            />
          )}
        </Card>
      ),
    },
    {
      key: 'context-bindings',
      label:  t('agent.contextBinding'),
      children: (
        <Card variant="borderless" className="shadow-sm">
          {isTeamAgent && (
            <Alert
              type="info"
              showIcon
              className="mb-4"
              title={t('agent.memberScopedContextTipTitle')}
              description={t('agent.memberScopedContextTip')}
            />
          )}
          <div className="mb-3 flex justify-end">
            <Tooltip title={!isTeamAgent && contextBindings.length >= 5 ? t('agent.maxContextBindings') : undefined}>
              <Button
                icon={<PlusOutlined />}
                onClick={() => setShowBindContext(true)}
                disabled={!isTeamAgent && contextBindings.length >= 5}
              >
                {t('agent.bindContext')}
              </Button>
            </Tooltip>
          </div>
          <Table
            columns={bindingColumns}
            dataSource={contextBindingRows}
            rowKey={(r) => `${r.bindingScope}-${r.memberId ?? 'agent'}-${r.id ?? String(r.sortOrder)}`}
            pagination={false}
            size="small"
            loading={isTeamAgent && isLoadingMemberContextBindings}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<Text type="secondary">{t('agent.noContextBindingHint')}</Text>}
                />
              ),
            }}
          />
        </Card>
      ),
    },
    {
      key: 'logs',
      label: t('agent.runLogs'),
      children: (
        <Card variant="borderless" className="shadow-sm">
          <Table<AgentExecution>
            rowKey="executionId"
            size="small"
            pagination={false}
            dataSource={executions?.records ?? []}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<Text type="secondary">{t('agent.noExecutionRecord')}</Text>}
                />
              ),
            }}
            columns={[
              {
                title: t('agent.executionId'),
                dataIndex: 'executionId',
                key: 'executionId',
                width: 300,
                render: (v: string) => <Text code copyable={{ text: v }} style={{ wordBreak: 'break-all' }}>{v}</Text>,
              },
              {
                title: t('common.status'),
                dataIndex: 'status',
                key: 'status',
                width: 100,
                render: (v: string) => {
                  const colorMap: Record<string, string> = {
                    queued: 'default', running: 'processing',
                    completed: 'success', failed: 'error', stopped: 'warning', paused: 'warning',
                  };
                  return <Tag color={colorMap[v] ?? 'default'}>{v}</Tag>;
                },
              },
              {
                title: t('agent.executionModel'),
                dataIndex: 'model',
                key: 'model',
                width: 160,
                render: (v: string) => v ? <Tag color="geekblue">{v}</Tag> : '-',
              },
              {
                title: t('agent.executionTokenInOut'),
                key: 'tokens',
                width: 120,
                render: (_: unknown, r: AgentExecution) =>
                  `${r.tokenInput ?? 0} / ${r.tokenOutput ?? 0}`,
              },
              {
                title: t('agent.executionSubmitTime'),
                dataIndex: 'createdAt',
                key: 'createdAt',
                width: 160,
                render: (v: string) => v ? formatDateTime(v) : '-',
              },
              {
                title: t('agent.executionEndTime'),
                dataIndex: 'completedAt',
                key: 'completedAt',
                width: 160,
                render: (v: string) => v ? formatDateTime(v) : '-',
              },
              {
                title: t('common.actions'),
                key: 'action',
                width: 140,
                render: (_: unknown, r: AgentExecution) => (
                  <Space size={4}>
                    {(r.status === 'queued' || r.status === 'running') ? (
                      <Popconfirm
                        title={t('agent.stopExecutionConfirm')}
                        onConfirm={() => stopExecution.mutate({ id: id!, execId: r.executionId })}
                        okButtonProps={{ danger: true }}
                        okText={t('agent.stop')}
                        cancelText={t('common.cancel')}
                      >
                        <Button type="link" danger size="small">{t('agent.stop')}</Button>
                      </Popconfirm>
                    ) : null}
                    <Button
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => setDetailModal({ open: true, executionId: r.executionId })}
                    >
                      {t('agent.viewDetail')}
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      ),
    },
    {
      key: 'tools',
      label: (
        <Space size={6}>
          <ToolOutlined />
          <span>{t('agent.toolsAndCapabilities')}</span>
        </Space>
      ),
      children: (
        <Card
          variant="borderless"
          className="shadow-sm"
          extra={
            <Space>
              <Button onClick={() => navigate('/integration/marketplace')}>{t('marketplace.title')}</Button>
              <Tooltip title={!canAddToolBinding ? t('agent.maxToolBindings', { count: MAX_AGENT_TOOL_BINDINGS }) : undefined}>
                <Button
                  icon={<PlusOutlined />}
                  onClick={handleAddToolBinding}
                  disabled={!canAddToolBinding || (isTeamAgent && isLoadingMemberToolBindings)}
                >
                  {t('agent.addBinding')}
                </Button>
              </Tooltip>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saveAgentToolBindings.isPending || saveMemberToolBindings.isPending}
                disabled={isTeamAgent && isLoadingMemberToolBindings}
                onClick={handleSaveToolBindings}
              >
                {t('common.save')}
              </Button>
            </Space>
          }
        >
          <Alert
            type="info"
            showIcon
            className="mb-4"
            title={isTeamAgent ? t('agent.memberScopedToolTipTitle') : t('agent.toolsetTip')}
            description={isTeamAgent ? t('agent.memberScopedToolTip') : undefined}
          />
          <Table<ToolBindingRow>
            rowKey={(record, index) => record.id ?? `${record.memberId ?? 'agent'}-${record.toolCode}-${index}`}
            size="small"
            pagination={false}
            dataSource={toolBindings}
            loading={isTeamAgent && isLoadingMemberToolBindings}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<Text type="secondary">{t('agent.noToolBinding')}</Text>}
                />
              ),
            }}
            columns={[
              ...(isTeamAgent ? [{
                title: t('agent.boundMemberRole'),
                dataIndex: 'memberRoleName',
                key: 'memberRoleName',
                width: 160,
                render: (_: unknown, record: ToolBindingRow, index: number) => (
                  <Select
                    allowClear
                    value={record.memberId}
                    style={{ width: '100%' }}
                    placeholder={t('agent.allMembers')}
                    options={memberRoleOptions}
                    onChange={(value) => handleToolBindingMemberChange(index, value)}
                  />
                ),
              }] : []),
              {
                title: t('agent.sourceType'),
                dataIndex: 'sourceType',
                key: 'sourceType',
                width: 130,
                render: (value: string, _: ToolBindingRow, index: number) => (
                  <Select
                    value={value}
                    style={{ width: '100%' }}
                    options={toolSourceOptions}
                    onChange={(v) => handleToolBindingSourceChange(index, v)}
                  />
                ),
              },
              {
                title: t('agent.toolName'),
                key: 'toolName',
                render: (_: unknown, record: ToolBindingRow, index: number) => (
                  <Select
                    showSearch
                    allowClear
                    value={record.toolCode ? buildBindingSelectionKey(record) : undefined}
                    style={{ width: '100%' }}
                    placeholder={record.sourceType ? t('agent.selectToolPlaceholder') : t('agent.selectSourceFirst')}
                    optionFilterProp="label"
                    options={getToolOptionsBySource(record.sourceType, record)}
                    onChange={(value) => handleToolBindingToolChange(index, value)}
                    disabled={!record.sourceType}
                  />
                ),
              },
              {
                title: t('agent.toolCode'),
                dataIndex: 'toolCode',
                key: 'toolCode',
                width: 180,
                responsive: ['lg'],
                render: (value: string, record: ToolBindingRow) => (
                  <Input
                    size="small"
                    value={value}
                    readOnly
                    disabled
                    placeholder={toolSourceLabelMap[record.sourceType] ?? t('agent.toolCodePlaceholder')}
                  />
                ),
              },
              {
                title: t('agent.priority'),
                dataIndex: 'priority',
                key: 'priority',
                width: 120,
                render: (value: number, _: ToolBindingRow, index: number) => (
                  <InputNumber
                    min={1}
                    style={{ width: '100%' }}
                    value={value ?? 100}
                    onChange={(v) => handleToolBindingChange(index, 'priority', v ?? 100)}
                  />
                ),
              },
              {
                title: t('common.enable'),
                dataIndex: 'enabled',
                key: 'enabled',
                width: 100,
                align: 'center' as const,
                render: (value: boolean, _: ToolBindingRow, index: number) => (
                  <Switch
                    checked={value ?? true}
                    onChange={(v) => handleToolBindingChange(index, 'enabled', v)}
                  />
                ),
              },
              {
                title: t('common.actions'),
                key: 'action',
                width: 80,
                align: 'center' as const,
                render: (_: unknown, __: ToolBindingRow, index: number) => (
                  <Button
                    type="link"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveToolBinding(index)}
                  />
                ),
              },
            ]}
          />
        </Card>
      ),
    },
    {
      key: 'config',
      label: t('agent.config'),
      children: (() => {
        const isBuiltinCfg = agentConfigs.find((c: AgentConfig) => c.configKey === 'is_builtin');
        const builtinPositionCfg = agentConfigs.find((c: AgentConfig) => c.configKey === 'builtin_position');
        const outputFormatCfg = agentConfigs.find((c: AgentConfig) => c.configKey === 'output_format');
        const isBuiltin = isBuiltinCfg?.configValue?.toLowerCase() === 'true';
        const builtinPositions = builtinPositionCfg?.configValue
          ? builtinPositionCfg.configValue.split(',').map((v: string) => v.trim()).filter(Boolean)
          : [];
        const outputFormat = outputFormatCfg?.configValue || undefined;

        const handleSaveBuiltin = async (value: boolean) => {
          await saveAgentConfig.mutateAsync({
            id: id!,
            data: { configKey: 'is_builtin', configValue: String(value) },
          });
          message.success(t('common.updateSuccess'));
        };

        const handleSaveBuiltinPosition = async (values: string[]) => {
          await saveAgentConfig.mutateAsync({
            id: id!,
            data: { configKey: 'builtin_position', configValue: values.join(',') },
          });
          message.success(t('common.updateSuccess'));
        };

        const handleSaveOutputFormat = async (value?: string) => {
          await saveAgentConfig.mutateAsync({
            id: id!,
            data: { configKey: 'output_format', configValue: value || '' },
          });
          message.success(t('common.updateSuccess'));
        };

        return (
          <Card variant="borderless" className="shadow-sm">
            <Form layout="vertical">
              <Form.Item label={t('agent.outputFormat')} help={t('agent.outputFormatHelp')}>
                <Select
                  allowClear
                  style={{ maxWidth: 480 }}
                  value={outputFormat}
                  loading={saveAgentConfig.isPending}
                  placeholder={t('agent.outputFormatPlaceholder')}
                  options={outputFormatItems
                    .filter((item) => item.status === 'active')
                    .map((item) => ({
                      value: item.itemValue,
                      label: item.itemLabel,
                    }))}
                  onChange={handleSaveOutputFormat}
                />
              </Form.Item>
              <Form.Item label={t('agent.isBuiltin')} help={t('agent.isBuiltinHelp')}>
                <Switch
                  checked={isBuiltin}
                  loading={saveAgentConfig.isPending}
                  onChange={handleSaveBuiltin}
                  checkedChildren={t('common.yes')}
                  unCheckedChildren={t('common.no')}
                />
              </Form.Item>
              {isBuiltin && (
                <Form.Item label={t('agent.builtinPosition')} help={t('agent.builtinPositionHelp')}>
                  <Select
                    mode="multiple"
                    allowClear
                    style={{ maxWidth: 480 }}
                    value={builtinPositions}
                    loading={saveAgentConfig.isPending}
                    placeholder={t('agent.builtinPositionPlaceholder')}
                    options={builtinPositionItems.map((item) => ({
                      value: item.itemValue,
                      label: item.itemLabel,
                    }))}
                    onChange={handleSaveBuiltinPosition}
                  />
                </Form.Item>
              )}
            </Form>
          </Card>
        );
      })(),
    },
    {
      key: 'trust-rules',
      label: t('agent.trustRules', '信任规则'),
      children: <AmendmentRulesTab agentId={id!} />,
    },
    {
      key: 'memory',
      label: t('agent.memory', '记忆管理'),
      children: <AgentMemoryTab agentId={id!} />,
    },
  ];

  return (
    <PageContainer
      title={agent.name}
      extra={
        <Space>
          {/* 激活按钮：配置未完成时显示 Tooltip（用 span 包裹确保 disabled 状态下 Tooltip 也能触发） */}
          {canStatus && (
            <Tooltip
              title={!canActivate
                ? agent.agentType === 'team'
                  ? t('agent.activationTooltipTeam')
                  : t('agent.activationTooltipSolo')
                : undefined}
            >
              <span style={{ display: 'inline-block', cursor: isRunning || !canActivate ? 'not-allowed' : 'default' }}>
                <Button
                  icon={<PlayCircleOutlined />}
                  type="primary"
                  loading={isActivating}
                  disabled={isRunning || !canActivate}
                  onClick={handleActivate}
                  style={canActivate && !isRunning ? START_ACTION_BUTTON_STYLE : DISABLED_ACTION_BUTTON_STYLE}
                >
                  {t('agent.start')}
                </Button>
              </span>
            </Tooltip>
          )}
          {canStatus && (
            <Button
              icon={<StopOutlined />}
              danger
              loading={isDeactivating}
              disabled={!isRunning}
              onClick={handleDeactivate}
              style={!isRunning ? DISABLED_ACTION_BUTTON_STYLE : undefined}
            >
              {t('agent.stop')}
            </Button>
          )}
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            {t('common.back')}
          </Button>
        </Space>
      }
    >
      {/* 配置未完成警告：按类型分开检查，各自展示对应提示 */}
      {agent.agentType === 'team' && agent.teamConfigDone === false && (
        <Alert
          type="warning"
          showIcon
          title={t('agent.teamConfigIncompleteTitle')}
          description={t('agent.teamConfigIncompleteDescription')}
          className="mb-4"
          action={
            <Button
              size="small"
              onClick={() => {
                setActiveTab('team');
                setEditMembers(teamMembers.map((m) => ({ ...m })));
                setIsEditingTeam(true);
              }}
            >
              {t('agent.goConfigure')}
            </Button>
          }
        />
      )}
      {agent.contextBindingDone === false && (
        <Alert
          type="warning"
          showIcon
          title={t('agent.contextBindingIncompleteTitle')}
          description={t('agent.contextBindingIncompleteDescription')}
          className="mb-4"
          action={
            <Button size="small" onClick={() => setActiveTab('context-bindings')}>
              {t('agent.goConfigure')}
            </Button>
          }
        />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
      {/* 专属指令初始化 Modal */}
      <Modal
        title={t('agent.initInstructionsTitle')}
        open={showInitInstructions}
        onCancel={() => setShowInitInstructions(false)}
        onOk={async () => {
          try {
            await initInstructions.mutateAsync({
              agentId: id!,
              data: {
                template: initTemplate,
                ...(initTemplate === 'general' ? { content: initContent } : {}),
              },
            });
            message.success(t('agent.initInstructionsSuccess'));
            setShowInitInstructions(false);
          } catch {
            message.error(t('agent.initInstructionsFail'));
          }
        }}
        confirmLoading={initInstructions.isPending}
        okText={t('common.create')}
        cancelText={t('common.cancel')}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label={t('agent.initTemplateLabel')}>
            <Select
              value={initTemplate}
              onChange={(v) => {
                setInitTemplate(v);
                if (v === 'general') setInitContent(getGeneralTemplateDefault(t));
              }}
              options={[
                { label: t('agent.initTemplateClaude'), value: 'claude' },
                { label: t('agent.initTemplateOpenAi'), value: 'openai' },
                { label: t('agent.initTemplateGeneral'), value: 'general' },
              ]}
            />
          </Form.Item>
          {initTemplate === 'general' && (
            <Form.Item label={t('agent.initTemplateContentLabel')}>
              <Input.TextArea
                value={initContent}
                onChange={(e) => setInitContent(e.target.value)}
                rows={12}
                style={{ fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <ExecutionDetailModal
        open={detailModal.open}
        execution={detailExecution ?? null}
        loading={detailLoading}
        onClose={() => setDetailModal({ open: false, executionId: null })}
      />

      {/* 绑定上下文 Modal */}
      <Modal
        title={t('agent.bindContext')}
        open={showBindContext}
        onCancel={() => {
          setShowBindContext(false);
          setSelectedContextId(undefined);
          setSelectedContextMemberId(undefined);
        }}
        onOk={handleBindContext}
        confirmLoading={createContextBinding.isPending || saveMemberContextBindings.isPending}
        okText={t('agent.bindAction')}
        cancelText={t('common.cancel')}
      >
        <Form layout="vertical">
          {isTeamAgent && (
            <Form.Item label={t('agent.boundMemberRole')}>
              <Select
                allowClear
                placeholder={t('agent.bindToMemberPlaceholder')}
                value={selectedContextMemberId}
                onChange={setSelectedContextMemberId}
                options={memberRoleOptions}
              />
            </Form.Item>
          )}
          {isTeamAgent && (
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message={t('agent.bindToMemberTip')}
            />
          )}
          <Form.Item label={t('agent.selectContext')} required>
            <Select
              showSearch
              allowClear
              placeholder={t('agent.selectContextToBind')}
              value={selectedContextId}
              onChange={setSelectedContextId}
              filterOption={(input, option) =>
                (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={(contextListData?.records ?? []).map((ctx: Context) => ({
                value: ctx.id,
                label: ctx.name,
              }))}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 成员工具配置弹窗 */}
      {memberToolConfig && (
        <MemberToolConfigModal
          open
          memberId={memberToolConfig.memberId}
          memberName={memberToolConfig.memberName}
          existingBindings={memberBindings}
          onCancel={() => setMemberToolConfig(null)}
          onSuccess={() => {
            setMemberToolConfig(null);
          }}
        />
      )}

      {memberContextConfig && (
        <MemberContextConfigModal
          open
          memberId={memberContextConfig.memberId}
          memberName={memberContextConfig.memberName}
          memberRoleType={memberContextConfig.memberRoleType}
          existingBindings={memberContextBindings}
          onCancel={() => setMemberContextConfig(null)}
          onSuccess={() => {
            setMemberContextConfig(null);
          }}
        />
      )}
    </PageContainer>
  );
}

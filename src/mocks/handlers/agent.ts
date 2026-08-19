/**
 * Agent Mock Handlers
 * 补齐 Agent 详情页和 Team Agent 配置页面需要的最小接口集合
 */
import { http, HttpResponse } from 'msw';
import { mockAgents } from '../data/agent';
import type {
  AgentConfig,
  AgentContextBinding,
  AgentContextBindingCreateDTO,
  AgentCreateDTO,
  AgentExecution,
  AgentInstructionsCheckResult,
  AgentTeamMember,
  AgentTeamMemberBatchDTO,
  AgentTeamMemberContextBinding,
  AgentToolBinding,
  AgentToolBindingBatchDTO,
  AvailableTool,
  BuiltinTool,
  InitInstructionsDTO,
  MemberContextBindingDTO,
  MemberToolBindingDTO,
} from '@/types/agent';
import type { Context } from '@/types/context';

const buildSuccess = <T>(data: T) =>
  HttpResponse.json({
    code: 200,
    message: 'success',
    data,
  });

const buildNotFound = (message: string) =>
  HttpResponse.json(
    { code: 404, message, data: null },
    { status: 404 },
  );

const nowIso = () => new Date().toISOString();

let memberSequence = 100;
let bindingSequence = 1000;
let configSequence = 100;
let executionSequence = 1000;

const mockConversationHistoryById: Record<string, Array<{
  messageType: 'USER' | 'AI';
  messageIndex: number;
  textContent: string;
  turnIndex: number;
  createdAt: string;
}>> = {};
const mockExecutionResultById: Record<string, string> = {};

const nextMemberId = () => `mock-member-${memberSequence++}`;
const nextBindingId = (scope: string) => `mock-${scope}-${bindingSequence++}`;
const nextConfigId = () => `mock-config-${configSequence++}`;
const nextExecutionId = () => `mock-execution-${executionSequence++}`;

const encodeSseEvent = (data: unknown) => `data: ${JSON.stringify(data)}\n\n`;

const buildAiChatReply = (prompt: string) => [
  '已生成首页工作台 AI 聊天助手冒烟测试建议：',
  '',
  '1. 验证输入框聚焦后进入专注模式，已输入内容不丢失。',
  '2. 验证发送消息后展示用户气泡和助手回复。',
  '3. 验证模型、Agent、输出格式、流式开关可打开并切换。',
  '4. 验证技能面板和附件上传入口可正常打开。',
  '',
  `本次任务摘要：${prompt}`,
].join('\n');

const mockContexts: Context[] = [
  {
    id: 'ctx-001',
    name: '保单域基础上下文',
    contextLevel: 'agent',
    description: '沉淀保单域核心术语、边界和通用约束。',
    status: 'active',
    itemCount: 12,
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-18T09:00:00Z',
  },
  {
    id: 'ctx-002',
    name: '需求澄清上下文',
    contextLevel: 'agent',
    description: '记录需求拆解方式、澄清问题和验收标准模板。',
    status: 'active',
    itemCount: 8,
    createdAt: '2026-04-02T08:00:00Z',
    updatedAt: '2026-04-19T09:00:00Z',
  },
  {
    id: 'ctx-003',
    name: '外部接口约束',
    contextLevel: 'project',
    description: '整理对接系统接口规范、鉴权方式和字段约束。',
    status: 'active',
    itemCount: 5,
    createdAt: '2026-04-03T08:00:00Z',
    updatedAt: '2026-04-20T09:00:00Z',
  },
];

const mockBuiltinTools: BuiltinTool[] = [
  {
    id: 'builtin-tool-001',
    code: 'web_search',
    name: 'Web Search',
    description: '联网检索公开信息',
    osSupport: 'all',
    enabled: true,
    sortOrder: 10,
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 'builtin-tool-002',
    code: 'code_runner',
    name: 'Code Runner',
    description: '执行受控脚本与命令',
    osSupport: 'all',
    enabled: true,
    sortOrder: 20,
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
  },
];

const createAvailableTools = (): AvailableTool[] => [
  {
    toolCode: 'policy_requirement_analysis',
    name: '保单需求分析',
    sourceType: 'skill',
    category: 'skill',
    sourceRefId: 'skill-policy-analysis',
    description: '基于领域知识进行需求拆解与澄清',
    alreadyBound: false,
  },
  {
    toolCode: 'policy_solution_design',
    name: '保单方案设计',
    sourceType: 'skill',
    category: 'skill',
    sourceRefId: 'skill-policy-design',
    description: '输出方案设计和技术拆解',
    alreadyBound: false,
  },
  {
    toolCode: 'underwriting_openapi',
    name: '核保外部接口',
    sourceType: 'api_gateway',
    category: 'api_gateway',
    sourceRefId: 'api-underwriting',
    description: '调用核保平台开放接口',
    alreadyBound: false,
  },
  {
    toolCode: 'filesystem',
    name: 'Filesystem MCP',
    sourceType: 'mcp',
    category: 'mcp',
    sourceRefId: 'mcp-filesystem',
    description: '访问受控文件系统能力',
    alreadyBound: false,
  },
  {
    toolCode: 'web_search',
    name: 'Web Search',
    sourceType: 'builtin',
    category: 'system',
    description: '联网检索公开信息',
    alreadyBound: false,
  },
  {
    toolCode: 'code_runner',
    name: 'Code Runner',
    sourceType: 'builtin',
    category: 'code',
    description: '执行受控脚本与命令',
    alreadyBound: false,
  },
];

const mockAvailableToolsByAgentId: Record<string, AvailableTool[]> = {
  '1': createAvailableTools(),
  '2': createAvailableTools(),
  '3': createAvailableTools(),
  '4': createAvailableTools(),
};

const mockAgentConfigsByAgentId: Record<string, AgentConfig[]> = {
  '1': [
    { id: 'config-001', configKey: 'output_format', configValue: 'markdown' },
    { id: 'config-002', configKey: 'is_builtin', configValue: 'false' },
  ],
};

const mockTeamMembersByAgentId: Record<string, AgentTeamMember[]> = {
  '1': [
    {
      id: 'member-001',
      agentId: '1',
      roleName: 'Lead Agent',
      roleType: 'lead_agent',
      quantity: 1,
      modelOverride: 'claude-sonnet-4-20250514',
      sortOrder: 0,
      createdAt: '2026-04-10T09:00:00Z',
    },
    {
      id: 'member-002',
      agentId: '1',
      roleName: '需求分析师',
      roleType: 'analyst',
      quantity: 1,
      modelOverride: 'gpt-4.1',
      sortOrder: 1,
      createdAt: '2026-04-10T09:00:00Z',
    },
    {
      id: 'member-003',
      agentId: '1',
      roleName: '方案设计师',
      roleType: 'designer',
      quantity: 1,
      modelOverride: 'claude-sonnet-4-20250514',
      sortOrder: 2,
      createdAt: '2026-04-10T09:00:00Z',
    },
  ],
};

const mockAgentContextBindingsByAgentId: Record<string, AgentContextBinding[]> = {
  '1': [
    {
      id: 'agent-context-001',
      agentId: '1',
      contextId: 'ctx-001',
      contextName: '保单域基础上下文',
      sourceType: 'context_module',
      title: '保单域基础上下文',
      status: 'active',
      sortOrder: 0,
      createdAt: '2026-04-12T10:00:00Z',
    },
  ],
};

const mockMemberContextBindingsByMemberId: Record<string, AgentTeamMemberContextBinding[]> = {
  'member-002': [
    {
      id: 'member-context-001',
      memberId: 'member-002',
      contextId: 'ctx-002',
      contextName: '需求澄清上下文',
      sourceType: 'context_module',
      title: '需求澄清上下文',
      status: 'active',
      sortOrder: 0,
      createdAt: '2026-04-12T10:30:00Z',
    },
  ],
  'member-003': [
    {
      id: 'member-context-002',
      memberId: 'member-003',
      contextId: 'ctx-003',
      contextName: '外部接口约束',
      sourceType: 'context_module',
      title: '外部接口约束',
      status: 'active',
      sortOrder: 0,
      createdAt: '2026-04-12T11:00:00Z',
    },
  ],
};

const mockAgentToolBindingsByAgentId: Record<string, AgentToolBinding[]> = {
  '1': [
    {
      id: 'agent-tool-001',
      agentId: '1',
      toolCode: 'policy_requirement_analysis',
      sourceType: 'skill',
      sourceRefId: 'skill-policy-analysis',
      enabled: true,
      priority: 100,
      createdAt: '2026-04-12T09:00:00Z',
    },
    {
      id: 'agent-tool-002',
      agentId: '1',
      toolCode: 'web_search',
      sourceType: 'builtin',
      enabled: true,
      priority: 90,
      createdAt: '2026-04-12T09:10:00Z',
    },
  ],
};

const mockMemberToolBindingsByMemberId: Record<string, AgentToolBinding[]> = {
  'member-002': [
    {
      id: 'member-tool-001',
      memberId: 'member-002',
      toolCode: 'underwriting_openapi',
      sourceType: 'api_gateway',
      sourceRefId: 'api-underwriting',
      enabled: true,
      priority: 80,
      createdAt: '2026-04-12T09:20:00Z',
    },
  ],
  'member-003': [
    {
      id: 'member-tool-002',
      memberId: 'member-003',
      toolCode: 'filesystem',
      sourceType: 'mcp',
      sourceRefId: 'mcp-filesystem',
      enabled: true,
      priority: 85,
      createdAt: '2026-04-12T09:30:00Z',
    },
  ],
};

const mockAgentExecutionsByAgentId: Record<string, AgentExecution[]> = {
  '1': [
    {
      executionId: 'exec-001',
      agentId: '1',
      status: 'completed',
      model: 'claude-sonnet-4-20250514',
      tokenInput: 1248,
      tokenOutput: 932,
      createdAt: '2026-04-15T08:00:00Z',
      completedAt: '2026-04-15T08:02:30Z',
      outputResult: '已输出 Team Agent 的需求分析和方案拆解结果。',
      logs: [
        {
          logLevel: 'INFO',
          logType: 'SYSTEM',
          content: '执行完成',
          createdAt: '2026-04-15T08:02:30Z',
        },
      ],
    },
  ],
};

const mockInstructionsCheckByAgentId: Record<string, AgentInstructionsCheckResult> = {
  '1': {
    hasInstructions: true,
    itemId: 'agent-instruction-001',
    title: '保单域 Agent 专属指令',
  },
};

const findAgent = (id: string) => mockAgents.find((agent) => agent.id === id);

const getAgentToolName = (agentId: string, binding: Pick<AgentToolBinding, 'toolCode' | 'sourceType' | 'sourceRefId'>) =>
  mockAvailableToolsByAgentId[agentId]
    ?.find((tool) =>
      tool.toolCode === binding.toolCode
      && tool.sourceType === binding.sourceType
      && (tool.sourceRefId ?? '') === (binding.sourceRefId ?? '')
    )?.name ?? binding.toolCode;

const updateAvailableToolBoundState = (agentId: string) => {
  const agentBindings = mockAgentToolBindingsByAgentId[agentId] ?? [];
  const boundKeys = new Set(
    agentBindings.map((binding) => `${binding.sourceType}|${binding.sourceRefId ?? ''}|${binding.toolCode}`),
  );
  const tools = mockAvailableToolsByAgentId[agentId] ?? [];
  mockAvailableToolsByAgentId[agentId] = tools.map((tool) => ({
    ...tool,
    alreadyBound: boundKeys.has(`${tool.sourceType}|${tool.sourceRefId ?? ''}|${tool.toolCode}`),
  }));
};

const buildTeamMembers = (agentId: string) => {
  const members = mockTeamMembersByAgentId[agentId] ?? [];
  return members.map((member) => {
    const memberId = member.id ?? '';
    const boundTools = (mockMemberToolBindingsByMemberId[memberId] ?? []).map((item) => ({
      ...item,
      memberId,
      memberRoleName: member.roleName,
      memberRoleType: member.roleType,
    }));
    const boundContexts = (mockMemberContextBindingsByMemberId[memberId] ?? []).map((item) => ({
      ...item,
      memberId,
      memberRoleName: member.roleName,
      memberRoleType: member.roleType,
    }));
    return {
      ...member,
      boundToolCount: boundTools.length,
      boundToolNames: boundTools.map((binding) => getAgentToolName(agentId, binding)).join('、'),
      boundTools,
      boundContextCount: boundContexts.length,
      boundContextNames: boundContexts.map((binding) => binding.title || binding.contextName || '未命名上下文').join('、'),
      boundContexts,
    };
  });
};

const syncAgentDetail = (agentId: string) => {
  const agent = findAgent(agentId);
  if (!agent) {
    return;
  }
  const teamMembers = buildTeamMembers(agentId);
  const hasAnyContext = (mockAgentContextBindingsByAgentId[agentId]?.length ?? 0) > 0
    || teamMembers.some((member) => (member.boundContextCount ?? 0) > 0);
  agent.teamMembers = teamMembers;
  agent.contextBindings = mockAgentContextBindingsByAgentId[agentId] ?? [];
  agent.configs = mockAgentConfigsByAgentId[agentId] ?? [];
  agent.workType = agent.workType ?? 'rd_standard';
  agent.templateName = agent.templateName ?? '标准研发团队';
  agent.teamConfigDone = agent.agentType !== 'team' || teamMembers.length > 0;
  agent.contextBindingDone = hasAnyContext;
  agent.configCompleted = Boolean(agent.teamConfigDone && hasAnyContext);
  updateAvailableToolBoundState(agentId);
};

const buildAgentContextBinding = (agentId: string, data: AgentContextBindingCreateDTO): AgentContextBinding => {
  const matchedContext = mockContexts.find((item) => item.id === data.contextId);
  return {
    id: nextBindingId('agent-context'),
    agentId,
    contextId: data.contextId,
    contextName: matchedContext?.name,
    sourceType: (data.sourceType || 'context_module') as AgentContextBinding['sourceType'],
    sourceConfig: data.sourceConfig,
    content: data.content,
    title: data.title || matchedContext?.name || '未命名上下文',
    status: 'active',
    sortOrder: data.sortOrder ?? (mockAgentContextBindingsByAgentId[agentId]?.length ?? 0),
    createdAt: nowIso(),
  };
};

const buildMemberContextBinding = (
  memberId: string,
  data: MemberContextBindingDTO,
  index: number,
): AgentTeamMemberContextBinding => {
  const matchedContext = mockContexts.find((item) => item.id === data.contextId);
  return {
    id: nextBindingId('member-context'),
    memberId,
    contextId: data.contextId,
    contextName: matchedContext?.name,
    sourceType: data.sourceType,
    sourceConfig: data.sourceConfig,
    content: data.content,
    title: data.title || matchedContext?.name || `成员上下文 ${index + 1}`,
    status: 'active',
    sortOrder: data.sortOrder ?? index,
    createdAt: nowIso(),
  };
};

const buildToolBinding = (
  scopeKey: 'agent' | 'member',
  ownerId: string,
  data: MemberToolBindingDTO,
): AgentToolBinding => ({
  id: nextBindingId(`${scopeKey}-tool`),
  ...(scopeKey === 'agent' ? { agentId: ownerId } : { memberId: ownerId }),
  toolCode: data.toolCode,
  sourceType: data.sourceType,
  sourceRefId: data.sourceRefId,
  enabled: data.enabled ?? true,
  priority: data.priority ?? 100,
  configOverride: data.configOverride,
  createdAt: nowIso(),
});

const serializeMembers = (agentId: string) => {
  syncAgentDetail(agentId);
  return buildTeamMembers(agentId);
};

mockAgents.forEach((agent) => {
  syncAgentDetail(agent.id);
});

export const agentHandlers = [
  // 获取全部 Agent（用于聊天助手选择器）
  http.get('/api/agents/all', () => {
    mockAgents.forEach((agent) => syncAgentDetail(agent.id));
    return buildSuccess(mockAgents);
  }),

  // 获取 Agent 列表
  http.get('/api/agents', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const size = Number(url.searchParams.get('size') || 20);
    const keyword = url.searchParams.get('keyword') || '';
    const status = url.searchParams.get('status');

    mockAgents.forEach((agent) => syncAgentDetail(agent.id));

    let filtered = mockAgents;
    if (keyword) {
      filtered = filtered.filter((agent) =>
        agent.name.includes(keyword) || agent.description.includes(keyword),
      );
    }
    if (status) {
      filtered = filtered.filter((agent) => agent.status === status);
    }

    const start = (page - 1) * size;
    const end = start + size;
    const records = filtered.slice(start, end);

    return buildSuccess({
      records,
      total: filtered.length,
      current: page,
      size,
      pages: Math.ceil(filtered.length / size),
    });
  }),

  // 获取 Agent 详情
  http.get('/api/agents/:id', ({ params }) => {
    const agentId = String(params.id);
    const agent = findAgent(agentId);
    if (!agent) {
      return buildNotFound('Agent 不存在');
    }
    syncAgentDetail(agentId);
    return buildSuccess(agent);
  }),

  // 创建 Agent
  http.post('/api/agents', async ({ request }) => {
    const body = (await request.json()) as AgentCreateDTO;
    const createdAt = nowIso();
    const newAgent = {
      id: String(mockAgents.length + 1),
      name: body.name,
      agentType: body.agentType,
      description: body.description || '',
      aiModel: body.aiModel || '',
      aiModelType: body.aiModelType,
      aiModelGroupId: body.aiModelGroupId,
      maxConcurrency: body.maxConcurrency,
      triggerType: body.triggerType,
      triggerConfig: body.triggerConfig,
      skills: body.skills || [],
      workType: body.workType,
      agentTag: body.agentTag,
      status: 'inactive' as const,
      teamConfigDone: body.agentType !== 'team',
      contextBindingDone: false,
      configCompleted: false,
      createdAt,
      updatedAt: createdAt,
    };
    mockAgents.push(newAgent);
    mockAvailableToolsByAgentId[newAgent.id] = createAvailableTools();
    mockAgentConfigsByAgentId[newAgent.id] = [];
    return buildSuccess(newAgent);
  }),

  // 更新 Agent
  http.put('/api/agents/:id', async ({ params, request }) => {
    const agentId = String(params.id);
    const agent = findAgent(agentId);
    if (!agent) {
      return buildNotFound('Agent 不存在');
    }
    const body = (await request.json()) as Record<string, unknown>;
    Object.assign(agent, body, { updatedAt: nowIso() });
    syncAgentDetail(agentId);
    return buildSuccess(agent);
  }),

  // 删除 Agent
  http.delete('/api/agents/:id', ({ params }) => {
    const agentId = String(params.id);
    const index = mockAgents.findIndex((agent) => agent.id === agentId);
    if (index === -1) {
      return buildNotFound('Agent 不存在');
    }
    mockAgents.splice(index, 1);
    delete mockAvailableToolsByAgentId[agentId];
    delete mockAgentConfigsByAgentId[agentId];
    delete mockAgentToolBindingsByAgentId[agentId];
    delete mockAgentContextBindingsByAgentId[agentId];
    delete mockAgentExecutionsByAgentId[agentId];
    delete mockTeamMembersByAgentId[agentId];
    return buildSuccess(null);
  }),

  // 更新 Agent 状态
  http.put('/api/agents/:id/status', ({ params, request }) => {
    const agentId = String(params.id);
    const agent = findAgent(agentId);
    if (!agent) {
      return buildNotFound('Agent 不存在');
    }
    const status = new URL(request.url).searchParams.get('status');
    if (status) {
      agent.status = status;
      agent.updatedAt = nowIso();
    }
    return buildSuccess(null);
  }),

  // 获取配置项
  http.get('/api/agents/:id/configs', ({ params }) => {
    const agentId = String(params.id);
    if (!findAgent(agentId)) {
      return buildNotFound('Agent 不存在');
    }
    return buildSuccess(mockAgentConfigsByAgentId[agentId] ?? []);
  }),

  // 保存配置项
  http.post('/api/agents/:id/configs', async ({ params, request }) => {
    const agentId = String(params.id);
    const agent = findAgent(agentId);
    if (!agent) {
      return buildNotFound('Agent 不存在');
    }
    const body = (await request.json()) as AgentConfig;
    const current = mockAgentConfigsByAgentId[agentId] ?? [];
    const existingIndex = current.findIndex((item) => item.configKey === body.configKey);
    const nextConfig: AgentConfig = {
      id: current[existingIndex]?.id ?? nextConfigId(),
      configKey: body.configKey,
      configValue: body.configValue,
      description: body.description,
    };
    if (existingIndex >= 0) {
      current[existingIndex] = nextConfig;
    } else {
      current.push(nextConfig);
    }
    mockAgentConfigsByAgentId[agentId] = current;
    syncAgentDetail(agentId);
    return buildSuccess(nextConfig);
  }),

  // 删除配置项
  http.delete('/api/agents/:id/configs/:configId', ({ params }) => {
    const agentId = String(params.id);
    const configId = String(params.configId);
    const current = mockAgentConfigsByAgentId[agentId] ?? [];
    mockAgentConfigsByAgentId[agentId] = current.filter((item) => item.id !== configId);
    syncAgentDetail(agentId);
    return buildSuccess(null);
  }),

  // 获取团队成员
  http.get('/api/agents/:id/team-members', ({ params }) => {
    const agentId = String(params.id);
    if (!findAgent(agentId)) {
      return buildNotFound('Agent 不存在');
    }
    return buildSuccess(serializeMembers(agentId));
  }),

  // 保存团队成员
  http.post('/api/agents/:id/team-members', async ({ params, request }) => {
    const agentId = String(params.id);
    const agent = findAgent(agentId);
    if (!agent) {
      return buildNotFound('Agent 不存在');
    }
    const body = (await request.json()) as AgentTeamMemberBatchDTO;
    const previousMembers = mockTeamMembersByAgentId[agentId] ?? [];
    const previousMemberIds = new Set(previousMembers.map((member) => member.id).filter(Boolean) as string[]);
    const nextMembers = (body.members ?? []).map((member, index) => {
      const memberId = member.id ?? nextMemberId();
      return {
        ...member,
        id: memberId,
        agentId,
        sortOrder: index,
        createdAt: member.createdAt ?? nowIso(),
      };
    });
    const nextMemberIds = new Set(nextMembers.map((member) => member.id).filter(Boolean) as string[]);
    previousMemberIds.forEach((memberId) => {
      if (!nextMemberIds.has(memberId)) {
        delete mockMemberToolBindingsByMemberId[memberId];
        delete mockMemberContextBindingsByMemberId[memberId];
      }
    });
    mockTeamMembersByAgentId[agentId] = nextMembers;
    agent.workType = body.workType || agent.workType;
    agent.updatedAt = nowIso();
    syncAgentDetail(agentId);
    return buildSuccess(serializeMembers(agentId));
  }),

  // 删除团队成员
  http.delete('/api/agents/:id/team-members/:memberId', ({ params }) => {
    const agentId = String(params.id);
    const memberId = String(params.memberId);
    const current = mockTeamMembersByAgentId[agentId] ?? [];
    mockTeamMembersByAgentId[agentId] = current.filter((item) => item.id !== memberId);
    delete mockMemberToolBindingsByMemberId[memberId];
    delete mockMemberContextBindingsByMemberId[memberId];
    syncAgentDetail(agentId);
    return buildSuccess(null);
  }),

  // 获取 Agent 级上下文绑定
  http.get('/api/agents/:id/context-bindings', ({ params }) => {
    const agentId = String(params.id);
    if (!findAgent(agentId)) {
      return buildNotFound('Agent 不存在');
    }
    return buildSuccess(mockAgentContextBindingsByAgentId[agentId] ?? []);
  }),

  // 新增 Agent 级上下文绑定
  http.post('/api/agents/:id/context-bindings', async ({ params, request }) => {
    const agentId = String(params.id);
    const agent = findAgent(agentId);
    if (!agent) {
      return buildNotFound('Agent 不存在');
    }
    const body = (await request.json()) as AgentContextBindingCreateDTO;
    const nextBinding = buildAgentContextBinding(agentId, body);
    const current = mockAgentContextBindingsByAgentId[agentId] ?? [];
    mockAgentContextBindingsByAgentId[agentId] = [...current, nextBinding];
    syncAgentDetail(agentId);
    return buildSuccess(nextBinding);
  }),

  // 删除 Agent 级上下文绑定
  http.delete('/api/agents/:id/context-bindings/:bindingId', ({ params }) => {
    const agentId = String(params.id);
    const bindingId = String(params.bindingId);
    const current = mockAgentContextBindingsByAgentId[agentId] ?? [];
    mockAgentContextBindingsByAgentId[agentId] = current.filter((item) => item.id !== bindingId);
    syncAgentDetail(agentId);
    return buildSuccess(null);
  }),

  // 获取 Agent 级工具绑定
  http.get('/api/agents/:id/tools', ({ params }) => {
    const agentId = String(params.id);
    if (!findAgent(agentId)) {
      return buildNotFound('Agent 不存在');
    }
    return buildSuccess(mockAgentToolBindingsByAgentId[agentId] ?? []);
  }),

  // 批量保存 Agent 级工具绑定
  http.put('/api/agents/:id/tools', async ({ params, request }) => {
    const agentId = String(params.id);
    if (!findAgent(agentId)) {
      return buildNotFound('Agent 不存在');
    }
    const body = (await request.json()) as AgentToolBindingBatchDTO;
    mockAgentToolBindingsByAgentId[agentId] = (body.tools ?? []).map((item) =>
      buildToolBinding('agent', agentId, item),
    );
    syncAgentDetail(agentId);
    return buildSuccess(mockAgentToolBindingsByAgentId[agentId]);
  }),

  // 获取 Agent 可用工具
  http.get('/api/agents/:id/available-tools', ({ params }) => {
    const agentId = String(params.id);
    if (!findAgent(agentId)) {
      return buildNotFound('Agent 不存在');
    }
    syncAgentDetail(agentId);
    return buildSuccess(mockAvailableToolsByAgentId[agentId] ?? createAvailableTools());
  }),

  // 获取成员工具绑定
  http.get('/api/agent-members/:memberId/tools', ({ params }) => {
    const memberId = String(params.memberId);
    return buildSuccess(mockMemberToolBindingsByMemberId[memberId] ?? []);
  }),

  // 批量保存成员工具绑定
  http.put('/api/agent-members/:memberId/tools', async ({ params, request }) => {
    const memberId = String(params.memberId);
    const body = (await request.json()) as MemberToolBindingDTO[];
    mockMemberToolBindingsByMemberId[memberId] = (body ?? []).map((item) =>
      buildToolBinding('member', memberId, item),
    );
    const owner = Object.entries(mockTeamMembersByAgentId)
      .find(([, members]) => members.some((member) => member.id === memberId));
    if (owner) {
      syncAgentDetail(owner[0]);
    }
    return buildSuccess(mockMemberToolBindingsByMemberId[memberId]);
  }),

  // 删除成员工具绑定
  http.delete('/api/agent-members/:memberId/tools/:bindingId', ({ params }) => {
    const memberId = String(params.memberId);
    const bindingId = String(params.bindingId);
    const current = mockMemberToolBindingsByMemberId[memberId] ?? [];
    mockMemberToolBindingsByMemberId[memberId] = current.filter((item) => item.id !== bindingId);
    const owner = Object.entries(mockTeamMembersByAgentId)
      .find(([, members]) => members.some((member) => member.id === memberId));
    if (owner) {
      syncAgentDetail(owner[0]);
    }
    return buildSuccess(null);
  }),

  // 获取成员上下文绑定
  http.get('/api/agent-members/:memberId/contexts', ({ params }) => {
    const memberId = String(params.memberId);
    return buildSuccess(mockMemberContextBindingsByMemberId[memberId] ?? []);
  }),

  // 批量保存成员上下文绑定
  http.put('/api/agent-members/:memberId/contexts', async ({ params, request }) => {
    const memberId = String(params.memberId);
    const body = (await request.json()) as MemberContextBindingDTO[];
    mockMemberContextBindingsByMemberId[memberId] = (body ?? []).map((item, index) =>
      buildMemberContextBinding(memberId, item, index),
    );
    const owner = Object.entries(mockTeamMembersByAgentId)
      .find(([, members]) => members.some((member) => member.id === memberId));
    if (owner) {
      syncAgentDetail(owner[0]);
    }
    return buildSuccess(mockMemberContextBindingsByMemberId[memberId]);
  }),

  // 删除成员上下文绑定
  http.delete('/api/agent-members/:memberId/contexts/:bindingId', ({ params }) => {
    const memberId = String(params.memberId);
    const bindingId = String(params.bindingId);
    const current = mockMemberContextBindingsByMemberId[memberId] ?? [];
    mockMemberContextBindingsByMemberId[memberId] = current.filter((item) => item.id !== bindingId);
    const owner = Object.entries(mockTeamMembersByAgentId)
      .find(([, members]) => members.some((member) => member.id === memberId));
    if (owner) {
      syncAgentDetail(owner[0]);
    }
    return buildSuccess(null);
  }),

  // 检查 Agent 是否已有专属指令
  http.get('/api/agents/:id/instructions-check', ({ params }) => {
    const agentId = String(params.id);
    if (!findAgent(agentId)) {
      return buildNotFound('Agent 不存在');
    }
    return buildSuccess(mockInstructionsCheckByAgentId[agentId] ?? { hasInstructions: false });
  }),

  // 初始化专属指令
  http.post('/api/agents/:id/instructions/init', async ({ params, request }) => {
    const agentId = String(params.id);
    if (!findAgent(agentId)) {
      return buildNotFound('Agent 不存在');
    }
    const body = (await request.json()) as InitInstructionsDTO;
    const itemId = nextBindingId('instruction');
    mockInstructionsCheckByAgentId[agentId] = {
      hasInstructions: true,
      itemId,
      title: body.title || 'Agent 专属指令',
    };
    const current = mockAgentContextBindingsByAgentId[agentId] ?? [];
    if (!current.some((item) => item.title === (body.title || 'Agent 专属指令'))) {
      current.unshift({
        id: itemId,
        agentId,
        sourceType: 'manual',
        title: body.title || 'Agent 专属指令',
        content: body.content || '请遵循当前 Agent 的默认指令模板执行任务。',
        status: 'active',
        sortOrder: 0,
        createdAt: nowIso(),
      });
      mockAgentContextBindingsByAgentId[agentId] = current;
    }
    syncAgentDetail(agentId);
    return buildSuccess({ itemId });
  }),

  // 获取执行记录
  http.get('/api/agents/:id/executions', ({ params, request }) => {
    const agentId = String(params.id);
    if (!findAgent(agentId)) {
      return buildNotFound('Agent 不存在');
    }
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const size = Number(url.searchParams.get('size') || 20);
    const records = mockAgentExecutionsByAgentId[agentId] ?? [];
    const start = (page - 1) * size;
    const end = start + size;
    return buildSuccess({
      records: records.slice(start, end),
      total: records.length,
      current: page,
      size,
      pages: Math.ceil(records.length / size),
    });
  }),

  // 首页工作台 AI 聊天：提交 Agent 执行
  http.post('/api/agents/:id/execute', async ({ params, request }) => {
    const agentId = String(params.id);
    if (!findAgent(agentId)) {
      return buildNotFound('Agent 不存在');
    }
    const body = (await request.json()) as { prompt?: string; conversationId?: string };
    const prompt = body.prompt?.trim() || '请协助处理当前任务';
    const executionId = nextExecutionId();
    const conversationId = body.conversationId || `mock-conversation-${executionId}`;
    const createdAt = nowIso();
    const reply = buildAiChatReply(prompt);
    mockExecutionResultById[executionId] = reply;
    mockConversationHistoryById[conversationId] = [
      ...(mockConversationHistoryById[conversationId] ?? []),
      {
        messageType: 'USER',
        messageIndex: Date.now(),
        textContent: prompt,
        turnIndex: mockConversationHistoryById[conversationId]?.length ?? 0,
        createdAt,
      },
      {
        messageType: 'AI',
        messageIndex: Date.now() + 1,
        textContent: reply,
        turnIndex: mockConversationHistoryById[conversationId]?.length ?? 0,
        createdAt: nowIso(),
      },
    ];
    return buildSuccess({
      executionId,
      conversationId,
      status: 'queued',
      queuedAt: createdAt,
      message: '已进入 Mock 执行队列',
    });
  }),

  // 首页工作台 AI 聊天：模拟 SSE 执行结果
  http.get('/api/agents/:id/executions/:execId/events', ({ params }) => {
    const executionId = String(params.execId);
    const reply = mockExecutionResultById[executionId] || buildAiChatReply('继续处理当前任务');
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(encodeSseEvent({
          eventType: 'STREAM_CHUNK',
          payload: { content: reply },
          timestamp: nowIso(),
        })));
        controller.enqueue(encoder.encode(encodeSseEvent({
          eventType: 'COMPLETED',
          payload: { content: reply },
          timestamp: nowIso(),
          elapsedMs: 680,
        })));
        controller.close();
      },
    });
    return new HttpResponse(stream, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }),

  // 首页工作台 AI 聊天：恢复会话历史
  http.get('/api/agents/conversations/:conversationId/history', ({ params }) => {
    const conversationId = String(params.conversationId);
    return buildSuccess(mockConversationHistoryById[conversationId] ?? []);
  }),

  // 首页工作台 AI 聊天：附件上传
  http.post('/api/agents/chat/upload', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileId = `mock-file-${Date.now()}`;
    return buildSuccess({
      fileId,
      fileName: file?.name || 'mock-attachment.txt',
      contentType: file?.type || 'text/plain',
      size: file?.size || 0,
      url: `/mock-uploads/${fileId}`,
    });
  }),

  // 首页工作台 AI 聊天：生图模式
  http.post('/api/chat/images/generations', async ({ request }) => {
    const body = (await request.json()) as { prompt?: string };
    return buildSuccess({
      modelName: 'Mock Image Model',
      imageUrls: [
        `https://placehold.co/1024x640/2563eb/ffffff?text=${encodeURIComponent(body.prompt || 'SchemaPlexAI')}`,
      ],
      createdAt: nowIso(),
    });
  }),

  // 获取执行详情
  http.get('/api/agents/:id/executions/:execId', ({ params }) => {
    const agentId = String(params.id);
    const execId = String(params.execId);
    const execution = (mockAgentExecutionsByAgentId[agentId] ?? [])
      .find((item) => item.executionId === execId);
    if (!execution) {
      return buildNotFound('执行记录不存在');
    }
    return buildSuccess(execution);
  }),

  // 停止执行
  http.post('/api/agents/:id/executions/:execId/stop', ({ params }) => {
    const agentId = String(params.id);
    const execId = String(params.execId);
    const execution = (mockAgentExecutionsByAgentId[agentId] ?? [])
      .find((item) => item.executionId === execId);
    if (!execution) {
      return buildNotFound('执行记录不存在');
    }
    execution.status = 'stopped';
    execution.completedAt = nowIso();
    return buildSuccess(null);
  }),

  // 内置工具列表
  http.get('/api/tools/builtin', () => buildSuccess(mockBuiltinTools)),

  // 上下文列表（供 Agent 详情页绑定上下文使用）
  http.get('/api/contexts', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const size = Number(url.searchParams.get('size') || 20);
    const keyword = url.searchParams.get('keyword') || '';
    const filtered = keyword
      ? mockContexts.filter((item) => item.name.includes(keyword) || item.description.includes(keyword))
      : mockContexts;
    const start = (page - 1) * size;
    const end = start + size;
    return buildSuccess({
      records: filtered.slice(start, end),
      total: filtered.length,
      current: page,
      size,
      pages: Math.ceil(filtered.length / size),
    });
  }),
];

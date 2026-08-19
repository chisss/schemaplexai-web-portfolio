/**
 * Mock 系统配置相关接口
 */
import { http, HttpResponse } from 'msw';

const mockModels = [
  {
    id: 'model-001',
    name: 'GPT-4.1 Turbo',
    provider: 'OpenAI',
    providerCode: 'openai',
    modelId: 'gpt-4.1',
    useCase: '通用推理',
    status: 'active',
    createdAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 'model-002',
    name: 'Claude Sonnet',
    provider: 'Anthropic',
    providerCode: 'anthropic',
    modelId: 'claude-sonnet',
    useCase: '代码生成',
    status: 'active',
    createdAt: '2026-04-01T08:00:00Z',
  },
];

const mockTeamTemplates = [
  {
    id: 'team-template-001',
    name: '标准研发团队',
    code: 'rd_standard',
    description: '适用于需求分析、设计和开发协同的 Team Agent 模板。',
    category: 'feature-development',
    recommendedRoles: [
      { roleName: 'Lead Agent', roleType: 'lead_agent', quantity: 1, description: '负责总体调度与结果汇总' },
      { roleName: '需求分析师', roleType: 'analyst', quantity: 1, description: '拆解需求并输出约束' },
      { roleName: '方案设计师', roleType: 'designer', quantity: 1, description: '负责技术设计与方案对齐' },
      { roleName: '实施工程师', roleType: 'developer', quantity: 2, description: '负责编码与联调执行' },
    ],
    status: 'active',
    createdAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 'team-template-002',
    name: '代码审查团队',
    code: 'code_review',
    description: '适用于高频评审与质量把关场景的 Team Agent 模板。',
    category: 'review',
    recommendedRoles: [
      { roleName: 'Lead Agent', roleType: 'lead_agent', quantity: 1, description: '负责流程编排与意见汇总' },
      { roleName: '代码审查员', roleType: 'reviewer', quantity: 2, description: '检查实现质量与规范符合度' },
      { roleName: '质量守门员', roleType: 'qa_guard', quantity: 1, description: '确认风险与发布条件' },
    ],
    status: 'active',
    createdAt: '2026-04-01T08:00:00Z',
  },
];

const mockModelGroups = [
  {
    id: 'model-group-001',
    name: '通用推理降级组',
    description: '主模型不可用时自动切换到备用推理模型。',
    routingStrategy: 'manual',
    status: 'active',
    useCase: '通用推理',
    items: [
      { id: 'model-group-item-001', modelId: 'model-001', modelName: 'GPT-4.1 Turbo', provider: 'OpenAI', useCase: '通用推理', sortOrder: 1 },
      { id: 'model-group-item-002', modelId: 'model-002', modelName: 'Claude Sonnet', provider: 'Anthropic', useCase: '代码生成', sortOrder: 2 },
    ],
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-10T08:00:00Z',
  },
];

const mockDictItems: Record<string, Array<Record<string, unknown>>> = {
  agent_tag: [
    {
      id: 'dict-agent-tag-001',
      dictCode: 'agent_tag',
      itemLabel: '需求分析',
      itemValue: 'requirement',
      sortOrder: 10,
      status: 'active',
    },
    {
      id: 'dict-agent-tag-002',
      dictCode: 'agent_tag',
      itemLabel: '代码生成',
      itemValue: 'coding',
      sortOrder: 20,
      status: 'active',
    },
    {
      id: 'dict-agent-tag-003',
      dictCode: 'agent_tag',
      itemLabel: '质量审查',
      itemValue: 'quality',
      sortOrder: 30,
      status: 'active',
    },
  ],
  agent_tool_source_type: [
    {
      id: 'dict-agent-tool-source-001',
      dictCode: 'agent_tool_source_type',
      itemLabel: 'Skill',
      itemValue: 'skill',
      sortOrder: 10,
      status: 'active',
    },
    {
      id: 'dict-agent-tool-source-002',
      dictCode: 'agent_tool_source_type',
      itemLabel: '外部接口',
      itemValue: 'api_gateway',
      sortOrder: 20,
      status: 'active',
    },
    {
      id: 'dict-agent-tool-source-003',
      dictCode: 'agent_tool_source_type',
      itemLabel: 'MCP',
      itemValue: 'mcp',
      sortOrder: 30,
      status: 'active',
    },
    {
      id: 'dict-agent-tool-source-004',
      dictCode: 'agent_tool_source_type',
      itemLabel: '系统内置',
      itemValue: 'builtin',
      sortOrder: 40,
      status: 'active',
    },
  ],
};

export const systemHandlers = [
  http.get('/api/system/models', () =>
    HttpResponse.json({
      code: 200,
      message: 'success',
      data: mockModels,
    }),
  ),
  http.get('/api/system/team-templates', () =>
    HttpResponse.json({
      code: 200,
      message: 'success',
      data: mockTeamTemplates,
    }),
  ),
  http.get('/api/system/team-templates/:code', ({ params }) => {
    const template = mockTeamTemplates.find((item) => item.code === params.code);
    if (!template) {
      return HttpResponse.json({ code: 404, message: 'template not found', data: null }, { status: 404 });
    }
    return HttpResponse.json({
      code: 200,
      message: 'success',
      data: template,
    });
  }),
  http.get('/api/system/model-groups', () =>
    HttpResponse.json({
      code: 200,
      message: 'success',
      data: mockModelGroups,
    }),
  ),
  http.get('/api/system/model-groups/:id', ({ params }) => {
    const group = mockModelGroups.find((item) => item.id === params.id);
    if (!group) {
      return HttpResponse.json({ code: 404, message: 'model group not found', data: null }, { status: 404 });
    }
    return HttpResponse.json({
      code: 200,
      message: 'success',
      data: group,
    });
  }),
  http.get('/api/system/dicts/:dictCode/items', ({ params }) =>
    HttpResponse.json({
      code: 200,
      message: 'success',
      data: mockDictItems[String(params.dictCode)] ?? [],
    }),
  ),
];

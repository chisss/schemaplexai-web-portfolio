/**
 * Agent 相关类型定义
 * 与后端 AgentVO / AgentCreateRequest / AgentUpdateRequest / TeamMember / ContextBinding 对齐
 */

import type { SecurityCheckDecisionResult } from './securityCompliance';

export type AgentType = 'team' | 'solo';
export type AgentStatus = 'active' | 'inactive' | 'running' | 'error';
export type TriggerType = 'manual' | 'scheduled' | 'event';
export type ExecutionMode = 'auto' | 'plan' | 'suggest';
export type AgentExecutionStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'completed_with_fallback'
  | 'failed'
  | 'stopped'
  | 'paused';

export interface BudgetAdmissionResult {
  allowed: boolean;
  strategy: 'allow' | 'alert' | 'downgrade' | 'block' | string;
  budgetId?: string;
  usageRate?: number;
  remainingAmount?: number | string;
  message?: string;
  actionRequired?: boolean;
}

export type AgentExecutionState =
  | 'QUEUED'
  | 'RUNNING'
  | 'TOOL_RUNNING'
  | 'APPROVAL_REQUIRED'
  | 'PAUSED'
  | 'BLOCKED_BY_BUDGET'
  | 'BLOCKED_BY_SECURITY'
  | 'FAILED_RETRYABLE'
  | 'FAILED_FINAL'
  | 'FALLBACK_USED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface AgentExecutionStateSnapshot {
  state: AgentExecutionState;
  eventType?: string;
  message?: string;
  traceId?: string;
  retryable?: boolean;
  targetUrl?: string;
  evidence?: string[];
  timestamp?: string;
}

/** Agent 配置项（对应后端 AgentConfigVO） */
export interface AgentConfig {
  id: string;
  configKey: string;
  configValue: string;
  description?: string;
}

/** Agent 团队成员（对应后端 AgentTeamMemberVO） */
export interface AgentTeamMember {
  id?: string;
  agentId?: string;
  roleName: string;
  roleType: string;
  quantity: number;
  modelOverride?: string;
  description?: string;
  sortOrder?: number;
  /** 该成员已绑定的工具数 */
  boundToolCount?: number;
  /** 该成员已绑定的工具名称列表（逗号分隔） */
  boundToolNames?: string;
  /** 该成员已绑定的工具详情列表 */
  boundTools?: AgentToolBinding[];
  /** 该成员已绑定的上下文数 */
  boundContextCount?: number;
  /** 该成员已绑定的上下文名称列表（逗号分隔） */
  boundContextNames?: string;
  /** 该成员已绑定的上下文详情列表 */
  boundContexts?: AgentTeamMemberContextBinding[];
  createdAt?: string;
}

/** Team 成员上下文绑定（对应后端 AgentTeamMemberContextBindingVO） */
export interface AgentTeamMemberContextBinding {
  id?: string;
  memberId?: string;
  memberRoleName?: string;
  memberRoleType?: string;
  contextId?: string;
  contextName?: string;
  sourceType: 'manual' | 'context_module' | 'gitlab' | string;
  sourceConfig?: AgentSourceConfig;
  content?: string;
  title?: string;
  status?: string;
  sortOrder?: number;
  createdAt?: string;
}

/** Agent 上下文绑定（对应后端 AgentContextBindingVO） */
export interface AgentContextBinding {
  id?: string;
  agentId?: string;
  memberId?: string;
  memberRoleName?: string;
  memberRoleType?: string;
  contextId?: string;
  contextName?: string;
  sourceType: 'manual' | 'context_module' | 'gitlab';
  sourceConfig?: AgentSourceConfig;
  content?: string;
  title?: string;
  status?: string;
  sortOrder?: number;
  createdAt?: string;
}

/** Agent 实体（对应后端 AgentVO） */
export interface Agent {
  id: string;
  name: string;
  agentType: string;
  description: string;
  aiModel: string;
  aiModelType?: 'model' | 'model_group';
  aiModelGroupId?: string;
  status: string;
  maxConcurrency?: number;
  triggerType?: string;
  triggerConfig?: Record<string, unknown>;
  skills: string[];
  skillDisplayNames?: string[];
  agentTag?: string;
  /** 是否系统内置Agent */
  isSystemAgent?: boolean;
  /** 系统Agent唯一编码 */
  systemAgentCode?: string;
  builtin?: boolean;
  workType?: string;
  templateName?: string;
  configCompleted?: boolean;
  /** 团队配置是否完成（仅 team 类型有意义，solo 恒为 true） */
  teamConfigDone?: boolean;
  /** 上下文绑定是否完成 */
  contextBindingDone?: boolean;
  configs?: AgentConfig[];
  teamMembers?: AgentTeamMember[];
  contextBindings?: AgentContextBinding[];
  createdAt: string;
  updatedAt: string;
}

/** 创建 Agent 请求（对应后端 AgentCreateRequest） */
export interface AgentCreateDTO {
  name: string;
  agentType: string;
  description?: string;
  aiModel?: string;
  aiModelType?: 'model' | 'model_group';
  aiModelGroupId?: string;
  maxConcurrency?: number;
  triggerType?: string;
  triggerConfig?: Record<string, unknown>;
  skills?: string[];
  workType?: string;
  agentTag?: string;
}

/** 更新 Agent 请求（对应后端 AgentUpdateRequest） */
export interface AgentUpdateDTO {
  name?: string;
  description?: string;
  aiModel?: string;
  aiModelType?: 'model' | 'model_group';
  aiModelGroupId?: string;
  maxConcurrency?: number;
  triggerType?: string;
  triggerConfig?: Record<string, unknown>;
  skills?: string[];
  workType?: string;
}

/** Agent 查询参数（对应后端 AgentQueryRequest） */
export interface AgentQueryDTO {
  page?: number;
  size?: number;
  keyword?: string;
  agentType?: string;
  status?: string;
  isBuiltin?: boolean;
  /** 按内置位置筛选（返回该位置的内置Agent，忽略status过滤） */
  builtinPosition?: string;
}

/** Agent 配置请求（对应后端 AgentConfigRequest） */
export interface AgentConfigDTO {
  configKey: string;
  configValue: string;
  description?: string;
}

/** 团队成员批量保存请求 */
export interface AgentTeamMemberBatchDTO {
  workType?: string;
  members: AgentTeamMember[];
}

/** 上下文绑定创建请求 */
export interface AgentContextBindingCreateDTO {
  contextId?: string;
  sourceType: string;
  sourceConfig?: AgentSourceConfig;
  content?: string;
  title?: string;
  sortOrder?: number;
}

export interface GitLabContextPath {
  path: string;
  type: 'directory' | 'file' | string;
}

export interface GitLabContextSourceConfig {
  integrationId: string;
  integrationName: string;
  repositoryId: string;
  repositoryName: string;
  repositoryFullName: string;
  defaultBranch?: string;
  branch: string;
  paths: GitLabContextPath[];
}

export type AgentSourceConfig = GitLabContextSourceConfig | Record<string, unknown>;

/** Agent 工具绑定（对应后端 AgentToolBindingVO） */
export interface AgentToolBinding {
  id?: string;
  agentId?: string;
  memberId?: string;
  memberRoleName?: string;
  memberRoleType?: string;
  toolCode: string;
  sourceType: 'builtin' | 'skill' | 'api_gateway' | 'mcp' | string;
  sourceRefId?: string;
  enabled?: boolean;
  priority?: number;
  configOverride?: Record<string, unknown>;
  createdAt?: string;
}

/** Agent 工具绑定更新请求（对应后端 AgentToolBindingBatchRequest） */
export interface AgentToolBindingBatchDTO {
  tools: Array<{
    toolCode: string;
    sourceType: string;
    sourceRefId?: string;
    enabled?: boolean;
    priority?: number;
    configOverride?: Record<string, unknown>;
  }>;
}

// ============ 执行相关 ============

/** Agent 执行提交请求（对应后端 AgentExecuteDTO） */
export interface AgentExecuteDTO {
  prompt: string;
  context?: Record<string, unknown>;
  model?: string;
  stream?: boolean;
  conversationId?: string;
  attachmentIds?: string[];
  reasoningStrength?: 'low' | 'medium' | 'high' | string;
  skillCode?: string;
  outputFormat?: 'markdown' | 'plain_text' | 'structured_json' | string;
  executionMode?: ExecutionMode;
}

/** 审批决策输入（用于 Human-in-Loop 审批） */
export interface ApprovalDecisionDTO {
  approvalDecision: 'approve' | 'deny' | 'approve_always' | 'edit';
  approvalId?: string;
  toolCode?: string;
  toolCommand?: string;
  editedArguments?: Record<string, unknown>;
  decisionReason?: string;
  message?: string;
}

/** Agent 执行提交结果（对应后端 AgentExecuteResultVO） */
export interface AgentExecuteResultVO {
  executionId: string;
  conversationId?: string;
  status: 'queued' | 'failed' | 'blocked' | 'paused';
  queuedAt?: string;
  message?: string;
  securityDecision?: SecurityCheckDecisionResult;
  budgetAdmission?: BudgetAdmissionResult;
}

/** Agent 执行日志条目（对应后端 AgentExecutionLogVO） */
export interface AgentExecutionLog {
  logId?: string;
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  logType: string;
  roundNum?: number;
  toolName?: string;
  content?: string;
  summary?: string;
  tokenDelta?: number;
  elapsedMs?: number;
  createdAt: string;
}

export interface AgentExecutionChild {
  executionId: string;
  parentExecutionId?: string;
  teamMemberId?: string;
  teamMemberRoleName?: string;
  status: AgentExecutionStatus;
  model?: string;
  errorMessage?: string;
  outputResult?: string;
  createdAt: string;
  completedAt?: string;
  logs?: AgentExecutionLog[];
}

/** Agent 执行记录（对应后端 AgentExecutionVO） */
export interface AgentExecution {
  executionId: string;
  agentId: string;
  status: AgentExecutionStatus;
  inputPrompt?: string;
  model?: string;
  conversationId?: string;
  runtimeEngine?: string;
  tokenInput?: number;
  tokenOutput?: number;
  errorMessage?: string;
  outputResult?: string;
  parentExecutionId?: string;
  teamMemberId?: string;
  teamMemberRoleName?: string;
  graphThreadId?: string;
  checkpointNamespace?: string;
  sandboxPolicySnapshot?: Record<string, unknown>;
  securityDecision?: string;
  securityMessage?: string;
  securityTraceId?: string;
  securityIncidentId?: string;
  qualityTaskId?: string;
  qualityTaskStatus?: string;
  qualitySummary?: string;
  qualityDeviationCount?: number;
  qualityWarningCount?: number;
  createdAt: string;
  completedAt?: string;
  logs?: AgentExecutionLog[];
  childExecutions?: AgentExecutionChild[];
}

export interface ConversationMessage {
  messageType: 'SYSTEM' | 'USER' | 'AI' | 'TOOL_EXECUTION_RESULT' | string;
  textContent?: string;
  toolCallId?: string;
  toolName?: string;
  messageIndex?: number;
  turnIndex?: number;
  createdAt?: string;
}

export interface AgentChatAttachment {
  fileId: string;
  fileName: string;
  fileUrl: string;
}

export interface DirectChatDTO {
  modelId: string;
  userMessage: string;
  conversationId?: string;
  attachmentIds?: string[];
  reasoningStrength?: 'low' | 'medium' | 'high' | string;
  outputFormat?: 'markdown' | 'plain_text' | 'structured_json' | string;
}

export interface DirectChatResponse {
  conversationId: string;
  modelId: string;
  modelName: string;
  reply: string;
  createdAt?: string;
}

export interface ImageGenerationDTO {
  modelId: string;
  prompt: string;
  size?: string;
  quality?: string;
  n?: number;
}

export interface ImageGenerationResponse {
  modelId: string;
  modelName: string;
  prompt: string;
  size: string;
  quality: string;
  imageUrls: string[];
}

/** 执行记录查询参数（对应后端 AgentExecutionQueryDTO） */
export interface AgentExecutionQueryDTO {
  page?: number;
  size?: number;
  executionId?: string;
  status?: string;
}

/** Agent SSE 事件 */
export interface AgentExecutionEvent {
  eventType: string;
  executionId?: string;
  conversationId?: string;
  roundNum?: number;
  message?: string;
  elapsedMs?: number;
  executionState?: AgentExecutionState;
  traceId?: string;
  retryable?: boolean;
  targetUrl?: string;
  evidence?: string[];
  payload?: unknown;
  timestamp?: string;
}

// ============ 专属指令 ============

/** Agent 专属指令检测结果 */
export interface AgentInstructionsCheckResult {
  hasInstructions: boolean;
  itemId?: string;
  contextId?: string;
  title?: string;
}

/** 初始化专属指令请求 */
export interface InitInstructionsDTO {
  template: 'claude' | 'openai' | 'general';
  title?: string;
  content?: string;
}

// ============ 工具绑定相关 ============

/** 系统内置工具（对应后端 BuiltinToolVO） */
export interface BuiltinTool {
  id: string;
  code: string;
  name: string;
  description?: string;
  osSupport?: string;
  enabled?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** 可用工具（用于前端下拉选择，对应后端 AvailableToolVO） */
export interface AvailableTool {
  toolCode: string;
  name: string;
  sourceType: 'builtin' | 'skill' | 'api_gateway' | 'mcp';
  category?: 'system' | 'web' | 'code' | 'skill' | 'api_gateway' | 'mcp' | string;
  sourceRefId?: string;
  description?: string;
  inputSchema?: string;
  osSupport?: string;
  alreadyBound: boolean;
}

/** 成员工具绑定 DTO */
export interface MemberToolBindingDTO {
  toolCode: string;
  sourceType: string;
  sourceRefId?: string;
  enabled?: boolean;
  priority?: number;
  configOverride?: Record<string, unknown>;
}

/** 成员工具绑定批量保存请求 */
export interface MemberToolBindingBatchDTO {
  tools: MemberToolBindingDTO[];
}

/** 成员上下文绑定 DTO */
export interface MemberContextBindingDTO {
  contextId?: string;
  sourceType: string;
  sourceConfig?: AgentSourceConfig;
  content?: string;
  title?: string;
  sortOrder?: number;
}

// ============ 工具配置模板相关 ============

/** 工具配置模板 Schema 属性 */
export interface ToolConfigSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';
  title?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  required?: string[];
  properties?: Record<string, ToolConfigSchemaProperty>;
  items?: ToolConfigSchemaProperty | ToolConfigSchemaProperty[];
  sensitive?: boolean;
}

/** 工具配置模板（对应后端 ToolConfigTemplateVO） */
export interface ToolConfigTemplate {
  id: string;
  toolCode: string;
  name: string;
  version: string;
  schema: {
    type?: string;
    properties?: Record<string, ToolConfigSchemaProperty>;
    required?: string[];
  };
  defaultConfig?: Record<string, unknown>;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

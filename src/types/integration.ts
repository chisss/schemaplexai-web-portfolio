/**
 * 集成扩展相关类型定义
 * 与后端 IntegrationVO / WebhookEventVO / ConnectionTestVO 对齐
 */

/** 集成配置（对应后端 IntegrationVO） */
export interface Integration {
  id: string;
  integrationType: string;
  platform: string;
  name: string;
  config: Record<string, any>;
  status: string;
  lastSyncAt?: string;
  errorMessage?: string;
  createdAt: string;
  createdByName?: string;
}

/** 集成项目（对应后端 IntegrationProjectVO） */
export interface IntegrationProject {
  id: string;
  integrationId: string;
  projectId: string;
  externalProjectId: string;
  externalProjectName: string;
  syncConfig?: Record<string, any>;
  status: string;
  lastSyncAt?: string;
  /** 本地项目路径（供Agent读取上下文） */
  localPath?: string;
}

/** 集成远端仓库 */
export interface IntegrationRepository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  defaultBranch?: string;
  httpUrl?: string;
  sshUrl?: string;
}

/** 集成仓库文件树节点 */
export interface IntegrationRepositoryTreeNode {
  path: string;
  name: string;
  type: 'directory' | 'file' | string;
  leaf: boolean;
}

/** Webhook 事件（对应后端 WebhookEventVO） */
export interface WebhookEvent {
  id: string;
  integrationId: string;
  eventType: string;
  sourcePlatform: string;
  payload: Record<string, any>;
  status: string;
  processedAt?: string;
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
}

/** 连接测试结果（对应后端 ConnectionTestVO） */
export interface ConnectionTest {
  connected: boolean;
  latencyMs: number;
  scopes: string[];
  username?: string;
  errorMessage?: string;
}

/** 创建集成请求（对应后端 IntegrationCreateRequest） */
export interface IntegrationCreateDTO {
  integrationType: string;
  platform: string;
  name: string;
  config: Record<string, any>;
}

/** 更新集成请求（对应后端 IntegrationUpdateRequest） */
export interface IntegrationUpdateDTO {
  name?: string;
  config?: Record<string, any>;
  status?: string;
}

/** 集成查询参数（对应后端 IntegrationQueryRequest） */
export interface IntegrationQueryDTO {
  page?: number;
  size?: number;
  integrationType?: string;
  platform?: string;
  status?: string;
  keyword?: string;
}

// ====================== Skill 技能管理 ======================

export interface SkillParameter {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  default?: string | number | boolean | null;
  enumValues?: string[];
}

export interface SkillResource {
  relativePath: string;
  content: string;
}

export interface SkillExposureConfig {
  searchBehavior?: 'searchable' | 'always_visible';
  progressiveDisclosure?: boolean;
  lazyLoad?: boolean;
}

/** 技能（对应后端 SkillVO） */
export interface Skill {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  skillPrompt?: string;
  version?: string;
  category: string;
  /** 是否内置技能(系统预置) */
  builtIn?: boolean;
  parameters?: SkillParameter[];
  resources?: SkillResource[];
  exposureConfig?: SkillExposureConfig;
  implementation?: Record<string, any>;
  status: string;
  createdAt: string;
  updatedAt?: string;
  createdByName?: string;
}

export interface SkillCreateDTO {
  name: string;
  displayName?: string;
  description?: string;
  skillPrompt?: string;
  version?: string;
  category: string;
  parameters?: SkillParameter[];
  resources?: SkillResource[];
  exposureConfig?: SkillExposureConfig;
  implementation?: Record<string, any>;
}

export interface SkillUpdateDTO {
  displayName?: string;
  description?: string;
  skillPrompt?: string;
  version?: string;
  category?: string;
  parameters?: SkillParameter[];
  resources?: SkillResource[];
  exposureConfig?: SkillExposureConfig;
  implementation?: Record<string, any>;
  status?: string;
}

export interface SkillQueryDTO {
  page?: number;
  size?: number;
  category?: string;
  status?: string;
  keyword?: string;
}

// ====================== MCP Server 管理 ======================

export type McpTransportType = 'streamable_http' | 'sse' | 'stdio';
export type McpServerType = 'generic' | 'database';
export type DatabasePresetCode = 'postgresql' | 'mysql' | 'oracle';

/** MCP Server（对应后端 McpServerVO） */
export interface McpServer {
  id: string;
  name: string;
  description?: string;
  url?: string;
  transportType?: McpTransportType;
  authType?: string;
  authConfig?: Record<string, any>;
  headers?: Record<string, any>;
  serverType?: McpServerType;
  presetCode?: DatabasePresetCode | string;
  connectionConfig?: Record<string, any>;
  transportConfig?: Record<string, any>;
  tools?: any[];
  status: string;
  lastHealthCheck?: string;
  createdAt: string;
  updatedAt?: string;
  createdByName?: string;
}

export interface McpServerCreateDTO {
  name: string;
  description?: string;
  url?: string;
  transportType?: McpTransportType;
  authType?: string;
  authConfig?: Record<string, any>;
  headers?: Record<string, any>;
  serverType?: McpServerType;
  presetCode?: DatabasePresetCode | string;
  connectionConfig?: Record<string, any>;
  transportConfig?: Record<string, any>;
}

export interface McpServerUpdateDTO {
  name?: string;
  url?: string;
  description?: string;
  transportType?: McpTransportType;
  authType?: string;
  authConfig?: Record<string, any>;
  headers?: Record<string, any>;
  serverType?: McpServerType;
  presetCode?: DatabasePresetCode | string;
  connectionConfig?: Record<string, any>;
  transportConfig?: Record<string, any>;
  status?: string;
}

export interface McpServerQueryDTO {
  page?: number;
  size?: number;
  status?: string;
  serverType?: McpServerType;
  keyword?: string;
}

// ====================== 通知渠道管理 ======================

/** 通知渠道（对应后端 NotificationChannelVO） */
export interface NotificationChannel {
  id: string;
  name: string;
  channelType: string;
  config: Record<string, any>;
  status: string;
  notificationRules?: Record<string, any>;
  lastTestAt?: string;
  errorMessage?: string;
  description?: string;
  createdAt: string;
  createdByName?: string;
}

export interface NotificationChannelCreateDTO {
  name: string;
  channelType: string;
  config: Record<string, any>;
  description?: string;
  notificationRules?: Record<string, any>;
}

export interface NotificationChannelUpdateDTO {
  name?: string;
  config?: Record<string, any>;
  status?: string;
  description?: string;
  notificationRules?: Record<string, any>;
}

export interface NotificationChannelQueryDTO {
  page?: number;
  size?: number;
  channelType?: string;
  status?: string;
  keyword?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  templateType: string;
  status: string;
  titleTemplate: string;
  contentTemplate: string;
  description?: string;
  supportedChannels?: string[];
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MessageTemplateVariable {
  key: string;
  label: string;
  description?: string;
  sampleValue?: string;
}

export interface MessageTemplateDefinition {
  templateType: string;
  templateName: string;
  defaultTitleTemplate: string;
  defaultContentTemplate: string;
  supportedVariables: MessageTemplateVariable[];
}

export interface MessageTemplateCreateDTO {
  name: string;
  templateType: string;
  titleTemplate: string;
  contentTemplate: string;
  status?: string;
  description?: string;
  supportedChannels?: string[];
}

export interface MessageTemplateUpdateDTO {
  name?: string;
  templateType?: string;
  titleTemplate?: string;
  contentTemplate?: string;
  status?: string;
  description?: string;
  supportedChannels?: string[];
}

export interface MessageTemplateQueryDTO {
  page?: number;
  size?: number;
  templateType?: string;
  status?: string;
  name?: string;
  createdByKeyword?: string;
  keyword?: string;
}

export interface NotificationRecord {
  id: string;
  channelId?: string;
  channelName?: string;
  channelType?: string;
  templateId?: string;
  templateName?: string;
  templateType?: string;
  sourceType?: string;
  sourceId?: string;
  businessType?: string;
  workflowInstanceId?: string;
  workflowNodeExecutionId?: string;
  specId?: string;
  status: string;
  title?: string;
  content?: string;
  requestPayload?: Record<string, any>;
  responsePayload?: Record<string, any>;
  responseSummary?: string;
  providerMessageId?: string;
  errorMessage?: string;
  billingAmount?: string | number;
  billingCurrency?: string;
  billingUnit?: string;
  billingQuantity?: number;
  sentAt?: string;
  createdAt?: string;
}

export interface NotificationRecordQueryDTO {
  page?: number;
  size?: number;
  keyword?: string;
  channelType?: string;
  status?: string;
  templateType?: string;
  sourceType?: string;
  sentAtStart?: string;
  sentAtEnd?: string;
}

// ====================== 工作空间管理 ======================

/** 工作空间（对应后端 WorkspaceVO） */
export interface Workspace {
  id: string;
  name: string;
  sourceType: string;
  gitUrl?: string;
  gitPlatform?: string;
  defaultBranch?: string;
  localPath?: string;
  accessMode?: string;
  writeCapability?: string;
  browseCapability?: string;
  downloadCapability?: string;
  workspaceStatus: string;
  diskUsageMb?: number;
  lastSyncAt?: string;
  errorMessage?: string;
  description?: string;
  workspaceScope?: string;
  retentionPolicy?: string;
  createdAt: string;
  createdByName?: string;
}

export interface WorkspaceCreateDTO {
  name: string;
  sourceType: string;
  gitUrl?: string;
  gitPlatform?: string;
  gitCredential?: Record<string, any>;
  defaultBranch?: string;
  localPath?: string;
  description?: string;
}

export interface WorkspaceUpdateDTO {
  name?: string;
  defaultBranch?: string;
  description?: string;
  gitCredential?: Record<string, any>;
}

export interface WorkspaceQueryDTO {
  page?: number;
  size?: number;
  sourceType?: string;
  workspaceStatus?: string;
  gitPlatform?: string;
  keyword?: string;
}

export interface WorkspaceFile {
  path: string;
  name: string;
  directory?: boolean;
  size?: number;
  modifiedAt?: string;
  previewable?: boolean;
  downloadable?: boolean;
}

export interface WorkspaceFileContent extends WorkspaceFile {
  mimeType?: string;
  truncated?: boolean;
  content?: string;
}

// ====================== 工作空间分支管理 ======================

export interface WorkspaceBranch {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  branchName: string;
  requirementNo?: string;
  sourceBranch?: string;
  targetBranch?: string;
  headCommit?: string;
  aheadCount?: number;
  behindCount?: number;
  isCurrent?: boolean;
  branchStatus?: string;
  lastSyncedAt?: string;
  diffSummary?: Record<string, any>;
}

export interface WorkspaceBranchQueryDTO {
  page?: number;
  size?: number;
  workspaceId?: string;
  requirementNo?: string;
  branchName?: string;
}

export interface BranchDiffFile {
  filePath: string;
  changeType?: string;
  additions?: number;
  deletions?: number;
  patch?: string;
}

export interface WorkspaceBranchDiff {
  workspaceId: string;
  workspaceName?: string;
  sourceBranch: string;
  targetBranch?: string;
  aheadCount?: number;
  behindCount?: number;
  changedFileCount?: number;
  additions?: number;
  deletions?: number;
  files?: BranchDiffFile[];
}

export interface BranchRule {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  branchPattern: string;
  branchNameTemplate: string;
  autoCreateForSpec?: boolean;
  protectionRules?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface BranchRuleSaveDTO {
  workspaceId: string;
  branchPattern: string;
  branchNameTemplate: string;
  autoCreateForSpec?: boolean;
  protectionRules?: Record<string, any>;
}

// ====================== CICD Pipeline 管理 ======================

/** CICD Pipeline（对应后端 CicdPipelineVO） */
export interface CicdPipeline {
  id: string;
  integrationId?: string;
  workspaceId?: string;
  name: string;
  pipelineType: string;
  config?: Record<string, any>;
  triggerRules?: Record<string, any>;
  status: string;
  lastRunAt?: string;
  lastRunStatus?: string;
  description?: string;
  createdAt: string;
  createdByName?: string;
}

export interface CicdPipelineCreateDTO {
  integrationId?: string;
  workspaceId?: string;
  name: string;
  pipelineType: string;
  config?: Record<string, any>;
  triggerRules?: Record<string, any>;
  description?: string;
}

export interface CicdPipelineUpdateDTO {
  name?: string;
  config?: Record<string, any>;
  triggerRules?: Record<string, any>;
  status?: string;
  description?: string;
}

export interface CicdPipelineQueryDTO {
  page?: number;
  size?: number;
  pipelineType?: string;
  status?: string;
  workspaceId?: string;
  keyword?: string;
}

// ---- API Gateway ----

export interface ApiGateway {
  id: string;
  name: string;
  description?: string;
  direction: 'outbound' | 'inbound';
  method: string;
  url: string;
  authType?: string;
  authConfig?: Record<string, any>;
  headers?: Record<string, any>;
  queryParams?: Record<string, any>;
  requestBodySchema?: Record<string, any>;
  responseBodySchema?: Record<string, any>;
  contentType?: string;
  timeoutMs?: number;
  retryCount?: number;
  category?: string;
  tags?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiGatewayCreateDTO {
  name: string;
  description?: string;
  direction: string;
  method: string;
  url: string;
  authType?: string;
  authConfig?: Record<string, any>;
  headers?: Record<string, any>;
  queryParams?: Record<string, any>;
  requestBodySchema?: Record<string, any>;
  responseBodySchema?: Record<string, any>;
  contentType?: string;
  timeoutMs?: number;
  retryCount?: number;
  category?: string;
  tags?: string[];
}

export interface ApiGatewayUpdateDTO {
  name?: string;
  description?: string;
  direction?: string;
  method?: string;
  url?: string;
  authType?: string;
  authConfig?: Record<string, any>;
  headers?: Record<string, any>;
  queryParams?: Record<string, any>;
  requestBodySchema?: Record<string, any>;
  responseBodySchema?: Record<string, any>;
  contentType?: string;
  timeoutMs?: number;
  retryCount?: number;
  category?: string;
  tags?: string[];
  status?: string;
}

export interface ApiGatewayQueryDTO {
  page?: number;
  size?: number;
  direction?: string;
  status?: string;
  category?: string;
  keyword?: string;
}

export interface ApiGatewayPolicy {
  id?: string;
  gatewayId: string;
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  rateLimitPerDay?: number;
  costPerCall?: number;
  dailyCostLimit?: number;
  monthlyCostLimit?: number;
  ipWhitelist?: string[];
  dataMaskingRules?: any[];
  accessLevel?: string;
  requireApproval?: boolean;
  complianceTags?: string[];
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiGatewayPolicyDTO {
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  rateLimitPerDay?: number;
  costPerCall?: number;
  dailyCostLimit?: number;
  monthlyCostLimit?: number;
  ipWhitelist?: string[];
  dataMaskingRules?: any[];
  accessLevel?: string;
  requireApproval?: boolean;
  complianceTags?: string[];
  enabled?: boolean;
}

export interface ApiGatewayLog {
  id: string;
  gatewayId: string;
  gatewayName?: string;
  callerType?: string;
  callerId?: string;
  requestUrl?: string;
  requestMethod?: string;
  requestHeaders?: Record<string, any>;
  requestBody?: string;
  responseStatus?: number;
  responseHeaders?: Record<string, any>;
  responseBody?: string;
  durationMs?: number;
  cost?: number;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

export interface ApiGatewayLogQueryDTO {
  page?: number;
  size?: number;
  callerType?: string;
  success?: boolean;
}

export interface ApiGatewayTestRequest {
  headers?: Record<string, any>;
  queryParams?: Record<string, any>;
  body?: string;
}

export interface ApiGatewayTestResult {
  success: boolean;
  statusCode?: number;
  responseHeaders?: Record<string, any>;
  responseBody?: string;
  durationMs?: number;
  errorMessage?: string;
}

/**
 * 系统管理相关类型定义
 * 与后端 UserVO / RoleVO / MenuVO / TenantVO / PermissionVO / AiModel / AiModelRoute / TeamTemplate 对齐
 */

// ============ 权限 ============

/** 权限（对应后端 PermissionVO） */
export interface Permission {
  id: string;
  name: string;
  code: string;
  type: string;
  parentId?: string;
  path?: string;
  method?: string;
  sortOrder?: number;
}

// ============ 角色 ============

/** 角色（对应后端 RoleVO） */
export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  isSystem?: boolean;
  status: string;
  permissions?: Permission[];
  createdAt: string;
}

/** 创建角色请求 */
export interface RoleCreateDTO {
  name: string;
  code: string;
  description?: string;
  permissionIds?: string[];
}

/** 更新角色请求 */
export interface RoleUpdateDTO {
  name?: string;
  description?: string;
  status?: string;
  permissionIds?: string[];
}

/** 角色查询参数 */
export interface RoleQueryDTO {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
}

// ============ 用户 ============

/** 用户（对应后端 UserVO） */
export interface User {
  id: string;
  username: string;
  realName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  status: string;
  loginType?: string;
  lastLoginAt?: string;
  roles?: Role[];
  createdAt: string;
  updatedAt: string;
}

/** 创建用户请求 */
export interface UserCreateDTO {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  realName?: string;
  avatarUrl?: string;
  roleIds?: string[];
}

/** 更新用户请求 */
export interface UserUpdateDTO {
  email?: string;
  phone?: string;
  realName?: string;
  avatarUrl?: string;
  status?: string;
  roleIds?: string[];
}

/** 用户查询参数 */
export interface UserQueryDTO {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
}

/** 密码更新请求 */
export interface PasswordUpdateDTO {
  oldPassword: string;
  newPassword: string;
}

// ============ 菜单 ============

/** 菜单（对应后端 MenuVO） */
export interface Menu {
  id: string;
  parentId?: string;
  name: string;
  path?: string;
  component?: string;
  icon?: string;
  sortOrder?: number;
  visible?: boolean;
  permissionCode?: string;
  menuType: string;
  children?: Menu[];
}

/** 创建菜单请求 */
export interface MenuCreateDTO {
  parentId?: string;
  name: string;
  path?: string;
  component?: string;
  icon?: string;
  sortOrder?: number;
  visible?: boolean;
  permissionCode?: string;
  menuType: string;
}

/** 更新菜单请求 */
export interface MenuUpdateDTO {
  parentId?: string;
  name?: string;
  path?: string;
  component?: string;
  icon?: string;
  sortOrder?: number;
  visible?: boolean;
  permissionCode?: string;
  menuType?: string;
}

// ============ 租户 ============

/** 租户（对应后端 TenantVO） */
export interface Tenant {
  id: string;
  name: string;
  code: string;
  description?: string;
  logoUrl?: string;
  status: string;
  industry?: string;
  scenarios?: string[];
  enabledCapabilities?: Record<string, any>;
  initStatus?: 'pending' | 'running' | 'done' | 'failed';
  createdAt: string;
  updatedAt: string;
}

/** 创建租户请求 */
export interface TenantCreateDTO {
  name: string;
  code: string;
  description?: string;
  logoUrl?: string;
}

/** 更新租户请求 */
export interface TenantUpdateDTO {
  name?: string;
  description?: string;
  logoUrl?: string;
  status?: string;
}

// ============ AI 模型 ============

/** 字典项（对应后端 SysDictItem） */
export interface DictItem {
  id: string;
  dictCode: string;
  itemLabel: string;
  itemValue: string;
  description?: string;
  extra?: Record<string, any>;
  sortOrder: number;
  status: string;
}

/** 系统字典（对应后端 SysDict） */
export interface SysDict {
  id: string;
  dictName: string;
  dictCode: string;
  dictType: string;
  remark?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

/** AI 模型（对应后端 AiModel） */
export interface AiModel {
  id: string;
  name: string;
  provider: string;
  providerCode?: string;
  protocol?: string;
  useCase?: string;
  modelId: string;
  apiKeyEncrypted?: string;
  baseUrl?: string;
  defaultParams?: Record<string, any>;
  inputPrice?: number;
  outputPrice?: number;
  imagePrice?: number;
  timeoutSeconds?: number;
  retryCount?: number;
  retryIntervalSeconds?: number;
  maxTokens?: number;
  maxQuotaTokens?: number;
  supportedReasoningEfforts?: string;
  multimodal?: boolean;
  status: string;
  lastTestAt?: string;
  lastTestStatus?: string;
  lastTestLatency?: number;
  lastTestError?: string;
  lastTestModel?: string;
  runtimeRequestCount1m?: number;
  runtimeErrorRate1m?: number;
  runtimeP95LatencyMs?: number;
  runtimeHealthStatus?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 连通性测试结果（对应后端 ConnectivityTestResultVO） */
export interface ConnectivityTestResult {
  status: 'success' | 'failed' | 'timeout';
  latencyMs?: number;
  modelName?: string;
  errorCode?: string;
  errorMessage?: string;
  tokenInput?: number;
  tokenOutput?: number;
  testedAt: string;
}

export interface ModelRuntimeMetric {
  modelId: string;
  modelName: string;
  requestCount1m: number;
  errorRate1m: number;
  p95LatencyMs: number;
  healthStatus: string;
  lastUpdated?: string;
}

export interface RouteAnalysisModelShare {
  modelId: string;
  modelName: string;
  requestCount: number;
  trafficShare: number;
}

export interface RouteAnalysisTrendPoint {
  bucketTime: string;
  modelId: string;
  modelName: string;
  avgLatencyMs: number;
  avgCost: number;
  requestCount: number;
}

export interface RoutingDecisionLog {
  id: string;
  agentId?: string;
  agentName?: string;
  requestId: string;
  selectedModelId?: string;
  selectedModelName?: string;
  strategy?: string;
  candidateModels?: string[];
  reason?: string;
  latencyMs?: number;
  tokenCount?: number;
  cost?: number;
  createdAt?: string;
}

export interface RouteAnalysis {
  realtimeMetrics: ModelRuntimeMetric[];
  selectedDistribution: RouteAnalysisModelShare[];
  trend: RouteAnalysisTrendPoint[];
  recentLogs: RoutingDecisionLog[];
}

/** 创建AI模型请求 */
export interface AiModelCreateDTO {
  name: string;
  provider: string;
  providerCode?: string;
  protocol?: string;
  modelId: string;
  apiKey: string;
  useCase?: string;
  baseUrl?: string;
  defaultParams?: Record<string, any>;
  inputPrice?: number;
  outputPrice?: number;
  imagePrice?: number;
  timeoutSeconds?: number;
  retryCount?: number;
  retryIntervalSeconds?: number;
  maxTokens?: number;
  maxQuotaTokens?: number;
  multimodal?: boolean;
}

/** 更新AI模型请求 */
export interface AiModelUpdateDTO {
  name?: string;
  provider?: string;
  providerCode?: string;
  protocol?: string;
  modelId?: string;
  apiKey?: string;
  useCase?: string;
  baseUrl?: string;
  defaultParams?: Record<string, any>;
  inputPrice?: number;
  outputPrice?: number;
  imagePrice?: number;
  timeoutSeconds?: number;
  retryCount?: number;
  retryIntervalSeconds?: number;
  maxTokens?: number;
  maxQuotaTokens?: number;
  multimodal?: boolean;
  status?: string;
}

// ============ AI 模型路由 ============

/** 路由规则（对应后端 AiModelRouteVO） */
export interface AiModelRoute {
  id: string;
  name: string;
  priority: number;
  matchDimension: string;
  matchCondition?: Record<string, any>;
  primaryModelId: string;
  primaryModelName?: string;
  secondaryModelId?: string;
  secondaryModelName?: string;
  tertiaryModelId?: string;
  tertiaryModelName?: string;
  primaryTriggerCondition?: Record<string, any>;
  secondaryTriggerCondition?: Record<string, any>;
  description?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 创建路由规则请求 */
export interface AiModelRouteCreateDTO {
  name: string;
  priority?: number;
  matchDimension: string;
  matchCondition?: Record<string, any>;
  primaryModelId: string;
  secondaryModelId?: string;
  tertiaryModelId?: string;
  primaryTriggerCondition?: Record<string, any>;
  secondaryTriggerCondition?: Record<string, any>;
  description?: string;
}

/** 更新路由规则请求 */
export interface AiModelRouteUpdateDTO {
  name?: string;
  priority?: number;
  matchDimension?: string;
  matchCondition?: Record<string, any>;
  primaryModelId?: string;
  secondaryModelId?: string;
  tertiaryModelId?: string;
  primaryTriggerCondition?: Record<string, any>;
  secondaryTriggerCondition?: Record<string, any>;
  description?: string;
  status?: string;
}

// ============ RAG 管理 ============

export interface RagConfig {
  tenantId?: string;
  enabled: boolean;
  // 向量模型
  embeddingSource: string; // 'builtin' | 'api'
  builtinEmbeddingModelId?: string;
  builtinEmbeddingModelName?: string;
  builtinEmbeddingDimension?: number;
  vectorModelId?: string;
  vectorModelName?: string;
  provider?: string;
  modelId?: string;
  // 通用配置
  collectionName: string;
  chunkSize: number;
  chunkOverlap: number;
  retrievalTopK: number;
  retrievalMinScore: number;
  embeddingDimension?: number;
  maxQuotaTokens?: number;
  textCleaningEnabled: boolean;
  // Reranker
  rerankerEnabled: boolean;
  rerankerSource: string; // 'builtin' | 'api'
  builtinScoringModelId?: string;
  builtinScoringModelName?: string;
  rerankerTopN: number;
  rerankerMinScore: number;
  updatedAt?: string;
}

export interface RagConfigUpdateDTO {
  enabled?: boolean;
  embeddingSource?: string;
  builtinEmbeddingModelId?: string;
  vectorModelId?: string;
  collectionName?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  retrievalTopK?: number;
  retrievalMinScore?: number;
  embeddingDimension?: number;
  textCleaningEnabled?: boolean;
  rerankerEnabled?: boolean;
  rerankerSource?: string;
  rerankerTopN?: number;
  rerankerMinScore?: number;
}

export interface RagOperationLog {
  id: string;
  operationType: string;
  sourceType?: string;
  sourceId?: string;
  contextId?: string;
  modelConfigId?: string;
  modelName?: string;
  provider?: string;
  collectionName?: string;
  status: string;
  chunkCount?: number;
  retrievedCount?: number;
  vectorDimension?: number;
  requestChars?: number;
  durationMs?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

// ============ 国际化管理 ============

/** 语言（对应后端 I18nLocale） */
export interface I18nLocale {
  id: number;
  code: string;
  name: string;
  flag?: string;
  enabled: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

/** 翻译文案（对应后端 I18nMessage） */
export interface I18nMessage {
  id: number;
  locale: string;
  msgKey: string;
  msgValue: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** MyBatis-Plus 分页结果 */
export interface MpPage<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// ============ 团队模板 ============

/** 团队模板推荐角色 */
export interface TeamTemplateRole {
  roleName: string;
  roleType: string;
  quantity: number;
  description: string;
}

/** 团队模板（对应后端 TeamTemplateVO） */
export interface TeamTemplate {
  id: string;
  name: string;
  code: string;
  description?: string;
  category?: string;
  icon?: string;
  recommendedRoles: TeamTemplateRole[];
  status: string;
  createdAt?: string;
}

// ============ AI 模型组 ============

/** 模型组成员（对应后端 AiModelGroupVO.AiModelGroupItemVO） */
export interface AiModelGroupItem {
  id: string;
  modelId: string;
  modelName?: string;
  provider?: string;
  useCase?: string;
  sortOrder: number;
}

/** AI 模型组（对应后端 AiModelGroupVO） */
export interface AiModelGroup {
  id: string;
  name: string;
  description?: string;
  routingStrategy: 'manual' | 'by_price' | 'by_performance';
  status: string;
  useCase?: string;
  items: AiModelGroupItem[];
  createdAt?: string;
  updatedAt?: string;
}

/** 创建模型组请求 */
export interface AiModelGroupCreateDTO {
  name: string;
  description?: string;
  routingStrategy?: string;
}

/** 更新模型组请求 */
export interface AiModelGroupUpdateDTO {
  name?: string;
  description?: string;
  routingStrategy?: string;
  status?: string;
}

/** 保存模型组成员请求 */
export interface AiModelGroupItemSaveDTO {
  modelIds: string[];
}

/** 自动生成模型组请求 */
export interface AiModelGroupAutoGenerateDTO {
  strategy: 'by_price' | 'by_performance';
  name?: string;
  useCase: string;
}

/** 租户行业配置更新请求 */
export interface TenantProfileUpdateDTO {
  industry?: string;
  scenarios?: string[];
  enabledCapabilities?: Record<string, any>;
}

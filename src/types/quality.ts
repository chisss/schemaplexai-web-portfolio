/**
 * 质量保障相关类型定义
 * 与后端 DeviationVO / IntentDefectVO / CrossReviewVO 等对齐
 */

export type QualityIssueType = 'both' | 'deviation' | 'intent_defect';
export type QualityBindingType = 'agent' | 'workflow' | 'spec';

export interface QualityDistributionItem {
  key: string;
  count: number;
}

// ============ 偏离检测 ============

/** 偏离记录（对应后端 DeviationVO） */
export interface Deviation {
  id: string;
  workspaceId?: string;
  projectName?: string;
  specId: string;
  specName: string;
  agentExecutionId?: string;
  deviationType: string;
  deviationTypeLabel?: string;
  severity: string;
  severityLabel?: string;
  title: string;
  description: string;
  expectedValue?: string;
  actualValue?: string;
  filePath?: string;
  lineNumber?: number;
  status: string;
  statusLabel?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  sourceType?: string;
  taskId?: string;
  createdAt: string;
}

/** 偏离统计（对应后端 DeviationStatisticsVO） */
export interface DeviationStatistics {
  totalCount: number;
  openCount: number;
  resolvedCount: number;
  acknowledgedCount: number;
  ignoredCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  typeDistribution: QualityDistributionItem[];
  statusDistribution: QualityDistributionItem[];
  projectDistribution: QualityDistributionItem[];
}

/** 检测任务（对应后端 DetectTaskVO） */
export interface DetectTask {
  detectTaskId: string;
  status: string;
  message: string;
}

/** 触发偏离检测请求（对应后端 DeviationDetectRequest） */
export interface DeviationDetectDTO {
  specId: string;
  agentExecutionId: string;
  deviationTypes?: string[];
}

/** 偏离查询参数（对应后端 DeviationQueryRequest） */
export interface DeviationQueryDTO {
  workspaceId?: string;
  specId?: string;
  deviationType?: string;
  severity?: string;
  status?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

/** 偏离状态更新请求（对应后端 DeviationStatusUpdateRequest） */
export interface DeviationStatusUpdateDTO {
  status: string;
  remark?: string;
}

// ============ 意图缺陷 ============

/** 意图缺陷（对应后端 IntentDefectVO） */
export interface IntentDefect {
  id: string;
  specId: string;
  specName: string;
  docType: string;
  docTypeLabel?: string;
  defectType: string;
  defectTypeLabel?: string;
  severity: string;
  title: string;
  description: string;
  location?: string;
  suggestion?: string;
  status: string;
  createdAt: string;
}

/** 分析任务（对应后端 AnalyzeTaskVO） */
export interface AnalyzeTask {
  analyzeTaskId: string;
  status: string;
  message: string;
}

/** 意图缺陷分析请求（对应后端 IntentDefectAnalyzeRequest） */
export interface IntentDefectAnalyzeDTO {
  specId: string;
  docType: string;
}

/** 意图缺陷查询参数（对应后端 IntentDefectQueryRequest） */
export interface IntentDefectQueryDTO {
  specId?: string;
  docType?: string;
  defectType?: string;
  severity?: string;
  status?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

// ============ 交叉审查 ============

/** 交叉审查（对应后端 CrossReviewVO） */
export interface CrossReview {
  id: string;
  specId: string;
  specName: string;
  taskId?: string;
  profileId?: string;
  issueType?: QualityIssueType;
  modelAId: string;
  modelAName?: string;
  modelAResult?: Record<string, any>;
  modelBId?: string;
  modelBName?: string;
  modelBResult?: Record<string, any>;
  mergedResult?: Record<string, any>;
  summary?: Record<string, any>;
  status: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

/** 创建交叉审查请求（对应后端 CrossReviewCreateRequest） */
export interface CrossReviewCreateDTO {
  specId: string;
  taskId?: string;
  profileId?: string;
  issueType?: QualityIssueType;
  artifactId?: string;
  targetContent?: string;
  referenceContent?: string;
  modelIds: string[];
}

export interface CrossReviewQueryDTO {
  specId?: string;
  status?: string;
  page?: number;
  size?: number;
}

// ============ 质量检测配置组 ============

export interface QualityProfileBinding {
  id?: string;
  bindingType: QualityBindingType;
  bindingId: string;
  bindingName?: string;
}

export interface QualityThresholdDimensionConfig {
  enabled: boolean;
  strictness: number;
  confidenceThreshold: number;
  maxFindings: number;
  focusKeywords: string[];
  blockOnCritical: boolean;
  evaluationPrompt?: string;
}

export interface QualityThresholdConfig {
  ambiguity: QualityThresholdDimensionConfig;
  contradiction: QualityThresholdDimensionConfig;
  omission: QualityThresholdDimensionConfig;
  vagueness: QualityThresholdDimensionConfig;
}

export interface QualityProfileConfig {
  id: string;
  code: string;
  name: string;
  issueType: QualityIssueType;
  description?: string;
  triggerModes: string[];
  enabledDimensionCodes: string[];
  enabledRuleCodes: string[];
  thresholdConfig: Partial<QualityThresholdConfig> | Record<string, any>;
  status?: string;
  isDefault?: boolean;
  version?: number;
  modelIds: string[];
  modelNames: string[];
  bindings: QualityProfileBinding[];
  createdAt?: string;
  updatedAt?: string;
}

export interface QualityProfileConfigCreateDTO {
  code: string;
  name: string;
  issueType: QualityIssueType;
  description?: string;
  triggerModes: string[];
  enabledDimensionCodes: string[];
  enabledRuleCodes: string[];
  thresholdConfig: Partial<QualityThresholdConfig> | Record<string, any>;
  status?: string;
  isDefault?: boolean;
  modelIds: string[];
  bindings: Array<Pick<QualityProfileBinding, 'bindingType' | 'bindingId'>>;
}

// ============ 质量问题 ============

export type QualityIssueStatus = 'open' | 'acknowledged' | 'resolving' | 'resolved' | 'ignored';

export interface QualityIssueFinding {
  type: string;
  severity: string;
  confidence: number;
  ruleCode?: string;
  title: string;
  description: string;
  location?: string;
  suggestion?: string;
}

export interface QualityIssue {
  id: string;
  tenantId: string;
  specId?: string;
  taskId?: string;
  issueType: string;
  sourceType?: string;
  severity: string;
  gateDecision?: string;
  executionStrategy?: string;
  title: string;
  summary?: string;
  score?: number;
  findingCount: number;
  findingsJson?: QualityIssueFinding[];
  workflowInstanceId?: string;
  workflowNodeId?: string;
  crossReviewId?: string;
  status: QualityIssueStatus;
  assigneeId?: string;
  resolutionAction?: string;
  resolutionRemark?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QualityIssueStatistics {
  total: number;
  open: number;
  acknowledged: number;
  resolved: number;
  ignored: number;
}

export interface QualityTask {
  id: string;
  taskNo: string;
  tenantId?: string;
  issueType: string;
  triggerMode?: string;
  sourceType?: string;
  sourceAgentId?: string;
  specId?: string;
  workflowTemplateId?: string;
  agentExecutionId?: string;
  profileId?: string;
  profileCode?: string;
  status: string;
  progress?: number;
  totalItems?: number;
  successItems?: number;
  failedItems?: number;
  skippedItems?: number;
  errorMessage?: string;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface QualityIssueQueryDTO {
  tenantId?: string;
  specId?: string;
  status?: string;
  severity?: string;
  issueType?: string;
  page?: number;
  size?: number;
}

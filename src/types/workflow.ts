/**
 * 工作流相关类型定义
 * 与后端 WorkflowTemplateVO / WorkflowInstanceVO / WorkflowNodeExecutionVO 对齐
 */

export type WorkflowStatus = 'draft' | 'published' | 'archived';
export type WorkflowInstanceStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type AgentInstructionSource = 'upstream' | 'manual';
export type WorkflowDataRecord = Record<string, unknown>;

export interface WorkflowNodeOutputData extends WorkflowDataRecord {
  tracePayload?: WorkflowDataRecord;
  handoffPayload?: WorkflowDataRecord;
  contextMetrics?: WorkflowDataRecord;
}

/** 节点类型枚举 */
export type NodeType =
  | 'trigger_manual'
  | 'trigger_cron'
  | 'trigger_event'
  | 'start'
  | 'agent'
  | 'document'
  | 'notification'
  | 'database'
  | 'script'
  | 'human_review'
  | 'deviation_analysis'
  | 'quality_report'
  | 'condition'
  | 'loop'
  | 'parallel'
  | 'end';

/** 节点分类 */
export type NodeCategory = 'trigger' | 'execution' | 'control' | 'end';

/** 节点分类颜色映射 */
export const NODE_CATEGORY_COLORS: Record<NodeCategory, string> = {
  trigger: '#10b981',
  execution: '#165DFF',
  control: '#8b5cf6',
  end: '#F53F3F',
};

/** 节点类型元信息 */
export interface NodeTypeMeta {
  type: NodeType;
  category: NodeCategory;
  labelKey: string;
  label: string;
  labelEn: string;
  icon: string;
  color: string;
  descriptionKey: string;
  description: string;
  descriptionEn: string;
}

/** 节点类型元信息注册表 */
export const NODE_TYPE_REGISTRY: NodeTypeMeta[] = [
  { type: 'start', category: 'trigger', labelKey: 'workflow.designer.node.start', label: 'Start', labelEn: 'Start', icon: 'PlayCircleOutlined', color: '#10b981', descriptionKey: 'workflow.designer.nodeDesc.start', description: 'Workflow start point', descriptionEn: 'Workflow start point' },
  { type: 'trigger_manual', category: 'trigger', labelKey: 'workflow.designer.node.triggerManual', label: 'Manual Trigger', labelEn: 'Manual Trigger', icon: 'PlayCircleOutlined', color: '#10b981', descriptionKey: 'workflow.designer.nodeDesc.triggerManual', description: 'Manually start workflow', descriptionEn: 'Manually start workflow' },
  { type: 'trigger_cron', category: 'trigger', labelKey: 'workflow.designer.node.triggerCron', label: 'Cron Trigger', labelEn: 'Cron Trigger', icon: 'ClockCircleOutlined', color: '#10b981', descriptionKey: 'workflow.designer.nodeDesc.triggerCron', description: 'Trigger by cron schedule', descriptionEn: 'Trigger by cron schedule' },
  { type: 'trigger_event', category: 'trigger', labelKey: 'workflow.designer.node.triggerEvent', label: 'Event Trigger', labelEn: 'Event Trigger', icon: 'ThunderboltOutlined', color: '#10b981', descriptionKey: 'workflow.designer.nodeDesc.triggerEvent', description: 'Trigger by events', descriptionEn: 'Trigger by events' },
  { type: 'agent', category: 'execution', labelKey: 'workflow.designer.node.agent', label: 'Agent Node', labelEn: 'Agent Node', icon: 'RobotOutlined', color: '#165DFF', descriptionKey: 'workflow.designer.nodeDesc.agent', description: 'Schedule AI Agent to execute tasks', descriptionEn: 'Schedule AI Agent to execute tasks' },
  { type: 'notification', category: 'execution', labelKey: 'workflow.designer.node.notification', label: 'Notification', labelEn: 'Notification', icon: 'SendOutlined', color: '#165DFF', descriptionKey: 'workflow.designer.nodeDesc.notification', description: 'Send notification message', descriptionEn: 'Send notification message' },
  { type: 'database', category: 'execution', labelKey: 'workflow.designer.node.database', label: 'Database', labelEn: 'Database', icon: 'DatabaseOutlined', color: '#165DFF', descriptionKey: 'workflow.designer.nodeDesc.database', description: 'Execute database operation', descriptionEn: 'Execute database operation' },
  { type: 'script', category: 'execution', labelKey: 'workflow.designer.node.script', label: 'Script', labelEn: 'Script', icon: 'CodeOutlined', color: '#165DFF', descriptionKey: 'workflow.designer.nodeDesc.script', description: 'Execute custom script', descriptionEn: 'Execute custom script' },
  { type: 'deviation_analysis', category: 'execution', labelKey: 'workflow.designer.node.deviationAnalysis', label: 'Deviation Analysis', labelEn: 'Deviation Analysis', icon: 'BranchesOutlined', color: '#165DFF', descriptionKey: 'workflow.designer.nodeDesc.deviationAnalysis', description: 'Analyze spec deviation', descriptionEn: 'Analyze spec deviation' },
  { type: 'quality_report', category: 'execution', labelKey: 'workflow.designer.node.qualityReport', label: 'Quality Report', labelEn: 'Quality Report', icon: 'AuditOutlined', color: '#165DFF', descriptionKey: 'workflow.designer.nodeDesc.qualityReport', description: 'Generate quality report', descriptionEn: 'Generate quality report' },
  { type: 'human_review', category: 'control', labelKey: 'workflow.designer.node.humanReview', label: 'Human Review', labelEn: 'Human Review', icon: 'AuditOutlined', color: '#FF7D00', descriptionKey: 'workflow.designer.nodeDesc.humanReview', description: 'Wait for human approval', descriptionEn: 'Wait for human approval' },
  { type: 'condition', category: 'control', labelKey: 'workflow.designer.node.condition', label: 'Condition', labelEn: 'Condition', icon: 'BranchesOutlined', color: '#8b5cf6', descriptionKey: 'workflow.designer.nodeDesc.condition', description: 'Conditional branch logic', descriptionEn: 'Conditional branch logic' },
  { type: 'loop', category: 'control', labelKey: 'workflow.designer.node.loop', label: 'Loop', labelEn: 'Loop', icon: 'RetweetOutlined', color: '#8b5cf6', descriptionKey: 'workflow.designer.nodeDesc.loop', description: 'Loop iteration', descriptionEn: 'Loop iteration' },
  { type: 'parallel', category: 'control', labelKey: 'workflow.designer.node.parallel', label: 'Parallel Gateway', labelEn: 'Parallel Gateway', icon: 'ForkOutlined', color: '#8b5cf6', descriptionKey: 'workflow.designer.nodeDesc.parallel', description: 'Parallel fork/join', descriptionEn: 'Parallel fork/join' },
  { type: 'end', category: 'end', labelKey: 'workflow.designer.node.end', label: 'End Node', labelEn: 'End Node', icon: 'StopOutlined', color: '#F53F3F', descriptionKey: 'workflow.designer.nodeDesc.end', description: 'Workflow end', descriptionEn: 'Workflow end' },
];

// ============ 节点配置类型 ============

export interface AgentNodeConfig {
  agentId?: string;
  agentName?: string;
  agentRole?: string;
  instructionSource?: AgentInstructionSource;
  taskInstruction?: string;
  contextIds?: string[];
  timeoutMinutes?: number;
  failureStrategy?: 'retry' | 'skip' | 'terminate';
  maxRetries?: number;
  artifactDocType?: string;
  artifactTitle?: string;
  outputVariableKey?: string;
  outputVariables?: Record<string, string>;
  qualityGateMode?: 'disabled' | 'warn' | 'pause' | 'fail';
  executionStrategy?: 'sync' | 'short_wait' | 'async';
  qualityProfileId?: string;
  qualityGateTimeoutSeconds?: number;
  minQualityScore?: number;
  maxDeviationCount?: number;
  maxWarningCount?: number;
  blockOnQualityTaskFailed?: boolean;
}

export interface NotificationNodeConfig {
  channelId?: string;
  channelName?: string;
  channelType?: string;
  messageTemplateId?: string;
  messageTemplateName?: string;
  title?: string;
  messageTemplate?: string;
}

export interface DocumentNodeConfig {
  documentKey?: string;
  documentType?: string;
  documentTitle?: string;
  submitButtonText?: string;
  description?: string;
}

export interface HumanReviewNodeConfig {
  reviewerType?: 'internal' | 'external';
  documentKey?: string;
  reviewerIds?: string[];
  reviewerRoles?: string[];
  externalReviewers?: Array<{ name: string; email: string }>;
  timeoutHours?: number;
  timeoutStrategy?: 'auto_pass' | 'escalate' | 'remind';
  messageTemplateId?: string;
  messageTemplateName?: string;
  notificationChannelIds?: string[];
  notificationChannels?: string[];
  onApprove?: 'continue';
  onReject?: { action: 'rollback'; rollbackToNodeId?: string };
}

export interface DeviationAnalysisNodeConfig {
  description?: string;
}

export interface QualityReportNodeConfig {
  description?: string;
}

export interface TriggerNodeConfig {
  description?: string;
  cronExpression?: string;
  timezone?: string;
  triggerInputs?: Record<string, any> | string;
  eventType?: 'spec_change' | 'git_push' | 'webhook' | 'custom';
  eventFilter?: string;
}

export interface EndNodeConfig {
  description?: string;
}

export interface ConditionNodeConfig {
  expression?: string;
  trueLabel?: string;
  falseLabel?: string;
}

export interface LoopNodeConfig {
  loopType?: 'count' | 'foreach' | 'while';
  maxIterations?: number;
  collection?: string;
  condition?: string;
}

export interface ParallelNodeConfig {
  gatewayType?: 'fork' | 'join';
  branches?: number;
}

export interface StartNodeConfig {
  description?: string;
}

export type NodeConfig =
  | AgentNodeConfig
  | DocumentNodeConfig
  | NotificationNodeConfig
  | HumanReviewNodeConfig
  | DeviationAnalysisNodeConfig
  | QualityReportNodeConfig
  | TriggerNodeConfig
  | EndNodeConfig
  | ConditionNodeConfig
  | LoopNodeConfig
  | ParallelNodeConfig
  | StartNodeConfig;

// ============ 工作流核心类型 ============

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  position: { x: number; y: number };
  config: WorkflowDataRecord;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  definition: WorkflowDefinition;
  recommendedAgentSkills: string[];
  isBuiltin: boolean;
  status: WorkflowStatus;
  triggerType?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/** 工作流模板统计数据 */
export interface WorkflowTemplateStats {
  activeWorkflows: number;
  avgSuccessRate: number;
  totalRuns24h: number;
}

export interface WorkflowInstance {
  id: string;
  templateId: string;
  templateName?: string;
  specId?: string;
  name: string;
  status: string;
  currentNodeId?: string;
  variables: WorkflowDataRecord;
  definition: WorkflowDefinition;
  triggerType?: string;
  nodeExecutions?: WorkflowNodeExecution[];
  startedAt?: string;
  completedAt?: string;
  updatedAt?: string;
  errorMessage?: string;
  createdBy?: string;
  createdAt: string;
}

export interface WorkflowNodeExecution {
  id: string;
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: string;
  inputData?: WorkflowDataRecord;
  outputData?: WorkflowNodeOutputData;
  errorMessage?: string;
  reviewSessionId?: string;
  actionUrl?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowTemplateNodeExecution {
  id: string;
  instanceId: string;
  instanceName: string;
  specId?: string;
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: string;
  inputData?: WorkflowDataRecord;
  outputData?: WorkflowNodeOutputData;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface WorkflowTemplateCreateDTO {
  name: string;
  description?: string;
  category: string;
  definition: WorkflowDefinition;
  recommendedAgentSkills?: string[];
}

export interface WorkflowTemplateUpdateDTO {
  name?: string;
  description?: string;
  category?: string;
  definition?: WorkflowDefinition;
  recommendedAgentSkills?: string[];
}

export interface WorkflowTemplateQueryDTO {
  page?: number;
  size?: number;
  keyword?: string;
  category?: string;
  isBuiltin?: boolean;
}

export interface WorkflowInstanceCreateDTO {
  templateId: string;
  specId?: string;
  name: string;
  variables?: WorkflowDataRecord;
}

export interface WorkflowInstanceQueryDTO {
  page?: number;
  size?: number;
  status?: string;
  specId?: string;
  triggerType?: string;
  keyword?: string;
}

// ============ 评审相关类型 ============

export interface ReviewSummary {
  totalComments: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  submittedCount: number;
  totalReviewers: number;
  hasCritical: boolean;
}

export interface ReviewComment {
  id: string;
  sessionId: string;
  reviewerId: string;
  level: string;
  category?: string;
  content: string;
  location?: string;
  createdAt: string;
}

export interface ReviewSessionReviewer {
  userId?: string;
  reviewerName?: string;
  role?: string;
  status?: string;
  submittedAt?: string;
}

export interface ReviewSession {
  id: string;
  specId: string;
  specName?: string;
  workflowInstanceId?: string;
  workflowNodeId?: string;
  workflowNodeLabel?: string;
  documentType: string;
  owner: string;
  ownerName?: string;
  reviewers: ReviewSessionReviewer[];
  deadline?: string;
  timeoutStrategy?: string;
  status: string;
  decisionStatus?: string;
  reviewActionUrl?: string;
  messageTemplateId?: string;
  approverId?: string;
  approverName?: string;
  approverAt?: string;
  comments?: ReviewComment[];
  summary?: ReviewSummary;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSessionCreateDTO {
  specId: string;
  workflowInstanceId?: string;
  workflowNodeId?: string;
  documentType: string;
  reviewers: Array<{ userId: string; role: string }>;
  deadlineHours?: number;
  timeoutStrategy?: string;
  reviewActionUrl?: string;
  messageTemplateId?: string;
}

export interface ReviewDecisionDTO {
  comment?: string;
  rollbackToNodeId?: string;
  modifyInstruction?: string;
}

export interface ReviewCommentCreateDTO {
  level: string;
  category?: string;
  content: string;
  location?: string;
}

// ============ 触发管理相关类型 ============

export interface TriggerConfigVO {
  templateId: string;
  templateName: string;
  category?: string;
  triggerType: string;
  templateStatus: string;
  enabled: boolean;
  cronExpression?: string;
  timezone?: string;
  cronHumanReadable?: string;
  eventType?: string;
  eventHook?: string;
  eventFilter?: string;
  triggerInputs?: Record<string, unknown>;
  lastTriggeredAt?: string;
  lastTriggerStatus?: string;
}

export interface ManualTriggerRequest {
  name?: string;
  variables?: Record<string, unknown>;
}

export interface ManualTriggerResultVO {
  instanceId: string;
  instanceName: string;
  status: string;
}

export interface TriggerStatsVO {
  manualCount: number;
  cronCount: number;
  cronEnabledCount: number;
  eventCount: number;
  eventEnabledCount: number;
}

export interface TriggerConfigUpdateRequest {
  triggerType?: string;
  cronExpression?: string;
  timezone?: string;
  eventType?: string;
  eventHook?: string;
  eventFilter?: string;
  triggerInputs?: Record<string, unknown>;
  enabled?: boolean;
}

export interface TriggerQueryDTO {
  page?: number;
  size?: number;
  keyword?: string;
  triggerType?: string;
}

/**
 * 监控报表相关类型定义
 * 与后端 DashboardVO / SystemHealthVO / ActiveAgentVO / TaskQueueVO / ReportDataVO / AuditLogVO 对齐
 */

/** 系统健康状态（对应后端 SystemHealthVO） */
export interface SystemHealth {
  status: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  serviceStatus: Record<string, string>;
}

/** 仪表盘数据（对应后端 DashboardVO） */
export interface Dashboard {
  activeAgentCount: number;
  taskQueueDepth: number;
  taskSuccessRate: number;
  avgExecutionTimeMs: number;
  todayTokenConsumption: number;
  deviationAlertCount: number;
  pendingApprovalCount: number;
  systemHealth: SystemHealth;
}

/** 活跃 Agent（对应后端 ActiveAgentVO） */
export interface ActiveAgent {
  agentId: string;
  agentName: string;
  agentType: string;
  currentTaskId?: string;
  progress: number;
  startTime: string;
}

/** 任务队列（对应后端 TaskQueueVO） */
export interface TaskQueue {
  totalPending: number;
  totalExecuting: number;
  queueByPriority: Record<string, number>;
  oldestTaskWaitMs: number;
}

/** 报表数据（对应后端 ReportDataVO） */
export interface ReportData {
  columns: string[];
  rows: any[][];
  summary: Record<string, any>;
  trend: Array<Record<string, any>>;
}

/** 报表模板（对应后端 ReportTemplateVO） */
export interface ReportTemplate {
  id: string;
  name: string;
  reportType: string;
  config: Record<string, any>;
  scheduleCron?: string;
  notifyChannels?: any[];
  createdAt: string;
}

/** 审计日志（对应后端 AuditLogVO） */
export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  resource: string;
  resourceId?: string;
  detail?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

/** 报表查询参数（对应后端 ReportQueryRequest） */
export interface ReportQueryDTO {
  timeRange?: string;
  startTime?: string;
  endTime?: string;
  groupBy?: string;
  projectIds?: string;
}

/** 创建报表模板请求（对应后端 ReportTemplateCreateRequest） */
export interface ReportTemplateCreateDTO {
  name: string;
  reportType: string;
  config: Record<string, any>;
  scheduleCron?: string;
  notifyChannels?: Array<Record<string, any>>;
}

/** 审计日志查询参数（对应后端 AuditLogQueryRequest） */
export interface AuditLogQueryDTO {
  userId?: string;
  action?: string;
  resource?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  size?: number;
}

export interface AgentTrace {
  traceId: string;
  agentId?: string;
  agentName?: string;
  status?: string;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  startedAt?: string;
  createdAt?: string;
}

export interface AgentTraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  agentId?: string;
  spanType: string;
  name: string;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  status?: string;
  startedAt?: string;
  createdAt?: string;
}

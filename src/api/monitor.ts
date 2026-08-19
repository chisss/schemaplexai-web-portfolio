/**
 * 监控报表 API 接口
 * 对应后端 MonitorController
 */
import request from './request';
import { useQuery } from '@tanstack/react-query';
import type { R, PageResult } from '@/types/common';
import type {
  Dashboard, ActiveAgent, TaskQueue, SystemHealth,
  ReportData, ReportTemplate, AuditLog,
  ReportQueryDTO, ReportTemplateCreateDTO, AuditLogQueryDTO,
  AgentTrace, AgentTraceSpan,
} from '@/types/monitor';

// ============ 仪表盘 ============

/** 获取监控仪表盘 */
export const fetchDashboard = () =>
  request.get<any, R<Dashboard>>('/monitor/dashboard');

/** 获取活跃 Agent 列表 */
export const fetchActiveAgents = () =>
  request.get<any, R<ActiveAgent[]>>('/monitor/agents/active');

/** 获取任务队列状态 */
export const fetchTaskQueue = () =>
  request.get<any, R<TaskQueue>>('/monitor/tasks/queue');

/** 获取系统健康状态 */
export const fetchSystemHealth = () =>
  request.get<any, R<SystemHealth>>('/monitor/system/health');

// ============ 报表 ============

/** 效率报表 */
export const fetchEfficiencyReport = (params: ReportQueryDTO) =>
  request.get<any, R<ReportData>>('/monitor/reports/efficiency', { params });

/** 质量报表 */
export const fetchQualityReport = (params: ReportQueryDTO) =>
  request.get<any, R<ReportData>>('/monitor/reports/quality', { params });

/** Agent 性能报表 */
export const fetchAgentPerformanceReport = (params: ReportQueryDTO & { agentIds?: string }) =>
  request.get<any, R<ReportData>>('/monitor/reports/agent-performance', { params });

/** 项目进度报表 */
export const fetchProjectProgressReport = (params: ReportQueryDTO) =>
  request.get<any, R<ReportData>>('/monitor/reports/project-progress', { params });

/** 团队协作报表 */
export const fetchTeamCollaborationReport = (params: ReportQueryDTO) =>
  request.get<any, R<ReportData>>('/monitor/reports/team-collaboration', { params });

/** 自定义报表查询 */
export const fetchCustomReport = (queryConfig: Record<string, any>) =>
  request.post<any, R<ReportData>>('/monitor/reports/custom', queryConfig);

/** 分页查询报表模板 */
export const fetchReportTemplates = (params: { reportType?: string; page?: number; size?: number }) =>
  request.get<any, R<PageResult<ReportTemplate>>>('/monitor/reports/templates', { params });

/** 创建报表模板 */
export const createReportTemplate = (data: ReportTemplateCreateDTO) =>
  request.post<any, R<ReportTemplate>>('/monitor/reports/templates', data);

// ============ 审计日志 ============

/** 分页查询审计日志 */
export const fetchAuditLogs = (params: AuditLogQueryDTO) =>
  request.get<any, R<PageResult<AuditLog>>>('/monitor/audit-logs', { params });

/** 获取审计日志详情 */
export const fetchAuditLogDetail = (id: string) =>
  request.get<any, R<AuditLog>>(`/monitor/audit-logs/${id}`);

/** 获取 Agent Trace 列表 */
export const fetchAgentTraces = (agentId: string) =>
  request.get<any, R<AgentTrace[]>>(`/monitor/traces/agent/${agentId}`);

/** 获取最近 Agent Trace 列表 */
export const fetchRecentAgentTraces = () =>
  request.get<any, R<AgentTrace[]>>('/monitor/traces/recent');

/** 获取 Trace Span 列表 */
export const fetchTraceSpans = (traceId: string) =>
  request.get<any, R<AgentTraceSpan[]>>(`/monitor/traces/${traceId}/spans`);

// ============ TanStack Query Hooks ============

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    select: (res) => res.data,
    refetchInterval: 30000, // 30秒自动刷新
  });
}

export function useActiveAgents() {
  return useQuery({
    queryKey: ['active-agents'],
    queryFn: fetchActiveAgents,
    select: (res) => res.data,
    refetchInterval: 10000, // 10秒自动刷新
  });
}

export function useTaskQueue() {
  return useQuery({
    queryKey: ['task-queue'],
    queryFn: fetchTaskQueue,
    select: (res) => res.data,
    refetchInterval: 10000,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: fetchSystemHealth,
    select: (res) => res.data,
    refetchInterval: 30000,
  });
}

export function useEfficiencyReport(params: ReportQueryDTO) {
  return useQuery({
    queryKey: ['report-efficiency', params],
    queryFn: () => fetchEfficiencyReport(params),
    select: (res) => res.data,
  });
}

export function useQualityReport(params: ReportQueryDTO) {
  return useQuery({
    queryKey: ['report-quality', params],
    queryFn: () => fetchQualityReport(params),
    select: (res) => res.data,
  });
}

export function useAgentPerformanceReport(params: ReportQueryDTO & { agentIds?: string }) {
  return useQuery({
    queryKey: ['report-agent-performance', params],
    queryFn: () => fetchAgentPerformanceReport(params),
    select: (res) => res.data,
  });
}

export function useProjectProgressReport(params: ReportQueryDTO) {
  return useQuery({
    queryKey: ['report-project-progress', params],
    queryFn: () => fetchProjectProgressReport(params),
    select: (res) => res.data,
  });
}

export function useTeamCollaborationReport(params: ReportQueryDTO) {
  return useQuery({
    queryKey: ['report-team-collaboration', params],
    queryFn: () => fetchTeamCollaborationReport(params),
    select: (res) => res.data,
  });
}

export function useAuditLogs(params: AuditLogQueryDTO) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => fetchAuditLogs(params),
    select: (res) => res.data,
  });
}

export function useAgentTraces(agentId?: string) {
  return useQuery({
    queryKey: ['agent-traces', agentId],
    queryFn: () => fetchAgentTraces(String(agentId)),
    select: (res) => res.data,
    enabled: !!agentId,
    refetchInterval: 5000,
  });
}

export function useRecentAgentTraces() {
  return useQuery({
    queryKey: ['recent-agent-traces'],
    queryFn: fetchRecentAgentTraces,
    select: (res) => res.data,
    refetchInterval: 5000,
  });
}

export function useTraceSpans(traceId?: string) {
  return useQuery({
    queryKey: ['trace-spans', traceId],
    queryFn: () => fetchTraceSpans(String(traceId)),
    select: (res) => res.data,
    enabled: !!traceId,
    refetchInterval: 5000,
  });
}

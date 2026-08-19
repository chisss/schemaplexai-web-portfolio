/**
 * 工作流管理 API 接口
 * 对应后端 WorkflowController
 */
import request from './request';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { R, PageResult } from '@/types/common';
import type {
  WorkflowTemplate, WorkflowInstance, WorkflowNodeExecution,
  WorkflowTemplateNodeExecution,
  WorkflowTemplateCreateDTO, WorkflowTemplateUpdateDTO, WorkflowTemplateQueryDTO,
  WorkflowInstanceCreateDTO, WorkflowInstanceQueryDTO,
  WorkflowTemplateStats,
  TriggerConfigVO, TriggerStatsVO, ManualTriggerResultVO,
  ManualTriggerRequest, TriggerConfigUpdateRequest, TriggerQueryDTO,
} from '@/types/workflow';

// ============ 模板管理 ============

/** 分页查询工作流模板 */
export const fetchWorkflowTemplates = (params: WorkflowTemplateQueryDTO) =>
  request.get<any, R<PageResult<WorkflowTemplate>>>('/workflows/templates', { params });

/** 获取工作流模板详情 */
export const fetchWorkflowTemplate = (id: string) =>
  request.get<any, R<WorkflowTemplate>>(`/workflows/templates/${id}`);

/** 创建工作流模板 */
export const createWorkflowTemplate = (data: WorkflowTemplateCreateDTO) =>
  request.post<any, R<WorkflowTemplate>>('/workflows/templates', data);

/** 更新工作流模板 */
export const updateWorkflowTemplate = (id: string, data: WorkflowTemplateUpdateDTO) =>
  request.put<any, R<WorkflowTemplate>>(`/workflows/templates/${id}`, data);

/** 删除工作流模板 */
export const deleteWorkflowTemplate = (id: string) =>
  request.delete<any, R<void>>(`/workflows/templates/${id}`);

/** 获取工作流模板统计数据 */
export const fetchWorkflowTemplateStats = () =>
  request.get<any, R<WorkflowTemplateStats>>('/workflows/templates/stats');

/** 切换模板启用/停用状态 */
export const toggleWorkflowTemplateStatus = (id: string) =>
  request.put<any, R<WorkflowTemplate>>(`/workflows/templates/${id}/toggle-status`);

// ============ 实例管理 ============

/** 分页查询工作流实例 */
export const fetchWorkflowInstances = (params: WorkflowInstanceQueryDTO) =>
  request.get<any, R<PageResult<WorkflowInstance>>>('/workflows/instances', { params });

/** 获取工作流实例详情 */
export const fetchWorkflowInstance = (id: string) =>
  request.get<any, R<WorkflowInstance>>(`/workflows/instances/${id}`);

/** 创建工作流实例 */
export const createWorkflowInstance = (data: WorkflowInstanceCreateDTO) =>
  request.post<any, R<WorkflowInstance>>('/workflows/instances', data);

/** 启动工作流实例 */
export const startWorkflowInstance = (id: string) =>
  request.post<any, R<WorkflowInstance>>(`/workflows/instances/${id}/start`);

/** 暂停工作流实例 */
export const pauseWorkflowInstance = (id: string) =>
  request.post<any, R<WorkflowInstance>>(`/workflows/instances/${id}/pause`);

/** 恢复工作流实例 */
export const resumeWorkflowInstance = (id: string) =>
  request.post<any, R<WorkflowInstance>>(`/workflows/instances/${id}/resume`);

/** 终止工作流实例 */
export const terminateWorkflowInstance = (id: string) =>
  request.post<any, R<void>>(`/workflows/instances/${id}/terminate`);

// ============ 节点操作 ============

/** 获取节点执行记录 */
export const fetchNodeExecutions = (instanceId: string) =>
  request.get<any, R<WorkflowNodeExecution[]>>(`/workflows/instances/${instanceId}/nodes`);

/** 审批通过节点 */
export const approveNode = (instanceId: string, nodeId: string, comment?: string) =>
  request.post<any, R<void>>(`/workflows/instances/${instanceId}/nodes/${nodeId}/approve`, null, { params: { comment } });

/** 审批拒绝节点 */
export const rejectNode = (instanceId: string, nodeId: string, comment?: string, rollbackToNodeId?: string) =>
  request.post<any, R<void>>(`/workflows/instances/${instanceId}/nodes/${nodeId}/reject`, null, { params: { comment, rollbackToNodeId } });

/** 请求修改节点 */
export const modifyNode = (instanceId: string, nodeId: string, modifyInstruction: string) =>
  request.post<any, R<void>>(`/workflows/instances/${instanceId}/nodes/${nodeId}/modify`, null, { params: { modifyInstruction } });

// ============ TanStack Query Hooks ============

export function useWorkflowTemplates(params: WorkflowTemplateQueryDTO) {
  return useQuery({
    queryKey: ['workflow-templates', params],
    queryFn: () => fetchWorkflowTemplates(params),
    select: (res) => res.data,
  });
}

export function useWorkflowTemplate(id: string) {
  return useQuery({
    queryKey: ['workflow-template', id],
    queryFn: () => fetchWorkflowTemplate(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useWorkflowInstances(params: WorkflowInstanceQueryDTO) {
  return useQuery({
    queryKey: ['workflow-instances', params],
    queryFn: () => fetchWorkflowInstances(params),
    select: (res) => res.data,
  });
}

export function useWorkflowInstance(id: string) {
  return useQuery({
    queryKey: ['workflow-instance', id],
    queryFn: () => fetchWorkflowInstance(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useNodeExecutions(instanceId: string) {
  return useQuery({
    queryKey: ['node-executions', instanceId],
    queryFn: () => fetchNodeExecutions(instanceId),
    select: (res) => res.data,
    enabled: !!instanceId,
  });
}

export function useCreateWorkflowTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkflowTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
    },
  });
}

export function useUpdateWorkflowTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkflowTemplateUpdateDTO }) =>
      updateWorkflowTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-template'] });
    },
  });
}

export function useDeleteWorkflowTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkflowTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-template-stats'] });
    },
  });
}

export function useWorkflowTemplateStats() {
  return useQuery({
    queryKey: ['workflow-template-stats'],
    queryFn: () => fetchWorkflowTemplateStats(),
    select: (res) => res.data,
  });
}

export function useToggleWorkflowTemplateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleWorkflowTemplateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-template-stats'] });
    },
  });
}

export function useCreateWorkflowInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkflowInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-instances'] });
    },
  });
}

export function useStartWorkflowInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startWorkflowInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-instances'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-instance'] });
    },
  });
}

export function usePauseWorkflowInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pauseWorkflowInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-instances'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-instance'] });
    },
  });
}

export function useResumeWorkflowInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resumeWorkflowInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-instances'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-instance'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-node-executions'] });
    },
  });
}

export function useTerminateWorkflowInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: terminateWorkflowInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-instances'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-instance'] });
    },
  });
}

/** AI自动编排工作流节点 */
export const aiArrangeWorkflow = (templateId: string, data: { prompt: string; specId?: string }) =>
  request.post<any, R<any>>(`/workflows/templates/${templateId}/ai-arrange`, data, {
    // AI 编排依赖模型推理，真实场景下可能超过通用 30 秒超时阈值。
    timeout: 90000,
  });

export function useAiArrangeWorkflow() {
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: { prompt: string; specId?: string } }) =>
      aiArrangeWorkflow(templateId, data),
  });
}

/** 获取工作流实例节点执行列表 */
export const fetchWorkflowNodeExecutions = (instanceId: string) =>
  request.get<any, R<WorkflowNodeExecution[]>>(`/workflows/instances/${instanceId}/nodes`);

/** 获取模板节点最近执行日志 */
export const fetchWorkflowTemplateNodeExecutions = (templateId: string, nodeId: string, size = 10) =>
  request.get<any, R<WorkflowTemplateNodeExecution[]>>(`/workflows/templates/${templateId}/nodes/${nodeId}/executions`, { params: { size } });

export function useWorkflowNodeExecutions(instanceId: string) {
  return useQuery({
    queryKey: ['workflow-node-executions', instanceId],
    queryFn: () => fetchWorkflowNodeExecutions(instanceId),
    select: (res) => res.data,
    enabled: !!instanceId,
  });
}

export function useWorkflowTemplateNodeExecutions(templateId: string, nodeId: string, size = 10, enabled = true) {
  return useQuery({
    queryKey: ['workflow-template-node-executions', templateId, nodeId, size],
    queryFn: () => fetchWorkflowTemplateNodeExecutions(templateId, nodeId, size),
    select: (res) => res.data ?? [],
    enabled: enabled && !!templateId && !!nodeId,
  });
}

// ============ 触发管理 ============

export const fetchTriggerStats = () =>
  request.get<any, R<TriggerStatsVO>>('/workflows/triggers/stats');

export const fetchTriggerConfigs = (params: TriggerQueryDTO) =>
  request.get<any, R<PageResult<TriggerConfigVO>>>('/workflows/triggers', { params });

export const fetchTriggerConfig = (templateId: string) =>
  request.get<any, R<TriggerConfigVO>>(`/workflows/triggers/${templateId}`);

export const updateTriggerConfig = (templateId: string, data: TriggerConfigUpdateRequest) =>
  request.put<any, R<TriggerConfigVO>>(`/workflows/triggers/${templateId}/config`, data);

export const toggleTrigger = (templateId: string, enabled: boolean) =>
  request.put<any, R<TriggerConfigVO>>(`/workflows/triggers/${templateId}/toggle`, null, { params: { enabled } });

export const fireTrigger = (templateId: string, data?: ManualTriggerRequest) =>
  request.post<any, R<ManualTriggerResultVO>>(`/workflows/triggers/${templateId}/fire`, data ?? {});

export const fetchRecentExecutions = (templateId: string, limit = 5) =>
  request.get<any, R<WorkflowInstance[]>>(`/workflows/triggers/${templateId}/recent-executions`, { params: { limit } });

export function useTriggerStats() {
  return useQuery({
    queryKey: ['trigger-stats'],
    queryFn: fetchTriggerStats,
    select: (res) => res.data,
  });
}

export function useTriggerConfigs(params: TriggerQueryDTO) {
  return useQuery({
    queryKey: ['trigger-configs', params],
    queryFn: () => fetchTriggerConfigs(params),
    select: (res) => res.data,
  });
}

export function useTriggerConfig(templateId: string) {
  return useQuery({
    queryKey: ['trigger-config', templateId],
    queryFn: () => fetchTriggerConfig(templateId),
    select: (res) => res.data,
    enabled: !!templateId,
  });
}

export function useUpdateTriggerConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: TriggerConfigUpdateRequest }) =>
      updateTriggerConfig(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trigger-configs'] });
      queryClient.invalidateQueries({ queryKey: ['trigger-config'] });
      queryClient.invalidateQueries({ queryKey: ['trigger-stats'] });
    },
  });
}

export function useToggleTrigger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, enabled }: { templateId: string; enabled: boolean }) =>
      toggleTrigger(templateId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trigger-configs'] });
      queryClient.invalidateQueries({ queryKey: ['trigger-config'] });
      queryClient.invalidateQueries({ queryKey: ['trigger-stats'] });
    },
  });
}

export function useFireTrigger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data?: ManualTriggerRequest }) =>
      fireTrigger(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trigger-configs'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-instances'] });
    },
  });
}

export function useRecentExecutions(templateId: string, limit = 5) {
  return useQuery({
    queryKey: ['trigger-recent-executions', templateId, limit],
    queryFn: () => fetchRecentExecutions(templateId, limit),
    select: (res) => res.data,
    enabled: !!templateId,
  });
}

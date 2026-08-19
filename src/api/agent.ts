/**
 * Agent API 接口
 * 对应后端 AgentController
 */
import request from './request';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { R, PageResult } from '@/types/common';
import type {
  Agent, AgentCreateDTO, AgentUpdateDTO, AgentQueryDTO,
  AgentConfig, AgentConfigDTO,
  AgentTeamMember, AgentTeamMemberBatchDTO,
  AgentContextBinding, AgentContextBindingCreateDTO,
  AgentToolBinding, AgentToolBindingBatchDTO,
  AgentExecuteDTO, AgentExecuteResultVO, ApprovalDecisionDTO,
  AgentExecution, AgentExecutionLog, AgentExecutionQueryDTO,
  ConversationMessage,
  AgentChatAttachment, DirectChatDTO, DirectChatResponse, ImageGenerationDTO, ImageGenerationResponse,
  AgentInstructionsCheckResult, InitInstructionsDTO,
  BuiltinTool, AvailableTool,
  MemberToolBindingBatchDTO, MemberToolBindingDTO,
  AgentTeamMemberContextBinding, MemberContextBindingDTO,
} from '@/types/agent';

// ============ 基础请求函数 ============

export const fetchAgentList = (params: AgentQueryDTO) =>
  request.get<any, R<PageResult<Agent>>>('/agents', { params });

export const fetchAllAgents = () =>
  request.get<any, R<Agent[]>>('/agents/all');

export const fetchSystemAgent = () =>
  request.get<any, R<Agent>>('/agents/system/default');

export const fetchAgentDetail = (id: string) =>
  request.get<any, R<Agent>>(`/agents/${id}`);

export const createAgent = (data: AgentCreateDTO) =>
  request.post<any, R<Agent>>('/agents', data);

export const updateAgent = (id: string, data: AgentUpdateDTO) =>
  request.put<any, R<Agent>>(`/agents/${id}`, data);

export const deleteAgent = (id: string) =>
  request.delete<any, R<void>>(`/agents/${id}`);

export const updateAgentStatus = (id: string, status: string) =>
  request.put<any, R<void>>(`/agents/${id}/status`, null, { params: { status } });

// -- 配置管理 --
export const fetchAgentConfigs = (id: string) =>
  request.get<any, R<AgentConfig[]>>(`/agents/${id}/configs`);

export const saveAgentConfig = (id: string, data: AgentConfigDTO) =>
  request.post<any, R<AgentConfig>>(`/agents/${id}/configs`, data);

export const deleteAgentConfig = (id: string, configId: string) =>
  request.delete<any, R<void>>(`/agents/${id}/configs/${configId}`);

// -- 团队成员管理 --
export const fetchTeamMembers = (id: string) =>
  request.get<any, R<AgentTeamMember[]>>(`/agents/${id}/team-members`);

export const saveTeamMembers = (id: string, data: AgentTeamMemberBatchDTO) =>
  request.post<any, R<AgentTeamMember[]>>(`/agents/${id}/team-members`, data);

export const deleteTeamMember = (id: string, memberId: string) =>
  request.delete<any, R<void>>(`/agents/${id}/team-members/${memberId}`);

// -- 上下文绑定管理 --
export const fetchContextBindings = (id: string) =>
  request.get<any, R<AgentContextBinding[]>>(`/agents/${id}/context-bindings`);

export const createContextBinding = (id: string, data: AgentContextBindingCreateDTO) =>
  request.post<any, R<AgentContextBinding>>(`/agents/${id}/context-bindings`, data);

export const deleteContextBinding = (id: string, bindingId: string) =>
  request.delete<any, R<void>>(`/agents/${id}/context-bindings/${bindingId}`);

// -- 工具绑定管理 --
export const fetchAgentToolBindings = (id: string) =>
  request.get<any, R<AgentToolBinding[]>>(`/agents/${id}/tools`);

export const saveAgentToolBindings = (id: string, data: AgentToolBindingBatchDTO) =>
  request.put<any, R<AgentToolBinding[]>>(`/agents/${id}/tools`, data);

// ============ TanStack Query Hooks ============

export function useAgentList(params: AgentQueryDTO) {
  return useQuery({
    queryKey: ['agents', params],
    queryFn: () => fetchAgentList(params),
    select: (res) => res.data,
  });
}

export function useAllAgents() {
  return useQuery({
    queryKey: ['agents', 'all'],
    queryFn: fetchAllAgents,
    select: (res) => res.data ?? [],
  });
}

export function useSystemAgent() {
  return useQuery({
    queryKey: ['agent', 'system-default'],
    queryFn: fetchSystemAgent,
    select: (res) => res.data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAgentDetail(id: string) {
  return useQuery({
    queryKey: ['agent', id],
    queryFn: () => fetchAgentDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useAgentConfigs(id: string) {
  return useQuery({
    queryKey: ['agent-configs', id],
    queryFn: () => fetchAgentConfigs(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgentUpdateDTO }) => updateAgent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useActivateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => updateAgentStatus(id, 'active'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useDeactivateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => updateAgentStatus(id, 'inactive'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useSaveAgentConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgentConfigDTO }) => saveAgentConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-configs'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}

export function useDeleteAgentConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, configId }: { id: string; configId: string }) => deleteAgentConfig(id, configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-configs'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}

// -- 团队成员 Hooks --
export function useTeamMembers(id: string) {
  return useQuery({
    queryKey: ['team-members', id],
    queryFn: () => fetchTeamMembers(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useSaveTeamMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgentTeamMemberBatchDTO }) => saveTeamMembers(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, memberId }: { id: string; memberId: string }) => deleteTeamMember(id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}

// -- 上下文绑定 Hooks --
export function useContextBindings(id: string) {
  return useQuery({
    queryKey: ['context-bindings', id],
    queryFn: () => fetchContextBindings(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateContextBinding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgentContextBindingCreateDTO }) => createContextBinding(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['context-bindings'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}

export function useDeleteContextBinding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bindingId }: { id: string; bindingId: string }) => deleteContextBinding(id, bindingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['context-bindings'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}

// -- 工具绑定 Hooks --
export function useAgentToolBindings(id: string) {
  return useQuery({
    queryKey: ['agent-tools', id],
    queryFn: () => fetchAgentToolBindings(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useSaveAgentToolBindings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgentToolBindingBatchDTO }) => saveAgentToolBindings(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['agent-tools', id] });
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
    },
  });
}

// ============ 执行管理 ============

export const executeAgent = (id: string, data: AgentExecuteDTO) =>
  request.post<any, R<AgentExecuteResultVO>>(`/agents/${id}/execute`, data);

export const uploadAgentChatAttachment = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post<FormData, R<AgentChatAttachment>>('/agents/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const directChat = (data: DirectChatDTO) =>
  request.post<any, R<DirectChatResponse>>('/chat/direct', data);

export const generateImage = (data: ImageGenerationDTO) =>
  request.post<any, R<ImageGenerationResponse>>('/chat/images/generations', data);

export const fetchExecutions = (id: string, params: AgentExecutionQueryDTO) =>
  request.get<any, R<PageResult<AgentExecution>>>(`/agents/${id}/executions`, { params });

export const fetchExecutionDetail = (id: string, execId: string) =>
  request.get<any, R<AgentExecution>>(`/agents/${id}/executions/${execId}`);

export const fetchExecutionLogs = (id: string, execId: string, params: AgentExecutionQueryDTO) =>
  request.get<any, R<PageResult<AgentExecutionLog>>>(`/agents/${id}/executions/${execId}/logs`, { params });

export const fetchExecutionLogDetail = (id: string, execId: string, logId: string) =>
  request.get<any, R<AgentExecutionLog>>(`/agents/${id}/executions/${execId}/logs/${logId}`);

export const fetchConversationHistory = (conversationId: string) =>
  request.get<any, R<ConversationMessage[]>>(`/agents/conversations/${conversationId}/history`);

export const stopExecution = (id: string, execId: string) =>
  request.post<any, R<void>>(`/agents/${id}/executions/${execId}/stop`);

export const cancelExecution = (id: string, execId: string) =>
  request.post<any, R<void>>(`/agents/${id}/executions/${execId}/cancel`);

export const submitExecutionInput = (
  id: string,
  execId: string,
  data: { message?: string; options?: Record<string, unknown> } | ApprovalDecisionDTO,
) => request.post<any, R<void>>(`/agents/${id}/executions/${execId}/input`, data);

export function useExecuteAgent() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgentExecuteDTO }) => executeAgent(id, data),
  });
}

export function useUploadAgentChatAttachment() {
  return useMutation({
    mutationFn: uploadAgentChatAttachment,
  });
}

export function useDirectChat() {
  return useMutation({
    mutationFn: directChat,
  });
}

export function useExecutions(id: string, params: AgentExecutionQueryDTO) {
  return useQuery({
    queryKey: ['agent-executions', id, params],
    queryFn: () => fetchExecutions(id, params),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useExecutionDetail(id: string, execId: string) {
  return useQuery({
    queryKey: ['agent-execution', id, execId],
    queryFn: () => fetchExecutionDetail(id, execId),
    select: (res) => res.data,
    enabled: !!id && !!execId,
  });
}

export function useExecutionLogs(id: string, execId: string, params: AgentExecutionQueryDTO) {
  return useQuery({
    queryKey: ['agent-execution-logs', id, execId, params],
    queryFn: () => fetchExecutionLogs(id, execId, params),
    select: (res) => res.data,
    enabled: !!id && !!execId,
  });
}

export function useConversationHistory(conversationId?: string) {
  return useQuery({
    queryKey: ['agent-conversation-history', conversationId],
    queryFn: () => fetchConversationHistory(conversationId as string),
    select: (res) => res.data,
    enabled: !!conversationId,
  });
}

export function useStopExecution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, execId }: { id: string; execId: string }) => stopExecution(id, execId),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['agent-executions', id] });
    },
  });
}

// ============ 专属指令 ============

export const checkAgentInstructions = (agentId: string) =>
  request.get<any, R<AgentInstructionsCheckResult>>(`/agents/${agentId}/instructions-check`);

export const initAgentInstructions = (agentId: string, data: InitInstructionsDTO) =>
  request.post<any, R<{ itemId: string }>>(`/agents/${agentId}/instructions/init`, data);

export function useCheckAgentInstructions(agentId: string) {
  return useQuery({
    queryKey: ['agent-instructions-check', agentId],
    queryFn: () => checkAgentInstructions(agentId),
    select: (res) => res.data,
    enabled: !!agentId,
  });
}

export function useInitAgentInstructions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, data }: { agentId: string; data: InitInstructionsDTO }) =>
      initAgentInstructions(agentId, data),
    onSuccess: (_data, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: ['agent-instructions-check', agentId] });
      queryClient.invalidateQueries({ queryKey: ['context-bindings', agentId] });
    },
  });
}

// ============ 内置工具 & 可用工具 ============

export const fetchBuiltinTools = () =>
  request.get<any, R<BuiltinTool[]>>('/tools/builtin');

export const fetchAvailableTools = (agentId: string) =>
  request.get<any, R<AvailableTool[]>>(`/agents/${agentId}/available-tools`);

export function useBuiltinTools() {
  return useQuery({
    queryKey: ['builtin-tools'],
    queryFn: fetchBuiltinTools,
    select: (res) => res.data ?? [],
  });
}

export function useAvailableTools(agentId: string) {
  return useQuery({
    queryKey: ['available-tools', agentId],
    queryFn: () => fetchAvailableTools(agentId),
    select: (res) => res.data ?? [],
    enabled: !!agentId,
  });
}

// ============ 成员工具绑定 ============

export const fetchMemberToolBindings = (memberId: string) =>
  request.get<any, R<AgentToolBinding[]>>(`/agent-members/${memberId}/tools`);

export const saveMemberToolBindings = (
  memberId: string,
  data: MemberToolBindingBatchDTO | MemberToolBindingDTO[],
) => request.put<any, R<AgentToolBinding[]>>(
  `/agent-members/${memberId}/tools`,
  Array.isArray(data) ? data : data.tools,
);

export const deleteMemberToolBinding = (memberId: string, bindingId: string) =>
  request.delete<any, R<void>>(`/agent-members/${memberId}/tools/${bindingId}`);

export const fetchMemberContextBindings = (memberId: string) =>
  request.get<any, R<AgentTeamMemberContextBinding[]>>(`/agent-members/${memberId}/contexts`);

export const saveMemberContextBindings = (memberId: string, data: MemberContextBindingDTO[]) =>
  request.put<any, R<AgentTeamMemberContextBinding[]>>(`/agent-members/${memberId}/contexts`, data);

export const deleteMemberContextBinding = (memberId: string, bindingId: string) =>
  request.delete<any, R<void>>(`/agent-members/${memberId}/contexts/${bindingId}`);

export function useMemberToolBindings(memberId: string) {
  return useQuery({
    queryKey: ['member-tools', memberId],
    queryFn: () => fetchMemberToolBindings(memberId),
    select: (res) => res.data ?? [],
    enabled: !!memberId,
  });
}

export function useSaveMemberToolBindings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: MemberToolBindingBatchDTO | MemberToolBindingDTO[] }) =>
      saveMemberToolBindings(memberId, data),
    onSuccess: (_data, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: ['member-tools', memberId] });
      queryClient.invalidateQueries({ queryKey: ['member-tools-batch'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

export function useDeleteMemberToolBinding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, bindingId }: { memberId: string; bindingId: string }) =>
      deleteMemberToolBinding(memberId, bindingId),
    onSuccess: (_data, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: ['member-tools', memberId] });
      queryClient.invalidateQueries({ queryKey: ['member-tools-batch'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

export function useMemberContextBindings(memberId: string) {
  return useQuery({
    queryKey: ['member-contexts', memberId],
    queryFn: () => fetchMemberContextBindings(memberId),
    select: (res) => res.data ?? [],
    enabled: !!memberId,
  });
}

export function useSaveMemberContextBindings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: MemberContextBindingDTO[] }) =>
      saveMemberContextBindings(memberId, data),
    onSuccess: (_data, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: ['member-contexts', memberId] });
      queryClient.invalidateQueries({ queryKey: ['member-contexts-batch'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}

export function useDeleteMemberContextBinding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, bindingId }: { memberId: string; bindingId: string }) =>
      deleteMemberContextBinding(memberId, bindingId),
    onSuccess: (_data, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: ['member-contexts', memberId] });
      queryClient.invalidateQueries({ queryKey: ['member-contexts-batch'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}

export function useMemberToolBindingsBatch(memberIds: string[]) {
  return useQuery({
    queryKey: ['member-tools-batch', memberIds],
    queryFn: async () => {
      const results = await Promise.all(memberIds.map(async (memberId) => {
        const response = await fetchMemberToolBindings(memberId);
        return [memberId, response.data ?? []] as const;
      }));
      return Object.fromEntries(results) as Record<string, AgentToolBinding[]>;
    },
    enabled: memberIds.length > 0,
  });
}

export function useMemberContextBindingsBatch(memberIds: string[]) {
  return useQuery({
    queryKey: ['member-contexts-batch', memberIds],
    queryFn: async () => {
      const results = await Promise.all(memberIds.map(async (memberId) => {
        const response = await fetchMemberContextBindings(memberId);
        return [memberId, response.data ?? []] as const;
      }));
      return Object.fromEntries(results) as Record<string, AgentTeamMemberContextBinding[]>;
    },
    enabled: memberIds.length > 0,
  });
}

// ============ 会话回滚 ============

export function rollbackConversation(conversationId: string, targetTurnIndex: number) {
  return request.post(`/conversations/${conversationId}/rollback`, { targetTurnIndex });
}

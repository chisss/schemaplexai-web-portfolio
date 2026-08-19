/**
 * Spec API 接口
 * 对应后端 SpecController
 */
import request from './request';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { R, PageResult } from '@/types/common';
import type {
  Spec, SpecDocument, SpecVersion, SpecCreateDTO, SpecUpdateDTO, SpecQueryDTO,
  SpecWorkbench, SpecDocumentSubmitDTO, SpecWorkflowStartDTO,
} from '@/types/spec';
import type { WorkflowInstance } from '@/types/workflow';

// ============ 基础请求函数 ============

/** 分页查询 Spec 列表 */
export const fetchSpecList = (params: SpecQueryDTO) =>
  request.get<any, R<PageResult<Spec>>>('/specs', { params });

/** 获取 Spec 详情（含文档） */
export const fetchSpecDetail = (id: string) =>
  request.get<any, R<Spec>>(`/specs/${id}`);

/** 获取 Spec 工作流工作台 */
export const fetchSpecWorkbench = (id: string) =>
  request.get<any, R<SpecWorkbench>>(`/specs/${id}/workbench`);

/** 创建 Spec */
export const createSpec = (data: SpecCreateDTO) =>
  request.post<any, R<Spec>>('/specs', data);

/** 更新 Spec 基本信息 */
export const updateSpec = (id: string, data: SpecUpdateDTO) =>
  request.put<any, R<Spec>>(`/specs/${id}`, data);

/** 填写原始需求并启动工作流 */
export const startSpecWorkflow = (id: string, data: SpecWorkflowStartDTO) =>
  request.post<any, R<Spec>>(`/specs/${id}/workflow/start`, data);

/** 删除 Spec */
export const deleteSpec = (id: string) =>
  request.delete<any, R<void>>(`/specs/${id}`);

/** 提交审批 */
export const submitSpec = (id: string, docType: string) =>
  request.post<any, R<void>>(`/specs/${id}/submit`, null, { params: { docType } });

/** 审批通过 */
export const approveSpec = (id: string) =>
  request.post<any, R<void>>(`/specs/${id}/approve`);

/** 审批驳回 */
export const rejectSpec = (id: string) =>
  request.post<any, R<void>>(`/specs/${id}/reject`);

/** 获取 Spec 文档 */
export const fetchSpecDocument = (specId: string, docType: string) =>
  request.get<any, R<SpecDocument>>(`/specs/${specId}/documents/${docType}`);

/** 保存/更新 Spec 文档 */
export const updateSpecDocument = (specId: string, docType: string, data: { content: string; changeSummary?: string }) =>
  request.put<any, R<SpecDocument>>(`/specs/${specId}/documents/${docType}`, data);

/** 保存工作台文档节点草稿 */
export const saveWorkbenchDocument = (specId: string, nodeId: string, data: { content: string; changeSummary?: string }) =>
  request.put<any, R<SpecDocument>>(`/specs/${specId}/workbench/nodes/${nodeId}/document`, data);

/** 提交工作台文档节点 */
export const submitWorkbenchDocument = (specId: string, nodeId: string, data: SpecDocumentSubmitDTO) =>
  request.post<any, R<SpecDocument>>(`/specs/${specId}/workbench/nodes/${nodeId}/submit`, data);

/** 获取文档版本历史 */
export const fetchSpecVersions = (specId: string, docType: string) =>
  request.get<any, R<SpecVersion[]>>(`/specs/${specId}/versions`, { params: { docType } });

// ============ TanStack Query Hooks ============

export function useSpecList(params: SpecQueryDTO) {
  return useQuery({
    queryKey: ['specs', params],
    queryFn: () => fetchSpecList(params),
    select: (res) => res.data,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });
}

export function useSpecDetail(id: string) {
  return useQuery({
    queryKey: ['spec', id],
    queryFn: () => fetchSpecDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useSpecWorkbench(id: string) {
  return useQuery({
    queryKey: ['spec-workbench', id],
    queryFn: () => fetchSpecWorkbench(id),
    select: (res) => res.data,
    enabled: !!id,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });
}

export function useSpecDocument(specId: string, docType: string) {
  return useQuery({
    queryKey: ['spec-document', specId, docType],
    queryFn: () => fetchSpecDocument(specId, docType),
    select: (res) => res.data,
    enabled: !!specId,
  });
}

export function useSpecVersions(specId: string, docType: string) {
  return useQuery({
    queryKey: ['spec-versions', specId, docType],
    queryFn: () => fetchSpecVersions(specId, docType),
    select: (res) => res.data,
    enabled: !!specId && !!docType,
  });
}

export function useCreateSpec() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSpec,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specs'] });
    },
  });
}

export function useUpdateSpec() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SpecUpdateDTO }) => updateSpec(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specs'] });
      queryClient.invalidateQueries({ queryKey: ['spec'] });
    },
  });
}

export function useStartSpecWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SpecWorkflowStartDTO }) => startSpecWorkflow(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spec', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['spec-workbench', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['specs'] });
    },
  });
}

export function useUpdateSpecDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ specId, docType, content, changeSummary }: { specId: string; docType: string; content: string; changeSummary?: string }) =>
      updateSpecDocument(specId, docType, { content, changeSummary }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spec-document'] });
    },
  });
}

export function useSaveWorkbenchDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ specId, nodeId, content, changeSummary }: { specId: string; nodeId: string; content: string; changeSummary?: string }) =>
      saveWorkbenchDocument(specId, nodeId, { content, changeSummary }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spec-workbench', variables.specId] });
      queryClient.invalidateQueries({ queryKey: ['spec', variables.specId] });
      queryClient.invalidateQueries({ queryKey: ['spec-document'] });
    },
  });
}

export function useSubmitWorkbenchDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ specId, nodeId, data }: { specId: string; nodeId: string; data: SpecDocumentSubmitDTO }) =>
      submitWorkbenchDocument(specId, nodeId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spec-workbench', variables.specId] });
      queryClient.invalidateQueries({ queryKey: ['spec', variables.specId] });
      queryClient.invalidateQueries({ queryKey: ['specs'] });
      queryClient.invalidateQueries({ queryKey: ['my-pending-reviews'] });
    },
  });
}

export function useDeleteSpec() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSpec,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specs'] });
    },
  });
}

export function useSubmitSpec() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, docType }: { id: string; docType: string }) => submitSpec(id, docType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spec'] });
      queryClient.invalidateQueries({ queryKey: ['specs'] });
    },
  });
}

export function useApproveSpec() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveSpec,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spec'] });
      queryClient.invalidateQueries({ queryKey: ['specs'] });
    },
  });
}

export function useRejectSpec() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectSpec,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spec'] });
      queryClient.invalidateQueries({ queryKey: ['specs'] });
    },
  });
}

// ============ 版本详情 & Diff ============

/** 获取特定版本详情 */
export const fetchSpecVersionById = (specId: string, versionId: string) =>
  request.get<any, R<SpecVersion>>(`/specs/${specId}/versions/${versionId}`);

/** 版本 Diff 对比 */
export const fetchSpecVersionDiff = (specId: string, sourceVersionId: string, targetVersionId: string) =>
  request.post<any, R<any>>(`/specs/${specId}/versions/diff`, { sourceVersionId, targetVersionId });

export function useSpecVersionById(specId: string, versionId: string) {
  return useQuery({
    queryKey: ['specVersion', specId, versionId],
    queryFn: () => fetchSpecVersionById(specId, versionId),
    select: (res) => res.data,
    enabled: !!specId && !!versionId,
  });
}

export function useSpecVersionDiff() {
  return useMutation({
    mutationFn: (params: { specId: string; sourceVersionId: string; targetVersionId: string }) =>
      fetchSpecVersionDiff(params.specId, params.sourceVersionId, params.targetVersionId),
  });
}

/** 获取 Spec 关联的工作流追踪信息（最新实例） */
export const fetchSpecWorkflowTracking = (specId: string) =>
  request.get<any, R<WorkflowInstance>>(`/specs/${specId}/workflow-tracking`);

export function useSpecWorkflowTracking(specId: string) {
  return useQuery({
    queryKey: ['spec-workflow-tracking', specId],
    queryFn: () => fetchSpecWorkflowTracking(specId),
    select: (res) => res.data,
    enabled: !!specId,
  });
}

// ============ 模板相关 ============

/** 查询模板列表 */
export const fetchSpecTemplateList = (params?: any) =>
  request.get<any, R<any>>('/spec-templates', { params });

/** 获取模板详情 */
export const fetchSpecTemplateDetail = (id: string) =>
  request.get<any, R<any>>(`/spec-templates/${id}`);

/** 创建模板 */
export const createSpecTemplate = (data: any) =>
  request.post<any, R<any>>('/spec-templates', data);

/** 删除模板 */
export const deleteSpecTemplate = (id: string) =>
  request.delete<any, R<void>>(`/spec-templates/${id}`);

/** 从模板创建 Spec */
export const createSpecFromTemplate = (templateId: string, data: any) =>
  request.post<any, R<any>>(`/spec-templates/${templateId}/create-spec`, data);

export function useSpecTemplateList(params?: any) {
  return useQuery({
    queryKey: ['specTemplates', params],
    queryFn: () => fetchSpecTemplateList(params),
    select: (res) => res.data,
  });
}

export function useSpecTemplateDetail(id: string) {
  return useQuery({
    queryKey: ['specTemplate', id],
    queryFn: () => fetchSpecTemplateDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateSpecTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSpecTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specTemplates'] });
    },
  });
}

export function useDeleteSpecTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSpecTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specTemplates'] });
    },
  });
}

export function useCreateSpecFromTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: any }) =>
      createSpecFromTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specs'] });
    },
  });
}

/** Agent 辅助生成 Spec 基本信息 */
export const agentAssistSpec = (data: { agentId: string; description: string }) =>
  request.post<any, R<{ name: string; description: string; category?: string; tags?: string[] }>>(
    '/specs/agent-assist',
    data,
  );

export function useAgentAssistSpec() {
  return useMutation({
    mutationFn: agentAssistSpec,
  });
}

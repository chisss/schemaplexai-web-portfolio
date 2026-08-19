/**
 * 上下文管理 API 接口
 * 对应后端 ContextController
 */
import request from './request';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { R, PageResult } from '@/types/common';
import type {
  Context, ContextDetail, ContextItem, ContextSnapshot, KnowledgeDocument,
  ContextCreateDTO, ContextUpdateDTO, ContextQueryDTO,
  ContextItemCreateDTO, ContextItemUpdateDTO,
} from '@/types/context';

// ============ 基础请求函数 ============

/** 分页查询上下文列表 */
export const fetchContextList = (params: ContextQueryDTO) =>
  request.get<any, R<PageResult<Context>>>('/contexts', { params });

/** 全量查询上下文列表（用于知识图谱等需要完整数据的场景） */
export const fetchAllContexts = () =>
  request.get<any, R<PageResult<Context>>>('/contexts', { params: { page: 1, size: 9999 } });

/** 获取上下文详情（含条目列表） */
export const fetchContextDetail = (id: string) =>
  request.get<any, R<ContextDetail>>(`/contexts/${id}`);

/** 创建上下文 */
export const createContext = (data: ContextCreateDTO) =>
  request.post<any, R<Context>>('/contexts', data);

/** 更新上下文 */
export const updateContext = (id: string, data: ContextUpdateDTO) =>
  request.put<any, R<Context>>(`/contexts/${id}`, data);

/** 删除上下文 */
export const deleteContext = (id: string) =>
  request.delete<any, R<void>>(`/contexts/${id}`);

/** 添加上下文条目 */
export const addContextItem = (contextId: string, data: ContextItemCreateDTO) =>
  request.post<any, R<ContextItem>>(`/contexts/${contextId}/items`, data);

/** 查询上下文条目列表 */
export const fetchContextItems = (contextId: string, itemType?: string) =>
  request.get<any, R<ContextItem[]>>(`/contexts/${contextId}/items`, { params: { itemType } });

/** 更新上下文条目 */
export const updateContextItem = (contextId: string, itemId: string, data: ContextItemUpdateDTO) =>
  request.put<any, R<ContextItem>>(`/contexts/${contextId}/items/${itemId}`, data);

/** 删除上下文条目 */
export const deleteContextItem = (contextId: string, itemId: string) =>
  request.delete<any, R<void>>(`/contexts/${contextId}/items/${itemId}`);

/** 查询上下文快照列表 */
export const fetchContextSnapshots = (contextId: string) =>
  request.get<any, R<ContextSnapshot[]>>(`/contexts/${contextId}/snapshots`);

/** 创建上下文快照 */
export const createContextSnapshot = (contextId: string, snapshotName?: string) =>
  request.post<any, R<ContextSnapshot>>(`/contexts/${contextId}/snapshots`, null, { params: { snapshotName } });

/** 恢复上下文快照 */
export const restoreContextSnapshot = (contextId: string, snapId: string) =>
  request.post<any, R<Record<string, any>>>(`/contexts/${contextId}/snapshots/${snapId}/restore`);

/** 上传知识文档并触发向量化 */
export const uploadKnowledgeDocument = (
  contextId: string,
  file: File,
  options?: { uploadChannel?: string; title?: string; idempotencyKey?: string },
) => {
  const formData = new FormData();
  formData.append('contextId', contextId);
  formData.append('file', file);
  if (options?.uploadChannel) formData.append('uploadChannel', options.uploadChannel);
  if (options?.title) formData.append('title', options.title);
  if (options?.idempotencyKey) formData.append('idempotencyKey', options.idempotencyKey);
  return request.post<any, R<KnowledgeDocument>>('/knowledge/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/** 查询上下文下的知识文档列表 */
export const fetchKnowledgeDocuments = (contextId: string) =>
  request.get<any, R<KnowledgeDocument[]>>('/knowledge/documents', { params: { contextId } });

/** 查询知识文档状态 */
export const fetchKnowledgeDocumentStatus = (documentId: string) =>
  request.get<any, R<KnowledgeDocument>>(`/knowledge/documents/${documentId}`);

/** 获取文档下载预签名 URL */
export const fetchKnowledgeDocumentDownloadUrl = (documentId: string) =>
  request.get<any, R<string>>(`/knowledge/documents/${documentId}/download-url`);

// ============ TanStack Query Hooks ============

export function useContextList(params: ContextQueryDTO) {
  return useQuery({
    queryKey: ['contexts', params],
    queryFn: () => fetchContextList(params),
    select: (res) => res.data,
  });
}

/** 全量查询所有上下文（用于知识图谱） */
export function useAllContexts() {
  return useQuery({
    queryKey: ['contexts', 'all'],
    queryFn: () => fetchAllContexts(),
    select: (res) => res.data,
  });
}

export function useContextDetail(id: string) {
  return useQuery({
    queryKey: ['context', id],
    queryFn: () => fetchContextDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useContextItems(contextId: string, itemType?: string) {
  return useQuery({
    queryKey: ['context-items', contextId, itemType],
    queryFn: () => fetchContextItems(contextId, itemType),
    select: (res) => res.data,
    enabled: !!contextId,
  });
}

export function useContextSnapshots(contextId: string) {
  return useQuery({
    queryKey: ['context-snapshots', contextId],
    queryFn: () => fetchContextSnapshots(contextId),
    select: (res) => res.data,
    enabled: !!contextId,
  });
}

export function useCreateContext() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createContext,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contexts'] });
    },
  });
}

export function useUpdateContext() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContextUpdateDTO }) => updateContext(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contexts'] });
      queryClient.invalidateQueries({ queryKey: ['context'] });
    },
  });
}

export function useDeleteContext() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteContext,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contexts'] });
    },
  });
}

export function useAddContextItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contextId, data }: { contextId: string; data: ContextItemCreateDTO }) =>
      addContextItem(contextId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['context'] });
      queryClient.invalidateQueries({ queryKey: ['context-items'] });
    },
  });
}

export function useUpdateContextItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contextId, itemId, data }: { contextId: string; itemId: string; data: ContextItemUpdateDTO }) =>
      updateContextItem(contextId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['context'] });
      queryClient.invalidateQueries({ queryKey: ['context-items'] });
    },
  });
}

export function useDeleteContextItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contextId, itemId }: { contextId: string; itemId: string }) =>
      deleteContextItem(contextId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['context'] });
      queryClient.invalidateQueries({ queryKey: ['context-items'] });
    },
  });
}

export function useCreateContextSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contextId, snapshotName }: { contextId: string; snapshotName?: string }) =>
      createContextSnapshot(contextId, snapshotName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['context-snapshots'] });
    },
  });
}

export function useRestoreContextSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contextId, snapId }: { contextId: string; snapId: string }) =>
      restoreContextSnapshot(contextId, snapId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['context'] });
      queryClient.invalidateQueries({ queryKey: ['context-items'] });
    },
  });
}

export function useKnowledgeDocuments(contextId: string) {
  return useQuery({
    queryKey: ['knowledge-documents', contextId],
    queryFn: () => fetchKnowledgeDocuments(contextId),
    select: (res) => res.data ?? [],
    enabled: !!contextId,
    refetchInterval: (query) => {
      const rawData = query.state.data as R<KnowledgeDocument[]> | KnowledgeDocument[] | undefined;
      const documents = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
          ? rawData.data
          : [];
      return documents.some((doc) => doc.status === 'pending' || doc.status === 'processing' || doc.status === 'scanning') ? 3000 : false;
    },
  });
}

export function useUploadKnowledgeDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contextId, file }: { contextId: string; file: File }) => uploadKnowledgeDocument(contextId, file),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-documents', vars.contextId] });
      queryClient.invalidateQueries({ queryKey: ['context', vars.contextId] });
      queryClient.invalidateQueries({ queryKey: ['contexts'] });
    },
  });
}

// 获取快照详情
export const useContextSnapshotDetail = (contextId: string, snapId: string) => {
  return useQuery({
    queryKey: ['contextSnapshot', contextId, snapId],
    queryFn: () => request.get(`/contexts/${contextId}/snapshots/${snapId}`).then(res => (res as any).data),
    enabled: !!contextId && !!snapId,
  });
};

// 上下文解析
export const useContextResolve = () => {
  return useMutation({
    mutationFn: (data: { agentId?: string; taskId?: string; specId?: string; tokenBudget?: number; projectId?: string }) =>
      request.post('/contexts/resolve', data).then(res => (res as any).data),
  });
};

// ============ 关联关系 ============

/** 查询上下文关联关系列表 */
export const fetchContextRelations = (contextId: string) =>
  request.get<any, any>(`/contexts/${contextId}/relations`).then((res: any) => res.data as any[]);

export function useContextRelations(contextId: string) {
  return useQuery({
    queryKey: ['context-relations', contextId],
    queryFn: () => fetchContextRelations(contextId),
    enabled: !!contextId,
  });
}

/**
 * 集成扩展 API 接口
 * 对应后端 IntegrationController
 */
import request from './request';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { R, PageResult } from '@/types/common';
import type {
  Integration, WebhookEvent, ConnectionTest, IntegrationProject, IntegrationRepository, IntegrationRepositoryTreeNode,
  IntegrationCreateDTO, IntegrationUpdateDTO, IntegrationQueryDTO,
} from '@/types/integration';

// ============ 基础请求函数 ============

/** 创建集成配置 */
export const createIntegration = (data: IntegrationCreateDTO) =>
  request.post<any, R<Integration>>('/integrations', data);

/** 分页查询集成配置 */
export const fetchIntegrations = (params: IntegrationQueryDTO) =>
  request.get<any, R<PageResult<Integration>>>('/integrations', { params });

/** 获取集成配置详情 */
export const fetchIntegrationDetail = (id: string) =>
  request.get<any, R<Integration>>(`/integrations/${id}`);

/** 更新集成配置 */
export const updateIntegration = (id: string, data: IntegrationUpdateDTO) =>
  request.put<any, R<Integration>>(`/integrations/${id}`, data);

/** 删除集成配置 */
export const deleteIntegration = (id: string) =>
  request.delete<any, R<void>>(`/integrations/${id}`);

/** 测试集成连接 */
export const testIntegrationConnection = (id: string) =>
  request.post<any, R<ConnectionTest>>(`/integrations/${id}/test`);

/** 触发集成同步 */
export const syncIntegration = (id: string) =>
  request.post<any, R<Record<string, any>>>(`/integrations/${id}/sync`);

/** 分页查询 Webhook 事件 */
export const fetchWebhookEvents = (params: {
  integrationId?: string; eventType?: string; status?: string; page?: number; size?: number;
}) =>
  request.get<any, R<PageResult<WebhookEvent>>>('/integrations/webhook-events', { params });

/** 获取当前租户下所有已导入的集成项目（跨所有集成） */
export const fetchAllImportedProjects = () =>
  request.get<any, R<IntegrationProject[]>>('/integrations/projects/all');

/** 获取远端仓库列表 */
export const fetchIntegrationRepositories = (id: string) =>
  request.get<any, R<IntegrationRepository[]>>(`/integrations/${id}/repos`);

/** 获取远端仓库文件树 */
export const fetchIntegrationRepositoryTree = (id: string, repoId: string, params: { ref?: string; path?: string }) =>
  request.get<any, R<IntegrationRepositoryTreeNode[]>>(`/integrations/${id}/repos/${repoId}/tree`, { params });

// ============ TanStack Query Hooks ============

export function useIntegrations(params: IntegrationQueryDTO) {
  return useQuery({
    queryKey: ['integrations', params],
    queryFn: () => fetchIntegrations(params),
    select: (res) => res.data,
  });
}

export function useIntegrationDetail(id: string) {
  return useQuery({
    queryKey: ['integration', id],
    queryFn: () => fetchIntegrationDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useWebhookEvents(params: { integrationId?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: ['webhook-events', params],
    queryFn: () => fetchWebhookEvents(params),
    select: (res) => res.data,
  });
}

export function useCreateIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}

export function useUpdateIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IntegrationUpdateDTO }) =>
      updateIntegration(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['integration'] });
    },
  });
}

export function useDeleteIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}

export function useTestIntegrationConnection() {
  return useMutation({
    mutationFn: testIntegrationConnection,
  });
}

export function useSyncIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}

/** 获取所有已导入的集成项目（用于上下文关联项目多选） */
export function useAllImportedProjects() {
  return useQuery({
    queryKey: ['imported-projects', 'all'],
    queryFn: fetchAllImportedProjects,
    select: (res) => res.data ?? [],
  });
}

export function useIntegrationRepositories(id: string) {
  return useQuery({
    queryKey: ['integration-repositories', id],
    queryFn: () => fetchIntegrationRepositories(id),
    select: (res) => res.data ?? [],
    enabled: !!id,
  });
}

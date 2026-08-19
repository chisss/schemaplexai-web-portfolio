/**
 * MCP Server 管理 API
 */
import request from './request';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { R, PageResult } from '@/types/common';
import type { McpServer, McpServerCreateDTO, McpServerUpdateDTO, McpServerQueryDTO } from '@/types/integration';

// ============ 基础请求函数 ============

export const createMcpServer = (data: McpServerCreateDTO) =>
  request.post<any, R<McpServer>>('/mcp-servers', data);

export const fetchMcpServers = (params: McpServerQueryDTO) =>
  request.get<any, R<PageResult<McpServer>>>('/mcp-servers', { params });

export const fetchMcpServerDetail = (id: string) =>
  request.get<any, R<McpServer>>(`/mcp-servers/${id}`);

export const updateMcpServer = (id: string, data: McpServerUpdateDTO) =>
  request.put<any, R<McpServer>>(`/mcp-servers/${id}`, data);

export const deleteMcpServer = (id: string) =>
  request.delete<any, R<void>>(`/mcp-servers/${id}`);

export const healthCheckMcpServer = (id: string) =>
  request.post<any, R<McpServer>>(`/mcp-servers/${id}/health-check`);

export const discoverMcpServerTools = (id: string) =>
  request.post<any, R<McpServer>>(`/mcp-servers/${id}/discover-tools`);

// ============ TanStack Query Hooks ============

export function useMcpServers(params: McpServerQueryDTO) {
  return useQuery({
    queryKey: ['mcp-servers', params],
    queryFn: () => fetchMcpServers(params),
    select: (res) => res.data,
  });
}

export function useMcpServerDetail(id: string) {
  return useQuery({
    queryKey: ['mcp-server', id],
    queryFn: () => fetchMcpServerDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateMcpServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMcpServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
    },
  });
}

export function useUpdateMcpServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: McpServerUpdateDTO }) =>
      updateMcpServer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
      queryClient.invalidateQueries({ queryKey: ['mcp-server'] });
    },
  });
}

export function useDeleteMcpServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMcpServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
    },
  });
}

export function useHealthCheckMcpServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: healthCheckMcpServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
    },
  });
}

export function useDiscoverMcpServerTools() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: discoverMcpServerTools,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
      queryClient.invalidateQueries({ queryKey: ['mcp-server'] });
    },
  });
}

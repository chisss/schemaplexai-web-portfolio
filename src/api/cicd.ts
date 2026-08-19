/**
 * CICD Pipeline 管理 API
 */
import request from './request';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { R, PageResult } from '@/types/common';
import type { CicdPipeline, CicdPipelineCreateDTO, CicdPipelineUpdateDTO, CicdPipelineQueryDTO } from '@/types/integration';

// ============ 基础请求函数 ============

export const createPipeline = (data: CicdPipelineCreateDTO) =>
  request.post<any, R<CicdPipeline>>('/cicd-pipelines', data);

export const fetchPipelines = (params: CicdPipelineQueryDTO) =>
  request.get<any, R<PageResult<CicdPipeline>>>('/cicd-pipelines', { params });

export const fetchPipelineDetail = (id: string) =>
  request.get<any, R<CicdPipeline>>(`/cicd-pipelines/${id}`);

export const updatePipeline = (id: string, data: CicdPipelineUpdateDTO) =>
  request.put<any, R<CicdPipeline>>(`/cicd-pipelines/${id}`, data);

export const deletePipeline = (id: string) =>
  request.delete<any, R<void>>(`/cicd-pipelines/${id}`);

export const triggerPipeline = (id: string) =>
  request.post<any, R<Record<string, any>>>(`/cicd-pipelines/${id}/trigger`);

// ============ TanStack Query Hooks ============

export function usePipelines(params: CicdPipelineQueryDTO) {
  return useQuery({
    queryKey: ['pipelines', params],
    queryFn: () => fetchPipelines(params),
    select: (res) => res.data,
  });
}

export function usePipelineDetail(id: string) {
  return useQuery({
    queryKey: ['pipeline', id],
    queryFn: () => fetchPipelineDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreatePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPipeline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

export function useUpdatePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CicdPipelineUpdateDTO }) =>
      updatePipeline(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
}

export function useDeletePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePipeline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

export function useTriggerPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: triggerPipeline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

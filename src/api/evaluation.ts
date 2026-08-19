import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import request from './request';
import type { PageResult, R } from '@/types/common';
import type {
  EvalDataset,
  EvalDatasetCreateDTO,
  EvalDatasetItemSaveDTO,
  EvalDatasetQueryDTO,
  EvalDatasetUpdateDTO,
  EvalTask,
  EvalTaskCreateDTO,
  EvalTaskQueryDTO,
} from '@/types/evaluation';

export const fetchEvaluationDatasets = (params: EvalDatasetQueryDTO) =>
  request.get<any, R<PageResult<EvalDataset>>>('/evaluation/datasets', { params });

export const fetchEvaluationDataset = (id: string) =>
  request.get<any, R<EvalDataset>>(`/evaluation/datasets/${id}`);

export const createEvaluationDataset = (data: EvalDatasetCreateDTO) =>
  request.post<any, R<EvalDataset>>('/evaluation/datasets', data);

export const updateEvaluationDataset = (id: string, data: EvalDatasetUpdateDTO) =>
  request.put<any, R<EvalDataset>>(`/evaluation/datasets/${id}`, data);

export const saveEvaluationDatasetItems = (id: string, data: EvalDatasetItemSaveDTO) =>
  request.put<any, R<EvalDataset>>(`/evaluation/datasets/${id}/items`, data);

export const deleteEvaluationDataset = (id: string) =>
  request.delete<any, R<void>>(`/evaluation/datasets/${id}`);

export const fetchEvaluationTasks = (params: EvalTaskQueryDTO) =>
  request.get<any, R<PageResult<EvalTask>>>('/evaluation/tasks', { params });

export const fetchEvaluationTask = (id: string) =>
  request.get<any, R<EvalTask>>(`/evaluation/tasks/${id}`);

export const createEvaluationTask = (data: EvalTaskCreateDTO) =>
  request.post<any, R<EvalTask>>('/evaluation/tasks', data);

export const runEvaluationTask = (id: string) =>
  request.post<any, R<EvalTask>>(`/evaluation/tasks/${id}/run`);

export function useEvaluationDatasets(params: EvalDatasetQueryDTO) {
  return useQuery({
    queryKey: ['evaluation-datasets', params],
    queryFn: () => fetchEvaluationDatasets(params),
    select: (res) => res.data,
  });
}

export function useEvaluationDataset(id?: string) {
  return useQuery({
    queryKey: ['evaluation-dataset', id],
    queryFn: () => fetchEvaluationDataset(String(id)),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateEvaluationDataset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvaluationDataset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-datasets'] });
    },
  });
}

export function useUpdateEvaluationDataset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EvalDatasetUpdateDTO }) =>
      updateEvaluationDataset(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-datasets'] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-dataset', variables.id] });
    },
  });
}

export function useSaveEvaluationDatasetItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EvalDatasetItemSaveDTO }) =>
      saveEvaluationDatasetItems(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-datasets'] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-dataset', variables.id] });
    },
  });
}

export function useDeleteEvaluationDataset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEvaluationDataset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-datasets'] });
    },
  });
}

export function useEvaluationTasks(params: EvalTaskQueryDTO, enabled = true) {
  return useQuery({
    queryKey: ['evaluation-tasks', params],
    queryFn: () => fetchEvaluationTasks(params),
    select: (res) => res.data,
    enabled,
    refetchInterval: (query) => {
      const page = query.state.data?.data;
      return page?.records?.some((item) => item.status === 'RUNNING') ? 3000 : false;
    },
  });
}

export function useEvaluationTask(id?: string, refetchWhenRunning = true) {
  return useQuery({
    queryKey: ['evaluation-task', id],
    queryFn: () => fetchEvaluationTask(String(id)),
    select: (res) => res.data,
    enabled: !!id,
    refetchInterval: (query) => {
      if (!refetchWhenRunning) {
        return false;
      }
      return query.state.data?.data?.status === 'RUNNING' ? 3000 : false;
    },
  });
}

export function useCreateEvaluationTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvaluationTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-tasks'] });
    },
  });
}

export function useRunEvaluationTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runEvaluationTask,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-task', id] });
    },
  });
}

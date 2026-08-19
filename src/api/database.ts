import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import request from './request';
import type { PageResult, R } from '@/types/common';
import type {
  DatabaseQueryResult,
  DatabaseSource,
  DatabaseSourceQueryDTO,
  DatabaseSourceSaveDTO,
  DatabaseSourceTestResult,
} from '@/types/database';

export const fetchDatabaseSources = (params: DatabaseSourceQueryDTO) =>
  request.get<any, R<PageResult<DatabaseSource>>>('/database-sources', { params });

export const fetchDatabaseSourceDetail = (id: string) =>
  request.get<any, R<DatabaseSource>>(`/database-sources/${id}`);

export const createDatabaseSource = (data: DatabaseSourceSaveDTO) =>
  request.post<any, R<DatabaseSource>>('/database-sources', data);

export const updateDatabaseSource = (id: string, data: DatabaseSourceSaveDTO) =>
  request.put<any, R<DatabaseSource>>(`/database-sources/${id}`, data);

export const deleteDatabaseSource = (id: string) =>
  request.delete<any, R<void>>(`/database-sources/${id}`);

export const testDraftDatabaseSource = (data: DatabaseSourceSaveDTO) =>
  request.post<any, R<DatabaseSourceTestResult>>('/database-sources/test-draft', data);

export const testDatabaseSource = (id: string) =>
  request.post<any, R<DatabaseSourceTestResult>>(`/database-sources/${id}/test`);

export const executeDatabaseQuery = (id: string, data: { sql: string; limit?: number }) =>
  request.post<any, R<DatabaseQueryResult>>(`/database-sources/${id}/query`, data);

export function useDatabaseSources(params: DatabaseSourceQueryDTO) {
  return useQuery({
    queryKey: ['database-sources', params],
    queryFn: () => fetchDatabaseSources(params),
    select: (res) => res.data,
  });
}

export function useDatabaseSourceDetail(id?: string) {
  return useQuery({
    queryKey: ['database-source', id],
    queryFn: () => fetchDatabaseSourceDetail(id as string),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateDatabaseSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDatabaseSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database-sources'] });
    },
  });
}

export function useUpdateDatabaseSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DatabaseSourceSaveDTO }) => updateDatabaseSource(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['database-sources'] });
      queryClient.invalidateQueries({ queryKey: ['database-source', id] });
    },
  });
}

export function useDeleteDatabaseSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDatabaseSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database-sources'] });
    },
  });
}

export function useTestDraftDatabaseSource() {
  return useMutation({
    mutationFn: testDraftDatabaseSource,
  });
}

export function useTestDatabaseSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: testDatabaseSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database-sources'] });
    },
  });
}

export function useExecuteDatabaseQuery() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { sql: string; limit?: number } }) => executeDatabaseQuery(id, data),
  });
}


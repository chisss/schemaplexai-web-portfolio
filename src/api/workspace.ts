/**
 * 工作空间管理 API
 */
import request from './request';
import { downloadWithAuth } from './download';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { R, PageResult } from '@/types/common';
import type {
  Workspace,
  WorkspaceCreateDTO,
  WorkspaceUpdateDTO,
  WorkspaceQueryDTO,
  WorkspaceBranch,
  WorkspaceBranchQueryDTO,
  WorkspaceBranchDiff,
  BranchRule,
  BranchRuleSaveDTO,
  WorkspaceFile,
  WorkspaceFileContent,
} from '@/types/integration';
import type { Artifact } from '@/types/artifact';

// ============ 基础请求函数 ============

export const createWorkspace = (data: WorkspaceCreateDTO) =>
  request.post<any, R<Workspace>>('/workspaces', data);

export const fetchWorkspaces = (params: WorkspaceQueryDTO) =>
  request.get<any, R<PageResult<Workspace>>>('/workspaces', { params });

export const fetchWorkspaceDetail = (id: string) =>
  request.get<any, R<Workspace>>(`/workspaces/${id}`);

export const updateWorkspace = (id: string, data: WorkspaceUpdateDTO) =>
  request.put<any, R<Workspace>>(`/workspaces/${id}`, data);

export const deleteWorkspace = (id: string) =>
  request.delete<any, R<void>>(`/workspaces/${id}`);

export const syncWorkspace = (id: string) =>
  request.post<any, R<Workspace>>(`/workspaces/${id}/sync`);

export const fetchAllWorkspaces = () =>
  request.get<any, R<Workspace[]>>('/workspaces/all');

// ============ 分支管理 ============

export interface BranchInfo {
  name: string;
  isCurrent: boolean;
  commitId?: string;
}

export const fetchBranches = (workspaceId: string) =>
  request.get<any, R<BranchInfo[]>>(`/workspaces/${workspaceId}/branches`);

export const fetchCurrentBranch = (workspaceId: string) =>
  request.get<any, R<string>>(`/workspaces/${workspaceId}/branches/current`);

export const createBranch = (workspaceId: string, branchName: string, startPoint?: string) =>
  request.post<any, R<BranchInfo>>(`/workspaces/${workspaceId}/branches`, null, { params: { branchName, startPoint } });

export const fetchWorkspaceFiles = (workspaceId: string, path?: string) =>
  request.get<any, R<WorkspaceFile[]>>(`/workspaces/${workspaceId}/files`, { params: { path } });

export const fetchWorkspaceFileContent = (workspaceId: string, path: string) =>
  request.get<any, R<WorkspaceFileContent>>(`/workspaces/${workspaceId}/files/content`, { params: { path } });

export const downloadWorkspaceFile = (workspaceId: string, path: string) =>
  downloadWithAuth(`/workspaces/${workspaceId}/files/download?path=${encodeURIComponent(path)}`, path.split('/').pop() || 'workspace-file');

export const fetchWorkspaceArtifacts = (workspaceId: string) =>
  request.get<any, R<Artifact[]>>(`/workspaces/${workspaceId}/artifacts`);

// ============ 项目分支管理（增强） ============

export const fetchWorkspaceBranchPage = (params: WorkspaceBranchQueryDTO) =>
  request.get<any, R<PageResult<WorkspaceBranch>>>('/workspace-branches', { params });

export const fetchWorkspaceBranchDiff = (params: { workspaceId: string; sourceBranch: string; targetBranch?: string }) =>
  request.get<any, R<WorkspaceBranchDiff>>('/workspace-branches/diff', { params });

export const fetchBranchRules = (workspaceId?: string) =>
  request.get<any, R<BranchRule[]>>('/workspace-branches/rules', { params: { workspaceId } });

export const createBranchRule = (data: BranchRuleSaveDTO) =>
  request.post<any, R<BranchRule>>('/workspace-branches/rules', data);

export const updateBranchRule = (id: string, data: BranchRuleSaveDTO) =>
  request.put<any, R<BranchRule>>(`/workspace-branches/rules/${id}`, data);

export const deleteBranchRule = (id: string) =>
  request.delete<any, R<void>>(`/workspace-branches/rules/${id}`);

// ============ TanStack Query Hooks ============

export function useWorkspaces(params: WorkspaceQueryDTO) {
  return useQuery({
    queryKey: ['workspaces', params],
    queryFn: () => fetchWorkspaces(params),
    select: (res) => res.data,
  });
}

export function useWorkspaceDetail(id: string) {
  return useQuery({
    queryKey: ['workspace', id],
    queryFn: () => fetchWorkspaceDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkspaceUpdateDTO }) =>
      updateWorkspace(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useSyncWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

/** 获取所有工作空间（用于上下文关联项目下拉） */
export function useAllWorkspaces() {
  return useQuery({
    queryKey: ['workspaces', 'all'],
    queryFn: fetchAllWorkspaces,
    select: (res) => res.data ?? [],
  });
}

// ============ 分支管理 Hooks ============

export function useBranches(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-branches', workspaceId],
    queryFn: () => fetchBranches(workspaceId),
    select: (res) => res.data ?? [],
    enabled: !!workspaceId,
  });
}

export function useCurrentBranch(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-current-branch', workspaceId],
    queryFn: () => fetchCurrentBranch(workspaceId),
    select: (res) => res.data,
    enabled: !!workspaceId,
  });
}

export function useWorkspaceFiles(workspaceId: string, path?: string) {
  return useQuery({
    queryKey: ['workspace-files', workspaceId, path],
    queryFn: () => fetchWorkspaceFiles(workspaceId, path),
    select: (res) => res.data ?? [],
    enabled: !!workspaceId,
  });
}

export function useWorkspaceFileContent(workspaceId: string, path?: string) {
  return useQuery({
    queryKey: ['workspace-file-content', workspaceId, path],
    queryFn: () => fetchWorkspaceFileContent(workspaceId, path!),
    select: (res) => res.data,
    enabled: !!workspaceId && !!path,
  });
}

export function useWorkspaceArtifacts(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-artifacts', workspaceId],
    queryFn: () => fetchWorkspaceArtifacts(workspaceId),
    select: (res) => res.data ?? [],
    enabled: !!workspaceId,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, branchName, startPoint }: { workspaceId: string; branchName: string; startPoint?: string }) =>
      createBranch(workspaceId, branchName, startPoint),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-branches', variables.workspaceId] });
    },
  });
}

export function useWorkspaceBranchPage(params: WorkspaceBranchQueryDTO, refetchInterval?: number, enabled = true) {
  return useQuery({
    queryKey: ['workspace-branches-page', params],
    queryFn: () => fetchWorkspaceBranchPage(params),
    select: (res) => res.data,
    refetchInterval,
    enabled,
  });
}

export function useWorkspaceBranchDiff() {
  return useMutation({
    mutationFn: fetchWorkspaceBranchDiff,
  });
}

export function useBranchRules(workspaceId?: string) {
  return useQuery({
    queryKey: ['workspace-branch-rules', workspaceId],
    queryFn: () => fetchBranchRules(workspaceId),
    select: (res) => res.data ?? [],
  });
}

export function useCreateBranchRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBranchRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-branch-rules'] });
    },
  });
}

export function useUpdateBranchRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BranchRuleSaveDTO }) => updateBranchRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-branch-rules'] });
    },
  });
}

export function useDeleteBranchRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBranchRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-branch-rules'] });
    },
  });
}

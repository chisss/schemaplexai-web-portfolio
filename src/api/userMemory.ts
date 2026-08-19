/**
 * 当前用户记忆与偏好 API
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import request from './request';
import type { R } from '@/types/common';

export type UserMemoryScope = 'USER_GLOBAL' | 'USER_AGENT' | 'USER_PROJECT' | 'USER_WORKSPACE';
export type UserMemoryKind =
  | 'PROFILE_FACT'
  | 'PREFERENCE'
  | 'COMMUNICATION_STYLE'
  | 'WORKFLOW_RULE'
  | 'TOOL_PREFERENCE'
  | 'AVOIDANCE'
  | 'EPISODIC_SUMMARY';
export type UserMemoryStatus = 'CANDIDATE' | 'ACTIVE' | 'REJECTED' | 'ARCHIVED';
export type UserMemorySourceType = 'EXPLICIT' | 'IMPLICIT' | 'MANUAL' | 'IMPORT' | 'SYSTEM_MIGRATION';
export type UserMemorySensitivity = 'NORMAL' | 'SENSITIVE' | 'RESTRICTED';
export type SensitiveMemoryPolicy = 'EXPLICIT_ONLY' | 'MASK' | 'REVIEW' | 'REJECT';

export interface UserMemory {
  id: string;
  tenantId: string;
  userId: string;
  agentId?: string;
  projectId?: string;
  workspaceId?: string;
  conversationId?: string;
  executionId?: string;
  sourceMessageId?: string;
  memoryScope: UserMemoryScope | string;
  memoryKind: UserMemoryKind | string;
  sourceType: UserMemorySourceType | string;
  status: UserMemoryStatus | string;
  content: string;
  structuredValue?: Record<string, unknown>;
  contentHash?: string;
  confidenceScore?: number;
  importanceScore?: number;
  relevanceScore?: number;
  sensitivityLevel?: UserMemorySensitivity | string;
  pinned?: boolean;
  useCount?: number;
  lastUsedAt?: string;
  expiresAt?: string;
  supersededBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserMemorySetting {
  id?: string;
  tenantId?: string;
  userId?: string;
  memoryEnabled?: boolean;
  referenceSavedMemory?: boolean;
  referenceChatHistory?: boolean;
  autoExtractEnabled?: boolean;
  sensitiveMemoryPolicy?: SensitiveMemoryPolicy | string;
  retentionDays?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserMemoryQueryRequest {
  agentId?: string;
  memoryScope?: string;
  memoryKind?: string;
  status?: string;
  keyword?: string;
}

export interface UserMemoryCreateRequest {
  agentId?: string;
  projectId?: string;
  workspaceId?: string;
  memoryScope?: string;
  memoryKind?: string;
  content: string;
  structuredValue?: Record<string, unknown>;
  pinned?: boolean;
  expiresAt?: string;
}

export interface UserMemoryUpdateRequest {
  memoryScope?: string;
  memoryKind?: string;
  status?: string;
  content?: string;
  structuredValue?: Record<string, unknown>;
  pinned?: boolean;
  expiresAt?: string;
}

export interface UserMemorySettingUpdateRequest {
  memoryEnabled?: boolean;
  referenceSavedMemory?: boolean;
  referenceChatHistory?: boolean;
  autoExtractEnabled?: boolean;
  sensitiveMemoryPolicy?: string;
  retentionDays?: number;
}

export const fetchUserMemories = (params?: UserMemoryQueryRequest) =>
  request.get<any, R<UserMemory[]>>('/user-memories', { params });

export const createUserMemory = (data: UserMemoryCreateRequest) =>
  request.post<any, R<UserMemory>>('/user-memories', data);

export const updateUserMemory = (id: string, data: UserMemoryUpdateRequest) =>
  request.put<any, R<UserMemory>>(`/user-memories/${id}`, data);

export const deleteUserMemory = (id: string) =>
  request.delete<any, R<void>>(`/user-memories/${id}`);

export const fetchUserMemorySetting = () =>
  request.get<any, R<UserMemorySetting>>('/user-memory-settings/me');

export const updateUserMemorySetting = (data: UserMemorySettingUpdateRequest) =>
  request.put<any, R<UserMemorySetting>>('/user-memory-settings/me', data);

export function useUserMemories(params?: UserMemoryQueryRequest) {
  return useQuery({
    queryKey: ['user-memories', params],
    queryFn: () => fetchUserMemories(params),
    select: (res) => res.data || [],
  });
}

export function useCreateUserMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUserMemory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-memories'] }),
  });
}

export function useUpdateUserMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserMemoryUpdateRequest }) => updateUserMemory(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-memories'] }),
  });
}

export function useDeleteUserMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUserMemory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-memories'] }),
  });
}

export function useUserMemorySetting() {
  return useQuery({
    queryKey: ['user-memory-setting'],
    queryFn: fetchUserMemorySetting,
    select: (res) => res.data,
  });
}

export function useUpdateUserMemorySetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserMemorySetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-memory-setting'] });
      queryClient.invalidateQueries({ queryKey: ['user-memories'] });
    },
  });
}

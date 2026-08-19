import request from './request';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ToolApprovalAmendment {
  id: string;
  tenantId: string;
  agentId?: string;
  toolCode: string;
  commandPattern: string;
  matchType: string;
  scope: string;
  approvedBy: string;
  expiresAt?: string;
  useCount: number;
  lastUsedAt?: string;
  createdAt: string;
}

export interface CreateAmendmentDTO {
  agentId?: string;
  toolCode: string;
  command: string;
  scope: 'AGENT' | 'TENANT';
  expiresAt?: string;
}

export function fetchAmendments(agentId: string) {
  return request.get<ToolApprovalAmendment[]>('/amendments', { params: { agentId } });
}

export function createAmendment(data: CreateAmendmentDTO) {
  return request.post<ToolApprovalAmendment>('/amendments', data);
}

export function deleteAmendment(id: string) {
  return request.delete(`/amendments/${id}`);
}

export function useAmendments(agentId?: string) {
  return useQuery({
    queryKey: ['amendments', agentId],
    queryFn: () => fetchAmendments(agentId!).then(r => r.data),
    enabled: !!agentId,
  });
}

export function useCreateAmendment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAmendment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['amendments'] }),
  });
}

export function useDeleteAmendment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAmendment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['amendments'] }),
  });
}

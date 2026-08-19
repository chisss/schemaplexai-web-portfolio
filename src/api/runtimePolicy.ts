import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import request from './request';
import type { R } from '@/types/common';
import type { TenantRuntimePolicy, TenantRuntimePolicyUpdateDTO } from '@/types/runtimePolicy';

export const fetchTenantRuntimePolicy = (tenantId: string) =>
  request.get<any, R<TenantRuntimePolicy>>(`/system/tenants/${tenantId}/runtime-policy`);

export const updateTenantRuntimePolicy = (tenantId: string, data: TenantRuntimePolicyUpdateDTO) =>
  request.put<any, R<TenantRuntimePolicy>>(`/system/tenants/${tenantId}/runtime-policy`, data);

export function useTenantRuntimePolicy(tenantId?: string | null) {
  return useQuery({
    queryKey: ['tenant-runtime-policy', tenantId],
    queryFn: () => fetchTenantRuntimePolicy(tenantId as string),
    select: (res) => res.data,
    enabled: !!tenantId,
  });
}

export function useUpdateTenantRuntimePolicy(tenantId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TenantRuntimePolicyUpdateDTO) => updateTenantRuntimePolicy(tenantId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-runtime-policy', tenantId] });
    },
  });
}

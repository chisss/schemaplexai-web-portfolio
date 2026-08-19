import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import request from './request';
import type { R, PageResult } from '../types/common';
import type {
  ApiGateway,
  ApiGatewayCreateDTO,
  ApiGatewayUpdateDTO,
  ApiGatewayQueryDTO,
  ApiGatewayPolicy,
  ApiGatewayPolicyDTO,
  ApiGatewayLog,
  ApiGatewayLogQueryDTO,
  ApiGatewayTestRequest,
  ApiGatewayTestResult,
} from '../types/integration';

// ---- Raw request functions ----

export function fetchApiGateways(params: ApiGatewayQueryDTO) {
  return request.get<any, R<PageResult<ApiGateway>>>('/api-gateways', { params });
}

export function fetchApiGatewayDetail(id: string) {
  return request.get<any, R<ApiGateway>>(`/api-gateways/${id}`);
}

export function createApiGateway(data: ApiGatewayCreateDTO) {
  return request.post<any, R<ApiGateway>>('/api-gateways', data);
}

export function updateApiGateway(id: string, data: ApiGatewayUpdateDTO) {
  return request.put<any, R<ApiGateway>>(`/api-gateways/${id}`, data);
}

export function deleteApiGateway(id: string) {
  return request.delete<any, R<void>>(`/api-gateways/${id}`);
}

export function testApiGateway(id: string, data?: ApiGatewayTestRequest) {
  return request.post<any, R<ApiGatewayTestResult>>(`/api-gateways/${id}/test`, data || {});
}

export function executeApiGateway(id: string, data?: ApiGatewayTestRequest) {
  return request.post<any, R<ApiGatewayTestResult>>(`/api-gateways/${id}/execute`, data || {});
}

export function fetchApiGatewayPolicy(id: string) {
  return request.get<any, R<ApiGatewayPolicy>>(`/api-gateways/${id}/policy`);
}

export function updateApiGatewayPolicy(id: string, data: ApiGatewayPolicyDTO) {
  return request.put<any, R<ApiGatewayPolicy>>(`/api-gateways/${id}/policy`, data);
}

export function fetchApiGatewayLogs(id: string, params: ApiGatewayLogQueryDTO) {
  return request.get<any, R<PageResult<ApiGatewayLog>>>(`/api-gateways/${id}/logs`, { params });
}

export function fetchAvailableApiGateways() {
  return request.get<any, R<ApiGateway[]>>('/api-gateways/available');
}

// ---- TanStack Query Hooks ----

export function useApiGateways(params: ApiGatewayQueryDTO) {
  return useQuery({
    queryKey: ['apiGateways', params],
    queryFn: () => fetchApiGateways(params).then(res => res.data),
  });
}

export function useApiGatewayDetail(id: string) {
  return useQuery({
    queryKey: ['apiGateway', id],
    queryFn: () => fetchApiGatewayDetail(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useApiGatewayPolicy(id: string) {
  return useQuery({
    queryKey: ['apiGatewayPolicy', id],
    queryFn: () => fetchApiGatewayPolicy(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useApiGatewayLogs(id: string, params: ApiGatewayLogQueryDTO) {
  return useQuery({
    queryKey: ['apiGatewayLogs', id, params],
    queryFn: () => fetchApiGatewayLogs(id, params).then(res => res.data),
    enabled: !!id,
  });
}

export function useAvailableApiGateways() {
  return useQuery({
    queryKey: ['apiGateways', 'available'],
    queryFn: () => fetchAvailableApiGateways().then(res => res.data),
  });
}

export function useCreateApiGateway() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ApiGatewayCreateDTO) => createApiGateway(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiGateways'] });
    },
  });
}

export function useUpdateApiGateway() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApiGatewayUpdateDTO }) =>
      updateApiGateway(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiGateways'] });
      queryClient.invalidateQueries({ queryKey: ['apiGateway'] });
    },
  });
}

export function useDeleteApiGateway() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteApiGateway(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiGateways'] });
    },
  });
}

export function useTestApiGateway() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ApiGatewayTestRequest }) =>
      testApiGateway(id, data),
  });
}

export function useUpdateApiGatewayPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApiGatewayPolicyDTO }) =>
      updateApiGatewayPolicy(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['apiGatewayPolicy', variables.id] });
    },
  });
}

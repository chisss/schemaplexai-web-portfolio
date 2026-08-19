/**
 * 成本管控 API 接口
 * 对应后端 CostController
 */
import request from './request';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { R, PageResult } from '@/types/common';
import type {
  CostOverview, CostTrend, CostByDimension,
  Budget, BudgetUsage, BudgetAlert,
  BudgetAdmissionStatus, BudgetBlockEvent,
  BudgetCreateDTO, BudgetUpdateDTO, BudgetQueryDTO, CurrentBudgetUpdateDTO,
} from '@/types/cost';

// ============ 成本分析 ============

/** 成本概览 */
export const fetchCostOverview = (timeRange = '7d') =>
  request.get<unknown, R<CostOverview>>('/costs/overview', { params: { timeRange } });

/** 成本趋势 */
export const fetchCostTrend = (params: { timeRange?: string; startTime?: string; endTime?: string; groupBy?: string }) =>
  request.get<unknown, R<CostTrend>>('/costs/trend', { params });

/** 按项目维度分析成本 */
export const fetchCostByProject = (params: { timeRange?: string; startTime?: string; endTime?: string }) =>
  request.get<unknown, R<CostByDimension[]>>('/costs/by-project', { params });

/** 按模型维度分析成本 */
export const fetchCostByModel = (params: { timeRange?: string; startTime?: string; endTime?: string }) =>
  request.get<unknown, R<CostByDimension[]>>('/costs/by-model', { params });

/** 按 Agent 维度分析成本 */
export const fetchCostByAgent = (params: { timeRange?: string; startTime?: string; endTime?: string }) =>
  request.get<unknown, R<CostByDimension[]>>('/costs/by-agent', { params });

/** 按用户维度分析成本 */
export const fetchCostByUser = (params: { timeRange?: string; startTime?: string; endTime?: string }) =>
  request.get<unknown, R<CostByDimension[]>>('/costs/by-user', { params });

// ============ 预算管理 ============

/** 创建预算 */
export const createBudget = (data: BudgetCreateDTO) =>
  request.post<unknown, R<Budget>>('/costs/budgets', data);

/** 分页查询预算 */
export const fetchBudgets = (params: BudgetQueryDTO) =>
  request.get<unknown, R<PageResult<Budget>>>('/costs/budgets', { params });

/** 更新预算 */
export const updateBudget = (id: string, data: BudgetUpdateDTO) =>
  request.put<unknown, R<Budget>>(`/costs/budgets/${id}`, data);

/** 删除预算 */
export const deleteBudget = (id: string) =>
  request.delete<unknown, R<void>>(`/costs/budgets/${id}`);

/** 获取预算使用情况 */
export const fetchBudgetUsage = (id: string) =>
  request.get<unknown, R<BudgetUsage>>(`/costs/budgets/${id}/usage`);

/** 获取预算告警列表 */
export const fetchBudgetAlerts = (params: { page?: number; size?: number }) =>
  request.get<unknown, R<BudgetAlert[]>>('/costs/budgets/alerts', { params });

/** 获取当前租户预算 */
export const fetchCurrentBudget = () =>
  request.get<unknown, R<Budget | null>>('/costs/budget');

/** 更新当前租户预算 */
export const updateCurrentBudget = (data: CurrentBudgetUpdateDTO) =>
  request.put<unknown, R<Budget>>('/costs/budget', data);

/** 获取当前租户预算使用情况 */
export const fetchCurrentBudgetUsage = () =>
  request.get<unknown, R<BudgetUsage | null>>('/costs/budget/usage');

/** 获取当前预算执行准入状态 */
export const fetchBudgetAdmissionStatus = () =>
  request.get<unknown, R<BudgetAdmissionStatus>>('/costs/budget/admission-status');

/** 获取最近预算阻断记录 */
export const fetchBudgetBlockEvents = (limit = 10) =>
  request.get<unknown, R<BudgetBlockEvent[]>>('/costs/budget/block-events', { params: { limit } });

// ============ TanStack Query Hooks ============

export function useCostOverview(timeRange = '7d') {
  return useQuery({
    queryKey: ['cost-overview', timeRange],
    queryFn: () => fetchCostOverview(timeRange),
    select: (res) => res.data,
  });
}

export function useCostTrend(params: { timeRange?: string; groupBy?: string }) {
  return useQuery({
    queryKey: ['cost-trend', params],
    queryFn: () => fetchCostTrend(params),
    select: (res) => res.data,
  });
}

export function useCostByProject(params: { timeRange?: string }) {
  return useQuery({
    queryKey: ['cost-by-project', params],
    queryFn: () => fetchCostByProject(params),
    select: (res) => res.data,
  });
}

export function useCostByModel(params: { timeRange?: string }) {
  return useQuery({
    queryKey: ['cost-by-model', params],
    queryFn: () => fetchCostByModel(params),
    select: (res) => res.data,
  });
}

export function useCostByAgent(params: { timeRange?: string }) {
  return useQuery({
    queryKey: ['cost-by-agent', params],
    queryFn: () => fetchCostByAgent(params),
    select: (res) => res.data,
  });
}

export function useCostByUser(params: { timeRange?: string }) {
  return useQuery({
    queryKey: ['cost-by-user', params],
    queryFn: () => fetchCostByUser(params),
    select: (res) => res.data,
  });
}

export function useBudgets(params: BudgetQueryDTO) {
  return useQuery({
    queryKey: ['budgets', params],
    queryFn: () => fetchBudgets(params),
    select: (res) => res.data,
  });
}

export function useBudgetUsage(id: string) {
  return useQuery({
    queryKey: ['budget-usage', id],
    queryFn: () => fetchBudgetUsage(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useBudgetAlerts(params: { page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ['budget-alerts', params],
    queryFn: () => fetchBudgetAlerts(params),
    select: (res) => res.data,
  });
}

export function useCurrentBudget() {
  return useQuery({
    queryKey: ['current-budget'],
    queryFn: fetchCurrentBudget,
    select: (res) => res.data,
  });
}

export function useCurrentBudgetUsage() {
  return useQuery({
    queryKey: ['current-budget-usage'],
    queryFn: fetchCurrentBudgetUsage,
    select: (res) => res.data,
  });
}

export function useBudgetAdmissionStatus() {
  return useQuery({
    queryKey: ['budget-admission-status'],
    queryFn: fetchBudgetAdmissionStatus,
    select: (res) => res.data,
  });
}

export function useBudgetBlockEvents(limit = 10) {
  return useQuery({
    queryKey: ['budget-block-events', limit],
    queryFn: () => fetchBudgetBlockEvents(limit),
    select: (res) => res.data,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BudgetUpdateDTO }) => updateBudget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-usage'] });
    },
  });
}

export function useUpdateCurrentBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCurrentBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-budget'] });
      queryClient.invalidateQueries({ queryKey: ['current-budget-usage'] });
      queryClient.invalidateQueries({ queryKey: ['budget-admission-status'] });
      queryClient.invalidateQueries({ queryKey: ['budget-block-events'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-usage'] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

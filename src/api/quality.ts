/**
 * 质量保障 API 接口
 * 对应后端 QualityController
 */
import request from './request';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { R, PageResult } from '@/types/common';
import type {
  Deviation, DeviationStatistics, DetectTask,
  IntentDefect, AnalyzeTask, CrossReview,
  DeviationDetectDTO, DeviationQueryDTO, DeviationStatusUpdateDTO,
  IntentDefectAnalyzeDTO, IntentDefectQueryDTO,
  CrossReviewCreateDTO, CrossReviewQueryDTO,
  QualityProfileConfig, QualityProfileConfigCreateDTO,
  QualityIssue, QualityIssueStatistics, QualityIssueQueryDTO, QualityTask,
} from '@/types/quality';

// ============ 偏离检测 ============

/** 触发偏离检测 */
export const detectDeviation = (data: DeviationDetectDTO) =>
  request.post<any, R<DetectTask>>('/quality/deviations/detect', data);

/** 分页查询偏离记录 */
export const fetchDeviations = (params: DeviationQueryDTO) =>
  request.get<any, R<PageResult<Deviation>>>('/quality/deviations', { params });

/** 偏离统计 */
export const fetchDeviationStatistics = (params: { specId?: string; startDate?: string; endDate?: string }) =>
  request.get<any, R<DeviationStatistics>>('/quality/deviations/statistics', { params });

/** 获取偏离详情 */
export const fetchDeviationDetail = (id: string) =>
  request.get<any, R<Deviation>>(`/quality/deviations/${id}`);

/** 更新偏离状态 */
export const updateDeviationStatus = (id: string, data: DeviationStatusUpdateDTO) =>
  request.patch<any, R<void>>(`/quality/deviations/${id}/status`, data);

// ============ 意图缺陷 ============

/** 触发意图缺陷分析 */
export const analyzeIntentDefect = (data: IntentDefectAnalyzeDTO) =>
  request.post<any, R<AnalyzeTask>>('/quality/intent-defects/analyze', data);

/** 分页查询意图缺陷 */
export const fetchIntentDefects = (params: IntentDefectQueryDTO) =>
  request.get<any, R<PageResult<IntentDefect>>>('/quality/intent-defects', { params });

/** 获取意图缺陷详情 */
export const fetchIntentDefectDetail = (id: string) =>
  request.get<any, R<IntentDefect>>(`/quality/intent-defects/${id}`);

/** 更新意图缺陷状态 */
export const updateIntentDefectStatus = (id: string, status: string) =>
  request.patch<any, R<void>>(`/quality/intent-defects/${id}/status`, null, { params: { status } });

// ============ 交叉审查 ============

/** 创建交叉审查 */
export const createCrossReview = (data: CrossReviewCreateDTO) =>
  request.post<any, R<CrossReview>>('/quality/cross-reviews', data);

/** 分页查询交叉审查 */
export const fetchCrossReviews = (params: CrossReviewQueryDTO) =>
  request.get<any, R<PageResult<CrossReview>>>('/quality/cross-reviews', { params });

/** 获取交叉审查详情 */
export const fetchCrossReviewDetail = (id: string) =>
  request.get<any, R<CrossReview>>(`/quality/cross-reviews/${id}`);

// ============ 质量检测配置组 ============

/** 查询质量检测配置组列表 */
export const fetchQualityProfiles = () =>
  request.get<any, R<QualityProfileConfig[]>>('/quality/config-profiles');

/** 查询质量检测配置组详情 */
export const fetchQualityProfileDetail = (id: string) =>
  request.get<any, R<QualityProfileConfig>>(`/quality/config-profiles/${id}`);

/** 创建质量检测配置组 */
export const createQualityProfile = (data: QualityProfileConfigCreateDTO) =>
  request.post<any, R<QualityProfileConfig>>('/quality/config-profiles', data);

/** 更新质量检测配置组 */
export const updateQualityProfile = (id: string, data: QualityProfileConfigCreateDTO) =>
  request.put<any, R<QualityProfileConfig>>(`/quality/config-profiles/${id}`, data);

/** 删除质量检测配置组 */
export const deleteQualityProfile = (id: string) =>
  request.delete<any, R<void>>(`/quality/config-profiles/${id}`);

// ============ TanStack Query Hooks ============

export function useDeviations(params: DeviationQueryDTO) {
  return useQuery({
    queryKey: ['deviations', params],
    queryFn: () => fetchDeviations(params),
    select: (res) => res.data,
  });
}

export function useDeviationDetail(id: string) {
  return useQuery({
    queryKey: ['deviation', id],
    queryFn: () => fetchDeviationDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useDeviationStatistics(params: { specId?: string; startDate?: string; endDate?: string } = {}) {
  return useQuery({
    queryKey: ['deviation-statistics', params],
    queryFn: () => fetchDeviationStatistics(params),
    select: (res) => res.data,
  });
}

export function useIntentDefects(params: IntentDefectQueryDTO) {
  return useQuery({
    queryKey: ['intent-defects', params],
    queryFn: () => fetchIntentDefects(params),
    select: (res) => res.data,
  });
}

export function useIntentDefectDetail(id: string) {
  return useQuery({
    queryKey: ['intent-defect', id],
    queryFn: () => fetchIntentDefectDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCrossReviews(params: CrossReviewQueryDTO) {
  return useQuery({
    queryKey: ['cross-reviews', params],
    queryFn: () => fetchCrossReviews(params),
    select: (res) => res.data,
  });
}

export function useCrossReviewDetail(id: string) {
  return useQuery({
    queryKey: ['cross-review', id],
    queryFn: () => fetchCrossReviewDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useQualityProfiles() {
  return useQuery({
    queryKey: ['quality-config-profiles'],
    queryFn: fetchQualityProfiles,
    select: (res) => res.data,
  });
}

export function useQualityProfileDetail(id: string) {
  return useQuery({
    queryKey: ['quality-config-profile', id],
    queryFn: () => fetchQualityProfileDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useDetectDeviation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: detectDeviation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deviations'] });
      queryClient.invalidateQueries({ queryKey: ['deviation-statistics'] });
    },
  });
}

export function useUpdateDeviationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeviationStatusUpdateDTO }) =>
      updateDeviationStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deviations'] });
      queryClient.invalidateQueries({ queryKey: ['deviation'] });
      queryClient.invalidateQueries({ queryKey: ['deviation-statistics'] });
    },
  });
}

export function useAnalyzeIntentDefect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: analyzeIntentDefect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intent-defects'] });
    },
  });
}

export function useUpdateIntentDefectStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateIntentDefectStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intent-defects'] });
      queryClient.invalidateQueries({ queryKey: ['intent-defect'] });
    },
  });
}

export function useCreateCrossReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCrossReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-reviews'] });
    },
  });
}

export function useCreateQualityProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQualityProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-config-profiles'] });
    },
  });
}

export function useUpdateQualityProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: QualityProfileConfigCreateDTO }) =>
      updateQualityProfile(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quality-config-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['quality-config-profile', variables.id] });
    },
  });
}

export function useDeleteQualityProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQualityProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-config-profiles'] });
    },
  });
}

// ============ 质量问题 ============

/** 分页查询质量问题 */
export const fetchQualityIssues = (params: QualityIssueQueryDTO) =>
  request.get<any, R<{ records: QualityIssue[]; total: number }>>('/quality/issues', { params });

/** 质量问题统计 */
export const fetchQualityIssueStatistics = (params: { tenantId?: string; specId?: string } = {}) =>
  request.get<any, R<QualityIssueStatistics>>('/quality/issues/statistics', { params });

/** 分页查询质量任务 */
export const fetchQualityTasks = (params: { page?: number; size?: number } = {}) =>
  request.get<any, R<PageResult<QualityTask>>>('/quality/tasks', { params });

/** 获取质量问题详情 */
export const fetchQualityIssueDetail = (id: string) =>
  request.get<any, R<QualityIssue>>(`/quality/issues/${id}`);

/** 确认质量问题 */
export const acknowledgeQualityIssue = (id: string, userId?: string) =>
  request.post<any, R<void>>(`/quality/issues/${id}/acknowledge`, null, { params: { userId } });

/** 解决质量问题 */
export const resolveQualityIssue = (id: string, data: { action: string; remark?: string; userId?: string }) =>
  request.post<any, R<void>>(`/quality/issues/${id}/resolve`, data);

/** 忽略质量问题 */
export const ignoreQualityIssue = (id: string, data: { remark?: string; userId?: string }) =>
  request.post<any, R<void>>(`/quality/issues/${id}/ignore`, data);

/** 恢复被阻断的工作流 */
export const resumeQualityIssueWorkflow = (id: string, userId?: string) =>
  request.post<any, R<void>>(`/quality/issues/${id}/resume-workflow`, null, { params: { userId } });

export function useQualityIssues(params: QualityIssueQueryDTO) {
  return useQuery({
    queryKey: ['quality-issues', params],
    queryFn: () => fetchQualityIssues(params),
    select: (res) => res.data,
  });
}

export function useQualityIssueDetail(id: string) {
  return useQuery({
    queryKey: ['quality-issue', id],
    queryFn: () => fetchQualityIssueDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useQualityIssueStatistics(params: { tenantId?: string; specId?: string } = {}) {
  return useQuery({
    queryKey: ['quality-issue-statistics', params],
    queryFn: () => fetchQualityIssueStatistics(params),
    select: (res) => res.data,
  });
}

export function useQualityTasks(params: { page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ['quality-tasks', params],
    queryFn: () => fetchQualityTasks(params),
    select: (res) => res.data,
  });
}

export function useAcknowledgeQualityIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId?: string }) => acknowledgeQualityIssue(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-issues'] });
      queryClient.invalidateQueries({ queryKey: ['quality-issue'] });
      queryClient.invalidateQueries({ queryKey: ['quality-issue-statistics'] });
    },
  });
}

export function useResolveQualityIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { action: string; remark?: string; userId?: string } }) =>
      resolveQualityIssue(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-issues'] });
      queryClient.invalidateQueries({ queryKey: ['quality-issue'] });
      queryClient.invalidateQueries({ queryKey: ['quality-issue-statistics'] });
    },
  });
}

export function useIgnoreQualityIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { remark?: string; userId?: string } }) =>
      ignoreQualityIssue(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-issues'] });
      queryClient.invalidateQueries({ queryKey: ['quality-issue'] });
      queryClient.invalidateQueries({ queryKey: ['quality-issue-statistics'] });
    },
  });
}

export function useResumeQualityIssueWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId?: string }) => resumeQualityIssueWorkflow(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-issues'] });
      queryClient.invalidateQueries({ queryKey: ['quality-issue'] });
      queryClient.invalidateQueries({ queryKey: ['quality-issue-statistics'] });
    },
  });
}

/**
 * 评审管理 API 接口
 * 对应后端 ReviewController
 */
import request from './request';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { R } from '@/types/common';
import type {
  ReviewSession, ReviewComment,
  ReviewSessionCreateDTO, ReviewCommentCreateDTO, ReviewDecisionDTO,
} from '@/types/workflow';

// ============ 基础请求函数 ============

/** 创建评审会话 */
export const createReviewSession = (data: ReviewSessionCreateDTO) =>
  request.post<any, R<ReviewSession>>('/reviews/sessions', data);

/** 获取评审会话详情 */
export const fetchReviewSession = (id: string) =>
  request.get<any, R<ReviewSession>>(`/reviews/sessions/${id}`);

/** 提交评审意见 */
export const submitReviewComment = (sessionId: string, data: ReviewCommentCreateDTO) =>
  request.post<any, R<ReviewComment>>(`/reviews/sessions/${sessionId}/comments`, data);

/** 获取我的待处理评审 */
export const fetchMyPendingReviews = () =>
  request.get<any, R<ReviewSession[]>>('/reviews/sessions/my-pending');

/** 审批通过 */
export const approveReviewSession = (sessionId: string, data?: ReviewDecisionDTO) =>
  request.post<any, R<ReviewSession>>(`/reviews/sessions/${sessionId}/approve`, data || {});

/** 驳回 */
export const rejectReviewSession = (sessionId: string, data?: ReviewDecisionDTO) =>
  request.post<any, R<ReviewSession>>(`/reviews/sessions/${sessionId}/reject`, data || {});

/** 退回修改 */
export const requestModifyReviewSession = (sessionId: string, data?: ReviewDecisionDTO) =>
  request.post<any, R<ReviewSession>>(`/reviews/sessions/${sessionId}/request-modify`, data || {});

// ============ TanStack Query Hooks ============

export function useReviewSession(id: string) {
  return useQuery({
    queryKey: ['review-session', id],
    queryFn: () => fetchReviewSession(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useMyPendingReviews() {
  return useQuery({
    queryKey: ['my-pending-reviews'],
    queryFn: fetchMyPendingReviews,
    select: (res) => res.data,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });
}

export function useCreateReviewSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReviewSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-pending-reviews'] });
    },
  });
}

export function useSubmitReviewComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: ReviewCommentCreateDTO }) =>
      submitReviewComment(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-session'] });
    },
  });
}

export function useApproveReviewSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data?: ReviewDecisionDTO }) =>
      approveReviewSession(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-session'] });
      queryClient.invalidateQueries({ queryKey: ['my-pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['spec-workbench'] });
      queryClient.invalidateQueries({ queryKey: ['spec'] });
      queryClient.invalidateQueries({ queryKey: ['specs'] });
      queryClient.invalidateQueries({ queryKey: ['in-app-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['in-app-unread-count'] });
    },
  });
}

export function useRejectReviewSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data?: ReviewDecisionDTO }) =>
      rejectReviewSession(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-session'] });
      queryClient.invalidateQueries({ queryKey: ['my-pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['spec-workbench'] });
      queryClient.invalidateQueries({ queryKey: ['spec'] });
      queryClient.invalidateQueries({ queryKey: ['specs'] });
      queryClient.invalidateQueries({ queryKey: ['in-app-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['in-app-unread-count'] });
    },
  });
}

export function useRequestModifyReviewSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data?: ReviewDecisionDTO }) =>
      requestModifyReviewSession(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-session'] });
      queryClient.invalidateQueries({ queryKey: ['my-pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['spec-workbench'] });
      queryClient.invalidateQueries({ queryKey: ['spec'] });
      queryClient.invalidateQueries({ queryKey: ['specs'] });
      queryClient.invalidateQueries({ queryKey: ['in-app-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['in-app-unread-count'] });
    },
  });
}

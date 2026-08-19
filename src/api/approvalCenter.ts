import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import request from './request';
import { downloadWithAuth } from './download';
import type { PageResult, R } from '@/types/common';
import type {
  ApprovalCenterBatchActionResult,
  ApprovalCenterBatchAssignDTO,
  ApprovalCenterBatchReviewDTO,
  ApprovalCenterItem,
  ApprovalCenterQueryDTO,
} from '@/types/approvalCenter';

export const fetchApprovalCenterItems = (params: ApprovalCenterQueryDTO) =>
  request.get<unknown, R<PageResult<ApprovalCenterItem>>>('/approval-center/items', { params });

export const batchReviewApprovalCenterItems = (data: ApprovalCenterBatchReviewDTO) =>
  request.post<unknown, R<ApprovalCenterBatchActionResult>>('/approval-center/batch-review', data);

export const batchAssignApprovalCenterItems = (data: ApprovalCenterBatchAssignDTO) =>
  request.post<unknown, R<ApprovalCenterBatchActionResult>>('/approval-center/batch-assign', data);

export const exportApprovalCenterAudit = (params: ApprovalCenterQueryDTO) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const suffix = query.toString();
  return downloadWithAuth(`/approval-center/audit/export${suffix ? `?${suffix}` : ''}`, 'approval-audit.csv');
};

export function useApprovalCenterItems(params: ApprovalCenterQueryDTO) {
  return useQuery({
    queryKey: ['approval-center-items', params],
    queryFn: () => fetchApprovalCenterItems(params),
    select: (res) => res.data,
  });
}

export function useBatchReviewApprovalCenterItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: batchReviewApprovalCenterItems,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-center-items'] });
      queryClient.invalidateQueries({ queryKey: ['review-session'] });
      queryClient.invalidateQueries({ queryKey: ['my-pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['in-app-inbox'] });
    },
  });
}

export function useBatchAssignApprovalCenterItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: batchAssignApprovalCenterItems,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-center-items'] });
      queryClient.invalidateQueries({ queryKey: ['quality-issue'] });
      queryClient.invalidateQueries({ queryKey: ['approval-center-security-incident'] });
      queryClient.invalidateQueries({ queryKey: ['approval-center-security-incident-actions'] });
      queryClient.invalidateQueries({ queryKey: ['in-app-inbox'] });
    },
  });
}

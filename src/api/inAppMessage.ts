/**
 * 站内信 API
 */
import request from './request';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PageResult, R } from '@/types/common';
import type { InAppMessage } from '@/types/notification';

export const fetchInAppInbox = (params?: { page?: number; size?: number; status?: string; keyword?: string }) =>
  request.get<any, R<PageResult<InAppMessage>>>('/in-app-messages/inbox', { params });

export const fetchInAppUnreadCount = () =>
  request.get<any, R<number>>('/in-app-messages/unread-count');

export const markInAppMessageRead = (recipientId: string) =>
  request.post<any, R<void>>(`/in-app-messages/${recipientId}/read`);

export const archiveInAppMessage = (recipientId: string) =>
  request.post<any, R<void>>(`/in-app-messages/${recipientId}/archive`);

export function useInAppInbox(params?: { page?: number; size?: number; status?: string; keyword?: string }) {
  return useQuery({
    queryKey: ['in-app-inbox', params],
    queryFn: () => fetchInAppInbox(params),
    select: (res) => res.data,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
}

export function useInAppUnreadCount() {
  return useQuery({
    queryKey: ['in-app-unread-count'],
    queryFn: fetchInAppUnreadCount,
    select: (res) => res.data,
    refetchInterval: 10000,
  });
}

export function useMarkInAppMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markInAppMessageRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['in-app-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['in-app-unread-count'] });
    },
  });
}

export function useArchiveInAppMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveInAppMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['in-app-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['in-app-unread-count'] });
    },
  });
}

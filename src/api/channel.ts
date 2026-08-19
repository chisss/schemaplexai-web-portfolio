/**
 * 通知渠道管理 API
 */
import request from './request';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { R, PageResult } from '@/types/common';
import type {
  NotificationChannel, NotificationChannelCreateDTO,
  NotificationChannelUpdateDTO, NotificationChannelQueryDTO,
} from '@/types/integration';

// ============ 基础请求函数 ============

export const createChannel = (data: NotificationChannelCreateDTO) =>
  request.post<any, R<NotificationChannel>>('/notification-channels', data);

export const fetchChannels = (params: NotificationChannelQueryDTO) =>
  request.get<any, R<PageResult<NotificationChannel>>>('/notification-channels', { params });

export const fetchChannelDetail = (id: string) =>
  request.get<any, R<NotificationChannel>>(`/notification-channels/${id}`);

export const updateChannel = (id: string, data: NotificationChannelUpdateDTO) =>
  request.put<any, R<NotificationChannel>>(`/notification-channels/${id}`, data);

export const deleteChannel = (id: string) =>
  request.delete<any, R<void>>(`/notification-channels/${id}`);

export const testChannel = (id: string) =>
  request.post<any, R<NotificationChannel>>(`/notification-channels/${id}/test`);

// ============ TanStack Query Hooks ============

export function useChannels(params: NotificationChannelQueryDTO) {
  return useQuery({
    queryKey: ['channels', params],
    queryFn: () => fetchChannels(params),
    select: (res) => res.data,
  });
}

export function useChannelDetail(id: string) {
  return useQuery({
    queryKey: ['channel', id],
    queryFn: () => fetchChannelDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NotificationChannelUpdateDTO }) =>
      updateChannel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['channel'] });
    },
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useTestChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: testChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

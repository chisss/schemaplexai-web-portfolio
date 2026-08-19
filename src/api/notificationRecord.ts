import { useQuery } from '@tanstack/react-query';
import request from './request';
import type { PageResult, R } from '@/types/common';
import type { NotificationRecord, NotificationRecordQueryDTO } from '@/types/integration';

export const fetchNotificationRecords = (params: NotificationRecordQueryDTO) =>
  request.get<any, R<PageResult<NotificationRecord>>>('/notification-records', { params });

export const fetchNotificationRecordDetail = (id: string) =>
  request.get<any, R<NotificationRecord>>(`/notification-records/${id}`);

export function useNotificationRecords(params: NotificationRecordQueryDTO) {
  return useQuery({
    queryKey: ['notification-records', params],
    queryFn: () => fetchNotificationRecords(params),
    select: (res) => res.data,
  });
}

export function useNotificationRecordDetail(id?: string) {
  return useQuery({
    queryKey: ['notification-record', id],
    queryFn: () => fetchNotificationRecordDetail(id!),
    select: (res) => res.data,
    enabled: !!id,
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import request from './request';
import type { PageResult, R } from '@/types/common';
import type {
  MessageTemplate,
  MessageTemplateCreateDTO,
  MessageTemplateDefinition,
  MessageTemplateQueryDTO,
  MessageTemplateUpdateDTO,
} from '@/types/integration';

export const fetchMessageTemplates = (params: MessageTemplateQueryDTO) =>
  request.get<any, R<PageResult<MessageTemplate>>>('/message-templates', { params });

export const fetchMessageTemplateDetail = (id: string) =>
  request.get<any, R<MessageTemplate>>(`/message-templates/${id}`);

export const createMessageTemplate = (data: MessageTemplateCreateDTO) =>
  request.post<any, R<MessageTemplate>>('/message-templates', data);

export const updateMessageTemplate = (id: string, data: MessageTemplateUpdateDTO) =>
  request.put<any, R<MessageTemplate>>(`/message-templates/${id}`, data);

export const deleteMessageTemplate = (id: string) =>
  request.delete<any, R<void>>(`/message-templates/${id}`);

export const fetchMessageTemplateDefinitions = () =>
  request.get<any, R<MessageTemplateDefinition[]>>('/message-templates/definitions');

export function useMessageTemplates(params: MessageTemplateQueryDTO) {
  return useQuery({
    queryKey: ['message-templates', params],
    queryFn: () => fetchMessageTemplates(params),
    select: (res) => res.data,
  });
}

export function useMessageTemplateDetail(id: string) {
  return useQuery({
    queryKey: ['message-template', id],
    queryFn: () => fetchMessageTemplateDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useMessageTemplateDefinitions() {
  return useQuery({
    queryKey: ['message-template-definitions'],
    queryFn: fetchMessageTemplateDefinitions,
    select: (res) => res.data,
  });
}

export function useCreateMessageTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMessageTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      queryClient.invalidateQueries({ queryKey: ['message-template-definitions'] });
    },
  });
}

export function useUpdateMessageTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MessageTemplateUpdateDTO }) =>
      updateMessageTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
    },
  });
}

export function useDeleteMessageTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMessageTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
    },
  });
}

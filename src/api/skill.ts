/**
 * Skill 管理 API
 */
import request from './request';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { R, PageResult } from '@/types/common';
import type { Skill, SkillCreateDTO, SkillUpdateDTO, SkillQueryDTO } from '@/types/integration';

// ============ 基础请求函数 ============

export const createSkill = (data: SkillCreateDTO) =>
  request.post<any, R<Skill>>('/skills', data);

export const fetchSkills = (params: SkillQueryDTO) =>
  request.get<any, R<PageResult<Skill>>>('/skills', { params });

export const fetchSkillDetail = (id: string) =>
  request.get<any, R<Skill>>(`/skills/${id}`);

export const updateSkill = (id: string, data: SkillUpdateDTO) =>
  request.put<any, R<Skill>>(`/skills/${id}`, data);

export const deleteSkill = (id: string) =>
  request.delete<any, R<void>>(`/skills/${id}`);

// ============ TanStack Query Hooks ============

export function useSkills(params: SkillQueryDTO) {
  return useQuery({
    queryKey: ['skills', params],
    queryFn: () => fetchSkills(params),
    select: (res) => res.data,
  });
}

export function useSkillDetail(id: string) {
  return useQuery({
    queryKey: ['skill', id],
    queryFn: () => fetchSkillDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SkillUpdateDTO }) =>
      updateSkill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skill'] });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

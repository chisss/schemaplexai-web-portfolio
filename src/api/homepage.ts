import request from './request';
import { useQuery } from '@tanstack/react-query';
import type { R } from '@/types/common';
import type { HomepageAggregate, HomepageMode } from '@/types/homepage';

export const fetchHomepageAggregate = (mode?: HomepageMode) =>
  request.get<any, R<HomepageAggregate>>('/homepage/aggregate', {
    params: mode ? { mode } : undefined,
  });

export function useHomepageAggregate(mode?: HomepageMode) {
  return useQuery({
    queryKey: ['homepage-aggregate', mode],
    queryFn: () => fetchHomepageAggregate(mode),
    select: (res) => res.data,
    refetchInterval: 30000,
  });
}

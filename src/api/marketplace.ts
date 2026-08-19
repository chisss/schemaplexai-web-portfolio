import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import request from './request';
import type { R, PageResult } from '@/types/common';
import type { MarketplacePlugin, MarketplacePluginQuery } from '@/types/marketplace';

export const fetchMarketplacePlugins = (params: MarketplacePluginQuery) =>
  request.get<any, R<PageResult<MarketplacePlugin>>>('/marketplace/plugins', { params });

export const installMarketplacePlugin = (id: string) =>
  request.post<any, R<void>>(`/marketplace/plugins/${id}/install`);

export const uninstallMarketplacePlugin = (id: string) =>
  request.delete<any, R<void>>(`/marketplace/plugins/${id}/install`);

export function useMarketplacePlugins(params: MarketplacePluginQuery) {
  return useQuery({
    queryKey: ['marketplace-plugins', params],
    queryFn: () => fetchMarketplacePlugins(params),
    select: (res) => res.data,
  });
}

export function useInstallMarketplacePlugin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: installMarketplacePlugin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-plugins'] });
      queryClient.invalidateQueries({ queryKey: ['agent-tools'] });
    },
  });
}

export function useUninstallMarketplacePlugin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uninstallMarketplacePlugin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-plugins'] });
      queryClient.invalidateQueries({ queryKey: ['agent-tools'] });
    },
  });
}

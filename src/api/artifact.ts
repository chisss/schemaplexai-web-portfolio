import { useQuery } from '@tanstack/react-query';
import request from './request';
import { downloadWithAuth } from './download';
import type { R } from '@/types/common';
import type { Artifact } from '@/types/artifact';

export const fetchArtifactDetail = (id: string) =>
  request.get<any, R<Artifact>>(`/artifacts/${id}`);

export const downloadArtifact = (id: string) =>
  downloadWithAuth(`/artifacts/${id}/download`, `artifact-${id}.bin`);

export function useArtifactDetail(id: string) {
  return useQuery({
    queryKey: ['artifact', id],
    queryFn: () => fetchArtifactDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

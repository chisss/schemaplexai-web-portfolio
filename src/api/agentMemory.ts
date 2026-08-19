import request from './request';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface AgentMemory {
  id: string;
  tenantId: string;
  agentId: string;
  executionId?: string;
  memoryType: 'FACT' | 'PREFERENCE' | 'CONSTRAINT' | 'PATTERN';
  phase: 'RAW' | 'CONSOLIDATED';
  content: string;
  relevanceScore: number;
  sourceTurnCount?: number;
  expiresAt?: string;
  consolidatedInto?: string;
  createdAt: string;
}

export function fetchAgentMemories(agentId: string) {
  return request.get<AgentMemory[]>('/agent-memories', { params: { agentId } });
}

export function deleteAgentMemory(id: string) {
  return request.delete(`/agent-memories/${id}`);
}

export function useAgentMemories(agentId?: string) {
  return useQuery({
    queryKey: ['agent-memories', agentId],
    queryFn: () => fetchAgentMemories(agentId!).then(r => r.data),
    enabled: !!agentId,
  });
}

export function useDeleteAgentMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAgentMemory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent-memories'] }),
  });
}

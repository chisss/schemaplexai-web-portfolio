import type { AvailableTool } from '@/types/agent';

export function buildToolSelectionKey(tool: Pick<AvailableTool, 'sourceType' | 'sourceRefId' | 'toolCode'>) {
  return `${tool.sourceType}:${tool.sourceRefId ?? ''}:${tool.toolCode}`;
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentTeamMember } from '@/types/agent';

export interface AgentDraftBinding {
  key: string;
  title: string;
  content: string;
  sourceType: 'manual' | 'context_module' | 'gitlab';
}

export interface AgentDraftStep1Values {
  name?: string;
  agentType?: 'team' | 'solo';
  description?: string;
  aiModel?: string;
  aiModelType?: 'model' | 'model_group';
  aiModelGroupId?: string;
  agentTag?: string[] | string;
}

export interface AgentDraftSnapshot {
  currentStep: number;
  agentId?: string;
  agentType: 'team' | 'solo';
  aiModelType: 'model' | 'model_group';
  selectedTemplateCode?: string;
  bindingSourceType: 'manual' | 'context_module' | 'gitlab';
  selectedBuiltinTools: string[];
  members: AgentTeamMember[];
  bindings: AgentDraftBinding[];
  step1Values: AgentDraftStep1Values;
}

interface AgentDraftState {
  draft: AgentDraftSnapshot | null;
  lastSavedAt: number | null;
  saveDraft: (draft: AgentDraftSnapshot) => void;
  clearDraft: () => void;
}

export const useAgentDraftStore = create<AgentDraftState>()(
  persist(
    (set) => ({
      draft: null,
      lastSavedAt: null,
      saveDraft: (draft) => set({ draft, lastSavedAt: Date.now() }),
      clearDraft: () => set({ draft: null, lastSavedAt: null }),
    }),
    {
      name: 'schemaplexai-agent-draft',
    },
  ),
);

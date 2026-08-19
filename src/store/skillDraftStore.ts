/**
 * 技能草稿状态管理
 * 用于技能创建向导的临时数据存储
 */
import { create } from 'zustand';

export type SkillType = 'builtin' | 'http' | 'javascript' | 'python';

export interface ParameterSchema {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  default?: string;
}

export interface ImplementationConfig {
  type: 'script' | 'http';
  content?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
}

export interface SkillDraft {
  // 基本信息
  name: string;
  displayName: string;
  description: string;
  version: string;
  category: SkillType;
  // 参数配置
  parameters: ParameterSchema[];
  // 实现配置
  implementation: ImplementationConfig;
}

interface SkillDraftState {
  draft: SkillDraft;
  currentStep: number;
  resetDraft: () => void;
  updateBasicInfo: (info: Partial<Pick<SkillDraft, 'name' | 'displayName' | 'description' | 'version' | 'category'>>) => void;
  updateParameters: (parameters: ParameterSchema[]) => void;
  addParameter: () => void;
  removeParameter: (index: number) => void;
  updateParameter: (index: number, param: ParameterSchema) => void;
  updateImplementation: (impl: ImplementationConfig) => void;
  setCurrentStep: (step: number) => void;
}

const initialDraft: SkillDraft = {
  name: '',
  displayName: '',
  description: '',
  version: '1.0.0',
  category: 'builtin',
  parameters: [],
  implementation: { type: 'script', content: '' },
};

export const useSkillDraftStore = create<SkillDraftState>()((set) => ({
  draft: { ...initialDraft },
  currentStep: 0,

  resetDraft: () => set({ draft: { ...initialDraft }, currentStep: 0 }),

  updateBasicInfo: (info) =>
    set((state) => ({
      draft: { ...state.draft, ...info },
    })),

  updateParameters: (parameters) =>
    set((state) => ({
      draft: { ...state.draft, parameters },
    })),

  addParameter: () =>
    set((state) => ({
      draft: {
        ...state.draft,
        parameters: [
          ...state.draft.parameters,
          { name: '', type: 'string', required: false },
        ],
      },
    })),

  removeParameter: (index) =>
    set((state) => ({
      draft: {
        ...state.draft,
        parameters: state.draft.parameters.filter((_, i) => i !== index),
      },
    })),

  updateParameter: (index, param) =>
    set((state) => {
      const parameters = [...state.draft.parameters];
      parameters[index] = param;
      return { draft: { ...state.draft, parameters } };
    }),

  updateImplementation: (impl) =>
    set((state) => ({
      draft: { ...state.draft, implementation: impl },
    })),

  setCurrentStep: (step) => set({ currentStep: step }),
}));

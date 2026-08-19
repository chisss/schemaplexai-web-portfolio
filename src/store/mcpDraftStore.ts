/**
 * MCP Server 草稿状态管理
 * 用于 MCP Server 创建向导的临时数据存储
 */
import { create } from 'zustand';

export interface HeaderConfig {
  key: string;
  value: string;
}

export interface McpServerAuthConfig {
  token?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  username?: string;
  password?: string;
}

export interface McpServerDraft {
  name: string;
  url: string;
  authType: 'none' | 'bearer' | 'api_key' | 'basic';
  authConfig: McpServerAuthConfig;
  description: string;
  headers: HeaderConfig[];
}

interface McpServerDraftState {
  draft: McpServerDraft;
  currentStep: number;
  resetDraft: () => void;
  updateField: <K extends keyof McpServerDraft>(key: K, value: McpServerDraft[K]) => void;
  updateAuthConfig: (config: Partial<McpServerDraft['authConfig']>) => void;
  addHeader: () => void;
  removeHeader: (index: number) => void;
  updateHeader: (index: number, header: HeaderConfig) => void;
  setCurrentStep: (step: number) => void;
}

const initialDraft: McpServerDraft = {
  name: '',
  url: '',
  authType: 'none',
  authConfig: {},
  description: '',
  headers: [],
};

export const useMcpDraftStore = create<McpServerDraftState>()((set) => ({
  draft: { ...initialDraft },
  currentStep: 0,

  resetDraft: () => set({ draft: { ...initialDraft }, currentStep: 0 }),

  updateField: (key, value) =>
    set((state) => ({
      draft: { ...state.draft, [key]: value },
    })),

  updateAuthConfig: (config) =>
    set((state) => ({
      draft: {
        ...state.draft,
        authConfig: { ...state.draft.authConfig, ...config },
      },
    })),

  addHeader: () =>
    set((state) => ({
      draft: {
        ...state.draft,
        headers: [...state.draft.headers, { key: '', value: '' }],
      },
    })),

  removeHeader: (index) =>
    set((state) => ({
      draft: {
        ...state.draft,
        headers: state.draft.headers.filter((_, i) => i !== index),
      },
    })),

  updateHeader: (index, header) =>
    set((state) => {
      const headers = [...state.draft.headers];
      headers[index] = header;
      return { draft: { ...state.draft, headers } };
    }),

  setCurrentStep: (step) => set({ currentStep: step }),
}));

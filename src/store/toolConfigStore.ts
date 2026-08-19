/**
 * 工具配置状态管理
 * 用于工具绑定配置、模板配置的统一管理
 */
import { create } from 'zustand';
import type { AgentToolBinding, ToolConfigTemplate } from '@/types/agent';

interface ToolConfigState {
  // 当前绑定的工具
  currentBinding: AgentToolBinding | null;
  // 工具配置模板
  template: ToolConfigTemplate | null;
  // 配置值
  configValues: Record<string, any>;
  // 敏感字段列表
  sensitiveFields: string[];
  // 是否已修改
  isDirty: boolean;
  // 设置当前绑定
  setCurrentBinding: (binding: AgentToolBinding | null) => void;
  // 设置配置模板
  setTemplate: (template: ToolConfigTemplate | null) => void;
  // 更新配置值
  updateConfigValue: (key: string, value: any) => void;
  // 批量更新配置值
  setConfigValues: (values: Record<string, any>) => void;
  // 重置配置
  resetConfig: () => void;
  // 标记为已修改
  markDirty: () => void;
  // 标记为已保存
  markClean: () => void;
}

export const useToolConfigStore = create<ToolConfigState>()((set, get) => ({
  currentBinding: null,
  template: null,
  configValues: {},
  sensitiveFields: [],
  isDirty: false,

  setCurrentBinding: (binding) => set({ currentBinding: binding }),

  setTemplate: (template) => {
    const sensitiveFields: string[] = [];
    if (template?.schema?.properties) {
      Object.entries(template.schema.properties).forEach(([key, prop]: [string, any]) => {
        if (prop.sensitive || /password|secret|token|key|credential/i.test(key)) {
          sensitiveFields.push(key);
        }
      });
    }
    set({ template, sensitiveFields });
  },

  updateConfigValue: (key, value) =>
    set((state) => ({
      configValues: { ...state.configValues, [key]: value },
      isDirty: true,
    })),

  setConfigValues: (values) => set({ configValues: values, isDirty: true }),

  resetConfig: () => {
    const { template } = get();
    const defaultValues: Record<string, any> = {};

    if (template?.schema?.properties) {
      Object.entries(template.schema.properties).forEach(([key, prop]: [string, any]) => {
        if (prop.default !== undefined) {
          defaultValues[key] = prop.default;
        }
      });
    }

    set({ configValues: defaultValues, isDirty: false });
  },

  markDirty: () => set({ isDirty: true }),

  markClean: () => set({ isDirty: false }),
}));

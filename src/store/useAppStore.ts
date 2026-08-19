/**
 * 应用全局状态管理
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BreadcrumbItem {
  title: string;
  path?: string;
}

interface AppState {
  // 侧边栏折叠状态
  collapsed: boolean;
  // 主题模式
  theme: 'light' | 'dark';
  // 语言
  locale: 'zh-CN' | 'en-US';
  // 面包屑
  breadcrumbs: BreadcrumbItem[];
  // 切换侧边栏折叠
  toggleCollapsed: () => void;
  // 设置主题
  setTheme: (theme: 'light' | 'dark') => void;
  // 设置语言
  setLocale: (locale: 'zh-CN' | 'en-US') => void;
  // 设置面包屑
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      collapsed: false,
      theme: 'light',
      locale: 'zh-CN',
      breadcrumbs: [],

      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),

      setTheme: (theme) => set({ theme }),

      setLocale: (locale) => {
        localStorage.setItem('locale', locale);
        set({ locale });
      },

      setBreadcrumbs: (items) => set({ breadcrumbs: items }),
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
      }),
    }
  )
);

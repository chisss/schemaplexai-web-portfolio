import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HomepageMode } from '@/types/homepage';

interface HomepageState {
  mode: HomepageMode;
  setMode: (mode: HomepageMode) => void;
  rightPanelCollapsed: boolean;
  toggleRightPanel: () => void;
}

export const useHomepageStore = create<HomepageState>()(
  persist(
    (set) => ({
      mode: 'ai',
      setMode: (mode) => set({ mode }),
      rightPanelCollapsed: false,
      toggleRightPanel: () => set((s) => ({ rightPanelCollapsed: !s.rightPanelCollapsed })),
    }),
    {
      name: 'schemaplexai-homepage',
      partialize: (s) => ({ mode: s.mode }),
    },
  ),
);

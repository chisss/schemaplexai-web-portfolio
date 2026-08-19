/**
 * 认证状态管理
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserInfo } from '@/types/auth';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userInfo: UserInfo | null;
  tenantId: string | null;
  setTokens: (access: string, refresh: string) => void;
  setUserInfo: (user: UserInfo) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (perm: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      userInfo: null,
      tenantId: null,

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      setUserInfo: (user) => set({ userInfo: user, tenantId: user.tenantId }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          userInfo: null,
          tenantId: null,
        }),

      hasRole: (role) => get().userInfo?.roles.includes(role) ?? false,

      hasPermission: (perm) => {
        const u = get().userInfo;
        if (u?.roles.includes('SUPER_ADMIN')) return true;
        if (u?.permissions.includes('*')) return true;
        return u?.permissions.includes(perm) ?? false;
      },
    }),
    {
      name: 'schemaplexai-auth',
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        userInfo: s.userInfo,
        tenantId: s.tenantId,
      }),
    }
  )
);

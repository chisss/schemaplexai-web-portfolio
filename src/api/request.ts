/**
 * Axios 请求封装
 * - 统一拦截器
 * - Token 无感刷新
 * - 登录过期自动提示并跳转
 * - 错误处理
 */
import axios, { AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import i18n from '@/i18n';
import { openGlobalMessage } from '@/utils/antdMessageBridge';

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Token 刷新相关
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

/**
 * 统一处理登录过期：提示用户 + 清除状态 + 跳转登录页
 * 使用防抖避免多个并发请求同时触发多次提示
 */
let isRedirecting = false;
function handleSessionExpired(msg?: string) {
  if (isRedirecting) return;
  isRedirecting = true;
  const { logout } = useAuthStore.getState();
  logout();
  openGlobalMessage('warning', msg || i18n.t('auth.sessionExpired', { defaultValue: '登录已过期，请重新登录' }));
  // 延迟跳转，让用户看到提示
  setTimeout(() => {
    window.location.href = '/login';
    // 重置标志（页面跳转后自动清除，兜底用）
    setTimeout(() => { isRedirecting = false; }, 3000);
  }, 1500);
}

// 请求拦截器：注入 Token 和租户ID
request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken, tenantId } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (tenantId) {
    config.headers['X-Tenant-Id'] = tenantId;
  }
  return config;
});

// 响应拦截器：统一错误处理 + Token 无感刷新
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;
    // 后端返回 code !== 200 视为业务错误
    if (res.code !== 200) {
      // 业务层面的登录过期/未认证（某些后端通过 200 HTTP 状态码 + 业务 code 返回）
      if (res.code === 10001 || res.code === 401) {
        handleSessionExpired(res.message);
        return Promise.reject(new Error(res.message));
      }
      openGlobalMessage('error', res.message || i18n.t('common.requestFailed', { defaultValue: '请求失败' }));
      return Promise.reject(new Error(res.message));
    }
    return res;
  },
  async (error: AxiosError<{ code: number; message: string }>) => {
    // 网络不可达（无响应：断网、DNS 失败、CORS 预检失败等）
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        openGlobalMessage('error', i18n.t('common.requestTimeout', { defaultValue: '请求超时，请检查网络后重试' }));
      } else {
        openGlobalMessage('error', i18n.t('common.networkError', { defaultValue: '网络连接失败，请检查网络设置' }));
      }
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    const status = error.response?.status;
    const errorCode = error.response?.data?.code;

    // Token 过期（401 + code 10001）→ 自动刷新
    if (status === 401 && errorCode === 10001) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const { refreshToken, setTokens } = useAuthStore.getState();
          if (!refreshToken) {
            handleSessionExpired();
            return Promise.reject(error);
          }
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh`,
            { refreshToken },
          );
          const newToken = data.data.accessToken;
          const newRefreshToken = data.data.refreshToken ?? refreshToken;
          setTokens(newToken, newRefreshToken);
          onTokenRefreshed(newToken);
          // 重新发起原请求
          if (originalRequest) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return request(originalRequest);
          }
          return Promise.reject(error);
        } catch {
          // 刷新失败 → 提示用户 + 跳转登录
          handleSessionExpired(i18n.t('auth.credentialExpired', { defaultValue: '登录凭证已失效，请重新登录' }));
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }
      // 并发请求排队等待刷新
      return new Promise((resolve, reject) => {
        refreshSubscribers.push((newToken: string) => {
          if (!originalRequest) { reject(error); return; }
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(request(originalRequest));
        });
      });
    }

    // 其他 401（未携带 token / token 无效等）→ 直接跳转登录
    if (status === 401) {
      handleSessionExpired(error.response?.data?.message || i18n.t('auth.sessionExpired', { defaultValue: '登录已过期，请重新登录' }));
      return Promise.reject(error);
    }

    // 权限不足
    if (status === 403) {
      openGlobalMessage('error', i18n.t('common.forbidden', { defaultValue: '无操作权限' }));
    }

    // 请求过于频繁
    if (status === 429) {
      openGlobalMessage('warning', i18n.t('common.tooManyRequests', { defaultValue: '请求过于频繁，请稍后再试' }));
    }

    // 服务器异常
    if (status && status >= 500) {
      openGlobalMessage('error', i18n.t('common.serverError', { defaultValue: '服务器异常，请稍后重试' }));
    }

    return Promise.reject(error);
  }
);

export default request;

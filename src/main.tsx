/**
 * 应用入口文件
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { initI18n } from './i18n';
import App from './App';

const DEV_RESOURCE_RETRY_PREFIX = 'schemaplexai:dev-resource-retry';
const DEV_RESOURCE_ERROR_PATTERNS = [
  /Outdated Optimize Dep/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
];

const buildDevResourceRetryKey = () => `${DEV_RESOURCE_RETRY_PREFIX}:${window.location.pathname}${window.location.search}`;

const shouldRecoverDevResourceError = (message: string, target?: EventTarget | null) => {
  if (DEV_RESOURCE_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    return true;
  }
  if (target instanceof HTMLScriptElement) {
    return target.src.includes('/node_modules/.vite/deps/');
  }
  return false;
};

const reloadOnceForDevResourceFailure = (message: string, target?: EventTarget | null) => {
  if (!import.meta.env.DEV || !shouldRecoverDevResourceError(message, target)) {
    return;
  }
  const retryKey = buildDevResourceRetryKey();
  if (window.sessionStorage.getItem(retryKey) === '1') {
    return;
  }
  window.sessionStorage.setItem(retryKey, '1');
  window.location.reload();
};

function setupDevResourceRecovery() {
  if (!import.meta.env.DEV) {
    return;
  }
  // 开发环境在 optimize deps 失效或懒加载资源被热更新淘汰时，自动刷新一次恢复页面。
  window.addEventListener('error', (event) => {
    const target = event.target;
    const message = event instanceof ErrorEvent ? event.message || '' : '';
    reloadOnceForDevResourceFailure(message, target);
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason || '');
    reloadOnceForDevResourceFailure(message);
  });
}

const clearDevResourceRetryFlag = () => {
  if (!import.meta.env.DEV) {
    return;
  }
  window.sessionStorage.removeItem(buildDevResourceRetryKey());
};

setupDevResourceRecovery();

// 在开发环境启用 Mock 数据
async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK === 'true') {
    const { worker } = await import('./mocks/browser');
    return worker.start({
      onUnhandledRequest: 'bypass', // 未处理的请求放行
    });
  }
}

// 启动应用：Mock → i18n 初始化 → 渲染
enableMocking()
  .then(() => initI18n())
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    clearDevResourceRetryFlag();
  });

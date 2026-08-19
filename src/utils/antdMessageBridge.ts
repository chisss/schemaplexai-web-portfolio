import type { MessageInstance } from 'antd/es/message/interface';

let globalMessageApi: MessageInstance | null = null;

/**
 * 注册全局消息实例，避免在非组件上下文使用 antd 静态 message 导致告警。
 */
export function registerGlobalMessageApi(messageApi: MessageInstance) {
  globalMessageApi = messageApi;
}

/**
 * 统一分发全局消息；在应用尚未完成挂载时回退到控制台，避免丢失错误信息。
 */
export function openGlobalMessage(type: 'success' | 'info' | 'warning' | 'error', content: string) {
  if (globalMessageApi) {
    globalMessageApi.open({ type, content });
    return;
  }
  const logMethod = type === 'error' ? 'error' : 'warn';
  console[logMethod](`[global-message:${type}] ${content}`);
}

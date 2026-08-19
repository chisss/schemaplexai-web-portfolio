/**
 * MSW Browser Worker 配置
 * 整合所有 Mock Handlers
 */
import { setupWorker } from 'msw/browser';
import { authHandlers } from './handlers/auth';
import { agentHandlers } from './handlers/agent';
import { specHandlers } from './handlers/spec';
import { i18nHandlers } from './handlers/i18n';
import { workflowHandlers } from './handlers/workflow';
import { monitorHandlers } from './handlers/monitor';
import { notificationHandlers } from './handlers/notification';
import { skillHandlers } from './handlers/skill';
import { systemHandlers } from './handlers/system';
import { homepageHandlers } from './handlers/homepage';

// 整合所有 handlers（i18n 最先注册，启动时即会被请求）
export const worker = setupWorker(
  ...i18nHandlers,
  ...authHandlers,
  ...agentHandlers,
  ...specHandlers,
  ...skillHandlers,
  ...systemHandlers,
  ...monitorHandlers,
  ...notificationHandlers,
  ...workflowHandlers,
  ...homepageHandlers,
);

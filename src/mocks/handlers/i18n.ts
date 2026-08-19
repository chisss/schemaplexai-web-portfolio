/**
 * Mock 国际化接口
 */
import { http, HttpResponse } from 'msw';
import zhCN from '@/i18n/locales/zh-CN';
import enUS from '@/i18n/locales/en-US';

const MESSAGES: Record<string, unknown> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

const LOCALES = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳', enabled: true },
  { code: 'en-US', name: 'English',  flag: '🇺🇸', enabled: true },
];

export const i18nHandlers = [
  // 获取支持的语言列表
  http.get('/api/i18n/locales', () => {
    return HttpResponse.json({ code: 200, message: 'success', data: LOCALES });
  }),

  // 获取全量翻译文案
  http.get('/api/i18n/messages', ({ request }) => {
    const locale = new URL(request.url).searchParams.get('locale') || 'zh-CN';
    const messages = MESSAGES[locale] ?? MESSAGES['zh-CN'];
    return HttpResponse.json({ code: 200, message: 'success', data: messages });
  }),
];

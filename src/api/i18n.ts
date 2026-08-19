/**
 * 国际化 API 接口
 * 对应后端 I18nController
 */
import request from './request';
import type { R } from '@/types/common';
import type { I18nLocale } from '@/types/i18n';

/** 获取支持的语言列表 */
export const fetchI18nLocales = () =>
  request.get<any, R<I18nLocale[]>>('/i18n/locales');

/** 获取翻译文案 */
export const fetchI18nMessages = (locale: string) =>
  request.get<any, R<Record<string, any>>>('/i18n/messages', { params: { locale } });

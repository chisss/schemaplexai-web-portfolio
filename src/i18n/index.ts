/**
 * i18n 国际化配置
 * 文案由后端动态管理，应用启动时拉取，本地文件仅作降级兜底
 * 支持从后端获取语言列表、按需加载语言包、切换语言时重新拉取
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';
import type { I18nLocale } from '@/types/i18n';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '/api';
const FETCH_TIMEOUT_MS = 5000;

/** 本地降级文案 */
const FALLBACK_RESOURCES: Record<string, Record<string, unknown>> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function mergeMessages(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  Object.entries(override).forEach(([key, value]) => {
    const baseValue = result[key];
    if (isPlainObject(baseValue) && isPlainObject(value)) {
      result[key] = mergeMessages(baseValue, value);
      return;
    }
    result[key] = value;
  });
  return result;
}

/** 缓存后端返回的支持语言列表 */
let cachedLocales: I18nLocale[] = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳', enabled: true },
  { code: 'en-US', name: 'English', flag: '🇺🇸', enabled: true },
];

/**
 * 带超时的 fetch 封装
 */
async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 从后端拉取支持的语言列表
 * 失败时返回默认的中英文
 */
async function fetchLocales(): Promise<I18nLocale[]> {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/i18n/locales`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.code === 200 && Array.isArray(json.data)) {
      cachedLocales = json.data.filter((l: I18nLocale) => l.enabled);
      return cachedLocales;
    }
    throw new Error(json.message ?? 'i18n locales API error');
  } catch {
    // 降级使用默认语言列表
    return cachedLocales;
  }
}

/**
 * 从后端拉取指定语言的翻译文案
 * 超时或接口异常时返回本地兜底文案
 */
async function fetchMessages(locale: string): Promise<Record<string, unknown>> {
  const fallback = FALLBACK_RESOURCES[locale] ?? FALLBACK_RESOURCES['zh-CN'];
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/i18n/messages?locale=${locale}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.code === 200 && json.data) {
      return mergeMessages(fallback, json.data);
    }
    throw new Error(json.message ?? 'i18n API error');
  } catch {
    // 降级：使用本地打包的静态文案
    return fallback;
  }
}

/**
 * 获取缓存的支持语言列表
 */
export function getSupportedLocales(): I18nLocale[] {
  return cachedLocales;
}

/**
 * 切换语言并从后端重新拉取对应语言包
 * 在 HeaderBar 等组件中切换语言时调用
 */
export async function changeLanguage(locale: string): Promise<void> {
  // 先检查 i18n 中是否已有该语言的资源
  const hasResource = i18n.hasResourceBundle(locale, 'translation');
  if (!hasResource) {
    // 从后端拉取该语言的翻译文案
    const messages = await fetchMessages(locale);
    i18n.addResourceBundle(locale, 'translation', messages, true, true);
  }
  await i18n.changeLanguage(locale);
  localStorage.setItem('locale', locale);
}

/**
 * 异步初始化 i18n
 * 在 main.tsx 中 await 此函数，确保文案就绪后再渲染 App
 */
export async function initI18n(): Promise<typeof i18n> {
  const savedLocale = localStorage.getItem('locale') || 'zh-CN';

  // 并行拉取：语言列表 + 所有已知语言包
  const [locales, zhMessages, enMessages] = await Promise.all([
    fetchLocales(),
    fetchMessages('zh-CN'),
    fetchMessages('en-US'),
  ]);

  // 构建资源对象
  const resources: Record<string, { translation: Record<string, unknown> }> = {
    'zh-CN': { translation: zhMessages },
    'en-US': { translation: enMessages },
  };

  // 如果后端返回了更多语言，暂不在启动时加载，切换时按需加载
  // 仅确保当前选择的语言已加载
  if (savedLocale !== 'zh-CN' && savedLocale !== 'en-US') {
    const localeExists = locales.some(l => l.code === savedLocale);
    if (localeExists) {
      const messages = await fetchMessages(savedLocale);
      resources[savedLocale] = { translation: messages };
    }
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: savedLocale,
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false,
    },
  });

  return i18n;
}

export default i18n;

/**
 * App 根组件
 * 支持亮色/暗色主题切换 + 国际化
 * 配色方案：商务蓝 #165DFF（参考飞书/钉钉）
 */
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useAppStore } from './store/useAppStore';
import router from './router';
import { registerGlobalMessageApi } from './utils/antdMessageBridge';

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5分钟
    },
  },
});

export default function App() {
  const { theme, locale } = useAppStore();
  const isDark = theme === 'dark';
  const fontFamily = "'Fira Sans', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const fontFamilyCode = "'Fira Code', 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace";

  // 切换主题时更新 HTML 的 data-theme 属性
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  // 根据语言选择Ant Design语言包
  const antdLocale = locale === 'zh-CN' ? zhCN : enUS;

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        token: {
          colorPrimary: '#4F46E5',
          colorInfo: '#4F46E5',
          colorSuccess: '#15803D',
          colorWarning: '#EA580C',
          colorError: '#DC2626',
          colorLink: '#4F46E5',
          borderRadius: 16,
          borderRadiusLG: 24,
          borderRadiusSM: 12,
          borderRadiusXS: 10,
          fontFamily,
          fontFamilyCode,
          fontSize: 14,
          controlHeight: 44,
          controlHeightLG: 52,
          lineWidth: 1,
          colorBgBase: isDark ? '#07111F' : '#F4F7FB',
          colorBgContainer: isDark ? '#0E1A2B' : '#FFFFFF',
          colorBgElevated: isDark ? '#122034' : '#FFFFFF',
          colorBgLayout: isDark ? '#07111F' : '#EEF2FF',
          colorBgTextHover: isDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(79, 70, 229, 0.08)',
          colorBgTextActive: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(79, 70, 229, 0.14)',
          colorText: isDark ? '#E5EEF9' : '#172033',
          colorTextSecondary: isDark ? '#A8B7CB' : '#52607A',
          colorTextTertiary: isDark ? '#7D8CA5' : '#7B89A3',
          colorBorder: isDark ? 'rgba(168, 183, 203, 0.18)' : 'rgba(100, 116, 139, 0.16)',
          colorBorderSecondary: isDark ? 'rgba(168, 183, 203, 0.12)' : 'rgba(148, 163, 184, 0.16)',
          boxShadowSecondary: isDark
            ? '0 24px 64px rgba(2, 6, 23, 0.48)'
            : '0 24px 64px rgba(79, 70, 229, 0.12)',
        },
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        components: {
          Layout: {
            headerBg: 'transparent',
            siderBg: 'transparent',
            bodyBg: 'transparent',
          },
          Card: {
            colorBgContainer: isDark ? '#0E1A2B' : '#FFFFFF',
            boxShadow: 'none',
          },
          Menu: {
            itemBg: 'transparent',
            subMenuItemBg: 'transparent',
            itemColor: isDark ? '#9FB0C7' : '#51607B',
            itemSelectedBg: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.12)',
            itemSelectedColor: isDark ? '#F5F7FF' : '#1E1B4B',
            itemHoverBg: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(79, 70, 229, 0.08)',
            itemHoverColor: isDark ? '#F5F7FF' : '#312E81',
            itemActiveBg: isDark ? 'rgba(99, 102, 241, 0.24)' : 'rgba(79, 70, 229, 0.16)',
            popupBg: isDark ? '#122034' : '#FFFFFF',
          },
          Button: {
            fontWeight: 600,
            contentFontSize: 14,
            contentFontSizeLG: 15,
            defaultColor: isDark ? '#D5E2F2' : '#23314C',
            defaultBg: isDark ? 'rgba(14, 26, 43, 0.92)' : '#FFFFFF',
            defaultBorderColor: isDark ? 'rgba(168, 183, 203, 0.18)' : 'rgba(100, 116, 139, 0.18)',
            defaultHoverColor: isDark ? '#F5F7FF' : '#1E1B4B',
            defaultHoverBg: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(79, 70, 229, 0.08)',
            defaultHoverBorderColor: '#4F46E5',
            defaultActiveBg: isDark ? 'rgba(99, 102, 241, 0.18)' : 'rgba(79, 70, 229, 0.12)',
            defaultActiveBorderColor: '#4338CA',
            defaultActiveColor: isDark ? '#FFFFFF' : '#1E1B4B',
            primaryShadow: '0 16px 32px rgba(79, 70, 229, 0.28)',
          },
          Dropdown: {
            colorBgElevated: isDark ? '#122034' : '#FFFFFF',
            colorText: isDark ? '#F5F7FF' : '#172033',
            controlItemBgHover: isDark ? 'rgba(99, 102, 241, 0.14)' : 'rgba(79, 70, 229, 0.08)',
            controlItemBgActive: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.12)',
          },
          Switch: {
            colorPrimary: '#4F46E5',
            colorPrimaryHover: '#6366F1',
            handleBg: '#ffffff',
            trackMinWidth: 44,
          },
          Avatar: {
            colorBgBase: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.12)',
            colorTextPlaceholder: isDark ? '#E5EEF9' : '#312E81',
          },
          Table: {
            headerBg: isDark ? 'rgba(15, 23, 42, 0.88)' : '#F8FAFC',
            headerColor: isDark ? '#D9E3F1' : '#324154',
            rowHoverBg: isDark ? 'rgba(79, 70, 229, 0.1)' : 'rgba(79, 70, 229, 0.05)',
            colorBgContainer: 'transparent',
            borderColor: isDark ? 'rgba(168, 183, 203, 0.14)' : 'rgba(148, 163, 184, 0.18)',
          },
          Input: {
            activeBorderColor: '#4F46E5',
            hoverBorderColor: '#4F46E5',
            activeShadow: '0 0 0 4px rgba(79, 70, 229, 0.14)',
          },
          Select: {
            optionActiveBg: isDark ? 'rgba(99, 102, 241, 0.14)' : 'rgba(79, 70, 229, 0.08)',
            optionSelectedBg: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.12)',
            activeBorderColor: '#4F46E5',
            hoverBorderColor: '#4F46E5',
          },
          Tabs: {
            itemSelectedColor: isDark ? '#FFFFFF' : '#1E1B4B',
            itemColor: isDark ? '#A8B7CB' : '#52607A',
            itemHoverColor: isDark ? '#FFFFFF' : '#312E81',
            inkBarColor: '#4F46E5',
          },
          Drawer: {
            colorBgElevated: isDark ? '#0E1A2B' : '#FFFFFF',
          },
          Modal: {
            contentBg: isDark ? '#0E1A2B' : '#FFFFFF',
            headerBg: 'transparent',
          },
          Tag: {
            defaultBg: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(79, 70, 229, 0.08)',
            defaultColor: isDark ? '#D9E3F1' : '#312E81',
          },
          Breadcrumb: {
            itemColor: isDark ? '#7D8CA5' : '#70809B',
            lastItemColor: isDark ? '#E5EEF9' : '#172033',
          },
        },
      }}
    >
      <AntApp>
        <AntdFeedbackRegistrar />
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
}

function AntdFeedbackRegistrar() {
  const { message } = AntApp.useApp();

  useEffect(() => {
    registerGlobalMessageApi(message);
  }, [message]);

  return null;
}

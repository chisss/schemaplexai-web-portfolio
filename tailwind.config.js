/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // 暗色模式：匹配 App.tsx 的 data-theme="dark" 属性
  darkMode: ['selector', '[data-theme="dark"]'],
  // 避免与 Ant Design 冲突
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      // 语义化设计 Token（与 index.css :root CSS 变量对应）
      colors: {
        primary: 'var(--color-primary)',
        'primary-light': 'var(--color-primary-light)',
        'primary-dark': 'var(--color-primary-dark)',
        'primary-bg': 'var(--color-primary-bg)',
        info: 'var(--color-info)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
      },
      textColor: {
        primary: 'var(--color-primary)',
        'primary-light': 'var(--color-primary-light)',
        info: 'var(--color-info)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        base: 'var(--color-text-primary)',
        muted: 'var(--color-text-secondary)',
        faint: 'var(--color-text-tertiary)',
        dim: 'var(--color-text-quaternary)',
      },
      backgroundColor: {
        base: 'var(--color-bg-base)',
        surface: 'var(--color-bg-container)',
        elevated: 'var(--color-bg-elevated)',
        layout: 'var(--color-bg-layout)',
        fill: 'var(--color-fill-light)',
        'fill-light': 'var(--color-fill-lighter)',
        'primary-bg': 'var(--color-primary-bg)',
      },
      borderColor: {
        base: 'var(--color-border)',
        subtle: 'var(--color-border-secondary)',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Microsoft YaHei', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

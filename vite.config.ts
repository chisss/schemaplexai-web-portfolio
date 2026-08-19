import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function getNodeModulePath(id: string) {
  const marker = `${path.sep}node_modules${path.sep}`;
  const index = id.lastIndexOf(marker);
  if (index < 0) {
    return null;
  }
  return id.slice(index + marker.length).replaceAll('\\', '/');
}

function getPackageName(modulePath: string) {
  if (modulePath.startsWith('@')) {
    const [scope, name] = modulePath.split('/');
    return `${scope}/${name}`;
  }
  return modulePath.split('/')[0];
}

function normalizeChunkName(value: string) {
  return value.replaceAll('@', '').replaceAll('/', '-').replaceAll('.', '-');
}

function resolveAntdChunk(modulePath: string) {
  if (modulePath.startsWith('@ant-design/')) {
    return 'vendor-antd-core';
  }

  const normalizedPath = modulePath.replace(/^antd\/(?:es|lib)\//, '');
  const componentName = normalizedPath.split('/')[0];

  const groupMap: Record<string, string> = {
    app: 'core',
    alert: 'core',
    avatar: 'core',
    badge: 'core',
    breadcrumb: 'core',
    button: 'core',
    'config-provider': 'core',
    divider: 'core',
    drawer: 'core',
    dropdown: 'core',
    flex: 'core',
    grid: 'core',
    layout: 'core',
    locale: 'core',
    menu: 'core',
    message: 'core',
    modal: 'core',
    notification: 'core',
    pagination: 'core',
    popconfirm: 'core',
    popover: 'core',
    result: 'core',
    space: 'core',
    spin: 'core',
    steps: 'core',
    style: 'core',
    switch: 'core',
    theme: 'core',
    typography: 'core',
    card: 'async',
    collapse: 'async',
    'date-picker': 'async',
    descriptions: 'async',
    empty: 'async',
    form: 'async',
    image: 'async',
    input: 'async',
    'input-number': 'async',
    list: 'async',
    mentions: 'async',
    progress: 'async',
    radio: 'async',
    select: 'async',
    skeleton: 'async',
    table: 'async',
    tabs: 'async',
    tag: 'async',
    'time-picker': 'async',
    tooltip: 'async',
  };

  const group = groupMap[componentName] ?? 'core';
  return `vendor-antd-${group}`;
}

function resolveVendorChunk(id: string) {
  const modulePath = getNodeModulePath(id);
  if (!modulePath) {
    return undefined;
  }
  if (modulePath.startsWith('react/') || modulePath === 'react'
    || modulePath.startsWith('react-dom/') || modulePath === 'react-dom'
    || modulePath.startsWith('react-router') || modulePath.startsWith('scheduler/')) {
    return 'vendor-react';
  }
  if (modulePath.startsWith('@ant-design/icons-svg/')) {
    return 'vendor-antd-icons';
  }
  if (modulePath.startsWith('antd/') || modulePath.startsWith('@ant-design/')) {
    return resolveAntdChunk(modulePath);
  }
  if (modulePath.startsWith('@lobehub/icons/')) {
    return 'vendor-ai-icons';
  }
  if (modulePath.startsWith('echarts/') || modulePath === 'echarts'
    || modulePath.startsWith('zrender/') || modulePath.startsWith('echarts-for-react/')) {
    return 'vendor-echarts';
  }
  if (modulePath.startsWith('@antv/')) {
    return `vendor-${normalizeChunkName(getPackageName(modulePath))}`;
  }
  if (modulePath.startsWith('dagre/') || modulePath.startsWith('gl-matrix/')
    || modulePath.startsWith('bubblesets-js/')) {
    return 'vendor-antv-deps';
  }
  if (modulePath.startsWith('@xyflow/')) {
    return 'vendor-flow';
  }
  if (modulePath.startsWith('@monaco-editor/') || modulePath.startsWith('monaco-editor/')) {
    return 'vendor-monaco';
  }
  if (modulePath.startsWith('highlight.js/')) {
    return 'vendor-highlight';
  }
  if (modulePath.startsWith('react-markdown/') || modulePath.startsWith('remark-')
    || modulePath.startsWith('rehype-') || modulePath.startsWith('micromark-')
    || modulePath.startsWith('mdast-') || modulePath.startsWith('hast-')
    || modulePath.startsWith('unist-') || modulePath.startsWith('vfile')
    || modulePath.startsWith('property-information/') || modulePath.startsWith('html-url-attributes/')) {
    return 'vendor-markdown';
  }
  if (modulePath.startsWith('axios/') || modulePath.startsWith('zustand/')
    || modulePath.startsWith('@tanstack/') || modulePath.startsWith('i18next/')
    || modulePath.startsWith('react-i18next/')) {
    return 'vendor-misc';
  }
  return undefined;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
  build: {
    modulePreload: {
      resolveDependencies: (_filename, deps, context) => {
        if (context.hostType !== 'html') {
          return deps;
        }

        return deps.filter((dependency) => !dependency.includes('vendor-antd-async')
          && !dependency.includes('vendor-ai-icons'));
      },
    },
    rollupOptions: {
      output: {
        manualChunks: resolveVendorChunk,
      },
    },
    chunkSizeWarningLimit: 1150,
  },
});

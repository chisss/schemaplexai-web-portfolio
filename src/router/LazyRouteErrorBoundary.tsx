import { Component, type ReactNode } from 'react';
import { Button, Result, Space, Typography } from 'antd';
import { HomeOutlined, ReloadOutlined } from '@ant-design/icons';

interface LazyRouteErrorBoundaryProps {
  children: ReactNode;
}

interface LazyRouteErrorBoundaryState {
  error: Error | null;
}

const { Paragraph, Text } = Typography;

const DYNAMIC_IMPORT_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
];

const buildRetryStorageKey = () => `schemaplexai:lazy-route-retry:${window.location.pathname}${window.location.search}`;

const isDynamicImportError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }
  return DYNAMIC_IMPORT_ERROR_PATTERNS.some((pattern) => pattern.test(error.message));
};

export default class LazyRouteErrorBoundary extends Component<
  LazyRouteErrorBoundaryProps,
  LazyRouteErrorBoundaryState
> {
  state: LazyRouteErrorBoundaryState = {
    error: null,
  };

  componentDidMount() {
    this.clearRetryFlag();
  }

  componentDidCatch(error: Error) {
    if (!isDynamicImportError(error)) {
      return;
    }
    const retryKey = buildRetryStorageKey();
    if (window.sessionStorage.getItem(retryKey)) {
      return;
    }
    window.sessionStorage.setItem(retryKey, '1');
    window.location.reload();
  }

  static getDerivedStateFromError(error: Error): LazyRouteErrorBoundaryState {
    return { error };
  }

  private clearRetryFlag() {
    window.sessionStorage.removeItem(buildRetryStorageKey());
  }

  private handleReload = () => {
    this.clearRetryFlag();
    window.location.reload();
  };

  private handleBackHome = () => {
    this.clearRetryFlag();
    window.location.assign('/');
  };

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    const dynamicImportError = isDynamicImportError(error);

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-10">
        <Result
          status="warning"
          title={dynamicImportError ? '页面资源加载失败' : '页面暂时无法渲染'}
          subTitle={dynamicImportError
            ? '前端资源刚更新、开发服务重启或网络瞬时中断时，懒加载模块可能拉取失败。系统已自动尝试恢复一次；如果还未恢复，请刷新重试。'
            : '页面渲染时遇到未处理异常，请刷新页面或返回首页后重试。'}
          extra={(
            <Space wrap>
              <Button type="primary" icon={<ReloadOutlined />} onClick={this.handleReload}>
                刷新重试
              </Button>
              <Button icon={<HomeOutlined />} onClick={this.handleBackHome}>
                返回首页
              </Button>
            </Space>
          )}
        >
          <Paragraph style={{ marginBottom: 0 }}>
            <Text type="secondary">错误详情：</Text>
            <br />
            <Text code>{error.message}</Text>
          </Paragraph>
        </Result>
      </div>
    );
  }
}

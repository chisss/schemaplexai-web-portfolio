import { Button, Result, Space, Typography } from 'antd';
import { HomeOutlined, ReloadOutlined } from '@ant-design/icons';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

const { Paragraph, Text } = Typography;

const DYNAMIC_IMPORT_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
];

const resolveErrorMessage = (error: unknown) => {
  if (isRouteErrorResponse(error)) {
    return error.statusText || error.data || `HTTP ${error.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '未知错误';
};

const isDynamicImportError = (message: string) =>
  DYNAMIC_IMPORT_ERROR_PATTERNS.some((pattern) => pattern.test(message));

export default function RouteErrorBoundary() {
  const navigate = useNavigate();
  const error = useRouteError();
  const message = resolveErrorMessage(error);
  const dynamicImportError = isDynamicImportError(message);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <Result
        status={dynamicImportError ? 'warning' : 'error'}
        title={dynamicImportError ? '页面资源加载失败' : '页面发生异常'}
        subTitle={dynamicImportError
          ? '检测到懒加载模块拉取失败。这通常发生在前端资源更新、开发服务重启或短暂网络异常之后。'
          : '应用在当前路由渲染时发生未处理异常，请刷新后重试。'}
        extra={(
          <Space wrap>
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
              刷新重试
            </Button>
            <Button icon={<HomeOutlined />} onClick={() => navigate('/', { replace: true })}>
              返回首页
            </Button>
          </Space>
        )}
      >
        <Paragraph style={{ marginBottom: 0 }}>
          <Text type="secondary">错误详情：</Text>
          <br />
          <Text code>{message}</Text>
        </Paragraph>
      </Result>
    </div>
  );
}

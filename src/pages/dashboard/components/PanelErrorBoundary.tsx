import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Typography } from 'antd';
import { ReloadOutlined, WarningOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Props {
  panelName: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class PanelErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.panelName}] 面板渲染错误:`, error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            minHeight: 120,
            gap: 12,
          }}
        >
          <WarningOutlined style={{ fontSize: 28, color: 'var(--color-warning, #faad14)' }} />
          <Text style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
            {this.props.panelName}加载失败，不影响其他区域
          </Text>
          <Button size="small" icon={<ReloadOutlined />} onClick={this.handleRetry}>
            重试
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

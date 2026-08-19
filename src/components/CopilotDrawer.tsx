import { useMemo, useState } from 'react';
import { Alert, Button, Drawer, Input, List, Space, Tag, Typography } from 'antd';
import type { AgentExecutionEvent } from '@/types/agent';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

type ExecutionStatus = 'idle' | 'running' | 'waiting_input' | 'waiting_approval' | 'completed' | 'completed_with_fallback' | 'failed' | 'cancelled' | 'blocked' | 'paused';

interface CopilotDrawerProps {
  open: boolean;
  status: ExecutionStatus;
  logs: AgentExecutionEvent[];
  executionId?: string | null;
  onClose: () => void;
  onCancel: () => Promise<void> | void;
  onProvideInput: (message: string) => Promise<void> | void;
}

function statusTag(status: ExecutionStatus, t: (key: string) => string) {
  if (status === 'running') return <Tag color="processing">{t('execution.statusRunning')}</Tag>;
  if (status === 'waiting_input') return <Tag color="warning">{t('execution.statusWaitingInput')}</Tag>;
  if (status === 'waiting_approval') return <Tag color="orange">待审批</Tag>;
  if (status === 'completed') return <Tag color="success">{t('execution.statusCompleted')}</Tag>;
  if (status === 'completed_with_fallback') return <Tag color="warning">兜底完成</Tag>;
  if (status === 'failed') return <Tag color="error">{t('execution.statusFailed')}</Tag>;
  if (status === 'blocked') return <Tag color="error">已阻断</Tag>;
  if (status === 'paused') return <Tag color="warning">已暂停</Tag>;
  if (status === 'cancelled') return <Tag>{t('execution.statusCancelled')}</Tag>;
  return <Tag>{t('execution.statusIdle')}</Tag>;
}

export default function CopilotDrawer(props: CopilotDrawerProps) {
  const { t } = useTranslation();
  const { open, status, logs, executionId, onClose, onCancel, onProvideInput } = props;
  const [input, setInput] = useState('');
  const waitingInput = status === 'waiting_input';

  const timelineData = useMemo(() => logs.slice().reverse(), [logs]);

  return (
    <Drawer
      title={t('execution.drawerTitle')}
      width={440}
      open={open}
      onClose={onClose}
      destroyOnClose={false}
      extra={statusTag(status, t)}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        {executionId ? <Text type="secondary">{t('execution.idLabel')}: {executionId}</Text> : null}

        <Alert
          type={status === 'failed' || status === 'blocked' ? 'error' : status === 'completed' ? 'success' : status === 'paused' || status === 'waiting_approval' || status === 'completed_with_fallback' ? 'warning' : 'info'}
          showIcon
          message={
            status === 'running'
              ? t('execution.msgRunning')
              : status === 'waiting_input'
                ? t('execution.msgWaitingInput')
                : status === 'waiting_approval'
                  ? '工具执行需要审批确认'
                  : status === 'completed'
                    ? t('execution.msgCompleted')
                    : status === 'completed_with_fallback'
                      ? '已生成规则化兜底结果，需人工复核后交付'
                      : status === 'failed'
                        ? t('execution.msgFailed')
                        : status === 'blocked'
                          ? '请求命中安全策略，已阻断执行'
                          : status === 'paused'
                            ? '请求命中安全策略，已暂停等待人工处理'
                            : status === 'cancelled'
                              ? t('execution.msgCancelled')
                              : t('execution.msgIdle')
          }
        />

        <List
          size="small"
          bordered
          dataSource={timelineData}
          style={{ maxHeight: '52vh', overflow: 'auto' }}
          renderItem={(item) => (
            <List.Item>
              <Space direction="vertical" size={0}>
                <Text strong>{item.eventType}</Text>
                <Text type="secondary">{item.message || '-'}</Text>
                <Text type="secondary">
                  {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : ''}
                </Text>
              </Space>
            </List.Item>
          )}
        />

        {waitingInput ? (
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('execution.inputPlaceholder')}
            />
            <Button
              type="primary"
              onClick={async () => {
                if (!input.trim()) return;
                await onProvideInput(input.trim());
                setInput('');
              }}
            >
              {t('common.submit')}
            </Button>
          </Space.Compact>
        ) : null}

        <Button danger onClick={() => void onCancel()} disabled={status !== 'running' && status !== 'waiting_input'}>
          {t('execution.cancelExecution')}
        </Button>
      </Space>
    </Drawer>
  );
}

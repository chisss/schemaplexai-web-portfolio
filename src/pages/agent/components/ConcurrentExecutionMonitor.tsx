/**
 * 并发执行监控面板
 * 展示同一 Agent 的所有并发执行和模型负载
 */
import { Button, Card, Table, Tag, Space, Typography, Progress } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

interface ConcurrentExecution {
  executionId: string;
  userId: string;
  userName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  queuePosition?: number;
  modelUsed?: string;
  round?: number;
  startedAt?: string;
  completedAt?: string;
}

interface ModelLoad {
  modelId: string;
  modelName: string;
  currentLoad: number;
  maxLoad: number;
  status: 'normal' | 'busy' | 'full';
}

interface ConcurrentExecutionMonitorProps {
  agentId: string;
  agentName: string;
  executions: ConcurrentExecution[];
  modelLoads: ModelLoad[];
  onViewExecution?: (executionId: string) => void;
}

export default function ConcurrentExecutionMonitor({
  agentName,
  executions,
  modelLoads,
  onViewExecution,
}: ConcurrentExecutionMonitorProps) {
  const { t } = useTranslation();

  const executionColumns = [
    {
      title: t('execution.user'),
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: t('execution.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          queued: 'default',
          running: 'processing',
          completed: 'success',
          failed: 'error',
        };
        return <Tag color={colorMap[status]}>{t(`execution.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}</Tag>;
      },
    },
    {
      title: t('execution.queuePosition'),
      dataIndex: 'queuePosition',
      key: 'queuePosition',
      render: (pos?: number) => pos ?? '-',
    },
    {
      title: t('execution.model'),
      dataIndex: 'modelUsed',
      key: 'modelUsed',
      render: (model?: string) => model ? <Text code>{model}</Text> : '-',
    },
    {
      title: t('execution.round'),
      dataIndex: 'round',
      key: 'round',
      render: (r?: number) => r ?? '-',
    },
    {
      title: t('execution.startedAt'),
      dataIndex: 'startedAt',
      key: 'startedAt',
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: ConcurrentExecution) => (
        <Button type="link" size="small" onClick={() => onViewExecution?.(record.executionId)} style={{ paddingInline: 0 }}>
          {t('common.viewDetail')}
        </Button>
      ),
    },
  ];

  const getModelStatusColor = (status: ModelLoad['status']) => {
    const colorMap: Record<string, string> = {
      normal: '#059669',
      busy: '#FF7D00',
      full: '#F53F3F',
    };
    return colorMap[status];
  };

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {/* 标题 */}
        <Space>
          <SyncOutlined />
          <Title level={5} style={{ margin: 0 }}>
            {t('execution.concurrentMonitor')} - {agentName}
          </Title>
        </Space>

        {/* 模型负载可视化 */}
        {modelLoads.length > 0 && (
          <Card size="small" title={t('execution.modelLoad')}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {modelLoads.map((model) => (
                <div key={model.modelId}>
                  <Space>
                    <Text>{model.modelName}</Text>
                    <Tag color={getModelStatusColor(model.status)}>
                      {t(`execution.modelStatus.${model.status}`)}
                    </Tag>
                  </Space>
                  <Progress
                    percent={Math.round((model.currentLoad / model.maxLoad) * 100)}
                    size="small"
                    status={model.status === 'full' ? 'exception' : undefined}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {model.currentLoad} / {model.maxLoad}
                  </Text>
                </div>
              ))}
            </Space>
          </Card>
        )}

        {/* 并发执行列表 */}
        <Table
          dataSource={executions}
          columns={executionColumns}
          rowKey="executionId"
          size="small"
          pagination={false}
        />
      </Space>
    </Card>
  );
}

import { Button, Collapse, Empty, Modal, Space, Spin, Tag, Typography } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useWorkflowTemplateNodeExecutions } from '@/api/workflow';
import { formatDateTime } from '@/utils/date';

const STATUS_COLORS: Record<string, string> = {
  pending: 'default',
  running: 'processing',
  paused: 'warning',
  completed: 'success',
  failed: 'error',
  cancelled: 'default',
};

const { Text } = Typography;

interface WorkflowNodeLogModalProps {
  open: boolean;
  templateId: string;
  nodeId: string;
  nodeLabel?: string;
  onClose: () => void;
}

function renderJsonBlock(value: unknown) {
  if (value == null) return <Text type="secondary">-</Text>;
  try {
    const json = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    return (
      <pre style={{ margin: 0, padding: 12, borderRadius: 8, background: 'var(--color-bg-layout)', border: '1px solid var(--color-border)', fontSize: 12, lineHeight: 1.6, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {json}
      </pre>
    );
  } catch {
    return <Text>{String(value)}</Text>;
  }
}

export default function WorkflowNodeLogModal({
  open,
  templateId,
  nodeId,
  nodeLabel,
  onClose,
}: WorkflowNodeLogModalProps) {
  const navigate = useNavigate();
  const { data: executions = [], isLoading } = useWorkflowTemplateNodeExecutions(templateId, nodeId, 10, open);

  return (
    <Modal
      open={open}
      title={`节点执行日志${nodeLabel ? ` · ${nodeLabel}` : ''}`}
      onCancel={onClose}
      footer={null}
      width={880}
      destroyOnClose
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : executions.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前节点还没有执行日志" />
      ) : (
        <Collapse
          items={executions.map((execution) => ({
            key: execution.id,
            label: (
              <Space size={12} wrap>
                <Text strong>{execution.instanceName || execution.instanceId}</Text>
                <Tag color={STATUS_COLORS[execution.status] || 'default'}>{execution.status}</Tag>
                <Text type="secondary">开始：{execution.startedAt ? formatDateTime(execution.startedAt) : '-'}</Text>
                <Text type="secondary">结束：{execution.completedAt ? formatDateTime(execution.completedAt) : '-'}</Text>
              </Space>
            ),
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary">实例ID：{execution.instanceId}</Text>
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/workflow/executions?instanceId=${execution.instanceId}`)}
                  >
                    查看实例详情
                  </Button>
                </div>
                <div>
                  <Text strong>输入数据</Text>
                  <div style={{ marginTop: 8 }}>{renderJsonBlock(execution.inputData)}</div>
                </div>
                <div>
                  <Text strong>输出数据</Text>
                  <div style={{ marginTop: 8 }}>{renderJsonBlock(execution.outputData)}</div>
                </div>
                {execution.errorMessage ? (
                  <div>
                    <Text strong>错误信息</Text>
                    <div style={{ marginTop: 8, color: 'var(--color-error)' }}>{execution.errorMessage}</div>
                  </div>
                ) : null}
              </Space>
            ),
          }))}
        />
      )}
    </Modal>
  );
}

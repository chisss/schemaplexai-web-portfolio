import { useParams, useNavigate } from 'react-router-dom';
import { Alert, App as AntApp, Card, Descriptions, Timeline, Tag, Button, Spin, Empty, Space, Typography } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useResumeWorkflowInstance, useWorkflowInstance, useWorkflowNodeExecutions } from '@/api/workflow';
import type { SecurityCheckDecisionResult } from '@/types/securityCompliance';

const { Text } = Typography;

export default function WorkflowInstanceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const { data: instance, isLoading } = useWorkflowInstance(id!);
  const { data: executions } = useWorkflowNodeExecutions(id!);
  const resumeWorkflow = useResumeWorkflowInstance();

  if (isLoading) return <Spin size="large" />;
  if (!instance) return <Empty description="工作流实例不存在" />;
  const securityDecision = instance.variables?.securityDecision as SecurityCheckDecisionResult | undefined;

  const statusColor = {
    pending: 'default',
    running: 'processing',
    paused: 'warning',
    completed: 'success',
    failed: 'error',
    cancelled: 'default',
  };

  const timelineItems = (executions || []).map((exec: any) => ({
    key: exec.id,
    icon:
      exec.status === 'completed' ? <CheckCircleOutlined /> :
      exec.status === 'failed' ? <CloseCircleOutlined /> :
      <ClockCircleOutlined />,
    color:
      exec.status === 'completed' ? 'green' :
      exec.status === 'failed' ? 'red' : 'blue',
    content: (
      <>
        <div>
          <strong>{exec.nodeLabel}</strong>
          <Tag style={{ marginLeft: 8 }}>{exec.status}</Tag>
        </div>
        <div style={{ fontSize: 12, color: '#999' }}>
          {exec.startedAt && `开始: ${exec.startedAt}`}
          {exec.completedAt && ` | 完成: ${exec.completedAt}`}
        </div>
      </>
    ),
  }));

  return (
    <div style={{ padding: 24 }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        返回
      </Button>

      <Card title="工作流实例详情" style={{ marginBottom: 16 }}>
        {instance.status === 'paused' ? (
          <Alert
            style={{ marginBottom: 16 }}
            type="warning"
            showIcon
            title="当前工作流已暂停"
            description={instance.errorMessage || '请先处理阻断原因后再恢复执行'}
            action={(
              <Button
                type="primary"
                size="small"
                loading={resumeWorkflow.isPending}
                onClick={() => {
                  if (!id) return;
                  resumeWorkflow.mutate(id, {
                    onSuccess: () => message.success('工作流已恢复'),
                    onError: () => message.error('恢复工作流失败'),
                  });
                }}
              >
                恢复执行
              </Button>
            )}
          />
        ) : null}
        {securityDecision ? (
          <Alert
            style={{ marginBottom: 16 }}
            type={securityDecision.decision === 'block' ? 'error' : securityDecision.decision === 'pause' ? 'warning' : 'info'}
            showIcon
            title={`安全检查结果: ${securityDecision.decision}`}
            description={
              <Space orientation="vertical" size={2} style={{ width: '100%' }}>
                <span>{securityDecision.message || securityDecision.userActionTip || '当前实例包含安全拦截信息'}</span>
                {securityDecision.traceId ? <Text type="secondary">链路ID: {securityDecision.traceId}</Text> : null}
                {securityDecision.incidentId ? <Text type="secondary">事件单: {securityDecision.incidentId}</Text> : null}
              </Space>
            }
          />
        ) : null}
          <Descriptions column={2}>
            <Descriptions.Item label="实例名称">{instance.name}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusColor[instance.status as keyof typeof statusColor]}>
              {instance.status}
            </Tag>
          </Descriptions.Item>
            <Descriptions.Item label="关联 Spec">{instance.specId || '-'}</Descriptions.Item>
            <Descriptions.Item label="错误信息">{instance.errorMessage || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{instance.createdAt}</Descriptions.Item>
          </Descriptions>
      </Card>

      <Card title="节点执行时间线">
        {timelineItems.length > 0 ? (
          <Timeline items={timelineItems} />
        ) : (
          <Empty description="暂无执行记录" />
        )}
      </Card>
    </div>
  );
}

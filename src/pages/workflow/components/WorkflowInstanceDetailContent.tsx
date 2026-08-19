/**
 * 工作流实例详情内容组件
 * 可嵌入 Modal / Drawer / 独立页面复用
 */
import { Alert, Badge, Card, Collapse, Descriptions, Empty, Space, Spin, Tag, Timeline, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkflowInstance, useWorkflowNodeExecutions } from '@/api/workflow';
import { NODE_TYPE_REGISTRY, type WorkflowNodeExecution, type WorkflowNodeOutputData } from '@/types/workflow';
import { formatDateTime } from '@/utils/date';
import type { SecurityCheckDecisionResult } from '@/types/securityCompliance';

const { Text } = Typography;

interface WorkflowInstanceDetailContentProps {
  instanceId: string;
}

const STATUS_META: Record<string, { tagColor: string; badgeStatus: 'success' | 'processing' | 'error' | 'default' }> = {
  pending: { tagColor: 'default', badgeStatus: 'default' },
  running: { tagColor: 'processing', badgeStatus: 'processing' },
  paused: { tagColor: 'warning', badgeStatus: 'default' },
  completed: { tagColor: 'success', badgeStatus: 'success' },
  failed: { tagColor: 'error', badgeStatus: 'error' },
  cancelled: { tagColor: 'default', badgeStatus: 'default' },
};

const WORKFLOW_STATUS_LABEL_KEYS: Record<string, string> = {
  pending: 'workflow.statusPending',
  running: 'workflow.statusRunning',
  paused: 'workflow.statusPaused',
  completed: 'workflow.statusCompleted',
  failed: 'workflow.statusFailed',
  cancelled: 'workflow.statusCancelled',
};

const SECURITY_DECISION_LABEL_KEYS: Record<string, string> = {
  allow: 'spec.workflowSecurityDecisionAllow',
  warn: 'spec.workflowSecurityDecisionWarn',
  block: 'spec.workflowSecurityDecisionBlock',
  pause: 'spec.workflowSecurityDecisionPause',
};

const WORKFLOW_NODE_TYPE_LABEL_KEYS = NODE_TYPE_REGISTRY.reduce<Record<string, string>>((acc, meta) => {
  acc[meta.type] = meta.labelKey;
  return acc;
}, {});

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

function resolveTracePayload(outputData?: WorkflowNodeOutputData) {
  return outputData?.tracePayload || outputData || undefined;
}

function resolveHandoffPayload(outputData?: WorkflowNodeOutputData) {
  return outputData?.handoffPayload;
}

function getStatusLabel(status: string, t: (key: string) => string) {
  const key = WORKFLOW_STATUS_LABEL_KEYS[status];
  return key ? t(key) : status || '-';
}

function getSecurityDecisionLabel(decision: string | undefined, t: (key: string) => string) {
  if (!decision) return '-';
  const key = SECURITY_DECISION_LABEL_KEYS[decision];
  return key ? t(key) : decision;
}

function getNodeTypeLabel(nodeType: string | undefined, t: (key: string) => string) {
  if (!nodeType) return '-';
  const key = WORKFLOW_NODE_TYPE_LABEL_KEYS[nodeType];
  return key ? t(key) : nodeType;
}

function getNodeLabel(exec: WorkflowNodeExecution, t: (key: string) => string) {
  return exec.nodeLabel || getNodeTypeLabel(exec.nodeType, t) || exec.nodeId;
}

function getCurrentNodeLabel(currentNodeId: string | undefined, executions: WorkflowNodeExecution[] | undefined, t: (key: string) => string) {
  if (!currentNodeId) return '-';
  const matched = executions?.find((e) => e.nodeId === currentNodeId);
  if (matched?.nodeLabel) return matched.nodeLabel;
  if (matched?.nodeType) return getNodeTypeLabel(matched.nodeType, t);
  return getNodeTypeLabel(currentNodeId, t);
}

export default function WorkflowInstanceDetailContent({ instanceId }: WorkflowInstanceDetailContentProps) {
  const { t } = useTranslation();
  const { data: instance, isLoading: instanceLoading } = useWorkflowInstance(instanceId);
  const { data: executions, isLoading: executionsLoading } = useWorkflowNodeExecutions(instanceId);

  const statusMeta = STATUS_META[instance?.status || ''] || STATUS_META.pending;
  const securityDecision = instance?.variables?.securityDecision as SecurityCheckDecisionResult | undefined;
  const currentNodeLabel = getCurrentNodeLabel(instance?.currentNodeId, executions, t);

  const timelineItems = useMemo(() => {
    if (!executions?.length) return [];
    return executions.map((exec) => {
      const isCompleted = exec.status === 'completed';
      const isFailed = exec.status === 'failed';
      return {
        color: isCompleted ? 'green' : isFailed ? 'red' : 'blue',
        icon: isCompleted ? <CheckCircleOutlined /> : isFailed ? <CloseCircleOutlined /> : <ClockCircleOutlined />,
        content: (
          <div>
            <Space>
              <Text strong>{getNodeLabel(exec, t)}</Text>
              <Tag color={isCompleted ? 'success' : isFailed ? 'error' : 'processing'}>{getStatusLabel(exec.status, t)}</Tag>
            </Space>
            <div className="text-xs text-gray-500 mt-1">
              {t('spec.workflowStartTime')}：{exec.startedAt ? formatDateTime(exec.startedAt) : '-'} | {t('spec.workflowEndTime')}：{exec.completedAt ? formatDateTime(exec.completedAt) : '-'}
            </div>
            {exec.errorMessage && <div className="text-xs text-red-500 mt-1">{exec.errorMessage}</div>}
          </div>
        ),
      };
    });
  }, [executions, t]);

  const collapseItems = useMemo(() => {
    if (!executions?.length) return [];
    return executions.map((exec) => ({
      key: exec.id,
      label: (
        <Space>
          <Text>{getNodeLabel(exec, t)}</Text>
          <Tag>{getNodeTypeLabel(exec.nodeType, t)}</Tag>
          <Tag color={exec.status === 'completed' ? 'success' : exec.status === 'failed' ? 'error' : 'processing'}>
            {getStatusLabel(exec.status, t)}
          </Tag>
        </Space>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>{t('spec.workflowNodeInputData')}</Text>
            <div className="mt-2">{renderJsonBlock(exec.inputData)}</div>
          </div>
          <div>
            <Text strong>{t('spec.workflowNodeTraceOutput')}</Text>
            <div className="mt-2">{renderJsonBlock(resolveTracePayload(exec.outputData))}</div>
          </div>
          <div>
            <Text strong>{t('spec.workflowNodeHandoff')}</Text>
            <div className="mt-2">{renderJsonBlock(resolveHandoffPayload(exec.outputData))}</div>
          </div>
          <div>
            <Text strong>{t('spec.workflowNodeContextMetrics')}</Text>
            <div className="mt-2">{renderJsonBlock(exec.outputData?.contextMetrics)}</div>
          </div>
        </Space>
      ),
    }));
  }, [executions, t]);

  if (instanceLoading) {
    return <div className="flex justify-center py-10"><Spin /></div>;
  }

  if (!instance) {
    return <Empty description={t('spec.workflowInstanceNotFound')} />;
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {securityDecision ? (
        <Alert
          type={securityDecision.decision === 'block' ? 'error' : securityDecision.decision === 'pause' || securityDecision.decision === 'warn' ? 'warning' : 'info'}
          showIcon
          message={t('spec.workflowSecurityResult', { decision: getSecurityDecisionLabel(securityDecision.decision, t) })}
          description={
            <Space direction="vertical" size={4}>
              <span>{securityDecision.message || securityDecision.userActionTip || t('spec.workflowSecurityInfoFallback')}</span>
              {securityDecision.traceId ? <Text type="secondary">{t('spec.workflowSecurityTraceId')}: {securityDecision.traceId}</Text> : null}
              {securityDecision.incidentId ? <Text type="secondary">{t('spec.workflowSecurityIncidentId')}: {securityDecision.incidentId}</Text> : null}
            </Space>
          }
        />
      ) : null}

      <Card variant="borderless" className="shadow-sm">
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label={t('spec.workflowInstanceId')}>
            <span className="font-mono text-xs">{instance.id}</span>
          </Descriptions.Item>
          <Descriptions.Item label={t('common.status')}>
            <Badge status={statusMeta.badgeStatus} text={<Tag color={statusMeta.tagColor}>{getStatusLabel(instance.status, t)}</Tag>} />
          </Descriptions.Item>
          <Descriptions.Item label={t('common.name')}>{instance.name || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('spec.workflowTemplateId')}>{instance.templateId || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('spec.workflowRelatedSpec')}>{instance.specId || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('spec.workflowCurrentNode')}>{currentNodeLabel}</Descriptions.Item>
          <Descriptions.Item label={t('spec.workflowStartTime')}>{instance.startedAt ? formatDateTime(instance.startedAt) : '-'}</Descriptions.Item>
          <Descriptions.Item label={t('spec.workflowEndTime')}>{instance.completedAt ? formatDateTime(instance.completedAt) : '-'}</Descriptions.Item>
          <Descriptions.Item label={t('common.createTime')}>{instance.createdAt ? formatDateTime(instance.createdAt) : '-'}</Descriptions.Item>
          <Descriptions.Item label={t('common.updateTime')}>{instance.updatedAt ? formatDateTime(instance.updatedAt) : '-'}</Descriptions.Item>
          {instance.errorMessage && (
            <Descriptions.Item label={t('common.errorMessage')} span={2}>
              <span className="text-red-500">{instance.errorMessage}</span>
            </Descriptions.Item>
          )}
          {Boolean(instance.variables?.securityPendingStart) && (
            <Descriptions.Item label={t('spec.workflowSecurityPaused')} span={2}>
              <Tag color="warning">{t('spec.workflowSecurityPausedHint')}</Tag>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title={t('spec.workflowNodeTimeline')} variant="borderless" className="shadow-sm">
        {executionsLoading ? <Spin /> : timelineItems.length > 0 ? <Timeline items={timelineItems} /> : <Empty description={t('spec.workflowNodeNoExecutions')} />}
      </Card>

      <Card title={t('spec.workflowNodeDetails')} variant="borderless" className="shadow-sm">
        {collapseItems.length > 0 ? <Collapse items={collapseItems} /> : <Empty description={t('spec.workflowNodeNoDetails')} />}
      </Card>
    </Space>
  );
}

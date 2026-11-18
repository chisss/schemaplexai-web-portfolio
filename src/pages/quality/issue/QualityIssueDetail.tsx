import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Button, Space, Spin, message, Modal, Input, Select,
  Timeline, List, Typography, Alert, Badge,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import {
  useQualityIssueDetail,
  useAcknowledgeQualityIssue,
  useResolveQualityIssue,
  useIgnoreQualityIssue,
  useResumeQualityIssueWorkflow,
} from '@/api/quality';
import type { QualityIssueFinding } from '@/types/quality';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const severityColorMap: Record<string, string> = {
  critical: 'red',
  warning: 'orange',
  info: 'blue',
};

const statusColorMap: Record<string, string> = {
  open: 'red',
  acknowledged: 'orange',
  resolving: 'blue',
  resolved: 'green',
  ignored: 'default',
};

const statusLabelKeyMap: Record<string, string> = {
  open: 'quality.issue.statusOpen',
  acknowledged: 'quality.issue.statusAcknowledged',
  resolving: 'quality.issue.statusResolving',
  resolved: 'quality.issue.statusResolved',
  ignored: 'quality.issue.statusIgnored',
};

const gateDecisionColorMap: Record<string, string> = {
  pass: 'green',
  warn: 'gold',
  pause: 'orange',
  fail: 'red',
  retry: 'blue',
};

const SEVERITY_LABEL_KEYS: Record<string, string> = {
  critical: 'quality.severity.critical',
  high: 'quality.severity.high',
  warning: 'quality.severity.warning',
  medium: 'quality.severity.medium',
  info: 'quality.severity.info',
  low: 'quality.severity.low',
};

const GATE_DECISION_LABEL_KEYS: Record<string, string> = {
  pass: 'quality.gateDecision.pass',
  warn: 'quality.gateDecision.warn',
  pause: 'quality.gateDecision.pause',
  fail: 'quality.gateDecision.fail',
  retry: 'quality.gateDecision.retry',
};

function labelOf(keyMap: Record<string, string>, value: string | undefined, t: TFunction) {
  if (!value) {
    return '-';
  }
  return keyMap[value] ? t(keyMap[value]) : value;
}

const issueSeverityLabel = (value: string, t: TFunction) => labelOf(SEVERITY_LABEL_KEYS, value, t);
const gateDecisionLabel = (value: string, t: TFunction) => labelOf(GATE_DECISION_LABEL_KEYS, value, t);

const findingSeverityColor: Record<string, string> = {
  critical: '#cf1322',
  warning: '#fa8c16',
  info: '#1677ff',
};

const QualityIssueDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: issue, isLoading } = useQualityIssueDetail(id || '');

  const acknowledgeMutation = useAcknowledgeQualityIssue();
  const resolveMutation = useResolveQualityIssue();
  const ignoreMutation = useIgnoreQualityIssue();
  const resumeMutation = useResumeQualityIssueWorkflow();

  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [ignoreModalOpen, setIgnoreModalOpen] = useState(false);
  const [resolveAction, setResolveAction] = useState<string>('fix');
  const [resolveRemark, setResolveRemark] = useState('');
  const [ignoreRemark, setIgnoreRemark] = useState('');

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  if (!issue) {
    return <div style={{ textAlign: 'center', padding: 80 }}>{t('quality.issue.notFound')}</div>;
  }

  const canAcknowledge = issue.status === 'open';
  const canResolve = issue.status === 'open' || issue.status === 'acknowledged';
  const canIgnore = issue.status === 'open' || issue.status === 'acknowledged';
  const canResume = issue.gateDecision === 'pause' && !!issue.workflowInstanceId
    && (issue.status === 'open' || issue.status === 'acknowledged');

  const handleAcknowledge = () => {
    acknowledgeMutation.mutate({ id: issue.id }, {
      onSuccess: () => message.success(t('quality.issue.msgAcknowledged')),
    });
  };

  const handleResolve = () => {
    resolveMutation.mutate(
      { id: issue.id, data: { action: resolveAction, remark: resolveRemark } },
      {
        onSuccess: () => {
          message.success(t('quality.issue.msgResolved'));
          setResolveModalOpen(false);
          setResolveRemark('');
        },
      },
    );
  };

  const handleIgnore = () => {
    ignoreMutation.mutate(
      { id: issue.id, data: { remark: ignoreRemark } },
      {
        onSuccess: () => {
          message.success(t('quality.issue.msgIgnored'));
          setIgnoreModalOpen(false);
          setIgnoreRemark('');
        },
      },
    );
  };

  const handleResume = () => {
    Modal.confirm({
      title: t('quality.issue.resumeConfirmTitle'),
      content: t('quality.issue.resumeConfirmContent'),
      okText: t('quality.issue.resumeOk'),
      cancelText: t('common.cancel'),
      onOk: () => {
        resumeMutation.mutate({ id: issue.id }, {
          onSuccess: () => message.success(t('quality.issue.msgWorkflowResumed')),
        });
      },
    });
  };

  const findings: QualityIssueFinding[] = issue.findingsJson ?? [];

  return (
    <div>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/quality/issues')}
        style={{ marginBottom: 12, paddingLeft: 0 }}
      >
        {t('quality.issue.backToList')}
      </Button>

      {/* 基本信息 */}
      <Card title={t('quality.issue.basicInfo')} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} bordered size="small">
          <Descriptions.Item label={t('quality.issue.title')} span={3}>{issue.title}</Descriptions.Item>
          <Descriptions.Item label={t('quality.issue.status')}>
            <Badge
              status={issue.status === 'open' ? 'error' : issue.status === 'resolved' ? 'success' : 'processing'}
              text={<Tag color={statusColorMap[issue.status]}>{statusLabelKeyMap[issue.status] ? t(statusLabelKeyMap[issue.status]) : issue.status}</Tag>}
            />
          </Descriptions.Item>
          <Descriptions.Item label={t('quality.issue.severity')}>
            <Tag color={severityColorMap[issue.severity] || 'default'}>{issueSeverityLabel(issue.severity, t)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('quality.issue.gateDecision')}>
            {issue.gateDecision
              ? <Tag color={gateDecisionColorMap[issue.gateDecision] || 'default'}>{gateDecisionLabel(issue.gateDecision, t)}</Tag>
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('quality.issue.issueType')}>
            {issue.issueType === 'deviation' ? t('quality.issue.typeDeviation') : t('quality.issue.typeIntentDefect')}
          </Descriptions.Item>
          <Descriptions.Item label={t('quality.issue.source')}>{issue.sourceType || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('quality.issue.executionStrategy')}>{issue.executionStrategy || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('quality.issue.score')}>{issue.score ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('quality.issue.findingCount')}>{issue.findingCount}</Descriptions.Item>
          <Descriptions.Item label={t('quality.issue.createdAt')}>
            {issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '-'}
          </Descriptions.Item>
        </Descriptions>

        {issue.summary && (
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">{t('quality.issue.summary')}：</Text>
            <Paragraph style={{ marginTop: 4 }}>{issue.summary}</Paragraph>
          </div>
        )}
      </Card>

      {/* 关联上下文 */}
      {(issue.specId || issue.workflowInstanceId || issue.crossReviewId) && (
        <Card title={t('quality.issue.relatedContext')} size="small" style={{ marginBottom: 16 }}>
          <Descriptions column={2} size="small">
            {issue.specId && <Descriptions.Item label="Spec ID">{issue.specId}</Descriptions.Item>}
            {issue.taskId && <Descriptions.Item label="Task ID">{issue.taskId}</Descriptions.Item>}
            {issue.workflowInstanceId && (
              <Descriptions.Item label={t('quality.issue.workflowInstance')}>{issue.workflowInstanceId}</Descriptions.Item>
            )}
            {issue.workflowNodeId && (
              <Descriptions.Item label={t('quality.issue.workflowNode')}>{issue.workflowNodeId}</Descriptions.Item>
            )}
            {issue.crossReviewId && (
              <Descriptions.Item label={t('quality.issue.crossReview')}>{issue.crossReviewId}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* 闸门阻断提示 */}
      {canResume && (
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message={t('quality.issue.gatePausedAlertTitle')}
          description={t('quality.issue.gatePausedAlertDesc')}
          style={{ marginBottom: 16 }}
          action={
            <Button type="primary" danger size="small" onClick={handleResume} loading={resumeMutation.isPending}>
              {t('quality.issue.resumeWorkflow')}
            </Button>
          }
        />
      )}

      {/* 操作区 */}
      {(canAcknowledge || canResolve || canIgnore) && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space>
            {canAcknowledge && (
              <Button
                icon={<CheckCircleOutlined />}
                onClick={handleAcknowledge}
                loading={acknowledgeMutation.isPending}
              >
                {t('quality.issue.acknowledge')}
              </Button>
            )}
            {canResolve && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => setResolveModalOpen(true)}
              >
                {t('quality.issue.resolve')}
              </Button>
            )}
            {canIgnore && (
              <Button
                icon={<CloseCircleOutlined />}
                onClick={() => setIgnoreModalOpen(true)}
              >
                {t('quality.issue.ignore')}
              </Button>
            )}
            {canResume && (
              <Button
                type="primary"
                danger
                icon={<PlayCircleOutlined />}
                onClick={handleResume}
                loading={resumeMutation.isPending}
              >
                {t('quality.issue.resumeWorkflow')}
              </Button>
            )}
          </Space>
        </Card>
      )}

      {/* Findings 列表 */}
      <Card title={`Findings（${findings.length}）`} style={{ marginBottom: 16 }}>
        {findings.length === 0 ? (
          <Text type="secondary">{t('quality.issue.noFindingsData')}</Text>
        ) : (
          <List
            dataSource={findings}
            renderItem={(finding, index) => (
              <List.Item>
                <div style={{ width: '100%' }}>
                  <Space style={{ marginBottom: 4 }}>
                    <Text strong>#{index + 1}</Text>
                    <Tag color={findingSeverityColor[finding.severity] || undefined}>{finding.severity}</Tag>
                    <Tag>{finding.type}</Tag>
                    {finding.ruleCode && <Tag color="geekblue">{finding.ruleCode}</Tag>}
                    <Text type="secondary">{t('quality.finding.confidence', { value: (finding.confidence * 100).toFixed(0) })}</Text>
                  </Space>
                  <div style={{ marginBottom: 4 }}>
                    <Text strong>{finding.title}</Text>
                  </div>
                  <Paragraph type="secondary" style={{ marginBottom: 4 }}>{finding.description}</Paragraph>
                  {finding.location && (
                    <div><Text type="secondary">{t('quality.finding.location', { location: '' })}</Text><Text code>{finding.location}</Text></div>
                  )}
                  {finding.suggestion && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary">{t('quality.finding.suggestion', { suggestion: '' })}</Text><Text>{finding.suggestion}</Text>
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 处理记录 */}
      {(issue.resolutionAction || issue.resolvedAt) && (
        <Card title={t('quality.issue.handleRecord')} size="small">
          <Timeline
            items={[
              {
                color: 'blue',
                children: (
                  <div>
                    <Text>{t('quality.issue.issueCreated')}</Text>
                    <br />
                    <Text type="secondary">{issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '-'}</Text>
                  </div>
                ),
              },
              ...(issue.resolutionAction ? [{
                color: 'green' as const,
                children: (
                  <div>
                    <Text>{t('quality.issue.resolutionAction')}: <Tag>{issue.resolutionAction}</Tag></Text>
                    {issue.resolutionRemark && <Paragraph type="secondary">{issue.resolutionRemark}</Paragraph>}
                    <Text type="secondary">{issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleString() : ''}</Text>
                  </div>
                ),
              }] : []),
            ]}
          />
        </Card>
      )}

      {/* 解决问题 Modal */}
      <Modal
        title={t('quality.issue.resolveModalTitle')}
        open={resolveModalOpen}
        onOk={handleResolve}
        onCancel={() => setResolveModalOpen(false)}
        confirmLoading={resolveMutation.isPending}
        okText={t('quality.issue.resolveOk')}
      >
        <div style={{ marginBottom: 12 }}>
          <Text>{t('quality.issue.handleMethod')}:</Text>
          <Select
            value={resolveAction}
            onChange={setResolveAction}
            style={{ width: '100%', marginTop: 4 }}
            options={[
              { label: t('quality.issue.actionFix'), value: 'fix' },
              { label: t('quality.issue.actionAcceptRisk'), value: 'accept_risk' },
              { label: t('quality.issue.actionRetry'), value: 'retry' },
              { label: t('quality.issue.actionOverride'), value: 'override' },
            ]}
          />
        </div>
        <div>
          <Text>{t('quality.issue.remark')}:</Text>
          <TextArea
            value={resolveRemark}
            onChange={(e) => setResolveRemark(e.target.value)}
            placeholder={t('quality.issue.resolveRemarkPlaceholder')}
            rows={3}
            style={{ marginTop: 4 }}
          />
        </div>
      </Modal>

      {/* 忽略问题 Modal */}
      <Modal
        title={t('quality.issue.ignoreModalTitle')}
        open={ignoreModalOpen}
        onOk={handleIgnore}
        onCancel={() => setIgnoreModalOpen(false)}
        confirmLoading={ignoreMutation.isPending}
        okText={t('quality.issue.ignoreOk')}
      >
        <Text>{t('quality.issue.ignoreReason')}:</Text>
        <TextArea
          value={ignoreRemark}
          onChange={(e) => setIgnoreRemark(e.target.value)}
          placeholder={t('quality.issue.ignoreReasonPlaceholder')}
          rows={3}
          style={{ marginTop: 4 }}
        />
      </Modal>
    </div>
  );
};

export default QualityIssueDetail;

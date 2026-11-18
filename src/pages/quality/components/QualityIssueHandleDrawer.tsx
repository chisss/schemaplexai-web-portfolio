import { useEffect, useMemo, useState } from 'react';
import { Alert, App as AntApp, Button, Descriptions, Drawer, Input, Select, Space, Typography } from 'antd';
import {
  useAcknowledgeQualityIssue,
  useIgnoreQualityIssue,
  useQualityIssueDetail,
  useResolveQualityIssue,
  useResumeQualityIssueWorkflow,
} from '@/api/quality';
import type { QualityIssue } from '@/types/quality';
import FindingsList from './FindingsList';
import SeverityBadge from './SeverityBadge';
import GateDecisionTag from './GateDecisionTag';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const { Paragraph, Text, Title } = Typography;

interface QualityIssueHandleDrawerProps {
  open: boolean;
  issue: QualityIssue | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const RESOLUTION_KEY_MAP: Record<string, string> = {
  fix: 'quality.issue.actionFix',
  accept_risk: 'quality.issue.actionAcceptRisk',
  retry: 'quality.issue.actionRetry',
  override: 'quality.issue.actionOverride',
};

const getResolutionOptions = (t: TFunction) => Object.entries(RESOLUTION_KEY_MAP).map(([value, key]) => ({ label: t(key), value }));

export default function QualityIssueHandleDrawer({
  open,
  issue,
  onClose,
  onSuccess,
}: QualityIssueHandleDrawerProps) {
  const { message } = AntApp.useApp();
  const { t } = useTranslation();
  const [remark, setRemark] = useState('');
  const [action, setAction] = useState('fix');

  const detailQuery = useQualityIssueDetail(open && issue?.id ? issue.id : '');
  const acknowledgeMutation = useAcknowledgeQualityIssue();
  const resolveMutation = useResolveQualityIssue();
  const ignoreMutation = useIgnoreQualityIssue();
  const resumeMutation = useResumeQualityIssueWorkflow();

  useEffect(() => {
    if (!open) {
      setRemark('');
      setAction('fix');
    }
  }, [open]);

  const detail = useMemo(() => detailQuery.data || issue || null, [detailQuery.data, issue]);
  const pending = !!detail && ['open', 'acknowledged', 'resolving'].includes(detail.status);
  const resumable = !!detail && detail.gateDecision === 'pause' && !!detail.workflowInstanceId && ['open', 'acknowledged'].includes(detail.status);

  const notifySuccess = (content: string) => {
    message.success(content);
    onSuccess?.();
  };

  const handleAcknowledge = async () => {
    if (!detail) return;
    await acknowledgeMutation.mutateAsync({ id: detail.id });
    notifySuccess(t('quality.issue.msgAcknowledged'));
  };

  const handleResolve = async () => {
    if (!detail) return;
    await resolveMutation.mutateAsync({
      id: detail.id,
      data: { action, remark: remark.trim() || undefined },
    });
    notifySuccess(t('quality.issue.msgResolved'));
  };

  const handleIgnore = async () => {
    if (!detail) return;
    await ignoreMutation.mutateAsync({
      id: detail.id,
      data: { remark: remark.trim() || undefined },
    });
    notifySuccess(t('quality.issue.msgIgnored'));
  };

  const handleResume = async () => {
    if (!detail) return;
    await resumeMutation.mutateAsync({ id: detail.id });
    notifySuccess(t('quality.issue.msgWorkflowResumed'));
  };

  return (
    <Drawer
      size={720}
      open={open}
      onClose={onClose}
      destroyOnHidden
      title={detail?.title || t('quality.issue.handleTitle')}
      extra={pending ? (
        <Space>
          {detail?.status === 'open' ? (
            <Button loading={acknowledgeMutation.isPending} onClick={() => void handleAcknowledge()}>
              {t('quality.issue.acknowledge')}
            </Button>
          ) : null}
          <Button loading={ignoreMutation.isPending} onClick={() => void handleIgnore()}>
            {t('quality.issue.ignore')}
          </Button>
          <Button type="primary" loading={resolveMutation.isPending} onClick={() => void handleResolve()}>
            {t('quality.issue.resolve')}
          </Button>
        </Space>
      ) : null}
    >
      {!detail ? null : (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          {detail.summary ? <Alert type="warning" showIcon title={detail.summary} /> : null}

          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label={t('quality.issue.issueType')}>{detail.issueType === 'deviation' ? t('quality.issue.typeDeviation') : detail.issueType === 'intent_defect' ? t('quality.issue.typeIntentDefect') : detail.issueType || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('quality.issue.severity')}>
              <SeverityBadge severity={detail.severity} />
            </Descriptions.Item>
            <Descriptions.Item label={t('quality.issue.gateDecision')}>
              <GateDecisionTag decision={detail.gateDecision} />
            </Descriptions.Item>
            <Descriptions.Item label={t('quality.issue.status')}>{detail.status === 'open' ? t('quality.issue.statusOpen') : detail.status === 'acknowledged' ? t('quality.issue.statusAcknowledged') : detail.status === 'resolving' ? t('quality.issue.statusResolving') : detail.status === 'resolved' ? t('quality.issue.statusResolved') : detail.status === 'ignored' ? t('quality.issue.statusIgnored') : detail.status || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('quality.issue.linkedSpec')}>{detail.specId || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('quality.issue.workflowNode')}>{detail.workflowNodeId || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('quality.issue.findingCount')}>{detail.findingCount ?? 0}</Descriptions.Item>
            <Descriptions.Item label={t('quality.issue.score')}>{detail.score ?? '-'}</Descriptions.Item>
          </Descriptions>

          <div>
            <Title level={5}>{t('quality.issue.findingsTitle')}</Title>
            <FindingsList findings={detail.findingsJson} />
          </div>

          <div>
            <Title level={5}>{t('quality.issue.handleNoteTitle')}</Title>
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              <Select
                value={action}
                onChange={setAction}
                options={getResolutionOptions(t)}
                disabled={!pending}
                style={{ width: 220 }}
              />
              <Input.TextArea
                rows={4}
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder={t('quality.issue.remarkPlaceholder')}
                disabled={!pending}
              />
              {resumable ? (
                <Button danger loading={resumeMutation.isPending} onClick={() => void handleResume()}>
                  {t('quality.issue.resumeWorkflow')}
                </Button>
              ) : null}
            </Space>
          </div>

          <div>
            <Title level={5}>{t('quality.issue.timelineTitle')}</Title>
            <Paragraph type="secondary" style={{ marginBottom: 4 }}>
              {t('quality.issue.createdAt')}: {detail.createdAt || '-'}
            </Paragraph>
            <Paragraph type="secondary" style={{ marginBottom: 4 }}>
              {t('quality.issue.resolvedAt')}: {detail.resolvedAt || '-'}
            </Paragraph>
            <Text type="secondary">{t('quality.issue.resolutionAction')}: {detail.resolutionAction || '-'}</Text>
          </div>
        </Space>
      )}
    </Drawer>
  );
}

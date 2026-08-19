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

const { Paragraph, Text, Title } = Typography;

interface QualityIssueHandleDrawerProps {
  open: boolean;
  issue: QualityIssue | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const RESOLUTION_OPTIONS = [
  { label: '修复后继续', value: 'fix' },
  { label: '接受风险', value: 'accept_risk' },
  { label: '重试流程', value: 'retry' },
  { label: '人工覆盖', value: 'override' },
];

export default function QualityIssueHandleDrawer({
  open,
  issue,
  onClose,
  onSuccess,
}: QualityIssueHandleDrawerProps) {
  const { message } = AntApp.useApp();
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
    notifySuccess('质量问题已确认');
  };

  const handleResolve = async () => {
    if (!detail) return;
    await resolveMutation.mutateAsync({
      id: detail.id,
      data: { action, remark: remark.trim() || undefined },
    });
    notifySuccess('质量问题已处理');
  };

  const handleIgnore = async () => {
    if (!detail) return;
    await ignoreMutation.mutateAsync({
      id: detail.id,
      data: { remark: remark.trim() || undefined },
    });
    notifySuccess('质量问题已忽略');
  };

  const handleResume = async () => {
    if (!detail) return;
    await resumeMutation.mutateAsync({ id: detail.id });
    notifySuccess('阻断工作流已恢复');
  };

  return (
    <Drawer
      size={720}
      open={open}
      onClose={onClose}
      destroyOnHidden
      title={detail?.title || '质量问题处理'}
      extra={pending ? (
        <Space>
          {detail?.status === 'open' ? (
            <Button loading={acknowledgeMutation.isPending} onClick={() => void handleAcknowledge()}>
              确认
            </Button>
          ) : null}
          <Button loading={ignoreMutation.isPending} onClick={() => void handleIgnore()}>
            忽略
          </Button>
          <Button type="primary" loading={resolveMutation.isPending} onClick={() => void handleResolve()}>
            处理完成
          </Button>
        </Space>
      ) : null}
    >
      {!detail ? null : (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          {detail.summary ? <Alert type="warning" showIcon title={detail.summary} /> : null}

          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="问题类型">{detail.issueType || '-'}</Descriptions.Item>
            <Descriptions.Item label="严重度">
              <SeverityBadge severity={detail.severity} />
            </Descriptions.Item>
            <Descriptions.Item label="闸门决策">
              <GateDecisionTag decision={detail.gateDecision} />
            </Descriptions.Item>
            <Descriptions.Item label="当前状态">{detail.status || '-'}</Descriptions.Item>
            <Descriptions.Item label="关联 Spec">{detail.specId || '-'}</Descriptions.Item>
            <Descriptions.Item label="工作流节点">{detail.workflowNodeId || '-'}</Descriptions.Item>
            <Descriptions.Item label="发现数量">{detail.findingCount ?? 0}</Descriptions.Item>
            <Descriptions.Item label="得分">{detail.score ?? '-'}</Descriptions.Item>
          </Descriptions>

          <div>
            <Title level={5}>发现详情</Title>
            <FindingsList findings={detail.findingsJson} />
          </div>

          <div>
            <Title level={5}>处理说明</Title>
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              <Select
                value={action}
                onChange={setAction}
                options={RESOLUTION_OPTIONS}
                disabled={!pending}
                style={{ width: 220 }}
              />
              <Input.TextArea
                rows={4}
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="记录处理意见、补偿动作或风险说明"
                disabled={!pending}
              />
              {resumable ? (
                <Button danger loading={resumeMutation.isPending} onClick={() => void handleResume()}>
                  恢复被阻断的工作流
                </Button>
              ) : null}
            </Space>
          </div>

          <div>
            <Title level={5}>时间线</Title>
            <Paragraph type="secondary" style={{ marginBottom: 4 }}>
              创建时间: {detail.createdAt || '-'}
            </Paragraph>
            <Paragraph type="secondary" style={{ marginBottom: 4 }}>
              处理时间: {detail.resolvedAt || '-'}
            </Paragraph>
            <Text type="secondary">处理动作: {detail.resolutionAction || '-'}</Text>
          </div>
        </Space>
      )}
    </Drawer>
  );
}

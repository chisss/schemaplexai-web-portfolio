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

const statusLabelMap: Record<string, string> = {
  open: '待处理',
  acknowledged: '已确认',
  resolving: '处理中',
  resolved: '已解决',
  ignored: '已忽略',
};

const gateDecisionColorMap: Record<string, string> = {
  pass: 'green',
  warn: 'gold',
  pause: 'orange',
  fail: 'red',
  retry: 'blue',
};

const findingSeverityColor: Record<string, string> = {
  critical: '#cf1322',
  warning: '#fa8c16',
  info: '#1677ff',
};

const QualityIssueDetail: React.FC = () => {
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
    return <div style={{ textAlign: 'center', padding: 80 }}>质量问题不存在</div>;
  }

  const canAcknowledge = issue.status === 'open';
  const canResolve = issue.status === 'open' || issue.status === 'acknowledged';
  const canIgnore = issue.status === 'open' || issue.status === 'acknowledged';
  const canResume = issue.gateDecision === 'pause' && !!issue.workflowInstanceId
    && (issue.status === 'open' || issue.status === 'acknowledged');

  const handleAcknowledge = () => {
    acknowledgeMutation.mutate({ id: issue.id }, {
      onSuccess: () => message.success('已确认'),
    });
  };

  const handleResolve = () => {
    resolveMutation.mutate(
      { id: issue.id, data: { action: resolveAction, remark: resolveRemark } },
      {
        onSuccess: () => {
          message.success('已解决');
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
          message.success('已忽略');
          setIgnoreModalOpen(false);
          setIgnoreRemark('');
        },
      },
    );
  };

  const handleResume = () => {
    Modal.confirm({
      title: '恢复工作流',
      content: '确认覆盖闸门决策并恢复工作流执行？此操作不可撤销。',
      okText: '确认恢复',
      cancelText: '取消',
      onOk: () => {
        resumeMutation.mutate({ id: issue.id }, {
          onSuccess: () => message.success('工作流已恢复'),
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
        返回列表
      </Button>

      {/* 基本信息 */}
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} bordered size="small">
          <Descriptions.Item label="标题" span={3}>{issue.title}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Badge
              status={issue.status === 'open' ? 'error' : issue.status === 'resolved' ? 'success' : 'processing'}
              text={<Tag color={statusColorMap[issue.status]}>{statusLabelMap[issue.status] || issue.status}</Tag>}
            />
          </Descriptions.Item>
          <Descriptions.Item label="严重度">
            <Tag color={severityColorMap[issue.severity] || 'default'}>{issue.severity}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="闸门决策">
            {issue.gateDecision
              ? <Tag color={gateDecisionColorMap[issue.gateDecision] || 'default'}>{issue.gateDecision}</Tag>
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="类型">
            {issue.issueType === 'deviation' ? '偏离检测' : '意图缺陷'}
          </Descriptions.Item>
          <Descriptions.Item label="来源">{issue.sourceType || '-'}</Descriptions.Item>
          <Descriptions.Item label="执行策略">{issue.executionStrategy || '-'}</Descriptions.Item>
          <Descriptions.Item label="得分">{issue.score ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="问题数">{issue.findingCount}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '-'}
          </Descriptions.Item>
        </Descriptions>

        {issue.summary && (
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">摘要：</Text>
            <Paragraph style={{ marginTop: 4 }}>{issue.summary}</Paragraph>
          </div>
        )}
      </Card>

      {/* 关联上下文 */}
      {(issue.specId || issue.workflowInstanceId || issue.crossReviewId) && (
        <Card title="关联上下文" size="small" style={{ marginBottom: 16 }}>
          <Descriptions column={2} size="small">
            {issue.specId && <Descriptions.Item label="Spec ID">{issue.specId}</Descriptions.Item>}
            {issue.taskId && <Descriptions.Item label="Task ID">{issue.taskId}</Descriptions.Item>}
            {issue.workflowInstanceId && (
              <Descriptions.Item label="工作流实例">{issue.workflowInstanceId}</Descriptions.Item>
            )}
            {issue.workflowNodeId && (
              <Descriptions.Item label="工作流节点">{issue.workflowNodeId}</Descriptions.Item>
            )}
            {issue.crossReviewId && (
              <Descriptions.Item label="交叉审查">{issue.crossReviewId}</Descriptions.Item>
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
          message="工作流已被质量闸门暂停"
          description="当前质量问题触发了 pause 闸门决策，关联的工作流已暂停执行。处理完问题后可点击「恢复工作流」继续执行。"
          style={{ marginBottom: 16 }}
          action={
            <Button type="primary" danger size="small" onClick={handleResume} loading={resumeMutation.isPending}>
              恢复工作流
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
                确认问题
              </Button>
            )}
            {canResolve && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => setResolveModalOpen(true)}
              >
                解决问题
              </Button>
            )}
            {canIgnore && (
              <Button
                icon={<CloseCircleOutlined />}
                onClick={() => setIgnoreModalOpen(true)}
              >
                忽略
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
                恢复工作流
              </Button>
            )}
          </Space>
        </Card>
      )}

      {/* Findings 列表 */}
      <Card title={`Findings（${findings.length}）`} style={{ marginBottom: 16 }}>
        {findings.length === 0 ? (
          <Text type="secondary">无详细 findings 数据</Text>
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
                    <Text type="secondary">置信度: {(finding.confidence * 100).toFixed(0)}%</Text>
                  </Space>
                  <div style={{ marginBottom: 4 }}>
                    <Text strong>{finding.title}</Text>
                  </div>
                  <Paragraph type="secondary" style={{ marginBottom: 4 }}>{finding.description}</Paragraph>
                  {finding.location && (
                    <div><Text type="secondary">位置: </Text><Text code>{finding.location}</Text></div>
                  )}
                  {finding.suggestion && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary">建议: </Text><Text>{finding.suggestion}</Text>
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
        <Card title="处理记录" size="small">
          <Timeline
            items={[
              {
                color: 'blue',
                children: (
                  <div>
                    <Text>问题创建</Text>
                    <br />
                    <Text type="secondary">{issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '-'}</Text>
                  </div>
                ),
              },
              ...(issue.resolutionAction ? [{
                color: 'green' as const,
                children: (
                  <div>
                    <Text>处理动作: <Tag>{issue.resolutionAction}</Tag></Text>
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
        title="解决质量问题"
        open={resolveModalOpen}
        onOk={handleResolve}
        onCancel={() => setResolveModalOpen(false)}
        confirmLoading={resolveMutation.isPending}
        okText="确认解决"
      >
        <div style={{ marginBottom: 12 }}>
          <Text>处理方式:</Text>
          <Select
            value={resolveAction}
            onChange={setResolveAction}
            style={{ width: '100%', marginTop: 4 }}
            options={[
              { label: '修复问题', value: 'fix' },
              { label: '接受风险', value: 'accept_risk' },
              { label: '重试执行', value: 'retry' },
              { label: '覆盖决策', value: 'override' },
            ]}
          />
        </div>
        <div>
          <Text>备注:</Text>
          <TextArea
            value={resolveRemark}
            onChange={(e) => setResolveRemark(e.target.value)}
            placeholder="请输入处理备注"
            rows={3}
            style={{ marginTop: 4 }}
          />
        </div>
      </Modal>

      {/* 忽略问题 Modal */}
      <Modal
        title="忽略质量问题"
        open={ignoreModalOpen}
        onOk={handleIgnore}
        onCancel={() => setIgnoreModalOpen(false)}
        confirmLoading={ignoreMutation.isPending}
        okText="确认忽略"
      >
        <Text>忽略原因:</Text>
        <TextArea
          value={ignoreRemark}
          onChange={(e) => setIgnoreRemark(e.target.value)}
          placeholder="请输入忽略原因"
          rows={3}
          style={{ marginTop: 4 }}
        />
      </Modal>
    </div>
  );
};

export default QualityIssueDetail;

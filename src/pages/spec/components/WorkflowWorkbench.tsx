import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  App as AntApp,
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  List,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  SendOutlined,
  StopOutlined,
} from '@ant-design/icons';
import PageContainer from '@/components/PageContainer/PageContainer';
import MarkdownPreview from '@/components/MarkdownPreview/MarkdownPreview';
import StatusTag from '@/components/StatusTag/StatusTag';
import { useSpecWorkbench, useStartSpecWorkflow } from '@/api/spec';
import {
  useApproveReviewSession,
  useRejectReviewSession,
  useRequestModifyReviewSession,
} from '@/api/review';
import type { SpecStatus, SpecWorkbenchNode } from '@/types/spec';
import type { WorkflowInstanceStatus } from '@/types/workflow';

const { Title, Text, Paragraph } = Typography;

interface WorkflowWorkbenchProps {
  specId: string;
}

const NODE_STATUS_META: Record<string, { color: string; label: string }> = {
  pending: { color: 'default', label: '待执行' },
  running: { color: 'processing', label: '执行中' },
  paused: { color: 'orange', label: '等待处理' },
  completed: { color: 'success', label: '已完成' },
  failed: { color: 'error', label: '执行失败' },
  waiting_review: { color: 'orange', label: '待审批' },
  request_modify: { color: 'gold', label: '已退回' },
  rejected: { color: 'red', label: '已驳回' },
};

const DOCUMENT_LABEL_MAP: Record<string, string> = {
  requirements: '需求分析',
  design: '方案设计',
  tasks: '任务拆分',
};

const REVIEWER_STATUS_LABEL_MAP: Record<string, string> = {
  pending: '待处理',
  submitted: '已提交',
  approved: '已通过',
  rejected: '已驳回',
  request_modify: '已退回',
};

const REVIEWER_STATUS_COLOR: Record<string, string> = {
  pending: 'default',
  submitted: 'processing',
  approved: 'success',
  rejected: 'error',
  request_modify: 'warning',
};

const DOCUMENT_PLACEHOLDER = '请完整填写原始需求、目标、边界和已知约束，保存后系统会立即启动绑定工作流。';
const EMPTY_WORKBENCH_NODES: SpecWorkbenchNode[] = [];
const SPEC_STATUS_VALUES: readonly SpecStatus[] = [
  'draft',
  'requirements_review',
  'requirements_approved',
  'design_review',
  'design_approved',
  'tasks_review',
  'ready',
  'in_progress',
  'failed',
  'completed',
  'acceptance',
  'archived',
];
const WORKFLOW_INSTANCE_STATUS_VALUES: readonly WorkflowInstanceStatus[] = [
  'pending',
  'running',
  'paused',
  'completed',
  'failed',
  'cancelled',
];
const SPEC_STATUS_SET = new Set<string>(SPEC_STATUS_VALUES);
const WORKFLOW_INSTANCE_STATUS_SET = new Set<string>(WORKFLOW_INSTANCE_STATUS_VALUES);

const normalizeSpecStatus = (status?: string): SpecStatus =>
  SPEC_STATUS_SET.has(status || '') ? (status as SpecStatus) : 'draft';

const normalizeWorkflowInstanceStatus = (status?: string): WorkflowInstanceStatus =>
  WORKFLOW_INSTANCE_STATUS_SET.has(status || '') ? (status as WorkflowInstanceStatus) : 'pending';

const resolveDocumentLabel = (node?: SpecWorkbenchNode) => {
  const docType = node?.document?.docType
    || node?.config?.artifactDocType
    || node?.config?.documentKey
    || node?.config?.documentType;
  if (!docType) {
    return '待审核内容';
  }
  return DOCUMENT_LABEL_MAP[docType] || docType;
};

const shouldStartWorkflow = (status?: string, startedAt?: string, rawRequirement?: string) =>
  !rawRequirement?.trim() || (status === 'pending' && !startedAt);

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const getNodeStatusMeta = (node?: SpecWorkbenchNode) => {
  if (!node) {
    return NODE_STATUS_META.pending;
  }
  if (node.nodeType === 'human_review') {
    const decisionStatus = node.reviewSession?.decisionStatus;
    if (decisionStatus === 'pending' && (node.current || node.status === 'pending' || node.status === 'running')) {
      return NODE_STATUS_META.waiting_review;
    }
    if (decisionStatus === 'request_modify') {
      return NODE_STATUS_META.request_modify;
    }
    if (decisionStatus === 'rejected') {
      return NODE_STATUS_META.rejected;
    }
    if (decisionStatus === 'approved') {
      return NODE_STATUS_META.completed;
    }
  }
  return NODE_STATUS_META[node.status] || NODE_STATUS_META.pending;
};

const resolveNodeMarkdownContent = (node?: SpecWorkbenchNode) => {
  if (node?.document?.content) {
    return node.document.content;
  }
  const output = node?.outputData;
  if (!output) {
    return '';
  }
  const tracePayload = output.tracePayload || {};
  const handoffPayload = output.handoffPayload || {};
  const content = tracePayload.result || tracePayload.content || handoffPayload.summary || output.result || output.agentResult || output.content;
  return content ? String(content) : '';
};

const isLifecycleSummaryNode = (node: SpecWorkbenchNode) =>
  node.nodeType !== 'human_review' && node.nodeId !== 'notify_complete';

const resolveCompletedWorkflowNode = (nodes: SpecWorkbenchNode[]) => {
  const meaningfulCompletedNodes = [...nodes]
    .reverse()
    .filter((item) => item.status === 'completed' && isLifecycleSummaryNode(item));

  const latestNodeWithContent = meaningfulCompletedNodes.find((item) => !!resolveNodeMarkdownContent(item));
  if (latestNodeWithContent) {
    return latestNodeWithContent;
  }
  if (meaningfulCompletedNodes.length) {
    return meaningfulCompletedNodes[0];
  }
  return [...nodes].reverse().find((item) => item.nodeType !== 'human_review')
    || nodes[nodes.length - 1];
};

const CARD_SURFACE_STYLE: CSSProperties = {
  borderRadius: 24,
  border: '1px solid rgba(226,232,240,0.78)',
  background: '#ffffff',
  boxShadow: 'none',
};

const HERO_SURFACE_STYLE: CSSProperties = {
  borderRadius: 24,
  border: '1px solid rgba(219,234,254,0.92)',
  background: 'linear-gradient(180deg, rgba(248,250,252,0.96) 0%, rgba(255,255,255,1) 100%)',
  boxShadow: 'none',
};

const WARM_SURFACE_STYLE: CSSProperties = {
  borderRadius: 24,
  border: '1px solid rgba(253,230,138,0.72)',
  background: 'rgba(255,251,235,0.7)',
  boxShadow: 'none',
};

const DOCUMENT_FRAME_STYLE: CSSProperties = {
  borderRadius: 20,
  border: '1px solid rgba(226,232,240,0.82)',
  background: '#ffffff',
  boxShadow: 'none',
  padding: 24,
};

const FACT_TILE_STYLE: CSSProperties = {
  borderRadius: 18,
  background: 'rgba(248,250,252,0.9)',
  padding: 14,
  minHeight: 84,
};

const INFO_PANEL_STYLE: CSSProperties = {
  borderRadius: 18,
  border: '1px solid rgba(226,232,240,0.78)',
  background: '#ffffff',
  boxShadow: '0 12px 28px -28px rgba(15,23,42,0.18)',
};

const INFO_LIST_STYLE: CSSProperties = {
  background: 'transparent',
  borderRadius: 0,
  padding: 0,
};

const INFO_GRID_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 14,
};

const META_TILE_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  borderRadius: 14,
  border: '1px solid rgba(226,232,240,0.9)',
  background: 'rgba(248,250,252,0.78)',
  padding: '10px 14px',
  minHeight: 0,
  flex: '1 1 180px',
};

const resolveNodeTone = (node?: SpecWorkbenchNode) => {
  if (!node) {
    return {
      accent: '#64748b',
      soft: 'rgba(226,232,240,0.42)',
      border: 'rgba(148,163,184,0.28)',
      shadow: 'rgba(100,116,139,0.16)',
    };
  }

  if (node.nodeType === 'human_review') {
    const decisionStatus = node.reviewSession?.decisionStatus;
    if (decisionStatus === 'request_modify') {
      return {
        accent: '#ca8a04',
        soft: 'rgba(254,240,138,0.34)',
        border: 'rgba(202,138,4,0.32)',
        shadow: 'rgba(202,138,4,0.18)',
      };
    }
    if (decisionStatus === 'rejected') {
      return {
        accent: '#dc2626',
        soft: 'rgba(254,202,202,0.36)',
        border: 'rgba(239,68,68,0.28)',
        shadow: 'rgba(220,38,38,0.18)',
      };
    }
    if (decisionStatus === 'approved') {
      return {
        accent: '#059669',
        soft: 'rgba(167,243,208,0.34)',
        border: 'rgba(5,150,105,0.28)',
        shadow: 'rgba(5,150,105,0.18)',
      };
    }
    return {
      accent: '#d97706',
      soft: 'rgba(253,230,138,0.36)',
      border: 'rgba(217,119,6,0.28)',
      shadow: 'rgba(217,119,6,0.18)',
    };
  }

  if (node.status === 'completed') {
    return {
      accent: '#059669',
      soft: 'rgba(167,243,208,0.34)',
      border: 'rgba(5,150,105,0.28)',
      shadow: 'rgba(5,150,105,0.18)',
    };
  }

  if (node.status === 'failed') {
    return {
      accent: '#dc2626',
      soft: 'rgba(254,202,202,0.36)',
      border: 'rgba(239,68,68,0.28)',
      shadow: 'rgba(220,38,38,0.18)',
    };
  }

  if (node.status === 'running') {
    return {
      accent: '#2563eb',
      soft: 'rgba(191,219,254,0.38)',
      border: 'rgba(37,99,235,0.28)',
      shadow: 'rgba(37,99,235,0.18)',
    };
  }

  if (node.status === 'paused') {
    return {
      accent: '#d97706',
      soft: 'rgba(253,230,138,0.34)',
      border: 'rgba(217,119,6,0.28)',
      shadow: 'rgba(217,119,6,0.18)',
    };
  }

  return {
    accent: '#64748b',
    soft: 'rgba(226,232,240,0.42)',
    border: 'rgba(148,163,184,0.28)',
    shadow: 'rgba(100,116,139,0.16)',
  };
};

const resolveNodeRoleLabel = (node?: SpecWorkbenchNode) => {
  if (node?.nodeType === 'human_review') {
    return '人工审核';
  }
  if (node?.nodeType === 'agent') {
    return 'Agent 节点';
  }
  return '执行节点';
};

const resolveNodeRoleHint = (node?: SpecWorkbenchNode) => {
  if (node?.nodeType === 'human_review') {
    return '等待审核人确认当前产物，审批通过后继续向下驱动。';
  }
  if (node?.nodeType === 'agent') {
    return '系统自动分析并生成文档产物，无需人工直接编辑。';
  }
  return '负责衔接上下游步骤，维持当前生命周期推进。';
};

export default function WorkflowWorkbench({ specId }: WorkflowWorkbenchProps) {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const nodeIdFromUrl = searchParams.get('nodeId') || undefined;
  const reviewMode = searchParams.get('mode') === 'review';
  const searchParamsSnapshot = searchParams.toString();

  const { data: workbench, isLoading } = useSpecWorkbench(specId);
  const startWorkflow = useStartSpecWorkflow();
  const approveReview = useApproveReviewSession();
  const rejectReview = useRejectReviewSession();
  const requestModify = useRequestModifyReviewSession();

  const [manualSelectedNodeId, setManualSelectedNodeId] = useState<string>();
  const [manualSelectionAnchorNodeId, setManualSelectionAnchorNodeId] = useState<string>();
  const [rawRequirementDraft, setRawRequirementDraft] = useState<string>();
  const [reviewComment, setReviewComment] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const workflowInstance = workbench?.workflowInstance;
  const allNodes = workbench?.nodes ?? EMPTY_WORKBENCH_NODES;
  const workflowCompleted = workflowInstance?.status === 'completed';
  const rawRequirement = rawRequirementDraft ?? workbench?.spec?.description ?? '';
  const timelineNodes = useMemo(
    () => allNodes.filter((item) => item.nodeType !== 'start' && item.nodeType !== 'end'),
    [allNodes],
  );
  const pendingReviewNode = useMemo(
    () => timelineNodes.find(
      (item) => item.nodeType === 'human_review' && item.reviewSession?.decisionStatus === 'pending',
    ),
    [timelineNodes],
  );
  const requestedNodeId = useMemo(
    () => (
      nodeIdFromUrl && timelineNodes.some((item) => item.nodeId === nodeIdFromUrl)
        ? nodeIdFromUrl
        : undefined
    ),
    [nodeIdFromUrl, timelineNodes],
  );
  const workflowCurrentNode = useMemo(() => {
    const current = timelineNodes.find((item) => item.current);
    if (current) {
      return current;
    }
    if (workflowCompleted) {
      return resolveCompletedWorkflowNode(timelineNodes);
    }
    return timelineNodes[0];
  }, [timelineNodes, workflowCompleted]);
  const manualSelectionActive = useMemo(
    () => Boolean(
      manualSelectedNodeId
      && manualSelectionAnchorNodeId
      && manualSelectionAnchorNodeId === workflowCurrentNode?.nodeId
      && !workflowCompleted
      && timelineNodes.some((item) => item.nodeId === manualSelectedNodeId),
    ),
    [manualSelectedNodeId, manualSelectionAnchorNodeId, workflowCurrentNode?.nodeId, workflowCompleted, timelineNodes],
  );
  const selectedNodeId = useMemo(() => {
    if (manualSelectionActive) {
      return manualSelectedNodeId;
    }
    if (requestedNodeId) {
      return requestedNodeId;
    }
    if (reviewMode) {
      return pendingReviewNode?.nodeId || workflowCurrentNode?.nodeId;
    }
    return workflowCurrentNode?.nodeId;
  }, [
    manualSelectionActive,
    manualSelectedNodeId,
    pendingReviewNode?.nodeId,
    requestedNodeId,
    reviewMode,
    workflowCurrentNode?.nodeId,
  ]);
  const currentNode = useMemo(
    () => timelineNodes.find((item) => item.nodeId === selectedNodeId)
      || workflowCurrentNode
      || timelineNodes[0],
    [timelineNodes, selectedNodeId, workflowCurrentNode],
  );
  const reviewSession = currentNode?.reviewSession;
  const reviewerNameMap = useMemo(
    () => new Map((reviewSession?.reviewers || []).map((item) => [item.userId || '', item.reviewerName || item.userId || ''])),
    [reviewSession?.reviewers],
  );
  const workflowReadyToStart = shouldStartWorkflow(
    workflowInstance?.status,
    workflowInstance?.startedAt,
    workbench?.spec?.description,
  );
  const canReview = !!reviewSession && reviewSession.decisionStatus === 'pending' && reviewMode;
  const isAgentGenerating = currentNode?.nodeType === 'agent'
    && ['running', 'pending'].includes(currentNode?.status || '');
  const workflowProgressIndex = useMemo(() => {
    if (!timelineNodes.length) {
      return -1;
    }
    if (workflowCompleted) {
      return timelineNodes.length - 1;
    }
    return timelineNodes.findIndex((item) => item.nodeId === workflowCurrentNode?.nodeId);
  }, [timelineNodes, workflowCompleted, workflowCurrentNode?.nodeId]);
  const workbenchStatusType = workbench?.spec?.lifecycleMode === 'workflow' && workbench?.spec?.workflowStatusSnapshot
    ? 'workflow'
    : 'spec';
  const workbenchStatus = workbenchStatusType === 'workflow'
    ? normalizeWorkflowInstanceStatus(workbench?.spec?.workflowStatusSnapshot)
    : normalizeSpecStatus(workbench?.spec?.status);

  const renderNodeStatusPill = (node?: SpecWorkbenchNode) => {
    const statusMeta = getNodeStatusMeta(node);
    const tone = resolveNodeTone(node);

    return (
      <span
        style={{
          borderRadius: 999,
          border: `1px solid ${tone.border}`,
          background: tone.soft,
          color: tone.accent,
          padding: '2px 10px',
          fontSize: 11,
          fontWeight: 600,
          lineHeight: '18px',
          whiteSpace: 'nowrap',
        }}
      >
        {statusMeta.label}
      </span>
    );
  };

  const renderMetaList = (entries: Array<{ label: string; value: ReactNode }>) => (
    <div style={INFO_LIST_STYLE}>
      <div style={INFO_GRID_STYLE}>
        {entries.map((item) => (
          <div
            key={item.label}
            style={META_TILE_STYLE}
          >
            <div className="text-[12px] leading-5 text-slate-500">
              {item.label}
            </div>
            <div className="text-[14px] font-medium leading-6 text-slate-900">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  useEffect(() => {
    if (!timelineNodes.length) {
      return;
    }

    const nextParams = new URLSearchParams(searchParamsSnapshot);
    let shouldSyncQuery = false;
    if (!requestedNodeId && selectedNodeId && selectedNodeId !== nodeIdFromUrl) {
      nextParams.set('nodeId', selectedNodeId);
      shouldSyncQuery = true;
    } else if (!requestedNodeId && !selectedNodeId && nodeIdFromUrl) {
      nextParams.delete('nodeId');
      shouldSyncQuery = true;
    }
    if (shouldSyncQuery) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    timelineNodes,
    nodeIdFromUrl,
    requestedNodeId,
    selectedNodeId,
    searchParamsSnapshot,
    setSearchParams,
  ]);

  const handleStartWorkflow = async () => {
    if (!rawRequirement.trim()) {
      message.warning('请先填写原始需求');
      return;
    }
    try {
      await startWorkflow.mutateAsync({
        id: specId,
        data: { description: rawRequirement.trim() },
      });
      message.success('原始需求已保存，工作流已启动');
    } catch {
      message.error('启动工作流失败');
    }
  };

  const handleSelectNode = (nodeId: string) => {
    setManualSelectionAnchorNodeId(workflowCurrentNode?.nodeId);
    setManualSelectedNodeId(nodeId);
  };

  const handleApprove = async () => {
    if (!reviewSession) {
      return;
    }
    try {
      await approveReview.mutateAsync({
        sessionId: reviewSession.id,
        data: { comment: reviewComment.trim() || undefined },
      });
      setReviewComment('');
      message.success('审批已通过，工作流继续推进');
    } catch {
      message.error('审批失败');
    }
  };

  const handleRequestModify = async () => {
    if (!reviewSession) {
      return;
    }
    if (!reviewComment.trim()) {
      message.warning('请填写审批意见，系统会带着意见重新执行上一个 Agent 节点');
      return;
    }
    try {
      await requestModify.mutateAsync({
        sessionId: reviewSession.id,
        data: {
          comment: reviewComment.trim(),
          modifyInstruction: reviewComment.trim(),
        },
      });
      setReviewComment('');
      message.success('已退回重跑，上游 Agent 将按审批意见重新生成内容');
    } catch {
      message.error('退回失败');
    }
  };

  const handleReject = async () => {
    if (!reviewSession) {
      return;
    }
    try {
      await rejectReview.mutateAsync({
        sessionId: reviewSession.id,
        data: { comment: reviewComment.trim() || '审批驳回' },
      });
      setReviewComment('');
      setRejectModalOpen(false);
      message.success('已驳回当前审批');
    } catch {
      message.error('驳回失败');
    }
  };

  const renderRawRequirementEditor = () => (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card variant="borderless" style={HERO_SURFACE_STYLE}>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Title level={4} style={{ marginBottom: 8 }}>填写原始需求</Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              这里只填写业务原始诉求。保存后，系统会自动启动绑定工作流，由 Agent 先产出需求分析结果，再进入人工审核。
            </Paragraph>
          </div>
          <Input.TextArea
            rows={20}
            value={rawRequirement}
            onChange={(event) => setRawRequirementDraft(event.target.value)}
            placeholder={DOCUMENT_PLACEHOLDER}
            style={{
              borderRadius: 18,
              padding: 18,
              borderColor: 'rgba(203,213,225,0.82)',
              background: '#ffffff',
              boxShadow: 'none',
            }}
          />
          <div className="flex justify-end">
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={startWorkflow.isPending}
              onClick={handleStartWorkflow}
            >
              保存并启动工作流
            </Button>
          </div>
        </Space>
      </Card>

      <Card variant="borderless" style={INFO_PANEL_STYLE}>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Title level={5} style={{ marginBottom: 6 }}>Spec 信息</Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              保存原始需求后，生命周期会自动切换为绑定工作流的首个执行节点。
            </Paragraph>
          </div>
          {renderMetaList([
            {
              label: '当前状态',
              value: (
                <StatusTag
                  status={normalizeSpecStatus(workbench?.spec?.status)}
                  type="spec"
                />
              ),
            },
            {
              label: '当前节点',
              value: workflowReadyToStart ? '待填写原始需求' : (workbench?.spec?.currentNodeLabel || '待启动'),
            },
            {
              label: '创建人',
              value: workbench?.spec?.ownerName || workbench?.spec?.owner || '-',
            },
            {
              label: '创建时间',
              value: formatDateTime(workbench?.spec?.createdAt),
            },
            {
              label: 'Jira 号',
              value: workbench?.spec?.jiraTicket || '-',
            },
            {
              label: '目标分支',
              value: workbench?.spec?.targetBranch || '-',
            },
          ])}
        </Space>
      </Card>
    </div>
  );

  const renderTimeline = () => (
      <Card variant="borderless" style={CARD_SURFACE_STYLE}>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Title level={5} style={{ marginBottom: 0 }}>当前流程</Title>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium tracking-[0.12em] text-slate-500">
              {timelineNodes.length} 个节点
            </span>
          </div>
          <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 13 }}>
              生命周期以绑定工作流为准。点击节点可切换查看对应产物或审批状态。
            </Paragraph>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max items-stretch gap-3">
            {timelineNodes.map((item, index) => {
              const tone = resolveNodeTone(item);
              const active = item.nodeId === currentNode?.nodeId;
              const reached = workflowProgressIndex >= 0 && index <= workflowProgressIndex;
              const connectorFilled = workflowProgressIndex > index;
              return (
                <div key={item.nodeId} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectNode(item.nodeId)}
                    className="relative min-h-[132px] w-[212px] rounded-[18px] px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5"
                    style={{
                      border: active ? `1px solid ${tone.border}` : '1px solid rgba(226,232,240,0.84)',
                      background: active
                        ? `linear-gradient(180deg, rgba(255,255,255,1) 0%, ${tone.soft} 135%)`
                        : 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,0.9) 100%)',
                      boxShadow: active ? `0 16px 28px -24px ${tone.shadow}` : '0 10px 24px -26px rgba(15,23,42,0.2)',
                    }}
                  >
                    <span
                      className="absolute left-4 top-0 h-1 w-10 rounded-b-full"
                      style={{ background: tone.accent, opacity: reached || active ? 1 : 0.45 }}
                    />
                    <div className="flex h-full flex-col">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-flex h-7 min-w-7 items-center justify-center rounded-full text-[11px] font-semibold"
                            style={{
                              background: reached || active ? tone.soft : 'rgba(241,245,249,0.96)',
                              color: reached || active ? tone.accent : '#64748b',
                            }}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                        {renderNodeStatusPill(item)}
                      </div>
                      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                        {resolveNodeRoleLabel(item)}
                      </div>
                      <div className="mb-2 pr-2 text-[15px] font-semibold leading-6 text-slate-900">
                        {item.nodeLabel}
                      </div>
                      <div className="mt-auto pr-2 text-[12px] leading-5 text-slate-500 line-clamp-2">
                        {resolveNodeRoleHint(item)}
                      </div>
                    </div>
                  </button>
                  {index < timelineNodes.length - 1 ? (
                    <div className="flex h-full min-h-[132px] items-center">
                      <div
                        style={{
                          width: 24,
                          height: 2,
                          borderRadius: 999,
                          background: connectorFilled ? 'rgba(59,130,246,0.38)' : 'rgba(226,232,240,0.96)',
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </Space>
    </Card>
  );

  const renderReviewPanel = () => (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      {currentNode ? (
        <div
          className="rounded-[24px] border px-5 py-5"
          style={{
            borderColor: 'rgba(226,232,240,0.82)',
            background: '#ffffff',
            boxShadow: 'none',
          }}
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div
                className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: resolveNodeTone(currentNode).accent }}
              >
                当前待审核
              </div>
              <Title level={3} style={{ marginBottom: 8 }}>
                {workbench?.spec?.name || '-'} / {currentNode.nodeLabel}
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                审核人只需关注原始需求、当前产物与评审摘要，不需要处理额外的流程噪音。
              </Paragraph>
            </div>
            {renderNodeStatusPill(currentNode)}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div style={FACT_TILE_STYLE}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">创建人</div>
              <div className="text-sm font-medium text-slate-700">{workbench?.spec?.ownerName || workbench?.spec?.owner || '-'}</div>
            </div>
            <div style={FACT_TILE_STYLE}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">审核内容</div>
              <div className="text-sm font-medium text-slate-700">{resolveDocumentLabel(currentNode)}</div>
            </div>
            <div style={FACT_TILE_STYLE}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">文档版本</div>
              <div className="text-sm font-medium text-slate-700">
                {currentNode?.document?.version ? `V${currentNode.document.version}` : '待生成'}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <Card variant="borderless" style={CARD_SURFACE_STYLE}>
        <Space orientation="vertical" size="small" style={{ width: '100%' }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Title level={4} style={{ marginBottom: 4 }}>
                待审核内容：{resolveDocumentLabel(currentNode)}
              </Title>
              <Text type="secondary">
                当前节点为 {currentNode?.nodeLabel}，审核人只需要关注原始需求、当前产物和评审摘要。
              </Text>
            </div>
            {renderNodeStatusPill(currentNode)}
          </div>

          {isAgentGenerating ? (
            <Empty description="当前节点正在生成新内容，生成完成后会自动展示最新结果。" />
          ) : currentNode?.document?.content ? (
            <div style={DOCUMENT_FRAME_STYLE}>
              <MarkdownPreview content={currentNode.document.content} />
            </div>
          ) : (
            <Empty description="当前节点暂无可审核文档" />
          )}
        </Space>
      </Card>

      {reviewSession?.summary ? (
        <Card variant="borderless" style={WARM_SURFACE_STYLE}>
          <Descriptions column={3} size="small" title="评审摘要">
            <Descriptions.Item label="总意见数">{reviewSession.summary.totalComments}</Descriptions.Item>
            <Descriptions.Item label="严重问题">{reviewSession.summary.criticalCount}</Descriptions.Item>
            <Descriptions.Item label="已提交人数">
              {reviewSession.summary.submittedCount}/{reviewSession.summary.totalReviewers}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ) : null}

      {reviewSession?.reviewers?.length ? (
        <Card variant="borderless" style={CARD_SURFACE_STYLE} title="审批人">
          <List
            dataSource={reviewSession.reviewers}
            renderItem={(item) => (
              <List.Item>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <div className="flex items-center justify-between gap-3">
                    <Text strong>{item.reviewerName || item.userId || '-'}</Text>
                    <Tag color={REVIEWER_STATUS_COLOR[item.status || 'pending'] || 'default'}>
                      {REVIEWER_STATUS_LABEL_MAP[item.status || 'pending'] || item.status || '待处理'}
                    </Tag>
                  </div>
                  <Text type="secondary">{item.role || '未配置角色'} · {formatDateTime(item.submittedAt)}</Text>
                </Space>
              </List.Item>
            )}
          />
          {reviewSession.approverName ? (
            <Alert
              style={{ marginTop: 16 }}
              type="success"
              showIcon
              message={`最终审批人：${reviewSession.approverName}`}
              description={`审批时间：${formatDateTime(reviewSession.approverAt)}`}
            />
          ) : null}
        </Card>
      ) : null}

      {reviewSession?.comments?.length ? (
        <Card variant="borderless" style={CARD_SURFACE_STYLE} title="历史评审意见">
          <List
            dataSource={reviewSession.comments}
            renderItem={(item) => (
              <List.Item>
                <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                  <div className="flex items-center justify-between gap-3">
                    <Text strong>{reviewerNameMap.get(item.reviewerId) || item.reviewerId}</Text>
                    <Tag>{item.level}</Tag>
                  </div>
                  <Paragraph style={{ marginBottom: 0 }}>{item.content}</Paragraph>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      ) : null}

      {canReview ? (
        <Card variant="borderless" style={WARM_SURFACE_STYLE}>
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Title level={5} style={{ marginBottom: 4 }}>审批操作</Title>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                如果需要 Agent 重新生成内容，请直接填写审批意见并点击“退回重跑”。
              </Paragraph>
            </div>
            <Input.TextArea
              rows={5}
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              placeholder="填写审批意见。退回重跑时，这些意见会直接传给上一个 Agent 节点。"
              style={{
                borderRadius: 20,
                padding: 16,
                borderColor: 'rgba(251,191,36,0.42)',
                background: 'rgba(255,255,255,0.9)',
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                icon={<PauseCircleOutlined />}
                onClick={handleRequestModify}
                loading={requestModify.isPending}
              >
                退回重跑
              </Button>
              <Button
                danger
                icon={<StopOutlined />}
                onClick={() => setRejectModalOpen(true)}
              >
                驳回
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleApprove}
                loading={approveReview.isPending}
              >
                审批通过
              </Button>
            </div>
          </Space>
        </Card>
      ) : (
        <Alert
          type={reviewMode ? 'info' : 'warning'}
          showIcon
          title={reviewMode ? '当前审批已处理完成' : '当前节点正在等待审核'}
          description={reviewMode ? '该审核会话已完成，页面仅保留查看能力。' : '从站内信或待办进入审核模式后，系统会在这里展示审批按钮。'}
        />
      )}
    </Space>
  );

  const renderAgentPanel = () => (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      {currentNode ? (
        <div
          className="rounded-[24px] border px-5 py-5"
          style={{
            borderColor: 'rgba(226,232,240,0.82)',
            background: '#ffffff',
            boxShadow: 'none',
          }}
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div
                className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: resolveNodeTone(currentNode).accent }}
              >
                {resolveNodeRoleLabel(currentNode)}
              </div>
              <Title level={3} style={{ marginBottom: 8 }}>{currentNode.nodeLabel}</Title>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Agent 会自动生成当前阶段产物；页面会跟随工作流推进实时切换到最新节点。
              </Paragraph>
            </div>
            {renderNodeStatusPill(currentNode)}
          </div>
        </div>
      ) : null}
      <Card variant="borderless" style={CARD_SURFACE_STYLE}>
        <Space orientation="vertical" size="small" style={{ width: '100%' }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Title level={4} style={{ marginBottom: 4 }}>{currentNode?.nodeLabel}</Title>
              <Text type="secondary">{resolveNodeRoleHint(currentNode)}</Text>
            </div>
            {renderNodeStatusPill(currentNode)}
          </div>

          {currentNode?.errorMessage ? (
            <Alert type="error" showIcon title="节点执行异常" description={currentNode.errorMessage} />
          ) : null}

          {currentNode?.status === 'running' || currentNode?.status === 'pending' ? (
            <Alert
              type="info"
              showIcon
              title="系统正在执行当前 Agent 节点"
              description="页面会自动刷新，Agent 完成后会展示生成结果或直接进入下一个人工审核节点。"
            />
          ) : null}

          {resolveNodeMarkdownContent(currentNode) ? (
            <div style={DOCUMENT_FRAME_STYLE}>
              <MarkdownPreview content={resolveNodeMarkdownContent(currentNode)} />
            </div>
          ) : (
            <Empty description="当前节点尚未产出可展示内容" />
          )}
        </Space>
      </Card>
    </Space>
  );

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-96 items-center justify-center">
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!workbench?.spec) {
    return (
      <PageContainer>
        <Empty description="未找到 Spec 工作台数据" />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={workbench.spec.name}
      extra={(
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
      )}
    >
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        {workflowReadyToStart ? renderRawRequirementEditor() : (
          <>
            <div className="grid gap-4">
              <Card variant="borderless" style={INFO_PANEL_STYLE}>
                <div className="mb-3">
                  <Title level={5} style={{ marginBottom: 0 }}>关键信息</Title>
                </div>
                {renderMetaList([
                  {
                    label: '当前状态',
                    value: (
                      <StatusTag
                        status={workbenchStatus}
                        type={workbenchStatusType}
                      />
                    ),
                  },
                  {
                    label: '当前节点',
                    value: workbench.spec.currentNodeLabel || '-',
                  },
                  {
                    label: '创建人',
                    value: workbench.spec.ownerName || workbench.spec.owner || '-',
                  },
                  {
                    label: '创建时间',
                    value: formatDateTime(workbench.spec.createdAt),
                  },
                  {
                    label: 'Jira 号',
                    value: workbench.spec.jiraTicket || '-',
                  },
                  {
                    label: '目标分支',
                    value: workbench.spec.targetBranch || '-',
                  },
                ])}
              </Card>

              <Card variant="borderless" style={HERO_SURFACE_STYLE}>
                <div className="mb-5">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">原始需求</div>
                  <Title level={4} style={{ marginBottom: 8 }}>业务原始诉求</Title>
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    这是整个 Spec 的输入原文。后续需求分析、方案设计、任务拆分都以这里的内容为起点。
                  </Paragraph>
                </div>
                <div style={DOCUMENT_FRAME_STYLE}>
                  <MarkdownPreview content={workbench.spec.description} />
                </div>
              </Card>
            </div>
            {renderTimeline()}
            {currentNode?.nodeType === 'human_review' ? renderReviewPanel() : renderAgentPanel()}
          </>
        )}
      </Space>

      <Modal
        title="驳回当前审批"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => setRejectModalOpen(false)}
        confirmLoading={rejectReview.isPending}
      >
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Alert
            type="warning"
            showIcon
            title="驳回后会回退到上游节点"
            description="如仅需让 Agent 重新生成内容，优先使用“退回重跑”。"
          />
          <Input.TextArea
            rows={4}
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            placeholder="填写驳回原因"
          />
        </Space>
      </Modal>
    </PageContainer>
  );
}

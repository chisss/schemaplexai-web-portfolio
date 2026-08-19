import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Grid,
  Input,
  List,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Tag,
  Table,
  Typography,
  message,
} from 'antd';
import {
  EyeOutlined,
  DownloadOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LightweightECharts from '@/components/ECharts/LightweightECharts';
import PageContainer from '@/components/PageContainer/PageContainer';
import {
  exportApprovalCenterAudit,
  useApprovalCenterItems,
  useBatchAssignApprovalCenterItems,
  useBatchReviewApprovalCenterItems,
} from '@/api/approvalCenter';
import {
  useApproveReviewSession,
  useRejectReviewSession,
  useRequestModifyReviewSession,
  useReviewSession,
} from '@/api/review';
import {
  useQualityIssueDetail,
} from '@/api/quality';
import QualityIssueHandleDrawer from '@/pages/quality/components/QualityIssueHandleDrawer';
import {
  assignSecurityIncident,
  escalateSecurityIncident,
  fetchSecurityIncidentActions,
  fetchSecurityIncidentDetail,
  ignoreSecurityIncident,
  resolveSecurityIncident,
  resumeSecurityIncidentResource,
} from '@/api/securityCompliance';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  ApprovalCenterBatchActionResult,
  ApprovalCenterItem,
  ApprovalCenterReviewDecision,
  ApprovalCenterType,
  ApprovalCenterView,
} from '@/types/approvalCenter';
import type { SecurityIncident, SecurityIncidentAction, SecurityIncidentActionDTO } from '@/types/securityCompliance';
import type { ReviewSessionReviewer } from '@/types/workflow';

const { Paragraph, Text } = Typography;
const { Search, TextArea } = Input;

const VIEW_OPTIONS: Array<{ labelKey: string; value: ApprovalCenterView }> = [
  { labelKey: 'approvalCenter.view.pending', value: 'pending' },
  { labelKey: 'approvalCenter.view.all', value: 'all' },
  { labelKey: 'approvalCenter.view.processed', value: 'processed' },
];

const TYPE_OPTIONS: Array<{ labelKey: string; value: ApprovalCenterType }> = [
  { labelKey: 'approvalCenter.type.workflowReview', value: 'workflow_review' },
  { labelKey: 'approvalCenter.type.qualityIssue', value: 'quality_issue' },
  { labelKey: 'approvalCenter.type.securityIncident', value: 'security_incident' },
];

const TYPE_COLOR_MAP: Record<ApprovalCenterType, string> = {
  workflow_review: '#1677ff',
  quality_issue: '#fa8c16',
  security_incident: '#13c2c2',
};

const TYPE_LABEL_KEY_MAP: Record<ApprovalCenterType, string> = {
  workflow_review: 'approvalCenter.type.workflowReview',
  quality_issue: 'approvalCenter.type.qualityIssue',
  security_incident: 'approvalCenter.type.securityIncident',
};

const STATUS_LABEL_KEY_MAP: Record<string, string> = {
  pending: 'approvalCenter.status.pending',
  submitted: 'approvalCenter.status.submitted',
  approved: 'approvalCenter.status.approved',
  rejected: 'approvalCenter.status.rejected',
  request_modify: 'approvalCenter.status.requestModify',
  open: 'approvalCenter.status.open',
  acknowledged: 'approvalCenter.status.acknowledged',
  resolving: 'approvalCenter.status.resolving',
  resolved: 'approvalCenter.status.resolved',
  ignored: 'approvalCenter.status.ignored',
  new: 'approvalCenter.status.new',
  assigned: 'approvalCenter.status.assigned',
  investigating: 'approvalCenter.status.investigating',
  escalated: 'approvalCenter.status.escalated',
};

const REVIEW_DECISION_OPTIONS: Array<{ labelKey: string; value: ApprovalCenterReviewDecision }> = [
  { labelKey: 'approvalCenter.reviewDecision.approve', value: 'approve' },
  { labelKey: 'approvalCenter.reviewDecision.reject', value: 'reject' },
  { labelKey: 'approvalCenter.reviewDecision.requestModify', value: 'request_modify' },
];

const SEVERITY_LABEL_KEY_MAP: Record<string, string> = {
  critical: 'approvalCenter.severity.critical',
  high: 'approvalCenter.severity.high',
  medium: 'approvalCenter.severity.medium',
  low: 'approvalCenter.severity.low',
  warning: 'approvalCenter.severity.warning',
  info: 'approvalCenter.severity.info',
};

const SECURITY_DECISION_LABEL_KEY_MAP: Record<string, string> = {
  allow: 'approvalCenter.decision.allow',
  warn: 'approvalCenter.decision.warn',
  block: 'approvalCenter.decision.block',
  pause: 'approvalCenter.decision.pause',
};

const SECURITY_ACTION_LABEL_KEY_MAP: Record<'assign' | 'resolve' | 'ignore' | 'escalate', string> = {
  assign: 'approvalCenter.security.assign',
  resolve: 'approvalCenter.security.resolve',
  ignore: 'approvalCenter.security.ignore',
  escalate: 'approvalCenter.security.escalate',
};

const SECURITY_ACTION_TITLE_KEY_MAP: Record<'assign' | 'resolve' | 'ignore' | 'escalate', string> = {
  assign: 'approvalCenter.security.assignTitle',
  resolve: 'approvalCenter.security.resolveTitle',
  ignore: 'approvalCenter.security.ignoreTitle',
  escalate: 'approvalCenter.security.escalateTitle',
};

const SOURCE_TYPE_LABEL_KEY_MAP: Record<string, string> = {
  agent_execution: 'approvalCenter.sourceType.agentExecution',
  workflow_instance: 'approvalCenter.sourceType.workflowInstance',
};

const buildDonutChartOption = ({
  data,
  colors,
  centerTitle,
  centerValue,
  emptyText,
  isDark,
}: {
  data: Array<{ name: string; value: number }>;
  colors: string[];
  centerTitle: string;
  centerValue: string;
  emptyText: string;
  isDark: boolean;
}) => {
  const hasData = data.some((item) => item.value > 0);
  const textColor = isDark ? '#e5e7eb' : '#0f172a';
  const secondaryTextColor = isDark ? '#94a3b8' : '#64748b';
  return {
    color: colors,
    tooltip: { trigger: 'item' },
    legend: hasData
      ? {
          type: 'scroll',
          bottom: 0,
          left: 'center',
          icon: 'circle',
          textStyle: {
            color: secondaryTextColor,
          },
        }
      : undefined,
    series: hasData
      ? [
          {
            type: 'pie',
            radius: ['56%', '78%'],
            center: ['50%', '42%'],
            minAngle: 8,
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 10,
              borderColor: isDark ? '#111827' : '#ffffff',
              borderWidth: 2,
            },
            label: {
              show: true,
              formatter: '{b}: {c}',
              color: textColor,
              fontSize: 12,
            },
            emphasis: {
              label: {
                show: true,
                formatter: '{b}: {c}',
                color: textColor,
                fontSize: 12,
              },
            },
            labelLine: {
              show: true,
              length: 10,
              length2: 8,
            },
            data,
          },
        ]
      : [],
    graphic: hasData
      ? [
          {
            type: 'text',
            left: 'center',
            top: '34%',
            style: {
              text: centerTitle,
              fill: secondaryTextColor,
              fontSize: 12,
              fontWeight: 500,
              textAlign: 'center',
            },
          },
          {
            type: 'text',
            left: 'center',
            top: '43%',
            style: {
              text: centerValue,
              fill: textColor,
              fontSize: 22,
              fontWeight: 700,
              textAlign: 'center',
            },
          },
        ]
      : [
          {
            type: 'text',
            left: 'center',
            top: '39%',
            style: {
              text: emptyText,
              fill: secondaryTextColor,
              fontSize: 13,
              textAlign: 'center',
            },
          },
        ],
  };
};

const REVIEWER_STATUS_COLOR: Record<string, string> = {
  pending: 'default',
  submitted: 'processing',
  approved: 'success',
  rejected: 'error',
  request_modify: 'warning',
};

const STATUS_COLOR_MAP: Record<string, string> = {
  pending: 'processing',
  approved: 'success',
  rejected: 'error',
  request_modify: 'warning',
  open: 'error',
  acknowledged: 'warning',
  resolving: 'processing',
  resolved: 'success',
  ignored: 'default',
  new: 'error',
  assigned: 'processing',
  investigating: 'processing',
  escalated: 'error',
};

const PRIORITY_COLOR_MAP: Record<string, string> = {
  CRITICAL: 'red',
  HIGH: 'volcano',
  MEDIUM: 'gold',
  LOW: 'green',
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const buildWorkflowContextPath = (item: ApprovalCenterItem) => {
  if (!item.specId) {
    return '/spec';
  }
  const query = new URLSearchParams();
  if (item.workflowInstanceId) {
    query.set('instanceId', item.workflowInstanceId);
  }
  if (item.workflowNodeId) {
    query.set('nodeId', item.workflowNodeId);
  }
  query.set('mode', 'review');
  return `/spec/${item.specId}/edit?${query.toString()}`;
};

const toSelectionKey = (item: ApprovalCenterItem) => `${item.approvalType}:${item.id}`;

const parseSelectionType = (keys: string[]) => {
  if (!keys.length) {
    return null;
  }
  const type = keys[0]?.split(':')[0] as ApprovalCenterType | undefined;
  return type || null;
};

export default function ApprovalCenter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const screens = Grid.useBreakpoint();
  const themeMode = useAppStore((state) => state.theme);
  const isDark = themeMode === 'dark';
  const { hasPermission } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const canReview = hasPermission('approval:center:review');
  const canAssign = hasPermission('approval:center:assign');
  const canExport = hasPermission('approval:center:export');

  const view = (searchParams.get('view') as ApprovalCenterView) || 'pending';
  const filterType = (searchParams.get('filterType') as ApprovalCenterType | null) || undefined;
  const keyword = searchParams.get('keyword') || undefined;
  const selectedType = searchParams.get('type') as ApprovalCenterType | null;
  const selectedId = searchParams.get('id') || undefined;
  const currentPage = Math.max(1, Number(searchParams.get('page') || '1') || 1);
  const pageSize = Math.max(1, Number(searchParams.get('size') || '10') || 10);

  const getTypeLabel = (type: ApprovalCenterType) => t(TYPE_LABEL_KEY_MAP[type], { defaultValue: type });
  const getStatusLabel = (status?: string, fallback?: string) => {
    if (!status) {
      return fallback || '-';
    }
    const labelKey = STATUS_LABEL_KEY_MAP[status];
    return labelKey ? t(labelKey) : (fallback || status);
  };
  const getSeverityLabel = (severity?: string) => {
    if (!severity) {
      return '-';
    }
    const labelKey = SEVERITY_LABEL_KEY_MAP[severity];
    return labelKey ? t(labelKey) : severity;
  };
  const getDecisionLabel = (decision?: string) => {
    if (!decision) {
      return '-';
    }
    const labelKey = SECURITY_DECISION_LABEL_KEY_MAP[decision];
    return labelKey ? t(labelKey) : decision;
  };
  const getSourceTypeLabel = (sourceType?: string) => {
    if (!sourceType) {
      return '-';
    }
    const labelKey = SOURCE_TYPE_LABEL_KEY_MAP[sourceType];
    return labelKey ? t(labelKey) : sourceType;
  };
  const getSecurityActionLabel = (actionType?: string) => {
    if (!actionType) {
      return '-';
    }
    const labelKey = SECURITY_ACTION_LABEL_KEY_MAP[actionType as keyof typeof SECURITY_ACTION_LABEL_KEY_MAP];
    return labelKey ? t(labelKey) : actionType;
  };
  const resolveStatusTag = (item: ApprovalCenterItem) => (
    <Tag color={STATUS_COLOR_MAP[item.status] || 'default'}>
      {getStatusLabel(item.status, item.statusLabel || item.status)}
    </Tag>
  );
  const viewOptions = VIEW_OPTIONS.map((option) => ({
    label: t(option.labelKey),
    value: option.value,
  }));
  const typeOptions = TYPE_OPTIONS.map((option) => ({
    label: t(option.labelKey),
    value: option.value,
  }));
  const reviewDecisionOptions = REVIEW_DECISION_OPTIONS.map((option) => ({
    label: t(option.labelKey),
    value: option.value,
  }));

  const [keywordDraft, setKeywordDraft] = useState(keyword || '');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const [reviewComment, setReviewComment] = useState('');

  const [securityActionOpen, setSecurityActionOpen] = useState(false);
  const [securityActionType, setSecurityActionType] = useState<'assign' | 'resolve' | 'ignore' | 'escalate'>('resolve');
  const [securityComment, setSecurityComment] = useState('');
  const [securityAssigneeId, setSecurityAssigneeId] = useState('');
  const [securityAssigneeName, setSecurityAssigneeName] = useState('');

  const [batchReviewOpen, setBatchReviewOpen] = useState(false);
  const [batchReviewDecision, setBatchReviewDecision] = useState<ApprovalCenterReviewDecision>('approve');
  const [batchReviewComment, setBatchReviewComment] = useState('');

  const [batchAssignOpen, setBatchAssignOpen] = useState(false);
  const [batchAssignAssigneeId, setBatchAssignAssigneeId] = useState('');
  const [batchAssignAssigneeName, setBatchAssignAssigneeName] = useState('');
  const [batchAssignComment, setBatchAssignComment] = useState('');

  useEffect(() => {
    setKeywordDraft(keyword || '');
  }, [keyword]);

  const updateQuery = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    let changed = false;
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) {
        if (next.has(key)) {
          next.delete(key);
          changed = true;
        }
      } else {
        if (next.get(key) !== value) {
          next.set(key, value);
          changed = true;
        }
      }
    });
    if (changed) {
      setSearchParams(next, { replace: true });
    }
  };

  const approvalListQuery = useApprovalCenterItems({
    view,
    type: filterType,
    keyword,
    page: currentPage,
    size: pageSize,
  });
  const overviewAllQuery = useApprovalCenterItems({ view: 'all', page: 1, size: 1 });
  const overviewPendingQuery = useApprovalCenterItems({ view: 'pending', page: 1, size: 1 });
  const overviewProcessedQuery = useApprovalCenterItems({ view: 'processed', page: 1, size: 1 });
  const overviewWorkflowQuery = useApprovalCenterItems({ view: 'all', type: 'workflow_review', page: 1, size: 1 });
  const overviewQualityQuery = useApprovalCenterItems({ view: 'all', type: 'quality_issue', page: 1, size: 1 });
  const overviewSecurityQuery = useApprovalCenterItems({ view: 'all', type: 'security_incident', page: 1, size: 1 });

  const items = approvalListQuery.data?.records ?? [];
  const overviewLoading = overviewAllQuery.isLoading
    || overviewPendingQuery.isLoading
    || overviewProcessedQuery.isLoading
    || overviewWorkflowQuery.isLoading
    || overviewQualityQuery.isLoading
    || overviewSecurityQuery.isLoading;

  const overviewStats = useMemo(() => {
    const total = overviewAllQuery.data?.total ?? 0;
    const pendingCount = overviewPendingQuery.data?.total ?? 0;
    const processedCount = overviewProcessedQuery.data?.total ?? 0;
    const workflowCount = overviewWorkflowQuery.data?.total ?? 0;
    const qualityCount = overviewQualityQuery.data?.total ?? 0;
    const securityCount = overviewSecurityQuery.data?.total ?? 0;
    return {
      total,
      pendingCount,
      processedCount,
      workflowCount,
      qualityCount,
      securityCount,
      blockingCount: qualityCount + securityCount,
      pendingRatio: total > 0 ? Number(((pendingCount / total) * 100).toFixed(1)) : 0,
    };
  }, [
    overviewAllQuery.data?.total,
    overviewPendingQuery.data?.total,
    overviewProcessedQuery.data?.total,
    overviewWorkflowQuery.data?.total,
    overviewQualityQuery.data?.total,
    overviewSecurityQuery.data?.total,
  ]);

  const typeDistributionOption = useMemo(() => buildDonutChartOption({
    data: TYPE_OPTIONS.map((option) => ({
      name: t(option.labelKey),
      value: option.value === 'workflow_review'
        ? overviewStats.workflowCount
        : option.value === 'quality_issue'
          ? overviewStats.qualityCount
          : overviewStats.securityCount,
    })),
    colors: [TYPE_COLOR_MAP.workflow_review, TYPE_COLOR_MAP.quality_issue, TYPE_COLOR_MAP.security_incident],
    centerTitle: t('approvalCenter.summary.typeCenterTitle'),
    centerValue: String(overviewStats.total),
    emptyText: t('approvalCenter.summary.noApprovalData'),
    isDark,
  }), [
    isDark,
    overviewStats.total,
    overviewStats.workflowCount,
    overviewStats.qualityCount,
    overviewStats.securityCount,
    t,
  ]);

  const flowDistributionOption = useMemo(() => buildDonutChartOption({
    data: [
      { name: t('approvalCenter.view.pending'), value: overviewStats.pendingCount },
      { name: t('approvalCenter.view.processed'), value: overviewStats.processedCount },
    ],
    colors: ['#faad14', '#52c41a'],
    centerTitle: t('approvalCenter.summary.totalCenterTitle'),
    centerValue: String(overviewStats.total),
    emptyText: t('approvalCenter.summary.noFlowData'),
    isDark,
  }), [
    isDark,
    overviewStats.total,
    overviewStats.pendingCount,
    overviewStats.processedCount,
    t,
  ]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId && item.approvalType === selectedType) || null,
    [items, selectedId, selectedType],
  );
  const detailModalOpen = !!selectedId && !!selectedType;
  const qualityDrawerOpen = detailModalOpen && selectedType === 'quality_issue';
  const detailDialogOpen = detailModalOpen && selectedType !== 'quality_issue';
  const detailModalWidth = screens.xl
    ? '80%'
    : screens.lg
      ? '85%'
      : 'calc(100vw - 16px)';

  useEffect(() => {
    if (!detailModalOpen || approvalListQuery.isLoading || approvalListQuery.isFetching) {
      return;
    }
    if (!items.length || !selectedItem) {
      updateQuery({ id: undefined, type: undefined });
    }
  }, [approvalListQuery.isFetching, approvalListQuery.isLoading, detailModalOpen, items, selectedItem]);

  useEffect(() => {
    const validKeys = new Set(items.map((item) => toSelectionKey(item)));
    setSelectedKeys((current) => {
      const next = current.filter((key) => validKeys.has(key));
      if (next.length === current.length && next.every((key, index) => key === current[index])) {
        return current;
      }
      return next;
    });
  }, [items]);

  const workflowReviewQuery = useReviewSession(selectedType === 'workflow_review' && selectedId ? selectedId : '');
  const qualityIssueQuery = useQualityIssueDetail(selectedType === 'quality_issue' && selectedId ? selectedId : '');
  const securityIncidentQuery = useQuery({
    queryKey: ['approval-center-security-incident', selectedId],
    queryFn: async () => (await fetchSecurityIncidentDetail(selectedId!)).data,
    enabled: selectedType === 'security_incident' && !!selectedId,
  });
  const securityActionQuery = useQuery({
    queryKey: ['approval-center-security-incident-actions', selectedId],
    queryFn: async () => (await fetchSecurityIncidentActions(selectedId!)).data,
    enabled: selectedType === 'security_incident' && !!selectedId,
  });

  const approveReview = useApproveReviewSession();
  const rejectReview = useRejectReviewSession();
  const requestModifyReview = useRequestModifyReviewSession();
  const batchReviewMutation = useBatchReviewApprovalCenterItems();
  const batchAssignMutation = useBatchAssignApprovalCenterItems();

  const securityActionMutation = useMutation({
    mutationFn: async (params: { type: 'assign' | 'resolve' | 'ignore' | 'escalate'; id: string; data: SecurityIncidentActionDTO }) => {
      if (params.type === 'assign') {
        return assignSecurityIncident(params.id, params.data);
      }
      if (params.type === 'resolve') {
        return resolveSecurityIncident(params.id, params.data);
      }
      if (params.type === 'ignore') {
        return ignoreSecurityIncident(params.id, params.data);
      }
      return escalateSecurityIncident(params.id, params.data);
    },
  });
  const securityResumeMutation = useMutation({
    mutationFn: resumeSecurityIncidentResource,
  });

  const selectedBatchItems = useMemo(() => {
    const selectedKeySet = new Set(selectedKeys);
    return items.filter((item) => selectedKeySet.has(toSelectionKey(item)));
  }, [items, selectedKeys]);
  const selectedBatchIds = selectedBatchItems.map((item) => item.id);
  const batchRiskSummary = useMemo(() => {
    const impactedResources = new Set(selectedBatchItems.map((item) => item.blockedResource || item.workflowInstanceId || item.sourceId || item.id));
    const securityPolicyCount = selectedBatchItems.filter((item) => item.approvalType === 'security_incident').length;
    const highPriorityCount = selectedBatchItems.filter((item) => item.priority === 'CRITICAL' || item.priority === 'HIGH').length;
    return {
      impactedResourceCount: impactedResources.size,
      estimatedCostText: selectedBatchItems.some((item) => item.approvalType === 'workflow_review') ? '可能触发后续 Agent/Workflow 执行成本' : '未识别直接成本',
      securityPolicyText: securityPolicyCount > 0 ? `涉及 ${securityPolicyCount} 个安全策略事件` : '未涉及安全策略事件',
      rollbackText: highPriorityCount > 0 ? '高优先级项建议逐条确认，批量通过后需通过审计记录回溯' : '可通过审批审计记录追溯',
    };
  }, [selectedBatchItems]);
  const selectedBatchType = useMemo(() => parseSelectionType(selectedKeys), [selectedKeys]);
  const approvalTableData = useMemo(
    () => items.map((item) => ({ ...item, key: toSelectionKey(item) })),
    [items],
  );

  const refreshCenter = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['approval-center-items'] }),
      queryClient.invalidateQueries({ queryKey: ['review-session'] }),
      queryClient.invalidateQueries({ queryKey: ['quality-issue'] }),
      queryClient.invalidateQueries({ queryKey: ['approval-center-security-incident'] }),
      queryClient.invalidateQueries({ queryKey: ['approval-center-security-incident-actions'] }),
      queryClient.invalidateQueries({ queryKey: ['my-pending-reviews'] }),
      queryClient.invalidateQueries({ queryKey: ['in-app-inbox'] }),
    ]);
  };

  const clearBatchSelection = () => {
    setSelectedKeys([]);
  };

  const openItemDetail = (item: ApprovalCenterItem) => {
    updateQuery({ id: item.id, type: item.approvalType });
  };

  const closeItemDetail = () => {
    updateQuery({ id: undefined, type: undefined });
  };

  const toggleItemSelection = (item: ApprovalCenterItem, checked: boolean) => {
    const key = toSelectionKey(item);
    if (!checked) {
      setSelectedKeys((current) => current.filter((currentKey) => currentKey !== key));
      return;
    }
    const currentType = parseSelectionType(selectedKeys);
    if (currentType && currentType !== item.approvalType) {
      message.info(t('approvalCenter.messages.onlySameTypeSelected'));
      setSelectedKeys([key]);
      return;
    }
    setSelectedKeys((current) => Array.from(new Set([...current, key])));
  };

  const handleSelectAllItems = (checked: boolean, changeRows: ApprovalCenterItem[]) => {
    if (!checked) {
      const removedKeys = new Set(changeRows.map((item) => toSelectionKey(item)));
      setSelectedKeys((current) => current.filter((key) => !removedKeys.has(key)));
      return;
    }
    if (!changeRows.length) {
      return;
    }
    const targetType = selectedBatchType || changeRows[0].approvalType;
    const allowedRows = changeRows.filter((item) => item.approvalType === targetType);
    if (allowedRows.length !== changeRows.length) {
      message.info(t('approvalCenter.messages.onlySameTypeFiltered'));
    }
    setSelectedKeys((current) => {
      const retained = current.filter((key) => key.startsWith(`${targetType}:`));
      return Array.from(new Set([...retained, ...allowedRows.map((item) => toSelectionKey(item))]));
    });
  };

  const showBatchResult = (actionLabel: string, result: ApprovalCenterBatchActionResult) => {
    if (result.failedCount === 0) {
      message.success(t('approvalCenter.messages.batchSuccess', {
        action: actionLabel,
        count: result.successCount,
      }));
      return;
    }
    Modal.warning({
      title: t('approvalCenter.messages.batchPartial', { action: actionLabel }),
      okText: t('approvalCenter.messages.acknowledged'),
      content: (
        <Space orientation="vertical" size="small" style={{ width: '100%' }}>
          <Text>{t('approvalCenter.messages.batchPartialSummary', {
            success: result.successCount,
            failed: result.failedCount,
          })}</Text>
          {result.failures.slice(0, 8).map((failure) => (
            <Text key={failure.id} type="secondary">
              {failure.id}: {failure.reason}
            </Text>
          ))}
        </Space>
      ),
    });
  };

  const submitWorkflowDecision = async (type: 'approve' | 'reject' | 'request_modify') => {
    const session = workflowReviewQuery.data;
    if (!session) {
      return;
    }
    if (type === 'request_modify' && !reviewComment.trim()) {
      message.warning(t('approvalCenter.messages.requestModifyCommentRequired'));
      return;
    }
    try {
      if (type === 'approve') {
        await approveReview.mutateAsync({
          sessionId: session.id,
          data: { comment: reviewComment.trim() || undefined },
        });
        message.success(t('approvalCenter.messages.workflowApproved'));
      } else if (type === 'reject') {
        await rejectReview.mutateAsync({
          sessionId: session.id,
          data: { comment: reviewComment.trim() || t('approvalCenter.messages.workflowRejectDefaultComment') },
        });
        message.success(t('approvalCenter.messages.workflowRejected'));
      } else {
        await requestModifyReview.mutateAsync({
          sessionId: session.id,
          data: {
            comment: reviewComment.trim(),
            modifyInstruction: reviewComment.trim(),
          },
        });
        message.success(t('approvalCenter.messages.workflowReturned'));
      }
      setReviewComment('');
      await refreshCenter();
    } catch {
      message.error(t('approvalCenter.messages.workflowHandleFailed'));
    }
  };

  const openSecurityAction = (type: 'assign' | 'resolve' | 'ignore' | 'escalate') => {
    setSecurityActionType(type);
    setSecurityComment('');
    setSecurityAssigneeId('');
    setSecurityAssigneeName('');
    setSecurityActionOpen(true);
  };

  const submitSecurityAction = async () => {
    const incident = securityIncidentQuery.data;
    if (!incident || !securityComment.trim()) {
      message.warning(t('approvalCenter.messages.securityCommentRequired'));
      return;
    }
    try {
      await securityActionMutation.mutateAsync({
        type: securityActionType,
        id: incident.id,
        data: {
          comment: securityComment.trim(),
          assigneeId: securityAssigneeId.trim() || undefined,
          assigneeName: securityAssigneeName.trim() || undefined,
        },
      });
      setSecurityActionOpen(false);
      message.success(t('approvalCenter.messages.securitySubmitted'));
      await refreshCenter();
    } catch {
      message.error(t('approvalCenter.messages.securityFailed'));
    }
  };

  const handleResumeSecurity = async () => {
    const incident = securityIncidentQuery.data;
    if (!incident) {
      return;
    }
    Modal.confirm({
      title: t('approvalCenter.confirm.resumeBusinessTitle'),
      content: t('approvalCenter.confirm.resumeBusinessContent'),
      okText: t('approvalCenter.confirm.resumeConfirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await securityResumeMutation.mutateAsync(incident.id);
          message.success(t('approvalCenter.messages.businessResumed'));
          await refreshCenter();
        } catch {
          message.error(t('approvalCenter.messages.resumeFailed'));
        }
      },
    });
  };

  const handleExportAudit = async () => {
    try {
      await exportApprovalCenterAudit({
        view,
        type: filterType,
        keyword,
      });
    } catch {
      message.error(t('approvalCenter.messages.exportFailed'));
    }
  };

  const openBatchReview = () => {
    if (selectedBatchType !== 'workflow_review') {
      message.warning(t('approvalCenter.messages.batchReviewOnlyWorkflow'));
      return;
    }
    setBatchReviewDecision('approve');
    setBatchReviewComment('');
    setBatchReviewOpen(true);
  };

  const submitBatchReview = async () => {
    if (!selectedBatchIds.length) {
      message.warning(t('approvalCenter.messages.selectItemsFirst'));
      return;
    }
    if (batchReviewDecision === 'request_modify' && !batchReviewComment.trim()) {
      message.warning(t('approvalCenter.messages.batchRequestModifyCommentRequired'));
      return;
    }
    try {
      const result = await batchReviewMutation.mutateAsync({
        ids: selectedBatchIds,
        decision: batchReviewDecision,
        comment: batchReviewComment.trim() || undefined,
        modifyInstruction: batchReviewDecision === 'request_modify' ? batchReviewComment.trim() : undefined,
      });
      setBatchReviewOpen(false);
      clearBatchSelection();
      showBatchResult(t('approvalCenter.list.batchReview'), result.data);
      await refreshCenter();
    } catch {
      message.error(t('approvalCenter.messages.batchReviewFailed'));
    }
  };

  const openBatchAssign = () => {
    if (selectedBatchType !== 'quality_issue' && selectedBatchType !== 'security_incident') {
      message.warning(t('approvalCenter.messages.batchAssignOnlyBlocking'));
      return;
    }
    setBatchAssignAssigneeId('');
    setBatchAssignAssigneeName('');
    setBatchAssignComment('');
    setBatchAssignOpen(true);
  };

  const submitBatchAssign = async () => {
    if (!selectedBatchType || !selectedBatchIds.length) {
      message.warning(t('approvalCenter.messages.selectAssignItemsFirst'));
      return;
    }
    if (!batchAssignAssigneeId.trim()) {
      message.warning(t('approvalCenter.messages.assigneeIdRequired'));
      return;
    }
    if (selectedBatchType === 'security_incident' && !batchAssignComment.trim()) {
      message.warning(t('approvalCenter.messages.securityBatchAssignCommentRequired'));
      return;
    }
    try {
      const approvalType = selectedBatchType === 'quality_issue' ? 'quality_issue' : 'security_incident';
      const result = await batchAssignMutation.mutateAsync({
        approvalType,
        ids: selectedBatchIds,
        assigneeId: batchAssignAssigneeId.trim(),
        assigneeName: batchAssignAssigneeName.trim() || undefined,
        comment: batchAssignComment.trim() || undefined,
      });
      setBatchAssignOpen(false);
      clearBatchSelection();
      showBatchResult(t('approvalCenter.list.batchAssign'), result.data);
      await refreshCenter();
    } catch {
      message.error(t('approvalCenter.messages.batchAssignFailed'));
    }
  };

  const renderPermissionHint = (title: string) => (
    <Alert
      showIcon
      type="warning"
      title={title}
      description={t('approvalCenter.permission.viewOnly')}
    />
  );

  const renderWorkflowReviewDetail = () => {
    if (workflowReviewQuery.isLoading) {
      return <div className="py-16 text-center"><Spin /></div>;
    }
    const session = workflowReviewQuery.data;
    if (!session) {
      return <Empty description={t('approvalCenter.workflow.missing')} />;
    }
    const reviewerNameMap = new Map(
      (session.reviewers || []).map((item) => [item.userId || '', item.reviewerName || item.userId || '']),
    );
    const canHandleReview = canReview && session.decisionStatus === 'pending';
    return (
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        {!canReview && session.decisionStatus === 'pending' ? renderPermissionHint(t('approvalCenter.permission.reviewDenied')) : null}
        <Card title={t('approvalCenter.workflow.overview')} size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label={t('approvalCenter.workflow.specLabel')}>{session.specName || session.specId || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('approvalCenter.workflow.approvalNode')}>{session.workflowNodeLabel || session.workflowNodeId || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('approvalCenter.workflow.initiator')}>{session.ownerName || session.owner || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('approvalCenter.workflow.currentStatus')}>
              <Tag color={STATUS_COLOR_MAP[session.decisionStatus || 'pending'] || 'default'}>
                {getStatusLabel(session.decisionStatus || 'pending')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('approvalCenter.workflow.deadline')}>{formatDateTime(session.deadline)}</Descriptions.Item>
            <Descriptions.Item label={t('approvalCenter.workflow.finalApprover')}>
              {session.approverName ? `${session.approverName} (${formatDateTime(session.approverAt)})` : '-'}
            </Descriptions.Item>
          </Descriptions>
          <Space style={{ marginTop: 16 }}>
            <Button
              icon={<LinkOutlined />}
              onClick={() => navigate(buildWorkflowContextPath({
                id: session.id,
                approvalType: 'workflow_review',
                specId: session.specId,
                workflowInstanceId: session.workflowInstanceId,
                workflowNodeId: session.workflowNodeId,
                title: session.specName || session.specId || t('approvalCenter.type.workflowReview'),
                status: session.decisionStatus || 'pending',
                pending: session.decisionStatus === 'pending',
              }))}
            >
              {t('approvalCenter.workflow.viewContext')}
            </Button>
          </Space>
        </Card>

        <Card title={t('approvalCenter.workflow.reviewers')} size="small">
          <List
            dataSource={session.reviewers || []}
            locale={{ emptyText: t('approvalCenter.workflow.noReviewerInfo') }}
            renderItem={(item: ReviewSessionReviewer) => (
              <List.Item>
                <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                  <div className="flex items-center justify-between gap-3">
                    <Text strong>{item.reviewerName || item.userId || '-'}</Text>
                    <Tag color={REVIEWER_STATUS_COLOR[item.status || 'pending'] || 'default'}>
                      {getStatusLabel(item.status || 'pending')}
                    </Tag>
                  </div>
                  <Text type="secondary">{item.role || t('approvalCenter.workflow.roleNotConfigured')} · {formatDateTime(item.submittedAt)}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Card>

        {session.summary ? (
          <Card title={t('approvalCenter.workflow.summary')} size="small">
            <Descriptions column={3} size="small">
              <Descriptions.Item label={t('approvalCenter.workflow.totalComments')}>{session.summary.totalComments}</Descriptions.Item>
              <Descriptions.Item label={t('approvalCenter.workflow.criticalIssues')}>{session.summary.criticalCount}</Descriptions.Item>
              <Descriptions.Item label={t('approvalCenter.workflow.submittedCount')}>
                {session.summary.submittedCount}/{session.summary.totalReviewers}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        ) : null}

        {session.comments?.length ? (
          <Card title={t('approvalCenter.workflow.historyComments')} size="small">
            <List
              dataSource={session.comments}
              renderItem={(item) => (
                <List.Item>
                  <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                    <div className="flex items-center justify-between gap-3">
                      <Text strong>{reviewerNameMap.get(item.reviewerId) || item.reviewerId}</Text>
                      <Tag>{item.level}</Tag>
                    </div>
                    <Paragraph style={{ marginBottom: 0 }}>{item.content}</Paragraph>
                    <Text type="secondary">{formatDateTime(item.createdAt)}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        ) : null}

        {canHandleReview ? (
          <Card title={t('approvalCenter.workflow.actions')} size="small">
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              <TextArea
                rows={5}
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder={t('approvalCenter.workflow.commentPlaceholder')}
              />
              <div className="flex justify-end" style={{ gap: 12 }}>
                <Button loading={requestModifyReview.isPending} onClick={() => void submitWorkflowDecision('request_modify')}>
                  {t('approvalCenter.workflow.requestModify')}
                </Button>
                <Button danger loading={rejectReview.isPending} onClick={() => void submitWorkflowDecision('reject')}>
                  {t('approvalCenter.workflow.reject')}
                </Button>
                <Button type="primary" loading={approveReview.isPending} onClick={() => void submitWorkflowDecision('approve')}>
                  {t('approvalCenter.workflow.approve')}
                </Button>
              </div>
            </Space>
          </Card>
        ) : null}
      </Space>
    );
  };

  const renderSecurityDetail = () => {
    if (securityIncidentQuery.isLoading || securityActionQuery.isLoading) {
      return <div className="py-16 text-center"><Spin /></div>;
    }
    const incident = securityIncidentQuery.data as SecurityIncident | undefined;
    const actions = (securityActionQuery.data as SecurityIncidentAction[] | undefined) || [];
    if (!incident) {
      return <Empty description={t('approvalCenter.security.missing')} />;
    }
    const pending = ['new', 'assigned', 'investigating', 'escalated'].includes(incident.status);
    const resumable = (incident.sourceType === 'agent_execution' || incident.sourceType === 'workflow_instance')
      && incident.decision !== 'block'
      && pending;

    return (
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        {!canReview && !canAssign && pending ? renderPermissionHint(t('approvalCenter.permission.securityDenied')) : null}
        <Card title={t('approvalCenter.security.overview')} size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label={t('approvalCenter.security.incidentNo')}>{incident.incidentNo}</Descriptions.Item>
            <Descriptions.Item label={t('common.status')}>
              <Tag color={STATUS_COLOR_MAP[incident.status] || 'default'}>{getStatusLabel(incident.status)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('approvalCenter.security.riskLevel')}>{getSeverityLabel(incident.riskLevel)}</Descriptions.Item>
            <Descriptions.Item label={t('approvalCenter.security.decision')}>{getDecisionLabel(incident.decision)}</Descriptions.Item>
            <Descriptions.Item label={t('approvalCenter.security.source')}>
              {getSourceTypeLabel(incident.sourceType)} / {incident.sourceName || incident.sourceId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('approvalCenter.security.currentOwner')}>{incident.assignedName || incident.assignedTo || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('approvalCenter.security.latestOperator')}>
              {selectedItem?.approverName ? `${selectedItem.approverName} (${formatDateTime(selectedItem.approverAt)})` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('approvalCenter.security.occurredAt')}>{formatDateTime(incident.createdAt)}</Descriptions.Item>
          </Descriptions>
          <Alert
            style={{ marginTop: 16 }}
            type={incident.decision === 'block' ? 'error' : incident.decision === 'pause' ? 'warning' : 'info'}
            showIcon
            title={incident.eventTitle}
            description={incident.eventDetail || t('approvalCenter.security.noSupplement')}
          />
        </Card>

        {pending ? (
          <Card title={t('approvalCenter.security.actions')} size="small">
            <Space wrap>
              {canAssign ? <Button onClick={() => openSecurityAction('assign')}>{t(SECURITY_ACTION_LABEL_KEY_MAP.assign)}</Button> : null}
              {canReview ? <Button onClick={() => openSecurityAction('resolve')}>{t(SECURITY_ACTION_LABEL_KEY_MAP.resolve)}</Button> : null}
              {canReview ? <Button onClick={() => openSecurityAction('ignore')}>{t(SECURITY_ACTION_LABEL_KEY_MAP.ignore)}</Button> : null}
              {canReview ? <Button danger onClick={() => openSecurityAction('escalate')}>{t(SECURITY_ACTION_LABEL_KEY_MAP.escalate)}</Button> : null}
              {canReview && resumable ? (
                <Button type="primary" loading={securityResumeMutation.isPending} onClick={() => void handleResumeSecurity()}>
                  {t('approvalCenter.security.resumeBusiness')}
                </Button>
              ) : null}
            </Space>
            {canAssign ? (
              <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                {t('approvalCenter.security.assignHint')}
              </Text>
            ) : null}
          </Card>
        ) : null}

        <Card title={t('approvalCenter.security.timeline')} size="small">
          {actions.length ? (
            <List
              dataSource={actions}
              renderItem={(item) => (
                <List.Item>
                  <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                    <div className="flex items-center justify-between gap-3">
                      <Text strong>{getSecurityActionLabel(item.actionType)}</Text>
                      <Text type="secondary">{formatDateTime(item.actionAt)}</Text>
                    </div>
                    <Text>{item.comment || '-'}</Text>
                    <Text type="secondary">{item.operatorName || item.operatorId || t('approvalCenter.security.systemOperator')}</Text>
                  </Space>
                </List.Item>
              )}
            />
          ) : (
            <Empty description={t('approvalCenter.security.noTimeline')} />
          )}
        </Card>
      </Space>
    );
  };

  const renderSelectedDetail = () => {
    if (!selectedType || !selectedId) {
      return <Empty description={t('approvalCenter.detail.empty')} />;
    }
    if (selectedType === 'workflow_review') {
      return renderWorkflowReviewDetail();
    }
    return renderSecurityDetail();
  };

  const detailTitle = selectedItem
    ? `${selectedItem.pending ? t('approvalCenter.detail.approveAndHandle') : t('approvalCenter.detail.viewDetail')} · ${selectedItem.title}`
    : t('approvalCenter.detail.title');

  const rowSelection = {
    selectedRowKeys: selectedKeys,
    columnWidth: 52,
    preserveSelectedRowKeys: false,
    onSelect: (record: ApprovalCenterItem, checked: boolean) => toggleItemSelection(record, checked),
    onSelectAll: (checked: boolean, _selectedRows: ApprovalCenterItem[], changeRows: ApprovalCenterItem[]) => handleSelectAllItems(checked, changeRows),
    getCheckboxProps: (record: ApprovalCenterItem) => ({
      disabled: !!selectedBatchType && selectedBatchType !== record.approvalType && !selectedKeys.includes(toSelectionKey(record)),
    }),
  };

  const approvalColumns = [
    {
      title: t('approvalCenter.list.itemTitle'),
      key: 'title',
      width: 460,
      render: (_: unknown, item: ApprovalCenterItem) => (
        <Space orientation="vertical" size={6} style={{ width: '100%' }}>
          <Space wrap size={[8, 8]}>
            <Text strong>{item.title}</Text>
            {item.specName ? <Tag>{item.specName}</Tag> : null}
            {item.workflowNodeLabel ? <Tag color="geekblue">{item.workflowNodeLabel}</Tag> : null}
            {!item.workflowNodeLabel && item.sourceName ? <Tag color="cyan">{item.sourceName}</Tag> : null}
            {item.priority ? <Tag color={PRIORITY_COLOR_MAP[item.priority] || 'default'}>{item.priority}</Tag> : null}
          </Space>
          <Paragraph
            type="secondary"
            ellipsis={{ rows: 2, expandable: false }}
            style={{ marginBottom: 0 }}
          >
            {item.summary || item.workflowNodeLabel || item.sourceName || t('approvalCenter.list.noSummary')}
          </Paragraph>
        </Space>
      ),
    },
    {
      title: '治理信息',
      key: 'governance',
      width: 260,
      render: (_: unknown, item: ApprovalCenterItem) => (
        <Space orientation="vertical" size={2}>
          <Text type="secondary">SLA {formatDateTime(item.slaDueAt || item.deadline)}</Text>
          <Text type="secondary" ellipsis style={{ maxWidth: 220 }}>{item.impactScope || item.blockedResource || '-'}</Text>
          {item.evidenceSummary ? <Text type="secondary" ellipsis style={{ maxWidth: 220 }}>{item.evidenceSummary}</Text> : null}
        </Space>
      ),
    },
    {
      title: t('common.type'),
      dataIndex: 'approvalType',
      key: 'approvalType',
      width: 120,
      render: (value: ApprovalCenterType) => (
        <Tag color={TYPE_COLOR_MAP[value]}>
          {getTypeLabel(value)}
        </Tag>
      ),
    },
    {
      title: t('common.status'),
      key: 'status',
      width: 170,
      render: (_: unknown, item: ApprovalCenterItem) => (
        <Space wrap size={[4, 4]}>
          {resolveStatusTag(item)}
          {item.pending ? <Tag color="gold">{t('approvalCenter.view.pending')}</Tag> : <Tag>{t('approvalCenter.view.processed')}</Tag>}
        </Space>
      ),
    },
    {
      title: t('approvalCenter.list.owners'),
      key: 'owners',
      width: 220,
      render: (_: unknown, item: ApprovalCenterItem) => (
        <Space orientation="vertical" size={2}>
          <Text>{item.applicantName || '-'}</Text>
          <Text type="secondary">{item.approverName || item.assigneeName || '-'}</Text>
        </Space>
      ),
    },
    {
      title: t('common.updateTime'),
      key: 'updatedAt',
      width: 180,
      render: (_: unknown, item: ApprovalCenterItem) => formatDateTime(item.updatedAt || item.createdAt),
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: unknown, item: ApprovalCenterItem) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => openItemDetail(item)}>
          {item.pending ? t('approvalCenter.list.viewAndApprove') : t('approvalCenter.list.viewDetail')}
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title={t('approvalCenter.title')}
      extra={(
        <Space wrap>
          {canExport ? (
            <Button icon={<DownloadOutlined />} onClick={() => void handleExportAudit()}>
              {t('approvalCenter.auditExport')}
            </Button>
          ) : null}
          <Tag color={view === 'pending' ? 'processing' : 'default'}>
            {t('approvalCenter.list.itemCount', { count: approvalListQuery.data?.total || 0 })}
          </Tag>
        </Space>
      )}
    >
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card
              size="small"
              title={t('approvalCenter.summary.flowTitle')}
              extra={<Tag color="gold">{t('approvalCenter.summary.globalView')}</Tag>}
              loading={overviewLoading}
            >
              <LightweightECharts
                option={flowDistributionOption}
                theme={isDark ? 'dark' : undefined}
                style={{ height: 220 }}
              />
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card
              size="small"
              title={t('approvalCenter.summary.typeTitle')}
              extra={<Tag color="blue">{t('approvalCenter.summary.globalView')}</Tag>}
              loading={overviewLoading}
            >
              <LightweightECharts
                option={typeDistributionOption}
                theme={isDark ? 'dark' : undefined}
                style={{ height: 220 }}
              />
            </Card>
          </Col>
        </Row>

        <Card
          title={t('approvalCenter.list.title')}
          variant="borderless"
          className="shadow-sm rounded-xl"
          extra={(
            <Space wrap size="small">
              {selectedBatchType ? <Tag>{getTypeLabel(selectedBatchType)}</Tag> : null}
              {selectedKeys.length ? <Text type="secondary">{t('approvalCenter.list.selectedCount', { count: selectedKeys.length })}</Text> : null}
              {selectedBatchType === 'workflow_review' && canReview && selectedKeys.length ? (
                <Button size="small" type="primary" onClick={openBatchReview}>
                  {t('approvalCenter.list.batchReview')}
                </Button>
              ) : null}
              {(selectedBatchType === 'quality_issue' || selectedBatchType === 'security_incident') && canAssign && selectedKeys.length ? (
                <Button size="small" onClick={openBatchAssign}>
                  {t('approvalCenter.list.batchAssign')}
                </Button>
              ) : null}
              {selectedKeys.length ? (
                <Button size="small" type="link" onClick={clearBatchSelection}>
                  {t('approvalCenter.list.clearSelection')}
                </Button>
              ) : null}
            </Space>
          )}
        >
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
            <Segmented
              options={viewOptions}
              value={view}
              onChange={(value) => {
                clearBatchSelection();
                updateQuery({ view: String(value), page: '1', id: undefined, type: undefined });
              }}
            />
            <Select
              allowClear
              placeholder={t('approvalCenter.list.allTypes')}
              value={filterType}
              options={typeOptions}
              style={{ width: 180 }}
              onChange={(value) => {
                clearBatchSelection();
                updateQuery({ filterType: value || undefined, page: '1', id: undefined, type: undefined });
              }}
            />
            <Search
              allowClear
              value={keywordDraft}
              placeholder={t('approvalCenter.list.searchPlaceholder')}
              style={{ width: 320, marginLeft: 'auto', maxWidth: '100%' }}
              onChange={(event) => setKeywordDraft(event.target.value)}
              onSearch={(value) => {
                clearBatchSelection();
                updateQuery({ keyword: value || undefined, page: '1', id: undefined, type: undefined });
              }}
            />
          </div>

          <Table
            columns={approvalColumns}
            dataSource={approvalTableData}
            rowKey="key"
            rowSelection={rowSelection}
            scroll={{ x: 1500 }}
            pagination={{
              current: currentPage,
              pageSize,
              total: approvalListQuery.data?.total || 0,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (count) => t('approvalCenter.list.showTotal', { count }),
              onChange: (page, size) => {
                clearBatchSelection();
                updateQuery({
                  page: String(page),
                  size: String(size || pageSize),
                  id: undefined,
                  type: undefined,
                });
              },
            }}
            rowClassName={(record: ApprovalCenterItem) => (
              selectedItem?.id === record.id && selectedItem?.approvalType === record.approvalType
                ? 'bg-sky-50'
                : ''
            )}
            locale={{
              emptyText: <Empty description={t('approvalCenter.list.empty')} />,
            }}
          />
        </Card>
      </Space>

      <Modal
        title={detailTitle}
        open={detailDialogOpen}
        onCancel={closeItemDetail}
        footer={null}
        destroyOnHidden
        width={detailModalWidth}
        style={{ top: screens.lg ? 24 : 8 }}
        styles={{
          body: {
            maxHeight: screens.lg ? 'calc(100vh - 180px)' : 'calc(100vh - 120px)',
            overflowY: 'auto',
            paddingTop: 12,
          },
        }}
      >
        {renderSelectedDetail()}
      </Modal>

      <QualityIssueHandleDrawer
        open={qualityDrawerOpen}
        issue={qualityIssueQuery.data || null}
        onClose={closeItemDetail}
        onSuccess={() => {
          closeItemDetail();
          void refreshCenter();
        }}
      />

      <Modal
        title={t('approvalCenter.modals.batchReviewTitle')}
        open={batchReviewOpen}
        onOk={() => void submitBatchReview()}
        onCancel={() => setBatchReviewOpen(false)}
        confirmLoading={batchReviewMutation.isPending}
        okText={t('common.submit')}
        cancelText={t('common.cancel')}
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            showIcon
            type={batchReviewDecision === 'approve' ? 'warning' : 'info'}
            message="批量动作风险提示"
            description={`影响资源 ${batchRiskSummary.impactedResourceCount} 个；涉及成本：${batchRiskSummary.estimatedCostText}；${batchRiskSummary.securityPolicyText}；可回滚性：${batchRiskSummary.rollbackText}。`}
          />
          <Segmented
            block
            options={reviewDecisionOptions}
            value={batchReviewDecision}
            onChange={(value) => setBatchReviewDecision(value as ApprovalCenterReviewDecision)}
          />
          <TextArea
            rows={5}
            value={batchReviewComment}
            onChange={(event) => setBatchReviewComment(event.target.value)}
            placeholder={batchReviewDecision === 'request_modify'
              ? t('approvalCenter.modals.batchReviewRequestModifyPlaceholder')
              : t('approvalCenter.modals.batchReviewCommentPlaceholder')}
          />
        </Space>
      </Modal>

      <Modal
        title={t('approvalCenter.modals.batchAssignTitle')}
        open={batchAssignOpen}
        onOk={() => void submitBatchAssign()}
        onCancel={() => setBatchAssignOpen(false)}
        confirmLoading={batchAssignMutation.isPending}
        okText={t('common.submit')}
        cancelText={t('common.cancel')}
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            value={batchAssignAssigneeId}
            onChange={(event) => setBatchAssignAssigneeId(event.target.value)}
            placeholder={t('approvalCenter.modals.assigneeId')}
          />
          <Input
            value={batchAssignAssigneeName}
            onChange={(event) => setBatchAssignAssigneeName(event.target.value)}
            placeholder={t('approvalCenter.modals.assigneeNameOptional')}
          />
          <TextArea
            rows={4}
            value={batchAssignComment}
            onChange={(event) => setBatchAssignComment(event.target.value)}
            placeholder={selectedBatchType === 'security_incident'
              ? t('approvalCenter.modals.batchAssignSecurityPlaceholder')
              : t('approvalCenter.modals.batchAssignCommentPlaceholder')}
          />
        </Space>
      </Modal>

      <Modal
        title={t(SECURITY_ACTION_TITLE_KEY_MAP[securityActionType])}
        open={securityActionOpen}
        onOk={() => void submitSecurityAction()}
        confirmLoading={securityActionMutation.isPending}
        onCancel={() => setSecurityActionOpen(false)}
        okText={t('common.submit')}
        cancelText={t('common.cancel')}
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          {securityActionType === 'assign' ? (
            <>
              <Input
                value={securityAssigneeId}
                onChange={(event) => setSecurityAssigneeId(event.target.value)}
                placeholder={t('approvalCenter.security.assigneeIdOptional')}
              />
              <Input
                value={securityAssigneeName}
                onChange={(event) => setSecurityAssigneeName(event.target.value)}
                placeholder={t('approvalCenter.security.assigneeNameOptional')}
              />
            </>
          ) : null}
          <TextArea
            rows={4}
            value={securityComment}
            onChange={(event) => setSecurityComment(event.target.value)}
            placeholder={t('approvalCenter.security.commentPlaceholder')}
          />
        </Space>
      </Modal>
    </PageContainer>
  );
}

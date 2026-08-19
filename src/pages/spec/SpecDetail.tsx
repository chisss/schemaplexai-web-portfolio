/**
 * Spec 详情页
 * 审批操作动态化 - 根据 spec.status 决定显示哪些按钮
 */
import { useMemo, type CSSProperties } from 'react';
import { Card, Descriptions, Button, Tag, Space, Tabs, Spin, Alert, Popconfirm, message } from 'antd';
import {
  ApartmentOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
  EditOutlined,
  FileMarkdownOutlined,
  FlagOutlined,
  EyeOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import MarkdownPreview from '@/components/MarkdownPreview/MarkdownPreview';
import StatusTag from '@/components/StatusTag/StatusTag';
import { useSpecDetail, useSubmitSpec, useApproveSpec, useRejectSpec, useSpecWorkflowTracking } from '@/api/spec';
import { useChannels } from '@/api/channel';
import { useAllWorkspaces } from '@/api/workspace';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import type { SpecStatus } from '@/types/spec';
import type { WorkflowInstanceStatus } from '@/types/workflow';
import { formatDateTime } from '@/utils/date';

/** 各阶段可提交审批的状态映射 */
const SUBMIT_DOC_TYPE_MAP: Record<string, string> = {
  draft: 'requirements',
  requirements_approved: 'design',
  design_approved: 'tasks',
};

/** 可审批（通过/驳回）的状态 */
const REVIEWABLE_STATUSES = ['requirements_review', 'design_review', 'tasks_review'];

/** 工作流节点定义 */
const WORKFLOW_NODES = [
  { key: 'draft', label: 'spec.statusDraft' },
  { key: 'requirements_review', label: 'spec.statusReqReview' },
  { key: 'requirements_approved', label: 'spec.statusReqApproved' },
  { key: 'design_review', label: 'spec.statusDesignReview' },
  { key: 'design_approved', label: 'spec.statusDesignApproved' },
  { key: 'tasks_review', label: 'spec.statusTaskReview' },
  { key: 'ready', label: 'spec.statusReady' },
  { key: 'in_progress', label: 'spec.statusInProgress' },
  { key: 'failed', label: 'spec.statusFailed' },
  { key: 'completed', label: 'spec.statusCompleted' },
  { key: 'acceptance', label: 'spec.statusAcceptance' },
  { key: 'archived', label: 'spec.statusArchived' },
];

const WORKFLOW_NODE_HINT_KEYS: Record<string, string> = {
  draft: 'spec.workflowNodeHintDraft',
  requirements_review: 'spec.workflowNodeHintRequirementsReview',
  requirements_approved: 'spec.workflowNodeHintRequirementsApproved',
  design_review: 'spec.workflowNodeHintDesignReview',
  design_approved: 'spec.workflowNodeHintDesignApproved',
  tasks_review: 'spec.workflowNodeHintTasksReview',
  ready: 'spec.workflowNodeHintReady',
  in_progress: 'spec.workflowNodeHintInProgress',
  failed: 'spec.workflowNodeHintFailed',
  completed: 'spec.workflowNodeHintCompleted',
  acceptance: 'spec.workflowNodeHintAcceptance',
  archived: 'spec.workflowNodeHintArchived',
};

const TRACK_CARD_STYLE: CSSProperties = {
  borderRadius: 'var(--radius-lg)',
};

const resolveStageTone = (state: 'completed' | 'current' | 'upcoming', isDark: boolean) => {
  if (state === 'completed') {
    return {
      accent: '#52c41a',
      soft: isDark ? 'rgba(82,196,26,0.18)' : 'rgba(82,196,26,0.12)',
      border: isDark ? 'rgba(82,196,26,0.32)' : 'rgba(82,196,26,0.22)',
      cardBg: isDark
        ? 'linear-gradient(135deg, rgba(82,196,26,0.14) 0%, rgba(22,28,36,0.92) 55%, rgba(22,28,36,0.98) 100%)'
        : 'linear-gradient(135deg, rgba(240,253,244,1) 0%, rgba(255,255,255,1) 72%)',
      cardBorder: isDark ? 'rgba(82,196,26,0.24)' : 'rgba(187,247,208,0.9)',
      shadow: isDark ? '0 18px 30px rgba(6,78,59,0.16)' : '0 18px 30px rgba(34,197,94,0.10)',
      labelKey: 'spec.workflowStageCompleted',
    };
  }
  if (state === 'current') {
    return {
      accent: '#1677ff',
      soft: isDark ? 'rgba(22,119,255,0.20)' : 'rgba(22,119,255,0.12)',
      border: isDark ? 'rgba(64,150,255,0.38)' : 'rgba(22,119,255,0.22)',
      cardBg: isDark
        ? 'linear-gradient(135deg, rgba(22,119,255,0.18) 0%, rgba(18,24,34,0.94) 58%, rgba(18,24,34,0.98) 100%)'
        : 'linear-gradient(135deg, rgba(239,246,255,1) 0%, rgba(255,255,255,1) 72%)',
      cardBorder: isDark ? 'rgba(64,150,255,0.28)' : 'rgba(191,219,254,0.95)',
      shadow: isDark ? '0 18px 34px rgba(22,119,255,0.18)' : '0 20px 34px rgba(22,119,255,0.12)',
      labelKey: 'spec.workflowStageCurrent',
    };
  }
  return {
    accent: isDark ? '#94a3b8' : '#64748b',
    soft: isDark ? 'rgba(71,85,105,0.28)' : 'rgba(226,232,240,0.58)',
    border: isDark ? 'rgba(100,116,139,0.28)' : 'rgba(148,163,184,0.24)',
    cardBg: isDark
      ? 'linear-gradient(135deg, rgba(30,41,59,0.76) 0%, rgba(22,28,36,0.94) 78%)'
      : 'linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 72%)',
    cardBorder: isDark ? 'rgba(71,85,105,0.36)' : 'rgba(226,232,240,0.95)',
    shadow: isDark ? '0 16px 28px rgba(2,6,23,0.18)' : '0 16px 28px rgba(15,23,42,0.06)',
    labelKey: 'spec.workflowStageUpcoming',
  };
};

export default function SpecDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const { hasPermission } = useAuthStore();
  const canUpdate = hasPermission('spec:update');
  const canSubmitPerm = hasPermission('spec:submit');
  const canApprove = hasPermission('spec:approve');
  const canReject = hasPermission('spec:reject');
  const PRIORITY_MAP: Record<string, { color: string; label: string }> = {
    low: { color: 'default', label: t('spec.priorityLow') },
    medium: { color: 'blue', label: t('spec.priorityMedium') },
    high: { color: 'orange', label: t('spec.priorityHigh') },
    critical: { color: 'red', label: t('spec.priorityCritical') },
  };

  const categoryLabels: Record<string, string> = {
    'feature-development': t('spec.categoryFeature'),
    'bug-fix': t('spec.categoryBugFix'),
    'refactoring': t('spec.categoryRefactoring'),
    'data-analysis': t('spec.categoryDataAnalysis'),
    'config-change': t('spec.categoryConfigChange'),
    'campaign-copy': '营销活动文案',
    'ad-copy': '广告投放文案',
    'sms-copy': '短信文案',
    'landing-page-copy': '落地页文案',
    'social-post': '社媒文案',
  };
  const specTypeLabels: Record<string, string> = {
    rd: t('spec.typeRd'),
    marketing: t('spec.typeMarketing'),
    qa: '质检类',
    ops: '运营类',
  };

  const { data: spec, isLoading, isError } = useSpecDetail(id!);
  const { data: workflowTracking } = useSpecWorkflowTracking(id!);
  const { data: workspaceList } = useAllWorkspaces();
  const { data: channelListData } = useChannels({ page: 1, size: 100, status: 'active' });
  const submitSpec = useSubmitSpec();
  const approveSpec = useApproveSpec();
  const rejectSpec = useRejectSpec();
  const workspaceNameMap = useMemo(
    () => new Map((workspaceList || []).map((workspace) => [workspace.id, workspace.name])),
    [workspaceList],
  );
  const channelNameMap = useMemo(
    () => new Map((channelListData?.records || []).map((channel) => [channel.id, channel.name])),
    [channelListData],
  );

  // 判断当前状态可执行的审批操作
  const canSubmit = useMemo(() => {
    if (!spec) return false;
    return Object.keys(SUBMIT_DOC_TYPE_MAP).includes(spec.status);
  }, [spec]);

  const submitDocType = useMemo(() => {
    if (!spec) return '';
    return SUBMIT_DOC_TYPE_MAP[spec.status] || '';
  }, [spec]);

  const canReview = useMemo(() => {
    if (!spec) return false;
    return REVIEWABLE_STATUSES.includes(spec.status);
  }, [spec]);

  // 提交审批
  const handleSubmit = async () => {
    try {
      await submitSpec.mutateAsync({ id: id!, docType: submitDocType });
      message.success(t('spec.submitSuccess'));
    } catch {
      // 错误已在拦截器中处理
    }
  };

  // 审批通过
  const handleApprove = async () => {
    try {
      await approveSpec.mutateAsync(id!);
      message.success(t('spec.approveSuccess'));
    } catch {
      // 错误已在拦截器中处理
    }
  };

  // 审批驳回
  const handleReject = async () => {
    try {
      await rejectSpec.mutateAsync(id!);
      message.success(t('spec.rejectSuccess'));
    } catch {
      // 错误已在拦截器中处理
    }
  };

  if (isLoading) {
    return (
      <PageContainer title={t('spec.detailTitle')}>
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !spec) {
    return (
      <PageContainer title={t('spec.detailTitle')} extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>{t('common.back')}</Button>}>
        <Alert type="error" title={t('spec.loadFail')} showIcon />
      </PageContainer>
    );
  }

  const priorityInfo = PRIORITY_MAP[spec.priority] ?? { color: 'default', label: spec.priority };
  const workflowInstanceId = workflowTracking?.id || spec.workflowInstanceId;
  const creatorDisplayName = spec.createdByName || spec.ownerName || spec.createdBy || spec.owner || '-';
  const workspaceIds = spec.workspaceIds?.length ? spec.workspaceIds : (spec.projectId ? [spec.projectId] : []);
  const workspaceDisplayName = workspaceIds.length > 0
    ? workspaceIds.map((workspaceId) => workspaceNameMap.get(workspaceId) || workspaceId).join(', ')
    : '-';
  const workflowTrackColors = {
    shellBg: isDark
      ? 'linear-gradient(180deg, rgba(17,24,39,0.92) 0%, rgba(15,23,42,0.72) 100%)'
      : 'linear-gradient(180deg, rgba(248,251,255,0.96) 0%, rgba(255,255,255,0.96) 100%)',
    shellBorder: isDark ? 'rgba(51,65,85,0.62)' : 'rgba(219,234,254,0.94)',
    shellShadow: isDark ? '0 28px 56px rgba(2,6,23,0.34)' : '0 28px 56px rgba(15,23,42,0.08)',
    sectionBg: isDark ? 'rgba(31,36,44,0.88)' : '#ffffff',
    sectionBorder: isDark ? 'rgba(71,85,105,0.46)' : 'rgba(219,234,254,0.86)',
    sectionShadow: isDark ? '0 18px 32px rgba(2,6,23,0.18)' : '0 20px 36px rgba(15,23,42,0.06)',
    headerIconBg: isDark ? 'rgba(22,119,255,0.18)' : 'rgba(22,119,255,0.10)',
    headerIconBorder: isDark ? 'rgba(64,150,255,0.28)' : 'rgba(191,219,254,0.88)',
    panelBg: isDark ? 'rgba(17,24,39,0.42)' : 'rgba(248,250,252,0.86)',
    panelBorder: isDark ? 'rgba(71,85,105,0.42)' : 'rgba(226,232,240,0.92)',
    divider: isDark ? 'rgba(71,85,105,0.38)' : 'rgba(226,232,240,0.92)',
    title: isDark ? '#F8FAFC' : '#0f172a',
    body: isDark ? '#CBD5E1' : '#64748b',
    muted: isDark ? '#94A3B8' : '#64748b',
    value: isDark ? '#E2E8F0' : '#334155',
    upcomingBg: isDark ? 'rgba(30,41,59,0.92)' : 'rgba(241,245,249,0.96)',
    upcomingBorder: isDark ? 'rgba(71,85,105,0.92)' : 'rgba(226,232,240,0.92)',
    connector: isDark ? 'rgba(71,85,105,0.78)' : 'rgba(226,232,240,0.9)',
    accent: '#1677ff',
    accentSoft: isDark ? 'rgba(22,119,255,0.18)' : 'rgba(22,119,255,0.10)',
    accentBorder: isDark ? 'rgba(64,150,255,0.32)' : 'rgba(191,219,254,0.92)',
  };
  const workflowShellStyle: CSSProperties = {
    padding: 0,
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
  };
  const trackSectionStyle: CSSProperties = {
    borderRadius: 22,
    border: `1px solid ${workflowTrackColors.sectionBorder}`,
    background: workflowTrackColors.sectionBg,
    boxShadow: workflowTrackColors.sectionShadow,
    padding: 28,
  };

  // 动态生成工作流时间线
  const currentIndex = WORKFLOW_NODES.findIndex((n) => n.key === spec.status);
  const lifecycleCards = WORKFLOW_NODES.map((node, index) => {
    const stageState = index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'upcoming';
    const tone = resolveStageTone(stageState, isDark);
    const isLast = index === WORKFLOW_NODES.length - 1;
    const stageIcon = stageState === 'completed'
      ? <CheckCircleOutlined style={{ color: tone.accent, fontSize: 16 }} />
      : stageState === 'current'
        ? <ApartmentOutlined style={{ color: tone.accent, fontSize: 16 }} />
        : <ClockCircleOutlined style={{ color: tone.accent, fontSize: 16 }} />;
    return (
      <div
        key={node.key}
        style={{
          display: 'grid',
          gridTemplateColumns: '52px minmax(0, 1fr)',
          columnGap: 18,
          alignItems: 'stretch',
          marginBottom: isLast ? 0 : 20,
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              minWidth: 24,
              height: 24,
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              background: stageState === 'upcoming' ? workflowTrackColors.upcomingBg : tone.soft,
              color: stageState === 'upcoming' ? workflowTrackColors.muted : tone.accent,
              border: `1px solid ${stageState === 'upcoming' ? workflowTrackColors.upcomingBorder : tone.border}`,
              boxShadow: stageState === 'current' ? tone.shadow : 'none',
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          {!isLast ? (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                bottom: -20,
                width: 1,
                transform: 'translateX(-50%)',
                borderRadius: 999,
                background: index < currentIndex ? 'rgba(5,150,105,0.18)' : workflowTrackColors.connector,
              }}
            />
          ) : null}
        </div>
        <div
          style={{
            minWidth: 0,
          }}
        >
          <div
            style={{
              minWidth: 0,
              borderRadius: 20,
              padding: 18,
              background: tone.cardBg,
              border: `1px solid ${tone.cardBorder}`,
              boxShadow: tone.shadow,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, ${tone.soft} 0%, transparent 42%)`,
                opacity: stageState === 'upcoming' ? 0.36 : 0.65,
              }}
            />
            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 14,
              }}
            >
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    minWidth: 36,
                    height: 36,
                    borderRadius: 14,
                    background: tone.soft,
                    border: `1px solid ${tone.border}`,
                    boxShadow: stageState === 'current' ? tone.shadow : 'none',
                  }}
                >
                  {stageIcon}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="text-[16px] font-semibold leading-6" style={{ minWidth: 0, color: workflowTrackColors.title }}>
                    {t(node.label)}
                  </div>
                  <div className="max-w-3xl text-[13px] leading-6" style={{ marginTop: 10, color: workflowTrackColors.body }}>
                    {t(WORKFLOW_NODE_HINT_KEYS[node.key])}
                  </div>
                </div>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  flex: '0 0 auto',
                  borderRadius: 999,
                  padding: '6px 14px',
                  fontSize: 11,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  color: tone.accent,
                  background: tone.soft,
                  border: `1px solid ${tone.border}`,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: tone.accent,
                    opacity: stageState === 'upcoming' ? 0.5 : 1,
                  }}
                />
                {t(tone.labelKey)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  });
  const workflowSectionIconStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 46,
    minWidth: 46,
    height: 46,
    borderRadius: 16,
    background: workflowTrackColors.headerIconBg,
    border: `1px solid ${workflowTrackColors.headerIconBorder}`,
    color: workflowTrackColors.accent,
    boxShadow: isDark ? '0 12px 24px rgba(15,23,42,0.22)' : '0 12px 24px rgba(22,119,255,0.12)',
  };
  const workflowMetaCardStyle: CSSProperties = {
    borderRadius: 18,
    background: workflowTrackColors.panelBg,
    border: `1px solid ${workflowTrackColors.panelBorder}`,
    boxShadow: isDark ? 'inset 0 1px 0 rgba(148,163,184,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.72)',
  };
  const workflowTimelineShellStyle: CSSProperties = {
    borderRadius: 22,
    background: workflowTrackColors.panelBg,
    border: `1px solid ${workflowTrackColors.panelBorder}`,
    padding: 18,
  };
  const relatedExecutionTable = (
      <Descriptions bordered size="middle" column={{ xs: 1, sm: 1, md: 2 }}>
      <Descriptions.Item label={t('spec.lifecycleLabel')}>
        <StatusTag status={spec.status as SpecStatus} type="spec" />
      </Descriptions.Item>
      <Descriptions.Item label={t('spec.workflowLabel')}>
        {workflowTracking?.status ? (
          <StatusTag status={workflowTracking.status as WorkflowInstanceStatus} type="workflow" />
        ) : (
          '-'
        )}
      </Descriptions.Item>
      <Descriptions.Item label={t('spec.workflowInstance')}>
        {workflowInstanceId ? (
          <Button
            type="link"
            className="!h-auto !px-0 font-mono !font-semibold"
            onClick={() => {
              navigate(`/workflow/executions?instanceId=${workflowInstanceId}`);
            }}
          >
            {workflowInstanceId}
          </Button>
        ) : (
          '-'
        )}
      </Descriptions.Item>
      <Descriptions.Item label={t('common.createTime')}>
        {workflowTracking?.createdAt ? formatDateTime(workflowTracking.createdAt) : '-'}
      </Descriptions.Item>
      <Descriptions.Item label={t('common.updateTime')}>
        {workflowTracking?.updatedAt ? formatDateTime(workflowTracking.updatedAt) : '-'}
      </Descriptions.Item>
    </Descriptions>
  );

  const tabItems = [
    {
      key: 'overview',
      label: t('spec.overview'),
      children: (
        <Card variant="borderless" className="shadow-sm">
            <Descriptions column={2} bordered>
            <Descriptions.Item label="Spec ID">{spec.id}</Descriptions.Item>
            <Descriptions.Item label={t('common.name')}>{spec.name}</Descriptions.Item>
            <Descriptions.Item label={t('spec.priority')}>
              <Tag color={priorityInfo.color}>{priorityInfo.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('spec.phase')}>
              <StatusTag status={spec.status as SpecStatus} type="spec" />
            </Descriptions.Item>
            <Descriptions.Item label={t('spec.version')}>{spec.version}</Descriptions.Item>
            <Descriptions.Item label={t('spec.assignee')}>{spec.ownerName || spec.owner || '-'}</Descriptions.Item>
            {spec.category && (
              <Descriptions.Item label={t('spec.category')}>
                <Tag>{categoryLabels[spec.category] || spec.category}</Tag>
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t('spec.type')}>
              <Tag color={spec.specType === 'marketing' ? 'gold' : 'blue'}>
                {specTypeLabels[spec.specType || 'rd'] || spec.specType || 'rd'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Jira">{spec.jiraTicket || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('spec.targetBranch')}>{spec.targetBranch || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('spec.creator')}>{creatorDisplayName}</Descriptions.Item>
            <Descriptions.Item label={t('common.createTime')}>{spec.createdAt}</Descriptions.Item>
            <Descriptions.Item label={t('common.updateTime')}>{spec.updatedAt}</Descriptions.Item>
            <Descriptions.Item label={t('spec.workspaces')}>{workspaceDisplayName}</Descriptions.Item>
            {spec.tags?.length > 0 && (
              <Descriptions.Item label={t('spec.tags')} span={2}>
                <Space wrap>
                  {spec.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            )}
          </Descriptions>

          {spec.description && (
            <div style={{ marginTop: 24, background: isDark ? '#2A2B2D' : '#F8FAFC', border: `1px solid ${isDark ? '#3D3E40' : '#E2E8F0'}` }} className="p-4 rounded-lg">
              <h3 className="mb-4 text-lg font-medium"><FileMarkdownOutlined className="mr-2"/>{t('common.description')}</h3>
              <MarkdownPreview content={spec.description} />
            </div>
          )}

          {spec.specType === 'marketing' && spec.profileData && (
            <Card style={{ marginTop: 24 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label={t('spec.marketing.productName')}>
                  {spec.profileData.productName || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('spec.marketing.marketRegion')}>
                  {spec.profileData.marketRegion || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('spec.marketing.language')}>
                  {spec.profileData.language || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('spec.marketing.channels')}>
                  {Array.isArray(spec.profileData.channels) && spec.profileData.channels.length > 0
                    ? spec.profileData.channels.join(', ')
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('spec.marketing.targetAudience')} span={2}>
                  {spec.profileData.targetAudience || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="最终交付类型">
                  {spec.profileData.deliveryConfig?.deliveryType === 'feishu_doc'
                    ? '飞书文档'
                    : spec.profileData.deliveryConfig?.deliveryType === 'workspace_file'
                      ? '工作空间文件'
                      : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="飞书交付渠道">
                  {spec.profileData.deliveryConfig?.channelId
                    ? channelNameMap.get(spec.profileData.deliveryConfig.channelId) || spec.profileData.deliveryConfig.channelId
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="飞书文档标题">
                  {spec.profileData.deliveryConfig?.title || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="飞书目录 Token">
                  {spec.profileData.deliveryConfig?.folderToken || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </Card>
      ),
    },
    {
      key: 'workflow',
      label: t('spec.workflowTrack'),
      children: (
        <Card variant="borderless" style={{ ...TRACK_CARD_STYLE, background: 'transparent', boxShadow: 'none' }}>
          <div style={workflowShellStyle}>
            <div
              style={{
                display: 'grid',
                rowGap: 24,
              }}
            >
              <section>
                <div className="flex flex-col gap-6">
                  <div className="flex items-start gap-4">
                    <span style={workflowSectionIconStyle}>
                      <ApartmentOutlined style={{ fontSize: 22 }} />
                    </span>
                    <div>
                      <h3 className="mb-2 text-[22px] font-semibold tracking-tight" style={{ color: workflowTrackColors.title }}>
                        {t('spec.relatedExecutions')}
                      </h3>
                      <p className="mb-0 max-w-3xl text-sm leading-7" style={{ color: workflowTrackColors.body }}>
                        {t('spec.relatedExecutionsDescription')}
                      </p>
                    </div>
                  </div>
                  {relatedExecutionTable}
                </div>
              </section>

              <section style={trackSectionStyle}>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                      <span style={workflowSectionIconStyle}>
                        <FlagOutlined style={{ fontSize: 22 }} />
                      </span>
                      <div>
                        <h3 className="mb-2 text-[22px] font-semibold tracking-tight" style={{ color: workflowTrackColors.title }}>
                          {t('spec.lifecycleNodes')}
                        </h3>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 rounded-2xl px-3 py-3 md:justify-end" style={workflowMetaCardStyle}>
                      <StatusTag status={'acceptance' as SpecStatus} type="spec" />
                      <StatusTag status={'archived' as SpecStatus} type="spec" />
                    </div>
                  </div>
                  <div style={workflowTimelineShellStyle}>{lifecycleCards}</div>
                </div>
              </section>
            </div>
          </div>
        </Card>
      ),
    },
    {
      key: 'artifact',
      label: t('artifact.center'),
      children: (
        <Card variant="borderless" className="shadow-sm">
          {spec.primaryArtifact ? (
            <Descriptions bordered column={2}>
              <Descriptions.Item label={t('common.name')}>{spec.primaryArtifact.title || spec.primaryArtifact.name}</Descriptions.Item>
              <Descriptions.Item label={t('common.type')}>
                <Space>
                  <Tag>{spec.primaryArtifact.artifactType}</Tag>
                  {spec.primaryArtifact.format ? <Tag color="blue">{spec.primaryArtifact.format}</Tag> : null}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t('artifact.latestVersion')}>
                {spec.primaryArtifact.latestVersion ?? '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('common.updateTime')}>
                {spec.primaryArtifact.updatedAt ? formatDateTime(spec.primaryArtifact.updatedAt) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('artifact.preview')} span={2}>
                <Button type="link" className="px-0" onClick={() => navigate(`/artifacts/${spec.primaryArtifactId}`)}>
                  {t('spec.viewArtifact')}
                </Button>
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Alert type="info" showIcon message={t('artifact.empty')} />
          )}
        </Card>
      ),
    },
  ];

  return (
    <PageContainer
      title={spec.name}
      extra={
        <Space>
          {/* 进入编辑器 */}
          {canUpdate && (
            <Button icon={<EditOutlined />} type="primary" onClick={() => navigate(`/spec/${id}/edit`)}>
              {t('spec.enterEditor')}
            </Button>
          )}

          {spec.primaryArtifactId && (
            <Button icon={<EyeOutlined />} onClick={() => navigate(`/artifacts/${spec.primaryArtifactId}`)}>
              {t('spec.viewArtifact')}
            </Button>
          )}

          {/* 动态审批按钮 - 提交审批 */}
          {canSubmit && canSubmitPerm && (
            <Popconfirm
              title={t('spec.submitConfirm', { docType: submitDocType })}
              onConfirm={handleSubmit}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
            >
              <Button
                icon={<SendOutlined />}
                loading={submitSpec.isPending}
              >
                {t('spec.submitDocReview', { docType: submitDocType })}
              </Button>
            </Popconfirm>
          )}

          {/* 动态审批按钮 - 通过 */}
          {canReview && canApprove && (
            <Popconfirm
              title={t('spec.approveConfirm')}
              onConfirm={handleApprove}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
            >
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={approveSpec.isPending}
                style={{ background: 'var(--color-success)', border: 'none' }}
              >
                {t('spec.approve')}
              </Button>
            </Popconfirm>
          )}

          {/* 动态审批按钮 - 驳回 */}
          {canReview && canReject && (
            <Popconfirm
              title={t('spec.rejectConfirm')}
              onConfirm={handleReject}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
            >
              <Button
                danger
                icon={<CloseCircleOutlined />}
                loading={rejectSpec.isPending}
              >
                {t('spec.reject')}
              </Button>
            </Popconfirm>
          )}

          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            {t('common.back')}
          </Button>
        </Space>
      }
    >
      <Tabs items={tabItems} size="large" />
    </PageContainer>
  );
}

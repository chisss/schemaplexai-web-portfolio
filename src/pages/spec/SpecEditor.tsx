/**
 * Spec 编辑器页面
 * 支持版本历史侧边栏、版本 Diff 对比、按状态控制编辑权限、审批操作
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  App as AntApp,
  Tabs,
  Button,
  Space,
  Spin,
  Drawer,
  List,
  Tag,
  Modal,
  Typography,
  Popconfirm,
  Alert,
  Card,
  Col,
  Descriptions,
  Grid,
  Row,
} from 'antd';
import {
  SaveOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  HistoryOutlined,
  DiffOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  useSpecDetail,
  useSpecDocument,
  useUpdateSpecDocument,
  useSpecVersions,
  useSpecVersionDiff,
  useSubmitSpec,
  useApproveSpec,
  useRejectSpec,
} from '@/api/spec';
import MonacoEditor from '@/components/MonacoEditor/MonacoEditor';
import MarkdownPreview from '@/components/MarkdownPreview/MarkdownPreview';
import PageContainer from '@/components/PageContainer/PageContainer';
import WorkflowWorkbench from './components/WorkflowWorkbench';
import type { SpecVersion } from '@/types/spec';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDateTime } from '@/utils/date';

const { Text, Paragraph } = Typography;

type DocType = 'requirements' | 'design' | 'tasks';
type DiffLine = {
  type: string;
  content: string;
};
type DiffResultData = {
  lines?: DiffLine[];
  sourceContent?: string;
  targetContent?: string;
};
type SpecVersionDiffResult = {
  data?: DiffResultData;
  lines?: DiffLine[];
  sourceContent?: string;
  targetContent?: string;
};
type TabTranslationKey = 'spec.requirements' | 'spec.design' | 'spec.tasks';

/** 可编辑的状态集合 - 根据当前文档类型判断 */
const EDITABLE_STATUS_MAP: Record<DocType, string[]> = {
  requirements: ['draft', 'requirements_review'],
  design: ['requirements_approved', 'design_review'],
  tasks: ['design_approved', 'tasks_review'],
};

/** 可提交审批的状态 */
const SUBMITTABLE_STATUS_MAP: Record<DocType, string[]> = {
  requirements: ['draft'],
  design: ['requirements_approved'],
  tasks: ['design_approved'],
};

/** 可审批操作的状态 */
const REVIEWABLE_STATUSES = ['requirements_review', 'design_review', 'tasks_review'];
const SPEC_STATUS_LABEL_MAP: Record<string, string> = {
  draft: 'spec.statusDraft',
  requirements_review: 'spec.statusReqReview',
  requirements_approved: 'spec.statusReqApproved',
  design_review: 'spec.statusDesignReview',
  design_approved: 'spec.statusDesignApproved',
  tasks_review: 'spec.statusTaskReview',
  ready: 'spec.statusReady',
  pending: 'spec.statusPending',
  in_progress: 'spec.statusInProgress',
  executing: 'spec.statusExecuting',
  failed: 'spec.statusFailed',
  completed: 'spec.statusCompleted',
  acceptance: 'spec.statusAcceptance',
  archived: 'spec.statusArchived',
};
const SPEC_STATUS_COLOR_MAP: Record<string, string> = {
  draft: 'default',
  requirements_review: 'processing',
  requirements_approved: 'blue',
  design_review: 'processing',
  design_approved: 'cyan',
  tasks_review: 'processing',
  ready: 'success',
  pending: 'success',
  in_progress: 'purple',
  executing: 'purple',
  failed: 'error',
  completed: 'success',
  acceptance: 'warning',
  archived: 'default',
};
const SPEC_PRIORITY_LABEL_MAP: Record<string, string> = {
  low: 'spec.priorityLow',
  medium: 'spec.priorityMedium',
  high: 'spec.priorityHigh',
  critical: 'spec.priorityCritical',
};
const SPEC_CATEGORY_LABEL_MAP: Record<string, string> = {
  'feature-development': 'spec.categoryFeature',
  'bug-fix': 'spec.categoryBugfix',
  refactoring: 'spec.categoryRefactoring',
  'data-analysis': 'spec.categoryDataAnalysis',
  'config-change': 'spec.categoryConfigChange',
};

function LegacySpecEditor() {
  const { message } = AntApp.useApp();
  const { t } = useTranslation();
  const { hasPermission } = useAuthStore();
  const canUpdatePerm = hasPermission('spec:update');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const [activeTab, setActiveTab] = useState<DocType>('requirements');
  // 用 ref 在 tab 切换时快照当前编辑器内容，防止 onChange(undefined) 覆盖
  const contentRef = useRef<{ requirements: string; design: string; tasks: string }>({
    requirements: '', design: '', tasks: '',
  });
  // 记录已完成初始化的 tab，防止 API 数据二次覆盖用户本地修改
  const initializedRef = useRef<Set<DocType>>(new Set());
  const [isPreview, setIsPreview] = useState(false);
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<[string | null, string | null]>([null, null]);
  const [diffResult, setDiffResult] = useState<SpecVersionDiffResult | null>(null);

  // 编辑器内容（本地状态）
  const [content, setContent] = useState({
    requirements: '',
    design: '',
    tasks: '',
  });

  // 获取 Spec 详情（用于判断状态）
  const { data: spec } = useSpecDetail(id!);

  // 获取文档数据
  const { data: requirementsDoc, isLoading: loadingReq } = useSpecDocument(id!, 'requirements');
  const { data: designDoc, isLoading: loadingDes } = useSpecDocument(id!, 'design');
  const { data: tasksDoc, isLoading: loadingTsk } = useSpecDocument(id!, 'tasks');

  // 获取版本历史
  const { data: versions, isLoading: loadingVersions } = useSpecVersions(id!, activeTab);

  // Mutations
  const updateDoc = useUpdateSpecDocument();
  const submitSpec = useSubmitSpec();
  const approveSpec = useApproveSpec();
  const rejectSpec = useRejectSpec();
  const versionDiff = useSpecVersionDiff();
  const versionMap = useMemo(() => {
    const map = new Map<string, SpecVersion>();
    ((versions as SpecVersion[]) || []).forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [versions]);

  // 当前文档是否可编辑
  const isEditable = useMemo(() => {
    if (!spec || !canUpdatePerm) return false;
    return EDITABLE_STATUS_MAP[activeTab]?.includes(spec.status) ?? false;
  }, [spec, activeTab, canUpdatePerm]);

  // 是否可提交审批
  const canSubmit = useMemo(() => {
    if (!spec) return false;
    return SUBMITTABLE_STATUS_MAP[activeTab]?.includes(spec.status) ?? false;
  }, [spec, activeTab]);

  // 是否可执行审批操作（通过/驳回）
  const canReview = useMemo(() => {
    if (!spec) return false;
    return REVIEWABLE_STATUSES.includes(spec.status);
  }, [spec]);

  const initializeTabContent = (docType: DocType, docContent: string) => {
    setContent((prev) => ({ ...prev, [docType]: docContent }));
    contentRef.current[docType] = docContent;
    initializedRef.current.add(docType);
  };

  // 初始化内容，同步到 ref（每个 tab 只初始化一次，防止 API 重新 fetch 覆盖用户修改）
  useEffect(() => {
    if (requirementsDoc && !initializedRef.current.has('requirements')) {
      queueMicrotask(() => initializeTabContent('requirements', requirementsDoc.content));
    }
  }, [requirementsDoc]);

  useEffect(() => {
    if (designDoc && !initializedRef.current.has('design')) {
      queueMicrotask(() => initializeTabContent('design', designDoc.content));
    }
  }, [designDoc]);

  useEffect(() => {
    if (tasksDoc && !initializedRef.current.has('tasks')) {
      queueMicrotask(() => initializeTabContent('tasks', tasksDoc.content));
    }
  }, [tasksDoc]);

  useEffect(() => {
    if (!loadingReq && !requirementsDoc && !initializedRef.current.has('requirements') && spec?.description) {
      queueMicrotask(() => initializeTabContent('requirements', spec.description));
    }
  }, [loadingReq, requirementsDoc, spec?.description]);

  // 保存文档
  const handleSave = async () => {
    try {
      await updateDoc.mutateAsync({
        specId: id!,
        docType: activeTab,
        content: content[activeTab],
      });
      message.success(t('spec.saveSuccess'));
    } catch {
      // 错误已在拦截器中处理
    }
  };

  // 提交审批
  const handleSubmit = async () => {
    try {
      await submitSpec.mutateAsync({ id: id!, docType: activeTab });
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

  // 内容变化：忽略 undefined（monaco 在 unmount 时可能触发 onChange(undefined)）
  const handleContentChange = (value: string | undefined) => {
    if (value === undefined) return;
    contentRef.current[activeTab] = value;
    setContent((prev) => ({
      ...prev,
      [activeTab]: value,
    }));
  };

  // 版本选择（用于 Diff）
  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions((prev) => {
      if (!prev[0]) return [versionId, null];
      if (!prev[1]) return [prev[0], versionId];
      return [versionId, null]; // 重置
    });
  };

  // 执行 Diff 对比
  const handleDiff = async () => {
    const [source, target] = selectedVersions;
    if (!source || !target) {
      message.warning(t('spec.selectTwoVersions'));
      return;
    }
    try {
      const result = await versionDiff.mutateAsync({
        specId: id!,
        sourceVersionId: source,
        targetVersionId: target,
      });
      setDiffResult(result);
      setDiffModalOpen(true);
    } catch {
      // 错误已在拦截器中处理
    }
  };

  const isLoading = loadingReq || loadingDes || loadingTsk;
  const tabTitleMap: Record<DocType, TabTranslationKey> = {
    requirements: 'spec.requirements',
    design: 'spec.design',
    tasks: 'spec.tasks',
  };
  const pageTitle = `${spec?.name || 'Spec'} · ${t(tabTitleMap[activeTab])}`;
  const currentStatusLabel = spec?.status
    ? t(SPEC_STATUS_LABEL_MAP[spec.status] || 'common.status')
    : t('spec.statusDraft');
  const currentStatusColor = spec?.status ? SPEC_STATUS_COLOR_MAP[spec.status] || 'default' : 'default';
  const editorHeight = screens.xl ? 'calc(100vh - 430px)' : 520;
  const previewMinHeight = screens.md ? 520 : 420;

  // Tab 配置
  const tabItems = [
    { key: 'requirements', label: t('spec.requirements') },
    { key: 'design', label: t('spec.design') },
    { key: 'tasks', label: t('spec.tasks') },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center" style={{ height: 400 }}>
          <Spin size="large" description={t('common.loading')} />
        </div>
      </PageContainer>
    );
  }

  /** 渲染 Diff 内容 - 逐行增删着色 */
  const renderDiffContent = () => {
    if (!diffResult) return null;

    // 兼容不同的 diff 返回格式
    const lines: DiffLine[] = diffResult.data?.lines || diffResult.lines || [];

    if (lines.length === 0) {
      // 简单文本 diff 回退
      const oldContent = diffResult.data?.sourceContent || diffResult.sourceContent || '';
      const newContent = diffResult.data?.targetContent || diffResult.targetContent || '';
      const oldLines = oldContent.split('\n');
      const newLines = newContent.split('\n');

      return (
        <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: '1.6' }}>
          <div className="mb-4">
            <Tag color="red">- {t('spec.removed')}</Tag>
            <Tag color="green">+ {t('spec.added')}</Tag>
          </div>
          <div className="border rounded-lg overflow-auto" style={{ maxHeight: 500 }}>
            {oldLines.map((line: string, i: number) => (
              <div
                key={`old-${i}`}
                style={{
                  padding: '2px 12px',
                  background: newLines[i] !== line ? 'rgba(245, 63, 63, 0.08)' : 'transparent',
                  borderLeft: newLines[i] !== line ? '3px solid var(--color-error)' : '3px solid transparent',
                }}
              >
                <Text type="secondary" className="mr-3 select-none" style={{ fontSize: 11 }}>{i + 1}</Text>
                {line}
              </div>
            ))}
            <div className="border-t my-2" />
            {newLines.map((line: string, i: number) => (
              <div
                key={`new-${i}`}
                style={{
                  padding: '2px 12px',
                  background: oldLines[i] !== line ? 'rgba(0, 180, 42, 0.08)' : 'transparent',
                  borderLeft: oldLines[i] !== line ? '3px solid var(--color-success)' : '3px solid transparent',
                }}
              >
                <Text type="secondary" className="mr-3 select-none" style={{ fontSize: 11 }}>{i + 1}</Text>
                {line}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 结构化 diff 行
    return (
      <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: '1.6' }}>
        <div className="mb-4">
          <Tag color="red">- {t('spec.removed')}</Tag>
          <Tag color="green">+ {t('spec.added')}</Tag>
        </div>
        <div className="border rounded-lg overflow-auto" style={{ maxHeight: 500 }}>
          {lines.map((line, i) => {
            let bgColor = 'transparent';
            let borderColor = 'transparent';
            let prefix = ' ';
            if (line.type === 'add' || line.type === 'added') {
              bgColor = 'rgba(0, 180, 42, 0.08)';
              borderColor = 'var(--color-success)';
              prefix = '+';
            } else if (line.type === 'remove' || line.type === 'removed' || line.type === 'delete') {
              bgColor = 'rgba(245, 63, 63, 0.08)';
              borderColor = 'var(--color-error)';
              prefix = '-';
            }
            return (
              <div
                key={i}
                style={{
                  padding: '2px 12px',
                  background: bgColor,
                  boxShadow: borderColor === 'transparent' ? 'none' : `inset 3px 0 0 ${borderColor}`,
                }}
              >
                <Text type="secondary" className="mr-2 select-none" style={{ fontSize: 11 }}>{prefix}</Text>
                {line.content}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <PageContainer
      title={pageTitle}
      description={spec?.description || t(tabTitleMap[activeTab])}
      extra={
        <Space wrap>
          <Button
            icon={<HistoryOutlined />}
            onClick={() => setVersionDrawerOpen(true)}
          >
            {t('spec.versionHistory')}
          </Button>

          <Button
            icon={<EyeOutlined />}
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? t('spec.editMode') : t('spec.previewMode')}
          </Button>

          {isEditable && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={updateDoc.isPending}
            >
              {t('spec.saveButton')}
            </Button>
          )}

          {/* 提交审批按钮 */}
          {canSubmit && (
            <Popconfirm
              title={t('spec.submitConfirm')}
              onConfirm={handleSubmit}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
            >
              <Button
                icon={<SendOutlined />}
                loading={submitSpec.isPending}
              >
                {t('spec.submitReview')}
              </Button>
            </Popconfirm>
          )}

          {/* 审批操作按钮 */}
          {canReview && (
            <>
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
                >
                  {t('spec.approve')}
                </Button>
              </Popconfirm>
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
            </>
          )}

          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            {t('common.back')}
          </Button>
        </Space>
      }
    >
      <div className="flex flex-col gap-4">
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <Card
              variant="borderless"
              className="shadow-sm rounded-xl"
              styles={{ body: { padding: screens.md ? '24px 28px' : 18 } }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text type="secondary">{t('spec.editor')}</Text>
                  <div style={{ fontSize: screens.md ? 24 : 20, fontWeight: 700, marginTop: 8 }}>
                    {spec?.name || 'Spec'}
                  </div>
                  <Paragraph
                    type="secondary"
                    style={{ marginTop: 10, marginBottom: 0, maxWidth: 720 }}
                    ellipsis={{ rows: 2, tooltip: spec?.description || t('common.noDescription') }}
                  >
                    {spec?.description || t('common.noDescription')}
                  </Paragraph>
                </div>
                <Space size={[8, 8]} wrap>
                  <Tag color={currentStatusColor}>{currentStatusLabel}</Tag>
                  <Tag color={isEditable ? 'processing' : 'default'}>
                    {isEditable ? t('spec.editable') : t('spec.readonlyShort')}
                  </Tag>
                  <Tag color="blue">{t('spec.version')}: {spec?.version || '-'}</Tag>
                </Space>
              </div>

              <Descriptions
                column={screens.lg ? 4 : 2}
                colon={false}
                size="small"
                style={{ marginTop: 18 }}
                styles={{
                  label: { color: 'var(--color-text-tertiary)' },
                  content: { color: 'var(--color-text-primary)', fontWeight: 500 },
                }}
              >
                <Descriptions.Item label={t('spec.category')}>
                  {spec?.category ? t(SPEC_CATEGORY_LABEL_MAP[spec.category] || spec.category) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('spec.priority')}>
                  {spec?.priority ? t(SPEC_PRIORITY_LABEL_MAP[spec.priority] || spec.priority) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('spec.editor')}>
                  {t(tabTitleMap[activeTab])}
                </Descriptions.Item>
                <Descriptions.Item label={t('common.updateTime')}>
                  {spec?.updatedAt ? formatDateTime(spec.updatedAt) : '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} xl={8}>
            <Card
              variant="borderless"
              className="shadow-sm rounded-xl"
              styles={{ body: { padding: screens.md ? '24px 24px 20px' : 18 } }}
            >
              <Text strong style={{ fontSize: 16 }}>
                {t('spec.versionHistory')}
              </Text>
              <Paragraph type="secondary" style={{ marginTop: 10, marginBottom: 16 }}>
                {t('spec.selectTwoVersions')}
              </Paragraph>
              <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                <Button icon={<HistoryOutlined />} block onClick={() => setVersionDrawerOpen(true)}>
                  {t('spec.versionHistory')}
                </Button>
                <Text type="secondary">
                  {t('spec.compareDiff')}
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>

        {!isEditable && (
          <Alert
            type="warning"
            showIcon
            title={t('spec.readonlyTip')}
            description={t('spec.readonlyDesc')}
          />
        )}

        <Card variant="borderless" className="shadow-sm rounded-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Tag color={currentStatusColor}>{currentStatusLabel}</Tag>
              <Tag color="blue">{t('spec.version')}: {spec?.version || '-'}</Tag>
              <Tag color={isEditable ? 'processing' : 'default'}>
                {isEditable ? t('spec.editable') : t('spec.readonlyShort')}
              </Tag>
            </div>
            <Text type="secondary">
              {spec?.workflowInstanceId
                ? `${t('spec.workflowInstanceId')}: ${spec.workflowInstanceId}`
                : t('spec.versionHistory')}
            </Text>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key as DocType);
            }}
            items={tabItems}
            size="large"
          />

          <Card
            size="small"
            style={{ marginTop: 16 }}
            styles={{
              body: {
                padding: isPreview ? (screens.md ? 24 : 18) : 0,
                minHeight: previewMinHeight,
              },
            }}
          >
            {isPreview ? (
              <div style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--color-text-primary)', minHeight: previewMinHeight }}>
                <MarkdownPreview content={content[activeTab]} />
              </div>
            ) : (
              <MonacoEditor
                key={activeTab}
                value={content[activeTab]}
                onChange={handleContentChange}
                language="markdown"
                height={editorHeight}
                options={{ readOnly: !isEditable }}
              />
            )}
          </Card>
        </Card>
      </div>

      {/* 版本历史侧边栏 */}
      <Drawer
        title={t('spec.versionHistory')}
        open={versionDrawerOpen}
        onClose={() => {
          setVersionDrawerOpen(false);
          setSelectedVersions([null, null]);
        }}
        size={screens.lg ? 'default' : 'large'}
        extra={
          <Button
            type="primary"
            icon={<DiffOutlined />}
            size="small"
            disabled={!selectedVersions[0] || !selectedVersions[1]}
            loading={versionDiff.isPending}
            onClick={handleDiff}
          >
            {t('spec.compareDiff')}
          </Button>
        }
      >
        <div className="mb-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {t('spec.selectTwoVersions')}
        </div>
        {selectedVersions[0] && (
          <div className="mb-3">
            <Tag color="blue">{t('spec.source')}: v{versionMap.get(selectedVersions[0])?.versionNumber || selectedVersions[0]}</Tag>
            {selectedVersions[1] && (
              <Tag color="green">{t('spec.target')}: v{versionMap.get(selectedVersions[1])?.versionNumber || selectedVersions[1]}</Tag>
            )}
            <Button type="link" size="small" onClick={() => setSelectedVersions([null, null])}>
              {t('common.reset')}
            </Button>
          </div>
        )}
        {loadingVersions ? (
          <div className="flex justify-center py-8"><Spin /></div>
        ) : (
          <List
            dataSource={(versions as SpecVersion[]) || []}
            renderItem={(version: SpecVersion) => {
              const isSelected = selectedVersions.includes(version.id);
              return (
                <List.Item
                  className="cursor-pointer rounded-lg px-3 py-3"
                  style={{
                    background: isSelected ? 'var(--color-primary-bg)' : 'transparent',
                    border: isSelected ? '1px solid var(--color-primary)' : '1px solid transparent',
                  }}
                  onClick={() => handleVersionSelect(version.id)}
                >
                  <div className="min-w-0 w-full">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Tag color="blue" className="!mr-0">v{version.versionNumber}</Tag>
                      <Text className="text-xs whitespace-nowrap" type="secondary">
                        {formatDateTime(version.createdAt)}
                      </Text>
                    </div>
                    <Paragraph
                      className="mb-1 text-xs"
                      ellipsis={{ rows: 2, tooltip: version.changeSummary || t('spec.noChangeSummary') }}
                    >
                      {version.changeSummary || t('spec.noChangeSummary')}
                    </Paragraph>
                    {version.createdBy && (
                      <Text
                        type="secondary"
                        className="block text-xs"
                        ellipsis={{ tooltip: `${t('common.createdBy')}: ${version.createdBy}` }}
                      >
                        {t('common.createdBy')}: {version.createdBy}
                      </Text>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </Drawer>

      {/* Diff 对比弹窗 */}
      <Modal
        title={t('spec.versionDiff')}
        open={diffModalOpen}
        onCancel={() => {
          setDiffModalOpen(false);
          setDiffResult(null);
        }}
        footer={null}
        width={900}
      >
        {renderDiffContent()}
      </Modal>
    </PageContainer>
  );
}

export default function SpecEditor() {
  const { id } = useParams<{ id: string }>();
  const { data: spec, isLoading } = useSpecDetail(id!);

  if (isLoading && !spec) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center" style={{ height: 400 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (spec?.lifecycleMode === 'workflow') {
    return <WorkflowWorkbench specId={id!} />;
  }

  return <LegacySpecEditor />;
}

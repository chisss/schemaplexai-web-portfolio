import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  LeftOutlined,
  MenuOutlined,
  ReloadOutlined,
  RocketOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntApp,
  Button,
  Drawer,
  Grid,
  Input,
  Segmented,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
} from 'antd';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import {
  useCreateSemanticVersion,
  usePublishSemanticVersion,
  useSemanticGraph,
  useSemanticModel,
  useSemanticVersion,
  useSemanticVersions,
  useUpdateSemanticNode,
  useValidateSemanticVersion,
} from '@/api/semantic';
import type {
  SemanticNodeUpdateDTO,
  SemanticValidationResult,
  SemanticVersion,
  SemanticVersionStatus,
} from '@/types/semantic';
import SemanticGraphCanvas from './components/SemanticGraphCanvas';
import SemanticInspector from './components/SemanticInspector';
import SemanticIssuePanel from './components/SemanticIssuePanel';
import SemanticNodePanel from './components/SemanticNodePanel';
import './semantic.css';

const statusColor: Record<SemanticVersionStatus, string> = {
  draft: 'blue',
  validating: 'processing',
  invalid: 'error',
  published: 'success',
  archived: 'default',
};

const selectInitialVersion = (versions: SemanticVersion[], requested?: string, active?: string) => {
  if (requested && versions.some((version) => version.id === requested)) return requested;
  const draft = versions.find((version) => version.status === 'draft' || version.status === 'invalid');
  return draft?.id ?? active ?? versions[0]?.id;
};

export default function SemanticWorkbench() {
  const { t } = useTranslation();
  const { message, modal } = AntApp.useApp();
  const navigate = useNavigate();
  const { modelId } = useParams<{ modelId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const screens = Grid.useBreakpoint();
  const compact = !screens.lg;
  const modelQuery = useSemanticModel(modelId);
  const versionsQuery = useSemanticVersions(modelId);
  const [manualVersionId, setManualVersionId] = useState<string>();
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [depth, setDepth] = useState<1 | 2>(2);
  const [keywordInput, setKeywordInput] = useState('');
  const [graphKeyword, setGraphKeyword] = useState<string>();
  const [focusNodeId, setFocusNodeId] = useState<string>();
  const [validationResult, setValidationResult] = useState<SemanticValidationResult>();
  const [commandRevision, setCommandRevision] = useState<number>();
  const [nodeDrawerOpen, setNodeDrawerOpen] = useState(false);
  const [inspectorDrawerOpen, setInspectorDrawerOpen] = useState(false);

  const selectedVersionId = useMemo(() => {
    const versions = versionsQuery.data ?? [];
    const requested = manualVersionId ?? searchParams.get('version') ?? undefined;
    return selectInitialVersion(versions, requested, modelQuery.data?.activeVersionId);
  }, [manualVersionId, modelQuery.data?.activeVersionId, searchParams, versionsQuery.data]);

  const versionQuery = useSemanticVersion(selectedVersionId);
  const graphQuery = useSemanticGraph(selectedVersionId, {
    keyword: graphKeyword,
    focusNodeId,
    depth,
    page: 1,
    size: 500,
  });
  const createVersion = useCreateSemanticVersion();
  const updateNode = useUpdateSemanticNode();
  const validateVersion = useValidateSemanticVersion();
  const publishVersion = usePublishSemanticVersion();
  const version = versionQuery.data ?? versionsQuery.data?.find((item) => item.id === selectedVersionId);
  const graph = graphQuery.data;
  const selectedNode = useMemo(
    () => graph?.nodes.find((node) => node.id === selectedNodeId),
    [graph?.nodes, selectedNodeId],
  );
  const editable = version?.status === 'draft' || version?.status === 'invalid';
  const effectiveRevision = commandRevision ?? validationResult?.revision ?? version?.revision ?? 0;

  const statusLabel = (status: SemanticVersionStatus) => t(`semantic.status.version.${status}`);

  const changeVersion = (versionId: string) => {
    setManualVersionId(versionId);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('version', versionId);
      return next;
    }, { replace: true });
    setSelectedNodeId(undefined);
    setFocusNodeId(undefined);
    setValidationResult(undefined);
    setCommandRevision(undefined);
  };

  const selectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    if (compact) setInspectorDrawerOpen(true);
  };

  const locateNode = (nodeId: string) => {
    setFocusNodeId(nodeId);
    setSelectedNodeId(nodeId);
    if (compact) setInspectorDrawerOpen(true);
  };

  const saveNode = async (nodeId: string, data: SemanticNodeUpdateDTO) => {
    if (!selectedVersionId) return;
    try {
      const response = await updateNode.mutateAsync({
        versionId: selectedVersionId,
        nodeId,
        data: { ...data, expectedRevision: effectiveRevision },
      });
      setCommandRevision(response.data.revision);
      setValidationResult(undefined);
      message.success(t('semantic.workbench.inspector.saveSuccess'));
    } catch {
      message.error(t('semantic.workbench.inspector.saveFailed'));
    }
  };

  const runValidation = async () => {
    if (!selectedVersionId || !version) return;
    try {
      const response = await validateVersion.mutateAsync({
        versionId: selectedVersionId,
        data: { expectedRevision: effectiveRevision },
      });
      setValidationResult(response.data);
      setCommandRevision(response.data.revision);
      if (response.data.valid) message.success(t('semantic.workbench.validationPassed'));
    } catch {
      message.error(t('semantic.workbench.validationFailed'));
    }
  };

  const confirmPublish = () => {
    if (!selectedVersionId || !version) return;
    modal.confirm({
      title: t('semantic.workbench.publishConfirmTitle'),
      content: t('semantic.workbench.publishConfirmDescription'),
      okText: t('semantic.workbench.publish'),
      onOk: async () => {
        try {
          await publishVersion.mutateAsync({
            versionId: selectedVersionId,
            data: { expectedRevision: effectiveRevision },
          });
          message.success(t('semantic.workbench.publishSuccess'));
        } catch {
          message.error(t('semantic.workbench.publishFailed'));
        }
      },
    });
  };

  const createDraft = async () => {
    if (!modelId) return;
    const response = await createVersion.mutateAsync({ modelId, data: {} });
    changeVersion(response.data.id);
    message.success(t('semantic.catalog.draftCreated'));
  };

  const nodePanel = (
    <SemanticNodePanel
      nodes={graph?.nodes ?? []}
      selectedNodeId={selectedNodeId}
      onSelect={selectNode}
    />
  );
  const inspector = (
    <SemanticInspector
      node={selectedNode}
      revision={effectiveRevision}
      editable={!!editable}
      saving={updateNode.isPending}
      onSave={saveNode}
    />
  );

  if (modelQuery.isLoading || versionsQuery.isLoading) {
    return <div className="semantic-page-loading"><Spin size="large" /></div>;
  }

  if (modelQuery.isError || versionsQuery.isError || !modelQuery.data) {
    return (
      <PageContainer title={t('semantic.workbench.title')} description={t('semantic.workbench.loadFailed')}>
        <Alert
          showIcon
          type="error"
          message={t('semantic.workbench.loadFailed')}
          action={<Button icon={<ReloadOutlined />} onClick={() => { void modelQuery.refetch(); void versionsQuery.refetch(); }}>{t('common.retry')}</Button>}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      className="semantic-workbench-page"
      title={modelQuery.data.name}
      description={`${modelQuery.data.domain} · ${modelQuery.data.description || t('semantic.workbench.description')}`}
      extra={(
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/data-management/semantic-models')}>
            {t('semantic.workbench.back')}
          </Button>
          <Button icon={<BranchesOutlined />} loading={createVersion.isPending} onClick={() => void createDraft()}>
            {t('semantic.catalog.newDraft')}
          </Button>
        </Space>
      )}
    >
      <div className="semantic-workbench-toolbar">
        <Space wrap>
          <Select
            className="semantic-version-select"
            value={selectedVersionId}
            placeholder={t('semantic.workbench.selectVersion')}
            options={(versionsQuery.data ?? []).map((item) => ({
              value: item.id,
              label: `v${item.versionNo} · ${statusLabel(item.status)}`,
            }))}
            onChange={changeVersion}
          />
          {version && <Tag color={statusColor[version.status]}>{statusLabel(version.status)}</Tag>}
          {version && <span className="semantic-revision">rev {version.revision}</span>}
        </Space>
        <Space wrap>
          {compact && (
            <>
              <Tooltip title={t('semantic.workbench.nodes.title')}><Button icon={<MenuOutlined />} onClick={() => setNodeDrawerOpen(true)} /></Tooltip>
              <Tooltip title={t('semantic.workbench.inspector.title')}><Button icon={<SettingOutlined />} onClick={() => setInspectorDrawerOpen(true)} /></Tooltip>
            </>
          )}
          <Button
            icon={<CheckCircleOutlined />}
            disabled={!editable || !version}
            loading={validateVersion.isPending}
            onClick={() => void runValidation()}
          >
            {t('semantic.workbench.validate')}
          </Button>
          <Button
            type="primary"
            icon={<RocketOutlined />}
            disabled={!editable || !version}
            loading={publishVersion.isPending}
            onClick={confirmPublish}
          >
            {t('semantic.workbench.publish')}
          </Button>
        </Space>
      </div>

      {!version ? (
        <div className="semantic-no-version">
          <BranchesOutlined />
          <strong>{t('semantic.workbench.noVersion')}</strong>
          <Button type="primary" icon={<BranchesOutlined />} onClick={() => void createDraft()}>{t('semantic.catalog.newDraft')}</Button>
        </div>
      ) : (
        <div className="semantic-workbench">
          {!compact && <aside className="semantic-workbench__nodes">{nodePanel}</aside>}
          <main className="semantic-workbench__main">
            <div className="semantic-graph-toolbar">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                value={keywordInput}
                placeholder={t('semantic.workbench.graph.searchPlaceholder')}
                onChange={(event) => setKeywordInput(event.target.value)}
                onPressEnter={() => { setGraphKeyword(keywordInput.trim() || undefined); setFocusNodeId(undefined); }}
              />
              <Button onClick={() => { setGraphKeyword(keywordInput.trim() || undefined); setFocusNodeId(undefined); }}>{t('common.search')}</Button>
              <Segmented
                value={depth}
                options={[
                  { label: t('semantic.workbench.graph.oneHop'), value: 1 },
                  { label: t('semantic.workbench.graph.twoHop'), value: 2 },
                ]}
                onChange={(value) => setDepth(value as 1 | 2)}
              />
              {focusNodeId && (
                <Button type="link" icon={<LeftOutlined />} onClick={() => setFocusNodeId(undefined)}>
                  {t('semantic.workbench.graph.showAll')}
                </Button>
              )}
            </div>
            {graphQuery.isError ? (
              <div className="semantic-graph-error">
                <Alert
                  showIcon
                  type="error"
                  message={t('semantic.workbench.graph.loadFailed')}
                  action={<Button icon={<ReloadOutlined />} onClick={() => void graphQuery.refetch()}>{t('common.retry')}</Button>}
                />
              </div>
            ) : (
              <SemanticGraphCanvas
                nodes={graph?.nodes ?? []}
                edges={graph?.edges ?? []}
                loading={graphQuery.isLoading}
                selectedNodeId={selectedNodeId}
                onSelectNode={selectNode}
              />
            )}
            {graph?.hasMore && <Alert banner type="warning" message={t('semantic.workbench.graph.truncated', { total: graph.totalNodes })} />}
            <SemanticIssuePanel
              result={validationResult}
              validating={validateVersion.isPending}
              onSelectNode={locateNode}
            />
          </main>
          {!compact && <aside className="semantic-workbench__inspector">{inspector}</aside>}
        </div>
      )}

      <Drawer
        title={t('semantic.workbench.nodes.title')}
        placement="left"
        size={340}
        styles={{ wrapper: { maxWidth: '88vw' } }}
        open={nodeDrawerOpen}
        onClose={() => setNodeDrawerOpen(false)}
      >
        {nodePanel}
      </Drawer>
      <Drawer
        title={t('semantic.workbench.inspector.title')}
        size={420}
        styles={{ wrapper: { maxWidth: '92vw' } }}
        open={inspectorDrawerOpen}
        onClose={() => setInspectorDrawerOpen(false)}
      >
        {inspector}
      </Drawer>
    </PageContainer>
  );
}

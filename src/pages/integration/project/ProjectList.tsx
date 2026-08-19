import { useState } from 'react';
import { Card, Button, Input, Select, Tag, Badge, Modal, message, Empty, Space, Tooltip, Pagination } from 'antd';
import {
  PlusOutlined, SearchOutlined, DeleteOutlined, SyncOutlined, BranchesOutlined, ApartmentOutlined,
  GithubOutlined, GitlabOutlined, FolderOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useWorkspaces, useDeleteWorkspace, useSyncWorkspace } from '@/api/workspace';
import type { Workspace, WorkspaceQueryDTO } from '@/types/integration';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDateTime } from '@/utils/date';

const WORKSPACE_STATUS_COLORS: Record<string, WorkspaceBadgeStatus> = {
  cloning: 'processing',
  ready: 'success',
  syncing: 'processing',
  error: 'error',
  archived: 'default',
};

type WorkspaceBadgeStatus = 'success' | 'processing' | 'default' | 'error' | 'warning';

function formatDiskUsage(diskUsageMb?: number) {
  if (diskUsageMb == null || Number.isNaN(diskUsageMb) || diskUsageMb < 0) {
    return '-';
  }
  if (diskUsageMb < 1024) {
    return `${diskUsageMb.toFixed(1)} MB`;
  }
  return `${(diskUsageMb / 1024).toFixed(2)} GB`;
}

/* 来源图标 */
const SourceLogo = ({ gitPlatform, size = 38 }: { gitPlatform?: string; size?: number }) => {
  const base: React.CSSProperties = {
    width: size, height: size, flexShrink: 0, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.55,
  };
  if (gitPlatform === 'github') {
    return <div style={{ ...base, background: '#24292e', color: '#fff' }}><GithubOutlined /></div>;
  }
  if (gitPlatform === 'gitlab') {
    return <div style={{ ...base, background: '#fc6d26', color: '#fff' }}><GitlabOutlined /></div>;
  }
  if (gitPlatform === 'gitee') {
    return (
      <div style={{ ...base, background: '#c71d23', color: '#fff', fontWeight: 700, fontSize: 13 }}>
        GE
      </div>
    );
  }
  return <div style={{ ...base, background: 'var(--color-primary)', color: '#fff' }}><FolderOutlined /></div>;
};

export default function ProjectList() {
  const { t } = useTranslation();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('integration:project:create');
  const canDelete = hasPermission('integration:project:delete');

  const statusMap: Record<string, { color: WorkspaceBadgeStatus; text: string }> = {
    cloning: { color: WORKSPACE_STATUS_COLORS.cloning, text: t('workspace.status.cloning') },
    ready: { color: WORKSPACE_STATUS_COLORS.ready, text: t('workspace.status.ready') },
    syncing: { color: WORKSPACE_STATUS_COLORS.syncing, text: t('workspace.status.syncing') },
    error: { color: WORKSPACE_STATUS_COLORS.error, text: t('workspace.status.error') },
    archived: { color: WORKSPACE_STATUS_COLORS.archived, text: t('workspace.status.archived') },
  };

  const sourceTypeLabel: Record<string, string> = {
    git: 'Git',
    local: t('workspace.sourceLocal'),
    manual: t('workspace.sourceManual'),
  };
  const scopeLabel: Record<string, string> = {
    PROJECT: t('workspace.scopeProject'),
    SYSTEM: t('workspace.scopeSystem'),
  };
  const retentionLabel: Record<string, string> = {
    retain: t('workspace.retentionRetain'),
    ephemeral: t('workspace.retentionEphemeral'),
  };

  const navigate = useNavigate();
  const [query, setQuery] = useState<WorkspaceQueryDTO>({ page: 1, size: 20 });
  const { data, isLoading } = useWorkspaces(query);
  const deleteMutation = useDeleteWorkspace();
  const syncMutation = useSyncWorkspace();

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: t('common.confirmDelete'),
      content: `${t('common.confirmDeleteContent')} ${name}?`,
      onOk: () => deleteMutation.mutateAsync(id).then(() => message.success(t('common.deleteSuccess'))),
    });
  };

  const handleSync = (id: string) => {
    syncMutation.mutateAsync(id)
      .then(() => message.success(t('workspace.syncSuccess')))
      .catch(() => message.error(t('workspace.syncFailed')));
  };

  const records = data?.records ?? [];

  return (
    <PageContainer
      title={t('workspace.workspaceManagement')}
      extra={
        <Space wrap size={[8, 8]}>
            <Button icon={<BranchesOutlined />} onClick={() => navigate('/project/branches')}>
              {t('workspace.branchManagement')}
            </Button>
            <Button icon={<ApartmentOutlined />} onClick={() => navigate('/project/branch-rules')}>
              {t('workspace.branchRuleManagement')}
            </Button>
          {canCreate && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/project/import')}>
                {t('workspace.import')}
              </Button>
          )}
        </Space>
      }
    >
      <Card variant="borderless" className="shadow-sm rounded-xl">
        {/* 搜索筛选栏 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
          <Input
            placeholder={t('common.search')}
            prefix={<SearchOutlined />}
            allowClear
            onChange={(e) => setQuery((q) => ({ ...q, keyword: e.target.value, page: 1 }))}
            style={{ width: 240 }}
          />
          <Select
            placeholder={t('workspace.sourceType')}
            allowClear
            onChange={(val) => setQuery((q) => ({ ...q, sourceType: val, page: 1 }))}
            style={{ width: 150 }}
            options={[
              { label: 'Git', value: 'git' },
              { label: t('workspace.sourceLocal'), value: 'local' },
              { label: t('workspace.sourceManual'), value: 'manual' },
            ]}
          />
          <Select
            placeholder={t('common.status')}
            allowClear
            onChange={(val) => setQuery((q) => ({ ...q, workspaceStatus: val, page: 1 }))}
            style={{ width: 150 }}
            options={Object.entries(statusMap).map(([value, { text }]) => ({ value, label: text }))}
          />
        </div>

        {/* 卡片网格 */}
        {isLoading || records.length > 0 ? (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
                gap: 16,
                alignItems: 'stretch',
              }}
            >
              {records.map((ws: Workspace) => {
              const st = statusMap[ws.workspaceStatus as string] || { color: 'default' as WorkspaceBadgeStatus, text: ws.workspaceStatus };
              return (
                <div key={ws.id} style={{ minWidth: 0, display: 'flex' }}>
                  <Card
                    hoverable
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid var(--color-border)', minWidth: 0 }}
                    styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
                    onClick={() => navigate(`/project/workspaces/${ws.id}`)}
                    actions={[
                      ...(ws.sourceType === 'git' ? [
                        <SyncOutlined key="sync" onClick={(e) => { e.stopPropagation(); handleSync(ws.id); }} />,
                      ] : []),
                      ...(canDelete ? [<DeleteOutlined key="delete" onClick={(e) => { e.stopPropagation(); handleDelete(ws.id, ws.name); }} />] : []),
                    ]}
                  >
                    {/* 标题区：Logo + 名称 + 来源 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <SourceLogo gitPlatform={ws.gitPlatform} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Tooltip title={ws.name}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ws.name}
                          </div>
                        </Tooltip>
                        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                          {sourceTypeLabel[ws.sourceType] || ws.sourceType}
                        </div>
                      </div>
                    </div>
                    {/* 状态 + 详细信息 — flex:1 撑满保证等高 */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Badge status={st.color} text={<span style={{ fontSize: 13 }}>{st.text}</span>} />
                        {ws.defaultBranch && (
                          <Tag style={{ fontSize: 11, margin: 0 }}>{ws.defaultBranch}</Tag>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Tag style={{ marginInlineEnd: 0 }}>
                          {scopeLabel[ws.workspaceScope || ''] || (ws.workspaceScope || t('common.noData'))}
                        </Tag>
                        <Tag style={{ marginInlineEnd: 0 }}>
                          {retentionLabel[ws.retentionPolicy || ''] || (ws.retentionPolicy || t('common.noData'))}
                        </Tag>
                      </div>
                      {ws.diskUsageMb != null && (
                        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                          {t('workspace.diskUsage')}: {formatDiskUsage(ws.diskUsageMb)}
                        </span>
                      )}
                      {ws.lastSyncAt && (
                        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', overflowWrap: 'anywhere' }}>
                          {t('workspace.lastSync')}: {formatDateTime(ws.lastSyncAt)}
                        </span>
                      )}
                    </div>
                  </Card>
                </div>
              );
              })}
            </div>
            {(data?.total || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <Pagination
                  current={query.page}
                  pageSize={query.size}
                  total={data?.total || 0}
                  showSizeChanger
                  showTotal={(total) => t('common.total', { total })}
                  onChange={(page, size) => setQuery((q) => ({ ...q, page, size }))}
                />
              </div>
            )}
          </>
        ) : (
          <Empty description={t('common.noData')} />
        )}
      </Card>
    </PageContainer>
  );
}

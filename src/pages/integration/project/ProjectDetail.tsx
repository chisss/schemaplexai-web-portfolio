import { useMemo, useState } from 'react';
import {
  Descriptions,
  Button,
  Space,
  Tag,
  Badge,
  Modal,
  Form,
  Input,
  message,
  Spin,
  Card,
  Row,
  Col,
  Typography,
  Tabs,
  List,
  Drawer,
  Empty,
} from 'antd';
import type { DescriptionsProps } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  BranchesOutlined,
  DownloadOutlined,
  FolderOpenOutlined,
  EyeOutlined,
  FileMarkdownOutlined,
  MergeOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import MarkdownPreview from '@/components/MarkdownPreview/MarkdownPreview';
import MergeRequestPanel from '@/pages/agent/components/MergeRequestPanel';
import {
  downloadWorkspaceFile,
  useWorkspaceArtifacts,
  useWorkspaceDetail,
  useWorkspaceFileContent,
  useWorkspaceFiles,
  useUpdateWorkspace,
  useDeleteWorkspace,
  useSyncWorkspace,
} from '@/api/workspace';
import { formatDateTime } from '@/utils/date';

const { TextArea } = Input;
const { Text } = Typography;
type DescriptionItem = NonNullable<DescriptionsProps['items']>[number];

const WORKSPACE_STATUS_COLORS: Record<string, string> = {
  cloning: 'processing',
  ready: 'success',
  syncing: 'processing',
  error: 'error',
  archived: 'default',
};

function formatDiskUsage(diskUsageMb?: number) {
  if (diskUsageMb == null || Number.isNaN(diskUsageMb) || diskUsageMb < 0) {
    return '-';
  }
  if (diskUsageMb < 1024) {
    return `${diskUsageMb.toFixed(1)} MB`;
  }
  return `${(diskUsageMb / 1024).toFixed(2)} GB`;
}

function normalizeDescriptionItems(items: DescriptionItem[]) {
  const normalized = items.map((item) => ({ ...item }));
  let usedColumns = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    const item = normalized[index];
    const span = Number(item.span ?? 1);
    if (span >= 2 && usedColumns === 1) {
      const previous = normalized[index - 1];
      if (previous && !previous.span) {
        previous.span = 2;
      }
      usedColumns = 0;
    }
    usedColumns += Number(normalized[index].span ?? 1);
    if (usedColumns >= 2) {
      usedColumns = 0;
    }
  }
  if (usedColumns === 1) {
    const last = normalized[normalized.length - 1];
    if (last && !last.span) {
      last.span = 2;
    }
  }
  return normalized;
}

export default function ProjectDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: ws, isLoading } = useWorkspaceDetail(id!);
  const { data: artifacts = [], isLoading: artifactsLoading } = useWorkspaceArtifacts(id!);
  const [currentPath, setCurrentPath] = useState('');
  const { data: files = [], isLoading: filesLoading } = useWorkspaceFiles(id!, currentPath);
  const [previewPath, setPreviewPath] = useState<string>();
  const { data: previewFile, isLoading: previewLoading } = useWorkspaceFileContent(id!, previewPath);
  const updateMutation = useUpdateWorkspace();
  const deleteMutation = useDeleteWorkspace();
  const syncMutation = useSyncWorkspace();
  const [editOpen, setEditOpen] = useState(false);
  const [form] = Form.useForm();

  const statusMap = {
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

  const parentPath = useMemo(() => {
    if (!currentPath) {
      return '';
    }
    const index = currentPath.lastIndexOf('/');
    return index >= 0 ? currentPath.slice(0, index) : '';
  }, [currentPath]);

  if (isLoading) {
    return <Spin size="large" className="flex justify-center mt-20" />;
  }
  if (!ws) {
    return null;
  }

  const st = statusMap[ws.workspaceStatus as keyof typeof statusMap] || { color: 'default', text: ws.workspaceStatus };
  const overviewItems: DescriptionItem[] = [
    {
      key: 'name',
      label: t('workspace.name'),
      children: ws.name,
    },
    {
      key: 'sourceType',
      label: t('workspace.sourceType'),
      children: <Tag>{sourceTypeLabel[ws.sourceType] || ws.sourceType}</Tag>,
    },
    {
      key: 'status',
      label: t('common.status'),
      children: <Badge status={st.color as any} text={st.text} />,
    },
    {
      key: 'createdAt',
      label: t('common.createdAt'),
      children: formatDateTime(ws.createdAt),
    },
    {
      key: 'workspaceScope',
      label: t('workspace.workspaceScope'),
      children: <Tag>{scopeLabel[ws.workspaceScope || ''] || (ws.workspaceScope || '-')}</Tag>,
    },
    {
      key: 'retentionPolicy',
      label: t('workspace.retentionPolicy'),
      children: <Tag>{retentionLabel[ws.retentionPolicy || ''] || (ws.retentionPolicy || '-')}</Tag>,
    },
    {
      key: 'accessMode',
      label: t('workspace.accessMode'),
      children: <Tag>{ws.accessMode || '-'}</Tag>,
    },
    {
      key: 'capabilities',
      label: t('workspace.capabilities'),
      children: (
        <Space wrap>
          <Tag color={ws.writeCapability === 'writable' ? 'green' : 'default'}>{ws.writeCapability || '-'}</Tag>
          <Tag color={ws.browseCapability === 'browsable' ? 'blue' : 'default'}>{ws.browseCapability || '-'}</Tag>
          <Tag color={ws.downloadCapability === 'downloadable' ? 'purple' : 'default'}>{ws.downloadCapability || '-'}</Tag>
        </Space>
      ),
    },
  ];

  if (ws.gitUrl) {
    overviewItems.push({
      key: 'gitUrl',
      label: t('workspace.gitUrl'),
      children: ws.gitUrl,
      span: 2,
    });
  }
  if (ws.gitPlatform) {
    overviewItems.push({
      key: 'gitPlatform',
      label: t('workspace.gitPlatform'),
      children: ws.gitPlatform,
    });
  }
  if (ws.defaultBranch) {
    overviewItems.push({
      key: 'defaultBranch',
      label: t('workspace.defaultBranch'),
      children: ws.defaultBranch,
    });
  }
  if (ws.localPath) {
    overviewItems.push({
      key: 'localPath',
      label: t('workspace.localPath'),
      children: <code>{ws.localPath}</code>,
      span: 2,
    });
  }
  overviewItems.push(
    {
      key: 'diskUsage',
      label: t('workspace.diskUsage'),
      children: (
        <Space orientation="vertical" size={0}>
          <span>{formatDiskUsage(ws.diskUsageMb)}</span>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('workspace.diskUsageRealtime')}
          </Text>
        </Space>
      ),
    },
    {
      key: 'lastSync',
      label: t('workspace.lastSync'),
      children: ws.lastSyncAt ? formatDateTime(ws.lastSyncAt) : '-',
    },
    {
      key: 'createdBy',
      label: t('common.createdBy'),
      children: ws.createdByName || '-',
    },
    {
      key: 'description',
      label: t('common.description'),
      children: ws.description || '-',
      span: 2,
    },
  );
  if (ws.errorMessage) {
    overviewItems.push({
      key: 'errorMessage',
      label: t('common.errorMessage'),
      children: <span style={{ color: 'var(--color-error)' }}>{ws.errorMessage}</span>,
      span: 2,
    });
  }
  const normalizedOverviewItems = normalizeDescriptionItems(overviewItems);

  const handleEdit = () => {
    form.setFieldsValue({
      name: ws.name,
      defaultBranch: ws.defaultBranch,
      description: ws.description,
    });
    setEditOpen(true);
  };

  const handleUpdate = async (values: any) => {
    await updateMutation.mutateAsync({ id: id!, data: values });
    message.success(t('common.updateSuccess'));
    setEditOpen(false);
  };

  const handleDelete = () => {
    Modal.confirm({
      title: t('common.confirmDelete'),
      content: `${t('common.confirmDeleteContent')} ${ws.name}?`,
      onOk: () => deleteMutation.mutateAsync(id!).then(() => {
        message.success(t('common.deleteSuccess'));
        navigate('/project/workspaces');
      }),
    });
  };

  const handleSync = () => {
    syncMutation.mutateAsync(id!).then(() => {
      message.success(t('workspace.syncSuccess'));
    }).catch(() => {
      message.error(t('workspace.syncFailed'));
    });
  };

  const handleOpenFile = async (item: any) => {
    if (item.directory) {
      setCurrentPath(item.path);
      return;
    }
    if (item.previewable) {
      setPreviewPath(item.path);
      return;
    }
    try {
      await downloadWorkspaceFile(id!, item.path);
    } catch {
      message.error(t('workspace.downloadFailed'));
    }
  };

  const overviewTab = (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card variant="borderless" className="shadow-sm">
          <Descriptions bordered column={2} items={normalizedOverviewItems} />
        </Card>
      </Col>
    </Row>
  );

  const filesTab = (
    <Card variant="borderless" className="shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Space>
          <Text strong>{t('workspace.currentPath')}</Text>
          <Tag>{currentPath || '/'}</Tag>
        </Space>
        <Button disabled={!currentPath} onClick={() => setCurrentPath(parentPath)}>
          {t('workspace.goParent')}
        </Button>
      </div>
      <List
        loading={filesLoading}
        dataSource={files}
        locale={{ emptyText: <Empty description={t('common.noData')} /> }}
        renderItem={(item) => (
          <List.Item
            actions={[
              item.directory ? (
                <Button type="link" icon={<FolderOpenOutlined />} onClick={() => setCurrentPath(item.path)}>
                  {t('workspace.openDirectory')}
                </Button>
              ) : null,
              item.previewable ? (
                <Button type="link" icon={<EyeOutlined />} onClick={() => setPreviewPath(item.path)}>
                  {t('workspace.previewFile')}
                </Button>
              ) : null,
              !item.directory ? (
                <Button type="link" icon={<DownloadOutlined />} onClick={() => downloadWorkspaceFile(id!, item.path)}>
                  {t('common.export')}
                </Button>
              ) : null,
            ].filter(Boolean)}
          >
            <List.Item.Meta
              avatar={item.directory ? <FolderOpenOutlined /> : <FileMarkdownOutlined />}
              title={
                <Button type="link" className="px-0" onClick={() => handleOpenFile(item)}>
                  {item.name}
                </Button>
              }
              description={`${item.path || '/'} ${item.modifiedAt ? `· ${formatDateTime(item.modifiedAt)}` : ''}`}
            />
            {!item.directory && <Text type="secondary">{typeof item.size === 'number' ? `${item.size} B` : '-'}</Text>}
          </List.Item>
        )}
      />
    </Card>
  );

  const artifactsTab = (
    <Card variant="borderless" className="shadow-sm">
      <List
        loading={artifactsLoading}
        dataSource={artifacts}
        locale={{ emptyText: <Empty description={t('artifact.empty')} /> }}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button key="view" type="link" onClick={() => navigate(`/artifacts/${item.id}`)}>
                {t('spec.viewArtifact')}
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <span>{item.title || item.name}</span>
                  <Tag>{item.artifactType}</Tag>
                </Space>
              }
              description={`${item.format || '-'} ${item.updatedAt ? `· ${formatDateTime(item.updatedAt)}` : ''}`}
            />
          </List.Item>
        )}
      />
    </Card>
  );

  return (
    <PageContainer
      title={ws.name}
      extra={(
        <Space>
          {ws.sourceType === 'git' && (
            <Button icon={<SyncOutlined />} onClick={handleSync} loading={syncMutation.isPending}>
              {t('workspace.sync')}
            </Button>
          )}
          <Button
            icon={<BranchesOutlined />}
            onClick={() => navigate(`/project/branches?workspaceId=${ws.id}`)}
          >
            {t('workspace.gotoBranchManagement')}
          </Button>
          <Button icon={<EditOutlined />} onClick={handleEdit}>{t('common.edit')}</Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>{t('common.delete')}</Button>
        </Space>
      )}
    >
      <Tabs
        size="large"
        items={[
          { key: 'overview', label: t('spec.overview'), children: overviewTab },
          { key: 'files', label: t('workspace.files'), children: filesTab },
          { key: 'artifacts', label: t('workspace.artifacts'), children: artifactsTab },
          {
            key: 'merge-request',
            label: (
              <Space size={4}>
                <MergeOutlined />
                {t('mergeRequest.title', { defaultValue: '合并请求' })}
              </Space>
            ),
            children: <MergeRequestPanel onCreateMr={() => message.info(t('mergeRequest.create', { defaultValue: '创建合并请求' }))} />,
          },
        ]}
      />

      <Modal
        title={t('common.edit')}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={updateMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item name="name" label={t('workspace.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="defaultBranch" label={t('workspace.defaultBranch')}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t('common.description')}>
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={previewFile?.name || t('workspace.previewFile')}
        open={!!previewPath}
        size="large"
        onClose={() => setPreviewPath(undefined)}
      >
        {previewLoading ? (
          <div className="flex items-center justify-center h-48">
            <Spin />
          </div>
        ) : previewFile?.content ? (
          previewFile.path?.endsWith('.md') || previewFile.path?.endsWith('.markdown') ? (
            <MarkdownPreview content={previewFile.content} />
          ) : (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{previewFile.content}</pre>
          )
        ) : (
          <Empty description={t('common.noData')} />
        )}
      </Drawer>
    </PageContainer>
  );
}

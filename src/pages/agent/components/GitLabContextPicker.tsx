import { useEffect, useMemo, useState } from 'react';
import {
  App as AntApp,
  Alert,
  Button,
  Empty,
  Input,
  Select,
  Space,
  Spin,
  Tree,
  Typography,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import { BranchesOutlined, FileOutlined, FolderOpenOutlined, PlusOutlined } from '@ant-design/icons';
import { fetchIntegrationRepositoryTree, useIntegrationRepositories, useIntegrations } from '@/api/integration';
import type { IntegrationRepository, IntegrationRepositoryTreeNode } from '@/types/integration';
import type { GitLabContextSourceConfig } from '@/types/agent';

interface GitLabContextPickerProps {
  loading?: boolean;
  onAdd: (payload: {
    title: string;
    sourceConfig: GitLabContextSourceConfig;
  }) => Promise<void> | void;
}

interface RepositoryTreeDataNode extends DataNode {
  path: string;
  nodeType: string;
}

function toTreeData(nodes: IntegrationRepositoryTreeNode[]): RepositoryTreeDataNode[] {
  return nodes.map((node) => ({
    key: node.path,
    path: node.path,
    nodeType: node.type,
    title: (
      <Space size={8}>
        {node.leaf ? <FileOutlined /> : <FolderOpenOutlined />}
        <span>{node.name}</span>
      </Space>
    ),
    isLeaf: node.leaf,
    children: node.leaf ? undefined : [],
  }));
}

function attachChildren(nodes: RepositoryTreeDataNode[], targetPath: string, children: RepositoryTreeDataNode[]): RepositoryTreeDataNode[] {
  return nodes.map((node) => {
    if (node.path === targetPath) {
      return {
        ...node,
        children,
      };
    }
    if (!node.children?.length) {
      return node;
    }
    return {
      ...node,
      children: attachChildren(node.children as RepositoryTreeDataNode[], targetPath, children),
    };
  });
}

function flattenTree(nodes: RepositoryTreeDataNode[]): RepositoryTreeDataNode[] {
  return nodes.flatMap((node) => [
    node,
    ...(node.children ? flattenTree(node.children as RepositoryTreeDataNode[]) : []),
  ]);
}

export default function GitLabContextPicker({ loading = false, onAdd }: GitLabContextPickerProps) {
  const { message } = AntApp.useApp();
  const integrationQuery = useMemo(() => ({
    page: 1,
    size: 100,
    integrationType: 'git',
    platform: 'gitlab',
    status: 'active',
  }), []);
  const { data: integrationPage, isLoading: integrationsLoading } = useIntegrations(integrationQuery);
  const integrations = integrationPage?.records ?? [];

  const [integrationId, setIntegrationId] = useState<string>();
  const [repositoryId, setRepositoryId] = useState<string>();
  const [branch, setBranch] = useState('');
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeData, setTreeData] = useState<RepositoryTreeDataNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

  const { data: repositories = [], isLoading: repositoriesLoading } = useIntegrationRepositories(integrationId || '');
  const selectedIntegration = integrations.find((item) => item.id === integrationId);
  const selectedRepository = repositories.find((item) => item.id === repositoryId);

  useEffect(() => {
    setRepositoryId(undefined);
    setBranch('');
    setTreeData([]);
    setCheckedKeys([]);
  }, [integrationId]);

  useEffect(() => {
    setTreeData([]);
    setCheckedKeys([]);
    if (selectedRepository) {
      setBranch(selectedRepository.defaultBranch || 'main');
    }
  }, [selectedRepository]);

  useEffect(() => {
    let cancelled = false;

    async function loadRootTree() {
      if (!integrationId || !repositoryId || !branch.trim()) {
        setTreeData([]);
        return;
      }
      setTreeLoading(true);
      try {
        const response = await fetchIntegrationRepositoryTree(integrationId, repositoryId, {
          ref: branch.trim(),
          path: '/',
        });
        if (!cancelled) {
          setTreeData(toTreeData(response.data ?? []));
        }
      } catch {
        if (!cancelled) {
          message.error('读取 GitLab 文件树失败');
          setTreeData([]);
        }
      } finally {
        if (!cancelled) {
          setTreeLoading(false);
        }
      }
    }

    void loadRootTree();

    return () => {
      cancelled = true;
    };
  }, [branch, integrationId, message, repositoryId]);

  const handleLoadData = async (treeNode: DataNode) => {
    const node = treeNode as RepositoryTreeDataNode;
    if (node.isLeaf || !integrationId || !repositoryId || !branch.trim()) {
      return;
    }
    if (Array.isArray(node.children) && node.children.length > 0) {
      return;
    }

    try {
      const response = await fetchIntegrationRepositoryTree(integrationId, repositoryId, {
        ref: branch.trim(),
        path: node.path,
      });
      const children = toTreeData(response.data ?? []);
      setTreeData((current) => attachChildren(current, node.path, children));
    } catch {
      message.error(`读取目录 ${node.path} 失败`);
    }
  };

  const handleAddBinding = async () => {
    if (!integrationId || !selectedIntegration) {
      message.warning('请先选择 GitLab 集成');
      return;
    }
    if (!repositoryId || !selectedRepository) {
      message.warning('请先选择仓库');
      return;
    }
    if (!branch.trim()) {
      message.warning('请填写分支名称');
      return;
    }
    if (checkedKeys.length === 0) {
      message.warning('请至少勾选一个目录或文件');
      return;
    }

    const checkedPathSet = new Set(checkedKeys.map((item) => String(item)));
    const selectedPaths = flattenTree(treeData)
      .filter((node) => checkedPathSet.has(node.path))
      .map((node) => ({
        path: node.path,
        type: node.nodeType,
      }));

    await onAdd({
      title: `${selectedRepository.fullName} @ ${branch.trim()}`,
      sourceConfig: {
        integrationId,
        integrationName: selectedIntegration.name,
        repositoryId,
        repositoryName: selectedRepository.name,
        repositoryFullName: selectedRepository.fullName,
        defaultBranch: selectedRepository.defaultBranch,
        branch: branch.trim(),
        paths: selectedPaths,
      },
    });
    setCheckedKeys([]);
  };

  if (integrationsLoading) {
    return <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>;
  }

  if (integrations.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="当前租户还没有可用的 GitLab 集成，请先在集成管理中配置并激活 GitLab。"
      />
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Alert
        type="info"
        showIcon
        message="GitLab 上下文会保存仓库、分支和所选路径，运行时由 Agent 按需读取。"
      />

      <div>
        <Typography.Text strong>GitLab 集成</Typography.Text>
        <Select
          style={{ width: '100%', marginTop: 8 }}
          placeholder="选择 GitLab 集成"
          value={integrationId}
          onChange={setIntegrationId}
          options={integrations.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
        />
      </div>

      <div>
        <Typography.Text strong>仓库</Typography.Text>
        <Select
          style={{ width: '100%', marginTop: 8 }}
          placeholder="选择仓库"
          loading={repositoriesLoading}
          value={repositoryId}
          onChange={setRepositoryId}
          disabled={!integrationId}
          options={repositories.map((item: IntegrationRepository) => ({
            value: item.id,
            label: item.fullName,
          }))}
        />
      </div>

      <div>
        <Typography.Text strong>分支</Typography.Text>
        <Input
          style={{ marginTop: 8 }}
          prefix={<BranchesOutlined />}
          placeholder="例如：main"
          value={branch}
          onChange={(event) => setBranch(event.target.value)}
          disabled={!repositoryId}
        />
      </div>

      <div>
        <Typography.Text strong>文件树</Typography.Text>
        <div style={{ marginTop: 8, border: '1px solid var(--color-border)', borderRadius: 8, padding: 12, minHeight: 240, background: 'var(--color-bg-container)' }}>
          {treeLoading ? (
            <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
          ) : treeData.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="选择仓库和分支后显示文件树" />
          ) : (
            <Tree
              checkable
              selectable={false}
              treeData={treeData}
              checkedKeys={checkedKeys}
              onCheck={(keys) => setCheckedKeys(keys as string[])}
              loadData={handleLoadData}
            />
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Text type="secondary">
          已选择 {checkedKeys.length} 个目录/文件
        </Typography.Text>
        <Button
          type="primary"
          ghost
          icon={<PlusOutlined />}
          loading={loading}
          onClick={() => void handleAddBinding()}
        >
          添加 GitLab 绑定
        </Button>
      </div>
    </Space>
  );
}

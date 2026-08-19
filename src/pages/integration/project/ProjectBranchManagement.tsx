import { useMemo, useState } from 'react';
import { Badge, Button, Card, Input, Select, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { ReloadOutlined, SearchOutlined, DiffOutlined } from '@ant-design/icons';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useWorkspaceBranchDiff, useWorkspaceBranchPage, useWorkspaces } from '@/api/workspace';
import type { WorkspaceBranch, WorkspaceBranchQueryDTO, WorkspaceBranchDiff } from '@/types/integration';
import BranchDiffDrawer from './BranchDiffDrawer';
import { formatDateTime } from '@/utils/date';

const { Text } = Typography;

const INLINE_ELLIPSIS_STYLE = {
  display: 'inline-block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  verticalAlign: 'bottom',
} as const;

function summaryValue(summary: Record<string, unknown> | undefined, key: string) {
  const raw = summary?.[key];
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

interface DiffQuery {
  workspaceId: string;
  sourceBranch: string;
  targetBranch?: string;
}

export default function ProjectBranchManagement() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const defaultWorkspaceId = searchParams.get('workspaceId') || undefined;

  const [workspaceId, setWorkspaceId] = useState<string | undefined>(defaultWorkspaceId);
  const [requirementNo, setRequirementNo] = useState('');
  const [branchName, setBranchName] = useState('');
  const [query, setQuery] = useState<WorkspaceBranchQueryDTO>({
    page: 1,
    size: 20,
    workspaceId: defaultWorkspaceId,
  });

  const { data: workspacePage } = useWorkspaces({ page: 1, size: 200 });
  const { data, isLoading, refetch, isFetching } = useWorkspaceBranchPage(query, 20000);
  const diffMutation = useWorkspaceBranchDiff();
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffData, setDiffData] = useState<WorkspaceBranchDiff | undefined>(undefined);
  const [diffError, setDiffError] = useState('');
  const [diffQuery, setDiffQuery] = useState<DiffQuery | undefined>(undefined);
  const { data: diffBranchPage } = useWorkspaceBranchPage({
    page: 1,
    size: 200,
    workspaceId: diffQuery?.workspaceId,
  }, undefined, diffOpen && !!diffQuery?.workspaceId);

  const workspaceOptions = (workspacePage?.records || []).map((item) => ({
    label: item.name,
    value: item.id,
  }));
  const branchOptions = useMemo(() => {
    const uniqueNames = Array.from(new Set((diffBranchPage?.records || []).map((item) => item.branchName)));
    return uniqueNames.map((branch) => ({
      label: branch,
      value: branch,
    }));
  }, [diffBranchPage?.records]);

  const doSearch = () => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      workspaceId,
      requirementNo: requirementNo.trim() || undefined,
      branchName: branchName.trim() || undefined,
    }));
  };

  const loadDiff = async (params: DiffQuery) => {
    setDiffQuery(params);
    setDiffOpen(true);
    setDiffError('');
    setDiffData(undefined);
    try {
      const res = await diffMutation.mutateAsync(params);
      setDiffData(res.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('workspace.loadDiffFailed');
      setDiffError(message);
    }
  };

  const openDiff = async (record: WorkspaceBranch) => {
    await loadDiff({
      workspaceId: record.workspaceId,
      sourceBranch: record.branchName,
      targetBranch: record.targetBranch,
    });
  };

  return (
    <PageContainer
      title={t('workspace.branchManagement')}
      extra={(
        <Space>
          <Badge
            status={isFetching ? 'processing' : 'success'}
            text={isFetching ? t('workspace.branchSyncing') : t('workspace.branchSynced')}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            {t('common.refresh')}
          </Button>
        </Space>
      )}
    >
      <Card variant="borderless" className="shadow-sm rounded-xl">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <Select
            allowClear
            showSearch
            style={{ width: 260 }}
            placeholder={t('workspace.selectWorkspace')}
            options={workspaceOptions}
            value={workspaceId}
            onChange={(val) => setWorkspaceId(val)}
            filterOption={(input, option) =>
              String(option?.label || '').toLowerCase().includes(input.toLowerCase())
            }
          />
          <Input
            style={{ width: 220 }}
            placeholder={t('workspace.requirementNoPlaceholder')}
            value={requirementNo}
            onChange={(e) => setRequirementNo(e.target.value)}
            onPressEnter={doSearch}
          />
          <Input
            style={{ width: 220 }}
            placeholder={t('workspace.branchKeywordPlaceholder')}
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            onPressEnter={doSearch}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={doSearch}>
            {t('common.search')}
          </Button>
        </div>

        <Table<WorkspaceBranch>
          rowKey="id"
          loading={isLoading}
          dataSource={data?.records || []}
          scroll={{ x: 1550 }}
          columns={[
            {
              title: t('workspace.name'),
              dataIndex: 'workspaceName',
              width: 200,
              fixed: 'left',
              render: (_, record) => (
                <Link to={`/project/workspaces/${record.workspaceId}`}>
                  {record.workspaceName || record.workspaceId}
                </Link>
              ),
            },
            {
              title: t('workspace.branchName'),
              dataIndex: 'branchName',
              width: 300,
              render: (val, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <Tooltip title={val}>
                    <Tag
                      color={record.isCurrent ? 'blue' : 'default'}
                      style={{ maxWidth: 230, marginInlineEnd: 0 }}
                    >
                      <span style={{ ...INLINE_ELLIPSIS_STYLE, maxWidth: '100%' }}>{val}</span>
                    </Tag>
                  </Tooltip>
                  {record.isCurrent && <Tag color="blue">{t('workspace.current')}</Tag>}
                </div>
              ),
            },
            {
              title: t('workspace.requirementNo'),
              dataIndex: 'requirementNo',
              width: 200,
              render: (val) => (val ? (
                <Tooltip title={val}>
                  <Tag color="purple" style={{ maxWidth: 170, marginInlineEnd: 0 }}>
                    <span style={{ ...INLINE_ELLIPSIS_STYLE, maxWidth: '100%' }}>{val}</span>
                  </Tag>
                </Tooltip>
              ) : '-'),
            },
            {
              title: t('workspace.targetBranch'),
              dataIndex: 'targetBranch',
              width: 140,
              render: (val) => val || '-',
            },
            {
              title: 'Ahead/Behind',
              width: 150,
              render: (_, record) => (
                <Space>
                  <Text style={{ color: '#00B42A' }}>+{record.aheadCount ?? 0}</Text>
                  <Text style={{ color: '#F53F3F' }}>-{record.behindCount ?? 0}</Text>
                </Space>
              ),
            },
            {
              title: t('workspace.diffSummary'),
              width: 220,
              render: (_, record) => (
                <Space>
                  <Tag>{t('workspace.changedFiles')}: {summaryValue(record.diffSummary, 'changedFileCount')}</Tag>
                  <Tag color="green">+{summaryValue(record.diffSummary, 'additions')}</Tag>
                  <Tag color="red">-{summaryValue(record.diffSummary, 'deletions')}</Tag>
                </Space>
              ),
            },
            {
              title: t('common.status'),
              dataIndex: 'branchStatus',
              width: 120,
              render: (val) => <Tag color={val === 'active' ? 'success' : 'default'}>{val || '-'}</Tag>,
            },
            {
              title: t('workspace.lastSync'),
              dataIndex: 'lastSyncedAt',
              width: 190,
              render: (val) => (val ? formatDateTime(val) : '-'),
            },
            {
              title: t('common.actions'),
              key: 'action',
              width: 120,
              fixed: 'right',
              render: (_, record) => (
                <Button
                  type="link"
                  icon={<DiffOutlined />}
                  onClick={() => openDiff(record)}
                >
                  {t('workspace.viewDiff')}
                </Button>
              ),
            },
          ]}
          pagination={{
            current: query.page,
            pageSize: query.size,
            total: data?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => t('common.total', { total }),
            onChange: (page, size) => {
              setQuery((prev) => ({ ...prev, page, size }));
            },
          }}
        />
      </Card>

      <BranchDiffDrawer
        open={diffOpen}
        onClose={() => setDiffOpen(false)}
        loading={diffMutation.isPending}
        diff={diffData}
        errorMessage={diffError}
        branchOptions={branchOptions}
        selectedSourceBranch={diffQuery?.sourceBranch}
        selectedTargetBranch={diffQuery?.targetBranch}
        onCompare={(sourceBranch, targetBranch) => {
          if (!diffQuery?.workspaceId) {
            return;
          }
          void loadDiff({
            workspaceId: diffQuery.workspaceId,
            sourceBranch,
            targetBranch,
          });
        }}
      />
    </PageContainer>
  );
}

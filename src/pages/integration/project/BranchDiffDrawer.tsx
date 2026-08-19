import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Collapse, Descriptions, Drawer, Empty, Select, Space, Spin, Statistic, Tag, Typography } from 'antd';
import type { WorkspaceBranchDiff } from '@/types/integration';

const { Text } = Typography;

interface BranchDiffDrawerProps {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  diff?: WorkspaceBranchDiff;
  errorMessage?: string;
  branchOptions?: Array<{ label: string; value: string }>;
  selectedSourceBranch?: string;
  selectedTargetBranch?: string;
  onCompare?: (sourceBranch: string, targetBranch?: string) => void;
}

export default function BranchDiffDrawer(props: BranchDiffDrawerProps) {
  const {
    open,
    onClose,
    loading,
    diff,
    errorMessage,
    branchOptions = [],
    selectedSourceBranch,
    selectedTargetBranch,
    onCompare,
  } = props;
  const files = diff?.files || [];
  const [draftSourceBranch, setDraftSourceBranch] = useState<string | undefined>(selectedSourceBranch);
  const [draftTargetBranch, setDraftTargetBranch] = useState<string | undefined>(selectedTargetBranch);

  useEffect(() => {
    queueMicrotask(() => {
      setDraftSourceBranch(selectedSourceBranch);
      setDraftTargetBranch(selectedTargetBranch);
    });
  }, [selectedSourceBranch, selectedTargetBranch, open]);

  const selectableTargetOptions = useMemo(
    () => branchOptions.filter((item) => item.value !== draftSourceBranch),
    [branchOptions, draftSourceBranch],
  );

  return (
    <Drawer
      title={`${draftSourceBranch || diff?.sourceBranch || '-'} -> ${draftTargetBranch || diff?.targetBranch || '-'}`}
      width="78vw"
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      <Spin spinning={!!loading}>
        {errorMessage && (
          <Alert
            type="error"
            showIcon
            message={errorMessage}
            style={{ marginBottom: 16 }}
          />
        )}

        {(branchOptions.length > 0 || draftSourceBranch) && (
          <Card style={{ marginBottom: 16 }}>
            <Space align="end" wrap style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space wrap>
                <div>
                  <div style={{ marginBottom: 6, color: 'var(--color-text-secondary)', fontSize: 12 }}>源分支</div>
                  <Select
                    showSearch
                    style={{ width: 240 }}
                    value={draftSourceBranch}
                    options={branchOptions}
                    onChange={(value) => {
                      setDraftSourceBranch(value);
                      if (value === draftTargetBranch) {
                        setDraftTargetBranch(undefined);
                      }
                    }}
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 6, color: 'var(--color-text-secondary)', fontSize: 12 }}>目标分支</div>
                  <Select
                    showSearch
                    allowClear
                    style={{ width: 240 }}
                    value={draftTargetBranch}
                    options={selectableTargetOptions}
                    onChange={(value) => setDraftTargetBranch(value)}
                    placeholder="选择要对比的目标分支"
                  />
                </div>
              </Space>
              <Button
                type="primary"
                onClick={() => draftSourceBranch && onCompare?.(draftSourceBranch, draftTargetBranch)}
                disabled={!draftSourceBranch || !draftTargetBranch || draftSourceBranch === draftTargetBranch}
                loading={!!loading}
              >
                切换对比
              </Button>
            </Space>
          </Card>
        )}

        {diff ? (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Workspace">{diff.workspaceName || diff.workspaceId}</Descriptions.Item>
              <Descriptions.Item label="Changed Files">{diff.changedFileCount ?? 0}</Descriptions.Item>
              <Descriptions.Item label="Ahead">
                <Badge color="#00B42A" text={String(diff.aheadCount ?? 0)} />
              </Descriptions.Item>
              <Descriptions.Item label="Behind">
                <Badge color="#F53F3F" text={String(diff.behindCount ?? 0)} />
              </Descriptions.Item>
            </Descriptions>

            <Card>
              <Space size="large" wrap>
                <Statistic title="Additions" value={diff.additions ?? 0} valueStyle={{ color: '#00B42A' }} />
                <Statistic title="Deletions" value={diff.deletions ?? 0} valueStyle={{ color: '#F53F3F' }} />
              </Space>
            </Card>

            {files.length > 0 ? (
              <Collapse
                items={files.map((file) => ({
                  key: file.filePath,
                  label: (
                    <Space>
                      <Text strong style={{ wordBreak: 'break-all' }}>{file.filePath}</Text>
                      <Tag>{file.changeType || 'MODIFY'}</Tag>
                      <Tag color="green">+{file.additions ?? 0}</Tag>
                      <Tag color="red">-{file.deletions ?? 0}</Tag>
                    </Space>
                  ),
                  children: (
                    file.patch ? (
                      <pre
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          maxHeight: 360,
                          overflow: 'auto',
                          margin: 0,
                          padding: 12,
                          background: '#1D1E20',
                          color: '#e2e8f0',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      >
                        {file.patch}
                      </pre>
                    ) : (
                      <Empty description="该文件无可展示 patch" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )
                  ),
                }))}
              />
            ) : (
              <Empty description="暂无变更文件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Space>
        ) : (
          <Empty description="请选择分支查看 diff" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Spin>
    </Drawer>
  );
}

/**
 * 合并请求面板组件
 * 展示 MR 状态、冲突文件和 Diff 视图
 */
import { Card, Table, Tag, Space, Typography, Button, Tabs, Alert } from 'antd';
import {
  MergeOutlined,
  ExclamationCircleFilled,
  CheckCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

interface MergeRequest {
  requestId: string;
  mrUrl?: string;
  sourceBranch: string;
  targetBranch: string;
  title: string;
  status: 'opened' | 'merged' | 'closed';
  hasConflicts: boolean;
  conflictFiles?: string[];
  createdAt: string;
  updatedAt: string;
}

interface MergeRequestPanelProps {
  mergeRequest?: MergeRequest;
  diffContent?: string;
  onCreateMr?: () => void;
  onViewMr?: () => void;
  onMerge?: () => void;
  onClose?: () => void;
  loading?: boolean;
}

export default function MergeRequestPanel({
  mergeRequest,
  diffContent,
  onCreateMr,
  onViewMr,
  onMerge,
  onClose,
  loading,
}: MergeRequestPanelProps) {
  const { t } = useTranslation();

  const getStatusConfig = (status: MergeRequest['status']) => {
    const configMap = {
      opened: {
        color: 'processing',
        icon: <MergeOutlined />,
        text: t('mergeRequest.statusOpened'),
      },
      merged: {
        color: 'success',
        icon: <CheckCircleFilled />,
        text: t('mergeRequest.statusMerged'),
      },
      closed: {
        color: 'default',
        icon: <CloseCircleFilled />,
        text: t('mergeRequest.statusClosed'),
      },
    };
    return configMap[status];
  };

  const conflictColumns = [
    {
      title: t('mergeRequest.conflictFile'),
      dataIndex: 'file',
      key: 'file',
      render: (file: string) => <Text code>{file}</Text>,
    },
  ];

  const renderMrInfo = () => {
    if (!mergeRequest) return null;

    const statusConfig = getStatusConfig(mergeRequest.status);

    return (
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Space>
          {statusConfig.icon}
          <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
        </Space>

        <Text strong>{mergeRequest.title}</Text>

        <Space>
          <Text type="secondary">
            {mergeRequest.sourceBranch} → {mergeRequest.targetBranch}
          </Text>
        </Space>

        {mergeRequest.hasConflicts && (
          <Alert
            type="warning"
            message={t('mergeRequest.hasConflicts')}
            icon={<ExclamationCircleFilled />}
            showIcon
          />
        )}

        {mergeRequest.conflictFiles && mergeRequest.conflictFiles.length > 0 && (
          <Table
            dataSource={mergeRequest.conflictFiles.map((file) => ({ file, key: file }))}
            columns={conflictColumns}
            size="small"
            pagination={false}
            title={() => t('mergeRequest.conflictFiles')}
          />
        )}
      </Space>
    );
  };

  const renderDiffView = () => {
    if (!diffContent) return null;
    return (
      <pre style={{
        background: '#f5f5f5',
        padding: 16,
        borderRadius: 4,
        overflow: 'auto',
        maxHeight: 400,
        fontSize: 12,
      }}>
        {diffContent}
      </pre>
    );
  };

  const renderActions = () => {
    if (!mergeRequest) {
      return (
        <Button type="primary" onClick={onCreateMr} loading={loading}>
          {t('mergeRequest.create')}
        </Button>
      );
    }

    return (
      <Space>
        {mergeRequest.mrUrl && (
          <Button onClick={onViewMr}>{t('mergeRequest.viewOnRemote')}</Button>
        )}
        {mergeRequest.status === 'opened' && !mergeRequest.hasConflicts && (
          <Button type="primary" onClick={onMerge} loading={loading}>
            {t('mergeRequest.merge')}
          </Button>
        )}
        {mergeRequest.status === 'opened' && (
          <Button onClick={onClose}>{t('mergeRequest.close')}</Button>
        )}
      </Space>
    );
  };

  return (
    <Card
      title={
        <Space>
          <MergeOutlined />
          <Title level={5} style={{ margin: 0 }}>
            {t('mergeRequest.title')}
          </Title>
        </Space>
      }
      extra={renderActions()}
    >
      <Tabs
        items={[
          {
            key: 'info',
            label: t('mergeRequest.tabInfo'),
            children: renderMrInfo(),
          },
          {
            key: 'diff',
            label: t('mergeRequest.tabDiff'),
            children: renderDiffView(),
            disabled: !diffContent,
          },
        ]}
      />
    </Card>
  );
}

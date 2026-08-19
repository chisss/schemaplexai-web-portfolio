/**
 * 工作空间指示器组件
 * 显示当前分支、会话详情和过期警告
 */
import { Tag, Tooltip, Space, Typography } from 'antd';
import {
  BranchesOutlined,
  ClockCircleFilled,
  WarningFilled,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface WorkspaceSession {
  sessionId: string;
  branchName: string;
  worktreePath: string;
  userId: string;
  userName?: string;
  executionId?: string;
  status: 'active' | 'closed' | 'cleaned';
  expireAt?: string;
  createdAt: string;
}

interface WorkspaceIndicatorProps {
  session: WorkspaceSession;
  /** 是否即将过期（< 5分钟） */
  expiringSoon?: boolean;
  onBranchSwitch?: () => void;
  onViewSession?: () => void;
}

export default function WorkspaceIndicator({
  session,
  expiringSoon,
  onViewSession,
}: WorkspaceIndicatorProps) {
  const { t } = useTranslation();

  const formatExpireTime = (expireAt?: string) => {
    if (!expireAt) return null;
    const expireDate = new Date(expireAt);
    const now = new Date();
    const diffMs = expireDate.getTime() - now.getTime();
    if (diffMs <= 0) return t('workspace.expired');
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 60) return `${diffMinutes} ${t('common.minutesLeft')}`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours} ${t('common.hoursLeft')}`;
  };

  const tooltipContent = (
    <Space direction="vertical" size={4}>
      <Text>{t('workspace.sessionId')}: {session.sessionId}</Text>
      {session.executionId && (
        <Text>{t('workspace.executionId')}: {session.executionId}</Text>
      )}
      {session.worktreePath && (
        <Text type="secondary">{session.worktreePath}</Text>
      )}
      <Text type="secondary">
        {t('workspace.createdAt')}: {session.createdAt}
      </Text>
      {session.expireAt && (
        <Text type="secondary">
          {t('workspace.expireAt')}: {formatExpireTime(session.expireAt)}
        </Text>
      )}
    </Space>
  );

  return (
    <Tooltip title={tooltipContent}>
      <Space
        onClick={onViewSession}
        style={{ cursor: onViewSession ? 'pointer' : 'default' }}
      >
        <BranchesOutlined />
        <Tag color="blue">{session.branchName}</Tag>
        {expiringSoon && (
          <Tooltip title={t('workspace.expiringSoonTip')}>
            <WarningFilled style={{ color: '#FF7D00' }} />
          </Tooltip>
        )}
        {session.expireAt && !expiringSoon && (
          <Space size={4}>
            <ClockCircleFilled style={{ color: '#64748b', fontSize: 12 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatExpireTime(session.expireAt)}
            </Text>
          </Space>
        )}
      </Space>
    </Tooltip>
  );
}

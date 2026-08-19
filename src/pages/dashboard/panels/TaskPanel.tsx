import { Skeleton } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import EmptyState from '@/components/EmptyState/EmptyState';
import type { TaskPanel as TaskPanelData } from '@/types/homepage';
import InProgressList from './task/InProgressList';
import BlockedList from './task/BlockedList';
import PendingApprovalList from './task/PendingApprovalList';
import QuickEntryGrid from './task/QuickEntryGrid';

interface Props {
  data?: TaskPanelData;
  isLoading: boolean;
}

export default function TaskPanel({ data, isLoading }: Props) {
  const navigate = useNavigate();

  if (isLoading && !data) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  const isEmpty =
    !data ||
    (!data.inProgressTasks.length &&
      !data.blockedTasks.length &&
      !data.pendingApprovals.length);

  if (isEmpty) {
    return (
      <EmptyState
        icon={<RocketOutlined />}
        title="当前没有进行中的任务"
        description="你可以从下方快捷入口开始"
        actions={[
          { label: '创建 Agent', onClick: () => navigate('/agent/create') },
          { label: '创建工作流', onClick: () => navigate('/workflow/create') },
        ]}
      />
    );
  }

  return (
    <>
      <PendingApprovalList items={data.pendingApprovals} isLoading={isLoading} />
      <InProgressList items={data.inProgressTasks} isLoading={isLoading} />
      <BlockedList items={data.blockedTasks} isLoading={isLoading} />
      <QuickEntryGrid entries={data.quickEntries} />
    </>
  );
}

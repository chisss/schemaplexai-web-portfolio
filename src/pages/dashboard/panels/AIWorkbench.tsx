import { Skeleton } from 'antd';
import type { HomepageAggregate } from '@/types/homepage';
import ContextSummaryCard from './ai/ContextSummaryCard';
import RecommendedActions from './ai/RecommendedActions';
import RecentContextList from './ai/RecentContextList';
import AIChatAssistant from '../components/AIChatAssistant';

interface Props {
  data?: HomepageAggregate;
  isLoading: boolean;
}

export default function AIWorkbench({ data, isLoading }: Props) {
  if (isLoading && !data) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  return (
    <>
      <ContextSummaryCard summary={data?.contextSummary} />
      <RecommendedActions actions={data?.actions ?? []} />
      <RecentContextList items={data?.taskPanel?.inProgressTasks ?? []} />
      <AIChatAssistant />
    </>
  );
}

import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useActiveAgents } from '@/api/monitor';
import AgentTracePanel from './AgentTracePanel';

export default function AgentTracePage() {
  const { t } = useTranslation();
  const { data: activeAgents, isLoading } = useActiveAgents();

  return (
    <PageContainer title={t('monitor.traceCenter')}>
      <Spin spinning={isLoading}>
        <AgentTracePanel agents={activeAgents || []} />
      </Spin>
    </PageContainer>
  );
}

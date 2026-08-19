import { Skeleton } from 'antd';
import type { SituationPanel as SituationPanelData } from '@/types/homepage';
import SystemHealthCard from './situation/SystemHealthCard';
import RiskAlertList from './situation/RiskAlertList';
import BlockChainView from './situation/BlockChainView';
import AuditTrailFeed from './situation/AuditTrailFeed';
import AnomalyTrendMini from './situation/AnomalyTrendMini';

interface Props {
  data?: SituationPanelData;
  isLoading: boolean;
  compact?: boolean;
}

export default function SituationPanel({ data, isLoading, compact }: Props) {
  if (isLoading && !data) {
    return <Skeleton active paragraph={{ rows: compact ? 4 : 8 }} />;
  }

  if (!data) return null;

  if (compact) {
    return (
      <>
        <SystemHealthCard health={data.systemHealth} />
        {data.riskAlerts.length > 0 && <RiskAlertList alerts={data.riskAlerts.slice(0, 2)} />}
      </>
    );
  }

  return (
    <>
      <SystemHealthCard health={data.systemHealth} />
      <RiskAlertList alerts={data.riskAlerts} />
      <BlockChainView chains={data.blockChains} />
      <AuditTrailFeed trails={data.recentAuditTrails} />
      <AnomalyTrendMini trend={data.anomalyTrend} />
    </>
  );
}

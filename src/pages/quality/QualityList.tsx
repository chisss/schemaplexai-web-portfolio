import { useMemo } from 'react';
import { Card, Tabs } from 'antd';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/PageContainer/PageContainer';
import QualityOverview from './QualityOverview';
import DeviationList from './DeviationList';
import IntentDefectList from './IntentDefectList';
import CrossReviewList from './CrossReviewList';
import QualityRuleConfig from './QualityRuleConfig';
import QualityTaskMonitor from './QualityTaskMonitor';

export default function QualityList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => {
    const value = searchParams.get('tab');
    if (value === 'overview'
      || value === 'deviation'
      || value === 'intent'
      || value === 'cross'
      || value === 'rules'
      || value === 'tasks') {
      return value;
    }
    return 'overview';
  }, [searchParams]);

  const panel = useMemo(() => {
    if (activeTab === 'deviation') return <DeviationList embedded />;
    if (activeTab === 'intent') return <IntentDefectList embedded />;
    if (activeTab === 'cross') return <CrossReviewList embedded />;
    if (activeTab === 'rules') return <QualityRuleConfig embedded />;
    if (activeTab === 'tasks') return <QualityTaskMonitor embedded />;
    return <QualityOverview embedded />;
  }, [activeTab]);

  return (
    <PageContainer
      title="质量保障中心"
    >
      <Tabs
        activeKey={activeTab}
        onChange={(value) => setSearchParams({ tab: String(value) })}
        items={[
          { key: 'overview', label: '质量总览' },
          { key: 'deviation', label: '偏离检测' },
          { key: 'intent', label: '意图缺陷' },
          { key: 'cross', label: '交叉审查' },
          { key: 'rules', label: '检测配置' },
          { key: 'tasks', label: '任务监控' },
        ]}
      />
      <Card variant="borderless" className="shadow-sm">
        {panel}
      </Card>
    </PageContainer>
  );
}

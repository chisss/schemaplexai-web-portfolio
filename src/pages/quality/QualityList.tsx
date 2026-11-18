import { useMemo } from 'react';
import { Card, Tabs } from 'antd';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useTranslation } from 'react-i18next';
import QualityOverview from './QualityOverview';
import DeviationList from './DeviationList';
import IntentDefectList from './IntentDefectList';
import CrossReviewList from './CrossReviewList';
import QualityRuleConfig from './QualityRuleConfig';
import QualityTaskMonitor from './QualityTaskMonitor';

export default function QualityList() {
  const { t } = useTranslation();
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
      title={t('quality.center')}
    >
      <Tabs
        activeKey={activeTab}
        onChange={(value) => setSearchParams({ tab: String(value) })}
        items={[
          { key: 'overview', label: t('quality.tab.overview') },
          { key: 'deviation', label: t('quality.deviation.pageTitle') },
          { key: 'intent', label: t('quality.defect.pageTitle') },
          { key: 'cross', label: t('quality.crossReview.pageTitle') },
          { key: 'rules', label: t('quality.tab.rules') },
          { key: 'tasks', label: t('quality.tab.tasks') },
        ]}
      />
      <Card variant="borderless" className="shadow-sm">
        {panel}
      </Card>
    </PageContainer>
  );
}

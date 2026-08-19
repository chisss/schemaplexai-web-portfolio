import { Card } from 'antd';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useAllAiModels } from '@/api/system';
import RagManagementTab from './components/RagManagementTab';

export default function SystemRag() {
  const { t } = useTranslation();
  const { data: allModels = [] } = useAllAiModels();

  return (
    <PageContainer title={t('menu.systemRag', { defaultValue: 'RAG 管理' })}>
      <Card variant="borderless" className="shadow-sm rounded-xl">
        <RagManagementTab models={allModels} />
      </Card>
    </PageContainer>
  );
}

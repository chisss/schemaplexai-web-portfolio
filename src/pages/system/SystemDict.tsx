import { useTranslation } from 'react-i18next';
import { Card } from 'antd';
import PageContainer from '@/components/PageContainer/PageContainer';
import DictManageTab from './components/DictManageTab';

export default function SystemDict() {
  const { t } = useTranslation();

  return (
    <PageContainer title={t('menu.systemDict')}>
      <Card variant="borderless" className="shadow-sm rounded-xl">
        <DictManageTab />
      </Card>
    </PageContainer>
  );
}

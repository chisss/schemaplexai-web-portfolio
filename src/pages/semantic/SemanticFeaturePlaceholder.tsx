import { ApartmentOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import PlaceholderPage from '@/components/PlaceholderPage/PlaceholderPage';

export default function SemanticFeaturePlaceholder() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const feature = pathname.endsWith('/semantic-query')
    ? 'query'
    : pathname.includes('/semantic-models/')
      ? 'workbench'
      : 'models';
  const isQuery = feature === 'query';

  return (
    <PlaceholderPage
      title={t(`semantic.placeholder.${feature}.title`)}
      description={t(`semantic.placeholder.${feature}.description`)}
      icon={
        isQuery
          ? <SearchOutlined style={{ fontSize: 88, color: '#1677ff' }} />
          : <ApartmentOutlined style={{ fontSize: 88, color: '#1677ff' }} />
      }
    />
  );
}

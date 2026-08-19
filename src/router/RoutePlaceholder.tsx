import { useTranslation } from 'react-i18next';
import PlaceholderPage from '@/components/PlaceholderPage/PlaceholderPage';

interface RoutePlaceholderProps {
  i18nKey: string;
}

export default function RoutePlaceholder({ i18nKey }: RoutePlaceholderProps) {
  const { t } = useTranslation();
  return <PlaceholderPage title={t(i18nKey)} />;
}

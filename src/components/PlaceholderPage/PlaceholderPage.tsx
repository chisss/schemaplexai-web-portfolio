/**
 * 占位页面组件
 * 用于开发中的模块
 */
import { RocketOutlined, ThunderboltOutlined, StarOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import { useTranslation } from 'react-i18next';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function PlaceholderPage({
  title,
  description,
  icon,
}: PlaceholderPageProps) {
  const { t } = useTranslation();
  const defaultIcon = <RocketOutlined style={{ fontSize: 88, color: '#165DFF' }} />;
  const displayDescription = description ?? t('placeholder.description');

  return (
    <div className="placeholder-shell">
      <Card variant="borderless" className="placeholder-shell__card">
        <div className="placeholder-shell__icon">
          {icon || defaultIcon}
          <span className="placeholder-shell__icon-badge">
            <ThunderboltOutlined />
          </span>
        </div>

        <h2 className="placeholder-shell__title">{title}</h2>
        <p className="placeholder-shell__description">{displayDescription}</p>

        <div className="placeholder-shell__tag">
          <StarOutlined />
          <span>{t('placeholder.comingSoon')}</span>
        </div>

        <div className="placeholder-shell__dots" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <span key={i} className="placeholder-shell__dot" style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
      </Card>
    </div>
  );
}

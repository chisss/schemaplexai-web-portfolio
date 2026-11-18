import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';

interface SeverityBadgeProps {
  severity?: string;
}

const COLOR_MAP: Record<string, string> = {
  critical: 'red',
  high: 'volcano',
  warning: 'orange',
  medium: 'gold',
  info: 'blue',
  low: 'default',
};

const LABEL_KEY_MAP: Record<string, string> = {
  critical: 'quality.severity.critical',
  high: 'quality.severity.high',
  warning: 'quality.severity.warning',
  medium: 'quality.severity.medium',
  info: 'quality.severity.info',
  low: 'quality.severity.low',
};

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const { t } = useTranslation();
  const normalized = (severity || '').toLowerCase();
  const label = LABEL_KEY_MAP[normalized] ? t(LABEL_KEY_MAP[normalized]) : severity || '-';
  return <Tag color={COLOR_MAP[normalized] || 'default'}>{label}</Tag>;
}

import { Tag } from 'antd';

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

const LABEL_MAP: Record<string, string> = {
  critical: '严重',
  high: '高',
  warning: '警告',
  medium: '中',
  info: '提示',
  low: '低',
};

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const normalized = (severity || '').toLowerCase();
  return <Tag color={COLOR_MAP[normalized] || 'default'}>{LABEL_MAP[normalized] || severity || '-'}</Tag>;
}

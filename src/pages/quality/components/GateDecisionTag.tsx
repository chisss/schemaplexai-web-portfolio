import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';

interface GateDecisionTagProps {
  decision?: string;
}

const COLOR_MAP: Record<string, string> = {
  fail: 'red',
  pause: 'orange',
  warn: 'gold',
  pass: 'green',
  retry: 'blue',
};

const LABEL_KEY_MAP: Record<string, string> = {
  fail: 'quality.gateDecision.fail',
  pause: 'quality.gateDecision.pause',
  warn: 'quality.gateDecision.warn',
  pass: 'quality.gateDecision.pass',
  retry: 'quality.gateDecision.retry',
};

export default function GateDecisionTag({ decision }: GateDecisionTagProps) {
  const { t } = useTranslation();
  const normalized = (decision || '').toLowerCase();
  const label = LABEL_KEY_MAP[normalized] ? t(LABEL_KEY_MAP[normalized]) : decision || '-';
  return <Tag color={COLOR_MAP[normalized] || 'default'}>{label}</Tag>;
}

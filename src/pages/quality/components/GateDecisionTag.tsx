import { Tag } from 'antd';

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

const LABEL_MAP: Record<string, string> = {
  fail: '阻断',
  pause: '暂停',
  warn: '告警',
  pass: '通过',
  retry: '重试',
};

export default function GateDecisionTag({ decision }: GateDecisionTagProps) {
  const normalized = (decision || '').toLowerCase();
  return <Tag color={COLOR_MAP[normalized] || 'default'}>{LABEL_MAP[normalized] || decision || '-'}</Tag>;
}

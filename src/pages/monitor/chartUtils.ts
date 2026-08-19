import dayjs from 'dayjs';

/** 图表统一调色盘 - 与设计系统协调 */
export const CHART_COLORS = {
  primary: '#165DFF',
  primaryLight: '#4080FF',
  primaryArea: 'rgba(22, 93, 255, 0.12)',
  success: '#00B42A',
  successArea: 'rgba(0, 180, 42, 0.12)',
  warning: '#FF7D00',
  warningArea: 'rgba(255, 125, 0, 0.08)',
  danger: '#F53F3F',
  dangerArea: 'rgba(245, 63, 63, 0.08)',
  purple: '#722ED1',
  purpleArea: 'rgba(114, 46, 209, 0.08)',
  cyan: '#14C9C9',
  palette: ['#165DFF', '#00B42A', '#FF7D00', '#F53F3F', '#722ED1', '#14C9C9', '#F7BA1E', '#9FDB1D'],
  splitLineDark: '#3D3E40',
  splitLineLight: '#E5E6EB',
} as const;

const TIME_RANGE_POINT_COUNT: Record<string, number> = {
  '24h': 24,
  last_24h: 24,
  '7d': 7,
  last_7d: 7,
  '30d': 30,
  last_30d: 30,
};

type TrendRow = Record<string, unknown>;

function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function normalizeLabel(value: unknown, groupBy: string) {
  const label = String(value || '').trim();
  if (!label) {
    return '';
  }
  if (groupBy === 'day') {
    return dayjs(label).format('YYYY-MM-DD');
  }
  if (groupBy === 'hour') {
    return dayjs(label).format('YYYY-MM-DD HH:00');
  }
  return label;
}

export function buildTimeLabels(timeRange: string, groupBy: string, sourceLabels: string[] = []) {
  const cleanLabels = Array.from(new Set(sourceLabels.filter(Boolean))).sort((left, right) =>
    dayjs(left).valueOf() - dayjs(right).valueOf(),
  );
  if (groupBy !== 'day' && groupBy !== 'hour') {
    return cleanLabels;
  }

  const pointCount = TIME_RANGE_POINT_COUNT[timeRange] ?? Math.max(cleanLabels.length, groupBy === 'hour' ? 24 : 7);
  const unit = groupBy === 'hour' ? 'hour' : 'day';
  const end = dayjs().startOf(unit);

  return Array.from({ length: pointCount }, (_, index) =>
    end.subtract(pointCount - index - 1, unit).format(groupBy === 'hour' ? 'YYYY-MM-DD HH:00' : 'YYYY-MM-DD'),
  );
}

export function mergeTrendByLabels<T extends TrendRow>(
  rows: T[],
  labels: string[],
  metricKeys: string[],
  groupBy = 'day',
) {
  const rowMap = new Map(
    rows.map((row) => [normalizeLabel(row.label ?? row.date, groupBy), row] as const).filter(([label]) => !!label),
  );

  return labels.map((label) => {
    const raw = rowMap.get(label);
    const next: TrendRow = {
      ...(raw || {}),
      label,
    };
    metricKeys.forEach((key) => {
      next[key] = toNumber(raw?.[key]);
    });
    return next as T;
  });
}

export function hasTrendData(rows: TrendRow[], metricKeys: string[]) {
  return rows.some((row) => metricKeys.some((key) => toNumber(row[key]) > 0));
}

export function formatTimeAxisLabel(label: string, groupBy: string) {
  if (groupBy === 'day') {
    return dayjs(label).format('MM-DD');
  }
  if (groupBy === 'hour') {
    return dayjs(label).format('MM-DD HH:00');
  }
  return label;
}

export function resolveAxisLabelInterval(count: number) {
  if (count <= 8) {
    return 0;
  }
  return Math.max(0, Math.ceil(count / 8) - 1);
}

export function buildChartEmptyGraphic(text: string, isDark: boolean) {
  return [
    {
      type: 'text',
      left: 'center',
      top: 'middle',
      silent: true,
      style: {
        text,
        fill: isDark ? '#94a3b8' : '#64748b',
        fontSize: 14,
        fontWeight: 500,
      },
    },
  ];
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    notation: 'compact',
    maximumFractionDigits: value >= 100000 ? 1 : 0,
  }).format(value);
}

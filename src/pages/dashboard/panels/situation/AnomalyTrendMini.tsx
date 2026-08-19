import { useMemo } from 'react';
import { Typography } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, MinusOutlined } from '@ant-design/icons';
import LightweightECharts from '@/components/ECharts/LightweightECharts';
import { useAppStore } from '@/store/useAppStore';
import type { TrendSummary } from '@/types/homepage';

const { Text } = Typography;

const TREND_ICON = {
  up: <ArrowUpOutlined style={{ color: '#ef4444' }} />,
  down: <ArrowDownOutlined style={{ color: '#22c55e' }} />,
  stable: <MinusOutlined style={{ color: '#94a3b8' }} />,
};

interface Props {
  trend?: TrendSummary;
}

export default function AnomalyTrendMini({ trend }: Props) {
  const isDark = useAppStore((s) => s.theme === 'dark');

  const option = useMemo(() => {
    if (!trend) return {};
    return {
      grid: { top: 8, right: 8, bottom: 20, left: 32 },
      xAxis: {
        type: 'category' as const,
        data: trend.labels,
        axisLabel: { fontSize: 10, color: isDark ? '#64748b' : '#94a3b8' },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        splitLine: { lineStyle: { color: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(226,232,240,0.5)' } },
        axisLabel: { fontSize: 10, color: isDark ? '#64748b' : '#94a3b8' },
      },
      series: [
        {
          type: 'line',
          data: trend.dailyCounts,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { width: 2, color: '#f59e0b' },
          itemStyle: { color: '#f59e0b' },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(245,158,11,0.2)' },
                { offset: 1, color: 'rgba(245,158,11,0.02)' },
              ],
            },
          },
        },
      ],
      tooltip: { trigger: 'axis' as const, textStyle: { fontSize: 12 } },
    };
  }, [trend, isDark]);

  if (!trend) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>
          异常趋势 (7天)
        </Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {TREND_ICON[trend.trend]}
          <Text style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b' }}>
            {trend.totalCount}
          </Text>
        </div>
      </div>
      <LightweightECharts option={option} style={{ height: 120 }} theme={isDark ? 'dark' : undefined} />
    </div>
  );
}

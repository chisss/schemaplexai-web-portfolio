import type { CSSProperties } from 'react';
import * as echarts from 'echarts/core';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { BarChart, LineChart, PieChart, RadarChart } from 'echarts/charts';
import { GraphicComponent, GridComponent, LegendComponent, RadarComponent, TooltipComponent } from 'echarts/components';
import { LegacyGridContainLabel } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import 'echarts/theme/dark.js';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TooltipComponent,
  LegacyGridContainLabel,
  CanvasRenderer,
]);

type LightweightEChartsProps = {
  option: echarts.EChartsCoreOption;
  theme?: 'dark';
  style?: CSSProperties;
  height?: number | string;
  className?: string;
  notMerge?: boolean;
  lazyUpdate?: boolean;
};

export default function LightweightECharts({
  option,
  theme,
  style,
  height,
  className,
  notMerge,
  lazyUpdate,
}: LightweightEChartsProps) {
  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      theme={theme}
      style={height === undefined ? style : { ...style, height }}
      className={className}
      notMerge={notMerge}
      lazyUpdate={lazyUpdate}
    />
  );
}

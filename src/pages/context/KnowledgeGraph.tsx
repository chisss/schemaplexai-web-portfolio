/**
 * 知识图谱全景图组件
 * 基于真实上下文数据动态构建 4 层层级关系图
 * 使用 @antv/g6 v5 dagre 层级布局 + 交互
 */
import { useEffect, useRef, useMemo } from 'react';
import { Graph } from '@antv/g6';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { Empty, Spin, Space, Typography } from 'antd';

const { Text } = Typography;

interface ContextRecord {
  id: string;
  name: string;
  contextLevel: string;
  description?: string;
  projectId?: string;
  itemCount?: number;
  status?: string;
}

interface ContextRelationRecord {
  id: string;
  fromContextId: string;
  toContextId: string;
  relationType: string;
  description?: string;
}

interface KnowledgeGraphProps {
  data: ContextRecord[];
  relations?: ContextRelationRecord[];
  loading?: boolean;
  height?: number;
}

const LEVEL_THEME: Record<string, {
  fill: string;
  stroke: string;
  labelColor: string;
  labelKey: string;
  size: number;
  order: number;
}> = {
  global: {
    fill: '#f3e8ff', stroke: '#9333ea', labelColor: '#6b21a8',
    labelKey: 'context.levelGlobal', size: 56, order: 0,
  },
  project: {
    fill: '#dbeafe', stroke: '#165DFF', labelColor: '#1e40af',
    labelKey: 'context.levelProject', size: 48, order: 1,
  },
  task: {
    fill: '#ccfbf1', stroke: '#0d9488', labelColor: '#115e59',
    labelKey: 'context.levelTask', size: 40, order: 2,
  },
  agent: {
    fill: '#ffedd5', stroke: '#FF7D00', labelColor: '#9a3412',
    labelKey: 'context.levelAgent', size: 36, order: 3,
  },
};

const EDGE_LABELS: Record<string, { key: string; color: string }> = {
  'global-project': { key: 'context.graphEdgeInherit', color: '#a78bfa' },
  'project-task': { key: 'context.graphEdgeDepend', color: '#4080FF' },
  'task-agent': { key: 'context.graphEdgeApply', color: '#34d399' },
  'global-task': { key: 'context.graphEdgeConstrain', color: '#c084fc' },
  'global-agent': { key: 'context.graphEdgeConstrain', color: '#c084fc' },
  'project-agent': { key: 'context.graphEdgeApply', color: '#38bdf8' },
};

export default function KnowledgeGraph({ data, relations, loading, height = 420 }: KnowledgeGraphProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const renderPromiseRef = useRef<Promise<void> | null>(null);
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const graphData = useMemo(() => {
    if (!data?.length) return { nodes: [], edges: [] };

    const nodes = data.map((ctx) => {
      const theme = LEVEL_THEME[ctx.contextLevel] || LEVEL_THEME.task;
      return {
        id: ctx.id,
        data: {
          label: ctx.name,
          level: ctx.contextLevel,
          description: ctx.description,
          itemCount: ctx.itemCount,
        },
        style: {
          size: theme.size,
          fill: theme.fill,
          stroke: theme.stroke,
          lineWidth: 2,
          labelText: ctx.name.length > 10 ? ctx.name.slice(0, 10) + '...' : ctx.name,
          labelFill: theme.labelColor,
          labelFontSize: ctx.contextLevel === 'global' ? 13 : 11,
          labelFontWeight: ctx.contextLevel === 'global' ? 600 : 400,
          labelPlacement: 'bottom' as const,
          labelOffsetY: 8,
          badges: ctx.itemCount ? [{
            text: `${ctx.itemCount}`,
            placement: 'right-top' as const,
          }] : [],
        },
      };
    });

    const edges: any[] = [];

    // 真实关联关系（实线）
    if (relations?.length) {
      for (const rel of relations) {
        const sourceExists = data.some((c) => c.id === rel.fromContextId);
        const targetExists = data.some((c) => c.id === rel.toContextId);
        if (!sourceExists || !targetExists) continue;
        edges.push({
          source: rel.fromContextId,
          target: rel.toContextId,
          style: {
            stroke: '#6366f1',
            lineWidth: 2,
            labelText: rel.relationType || 'references',
            labelFontSize: 9,
            labelFill: '#6366f1',
            labelBackgroundFill: '#fff',
            labelBackgroundOpacity: 0.9,
            endArrow: true,
            endArrowSize: 7,
          },
        });
      }
    }

    // 按层级分组
    const byLevel: Record<string, ContextRecord[]> = {};
    data.forEach((ctx) => {
      const level = ctx.contextLevel || 'task';
      if (!byLevel[level]) byLevel[level] = [];
      byLevel[level].push(ctx);
    });

    const levelOrder = ['global', 'project', 'task', 'agent'];

    // projectId 关联边
    for (const ctx of data) {
      if (ctx.projectId) {
        const projectCtx = data.find(
          (c) => c.contextLevel === 'project' && c.id === ctx.projectId
        );
        if (projectCtx) {
          const edgeKey = `project-${ctx.contextLevel}`;
          const theme = EDGE_LABELS[edgeKey] || { key: 'context.graphEdgeDepend', color: '#86909C' };
          edges.push({
            source: projectCtx.id,
            target: ctx.id,
            style: {
              stroke: theme.color,
              lineWidth: 1.5,
              labelText: t(theme.key),
              labelFontSize: 9,
              labelFill: '#86909C',
              labelBackgroundFill: '#fff',
              labelBackgroundOpacity: 0.9,
              endArrow: true,
              endArrowSize: 6,
            },
          });
        }
      }
    }

    // 层级推断边（虚线）
    const connectedTargets = new Set(edges.map((e) => e.target));
    for (let i = 0; i < levelOrder.length - 1; i++) {
      const higherLevel = levelOrder[i];
      const lowerLevel = levelOrder[i + 1];
      const higherNodes = byLevel[higherLevel] || [];
      const lowerNodes = byLevel[lowerLevel] || [];

      if (higherNodes.length === 0 || lowerNodes.length === 0) continue;

      for (const lower of lowerNodes) {
        if (connectedTargets.has(lower.id)) continue;
        const higher = higherNodes[0];
        const edgeKey = `${higherLevel}-${lowerLevel}`;
        const theme = EDGE_LABELS[edgeKey] || { key: 'context.graphEdgeDepend', color: '#86909C' };
        edges.push({
          source: higher.id,
          target: lower.id,
          style: {
            stroke: `${theme.color}80`,
            lineWidth: 1,
            lineDash: [4, 3],
            labelText: t(theme.key),
            labelFontSize: 9,
            labelFill: '#b4bfcc',
            labelBackgroundFill: '#fff',
            labelBackgroundOpacity: 0.8,
            endArrow: true,
            endArrowSize: 5,
          },
        });
        connectedTargets.add(lower.id);
      }
    }

    return { nodes, edges };
  }, [data, relations, t]);

  useEffect(() => {
    if (!containerRef.current || !graphData.nodes.length) return;

    const container = containerRef.current;

    // 安全销毁上一轮的图
    const prevGraph = graphRef.current;
    const prevRenderPromise = renderPromiseRef.current;
    graphRef.current = null;
    renderPromiseRef.current = null;

    if (prevGraph) {
      const safeDestroy = () => {
        try { prevGraph.destroy(); } catch { /* 忽略 */ }
      };
      if (prevRenderPromise) {
        prevRenderPromise.finally(safeDestroy);
      } else {
        safeDestroy();
      }
    }

    // 清空容器 DOM
    container.innerHTML = '';

    const graph = new Graph({
      container,
      width: container.scrollWidth || 600,
      height,
      autoFit: 'view',
      padding: [40, 60, 40, 60],
      layout: {
        type: 'antv-dagre',
        rankdir: 'TB',
        nodesep: 60,
        ranksep: 80,
        align: undefined,
      },
      behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
      node: {
        type: 'circle',
        style: {
          labelPlacement: 'bottom',
          labelMaxWidth: 100,
        },
      },
      edge: {
        type: 'cubic-vertical',
        style: {
          endArrow: true,
        },
      },
    } as any);

    graph.setData(graphData as any);

    const rp = graph.render().then(() => {
      graphRef.current = graph;
    }).catch(() => {
      // render 失败时静默
    });
    renderPromiseRef.current = rp;

    const ro = new ResizeObserver(() => {
      if (graphRef.current && container) {
        try {
          graphRef.current.resize(container.scrollWidth, height);
        } catch { /* 忽略 */ }
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      const currentGraph = graph;
      const currentRp = rp;
      graphRef.current = null;
      renderPromiseRef.current = null;
      currentRp.finally(() => {
        try { currentGraph.destroy(); } catch { /* 忽略 */ }
      });
    };
  }, [graphData, height]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex items-center justify-center" style={{ height: height / 2 }}>
        <Empty description={t('context.noGraphData')} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <Space size="middle">
          {Object.entries(LEVEL_THEME).map(([key, theme]) => (
            <Space key={key} size={4}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: theme.stroke,
                  boxShadow: `0 0 0 2px ${theme.fill}`,
                }}
              />
              <Text style={{ fontSize: 11, color: '#4E5969' }}>
                {t(theme.labelKey)}
              </Text>
            </Space>
          ))}
        </Space>
        <Text style={{ fontSize: 11, color: '#86909C' }}>
          {t('context.graphTotal', { count: data.length })}
        </Text>
      </div>

      <div
        ref={containerRef}
        style={{
          height,
          width: '100%',
          background: isDark
            ? 'linear-gradient(135deg, #1D1E20 0%, #232425 50%, #1D1E20 100%)'
            : 'linear-gradient(135deg, #fafbff 0%, #F7F8FA 50%, #f0f4ff 100%)',
          borderRadius: 12,
          overflow: 'hidden',
          border: isDark ? '1px solid #3D3E40' : '1px solid #e2e8f0',
          position: 'relative',
        }}
      />

      <div className="flex justify-center mt-2">
        <Text style={{ fontSize: 11, color: '#c0c8d4' }}>
          {t('context.graphTips')}
        </Text>
      </div>
    </div>
  );
}

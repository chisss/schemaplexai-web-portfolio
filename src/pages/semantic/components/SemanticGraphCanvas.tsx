import { useEffect, useMemo, useRef } from 'react';
import { AimOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import { Graph } from '@antv/g6';
import { Button, Empty, Space, Spin, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import type { SemanticGraphEdge, SemanticGraphNode } from '@/types/semantic';

interface SemanticGraphCanvasProps {
  nodes: SemanticGraphNode[];
  edges: SemanticGraphEdge[];
  loading?: boolean;
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
}

export default function SemanticGraphCanvas({
  nodes,
  edges,
  loading,
  selectedNodeId,
  onSelectNode,
}: SemanticGraphCanvasProps) {
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const renderPromiseRef = useRef<Promise<void> | null>(null);
  const onSelectRef = useRef(onSelectNode);

  useEffect(() => {
    onSelectRef.current = onSelectNode;
  }, [onSelectNode]);

  const graphData = useMemo(() => ({
    nodes: nodes.map((node) => {
      const isConcept = node.kind === 'concept';
      const selected = node.id === selectedNodeId;
      return {
        id: node.id,
        style: {
          size: isConcept ? 46 : 34,
          fill: selected ? '#1677ff' : isConcept ? '#e8f1ff' : '#ecfdf3',
          stroke: selected ? '#0958d9' : isConcept ? '#4b8ff9' : '#22a06b',
          lineWidth: selected ? 3 : 1.5,
          labelText: node.label || node.name,
          labelFill: selected ? '#ffffff' : theme === 'dark' ? '#e5e7eb' : '#172b4d',
          labelFontSize: 11,
          labelMaxWidth: 120,
          labelPlacement: 'bottom' as const,
          labelOffsetY: 8,
          shadowColor: selected ? 'rgba(22, 119, 255, 0.28)' : 'transparent',
          shadowBlur: selected ? 14 : 0,
        },
      };
    }),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      style: {
        stroke: edge.inferred ? '#8c8c8c' : '#7a869a',
        lineWidth: edge.inferred ? 1 : 1.5,
        lineDash: edge.inferred ? [4, 4] : undefined,
        labelText: edge.label || edge.predicate,
        labelFill: theme === 'dark' ? '#aeb8c4' : '#5e6c84',
        labelFontSize: 9,
        labelBackground: true,
        labelBackgroundFill: theme === 'dark' ? '#1f2329' : '#ffffff',
        endArrow: true,
      },
    })),
  }), [edges, nodes, selectedNodeId, theme]);

  useEffect(() => {
    if (!containerRef.current || graphData.nodes.length === 0) return;
    const container = containerRef.current;
    const previousGraph = graphRef.current;
    const previousRender = renderPromiseRef.current;
    graphRef.current = null;
    renderPromiseRef.current = null;
    if (previousGraph) {
      const destroy = () => { try { previousGraph.destroy(); } catch { /* 图实例可能已销毁 */ } };
      if (previousRender) previousRender.finally(destroy);
      else destroy();
    }
    container.innerHTML = '';

    const graph = new Graph({
      container,
      width: container.clientWidth || 720,
      height: container.clientHeight || 520,
      autoFit: 'view',
      padding: 56,
      layout: { type: 'antv-dagre', rankdir: 'LR', nodesep: 64, ranksep: 112 },
      behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
      node: { type: 'circle' },
      edge: { type: 'line' },
    } as unknown as ConstructorParameters<typeof Graph>[0]);
    graph.setData(graphData);
    graph.on('node:click', (event) => {
      const target = (event as unknown as { target?: { id?: string; get?: (key: string) => unknown } }).target;
      const nodeId = target?.id ?? target?.get?.('id');
      if (nodeId) onSelectRef.current(String(nodeId));
    });
    const renderPromise = graph.render().then(() => { graphRef.current = graph; });
    renderPromiseRef.current = renderPromise;

    const observer = new ResizeObserver(() => {
      try { graph.resize(container.clientWidth, container.clientHeight); } catch { /* 页面卸载时忽略 */ }
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      graphRef.current = null;
      renderPromiseRef.current = null;
      renderPromise.finally(() => { try { graph.destroy(); } catch { /* 页面卸载时忽略 */ } });
    };
  }, [graphData]);

  if (loading) {
    return <div className="semantic-graph-state"><Spin size="large" /></div>;
  }
  if (nodes.length === 0) {
    return <div className="semantic-graph-state"><Empty description={t('semantic.workbench.graph.empty')} /></div>;
  }

  return (
    <div className="semantic-graph-canvas">
      <div className="semantic-graph-canvas__tools">
        <Space.Compact>
          <Tooltip title={t('semantic.workbench.graph.zoomIn')}>
            <Button icon={<ZoomInOutlined />} aria-label={t('semantic.workbench.graph.zoomIn')} onClick={() => graphRef.current?.zoomBy?.(1.2)} />
          </Tooltip>
          <Tooltip title={t('semantic.workbench.graph.zoomOut')}>
            <Button icon={<ZoomOutOutlined />} aria-label={t('semantic.workbench.graph.zoomOut')} onClick={() => graphRef.current?.zoomBy?.(0.8)} />
          </Tooltip>
          <Tooltip title={t('semantic.workbench.graph.fit')}>
            <Button icon={<AimOutlined />} aria-label={t('semantic.workbench.graph.fit')} onClick={() => graphRef.current?.fitView?.()} />
          </Tooltip>
        </Space.Compact>
      </div>
      <div ref={containerRef} className="semantic-graph-canvas__viewport" />
    </div>
  );
}

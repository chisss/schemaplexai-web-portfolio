import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { App as AntApp, Spin, Drawer, Form, Input, Button, Space, Alert, Card } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from 'react-i18next';
import { useWorkflowTemplate, useUpdateWorkflowTemplate, useAiArrangeWorkflow } from '@/api/workflow';
import {
  ReactFlow,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useUndoRedo } from '@/hooks/useUndoRedo';
import { nodeTypes } from './components/nodes';
import CustomEdge from './components/edges/CustomEdge';
import NodePanel from './components/panels/NodePanel';
import ConfigPanel from './components/panels/ConfigPanel';
import DesignerToolbar from './components/DesignerToolbar';
import WorkflowIssuePanel from './components/WorkflowIssuePanel';
import WorkflowNodeLogModal from './components/WorkflowNodeLogModal';
import type { WorkflowNode, WorkflowEdge, NodeType } from '@/types/workflow';
import { NODE_TYPE_REGISTRY } from '@/types/workflow';
import { validateWorkflow, type WorkflowValidationIssue } from './utils/workflowValidator';

const edgeTypes = { custom: CustomEdge };

/** 业务节点 → ReactFlow 节点；position 缺失时自动生成垂直线性布局默认坐标 */
function toFlowNodes(nodes: WorkflowNode[]): Node[] {
  return nodes.map((n, index) => ({
    id: n.id,
    type: n.type,
    position: n.position ?? { x: 300, y: index * 160 },
    data: { label: n.label, config: n.config || {} },
  }));
}

/** 业务边 → ReactFlow 边 */
function toFlowEdges(edges: WorkflowEdge[]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'custom',
    label: e.label,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    data: { condition: e.condition },
  }));
}

/** ReactFlow 节点 → 业务节点 */
function toBizNodes(nodes: Node[]): WorkflowNode[] {
  return nodes.map((n) => ({
    id: n.id,
    type: (n.type || 'agent') as NodeType,
    label: (n.data as any)?.label || '',
    position: n.position,
    config: (n.data as any)?.config || {},
  }));
}

/** ReactFlow 边 → 业务边 */
function toBizEdges(edges: Edge[]): WorkflowEdge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label as string | undefined,
    condition: (e.data as any)?.condition,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
  }));
}

let nodeIdCounter = 100;
const getNodeId = () => `node_${Date.now()}_${nodeIdCounter++}`;

function getDefaultNodeConfig(type: string, label: string, nodeId: string) {
  switch (type) {
    case 'agent':
      return { instructionSource: 'upstream', executionStrategy: 'short_wait', blockOnQualityTaskFailed: false };
    case 'document': {
      const normalizedKey = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const documentKey = normalizedKey || nodeId;
      return {
        documentKey,
        documentTitle: label,
        submitButtonText: `提交${label}`,
      };
    }
    case 'human_review':
      return {
        reviewerType: 'internal',
        timeoutStrategy: 'remind',
      };
    default:
      return {};
  }
}

/** 连接规则验证 */
function isValidConnection(connection: Connection, nodes: Node[], edges: Edge[]): boolean {
  const { source, target } = connection;
  if (!source || !target) return false;
  if (source === target) return false;
  const exists = edges.some((e) => e.source === source && e.target === target);
  if (exists) return false;
  const targetNode = nodes.find((n) => n.id === target);
  if (targetNode?.type?.startsWith('trigger_') || targetNode?.type === 'start') return false;
  const sourceNode = nodes.find((n) => n.id === source);
  if (sourceNode?.type === 'end') return false;
  if (sourceNode?.type === 'condition') {
    const outEdges = edges.filter((e) => e.source === source);
    if (outEdges.length >= 2) return false;
  }
  return true;
}

interface DesignerCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onSave: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  saving: boolean;
  templateId: string;
}

function DesignerCanvas({ initialNodes, initialEdges, onSave, saving, templateId }: DesignerCanvasProps) {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const reactFlow = useReactFlow();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [logNode, setLogNode] = useState<{ id: string; label?: string } | null>(null);
  const [validationIssues, setValidationIssues] = useState<WorkflowValidationIssue[]>([]);
  const [aiForm] = Form.useForm();
  const aiArrange = useAiArrangeWorkflow();
  const {
    pushState,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
  } = useUndoRedo();

  const applyValidationHighlight = useCallback((invalidNodeIds: string[]) => {
    setNodes((currentNodes) => currentNodes.map((node) => {
      if (invalidNodeIds.includes(node.id)) {
        return {
          ...node,
          style: {
            ...node.style,
            boxShadow: '0 0 0 2px rgba(245,34,45,0.85)',
            borderRadius: 12,
          },
        };
      }
      return {
        ...node,
        style: {
          ...node.style,
          boxShadow: 'none',
        },
      };
    }));
  }, [setNodes]);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNode(null);
    setContextMenu(null);
    setLogNode(null);
    setValidationIssues([]);
    clearHistory();
  }, [clearHistory, initialEdges, initialNodes, setEdges, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!isValidConnection(params, nodes, edges)) return;
      pushState({ nodes, edges });
      setValidationIssues([]);
      const sourceNode = nodes.find((n) => n.id === params.source);
      const newEdge: any = { ...params, type: 'custom' };
      if (sourceNode?.type === 'condition') {
        const outCount = edges.filter((e) => e.source === params.source).length;
        const condConfig = (sourceNode.data as any)?.config || {};
        newEdge.label = outCount === 0
          ? (condConfig.trueLabel || 'True')
          : (condConfig.falseLabel || 'False');
        newEdge.sourceHandle = outCount === 0 ? 'true' : 'false';
        newEdge.data = { condition: outCount === 0 ? 'true' : 'false' };
      }
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [edges, nodes, pushState, setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow/type');
      const label = event.dataTransfer.getData('application/reactflow/label');
      if (!type) return;

      const position = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const nodeId = getNodeId();

      const newNode: Node = {
        id: nodeId,
        type,
        position,
        data: {
          label,
          config: getDefaultNodeConfig(type, label, nodeId),
        },
      };
      pushState({ nodes, edges });
      setValidationIssues([]);
      setNodes((nds) => nds.concat(newNode));
    },
    [edges, nodes, pushState, reactFlow, setNodes],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (changes.some((change) => change.type !== 'select')) {
        pushState({ nodes, edges });
        setValidationIssues([]);
      }
      onNodesChange(changes);
      for (const change of changes) {
        if (change.type === 'select' && change.selected) {
          const node = nodes.find((n) => n.id === change.id);
          if (node) setSelectedNode(node);
        }
      }
    },
    [edges, nodes, onNodesChange, pushState],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setContextMenu(null);
  }, []);

  const handleEdgesChange = useCallback((changes: EdgeChange<Edge>[]) => {
    if (changes.some((change) => change.type !== 'select')) {
      pushState({ nodes, edges });
      setValidationIssues([]);
    }
    onEdgesChange(changes);
  }, [edges, nodes, onEdgesChange, pushState]);

  const handleConfigChange = useCallback(
    (nodeId: string, config: Record<string, any>) => {
      pushState({ nodes, edges });
      setValidationIssues([]);
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, config } }
            : n,
        ),
      );
      setSelectedNode((current) => (
        current && current.id === nodeId
          ? { ...current, data: { ...current.data, config } }
          : current
      ));
    },
    [edges, nodes, pushState, setNodes, setSelectedNode],
  );

  const handleLabelChange = useCallback(
    (nodeId: string, label: string) => {
      pushState({ nodes, edges });
      setValidationIssues([]);
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, label } } : n)),
      );
      setSelectedNode((current) => (
        current && current.id === nodeId
          ? { ...current, data: { ...current.data, label } }
          : current
      ));
    },
    [edges, nodes, pushState, setNodes, setSelectedNode],
  );

  const handleSave = useCallback(() => {
    const validation = validateWorkflow(nodes, edges);
    const invalidNodeIds = validation.issues
      .filter((issue) => issue.level === 'error' && issue.nodeId)
      .map((issue) => issue.nodeId as string);
    applyValidationHighlight(invalidNodeIds);
    if (!validation.valid) {
      setValidationIssues(validation.issues);
      message.error(validation.issues.map((issue) => issue.message).join('；'));
      return;
    }
    setValidationIssues([]);
    onSave(toBizNodes(nodes), toBizEdges(edges));
  }, [applyValidationHighlight, edges, message, nodes, onSave]);

  const handleSelectIssueNode = useCallback((nodeId: string) => {
    const node = nodes.find((item) => item.id === nodeId);
    if (!node) return;
    setSelectedNode(node);
    reactFlow.setCenter(node.position.x, node.position.y, {
      zoom: Math.max(reactFlow.getZoom(), 1),
      duration: 220,
    });
  }, [nodes, reactFlow]);

  const handleFixIssue = useCallback((issue: WorkflowValidationIssue) => {
    if (issue.fixAction === 'add_end_node') {
      pushState({ nodes, edges });
      const maxX = nodes.reduce((value, node) => Math.max(value, node.position.x), 300);
      const maxY = nodes.reduce((value, node) => Math.max(value, node.position.y), 120);
      const nodeId = getNodeId();
      const newNode: Node = {
        id: nodeId,
        type: 'end',
        position: { x: maxX + 240, y: maxY },
        data: { label: '结束', config: {} },
      };
      setNodes((current) => current.concat(newNode));
      setValidationIssues((current) => current.filter((item) => item.code !== issue.code));
      message.success('已添加结束节点');
      return;
    }
    if (issue.fixAction === 'bind_agent' && issue.nodeId) {
      handleSelectIssueNode(issue.nodeId);
      message.info('请在右侧配置面板绑定 Agent');
      return;
    }
    if (issue.nodeId) {
      handleSelectIssueNode(issue.nodeId);
    }
  }, [edges, handleSelectIssueNode, message, nodes, pushState, setNodes]);

  const handleUndo = useCallback(() => {
    const previousState = undo({ nodes, edges });
    if (!previousState) {
      return;
    }
    setNodes(previousState.nodes);
    setEdges(previousState.edges);
    setSelectedNode(null);
    setContextMenu(null);
  }, [edges, nodes, setEdges, setNodes, undo]);

  const handleRedo = useCallback(() => {
    const nextState = redo({ nodes, edges });
    if (!nextState) {
      return;
    }
    setNodes(nextState.nodes);
    setEdges(nextState.edges);
    setSelectedNode(null);
    setContextMenu(null);
  }, [edges, nodes, redo, setEdges, setNodes]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
        return;
      }
      const modifierPressed = event.metaKey || event.ctrlKey;
      if (!modifierPressed) {
        return;
      }
      if (event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault();
        handleRedo();
        return;
      }
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        handleUndo();
        return;
      }
      if (event.key.toLowerCase() === 'y') {
        event.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRedo, handleUndo]);

  const handleAiArrange = useCallback(async () => {
    try {
      const values = await aiForm.validateFields();
      const response = await aiArrange.mutateAsync({ templateId, data: { prompt: values.prompt, specId: values.specId } });
      const payload = response.data;
      if (Array.isArray(payload?.nodes) && Array.isArray(payload?.edges)) {
        pushState({ nodes, edges });
        setNodes(toFlowNodes(payload.nodes as WorkflowNode[]));
        setEdges(toFlowEdges(payload.edges as WorkflowEdge[]));
        message.success('AI 已生成流程草图，请继续检查并保存');
      } else {
        message.success(payload?.explanation || t('workflow.designer.aiArrangeSubmitted'));
      }
      setAiDrawerOpen(false);
      aiForm.resetFields();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(t('workflow.designer.aiArrangeFailed'));
    }
  }, [aiForm, aiArrange, edges, nodes, pushState, setEdges, setNodes, t, templateId]);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    setSelectedNode(node);
    setContextMenu({
      x: rect ? event.clientX - rect.left : event.clientX,
      y: rect ? event.clientY - rect.top : event.clientY,
      nodeId: node.id,
    });
  }, []);

  const handleDuplicateNode = useCallback(() => {
    if (!contextMenu) {
      return;
    }
    const sourceNode = nodes.find((node) => node.id === contextMenu.nodeId);
    if (!sourceNode) {
      return;
    }
    pushState({ nodes, edges });
    const duplicatedNode: Node = {
      ...sourceNode,
      id: getNodeId(),
      position: {
        x: sourceNode.position.x + 48,
        y: sourceNode.position.y + 48,
      },
      data: {
        ...sourceNode.data,
        label: `${String(sourceNode.data?.label || '节点')} 副本`,
      },
    };
    setNodes((currentNodes) => [...currentNodes, duplicatedNode]);
    setContextMenu(null);
  }, [contextMenu, edges, nodes, pushState, setNodes]);

  const handleDeleteNode = useCallback(() => {
    if (!contextMenu) {
      return;
    }
    pushState({ nodes, edges });
    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== contextMenu.nodeId));
    setEdges((currentEdges) => currentEdges.filter((edge) => edge.source !== contextMenu.nodeId && edge.target !== contextMenu.nodeId));
    if (selectedNode?.id === contextMenu.nodeId) {
      setSelectedNode(null);
    }
    setContextMenu(null);
  }, [contextMenu, edges, nodes, pushState, selectedNode, setEdges, setNodes]);

  const handleOpenConfigFromMenu = useCallback(() => {
    if (!contextMenu) {
      return;
    }
    const targetNode = nodes.find((node) => node.id === contextMenu.nodeId);
    if (targetNode) {
      setSelectedNode(targetNode);
    }
    setContextMenu(null);
  }, [contextMenu, nodes]);

  const handleViewNodeLogs = useCallback(() => {
    if (!contextMenu) {
      return;
    }
    const targetNode = nodes.find((node) => node.id === contextMenu.nodeId);
    setLogNode({
      id: contextMenu.nodeId,
      label: String(targetNode?.data?.label || targetNode?.id || contextMenu.nodeId),
    });
    setContextMenu(null);
  }, [contextMenu, nodes]);

  const miniMapNodeColor = useCallback((node: Node) => {
    const meta = NODE_TYPE_REGISTRY.find((m) => m.type === node.type);
    return meta?.color || '#165DFF';
  }, []);

  return (
    <div className="flex h-full w-full" style={{ background: isDark ? '#1D1E20' : '#F7F8FA' }}>
      {/* 左侧节点面板 */}
      <NodePanel />

      {/* 中间画布 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 工具栏 */}
        <DesignerToolbar
          onSave={handleSave}
          onUndo={handleUndo}
          onRedo={handleRedo}
          saving={saving}
          onBack={() => navigate(-1)}
          onZoomIn={() => reactFlow.zoomIn()}
          onZoomOut={() => reactFlow.zoomOut()}
          onFitView={() => reactFlow.fitView()}
          onAiArrange={() => setAiDrawerOpen(true)}
          canUndo={canUndo}
          canRedo={canRedo}
        />

        {/* ReactFlow 画布 */}
        <div className="flex-1 relative" ref={canvasRef}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onPaneClick={onPaneClick}
            onNodeClick={(_, node) => setSelectedNode(node)}
            onNodeContextMenu={handleNodeContextMenu}
            isValidConnection={(conn) => isValidConnection(conn as Connection, nodes, edges)}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            defaultEdgeOptions={{ type: 'custom', animated: false }}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color={isDark ? '#1e3a5f' : '#e2e8f0'} />
            <MiniMap
              nodeColor={miniMapNodeColor}
              nodeStrokeWidth={2}
              style={{
                background: isDark ? '#2A2B2D' : '#f1f5f9',
                borderRadius: 8,
                border: isDark ? '1px solid #3D3E40' : '1px solid #e2e8f0',
              }}
            />
          </ReactFlow>
          {contextMenu && (
            <Card
              size="small"
              style={{
                position: 'absolute',
                left: contextMenu.x,
                top: contextMenu.y,
                zIndex: 20,
                width: 180,
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.16)',
              }}
              styles={{ body: { padding: 8 } }}
            >
              <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                <Button block type="text" onClick={handleOpenConfigFromMenu}>编辑配置</Button>
                <Button block type="text" onClick={handleDuplicateNode}>复制节点</Button>
                <Button block type="text" danger onClick={handleDeleteNode}>删除节点</Button>
                <Button block type="text" onClick={handleViewNodeLogs}>查看日志</Button>
              </Space>
            </Card>
          )}
          <WorkflowIssuePanel
            issues={validationIssues}
            onSelectNode={handleSelectIssueNode}
            onFixIssue={handleFixIssue}
          />
        </div>
      </div>

      {/* 右侧配置面板 */}
      {selectedNode && (
        <ConfigPanel
          selectedNode={selectedNode}
          onClose={() => setSelectedNode(null)}
          onConfigChange={handleConfigChange}
          onLabelChange={handleLabelChange}
        />
      )}

      <WorkflowNodeLogModal
        open={!!logNode}
        templateId={templateId}
        nodeId={logNode?.id ?? ''}
        nodeLabel={logNode?.label}
        onClose={() => setLogNode(null)}
      />

      {/* AI 智能编排 Drawer */}
      <Drawer
        title={<Space><RobotOutlined style={{ color: '#165DFF' }} />{t('workflow.designer.aiArrangeTitle')}</Space>}
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        size={480}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setAiDrawerOpen(false)}>{t('common.cancel')}</Button>
              <Button
                type="primary"
                loading={aiArrange.isPending}
                onClick={handleAiArrange}
                style={{ background: 'linear-gradient(135deg, #165DFF 0%, #0E42D2 100%)', border: 'none' }}
              >
                {t('workflow.designer.aiArrangeStart')}
              </Button>
            </Space>
          </div>
        }
      >
        <Alert
          type="info"
          showIcon
          title={t('workflow.designer.aiArrangeHint')}
          style={{ marginBottom: 16 }}
        />
        <Form form={aiForm} layout="vertical">
          <Form.Item
            name="prompt"
            label={t('workflow.designer.aiArrangePrompt')}
            rules={[{ required: true, message: t('workflow.designer.aiArrangePromptRequired') }]}
          >
            <Input.TextArea
              rows={6}
              placeholder={t('workflow.designer.aiArrangePromptPlaceholder')}
            />
          </Form.Item>
          <Form.Item name="specId" label={t('workflow.designer.aiArrangeSpecLabel')}>
            <Input placeholder={t('workflow.designer.aiArrangeSpecPlaceholder')} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default function WorkflowDesigner() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('id') ?? '';
  const { data: templateData, isLoading } = useWorkflowTemplate(templateId);
  const updateTemplate = useUpdateWorkflowTemplate();

  const flowNodes = useMemo(
    () => toFlowNodes((templateData?.definition?.nodes as WorkflowNode[]) ?? []),
    [templateData],
  );
  const flowEdges = useMemo(
    () => toFlowEdges((templateData?.definition?.edges as WorkflowEdge[]) ?? []),
    [templateData],
  );

  const handleSave = useCallback(
    (bizNodes: WorkflowNode[], bizEdges: WorkflowEdge[]) => {
      if (!templateId) return;
      updateTemplate.mutate(
        { id: templateId, data: { definition: { nodes: bizNodes, edges: bizEdges } } },
        {
          onSuccess: () => message.success(t('workflow.designer.saveSuccess')),
          onError: () => message.error(t('workflow.designer.saveFail')),
        },
      );
    },
    [templateId, updateTemplate, t],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <Spin size="large" description={t('common.loading')} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 120px)' }}>
      <ReactFlowProvider>
        <DesignerCanvas
          initialNodes={flowNodes}
          initialEdges={flowEdges}
          onSave={handleSave}
          saving={updateTemplate.isPending}
          templateId={templateId}
        />
      </ReactFlowProvider>
    </div>
  );
}

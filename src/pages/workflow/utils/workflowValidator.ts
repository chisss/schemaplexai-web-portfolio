import type { Edge, Node } from '@xyflow/react';

export interface WorkflowValidationIssue {
  code: string;
  nodeId?: string;
  message: string;
  level: 'error' | 'warning';
  fixAction?: 'add_end_node' | 'bind_agent' | 'connect_node' | 'remove_duplicate_start' | 'remove_duplicate_end';
}

export interface WorkflowValidationResult {
  valid: boolean;
  issues: WorkflowValidationIssue[];
}

function isStartNode(type?: string) {
  return type === 'start' || type?.startsWith('trigger_');
}

function isEndNode(type?: string) {
  return type === 'end';
}

export function validateWorkflow(nodes: Node[], edges: Edge[]): WorkflowValidationResult {
  const issues: WorkflowValidationIssue[] = [];
  const startNodes = nodes.filter((node) => isStartNode(node.type));
  const endNodes = nodes.filter((node) => isEndNode(node.type));

  if (startNodes.length === 0) {
    issues.push({ code: 'MISSING_START', message: '工作流至少需要一个开始节点或触发节点', level: 'error' });
  }
  if (startNodes.length > 1) {
    issues.push({ code: 'DUPLICATE_START', message: '工作流只能保留一个开始节点或触发节点', level: 'error', fixAction: 'remove_duplicate_start' });
  }
  if (endNodes.length === 0) {
    issues.push({ code: 'MISSING_END', message: '工作流至少需要一个结束节点', level: 'error', fixAction: 'add_end_node' });
  }
  if (endNodes.length > 1) {
    issues.push({ code: 'DUPLICATE_END', message: '工作流只能保留一个结束节点', level: 'error', fixAction: 'remove_duplicate_end' });
  }

  nodes.forEach((node) => {
    if (isStartNode(node.type) || isEndNode(node.type)) {
      return;
    }
    const hasIncoming = edges.some((edge) => edge.target === node.id);
    const hasOutgoing = edges.some((edge) => edge.source === node.id);

    if (!hasIncoming) {
      issues.push({ code: 'MISSING_INCOMING_EDGE', nodeId: node.id, message: `节点「${String(node.data?.label || node.id)}」缺少入边`, level: 'error', fixAction: 'connect_node' });
    }
    if (!hasOutgoing) {
      issues.push({ code: 'MISSING_OUTGOING_EDGE', nodeId: node.id, message: `节点「${String(node.data?.label || node.id)}」缺少出边`, level: 'warning', fixAction: 'connect_node' });
    }
    if (node.type === 'agent' && !(node.data as { config?: { agentId?: string } } | undefined)?.config?.agentId) {
      issues.push({ code: 'AGENT_NOT_BOUND', nodeId: node.id, message: `Agent 节点「${String(node.data?.label || node.id)}」未绑定 Agent`, level: 'error', fixAction: 'bind_agent' });
    }
  });

  return {
    valid: issues.every((issue) => issue.level !== 'error'),
    issues,
  };
}

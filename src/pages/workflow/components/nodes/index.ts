import BaseNode from './BaseNode';
import EndNode from './EndNode';
import StartNode from './StartNode';
import ConditionNode from './ConditionNode';
import LoopNode from './LoopNode';
import ParallelNode from './ParallelNode';

/**
 * ReactFlow 自定义节点类型注册
 * key 与 NodeType 枚举对应
 */
export const nodeTypes = {
  // 触发节点
  start: StartNode,
  trigger_manual: BaseNode,
  trigger_cron: BaseNode,
  trigger_event: BaseNode,
  // 执行节点
  agent: BaseNode,
  document: BaseNode,
  notification: BaseNode,
  database: BaseNode,
  script: BaseNode,
  deviation_analysis: BaseNode,
  quality_report: BaseNode,
  // 控制节点
  human_review: BaseNode,
  condition: ConditionNode,
  loop: LoopNode,
  parallel: ParallelNode,
  // 终止节点
  end: EndNode,
};

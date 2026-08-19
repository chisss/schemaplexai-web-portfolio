import { memo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from 'react-i18next';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  PlayCircleOutlined, ClockCircleOutlined, ThunderboltOutlined,
  RobotOutlined, CodeOutlined, ApiOutlined, SendOutlined, DatabaseOutlined,
  FileTextOutlined,
  AuditOutlined, BranchesOutlined, ForkOutlined, RetweetOutlined, StopOutlined,
} from '@ant-design/icons';
import type { NodeType } from '@/types/workflow';
import { NODE_TYPE_REGISTRY } from '@/types/workflow';
import { ChannelLogo } from '@/pages/integration/channel/channelMeta';

/** 图标映射 */
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  PlayCircleOutlined, ClockCircleOutlined, ThunderboltOutlined,
  RobotOutlined, CodeOutlined, ApiOutlined, SendOutlined, DatabaseOutlined,
  FileTextOutlined,
  AuditOutlined, BranchesOutlined, ForkOutlined, RetweetOutlined, StopOutlined,
};

export interface BaseNodeData {
  label: string;
  config?: Record<string, any>;
  nodeType?: NodeType;
  [key: string]: any;
}

interface BaseNodeProps extends NodeProps {
  data: BaseNodeData;
}

/** 获取节点配置摘要文本 */
function getConfigSummary(
  nodeType: string,
  config: Record<string, any> | undefined,
  t: (key: string, options?: Record<string, any>) => string,
): string {
  if (!config) return '';
  switch (nodeType) {
    case 'agent':
      return config.agentName
        || config.agentRole
        || (config.instructionSource === 'manual' || (!config.instructionSource && config.taskInstruction)
          ? config.taskInstruction?.slice(0, 30)
          : t('workflow.designer.instructionSourceUpstream'))
        || '';
    case 'document':
      return config.documentTitle || config.documentKey || '';
    case 'script':
      return config.language ? `${config.language}` : '';
    case 'api_call':
      return config.url ? `${config.method || 'GET'} ${config.url}`.slice(0, 32) : '';
    case 'notification':
      return config.channelName || config.channelType || config.channel || '';
    case 'database':
      return config.operationType || '';
    case 'human_review':
      return config.reviewerRoles?.join(', ') || '';
    case 'condition':
      return config.expression?.slice(0, 28) || '';
    case 'parallel':
      return config.gatewayType === 'fork' ? t('workflow.designer.split') : t('workflow.designer.merge');
    case 'loop':
      return config.loopType === 'count' ? `×${config.maxIterations || 'N'}` : config.loopType || '';
    case 'trigger_cron':
      return config.cronExpression || '';
    case 'trigger_event':
      return config.eventType || '';
    default:
      return '';
  }
}

function BaseNode({ data, selected, type }: BaseNodeProps) {
  const { t } = useTranslation();
  const nodeType = (data.nodeType || type || 'agent') as NodeType;
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const meta = NODE_TYPE_REGISTRY.find((m) => m.type === nodeType);
  const color = meta?.color || '#165DFF';
  const IconComp = meta ? ICON_MAP[meta.icon] : RobotOutlined;
  const summary = getConfigSummary(nodeType, data.config, t);
  const isTrigger = meta?.category === 'trigger';
  const isEnd = nodeType === 'end';
  const useChannelAvatar = nodeType === 'notification' && !!data.config?.channelType;

  return (
    <div className="relative" style={{ width: 240 }}>
      {/* 入口 Handle */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          style={{
            width: 12, height: 12,
            background: isDark ? '#2A2B2D' : '#ffffff',
            border: `2.5px solid ${color}`,
            top: -6,
            borderRadius: '50%',
            transition: 'all 0.2s',
          }}
        />
      )}

      {/* 节点主体 */}
      <div
        style={{
          boxShadow: selected
            ? `0 0 0 2px ${color}, 0 8px 24px ${color}25`
            : '0 2px 12px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: 14,
          overflow: 'hidden',
          background: isDark ? '#2A2B2D' : '#fff',
        }}
        className="hover:shadow-lg hover:-translate-y-0.5"
      >
        {/* 顶部渐变色带 */}
        <div style={{
          height: 3,
          background: `linear-gradient(90deg, ${color}, ${color}90)`,
        }} />

        {/* 头部区域 */}
        <div className="flex items-center gap-3 px-3.5 py-3">
          {/* 圆形图标 */}
          {useChannelAvatar ? (
            <ChannelLogo type={data.config?.channelType} size={36} />
          ) : (
            <div
              style={{
                width: 36, height: 36, minWidth: 36,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                border: `1.5px solid ${color}30`,
                color: color,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {IconComp && <IconComp />}
            </div>
          )}

          {/* 标题 + 类型 */}
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-semibold truncate"
              style={{ color: isDark ? '#F2F3F5' : '#1D2129', lineHeight: 1.4 }}
            >
              {data.label}
            </div>
            <div
              className="flex items-center gap-1.5 mt-0.5"
            >
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: `${color}12`,
                  color: color,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                }}
              >
                {meta ? t(meta.labelKey) : nodeType}
              </span>
            </div>
          </div>
        </div>

        {/* 配置摘要 */}
        {summary && (
          <div
            className="px-3.5 py-2 text-xs truncate flex items-center gap-1.5"
            style={{
              color: isDark ? '#86909C' : '#4E5969',
              background: isDark ? '#253447' : '#F7F8FA',
              borderTop: isDark ? '1px solid #3D3E40' : '1px solid #f1f5f9',
              fontSize: 11,
            }}
          >
            <div style={{ width: 4, height: 4, borderRadius: 2, background: color, opacity: 0.6 }} />
            {summary}
          </div>
        )}
      </div>

      {/* 出口 Handle */}
      {!isEnd && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            width: 12, height: 12,
            background: color,
            border: isDark ? `2.5px solid #2A2B2D` : '2.5px solid #fff',
            bottom: -6,
            borderRadius: '50%',
            boxShadow: `0 0 0 1px ${color}30`,
            transition: 'all 0.2s',
          }}
        />
      )}
    </div>
  );
}

export default memo(BaseNode);

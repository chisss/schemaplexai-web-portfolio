import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { PlayCircleOutlined } from '@ant-design/icons';
import type { BaseNodeData } from './BaseNode';
import { useAppStore } from '@/store/useAppStore';

/**
 * 开始节点 - 圆形绿色样式
 */
function StartNode({ data, selected }: NodeProps & { data: BaseNodeData }) {
  const color = '#10b981';
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  return (
    <div className="relative flex flex-col items-center" style={{ width: 90 }}>
      {/* 双圆环主体 */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: `radial-gradient(circle at 40% 35%, ${color}08, ${color}15)`,
          border: `2.5px solid ${selected ? color : '#6ee7b7'}`,
          boxShadow: selected
            ? `0 0 0 3px ${color}20, 0 0 20px ${color}15`
            : '0 2px 12px rgba(16,185,129,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
        }}
      >
        {/* 内圆 */}
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${color}20, ${color}10)`,
            border: `1.5px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PlayCircleOutlined style={{ fontSize: 20, color }} />
        </div>
      </div>

      {/* 标签 */}
      <div
        className="text-xs font-semibold mt-2"
        style={{ color: isDark ? '#86909C' : '#4E5969' }}
      >
        {data.label}
      </div>

      {/* 出口 Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: 12, height: 12,
          background: color,
          border: isDark ? '2.5px solid #2A2B2D' : '2.5px solid #fff',
          bottom: -6,
          boxShadow: `0 0 0 1px ${color}30`,
        }}
      />
    </div>
  );
}

export default memo(StartNode);

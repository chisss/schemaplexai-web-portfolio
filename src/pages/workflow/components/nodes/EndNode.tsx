import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { StopOutlined } from '@ant-design/icons';
import type { BaseNodeData } from './BaseNode';
import { useAppStore } from '@/store/useAppStore';

function EndNode({ data, selected }: NodeProps & { data: BaseNodeData }) {
  const color = '#F53F3F';
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  return (
    <div className="relative flex flex-col items-center" style={{ width: 90 }}>
      {/* 入口 Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: 12, height: 12,
          background: isDark ? '#2A2B2D' : '#fff',
          border: `2.5px solid ${color}`,
          top: -6,
        }}
      />

      {/* 双圆环主体 */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: `radial-gradient(circle at 40% 35%, ${color}08, ${color}15)`,
          border: `2.5px solid ${selected ? color : '#fca5a5'}`,
          boxShadow: selected
            ? `0 0 0 3px ${color}20, 0 0 20px ${color}15`
            : '0 2px 12px rgba(245,63,63,0.08)',
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
            background: `linear-gradient(135deg, ${color}15, ${color}08)`,
            border: `1.5px solid ${color}25`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StopOutlined style={{ fontSize: 18, color }} />
        </div>
      </div>

      {/* 标签 */}
      <div
        className="text-xs font-semibold mt-2"
        style={{ color: '#4E5969' }}
      >
        {data.label}
      </div>
    </div>
  );
}

export default memo(EndNode);

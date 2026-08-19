import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { BaseNodeData } from './BaseNode';

function ParallelNode({ data, selected }: NodeProps & { data: BaseNodeData }) {
  const config = data.config || {};
  const isFork = config.gatewayType !== 'join';
  const color = '#8b5cf6';

  return (
    <div className="relative flex flex-col items-center" style={{ width: 130, height: 130 }}>
      {/* 入口 Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: 12, height: 12,
          background: '#fff',
          border: `2.5px solid ${color}`,
          top: -6,
          zIndex: 10,
        }}
      />

      {/* 菱形 */}
      <div className="flex items-center justify-center" style={{ width: 130, height: 110, position: 'relative' }}>
        <svg width="100" height="90" viewBox="0 0 100 90" style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id="paraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`${color}15`} />
              <stop offset="100%" stopColor={`${color}06`} />
            </linearGradient>
            <filter id="paraShadow">
              <feDropShadow dx="0" dy="2" stdDeviation={selected ? 5 : 2.5} floodColor={selected ? color : '#000'} floodOpacity={selected ? 0.2 : 0.06} />
            </filter>
          </defs>
          <path
            d="M50 5 L95 45 L50 85 L5 45 Z"
            fill="url(#paraGrad)"
            stroke={selected ? color : '#d4d4d8'}
            strokeWidth={selected ? 2.5 : 1.5}
            filter="url(#paraShadow)"
            style={{ transition: 'all 0.25s ease' }}
          />
        </svg>

        {/* Fork/Join 图标 */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <div
            style={{
              width: 30, height: 30,
              borderRadius: '50%',
              background: `${color}15`,
              border: `1.5px solid ${color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 2px',
              fontSize: 16, fontWeight: 700, color,
            }}
          >
            {isFork ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2V8M8 8L4 12M8 8L12 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L8 8M12 4L8 8M8 8V14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className="text-xs font-medium" style={{ color: '#4E5969', fontSize: 10 }}>
            {isFork ? 'Fork' : 'Join'}
          </div>
        </div>
      </div>

      {/* 标签 */}
      <div
        className="text-xs font-semibold text-center truncate"
        style={{ color: '#1D2129', maxWidth: 100, marginTop: -8, fontSize: 11 }}
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
          border: '2.5px solid #fff',
          bottom: -6,
          boxShadow: `0 0 0 1px ${color}30`,
        }}
      />
    </div>
  );
}

export default memo(ParallelNode);

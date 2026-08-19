import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { BranchesOutlined } from '@ant-design/icons';
import type { BaseNodeData } from './BaseNode';
import { useAppStore } from '@/store/useAppStore';

function ConditionNode({ data, selected }: NodeProps & { data: BaseNodeData }) {
  const config = data.config || {};
  const color = '#8b5cf6';
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  return (
    <div className="relative flex flex-col items-center" style={{ width: 170, height: 150 }}>
      {/* 入口 Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: 12, height: 12,
          background: isDark ? '#2A2B2D' : '#fff',
          border: `2.5px solid ${color}`,
          top: -6,
          zIndex: 10,
        }}
      />

      {/* 菱形容器 */}
      <div className="flex items-center justify-center" style={{ width: 170, height: 130, position: 'relative' }}>
        {/* SVG 菱形 */}
        <svg width="130" height="110" viewBox="0 0 130 110" style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id="condGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`${color}12`} />
              <stop offset="100%" stopColor={`${color}06`} />
            </linearGradient>
            <filter id="condShadow">
              <feDropShadow dx="0" dy="2" stdDeviation={selected ? 6 : 3} floodColor={selected ? color : '#000'} floodOpacity={selected ? 0.25 : 0.08} />
            </filter>
          </defs>
          <path
            d="M65 6 L124 55 L65 104 L6 55 Z"
            fill="url(#condGrad)"
            stroke={selected ? color : '#d4d4d8'}
            strokeWidth={selected ? 2.5 : 1.5}
            filter="url(#condShadow)"
            style={{ transition: 'all 0.25s ease' }}
          />
        </svg>

        {/* 内容 */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginTop: -4 }}>
          <div
            style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: `${color}15`,
              border: `1.5px solid ${color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 4px',
            }}
          >
            <BranchesOutlined style={{ fontSize: 15, color }} />
          </div>
          <div
            className="text-xs font-semibold truncate"
            style={{ color: '#1D2129', maxWidth: 90 }}
          >
            {data.label}
          </div>
        </div>
      </div>

      {/* True 分支 Handle - 右侧 */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{
          width: 12, height: 12,
          background: '#10b981',
          border: '2.5px solid #fff',
          right: 5,
          top: '50%',
          transform: 'translateY(-50%)',
          boxShadow: '0 0 0 1px #10b98130',
        }}
      />
      <div
        className="absolute flex items-center gap-1"
        style={{
          right: -38,
          top: '50%',
          transform: 'translateY(-50%) translateY(-12px)',
        }}
      >
        <span style={{
          fontSize: 10, fontWeight: 600, color: '#10b981',
          background: '#ecfdf5', padding: '1px 6px', borderRadius: 8,
        }}>
          {config.trueLabel || 'Yes'}
        </span>
      </div>

      {/* False 分支 Handle - 底部 */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{
          width: 12, height: 12,
          background: '#F53F3F',
          border: '2.5px solid #fff',
          bottom: 2,
          boxShadow: '0 0 0 1px #F53F3F30',
        }}
      />
      <div
        className="absolute"
        style={{
          bottom: -14,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <span style={{
          fontSize: 10, fontWeight: 600, color: '#F53F3F',
          background: '#fef2f2', padding: '1px 6px', borderRadius: 8,
        }}>
          {config.falseLabel || 'No'}
        </span>
      </div>
    </div>
  );
}

export default memo(ConditionNode);

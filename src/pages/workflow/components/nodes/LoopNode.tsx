import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { RetweetOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { BaseNodeData } from './BaseNode';

function LoopNode({ data, selected }: NodeProps & { data: BaseNodeData }) {
  const { t } = useTranslation();
  const config = data.config || {};
  const color = '#8b5cf6';

  const loopLabel = config.loopType === 'count'
    ? t('workflow.designer.loopCountLabel', { count: config.maxIterations || 'N' })
    : config.loopType === 'foreach'
      ? t('workflow.designer.loopForeach')
      : t('workflow.designer.loopWhile');

  return (
    <div className="relative" style={{ width: 240 }}>
      {/* 入口 Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: 12, height: 12,
          background: '#fff',
          border: `2.5px solid ${color}`,
          top: -6,
        }}
      />

      {/* 节点主体 */}
      <div
        style={{
          boxShadow: selected
            ? `0 0 0 2px ${color}, 0 8px 24px ${color}25`
            : '0 2px 12px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: 14,
          overflow: 'hidden',
          background: '#fff',
          position: 'relative',
        }}
      >
        {/* 顶部渐变色带 */}
        <div style={{
          height: 3,
          background: `linear-gradient(90deg, ${color}, ${color}60)`,
        }} />

        {/* 右边缘循环虚线装饰 */}
        <div style={{
          position: 'absolute', right: 0, top: 3, bottom: 0, width: 3,
          borderRight: `2.5px dashed ${color}40`,
          borderRadius: '0 14px 14px 0',
        }} />

        {/* 头部 */}
        <div className="flex items-center gap-3 px-3.5 py-3">
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
            <RetweetOutlined />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: '#1D2129', lineHeight: 1.4 }}>
              {data.label}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: `${color}12`,
                  color: color,
                  fontSize: 10,
                  fontWeight: 500,
                }}
                >
                {t('workflow.designer.loop')}
              </span>
            </div>
          </div>
        </div>

        {/* 循环信息 */}
        <div
          className="px-3.5 py-2 text-xs flex items-center gap-1.5"
          style={{
            color: '#4E5969',
            background: '#F7F8FA',
            borderTop: '1px solid #f1f5f9',
            fontSize: 11,
          }}
        >
          <RetweetOutlined style={{ fontSize: 10, color: `${color}80` }} />
          {loopLabel}
        </div>
      </div>

      {/* 循环体输出 Handle - 底部 */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="loop-body"
        style={{
          width: 12, height: 12,
          background: color,
          border: '2.5px solid #fff',
          bottom: -6,
          boxShadow: `0 0 0 1px ${color}30`,
        }}
      />
      <div className="absolute" style={{ bottom: -20, left: '50%', transform: 'translateX(-50%)' }}>
        <span style={{
          fontSize: 9, fontWeight: 600, color,
          background: `${color}10`, padding: '1px 6px', borderRadius: 8,
        }}>
          {t('workflow.designer.loopBody')}
        </span>
      </div>

      {/* 循环出口 Handle - 右侧 */}
      <Handle
        type="source"
        position={Position.Right}
        id="loop-exit"
        style={{
          width: 12, height: 12,
          background: '#10b981',
          border: '2.5px solid #fff',
          right: -6,
          top: '50%',
          transform: 'translateY(-50%)',
          boxShadow: '0 0 0 1px #10b98130',
        }}
      />
      <div className="absolute" style={{ right: -36, top: '50%', transform: 'translateY(-50%) translateY(-12px)' }}>
        <span style={{
          fontSize: 9, fontWeight: 600, color: '#10b981',
          background: '#ecfdf5', padding: '1px 6px', borderRadius: 8,
        }}>
          {t('workflow.designer.loopExit')}
        </span>
      </div>
    </div>
  );
}

export default memo(LoopNode);

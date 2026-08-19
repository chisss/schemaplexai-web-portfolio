import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { CloseCircleFilled } from '@ant-design/icons';

interface CustomEdgeData {
  condition?: string;
}

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // 根据条件确定连线颜色
  const condition = (data as CustomEdgeData | undefined)?.condition;
  let strokeColor = selected ? '#165DFF' : '#b4bfcc';
  if (condition === 'true') strokeColor = '#10b981';
  if (condition === 'false') strokeColor = '#F53F3F';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? 2.5 : 1.5,
          transition: 'stroke 0.2s',
        }}
      />
      <EdgeLabelRenderer>
        {/* 连线标签 */}
        {label && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              fontSize: 10,
              fontWeight: 500,
              color: strokeColor,
              background: '#fff',
              padding: '1px 6px',
              borderRadius: 4,
              border: `1px solid ${strokeColor}40`,
              whiteSpace: 'nowrap',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        )}
        {/* 删除按钮 - 选中时显示 */}
        {selected && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - (label ? 18 : 0)}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <CloseCircleFilled
              style={{ fontSize: 14, color: '#F53F3F', cursor: 'pointer', background: '#fff', borderRadius: '50%' }}
            />
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(CustomEdge);

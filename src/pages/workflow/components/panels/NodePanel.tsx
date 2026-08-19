import { Collapse, Typography } from 'antd';
import {
  PlayCircleOutlined, ClockCircleOutlined, ThunderboltOutlined,
  RobotOutlined, CodeOutlined, ApiOutlined, SendOutlined, DatabaseOutlined,
  FileTextOutlined,
  AuditOutlined, BranchesOutlined, ForkOutlined, RetweetOutlined, StopOutlined,
  HolderOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { NODE_TYPE_REGISTRY, type NodeCategory } from '@/types/workflow';

const { Text } = Typography;

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  PlayCircleOutlined, ClockCircleOutlined, ThunderboltOutlined,
  RobotOutlined, CodeOutlined, ApiOutlined, SendOutlined, DatabaseOutlined,
  FileTextOutlined,
  AuditOutlined, BranchesOutlined, ForkOutlined, RetweetOutlined, StopOutlined,
};

const CATEGORY_CONFIG: Record<NodeCategory | 'end', { labelKey: string; color: string; icon: string }> = {
  trigger: { labelKey: 'workflow.designer.nodeCategoryTrigger', color: '#10b981', icon: '⚡' },
  execution: { labelKey: 'workflow.designer.nodeCategoryExecution', color: '#165DFF', icon: '🔧' },
  control: { labelKey: 'workflow.designer.nodeCategoryControl', color: '#8b5cf6', icon: '🔀' },
  end: { labelKey: 'workflow.designer.nodeCategoryEnd', color: '#F53F3F', icon: '⏹' },
};

export default function NodePanel() {
  const { t } = useTranslation();
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  // 按分类分组节点
  const groups = (['trigger', 'execution', 'control', 'end'] as const).map((cat) => ({
    category: cat,
    ...CATEGORY_CONFIG[cat],
    nodes: NODE_TYPE_REGISTRY.filter((n) => n.category === cat),
  }));

  return (
    <div
      className="h-full flex flex-col"
      style={{
        width: 260,
        background: isDark
          ? 'linear-gradient(180deg, #1a2332 0%, #162130 100%)'
          : 'linear-gradient(180deg, #F7F8FA 0%, #f1f5f9 100%)',
        borderRight: isDark ? '1px solid #3D3E40' : '1px solid #e2e8f0',
      }}
    >
      {/* 标题区域 */}
      <div
        className="px-4 py-3.5"
        style={{
          borderBottom: isDark ? '1px solid #3D3E40' : '1px solid #e2e8f0',
          background: isDark ? 'rgba(42,43,45,0.9)' : 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center gap-2">
          <div style={{
            width: 28, height: 28,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13,
          }}>
            <ForkOutlined />
          </div>
          <div>
            <Text strong style={{ fontSize: 13, color: isDark ? '#F2F3F5' : '#1D2129', display: 'block', lineHeight: 1.3 }}>
              {t('workflow.designer.nodePanelTitle')}
            </Text>
            <div style={{ fontSize: 10, color: '#86909C', lineHeight: 1.3 }}>
              {t('workflow.designer.nodePanelHint')}
            </div>
          </div>
        </div>
      </div>

      {/* 分组列表 */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2" style={{ scrollbarWidth: 'thin' }}>
        <Collapse
          ghost
          defaultActiveKey={['trigger', 'execution', 'control', 'end']}
          expandIconPlacement="end"
          style={{ background: 'transparent' }}
          items={groups.map((group) => ({
            key: group.category,
            label: (
              <div className="flex items-center gap-2">
                <div
                  style={{
                    width: 20, height: 20,
                    borderRadius: 6,
                    background: `${group.color}15`,
                    border: `1px solid ${group.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10,
                  }}
                >
                  {group.icon}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#86909C' : '#1D2129' }}>
                  {t(group.labelKey)}
                </span>
                <span
                  className="px-1.5 rounded-full"
                  style={{
                    fontSize: 10,
                    color: group.color,
                    background: `${group.color}10`,
                    fontWeight: 500,
                    lineHeight: '18px',
                  }}
                >
                  {group.nodes.length}
                </span>
              </div>
            ),
            children: (
              <div className="flex flex-col gap-1.5 pb-1">
                {group.nodes.map((node) => {
                  const Icon = ICON_MAP[node.icon];
                  const nodeLabel = t(node.labelKey);
                  const nodeDesc = t(node.descriptionKey);
                  return (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, node.type, nodeLabel)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-grab active:cursor-grabbing group"
                      style={{
                        background: isDark ? '#253447' : '#fff',
                        border: isDark ? '1px solid #3D3E40' : '1px solid #e8ecf1',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget;
                        el.style.borderColor = `${node.color}50`;
                        el.style.background = `${node.color}04`;
                        el.style.boxShadow = `0 2px 8px ${node.color}15, 0 0 0 1px ${node.color}10`;
                        el.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget;
                        el.style.borderColor = isDark ? '#3D3E40' : '#e8ecf1';
                        el.style.background = isDark ? '#253447' : '#fff';
                        el.style.boxShadow = 'none';
                        el.style.transform = 'translateX(0)';
                      }}
                    >
                      {/* 左侧彩色指示条 */}
                      <div style={{
                        position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3,
                        borderRadius: '0 3px 3px 0',
                        background: node.color,
                        opacity: 0.5,
                        transition: 'opacity 0.2s',
                      }} />

                      {/* 圆形渐变图标 */}
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 32, height: 32, minWidth: 32,
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${node.color}18, ${node.color}08)`,
                          border: `1.5px solid ${node.color}25`,
                          color: node.color,
                          fontSize: 14,
                        }}
                      >
                        {Icon && <Icon />}
                      </div>

                      {/* 文字区域 */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: isDark ? '#C9CDD4' : '#1D2129', lineHeight: 1.4 }}>
                          {nodeLabel}
                        </div>
                        <div className="text-xs truncate" style={{ color: '#86909C', fontSize: 10, lineHeight: 1.4 }}>
                          {nodeDesc}
                        </div>
                      </div>

                      {/* 拖拽手柄 */}
                      <HolderOutlined
                        style={{
                          fontSize: 10,
                          color: '#C9CDD4',
                          transition: 'color 0.2s',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ),
          }))}
        />
      </div>
    </div>
  );
}

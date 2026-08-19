import { Button, Divider, Space, Tooltip } from 'antd';
import {
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ExpandOutlined,
  ThunderboltOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';

interface DesignerToolbarProps {
  onSave: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onBack: () => void;
  onAiArrange?: () => void;
  saving?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
}

export default function DesignerToolbar({
  onSave,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitView,
  onBack,
  onAiArrange,
  saving = false,
  canUndo = false,
  canRedo = false,
}: DesignerToolbarProps) {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center justify-between px-4 py-2"
      style={{
        background: isDark ? '#2A2B2D' : '#fff',
        borderBottom: isDark ? '1px solid #3D3E40' : '1px solid #e2e8f0',
        height: 48,
      }}
    >
      {/* 左侧操作 */}
      <Space size={4}>
        <Tooltip title={t('common.back')}>
          <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={onBack} />
        </Tooltip>
        <Divider vertical style={{ margin: '0 4px' }} />
        <Tooltip title={t('workflow.designer.undo')}>
          <Button type="text" size="small" icon={<UndoOutlined />} onClick={onUndo} disabled={!canUndo} />
        </Tooltip>
        <Tooltip title={t('workflow.designer.redo')}>
          <Button type="text" size="small" icon={<RedoOutlined />} onClick={onRedo} disabled={!canRedo} />
        </Tooltip>
        <Divider vertical style={{ margin: '0 4px' }} />
        <Tooltip title={t('workflow.designer.zoomIn')}>
          <Button type="text" size="small" icon={<ZoomInOutlined />} onClick={onZoomIn} />
        </Tooltip>
        <Tooltip title={t('workflow.designer.zoomOut')}>
          <Button type="text" size="small" icon={<ZoomOutOutlined />} onClick={onZoomOut} />
        </Tooltip>
        <Tooltip title={t('workflow.designer.fitView')}>
          <Button type="text" size="small" icon={<ExpandOutlined />} onClick={onFitView} />
        </Tooltip>
      </Space>

      {/* 右侧操作 */}
      <Space size={8}>
        <Button
          size="small"
          icon={<ThunderboltOutlined />}
          onClick={onAiArrange}
          disabled={!onAiArrange}
          style={{
            background: 'linear-gradient(135deg, #165DFF 0%, #0E42D2 100%)',
            color: '#fff',
            border: 'none',
          }}
        >
          {t('workflow.designer.aiArrangeAction')}
        </Button>
        <Button
          size="small"
          type="primary"
          icon={<SaveOutlined />}
          onClick={onSave}
          loading={saving}
        >
          {t('common.save')}
        </Button>
      </Space>
    </div>
  );
}

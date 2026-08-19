/**
 * 关注的快捷入口卡片组件
 * 显示用户正在关注的 Spec、工作流、项目等
 */
import { Card, Row, Col, Typography, Button } from 'antd';
import {
  StarOutlined,
  FileTextOutlined,
  ApiOutlined,
  ProjectOutlined,
  PlusOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';

const { Text } = Typography;

interface WatchedItem {
  type: 'spec' | 'workflow' | 'project';
  title: string;
  description?: string;
  count: number;
  path: string;
}

export default function WatchedItemsCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  // TODO: 后续接入后端 API 获取用户关注的列表
  // 目前使用静态数据展示布局
  const watchedItems: WatchedItem[] = [
    {
      type: 'spec',
      title: t('menu.spec'),
      description: t('dashboard.watchedSpecsDesc'),
      count: 0,
      path: '/spec',
    },
    {
      type: 'workflow',
      title: t('menu.workflow'),
      description: t('dashboard.watchedWorkflowsDesc'),
      count: 0,
      path: '/workflow',
    },
    {
      type: 'project',
      title: t('menu.projectManagement'),
      description: t('dashboard.watchedProjectsDesc'),
      count: 0,
      path: '/project',
    },
  ];

  const getIcon = (type: string) => {
    const iconStyle = { fontSize: 20 };
    switch (type) {
      case 'spec':
        return <FileTextOutlined style={{ ...iconStyle, color: '#165DFF' }} />;
      case 'workflow':
        return <ApiOutlined style={{ ...iconStyle, color: '#22c55e' }} />;
      case 'project':
        return <ProjectOutlined style={{ ...iconStyle, color: '#FF7D00' }} />;
      default:
        return <StarOutlined style={{ ...iconStyle, color: '#4E5969' }} />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'spec':
        return 'rgba(22, 93, 255, 0.08)';
      case 'workflow':
        return 'rgba(34, 197, 94, 0.08)';
      case 'project':
        return 'rgba(255, 125, 0, 0.08)';
      default:
        return 'rgba(100, 116, 139, 0.08)';
    }
  };

  return (
    <Card
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StarOutlined style={{ color: '#FF7D00' }} />
          <span style={{ fontWeight: 600 }}>{t('dashboard.watchedItems')}</span>
        </span>
      }
      extra={
        <Button type="link" size="small" icon={<PlusOutlined />}>
          {t('common.add')}
        </Button>
      }
      style={{
        border: isDark ? '1px solid #313233' : '1px solid #e5e7eb',
        borderRadius: 12,
        height: '100%',
      }}
      styles={{ body: { padding: '12px 16px' } }}
    >
      <Row gutter={[12, 12]}>
        {watchedItems.map((item, index) => (
          <Col span={24} key={index}>
            <div
              style={{
                position: 'relative',
                padding: '14px 16px',
                borderRadius: 10,
                background: isDark ? '#2A2B2D' : '#F7F8FA',
                border: isDark ? '1px solid #3D3E40' : '1px solid #e5e7eb',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#165DFF';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDark ? '#3D3E40' : '#e5e7eb';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <button
                type="button"
                aria-label={item.title}
                onClick={() => navigate(item.path)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  padding: 0,
                  border: 'none',
                  borderRadius: 10,
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'none' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: getBgColor(item.type),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getIcon(item.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: isDark ? '#F2F3F5' : '#1D2129' }}>
                    {item.title}
                  </div>
                  <Text
                    type="secondary"
                    style={{ fontSize: 12 }}
                    ellipsis
                  >
                    {item.description}
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item.count > 0 && (
                    <span
                      style={{
                        background: '#165DFF',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {item.count}
                    </span>
                  )}
                  <ArrowRightOutlined style={{ color: '#86909C', fontSize: 12 }} />
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
}

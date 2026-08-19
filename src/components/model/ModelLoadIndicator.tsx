/**
 * 模型负载指示器组件
 * 展示各模型负载进度条和状态标签
 */
import { Card, Progress, Tag, Space, Typography, Tooltip } from 'antd';
import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

interface ModelLoad {
  modelId: string;
  modelName: string;
  provider?: string;
  currentLoad: number;
  maxLoad: number;
  status: 'normal' | 'busy' | 'full';
  /** 模型组 ID */
  groupId?: string;
  /** 排序顺序 */
  sortOrder?: number;
}

interface ModelLoadIndicatorProps {
  models: ModelLoad[];
  /** 是否显示模型组信息 */
  showGroupInfo?: boolean;
  /** 是否显示详情 */
  showDetails?: boolean;
  onModelClick?: (modelId: string) => void;
}

export default function ModelLoadIndicator({
  models,
  showGroupInfo,
  showDetails,
  onModelClick,
}: ModelLoadIndicatorProps) {
  const { t } = useTranslation();

  const getStatusConfig = (status: ModelLoad['status']) => {
    const configMap = {
      normal: {
        color: '#059669',
        bgColor: 'rgba(16,185,129,0.10)',
        icon: <CheckCircleFilled />,
        text: t('modelLoad.statusNormal'),
      },
      busy: {
        color: '#FF7D00',
        bgColor: 'rgba(255,125,0,0.10)',
        icon: <ClockCircleFilled />,
        text: t('modelLoad.statusBusy'),
      },
      full: {
        color: '#F53F3F',
        bgColor: 'rgba(245,63,63,0.10)',
        icon: <CloseCircleFilled />,
        text: t('modelLoad.statusFull'),
      },
    };
    return configMap[status];
  };

  const getProgressStatus = (status: ModelLoad['status']): 'success' | 'normal' | 'exception' | 'active' => {
    if (status === 'full') return 'exception';
    if (status === 'busy') return 'normal';
    return 'success';
  };

  const percent = (model: ModelLoad) => Math.min(100, Math.round((model.currentLoad / model.maxLoad) * 100));

  return (
    <Card size="small">
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Title level={5} style={{ margin: 0 }}>
          {t('modelLoad.title')}
        </Title>

        {models.map((model) => {
          const statusConfig = getStatusConfig(model.status);

          return (
            <div
              key={model.modelId}
              onClick={() => onModelClick?.(model.modelId)}
              style={{
                cursor: onModelClick ? 'pointer' : 'default',
                padding: 8,
                borderRadius: 6,
                background: statusConfig.bgColor,
              }}
            >
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <Text strong={showDetails}>{model.modelName}</Text>
                  {showGroupInfo && model.groupId && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ({model.groupId})
                    </Text>
                  )}
                  {model.provider && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {model.provider}
                    </Text>
                  )}
                </Space>
                <Tooltip title={statusConfig.text}>
                  <Space>
                    {statusConfig.icon}
                    <Tag
                      color={statusConfig.color}
                      style={{ fontSize: 10, padding: '0 4px' }}
                    >
                      {statusConfig.text}
                    </Tag>
                  </Space>
                </Tooltip>
              </Space>

              <Progress
                percent={percent(model)}
                size="small"
                status={getProgressStatus(model.status)}
                style={{ marginTop: 4, marginBottom: 2 }}
              />

              {showDetails && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {model.currentLoad} / {model.maxLoad} ({percent(model)}%)
                </Text>
              )}
            </div>
          );
        })}
      </Space>
    </Card>
  );
}

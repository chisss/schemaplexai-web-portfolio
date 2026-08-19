import { App as AntApp, Card, Descriptions, Button, Tag, Space, Typography, Timeline, Alert, Spin, Badge } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import PageContainer from '@/components/PageContainer/PageContainer';
import MarkdownPreview from '@/components/MarkdownPreview/MarkdownPreview';
import { useAppStore } from '@/store/useAppStore';
import { useDeviationDetail, useDetectDeviation, useUpdateDeviationStatus } from '@/api/quality';
import { formatDateTime } from '@/utils/date';

const { Text } = Typography;

function normalizeStatus(status?: string) {
  return (status || '').toLowerCase() || 'open';
}

function statusMeta(status?: string) {
  const value = normalizeStatus(status);
  if (value === 'resolved') return { text: '已关闭', color: 'success' as const };
  if (value === 'acknowledged') return { text: '已确认', color: 'processing' as const };
  if (value === 'ignored') return { text: '已忽略', color: 'default' as const };
  return { text: '待处理', color: 'error' as const };
}

export default function QualityDetail() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const { data: deviationData, isLoading, refetch } = useDeviationDetail(id!);
  const updateStatus = useUpdateDeviationStatus();
  const detectDeviation = useDetectDeviation();
  const [scanning, setScanning] = useState(false);

  const currentStatus = normalizeStatus(deviationData?.status);
  const currentStatusMeta = statusMeta(deviationData?.status);
  const canResolve = currentStatus !== 'resolved';
  const canRescan = !!deviationData?.specId && !!deviationData?.agentExecutionId;

  return (
    <PageContainer
      title={t('quality.detailTitle')}
      extra={
        <Space>
          <Button
            icon={<CheckCircleOutlined />}
            type="primary"
            disabled={!canResolve}
            loading={updateStatus.isPending}
            onClick={() => {
              if (!id) return;
              updateStatus.mutate(
                { id, data: { status: 'resolved', remark: '质量中心手工关闭' } },
                { onSuccess: () => message.success('已标记为关闭') },
              );
            }}
          >
            {t('quality.markResolved')}
          </Button>
          <Button
            icon={<SyncOutlined spin={scanning} />}
            disabled={!canRescan || scanning}
            loading={detectDeviation.isPending}
            onClick={() => {
              if (!deviationData?.specId || !deviationData?.agentExecutionId) {
                message.warning('当前记录缺少可重扫的执行上下文');
                return;
              }
              setScanning(true);
              detectDeviation.mutate(
                {
                  specId: deviationData.specId,
                  agentExecutionId: deviationData.agentExecutionId,
                },
                {
                  onSuccess: () => {
                    message.success('检测任务已提交，正在刷新结果...');
                    // 延迟刷新详情数据，给后端处理时间
                    setTimeout(() => {
                      refetch().finally(() => setScanning(false));
                    }, 3000);
                  },
                  onError: () => {
                    setScanning(false);
                  },
                },
              );
            }}
          >
            {t('quality.rescan')}
          </Button>
          {!canRescan ? (
            <Text type="secondary">当前记录不支持重新扫描</Text>
          ) : null}
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>{t('common.back')}</Button>
        </Space>
      }
    >
      <Spin spinning={isLoading}>
      <div className="flex flex-col gap-8">
        <Alert
          title={`${t('quality.deviationItem')}${deviationData?.title ?? ''}`}
          description={deviationData?.description ?? ''}
          type="error"
          showIcon
          style={{ borderRadius: 12 }}
        />

        <Card title={t('quality.basicInfo')} variant="borderless" className="shadow-sm">
            <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="middle">
              <Descriptions.Item label={t('quality.deviationType')}>
                <Tag color="blue">{deviationData?.deviationTypeLabel ?? deviationData?.deviationType ?? ''}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('quality.severity')}>
              <Tag color="red">{deviationData?.severityLabel ?? deviationData?.severity ?? ''}</Tag>
            </Descriptions.Item>
              <Descriptions.Item label={t('common.status')}>
                <Badge status={currentStatusMeta.color} text={currentStatusMeta.text} />
              </Descriptions.Item>
              <Descriptions.Item label={t('quality.projectSpec')}>
                {deviationData?.projectName ? `${deviationData.projectName} / ${deviationData.specName}` : deviationData?.specName ?? ''}
              </Descriptions.Item>
              <Descriptions.Item label={t('quality.filePath')}>{deviationData?.filePath ?? '-'}</Descriptions.Item>
              <Descriptions.Item label={t('quality.detectionTime')}>
                {deviationData?.createdAt ? formatDateTime(deviationData.createdAt) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="来源类型">{deviationData?.sourceType || '-'}</Descriptions.Item>
              <Descriptions.Item label="关联任务ID">{deviationData?.taskId || '-'}</Descriptions.Item>
              <Descriptions.Item label="执行ID">{deviationData?.agentExecutionId || '-'}</Descriptions.Item>
              <Descriptions.Item label="工作空间ID">{deviationData?.workspaceId || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

        <div className="flex flex-col gap-6 xl:flex-row">
          <Card title={t('quality.specIntent')} variant="borderless" className="shadow-sm flex-1" styles={{ body: { padding: 20 } }}>
            <MarkdownPreview content={deviationData?.expectedValue ? `\`\`\`\n${deviationData.expectedValue}\n\`\`\`` : t('common.noData')} />
          </Card>
          <Card title={t('quality.actualCode')} variant="borderless" className="shadow-sm flex-1" styles={{ body: { padding: 20, background: isDark ? 'rgba(153, 27, 27, 0.2)' : '#FEF2F2' } }}>
            <MarkdownPreview content={deviationData?.actualValue ? `\`\`\`\n${deviationData.actualValue}\n\`\`\`` : t('common.noData')} />
          </Card>
        </div>

        <Card title={t('quality.timeline.title')} variant="borderless" className="shadow-sm" styles={{ body: { paddingTop: 20 } }}>
          <Timeline
            items={[
              {
                color: 'red',
                content: (
                  <>
                    <p className="font-medium">{t('quality.timeline.detected')}</p>
                    <Text type="secondary" className="text-xs">
                      {deviationData?.createdAt ? formatDateTime(deviationData.createdAt) : '-'}
                    </Text>
                  </>
                ),
              },
              ...(deviationData?.resolvedAt ? [{
                color: 'green' as const,
                content: (
                  <>
                    <p className="font-medium">{t('quality.timeline.resolved')} - {deviationData?.resolvedByName ?? ''}</p>
                    <Text type="secondary" className="text-xs">{formatDateTime(deviationData.resolvedAt)}</Text>
                  </>
                ),
              }] : [{
                color: 'blue' as const,
                content: (
                  <>
                    <p className="font-medium">{t('quality.timeline.blocked')}</p>
                    <Text type="secondary" className="text-xs">{t('quality.timeline.currentStatus')}</Text>
                  </>
                ),
              }]),
            ]}
          />
        </Card>
      </div>
      </Spin>
    </PageContainer>
  );
}

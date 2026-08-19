import { useMemo } from 'react';
import { Alert, Button, Card, Descriptions, Empty, List, Space, Spin, Tabs, Tag, Typography, message } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import MarkdownPreview from '@/components/MarkdownPreview/MarkdownPreview';
import { downloadArtifact, useArtifactDetail } from '@/api/artifact';
import { formatDateTime } from '@/utils/date';

const { Text } = Typography;

export default function ArtifactDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: artifact, isLoading, isError } = useArtifactDetail(id!);

  const bundleItems = useMemo(() => {
    const raw = artifact?.metadataJson?.bundleItems;
    return Array.isArray(raw) ? raw : [];
  }, [artifact]);

  const handleDownload = async () => {
    if (!id) {
      return;
    }
    try {
      await downloadArtifact(id);
    } catch {
      message.error(t('artifact.downloadFailed'));
    }
  };

  if (isLoading) {
    return (
      <PageContainer title={t('artifact.center')}>
        <div className="flex items-center justify-center h-64">
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !artifact) {
    return (
      <PageContainer
        title={t('artifact.center')}
        extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>{t('common.back')}</Button>}
      >
        <Alert type="error" showIcon message={t('artifact.loadFailed')} />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={artifact.title || artifact.name}
      extra={(
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            {t('artifact.download')}
          </Button>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            {t('common.back')}
          </Button>
        </Space>
      )}
    >
      <Card variant="borderless" className="shadow-sm mb-4">
        <Descriptions bordered column={2}>
          <Descriptions.Item label={t('common.name')}>{artifact.name}</Descriptions.Item>
          <Descriptions.Item label={t('common.type')}>
            <Space>
              <Tag>{artifact.artifactType}</Tag>
              {artifact.format ? <Tag color="blue">{artifact.format}</Tag> : null}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={t('artifact.latestVersion')}>{artifact.latestVersion ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('common.updateTime')}>
            {artifact.updatedAt ? formatDateTime(artifact.updatedAt) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Spec ID">{artifact.specId || '-'}</Descriptions.Item>
          <Descriptions.Item label="Workflow ID">{artifact.workflowInstanceId || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs
        size="large"
        items={[
          {
            key: 'preview',
            label: t('artifact.preview'),
            children: (
              <Card variant="borderless" className="shadow-sm">
                {artifact.contentText ? (
                  <MarkdownPreview content={artifact.contentText} />
                ) : (
                  <Empty description={t('artifact.empty')} />
                )}
              </Card>
            ),
          },
          {
            key: 'variants',
            label: t('artifact.variantList'),
            children: (
              <Card variant="borderless" className="shadow-sm">
                {bundleItems.length > 0 ? (
                  <List
                    dataSource={bundleItems}
                    renderItem={(item: any) => (
                      <List.Item>
                        <div style={{ width: '100%' }}>
                          <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <Space>
                              <Tag color="blue">{item.variantKey || '-'}</Tag>
                              <Text strong>{item.title || item.fileName}</Text>
                            </Space>
                            <MarkdownPreview content={item.content || ''} />
                          </Space>
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description={t('artifact.noVariants')} />
                )}
              </Card>
            ),
          },
          {
            key: 'delivery',
            label: t('artifact.deliveryRecords'),
            children: (
              <Card variant="borderless" className="shadow-sm">
                {artifact.deliveries?.length ? (
                  <List
                    dataSource={artifact.deliveries}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={(
                            <Space>
                              <Tag>{item.deliveryType}</Tag>
                              <span>{item.targetPath || item.targetUri || '-'}</span>
                            </Space>
                          )}
                          description={`${item.message || '-'} ${item.deliveredAt ? `· ${formatDateTime(item.deliveredAt)}` : ''}`}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description={t('artifact.noDelivery')} />
                )}
              </Card>
            ),
          },
          {
            key: 'versions',
            label: t('artifact.versionHistory'),
            children: (
              <Card variant="borderless" className="shadow-sm">
                {artifact.versions?.length ? (
                  <List
                    dataSource={artifact.versions}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={`${t('artifact.versionPrefix')} ${item.versionNumber}`}
                          description={item.createdAt ? formatDateTime(item.createdAt) : '-'}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description={t('artifact.noVersions')} />
                )}
              </Card>
            ),
          },
        ]}
      />
    </PageContainer>
  );
}

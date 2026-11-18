import { Alert, Card, Col, Collapse, Descriptions, Empty, Row, Space, Statistic, Typography } from 'antd';
import type { CrossReview } from '@/types/quality';
import { useTranslation } from 'react-i18next';

const { Paragraph, Text, Title } = Typography;

function JsonBlock({ value }: { value?: unknown }) {
  const { t } = useTranslation();
  if (!value) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('quality.crossReview.noData')} />;
  }
  return (
    <pre style={{ margin: 0, padding: 12, borderRadius: 8, background: 'var(--color-bg-container-disabled)', overflow: 'auto' }}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function extractMergedFindings(review?: CrossReview) {
  const mergedResult = review?.mergedResult as Record<string, any> | undefined;
  if (Array.isArray(mergedResult?.findings)) {
    return mergedResult.findings;
  }
  if (Array.isArray(mergedResult?.issues)) {
    return mergedResult.issues;
  }
  return [];
}

export default function CrossReviewDetailView({ review }: { review?: CrossReview }) {
  const { t } = useTranslation();
  if (!review) {
    return <Empty description={t('quality.crossReview.selectRecord')} />;
  }

  const mergedFindings = extractMergedFindings(review);
  const consensus = (review.summary as Record<string, any> | undefined)?.consensusRate;
  const criticalCount = mergedFindings.filter((item: any) => (item?.severity || '').toLowerCase() === 'critical').length;

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card size="small">
            <Statistic title={t('quality.crossReview.mergedFindingsCount')} value={mergedFindings.length} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title={t('quality.crossReview.consensusRate')} value={consensus != null ? `${Math.round(Number(consensus) * 100)}%` : '-'} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title={t('quality.crossReview.criticalCount')} value={criticalCount} />
          </Card>
        </Col>
      </Row>

      <Card size="small" title={t('quality.crossReview.basicInfoTitle')}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Spec">{review.specName || review.specId || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('quality.crossReview.statusLabel')}>{review.status || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('quality.crossReview.issueTypeLabel')}>{review.issueType || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('quality.crossReview.taskIdLabel')}>{review.taskId || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('quality.crossReview.modelALabel')}>{review.modelAName || review.modelAId || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('quality.crossReview.modelBLabel')}>{review.modelBName || review.modelBId || t('quality.crossReview.notConfigured')}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" title={t('quality.crossReview.mergedFindingsTitle')}>
        {!mergedFindings.length ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('quality.crossReview.noMergedFindings')} />
        ) : (
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            {mergedFindings.map((item: any, index: number) => (
              <Card key={`${item?.title || 'finding'}-${index}`} size="small">
                <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                  <Title level={5} style={{ margin: 0 }}>{item?.title || t('quality.crossReview.findingIndex', { index: index + 1 })}</Title>
                  <Text type="secondary">
                    {(item?.severity || 'unknown').toUpperCase()}
                    {item?.consensus ? ` · ${t('quality.crossReview.consensus')}: ${item.consensus}` : ''}
                  </Text>
                  <Paragraph style={{ marginBottom: 0 }}>{item?.description || item?.summary || '-'}</Paragraph>
                  {item?.suggestion ? <Alert type="info" showIcon title={item.suggestion} /> : null}
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Card>

      <Collapse
        items={[
          {
            key: 'summary',
            label: t('quality.crossReview.summaryResultLabel'),
            children: <JsonBlock value={review.summary} />,
          },
          {
            key: 'comparison',
            label: t('quality.crossReview.modelComparisonLabel'),
            children: (
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card size="small" title={t('quality.crossReview.modelATitle', { model: review.modelAName || review.modelAId || '-' })}>
                    <JsonBlock value={review.modelAResult} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title={t('quality.crossReview.modelBTitle', { model: review.modelBName || review.modelBId || t('quality.crossReview.notConfigured') })}>
                    <JsonBlock value={review.modelBResult} />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'merged',
            label: t('quality.crossReview.mergedRawResultLabel'),
            children: <JsonBlock value={review.mergedResult} />,
          },
        ]}
      />
    </Space>
  );
}

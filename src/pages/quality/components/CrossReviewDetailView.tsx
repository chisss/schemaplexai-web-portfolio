import { Alert, Card, Col, Collapse, Descriptions, Empty, Row, Space, Statistic, Typography } from 'antd';
import type { CrossReview } from '@/types/quality';

const { Paragraph, Text, Title } = Typography;

function JsonBlock({ value }: { value?: unknown }) {
  if (!value) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />;
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
  if (!review) {
    return <Empty description="请选择交叉审查记录" />;
  }

  const mergedFindings = extractMergedFindings(review);
  const consensus = (review.summary as Record<string, any> | undefined)?.consensusRate;
  const criticalCount = mergedFindings.filter((item: any) => (item?.severity || '').toLowerCase() === 'critical').length;

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card size="small">
            <Statistic title="合并发现数" value={mergedFindings.length} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title="一致率" value={consensus != null ? `${Math.round(Number(consensus) * 100)}%` : '-'} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title="严重问题数" value={criticalCount} />
          </Card>
        </Col>
      </Row>

      <Card size="small" title="基础信息">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Spec">{review.specName || review.specId || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">{review.status || '-'}</Descriptions.Item>
          <Descriptions.Item label="问题类型">{review.issueType || '-'}</Descriptions.Item>
          <Descriptions.Item label="任务 ID">{review.taskId || '-'}</Descriptions.Item>
          <Descriptions.Item label="模型 A">{review.modelAName || review.modelAId || '-'}</Descriptions.Item>
          <Descriptions.Item label="模型 B">{review.modelBName || review.modelBId || '未配置'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" title="合并发现">
        {!mergedFindings.length ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无合并发现" />
        ) : (
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            {mergedFindings.map((item: any, index: number) => (
              <Card key={`${item?.title || 'finding'}-${index}`} size="small">
                <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                  <Title level={5} style={{ margin: 0 }}>{item?.title || `发现 ${index + 1}`}</Title>
                  <Text type="secondary">
                    {(item?.severity || 'unknown').toUpperCase()}
                    {item?.consensus ? ` · 共识: ${item.consensus}` : ''}
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
            label: '摘要结果',
            children: <JsonBlock value={review.summary} />,
          },
          {
            key: 'comparison',
            label: '模型对比',
            children: (
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card size="small" title={`模型 A: ${review.modelAName || review.modelAId || '-'}`}>
                    <JsonBlock value={review.modelAResult} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title={`模型 B: ${review.modelBName || review.modelBId || '未配置'}`}>
                    <JsonBlock value={review.modelBResult} />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'merged',
            label: '合并原始结果',
            children: <JsonBlock value={review.mergedResult} />,
          },
        ]}
      />
    </Space>
  );
}

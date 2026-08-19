import { useMemo } from 'react';
import { Card, Col, Empty, Row, Spin, Statistic, Table, Tag, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import LightweightECharts from '@/components/ECharts/LightweightECharts';
import { useRouteAnalysis } from '@/api/system';
import { formatDateTime } from '@/utils/date';

const { Paragraph, Text, Title } = Typography;

export default function RouteAnalysisPanel() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { data, isLoading } = useRouteAnalysis();
  const renderSectionTitle = (title: string, description?: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
      {description ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {description}
        </Text>
      ) : null}
    </div>
  );

  const distributionOption = useMemo(() => ({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, type: 'scroll' },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        data: (data?.selectedDistribution || []).map((item) => ({
          name: item.modelName,
          value: item.requestCount,
        })),
      },
    ],
  }), [data?.selectedDistribution]);

  const trendOption = useMemo(() => {
    const source = data?.trend || [];
    const buckets = Array.from(new Set(source.map((item) => item.bucketTime))).sort();
    const models = Array.from(new Set(source.map((item) => item.modelName)));
    return {
      tooltip: { trigger: 'axis' },
      legend: { top: 0 },
      grid: { left: 10, right: 10, top: 48, bottom: 48, containLabel: true },
      xAxis: {
        type: 'category',
        data: buckets.map((item) => formatDateTime(item)),
      },
      yAxis: [
        { type: 'value', name: t('evaluation.latency') },
        { type: 'value', name: t('evaluation.cost') },
      ],
      series: models.flatMap((modelName, index) => ([
        {
          name: `${modelName} Latency`,
          type: 'line',
          smooth: true,
          data: buckets.map((bucket) => {
            const point = source.find((item) => item.bucketTime === bucket && item.modelName === modelName);
            return point?.avgLatencyMs ?? 0;
          }),
        },
        {
          name: `${modelName} Cost`,
          type: 'bar',
          yAxisIndex: 1,
          barMaxWidth: 18,
          itemStyle: { opacity: index % 2 === 0 ? 0.35 : 0.22 },
          data: buckets.map((bucket) => {
            const point = source.find((item) => item.bucketTime === bucket && item.modelName === modelName);
            return point?.avgCost ?? 0;
          }),
        },
      ])),
    };
  }, [data?.trend, t]);

  if (isLoading) {
    return <Spin spinning />;
  }

  if (!data) {
    return <Empty description={t('common.noData')} />;
  }

  const healthyModelCount = (data.realtimeMetrics || []).filter((item) => !['critical', 'warning'].includes(String(item.healthStatus))).length;
  const riskModelCount = (data.realtimeMetrics || []).filter((item) => ['critical', 'warning'].includes(String(item.healthStatus))).length;
  const summaryCards = [
    {
      label: t('apiGateway.analysisObservedModels'),
      value: data.realtimeMetrics?.length ?? 0,
      footer: data.selectedDistribution?.[0]?.modelName || '-',
    },
    {
      label: t('apiGateway.analysisHealthyModels'),
      value: healthyModelCount,
      footer: t('apiGateway.runtimeMetricCard'),
    },
    {
      label: t('apiGateway.analysisRiskModels'),
      value: riskModelCount,
      footer: t('apiGateway.analysisTrend'),
    },
    {
      label: t('apiGateway.analysisDecisionSamples'),
      value: data.recentLogs?.length ?? 0,
      footer: t('apiGateway.analysisLogs'),
    },
  ];
  const resolveHealthMeta = (healthStatus?: string) => {
    if (healthStatus === 'critical') {
      return { color: 'error', label: 'critical' };
    }
    if (healthStatus === 'warning') {
      return { color: 'warning', label: 'warning' };
    }
    return { color: 'success', label: healthStatus || 'healthy' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        variant="borderless"
        style={{
          borderRadius: 24,
          border: `1px solid ${token.colorBorderSecondary}`,
          background: `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${token.colorPrimaryBg} 62%, ${token.colorSuccessBg} 100%)`,
        }}
      >
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} xl={14}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: token.colorPrimary }}>
                {t('apiGateway.analysisTab')}
              </Text>
              <Title level={3} style={{ margin: 0 }}>
                {t('apiGateway.analysisDeckTitle')}
              </Title>
              <Paragraph style={{ margin: 0, color: token.colorTextSecondary }}>
                {t('apiGateway.analysisDeckDescription')}
              </Paragraph>
            </div>
          </Col>
          <Col xs={24} xl={10}>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
              {summaryCards.map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorBgElevated,
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.label}
                  </Text>
                  <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>
                    {item.value}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.footer}
                  </Text>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {(data.realtimeMetrics || []).slice(0, 4).map((item) => (
          <Col xs={24} md={12} xl={6} key={item.modelId}>
            <Card
              style={{
                height: '100%',
                borderRadius: 20,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.modelName}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('apiGateway.requestCount')}: {item.requestCount1m || 0}
                  </Text>
                </div>
                <Tag color={resolveHealthMeta(item.healthStatus).color}>
                  {resolveHealthMeta(item.healthStatus).label}
                </Tag>
              </div>
              <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Statistic title="P95" value={item.p95LatencyMs || 0} suffix="ms" />
                </Col>
                <Col span={12}>
                  <Statistic title="Error" value={item.errorRate1m || 0} precision={2} suffix="%" />
                </Col>
              </Row>
              <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
                {t('apiGateway.lastUpdated')}: {item.lastUpdated ? formatDateTime(item.lastUpdated) : '-'}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={8}>
          <Card
            title={renderSectionTitle(t('apiGateway.analysisTrafficShare'), t('apiGateway.analysisTrafficHint'))}
            style={{ borderRadius: 22 }}
          >
            {(data.selectedDistribution || []).length ? (
              <LightweightECharts option={distributionOption} height={340} />
            ) : (
              <Empty description={t('common.noData')} />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={16}>
          <Card
            title={renderSectionTitle(t('apiGateway.analysisTrend'), t('apiGateway.analysisTrendHint'))}
            style={{ borderRadius: 22 }}
          >
            {(data.trend || []).length ? (
              <LightweightECharts option={trendOption} height={340} />
            ) : (
              <Empty description={t('common.noData')} />
            )}
          </Card>
        </Col>
      </Row>

      <Card
        title={renderSectionTitle(t('apiGateway.analysisLogs'), t('apiGateway.analysisLogHint'))}
        style={{ borderRadius: 22 }}
      >
        <Table
          rowKey="id"
          pagination={{ pageSize: 10 }}
          dataSource={data.recentLogs || []}
          scroll={{ x: 980 }}
          columns={[
            { title: t('common.createTime'), dataIndex: 'createdAt', render: (value: string) => formatDateTime(value) },
            { title: 'Agent', dataIndex: 'agentName', render: (value: string) => value || '-' },
            { title: t('apiGateway.selectedModel'), dataIndex: 'selectedModelName', render: (value: string) => value || '-' },
            { title: t('apiGateway.reason'), dataIndex: 'reason', ellipsis: true },
            { title: t('evaluation.latency'), dataIndex: 'latencyMs', render: (value: number) => `${value ?? 0}ms` },
            { title: t('evaluation.cost'), dataIndex: 'cost', render: (value: number) => `$${Number(value ?? 0).toFixed(4)}` },
          ]}
        />
      </Card>
    </div>
  );
}

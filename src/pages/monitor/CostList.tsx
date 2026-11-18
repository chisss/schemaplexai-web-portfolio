import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Col,
  Form,
  InputNumber,
  List,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { DollarOutlined, PieChartOutlined, SettingOutlined, WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import LightweightECharts from '@/components/ECharts/LightweightECharts';
import PageContainer from '@/components/PageContainer/PageContainer';
import { MetricCard, ReportSectionCard } from '@/components/analytics/AnalyticsCards';
import {
  useBudgetAlerts,
  useBudgetAdmissionStatus,
  useBudgetBlockEvents,
  useCostByAgent,
  useCostByModel,
  useCostByProject,
  useCostOverview,
  useCostTrend,
  useCurrentBudget,
  useCurrentBudgetUsage,
  useUpdateCurrentBudget,
} from '@/api/cost';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDateTime } from '@/utils/date';

const STRATEGY_LABEL_KEYS: Record<string, string> = {
  allow: 'cost.strategyAllow',
  alert: 'cost.strategyAlert',
  block: 'cost.strategyBlock',
  downgrade: 'cost.strategyDowngrade',
};

function strategyLabel(value: string, t: TFunction) {
  return STRATEGY_LABEL_KEYS[value] ? t(STRATEGY_LABEL_KEYS[value]) : value;
}
import {
  buildChartEmptyGraphic,
  buildTimeLabels,
  CHART_COLORS,
  formatCompactNumber,
  formatTimeAxisLabel,
  hasTrendData,
  mergeTrendByLabels,
  resolveAxisLabelInterval,
} from './chartUtils';

const { Text } = Typography;

export default function CostList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useAppStore();
  const tenantId = useAuthStore((state) => state.tenantId);
  const isDark = theme === 'dark';
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetForm] = Form.useForm();

  const { data: overview, isLoading: overviewLoading } = useCostOverview('30d');
  const { data: trend, isLoading: trendLoading } = useCostTrend({ timeRange: '30d', groupBy: 'day' });
  const { data: projectCosts, isLoading: projectLoading } = useCostByProject({ timeRange: '30d' });
  const { data: modelCosts, isLoading: modelLoading } = useCostByModel({ timeRange: '30d' });
  const { data: agentCosts, isLoading: agentLoading } = useCostByAgent({ timeRange: '30d' });
  const { data: currentBudget, isLoading: budgetLoading } = useCurrentBudget();
  const { data: budgetUsage, isLoading: budgetUsageLoading } = useCurrentBudgetUsage();
  const { data: budgetAlerts, isLoading: alertLoading } = useBudgetAlerts({ page: 1, size: 10 });
  const { data: admissionStatus, isLoading: admissionLoading } = useBudgetAdmissionStatus();
  const { data: budgetBlockEvents, isLoading: blockEventsLoading } = useBudgetBlockEvents(5);
  const updateCurrentBudgetMutation = useUpdateCurrentBudget();

  const loading = overviewLoading || trendLoading || projectLoading || modelLoading || agentLoading || budgetLoading || budgetUsageLoading || alertLoading || admissionLoading || blockEventsLoading;
  const activeBudget = currentBudget || undefined;
  const trendCostData = useMemo(() => trend?.costTrend || [], [trend?.costTrend]);
  const trendTokenData = useMemo(() => trend?.tokenTrend || [], [trend?.tokenTrend]);
  const trendLabels = useMemo(
    () => buildTimeLabels('30d', 'day', [
      ...trendCostData.map((item) => String(item.label || item.date || '')),
      ...trendTokenData.map((item) => String(item.label || item.date || '')),
    ]),
    [trendCostData, trendTokenData],
  );
  const normalizedCostTrend = useMemo(() => {
    const costRows = mergeTrendByLabels(trendCostData, trendLabels, ['cost', 'value'], 'day');
    const tokenRows = mergeTrendByLabels(trendTokenData, trendLabels, ['tokens', 'value'], 'day');
    return trendLabels.map((label, index) => ({
      label,
      cost: Number(costRows[index]?.cost ?? costRows[index]?.value ?? 0),
      tokens: Number(tokenRows[index]?.tokens ?? tokenRows[index]?.value ?? 0),
    }));
  }, [trendCostData, trendLabels, trendTokenData]);
  const hasCostTrend = hasTrendData(normalizedCostTrend, ['cost', 'tokens']);
  const modelChartData = useMemo(
    () => (modelCosts || [])
      .filter((item) => Number(item.totalCost ?? 0) > 0)
      .map((item) => ({
        name: item.dimensionName,
        value: item.totalCost,
      })),
    [modelCosts],
  );
  const budgetUsageRate = budgetUsage?.usageRate ?? overview?.budgetUsageRate ?? 0;
  const budgetProgressColor = budgetUsageRate >= 90
    ? CHART_COLORS.danger
    : budgetUsageRate >= 70
    ? CHART_COLORS.warning
    : CHART_COLORS.success;
  const costMetricCards = [
    {
      title: t('cost.totalCost30d'),
      value: overview?.totalCost ?? 0,
      precision: 2,
      prefix: <DollarOutlined />,
      suffix: '$',
      footer: t('cost.costChangeRate', { rate: overview?.costChangeRate ?? 0 }),
      tone: 'warning' as const,
    },
    {
      title: t('cost.todayCost'),
      value: overview?.todayCost ?? 0,
      precision: 2,
      suffix: '$',
      footer: t('cost.todayTokenValue', { tokens: overview?.todayTokens ?? 0 }),
      tone: 'primary' as const,
    },
    {
      title: t('cost.totalToken30d'),
      value: overview?.totalTokens ?? 0,
      prefix: <PieChartOutlined />,
      footer: t('cost.modelCount', { count: (modelCosts || []).length }),
      tone: 'cyan' as const,
    },
    {
      title: t('cost.budgetUsageRate'),
      value: budgetUsageRate,
      precision: 2,
      suffix: '%',
      tone: budgetUsageRate >= 90 ? 'danger' as const : budgetUsageRate >= 70 ? 'warning' as const : 'success' as const,
      progressColor: budgetProgressColor,
    },
  ];
  const strategyColor = admissionStatus?.strategy === 'block'
    ? 'red'
    : admissionStatus?.strategy === 'downgrade'
      ? 'orange'
      : admissionStatus?.strategy === 'alert'
        ? 'gold'
        : 'green';
  const latestBlockEvent = budgetBlockEvents?.[0];

  const trendOption = useMemo(() => ({
    color: [CHART_COLORS.warning, CHART_COLORS.primary],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      top: 8,
      left: 8,
      data: [t('cost.cost'), 'Token'],
    },
    grid: { left: 10, right: 10, top: 56, bottom: 56, containLabel: true },
    xAxis: {
      type: 'category',
      data: normalizedCostTrend.map((item) => item.label),
      axisTick: { alignWithLabel: true },
      axisLabel: {
        margin: 14,
        hideOverlap: true,
        interval: resolveAxisLabelInterval(normalizedCostTrend.length),
        formatter: (value: string) => formatTimeAxisLabel(value, 'day'),
      },
    },
    yAxis: [
      {
        type: 'value',
        name: t('cost.costDollar'),
        splitLine: { lineStyle: { type: 'dashed', color: isDark ? CHART_COLORS.splitLineDark : CHART_COLORS.splitLineLight } },
      },
      {
        type: 'value',
        name: 'Token',
        axisLabel: {
          formatter: (value: number) => formatCompactNumber(value),
        },
      },
    ],
    series: [
      {
        name: t('cost.cost'),
        type: 'bar',
        data: normalizedCostTrend.map((item) => item.cost),
        barMaxWidth: 22,
        itemStyle: { color: CHART_COLORS.warning, borderRadius: [8, 8, 0, 0] },
      },
      {
        name: 'Token',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: normalizedCostTrend.map((item) => item.tokens),
        symbolSize: 7,
        itemStyle: { color: CHART_COLORS.primary },
        lineStyle: { width: 3 },
        areaStyle: { color: CHART_COLORS.primaryArea },
      },
    ],
    graphic: hasCostTrend ? undefined : buildChartEmptyGraphic(t('cost.noCostTrendData'), isDark),
  }), [hasCostTrend, isDark, normalizedCostTrend, t]);

  const modelOption = useMemo(() => ({
    tooltip: { trigger: 'item' },
    legend: {
      type: 'scroll',
      bottom: 0,
      left: 'center',
      width: '88%',
    },
    series: [
      {
        name: t('cost.modelCostPercent'),
        type: 'pie',
        radius: ['54%', '74%'],
        center: ['50%', '42%'],
        minAngle: 8,
        avoidLabelOverlap: true,
        data: modelChartData,
        label: {
          formatter: '{b}\n{d}%',
        },
        labelLine: {
          length: 12,
          length2: 10,
        },
      },
    ],
    graphic: modelChartData.length ? undefined : buildChartEmptyGraphic(t('cost.noModelCostData'), isDark),
  }), [isDark, modelChartData, t]);

  const saveBudget = async () => {
    const values = await budgetForm.validateFields();
    if (!tenantId && !activeBudget?.targetId) {
      message.error(t('cost.noTenantInfo'));
      return;
    }
    const payload = {
      budgetAmount: values.budgetAmount,
      alertThreshold50: true,
      alertThreshold80: true,
      alertThreshold100: true,
      overLimitStrategy: values.overLimitStrategy,
    };
    const onSuccess = () => {
      message.success(t('cost.budgetSaved'));
      setBudgetModalOpen(false);
    };
    updateCurrentBudgetMutation.mutate(payload, { onSuccess });
  };

  return (
    <PageContainer
      title={t('cost.center')}
      extra={(
        <Button type="primary" icon={<SettingOutlined />} onClick={() => {
          budgetForm.setFieldsValue({
            budgetAmount: activeBudget?.budgetAmount ?? 3000,
            overLimitStrategy: activeBudget?.overLimitStrategy ?? 'downgrade',
          });
          setBudgetModalOpen(true);
        }}
        >
          {t('cost.configureBudget')}
        </Button>
      )}
    >
      <Spin spinning={loading}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Alert
            type={budgetUsageRate >= 90 ? 'error' : budgetUsageRate >= 70 ? 'warning' : 'info'}
            showIcon
            icon={<WarningOutlined />}
            message={admissionStatus?.message || (budgetUsageRate >= 90 ? t('cost.budgetExceededThreshold') : budgetUsageRate >= 70 ? t('cost.budgetNearThreshold') : t('cost.costDataSwitched'))}
            description={`策略状态：${admissionStatus?.strategy || activeBudget?.overLimitStrategy || 'allow'} · ${t('cost.costSummaryDesc', { cost: overview?.totalCost ?? 0, tokens: overview?.totalTokens ?? 0 })}`}
          />

          <Row gutter={[16, 16]}>
            {costMetricCards.map((item) => (
              <Col xs={24} sm={12} xl={6} key={item.title}>
                <MetricCard
                  title={item.title}
                  value={item.value}
                  precision={item.precision}
                  prefix={item.prefix}
                  suffix={item.suffix}
                  footer={item.footer}
                  tone={item.tone}
                >
                  {'progressColor' in item ? (
                    <Progress percent={budgetUsageRate} showInfo={false} strokeColor={item.progressColor} />
                  ) : undefined}
                </MetricCard>
              </Col>
            ))}
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} xl={16}>
              <ReportSectionCard title={t('cost.costAndTokenTrend')}>
                <LightweightECharts option={trendOption} theme={isDark ? 'dark' : undefined} style={{ height: 380 }} />
              </ReportSectionCard>
            </Col>
            <Col xs={24} xl={8}>
              <ReportSectionCard title={t('cost.modelCostDistribution')}>
                <LightweightECharts option={modelOption} theme={isDark ? 'dark' : undefined} style={{ height: 380 }} />
              </ReportSectionCard>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} xl={16}>
              <ReportSectionCard title={t('cost.costDetail')}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="dimensionId"
                  dataSource={projectCosts || []}
                  scroll={{ x: 760, y: 240 }}
                  columns={[
                    { title: t('cost.workspace'), dataIndex: 'dimensionName' },
                    { title: t('cost.costDollar'), dataIndex: 'totalCost', align: 'right', render: (value: number) => Number(value || 0).toFixed(2) },
                    { title: t('cost.totalTokens'), dataIndex: 'totalTokens', align: 'right' },
                    { title: t('cost.percentage'), dataIndex: 'percentage', align: 'right', render: (value: number) => `${value ?? 0}%` },
                  ]}
                />

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <ReportSectionCard size="small" title={t('cost.agentCostRanking')}>
                    <Table
                      size="small"
                      pagination={false}
                      rowKey="dimensionId"
                      dataSource={(agentCosts || []).slice(0, 8)}
                      scroll={{ y: 220 }}
                      columns={[
                        { title: t('context.levelAgent'), dataIndex: 'dimensionName' },
                        { title: t('cost.costDollar'), dataIndex: 'totalCost', align: 'right', render: (value: number) => Number(value || 0).toFixed(2) },
                        { title: t('cost.percentage'), dataIndex: 'percentage', align: 'right', render: (value: number) => `${value ?? 0}%` },
                      ]}
                    />
                  </ReportSectionCard>
                  <ReportSectionCard size="small" title={t('cost.modelCostRanking')}>
                    <Table
                      size="small"
                      pagination={false}
                      rowKey="dimensionId"
                      dataSource={modelCosts || []}
                      scroll={{ y: 220 }}
                      columns={[
                        { title: t('cost.model'), dataIndex: 'dimensionName', render: (value: string) => <Tag color="purple">{value}</Tag> },
                        { title: t('cost.costDollar'), dataIndex: 'totalCost', align: 'right', render: (value: number) => Number(value || 0).toFixed(2) },
                        { title: t('cost.totalTokens'), dataIndex: 'totalTokens', align: 'right' },
                      ]}
                    />
                  </ReportSectionCard>
                </div>
              </ReportSectionCard>
            </Col>

            <Col xs={24} xl={8}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <ReportSectionCard title={t('cost.admission.title')}>
                  <div className="flex flex-col gap-3" style={{ minHeight: 160 }}>
                    <div>
                      <Text type="secondary">{t('cost.admission.policyStatus')}</Text>
                      <div className="mt-1">
                        <Tag color={strategyColor}>{admissionStatus?.strategy || activeBudget?.overLimitStrategy || 'allow'}</Tag>
                        {admissionStatus?.allowed === false ? <Tag color="red">{t('cost.admission.blocked')}</Tag> : <Tag color="green">{t('cost.admission.allowed')}</Tag>}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">{t('cost.admission.remainingQuota')}</Text>
                      <div className="mt-1 font-medium">${admissionStatus?.remainingAmount ?? budgetUsage?.remainAmount ?? 0}</div>
                    </div>
                    <div>
                      <Text type="secondary">{t('cost.admission.estimatedRuns')}</Text>
                      <div className="mt-1 font-medium">
                        {Math.max(0, Math.floor(Number(admissionStatus?.remainingAmount ?? budgetUsage?.remainAmount ?? 0) / Math.max(1, Number(overview?.todayCost ?? 1))))}
                      </div>
                    </div>
                    <Space wrap>
                      <Button size="small" onClick={() => {
                        budgetForm.setFieldsValue({
                          budgetAmount: activeBudget?.budgetAmount ?? 3000,
                          overLimitStrategy: activeBudget?.overLimitStrategy ?? admissionStatus?.strategy ?? 'downgrade',
                        });
                        setBudgetModalOpen(true);
                      }}>{t('cost.admission.budgetSettings')}</Button>
                      <Button size="small" onClick={() => navigate('/approval-center?view=pending')}>{t('cost.admission.approvalCenter')}</Button>
                    </Space>
                  </div>
                </ReportSectionCard>

                <ReportSectionCard title={t('cost.recentBlocked')}>
                  <List
                    size="small"
                    locale={{ emptyText: t('cost.noBlockRecords') }}
                    dataSource={budgetBlockEvents || []}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={item.message || item.resourceId || t('cost.blockDefaultTitle')}
                          description={(
                            <div className="flex flex-col gap-1">
                              <Text type="secondary">{item.resourceType || 'agent_execution'} · {item.resourceId || '-'}</Text>
                              <Text type="secondary">{formatDateTime(item.occurredAt)} · {t('cost.usageRateText', { rate: item.usageRate ?? '-' })}</Text>
                            </div>
                          )}
                        />
                        <Tag color="red">{strategyLabel(item.strategy || 'block')}</Tag>
                      </List.Item>
                    )}
                  />
                  {latestBlockEvent ? (
                    <Alert
                      style={{ marginTop: 12 }}
                      type="warning"
                      showIcon
                      message={t('cost.blockAfterAction')}
                      description={t('cost.blockAfterActionDesc')}
                    />
                  ) : null}
                </ReportSectionCard>

                <ReportSectionCard title={t('cost.currentBudget')}>
                  <div className="flex flex-col gap-3" style={{ minHeight: 196 }}>
                    <div>
                      <Text type="secondary">{t('cost.budgetLevel')}</Text>
                      <div className="mt-1 font-medium">{activeBudget?.budgetLevel || 'enterprise'}</div>
                    </div>
                    <div>
                      <Text type="secondary">{t('cost.budgetAmount')}</Text>
                      <div className="mt-1 font-medium">${activeBudget?.budgetAmount ?? 0}</div>
                    </div>
                    <div>
                      <Text type="secondary">{t('cost.overLimitStrategy')}</Text>
                      <div className="mt-1 font-medium">{activeBudget?.overLimitStrategy || 'downgrade'}</div>
                    </div>
                    <div>
                      <Text type="secondary">{t('cost.usageRate')}</Text>
                      <Progress
                        percent={budgetUsageRate}
                        strokeColor={budgetProgressColor}
                      />
                    </div>
                  </div>
                </ReportSectionCard>

                <ReportSectionCard title={t('cost.budgetAlert')}>
                  <div style={{ maxHeight: 360, overflow: 'auto' }}>
                    <List
                      locale={{ emptyText: t('cost.noBudgetAlerts') }}
                      dataSource={budgetAlerts || []}
                      renderItem={(item) => (
                        <List.Item>
                          <List.Item.Meta
                            title={item.targetName || item.budgetLevel}
                            description={(
                              <div className="flex flex-col gap-1">
                                <Text type="secondary">{t('cost.usageRateValue', { rate: item.usageRate })}</Text>
                                <Text type="secondary">{t('cost.alertTime', { time: formatDateTime(item.alertTime) })}</Text>
                              </div>
                            )}
                          />
                          <Tag color={item.alertLevel === 'exceeded' ? 'red' : 'orange'}>{item.alertLevel}</Tag>
                        </List.Item>
                      )}
                    />
                  </div>
                </ReportSectionCard>
              </div>
            </Col>
          </Row>
        </div>
      </Spin>

      <Modal
        title={t('cost.configureBudget')}
        open={budgetModalOpen}
        onOk={saveBudget}
        onCancel={() => setBudgetModalOpen(false)}
        confirmLoading={updateCurrentBudgetMutation.isPending}
        destroyOnHidden
      >
        <Form form={budgetForm} layout="vertical">
          <Form.Item label={t('cost.budgetAmountLabel')} name="budgetAmount" rules={[{ required: true, message: t('cost.pleaseEnterBudgetAmount') }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label={t('cost.overLimitStrategyLabel')} name="overLimitStrategy" rules={[{ required: true, message: t('cost.pleaseSelectStrategy') }]}>
            <Select
              options={[
                { label: t('cost.strategyAlertOnly'), value: 'alert' },
                { label: t('cost.strategyDowngrade'), value: 'downgrade' },
                { label: t('cost.strategyBlock'), value: 'block' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

import { useMemo } from 'react';
import { Alert, Badge, Card, Col, Progress, Row, Spin, Table, Tag, Typography, theme } from 'antd';
import {
  CheckCircleOutlined,
  DeploymentUnitOutlined,
  RocketOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import LightweightECharts from '@/components/ECharts/LightweightECharts';
import PageContainer from '@/components/PageContainer/PageContainer';
import { MetricCard, ReportSectionCard } from '@/components/analytics/AnalyticsCards';
import {
  useActiveAgents,
  useAgentPerformanceReport,
  useDashboard,
  useEfficiencyReport,
  useProjectProgressReport,
  useQualityReport,
  useSystemHealth,
  useTaskQueue,
  useTeamCollaborationReport,
} from '@/api/monitor';
import { formatDateTime } from '@/utils/date';
import { useAppStore } from '@/store/useAppStore';
import {
  buildChartEmptyGraphic,
  buildTimeLabels,
  CHART_COLORS,
  formatTimeAxisLabel,
  hasTrendData,
  mergeTrendByLabels,
  resolveAxisLabelInterval,
} from './chartUtils';

const { Paragraph, Text, Title } = Typography;

const REPORT_PARAMS = { timeRange: 'last_30d', groupBy: 'day' } as const;
type ReportRow = Array<string | number | null | undefined>;

interface MonitorContentProps {
  mode: 'overview' | 'reports';
}

function MonitorContent({ mode }: MonitorContentProps) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { theme: appTheme } = useAppStore();
  const isDark = appTheme === 'dark';

  const { data: dashboard, isLoading: dashboardLoading } = useDashboard();
  const { data: activeAgents, isLoading: agentsLoading } = useActiveAgents();
  const { data: taskQueue, isLoading: taskQueueLoading } = useTaskQueue();
  const { data: systemHealth } = useSystemHealth();
  const { data: efficiencyReport, isLoading: efficiencyLoading } = useEfficiencyReport(REPORT_PARAMS);
  const { data: qualityReport, isLoading: qualityLoading } = useQualityReport(REPORT_PARAMS);
  const { data: agentPerformanceReport, isLoading: performanceLoading } = useAgentPerformanceReport(REPORT_PARAMS);
  const { data: projectReport, isLoading: projectLoading } = useProjectProgressReport(REPORT_PARAMS);
  const { data: collaborationReport, isLoading: collaborationLoading } = useTeamCollaborationReport(REPORT_PARAMS);

  const isReports = mode === 'reports';
  const loading = isReports
    ? efficiencyLoading || qualityLoading || performanceLoading || projectLoading || collaborationLoading
    : dashboardLoading || agentsLoading || taskQueueLoading;
  const queuePendingCount = taskQueue?.totalPending ?? 0;
  const queueExecutingCount = taskQueue?.totalExecuting ?? 0;
  const oldestWaitSeconds = Math.round((taskQueue?.oldestTaskWaitMs ?? 0) / 1000);
  const serviceItems = Object.entries(systemHealth?.serviceStatus || {});
  const unavailableServiceCount = serviceItems.filter(([, status]) => status !== 'up').length;
  const needsAttention = (dashboard?.deviationAlertCount ?? 0) > 0 || queuePendingCount > 0 || unavailableServiceCount > 0;
  const metricCards = [
    {
      title: t('monitor.activeAgent'),
      value: dashboard?.activeAgentCount ?? 0,
      icon: <RocketOutlined style={{ color: CHART_COLORS.primary }} />,
      tone: 'primary' as const,
      suffix: t('monitor.queueDepth', { count: dashboard?.taskQueueDepth ?? 0 }),
    },
    {
      title: t('monitor.todaySuccessRate'),
      value: dashboard?.taskSuccessRate ?? 0,
      precision: 2,
      suffix: '%',
      icon: <CheckCircleOutlined style={{ color: CHART_COLORS.success }} />,
      tone: 'success' as const,
      footer: t('monitor.avgExecutionTime', { time: dashboard?.avgExecutionTimeMs ?? 0 }),
    },
    {
      title: t('monitor.qualityAlert'),
      value: dashboard?.deviationAlertCount ?? 0,
      icon: <WarningOutlined style={{ color: '#FF7D00' }} />,
      tone: 'warning' as const,
      footer: t('monitor.pendingApproval', { count: dashboard?.pendingApprovalCount ?? 0 }),
    },
    {
      title: t('monitor.todayToken'),
      value: dashboard?.todayTokenConsumption ?? 0,
      icon: <DeploymentUnitOutlined style={{ color: CHART_COLORS.purple }} />,
      tone: 'purple' as const,
      footer: t('monitor.pendingExecution', { count: taskQueue?.totalPending ?? 0 }),
    },
  ];

  const efficiencyTrend = useMemo(
    () => mergeTrendByLabels(
      efficiencyReport?.trend || [],
      buildTimeLabels(REPORT_PARAMS.timeRange, REPORT_PARAMS.groupBy, (efficiencyReport?.trend || []).map((item) => String(item.label || ''))),
      ['taskCount', 'successRate', 'avgDurationMs'],
      REPORT_PARAMS.groupBy,
    ),
    [efficiencyReport?.trend],
  );
  const qualityTrend = useMemo(
    () => mergeTrendByLabels(
      qualityReport?.trend || [],
      buildTimeLabels(REPORT_PARAMS.timeRange, REPORT_PARAMS.groupBy, (qualityReport?.trend || []).map((item) => String(item.label || ''))),
      ['deviationCount', 'intentDefectCount', 'criticalCount'],
      REPORT_PARAMS.groupBy,
    ),
    [qualityReport?.trend],
  );
  const agentRows = agentPerformanceReport?.rows || [];
  const projectRows = projectReport?.rows || [];
  const collaborationRows = collaborationReport?.rows || [];
  const hasEfficiencyTrend = hasTrendData(efficiencyTrend, ['taskCount', 'successRate']);
  const hasQualityTrend = hasTrendData(qualityTrend, ['deviationCount', 'intentDefectCount', 'criticalCount']);
  const commandCenterStats = [
    {
      label: t('monitor.taskQueue'),
      value: queuePendingCount,
      footer: t('monitor.pendingCount', { count: queuePendingCount }),
    },
    {
      label: t('monitor.executingTask'),
      value: queueExecutingCount,
      footer: t('monitor.inProgressCount', { count: queueExecutingCount }),
    },
    {
      label: t('monitor.oldestWaitTime'),
      value: `${oldestWaitSeconds}s`,
      footer: t('monitor.resourceWindow'),
    },
    {
      label: t('monitor.serviceStatusLabel'),
      value: unavailableServiceCount,
      footer: unavailableServiceCount > 0 ? t('monitor.queueInsightRisk') : t('monitor.queueInsightHealthy'),
    },
  ];

  const efficiencyChartOption = useMemo(() => ({
    color: [CHART_COLORS.primary, CHART_COLORS.success],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      top: 8,
      left: 8,
      data: [t('monitor.taskCount'), t('monitor.successRate')],
    },
    grid: { left: 10, right: 10, top: 56, bottom: 56, containLabel: true },
    xAxis: {
      type: 'category',
      data: efficiencyTrend.map((item) => item.label),
      axisTick: { alignWithLabel: true },
      axisLabel: {
        margin: 14,
        hideOverlap: true,
        interval: resolveAxisLabelInterval(efficiencyTrend.length),
        formatter: (value: string) => formatTimeAxisLabel(value, REPORT_PARAMS.groupBy),
      },
    },
    yAxis: [
      {
        type: 'value',
        name: t('monitor.taskCount'),
        minInterval: 1,
        splitLine: { lineStyle: { type: 'dashed', color: isDark ? CHART_COLORS.splitLineDark : CHART_COLORS.splitLineLight } },
      },
      { type: 'value', name: t('monitor.successRatePercent'), min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
    ],
    series: [
      {
        name: t('monitor.taskCount'),
        type: 'bar',
        data: efficiencyTrend.map((item) => item.taskCount ?? 0),
        barMaxWidth: 28,
        itemStyle: { color: CHART_COLORS.primary, borderRadius: [8, 8, 0, 0] },
      },
      {
        name: t('monitor.successRate'),
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: efficiencyTrend.map((item) => item.successRate ?? 0),
        symbolSize: 7,
        itemStyle: { color: CHART_COLORS.success },
        lineStyle: { width: 3 },
        areaStyle: { color: CHART_COLORS.successArea },
      },
    ],
    graphic: hasEfficiencyTrend ? undefined : buildChartEmptyGraphic(t('monitor.noEfficiencyTrendData'), isDark),
  }), [efficiencyTrend, hasEfficiencyTrend, isDark, t]);

  const qualityChartOption = useMemo(() => ({
    color: [CHART_COLORS.warning, CHART_COLORS.purple, CHART_COLORS.danger],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      top: 8,
      left: 8,
      data: [t('monitor.deviationCount'), t('monitor.intentDefectCount'), t('monitor.criticalCount')],
    },
    grid: { left: 10, right: 10, top: 56, bottom: 56, containLabel: true },
    xAxis: {
      type: 'category',
      data: qualityTrend.map((item) => item.label),
      axisTick: { alignWithLabel: true },
      axisLabel: {
        margin: 14,
        hideOverlap: true,
        interval: resolveAxisLabelInterval(qualityTrend.length),
        formatter: (value: string) => formatTimeAxisLabel(value, REPORT_PARAMS.groupBy),
      },
    },
    yAxis: [
      {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { type: 'dashed', color: isDark ? CHART_COLORS.splitLineDark : CHART_COLORS.splitLineLight } },
      },
      {
        type: 'value',
        minInterval: 1,
      },
    ],
    series: [
      {
        name: t('monitor.deviationCount'),
        type: 'bar',
        stack: 'quality',
        data: qualityTrend.map((item) => item.deviationCount ?? 0),
        barMaxWidth: 22,
        itemStyle: { color: CHART_COLORS.warning, borderRadius: [8, 8, 0, 0] },
      },
      {
        name: t('monitor.intentDefectCount'),
        type: 'bar',
        stack: 'quality',
        data: qualityTrend.map((item) => item.intentDefectCount ?? 0),
        barMaxWidth: 22,
        itemStyle: { color: CHART_COLORS.purple, borderRadius: [8, 8, 0, 0] },
      },
      {
        name: t('monitor.criticalCount'),
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: qualityTrend.map((item) => item.criticalCount ?? 0),
        symbolSize: 7,
        itemStyle: { color: CHART_COLORS.danger },
        lineStyle: { width: 3 },
        areaStyle: { color: CHART_COLORS.dangerArea },
      },
    ],
    graphic: hasQualityTrend ? undefined : buildChartEmptyGraphic(t('monitor.noQualityTrendData'), isDark),
  }), [hasQualityTrend, isDark, qualityTrend, t]);

  return (
    <PageContainer title={isReports ? t('monitor.reportsCenter') : t('monitor.overviewCenter')}>
      <Spin spinning={loading}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!isReports ? (
            <>
              <Alert
                type={(dashboard?.deviationAlertCount || 0) > 0 ? 'warning' : 'success'}
                showIcon
                title={(dashboard?.deviationAlertCount || 0) > 0 ? t('monitor.hasQualityAlerts') : t('monitor.systemStable')}
                description={t('monitor.systemResourceDesc', { cpu: systemHealth?.cpuUsage ?? 0, memory: systemHealth?.memoryUsage ?? 0, disk: systemHealth?.diskUsage ?? 0 })}
                action={(
                  <Tag color={needsAttention ? 'warning' : 'success'} style={{ marginInlineStart: 12 }}>
                    {needsAttention ? t('monitor.queueInsightRisk') : t('monitor.queueInsightHealthy')}
                  </Tag>
                )}
              />

              <Card
                variant="borderless"
                className="shadow-sm"
                style={{
                  borderRadius: 24,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,64,175,0.18) 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #eef4ff 62%, #fff7ed 100%)',
                }}
              >
                <Row gutter={[20, 20]} align="middle">
                  <Col xs={24} xl={14}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: token.colorPrimary }}>
                        {t('monitor.commandDeckTitle')}
                      </Text>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                        <Title level={3} style={{ margin: 0 }}>
                          {(dashboard?.deviationAlertCount || 0) > 0 ? t('monitor.hasQualityAlerts') : t('monitor.systemStable')}
                        </Title>
                        <Tag color={needsAttention ? 'warning' : 'success'}>
                          {needsAttention ? t('monitor.queueInsightRisk') : t('monitor.queueInsightHealthy')}
                        </Tag>
                      </div>
                      <Paragraph style={{ margin: 0, maxWidth: 720, color: token.colorTextSecondary }}>
                        {t('monitor.commandDeckDescription')}
                      </Paragraph>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {serviceItems.map(([name, status]) => (
                          <Tag
                            key={name}
                            color={status === 'up' ? 'success' : status === 'unavailable' ? 'default' : 'error'}
                            style={{ margin: 0 }}
                          >
                            {name}: {status}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} xl={10}>
                    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                      {commandCenterStats.map((item) => (
                        <div
                          key={item.label}
                          style={{
                            padding: 16,
                            borderRadius: 18,
                            border: `1px solid ${token.colorBorderSecondary}`,
                            background: isDark ? 'rgba(15, 23, 42, 0.66)' : 'rgba(255, 255, 255, 0.86)',
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
                {metricCards.map((item) => (
                  <Col xs={24} sm={12} xl={6} key={item.title}>
                    <MetricCard
                      title={item.title}
                      value={item.value}
                      precision={item.precision}
                      suffix={item.suffix}
                      prefix={item.icon}
                      footer={item.footer || item.suffix}
                      tone={item.tone}
                    />
                  </Col>
                ))}
              </Row>
            </>
          ) : null}

          <Row gutter={[16, 16]}>
            {isReports ? (
              <Col xs={24} xl={16}>
              <ReportSectionCard title={t('monitor.efficiencyTrend')}>
                <LightweightECharts option={efficiencyChartOption} theme={isDark ? 'dark' : undefined} style={{ height: 340 }} />
              </ReportSectionCard>
            </Col>
            ) : null}
            <Col xs={24} xl={isReports ? 8 : 24}>
              <ReportSectionCard title={t('monitor.systemAndQueueStatus')} description={t('monitor.resourceWindow')}>
                <div style={{ minHeight: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                    {commandCenterStats.slice(0, 3).map((item) => (
                      <div
                        key={item.label}
                        style={{
                          padding: 14,
                          borderRadius: 16,
                          background: isDark ? 'rgba(30, 41, 59, 0.72)' : '#f8fafc',
                          border: `1px solid ${token.colorBorderSecondary}`,
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.label}
                        </Text>
                        <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700 }}>{item.value}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.footer}
                        </Text>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <Text type="secondary">{t('monitor.cpuUsage')}</Text>
                        <Text>{systemHealth?.cpuUsage ?? 0}%</Text>
                      </div>
                      <Progress percent={systemHealth?.cpuUsage ?? 0} showInfo={false} strokeColor={CHART_COLORS.primary} />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <Text type="secondary">{t('monitor.memoryUsage')}</Text>
                        <Text>{systemHealth?.memoryUsage ?? 0}%</Text>
                      </div>
                      <Progress percent={systemHealth?.memoryUsage ?? 0} showInfo={false} strokeColor={CHART_COLORS.danger} />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <Text type="secondary">{t('monitor.diskUsage')}</Text>
                        <Text>{systemHealth?.diskUsage ?? 0}%</Text>
                      </div>
                      <Progress percent={systemHealth?.diskUsage ?? 0} showInfo={false} strokeColor={CHART_COLORS.purple} />
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t('monitor.serviceStatusLabel')}
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      {serviceItems.map(([name, status]) => (
                        <Tag key={name} color={status === 'up' ? 'success' : status === 'unavailable' ? 'default' : 'error'}>
                          {name}: {status}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </div>
              </ReportSectionCard>
            </Col>
          </Row>

          {isReports ? (
            <Row gutter={[16, 16]}>
            <Col xs={24} xl={14}>
              <ReportSectionCard title={t('monitor.qualityTrend')}>
                <LightweightECharts option={qualityChartOption} theme={isDark ? 'dark' : undefined} style={{ height: 340 }} />
              </ReportSectionCard>
            </Col>
            <Col xs={24} xl={10}>
              <ReportSectionCard title={t('monitor.keySummary')} description={t('monitor.commandDeckDescription')}>
                <div style={{ minHeight: 340, display: 'grid', gap: 12 }}>
                  <div style={{ padding: 16, borderRadius: 14, background: isDark ? 'rgba(37,99,235,0.12)' : '#eff6ff' }}>
                    <Text type="secondary">{t('monitor.efficiencyOverview')}</Text>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Tag color="blue">{t('monitor.totalTasks', { count: efficiencyReport?.summary?.totalTasks ?? 0 })}</Tag>
                      <Tag color="green">{t('monitor.completedTasks', { count: efficiencyReport?.summary?.completedTasks ?? 0 })}</Tag>
                      <Tag color="orange">{t('monitor.activeWorkflows', { count: efficiencyReport?.summary?.activeWorkflowCount ?? 0 })}</Tag>
                    </div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 14, background: isDark ? 'rgba(249,115,22,0.12)' : '#fff7ed' }}>
                    <Text type="secondary">{t('monitor.qualityOverview')}</Text>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Tag color="red">{t('monitor.deviations', { count: qualityReport?.summary?.totalDeviations ?? 0 })}</Tag>
                      <Tag color="purple">{t('monitor.intentDefects', { count: qualityReport?.summary?.totalIntentDefects ?? 0 })}</Tag>
                      <Tag color="gold">{t('monitor.crossReviews', { count: qualityReport?.summary?.crossReviewCount ?? 0 })}</Tag>
                    </div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 14, background: isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5' }}>
                    <Text type="secondary">{t('monitor.agentOverview')}</Text>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Tag color="cyan">{t('monitor.agentCount', { count: agentPerformanceReport?.summary?.agentCount ?? 0 })}</Tag>
                      <Tag color="processing">{t('monitor.avgSuccessRateValue', { rate: agentPerformanceReport?.summary?.avgSuccessRate ?? 0 })}</Tag>
                    </div>
                  </div>
                </div>
              </ReportSectionCard>
            </Col>
            </Row>
          ) : null}

          <Row gutter={[16, 16]}>
            {!isReports ? (
              <Col xs={24} xl={24}>
              <ReportSectionCard title={t('monitor.currentActiveAgents')} description={t('monitor.activeAgentHint')}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey={(record) => `${record.agentId}-${record.startTime}`}
                  dataSource={activeAgents || []}
                  scroll={{ x: 720, y: 280 }}
                  columns={[
                    {
                      title: t('context.levelAgent'),
                      dataIndex: 'agentName',
                      render: (value: string, record) => (
                        <div>
                          <div className="font-medium">{value || record.agentId}</div>
                          <Text type="secondary">{record.agentId}</Text>
                        </div>
                      ),
                    },
                    {
                      title: t('monitor.type'),
                      dataIndex: 'agentType',
                      render: (value: string) => <Tag color="blue">{value || 'unknown'}</Tag>,
                    },
                    {
                      title: t('monitor.status'),
                      dataIndex: 'progress',
                      render: (value: number) => <Badge status="processing" text={`${value ?? 0}%`} />,
                    },
                    {
                      title: t('monitor.startTime'),
                      dataIndex: 'startTime',
                      render: (value: string) => formatDateTime(value),
                    },
                  ]}
                />
              </ReportSectionCard>
            </Col>
            ) : null}
            {isReports ? (
              <Col xs={24} xl={24}>
              <ReportSectionCard title={t('monitor.agentPerformanceRanking')} description={t('monitor.performanceHint')}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey={(record) => String(record[0])}
                  dataSource={agentRows.slice(0, 8)}
                  scroll={{ y: 280 }}
                  columns={[
                    { title: t('context.levelAgent'), render: (_, record: ReportRow) => record[0] },
                    { title: t('monitor.executionCount'), align: 'right', render: (_, record: ReportRow) => record[1] },
                    { title: t('monitor.successRate'), align: 'right', render: (_, record: ReportRow) => `${record[2]}%` },
                    { title: t('monitor.avgDuration'), align: 'right', render: (_, record: ReportRow) => `${record[3]}ms` },
                  ]}
                />
              </ReportSectionCard>
            </Col>
            ) : null}
          </Row>

          {isReports ? (
            <Row gutter={[16, 16]}>
            <Col xs={24} xl={12}>
              <ReportSectionCard title={t('monitor.projectProgressOverview')} description={t('monitor.projectHint')}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey={(record) => String(record[0])}
                  dataSource={projectRows}
                  scroll={{ y: 240 }}
                  columns={[
                    { title: t('monitor.workspace'), render: (_, record: ReportRow) => record[0] },
                    { title: t('monitor.specCount'), align: 'right', render: (_, record: ReportRow) => record[1] },
                    { title: t('monitor.archived'), align: 'right', render: (_, record: ReportRow) => record[2] },
                    { title: t('monitor.inProgress'), align: 'right', render: (_, record: ReportRow) => record[3] },
                    { title: t('monitor.completionRate'), align: 'right', render: (_, record: ReportRow) => `${record[4]}%` },
                  ]}
                />
              </ReportSectionCard>
            </Col>
            <Col xs={24} xl={12}>
              <ReportSectionCard title={t('monitor.teamCollaborationOverview')} description={t('monitor.collaborationHint')}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey={(record) => String(record[0])}
                  dataSource={collaborationRows}
                  scroll={{ y: 240 }}
                  columns={[
                    { title: t('monitor.collaborator'), render: (_, record: ReportRow) => record[0] },
                    { title: t('monitor.participatedSpecs'), align: 'right', render: (_, record: ReportRow) => record[1] },
                    { title: t('monitor.pendingApprovals'), align: 'right', render: (_, record: ReportRow) => record[2] },
                  ]}
                />
              </ReportSectionCard>
            </Col>
            </Row>
          ) : null}
        </div>
      </Spin>
    </PageContainer>
  );
}

export function MonitorReportsContent() {
  return <MonitorContent mode="reports" />;
}

export default function MonitorList() {
  return <MonitorContent mode="overview" />;
}

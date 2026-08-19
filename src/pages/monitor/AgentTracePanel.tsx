import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Row, Select, Table, Tag, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import LightweightECharts from '@/components/ECharts/LightweightECharts';
import { useAgentTraces, useRecentAgentTraces, useTraceSpans } from '@/api/monitor';
import { formatDateTime } from '@/utils/date';
import type { ActiveAgent, AgentTrace } from '@/types/monitor';

const { Paragraph, Text } = Typography;

interface AgentTracePanelProps {
  agents: ActiveAgent[];
}

export default function AgentTracePanel({ agents }: AgentTracePanelProps) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [selectedAgentId, setSelectedAgentId] = useState<string>();
  const [selectedTraceId, setSelectedTraceId] = useState<string>();
  const recentTraces = useRecentAgentTraces();
  const traces = useAgentTraces(selectedAgentId);
  const spans = useTraceSpans(selectedTraceId);

  const agentOptions = useMemo(() => {
    const optionMap = new Map<string, { label: string; value: string }>();
    agents.forEach((item) => {
      optionMap.set(item.agentId, {
        label: item.agentName,
        value: item.agentId,
      });
    });
    // 保留最近有调用链的 Agent，避免监控页因“当前活跃 Agent 无 trace”而无法演示瀑布图。
    (recentTraces.data || []).forEach((item: AgentTrace) => {
      if (!item.agentId || optionMap.has(item.agentId)) {
        return;
      }
      optionMap.set(item.agentId, {
        label: `${item.agentName || item.agentId} · ${t('monitor.recentTraceSuffix')}`,
        value: item.agentId,
      });
    });
    return Array.from(optionMap.values());
  }, [agents, recentTraces.data, t]);

  useEffect(() => {
    const optionIds = new Set(agentOptions.map((item) => item.value));
    if (selectedAgentId && optionIds.has(selectedAgentId)) {
      return;
    }
    const activeAgentIds = new Set(agents.map((item) => item.agentId));
    const preferredAgentId = (recentTraces.data || [])
      .map((item) => item.agentId)
      .find((item): item is string => {
        if (!item) {
          return false;
        }
        return activeAgentIds.has(item);
      });
    const fallbackAgentId = preferredAgentId
      || recentTraces.data?.find((item) => Boolean(item.agentId))?.agentId
      || agents[0]?.agentId;
    if (fallbackAgentId) {
      setSelectedAgentId(fallbackAgentId);
    }
  }, [agentOptions, agents, recentTraces.data, selectedAgentId]);

  useEffect(() => {
    if (!traces.data?.length) {
      if (selectedTraceId) {
        setSelectedTraceId(undefined);
      }
      return;
    }
    if (!selectedTraceId || !traces.data.some((item) => item.traceId === selectedTraceId)) {
      setSelectedTraceId(traces.data[0].traceId);
    }
  }, [selectedTraceId, traces.data]);

  const waterfallOption = useMemo(() => {
    const items = (spans.data || []).slice().sort((left, right) => String(left.startedAt || '').localeCompare(String(right.startedAt || '')));
    if (!items.length) {
      return { xAxis: { type: 'value' }, yAxis: { type: 'category', data: [] }, series: [] };
    }
    const firstStartedAt = new Date(items[0].startedAt || items[0].createdAt || Date.now()).getTime();
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: { show: false },
      grid: { left: 12, right: 12, top: 16, bottom: 36, containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `${value}ms`,
        },
      },
      yAxis: {
        type: 'category',
        data: items.map((item) => `${item.spanType} · ${item.name}`),
      },
      series: [
        {
          type: 'bar',
          stack: 'trace',
          itemStyle: { color: 'transparent' },
          emphasis: { disabled: true },
          data: items.map((item) => {
            const currentStartedAt = new Date(item.startedAt || item.createdAt || Date.now()).getTime();
            return Math.max(0, currentStartedAt - firstStartedAt);
          }),
        },
        {
          type: 'bar',
          stack: 'trace',
          data: items.map((item) => ({
            value: item.durationMs || 0,
            itemStyle: {
              color: item.spanType === 'LLM'
                ? '#1677ff'
                : item.spanType === 'TOOL'
                ? '#fa8c16'
                : '#52c41a',
            },
          })),
          label: {
            show: true,
            position: 'insideRight',
            formatter: ({ value }: { value: number }) => `${value}ms`,
          },
        },
      ],
    };
  }, [spans.data]);
  const selectedTrace = useMemo(
    () => (traces.data || []).find((item) => item.traceId === selectedTraceId),
    [selectedTraceId, traces.data],
  );
  const traceSummaryCards = [
    {
      label: t('monitor.traceCurrentAgent'),
      value: agentOptions.find((item) => item.value === selectedAgentId)?.label || '-',
    },
    {
      label: t('monitor.traceCurrentTrace'),
      value: selectedTrace?.traceId ? `${selectedTrace.traceId.slice(0, 8)}...${selectedTrace.traceId.slice(-6)}` : '-',
    },
    {
      label: t('monitor.traceSpanCount'),
      value: `${spans.data?.length ?? 0}`,
    },
  ];

  return (
    <Card
      variant="borderless"
      className="shadow-sm"
      title={(
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{t('monitor.tracePanelTitle')}</span>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('monitor.tracePanelDescription')}
          </Text>
        </div>
      )}
      style={{ borderRadius: 22 }}
      extra={(
        <Select
          value={selectedAgentId}
          style={{ width: 260 }}
          placeholder={t('monitor.selectAgent')}
          onChange={(value) => {
            setSelectedAgentId(value);
            setSelectedTraceId(undefined);
          }}
          options={agentOptions}
        />
      )}
    >
      {!agentOptions.length ? (
        <Empty description={t('monitor.noTraceData')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Row gutter={[12, 12]}>
            {traceSummaryCards.map((item) => (
              <Col xs={24} md={8} key={item.label}>
                <div
                  style={{
                    height: '100%',
                    padding: 16,
                    borderRadius: 18,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorFillAlter,
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.label}
                  </Text>
                  <div style={{ marginTop: 8, fontSize: 18, fontWeight: 600, lineHeight: 1.3, wordBreak: 'break-word' }}>
                    {item.value}
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} xl={10}>
              <Card
                size="small"
                title={(
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontWeight: 600 }}>{t('monitor.traceListTitle')}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t('monitor.traceListDescription')}
                    </Text>
                  </div>
                )}
                styles={{ body: { padding: 0 } }}
              >
                <Table
                  rowKey="traceId"
                  loading={traces.isLoading}
                  dataSource={traces.data || []}
                  pagination={{ pageSize: 6 }}
                  onRow={(record) => ({
                    onClick: () => setSelectedTraceId(record.traceId),
                    style: {
                      cursor: 'pointer',
                      background: record.traceId === selectedTraceId ? token.colorPrimaryBg : undefined,
                    },
                  })}
                  columns={[
                    {
                      title: t('monitor.traceId'),
                      dataIndex: 'traceId',
                      render: (value: string) => <Text copyable>{value}</Text>,
                    },
                    {
                      title: t('common.status'),
                      dataIndex: 'status',
                      render: (value: string) => <Tag color={value === 'COMPLETED' ? 'green' : value === 'FAILED' ? 'red' : 'gold'}>{value || '-'}</Tag>,
                    },
                    {
                      title: t('evaluation.latency'),
                      dataIndex: 'durationMs',
                      render: (value: number) => `${value ?? 0}ms`,
                    },
                    {
                      title: t('common.createTime'),
                      dataIndex: 'startedAt',
                      render: (value: string) => formatDateTime(value),
                    },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} xl={14}>
              <Card
                size="small"
                title={(
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontWeight: 600 }}>{t('monitor.traceWaterfallTitle')}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {selectedTrace?.startedAt ? formatDateTime(selectedTrace.startedAt) : t('monitor.traceSpanInsight')}
                    </Text>
                  </div>
                )}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <Tag color="blue">LLM</Tag>
                  <Tag color="orange">TOOL</Tag>
                  <Tag color="green">WORKFLOW</Tag>
                </div>
                {(spans.data || []).length ? (
                  <LightweightECharts option={waterfallOption} height={340} />
                ) : (
                  <Empty description={t('monitor.noTraceData')} />
                )}
                <Paragraph type="secondary" style={{ margin: '12px 0 0', fontSize: 12 }}>
                  {t('monitor.traceSpanInsight')}
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </Card>
  );
}

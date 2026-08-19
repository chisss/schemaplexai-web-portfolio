import { startTransition, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DatabaseOutlined,
  RobotOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import PageContainer from '@/components/PageContainer/PageContainer';
import MonacoEditor from '@/components/MonacoEditor/MonacoEditor';
import LightweightECharts from '@/components/ECharts/LightweightECharts';
import { fetchExecutionDetail, executeAgent, useAgentList } from '@/api/agent';
import { useDatabaseSources, useExecuteDatabaseQuery } from '@/api/database';
import { resolveDatabaseTypeMeta } from '@/pages/integration/database/databaseMeta';
import type { DatabaseQueryResult, DatabaseSource } from '@/types/database';

const { Text } = Typography;

type ChartMeta = {
  type: 'bar' | 'line' | 'pie';
  dimensionColumn: string;
  numericColumn: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function buildSqlPrompt(source: DatabaseSource, requirement: string, extraContext?: string) {
  return [
    '你是一名企业数据库分析 Agent，需要根据用户目标输出一条可直接执行的只读 SQL。',
    `数据源名称：${source.name}`,
    `数据库类型：${resolveDatabaseTypeMeta(source.databaseType).label}`,
    source.schema ? `默认 Schema：${source.schema}` : '',
    source.database ? `数据库名：${source.database}` : '',
    source.tags?.length ? `标签：${source.tags.join('、')}` : '',
    '',
    '要求：',
    '1. 只允许返回单条只读 SQL，禁止输出解释文字。',
    '2. 如果使用 CTE，也必须最终是 SELECT 查询。',
    '3. 如果无法确定字段，请基于通用命名给出最合理的查询。',
    '4. 输出格式必须是 ```sql ... ``` 代码块。',
    '',
    `用户需求：${requirement}`,
    extraContext ? `补充上下文：${extraContext}` : '',
  ].filter(Boolean).join('\n');
}

function extractSqlFromOutput(output?: string) {
  if (!output?.trim()) {
    return '';
  }
  const fenced = output.match(/```sql\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const jsonMatch = output.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.sql === 'string') {
        return parsed.sql.trim();
      }
    } catch {
      // 忽略 JSON 解析失败，继续降级提取
    }
  }
  const keywordIndex = output.search(/\b(select|with|explain|show|describe|desc)\b/i);
  if (keywordIndex >= 0) {
    return output.slice(keywordIndex).trim();
  }
  return output.trim();
}

function detectChartType(result?: DatabaseQueryResult | null, preferredType?: string): ChartMeta | null {
  if (!result || result.rows.length === 0 || preferredType === 'table') {
    return null;
  }

  const sampleRow = result.rows[0] ?? {};
  const numericColumns = result.columns.filter((column) => {
    const value = sampleRow[column];
    return value !== null && value !== undefined && !Number.isNaN(Number(value));
  });
  const dimensionColumns = result.columns.filter((column) => !numericColumns.includes(column));

  if (numericColumns.length === 0 || dimensionColumns.length === 0) {
    return null;
  }
  const dimensionColumn = dimensionColumns[0];
  const numericColumn = numericColumns[0];
  if (preferredType && preferredType !== 'auto') {
    return { type: preferredType as ChartMeta['type'], dimensionColumn, numericColumn };
  }
  const firstDimensionValue = sampleRow[dimensionColumn];
  if (typeof firstDimensionValue === 'string' && /\d{4}-\d{1,2}-\d{1,2}/.test(firstDimensionValue)) {
    return { type: 'line', dimensionColumn, numericColumn };
  }
  if (result.rows.length <= 8) {
    return { type: 'pie', dimensionColumn, numericColumn };
  }
  return { type: 'bar', dimensionColumn, numericColumn };
}

function buildChartOption(result?: DatabaseQueryResult | null, preferredType = 'auto') {
  const chartMeta = detectChartType(result, preferredType);
  if (!result || !chartMeta) {
    return null;
  }
  const labels = result.rows.map((row) => String(row[chartMeta.dimensionColumn] ?? '-'));
  const values = result.rows.map((row) => Number(row[chartMeta.numericColumn] ?? 0));

  if (chartMeta.type === 'pie') {
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['38%', '68%'],
          data: labels.map((name, index) => ({ name, value: values[index] })),
        },
      ],
    };
  }

  return {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { interval: 0, rotate: labels.length > 6 ? 24 : 0 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        type: chartMeta.type,
        data: values,
        smooth: chartMeta.type === 'line',
        itemStyle: { color: '#2563eb' },
        areaStyle: chartMeta.type === 'line' ? { color: 'rgba(37,99,235,0.12)' } : undefined,
      },
    ],
  };
}

export default function DatabaseText2Sql() {
  const { data: sourcePage } = useDatabaseSources({ page: 1, size: 200 });
  const { data: agentPage } = useAgentList({ page: 1, size: 20, builtinPosition: 'data-query' });
  const executeQueryMutation = useExecuteDatabaseQuery();
  const [selectedSourceId, setSelectedSourceId] = useState<string>();
  const [selectedAgentId, setSelectedAgentId] = useState<string>();
  const [requirement, setRequirement] = useState('');
  const [extraContext, setExtraContext] = useState('');
  const [sql, setSql] = useState('');
  const [agentOutput, setAgentOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [queryResult, setQueryResult] = useState<DatabaseQueryResult | null>(null);
  const [preferredChartType, setPreferredChartType] = useState<'auto' | 'table' | 'bar' | 'line' | 'pie'>('auto');

  const sources = sourcePage?.records ?? [];
  const agents = agentPage?.records ?? [];
  const fixedAgent = agents.find((item) => item.status === 'active') ?? agents[0];
  const selectedSource = useMemo(
    () => sources.find((item) => item.id === selectedSourceId),
    [selectedSourceId, sources],
  );
  const chartOption = useMemo(
    () => buildChartOption(queryResult, preferredChartType),
    [preferredChartType, queryResult],
  );

  const handleGenerateSql = async () => {
    if (!selectedSource) {
      message.warning('请先选择数据源');
      return;
    }
    const agentId = fixedAgent?.id ?? selectedAgentId;
    if (!agentId) {
      message.warning('未配置数据查询助手，请先在 Agent 固定点位中配置 data-query');
      return;
    }
    if (!requirement.trim()) {
      message.warning('请输入查询需求');
      return;
    }

    setIsGenerating(true);
    setAgentOutput('');
    try {
      const submit = await executeAgent(agentId, {
        prompt: buildSqlPrompt(selectedSource, requirement.trim(), extraContext.trim()),
      });
      const executionId = submit.data.executionId;

      for (let attempt = 0; attempt < 30; attempt += 1) {
        await sleep(1500);
        const detail = await fetchExecutionDetail(agentId, executionId);
        const execution = detail.data;
        if (execution.status === 'completed') {
          const output = execution.outputResult ?? '';
          const nextSql = extractSqlFromOutput(output);
          startTransition(() => {
            setAgentOutput(output);
            setSql(nextSql);
          });
          message.success('SQL 已生成');
          return;
        }
        if (execution.status === 'failed' || execution.status === 'paused' || execution.status === 'stopped') {
          throw new Error(execution.errorMessage || 'Agent 执行未成功完成');
        }
      }
      throw new Error('SQL 生成超时，请重试或更换 Agent');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'SQL 生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecuteQuery = async () => {
    if (!selectedSourceId) {
      message.warning('请先选择数据源');
      return;
    }
    if (!sql.trim()) {
      message.warning('请先生成或输入 SQL');
      return;
    }
    try {
      const result = await executeQueryMutation.mutateAsync({
        id: selectedSourceId,
        data: { sql: sql.trim(), limit: 200 },
      });
      startTransition(() => {
        setQueryResult(result.data);
      });
      message.success('查询执行成功');
    } catch {
      message.error('查询执行失败');
    }
  };

  const resultColumns = (queryResult?.columns ?? []).map((column) => ({
    title: column,
    dataIndex: column,
    key: column,
    ellipsis: true,
    render: (value: unknown) => {
      if (value === null || value === undefined) {
        return <Text type="secondary">-</Text>;
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    },
  }));

  return (
    <PageContainer title="数据库查询助手">
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Statistic title="可用数据源" value={sources.length} prefix={<DatabaseOutlined />} />
            </Col>
            <Col xs={24} lg={8}>
              <Statistic title="可用 Agent" value={agents.length} prefix={<RobotOutlined />} />
            </Col>
            <Col xs={24} lg={8}>
              <Statistic title="查询结果行数" value={queryResult?.rowCount ?? 0} prefix={<ThunderboltOutlined />} />
            </Col>
          </Row>
        </Card>

        <Row gutter={[20, 20]}>
          <Col xs={24} xl={8}>
            <Card title="生成控制台" style={{ height: '100%' }}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Select
                  placeholder="选择数据源"
                  value={selectedSourceId}
                  onChange={setSelectedSourceId}
                  options={sources.map((item) => ({
                    label: `${item.name} · ${resolveDatabaseTypeMeta(item.databaseType).label}`,
                    value: item.id,
                  }))}
                />
                <Select
                  placeholder="选择辅助 Agent"
                  value={fixedAgent?.id ?? selectedAgentId}
                  onChange={setSelectedAgentId}
                  disabled={Boolean(fixedAgent)}
                  options={agents.map((item) => ({ label: item.name, value: item.id }))}
                />
                <Input.TextArea
                  rows={6}
                  value={requirement}
                  onChange={(event) => setRequirement(event.target.value)}
                  placeholder="描述你想要的查询目标，例如：统计最近30天各城市新增订单金额趋势"
                />
                <Input.TextArea
                  rows={4}
                  value={extraContext}
                  onChange={(event) => setExtraContext(event.target.value)}
                  placeholder="补充业务上下文、字段约定、表名猜测等，可选"
                />
                {selectedSource && (
                  <Alert
                    type="info"
                    showIcon
                    message={`${selectedSource.name} · ${resolveDatabaseTypeMeta(selectedSource.databaseType).label}`}
                    description={[
                      selectedSource.host ? `Host: ${selectedSource.host}` : '',
                      selectedSource.database ? `Database: ${selectedSource.database}` : '',
                      selectedSource.schema ? `Schema: ${selectedSource.schema}` : '',
                      selectedSource.queryToolName ? `QueryTool: ${selectedSource.queryToolName}` : '',
                    ].filter(Boolean).join(' | ')}
                  />
                )}
                <Space>
                  <Button type="primary" loading={isGenerating} icon={<RobotOutlined />} onClick={handleGenerateSql}>
                    生成 SQL
                  </Button>
                  <Button
                    type="primary"
                    ghost
                    loading={executeQueryMutation.isPending}
                    icon={<PlayCircleOutlined />}
                    onClick={handleExecuteQuery}
                  >
                    执行查询
                  </Button>
                </Space>
                <Text type="secondary">
                  SQL 生成使用 Agent 模块，执行查询使用 MCP 数据源能力。默认仅允许只读 SQL。
                </Text>
              </Space>
            </Card>
          </Col>

          <Col xs={24} xl={16}>
            <Card
              title="SQL 编辑与执行结果"
              extra={(
                <Space>
                  <Select
                    value={preferredChartType}
                    onChange={(value) => setPreferredChartType(value)}
                    style={{ width: 120 }}
                    options={[
                      { label: '自动图表', value: 'auto' },
                      { label: '仅表格', value: 'table' },
                      { label: '柱状图', value: 'bar' },
                      { label: '折线图', value: 'line' },
                      { label: '饼图', value: 'pie' },
                    ]}
                  />
                  {queryResult?.toolName && <Tag color="blue">{queryResult.toolName}</Tag>}
                </Space>
              )}
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <MonacoEditor
                  value={sql}
                  onChange={(value) => setSql(value ?? '')}
                  language="sql"
                  height="260px"
                  options={{ minimap: { enabled: false } }}
                />
                {agentOutput && (
                  <Alert
                    type="success"
                    showIcon
                    message="Agent 输出"
                    description={(
                      <div style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                        {agentOutput}
                      </div>
                    )}
                  />
                )}
                {queryResult ? (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} lg={8}>
                        <Card size="small">
                          <Statistic title="返回行数" value={queryResult.rowCount} />
                        </Card>
                      </Col>
                      <Col xs={24} lg={8}>
                        <Card size="small">
                          <Statistic title="执行耗时" value={queryResult.elapsedMs ?? 0} suffix="ms" />
                        </Card>
                      </Col>
                      <Col xs={24} lg={8}>
                        <Card size="small">
                          <Statistic title="字段数" value={queryResult.columns.length} />
                        </Card>
                      </Col>
                    </Row>
                    {queryResult.warnings?.length ? (
                      <Alert
                        type="warning"
                        showIcon
                        message={queryResult.warnings.join('；')}
                      />
                    ) : null}
                    {chartOption ? (
                      <Card size="small" title="结果图表">
                        <LightweightECharts option={chartOption} style={{ height: 320 }} />
                      </Card>
                    ) : (
                      <Alert
                        type="info"
                        showIcon
                        message="当前结果未生成图表"
                        description="请尝试返回包含“一个维度字段 + 一个数值字段”的结果集，或手工调整 SQL。"
                      />
                    )}
                    <Card size="small" title="结果表格">
                      <Table
                        rowKey={(_, index) => String(index)}
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: true }}
                        columns={resultColumns}
                        dataSource={queryResult.rows}
                      />
                    </Card>
                  </Space>
                ) : (
                  <Empty
                    description="先生成 SQL，再执行查询获取结果"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    </PageContainer>
  );
}

import { useMemo, useState } from 'react';
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  StopOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  List,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useDatabaseSources } from '@/api/database';
import {
  useExecuteSemanticQuery,
  useExplainSemanticQuery,
  useInterpretSemanticQuery,
  usePrepareSemanticQueryPlan,
  useSemanticModels,
  useSemanticVersions,
} from '@/api/semantic';
import { resolveDatabaseTypeMeta } from '@/pages/integration/database/databaseMeta';
import type {
  SemanticQueryDimension,
  SemanticQueryFilter,
  SemanticQueryInterpretation,
  SemanticQueryMetric,
  SemanticQueryExecutionResult,
  SemanticQueryExplain,
  SemanticQueryPlan,
} from '@/types/semantic';

const { Text, Paragraph, Title } = Typography;

const statusMeta = {
  READY: { color: 'success', icon: <CheckCircleOutlined />, label: '已识别' },
  CLARIFICATION: { color: 'warning', icon: <ExclamationCircleOutlined />, label: '需要澄清' },
  REJECTED: { color: 'error', icon: <StopOutlined />, label: '无法处理' },
} as const;

function physicalReference(item: { physicalObject: string; physicalField: string }) {
  return [item.physicalObject, item.physicalField].filter(Boolean).join('.');
}

function IntentItem({
  item,
  type,
}: {
  item: SemanticQueryMetric | SemanticQueryDimension | SemanticQueryFilter;
  type: 'metric' | 'dimension' | 'filter';
}) {
  const detail = type === 'metric'
    ? `${(item as SemanticQueryMetric).aggregation} · ${physicalReference(item)}`
    : type === 'dimension'
      ? `${(item as SemanticQueryDimension).timeGrain || '明细'} · ${physicalReference(item)}`
      : `${(item as SemanticQueryFilter).operator} ${(item as SemanticQueryFilter).value} · ${physicalReference(item)}`;
  return (
    <List.Item>
      <List.Item.Meta
        title={<Text strong>{item.alias}</Text>}
        description={(
          <>
            <Tag color="blue">{type === 'metric' ? '指标' : type === 'dimension' ? '维度' : '过滤器'}</Tag>
            {detail}
          </>
        )}
      />
    </List.Item>
  );
}

function InterpretationPanel({
  interpretation,
  onClarification,
}: {
  interpretation?: SemanticQueryInterpretation;
  onClarification: (option: string) => void;
}) {
  if (!interpretation) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="输入自然语言问题并点击解释问题" />;
  }

  const meta = statusMeta[interpretation.status];
  const intent = interpretation.intent;
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type={meta.color}
        showIcon
        icon={meta.icon}
        message={<Space><span>{meta.label}</span><Tag>{interpretation.status}</Tag></Space>}
        description={interpretation.reasons.length ? interpretation.reasons.join('；') : '语义引擎已完成问题解析。'}
      />

      {interpretation.status === 'CLARIFICATION' && (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {interpretation.clarifications.map((clarification) => (
            <Card key={clarification.code} size="small" title={clarification.question}>
              <Space wrap>
                {clarification.options.map((option) => (
                  <Button key={option} size="small" onClick={() => onClarification(option)}>
                    {option}
                  </Button>
                ))}
              </Space>
            </Card>
          ))}
        </Space>
      )}

      {interpretation.status === 'READY' && intent && (
        <>
          <Row gutter={[12, 12]}>
            <Col xs={12} md={6}><Statistic title="指标" value={intent.metrics.length} /></Col>
            <Col xs={12} md={6}><Statistic title="维度" value={intent.dimensions.length} /></Col>
            <Col xs={12} md={6}><Statistic title="过滤器" value={intent.filters.length} /></Col>
            <Col xs={12} md={6}><Statistic title="返回上限" value={intent.limit} /></Col>
          </Row>
          <Card size="small" title="语义意图">
            <List
              size="small"
              dataSource={[
                ...intent.metrics.map((item) => ({ item, type: 'metric' as const })),
                ...intent.dimensions.map((item) => ({ item, type: 'dimension' as const })),
                ...intent.filters.map((item) => ({ item, type: 'filter' as const })),
              ]}
              renderItem={({ item, type }) => <IntentItem item={item} type={type} />}
            />
            {intent.timeRange && (
              <Alert
                type="info"
                showIcon
                message="时间范围"
                description={[
                  intent.timeRange.relativeDays ? `最近 ${intent.timeRange.relativeDays} 天` : '',
                  intent.timeRange.from && intent.timeRange.to
                    ? `${intent.timeRange.from} 至 ${intent.timeRange.to}`
                    : '',
                ].filter(Boolean).join('，') || '已识别时间字段'}
              />
            )}
          </Card>
          <Card size="small" title="物理血缘">
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {[...intent.metrics, ...intent.dimensions, ...intent.filters].map((item) => (
                <div key={`${item.iri}-${item.physicalObject}-${item.physicalField}`}>
                  <Text type="secondary">{item.alias}</Text>
                  <Text code style={{ marginLeft: 8 }}>{physicalReference(item)}</Text>
                </div>
              ))}
            </Space>
          </Card>
          <Alert
            type="info"
            showIcon
            message={`建议输出：${intent.output.view}`}
            description={`${intent.output.reason} 计划编译、EXPLAIN 和执行将在后续治理入口中完成。`}
          />
        </>
      )}
    </Space>
  );
}

function QueryPlanPanel({
  plan,
  explain,
  execution,
  explainLoading,
  executeLoading,
  onExplain,
  onExecute,
}: {
  plan?: SemanticQueryPlan;
  explain?: SemanticQueryExplain;
  execution?: SemanticQueryExecutionResult;
  explainLoading: boolean;
  executeLoading: boolean;
  onExplain: () => void;
  onExecute: () => void;
}) {
  if (!plan) return null;
  if (plan.status !== 'READY') {
    return (
      <Alert
        type={plan.status === 'CLARIFICATION' ? 'warning' : 'error'}
        showIcon
        message={plan.status === 'CLARIFICATION' ? '计划生成仍需澄清' : '无法生成计划'}
        description={plan.reasons.join('；') || '请调整问题后重试。'}
      />
    );
  }

  const resultColumns = (execution?.columns ?? []).map((column) => ({
    title: column.alias,
    dataIndex: column.alias,
    key: column.alias,
    ellipsis: true,
    render: (value: unknown) => value === null || value === undefined ? '-' : String(value),
  }));

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="success"
        showIcon
        message={<Space><span>计划已生成</span><Tag color="green">{plan.language}</Tag></Space>}
        description={plan.planHash ? `计划 hash：${plan.planHash}` : '计划 hash 不可用'}
      />
      {plan.statement && (
        <Card size="small" title="只读计划预览">
          <pre style={{ margin: 0, maxHeight: 220, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            {plan.statement}
          </pre>
        </Card>
      )}
      <Card size="small" title="计划列与物理血缘">
        <List
          size="small"
          dataSource={plan.columns}
          renderItem={(column) => (
            <List.Item>
              <List.Item.Meta
                title={<Text strong>{column.alias}</Text>}
                description={<><Tag>{column.role}</Tag><Text code>{column.expression}</Text></>}
              />
            </List.Item>
          )}
        />
        <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
          {plan.lineage.map((item) => (
            <Text key={`${item.semanticIri}-${item.physicalObject}-${item.physicalField}`} type="secondary">
              {item.semanticIri} → {item.physicalObject}.{item.physicalField}
            </Text>
          ))}
        </Space>
      </Card>
      {plan.warnings.length > 0 && <Alert type="warning" showIcon message={plan.warnings.join('；')} />}
      <Space wrap>
        <Button loading={explainLoading} onClick={onExplain}>查看 EXPLAIN</Button>
        <Button type="primary" loading={executeLoading} onClick={onExecute}>确认并执行</Button>
      </Space>
      {explain && (
        <Alert
          type="info"
          showIcon
          message="EXPLAIN 已完成"
          description={explain.warnings.length ? explain.warnings.join('；') : '资源检查通过，可以执行该计划。'}
        />
      )}
      {execution && (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Row gutter={[12, 12]}>
            <Col xs={12} md={8}><Statistic title="返回行数" value={execution.rowCount} /></Col>
            <Col xs={12} md={8}><Statistic title="执行耗时" value={execution.elapsedMs} suffix="ms" /></Col>
            <Col xs={12} md={8}><Statistic title="计划 hash" value={execution.planHash.slice(0, 12)} /></Col>
          </Row>
          {execution.warnings.length > 0 && <Alert type="warning" showIcon message={execution.warnings.join('；')} />}
          <Table
            rowKey={(_, index) => String(index)}
            size="small"
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
            columns={resultColumns}
            dataSource={execution.rows}
          />
        </Space>
      )}
    </Space>
  );
}

export default function DatabaseText2Sql() {
  const { data: sourcePage } = useDatabaseSources({ page: 1, size: 200 });
  const { data: modelPage } = useSemanticModels({ page: 1, size: 100, status: 'active' });
  const interpretMutation = useInterpretSemanticQuery();
  const planMutation = usePrepareSemanticQueryPlan();
  const explainMutation = useExplainSemanticQuery();
  const executeMutation = useExecuteSemanticQuery();
  const [selectedSourceId, setSelectedSourceId] = useState<string>();
  const [selectedModelId, setSelectedModelId] = useState<string>();
  const [selectedVersionId, setSelectedVersionId] = useState<string>();
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [interpretation, setInterpretation] = useState<SemanticQueryInterpretation>();
  const [plan, setPlan] = useState<SemanticQueryPlan>();
  const [explain, setExplain] = useState<SemanticQueryExplain>();
  const [execution, setExecution] = useState<SemanticQueryExecutionResult>();
  const sources = sourcePage?.records ?? [];
  const models = modelPage?.records ?? [];
  const effectiveSourceId = selectedSourceId ?? (sources.length === 1 ? sources[0].id : undefined);
  const effectiveModelId = selectedModelId ?? models[0]?.id;
  const { data: versions = [] } = useSemanticVersions(effectiveModelId);
  const publishedVersions = useMemo(
    () => versions.filter((version) => version.status === 'published'),
    [versions],
  );
  const effectiveVersionId = selectedVersionId && publishedVersions.some((version) => version.id === selectedVersionId)
    ? selectedVersionId
    : publishedVersions[0]?.id;
  const selectedSource = sources.find((source) => source.id === effectiveSourceId);
  const selectedModel = models.find((model) => model.id === effectiveModelId);
  const selectedVersion = publishedVersions.find((version) => version.id === effectiveVersionId);

  const interpret = async (nextContext = context) => {
    if (!effectiveSourceId || !effectiveVersionId || !question.trim()) return;
    try {
      const response = await interpretMutation.mutateAsync({
        question: question.trim(),
        semanticVersionId: effectiveVersionId,
        sourceId: effectiveSourceId,
        context: nextContext.trim() || undefined,
      });
      setInterpretation(response.data);
      setPlan(undefined);
      setExplain(undefined);
      setExecution(undefined);
    } catch {
      setInterpretation(undefined);
      setPlan(undefined);
      setExplain(undefined);
      setExecution(undefined);
    }
  };

  const handleClarification = (option: string) => {
    const nextContext = [context.trim(), `澄清选择：${option}`].filter(Boolean).join('\n');
    setContext(nextContext);
    void interpret(nextContext);
  };

  const queryRequest = (expectedPlanHash?: string) => ({
    question: question.trim(),
    semanticVersionId: effectiveVersionId as string,
    sourceId: effectiveSourceId as string,
    context: context.trim() || undefined,
    expectedPlanHash,
    maxRows: 5000,
    timeoutSeconds: 30,
  });

  const handlePreparePlan = async () => {
    if (interpretation?.status !== 'READY' || !effectiveSourceId || !effectiveVersionId || !question.trim()) return;
    try {
      const response = await planMutation.mutateAsync(queryRequest());
      setPlan(response.data);
      setExplain(undefined);
      setExecution(undefined);
    } catch {
      setPlan(undefined);
    }
  };

  const handleExplain = async () => {
    if (!plan?.planHash) return;
    try {
      const response = await explainMutation.mutateAsync(queryRequest(plan.planHash));
      setExplain(response.data);
    } catch {
      setExplain(undefined);
    }
  };

  const handleExecute = async () => {
    if (!plan?.planHash) return;
    try {
      const response = await executeMutation.mutateAsync(queryRequest(plan.planHash));
      setExecution(response.data);
    } catch {
      setExecution(undefined);
    }
  };

  const changeModel = (modelId: string) => {
    setSelectedModelId(modelId);
    setSelectedVersionId(undefined);
    setInterpretation(undefined);
    setPlan(undefined);
    setExplain(undefined);
    setExecution(undefined);
  };

  const clearQueryArtifacts = (setter: (value: string) => void, value: string) => {
    setter(value);
    setInterpretation(undefined);
    setPlan(undefined);
    setExplain(undefined);
    setExecution(undefined);
  };

  return (
    <PageContainer title="语义查询工作台">
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Statistic title="可用数据源" value={sources.length} prefix={<DatabaseOutlined />} />
            </Col>
            <Col xs={24} md={8}>
              <Statistic title="已发布语义模型" value={models.filter((model) => model.activeVersionId).length} prefix={<ApartmentOutlined />} />
            </Col>
            <Col xs={24} md={8}>
              <Statistic title="当前状态" value={interpretation ? statusMeta[interpretation.status].label : '待解释'} prefix={<ThunderboltOutlined />} />
            </Col>
          </Row>
        </Card>

        <Row gutter={[20, 20]}>
          <Col xs={24} xl={9}>
            <Card title="问题解释" style={{ height: '100%' }}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Select
                  placeholder="选择数据源"
                  value={effectiveSourceId}
                  onChange={(value) => clearQueryArtifacts(setSelectedSourceId, value)}
                  options={sources.map((source) => ({
                    label: `${source.name} · ${resolveDatabaseTypeMeta(source.databaseType).label}`,
                    value: source.id,
                  }))}
                />
                <Select
                  placeholder="选择已发布语义模型"
                  value={effectiveModelId}
                  onChange={changeModel}
                  options={models.map((model) => ({ label: `${model.name} · ${model.domain}`, value: model.id }))}
                  notFoundContent="暂无可用语义模型"
                />
                <Select
                  placeholder="选择已发布版本"
                  value={effectiveVersionId}
                  onChange={(value) => clearQueryArtifacts(setSelectedVersionId, value)}
                  disabled={!effectiveModelId}
                  options={publishedVersions.map((version) => ({
                    label: `v${version.versionNo} · ${version.tripleCount} 个语义节点`,
                    value: version.id,
                  }))}
                  notFoundContent="当前模型暂无已发布版本"
                />
                <Input.TextArea
                  rows={6}
                  value={question}
                  onChange={(event) => clearQueryArtifacts(setQuestion, event.target.value)}
                  placeholder="描述你想要的分析，例如：统计最近30天各城市新增订单金额趋势"
                  maxLength={2000}
                  showCount
                />
                <Input.TextArea
                  rows={3}
                  value={context}
                  onChange={(event) => clearQueryArtifacts(setContext, event.target.value)}
                  placeholder="补充业务口径或澄清选择，可选"
                  maxLength={1000}
                  showCount
                />
                {selectedSource && (
                  <Alert
                    type="info"
                    showIcon
                    message={`${selectedSource.name} · ${resolveDatabaseTypeMeta(selectedSource.databaseType).label}`}
                    description={[selectedSource.database, selectedSource.schema].filter(Boolean).join(' · ') || '已选择数据源'}
                  />
                )}
                {selectedModel && selectedVersion && (
                  <Text type="secondary">语义模型：{selectedModel.name} · 已发布 v{selectedVersion.versionNo}</Text>
                )}
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  loading={interpretMutation.isPending}
                  disabled={!effectiveSourceId || !effectiveVersionId || !question.trim()}
                  onClick={() => void interpret()}
                  block
                >
                  解释问题
                </Button>
                <Button
                  icon={<ThunderboltOutlined />}
                  loading={planMutation.isPending}
                  disabled={interpretation?.status !== 'READY'}
                  onClick={() => void handlePreparePlan()}
                  block
                >
                  生成只读计划
                </Button>
                <Text type="secondary">语义引擎只接收自然语言和已发布语义版本，浏览器不会生成或提交 SQL。</Text>
              </Space>
            </Card>
          </Col>

          <Col xs={24} xl={15}>
            <Card title="语义解释结果" extra={<Tag color="blue">QueryIntent</Tag>}>
              <InterpretationPanel interpretation={interpretation} onClarification={handleClarification} />
            </Card>
            <Card title="计划与执行" style={{ marginTop: 20 }}>
              <QueryPlanPanel
                plan={plan}
                explain={explain}
                execution={execution}
                explainLoading={explainMutation.isPending}
                executeLoading={executeMutation.isPending}
                onExplain={() => void handleExplain()}
                onExecute={() => void handleExecute()}
              />
              {!plan && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="先完成问题解释，再生成只读计划" />}
            </Card>
          </Col>
        </Row>

        {!models.length && (
          <Alert
            type="warning"
            showIcon
            message="暂无已发布语义模型"
            description={<><Title level={5}>先在语义模型库完成本体映射并发布版本</Title><Paragraph>发布后的版本才可用于自然语言分析，草稿和校验失败版本不会出现在这里。</Paragraph></>}
          />
        )}
      </Space>
    </PageContainer>
  );
}

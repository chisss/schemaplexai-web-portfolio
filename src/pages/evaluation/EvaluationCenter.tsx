import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Popconfirm,
  Progress,
  Row,
  Select,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { DeleteOutlined, EyeOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TFunction } from 'i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import LightweightECharts from '@/components/ECharts/LightweightECharts';
import { AnalyticsHeroCard, MetricCard, ReportSectionCard } from '@/components/analytics/AnalyticsCards';
import {
  useCreateEvaluationDataset,
  useCreateEvaluationTask,
  useDeleteEvaluationDataset,
  useEvaluationDataset,
  useEvaluationDatasets,
  useEvaluationTask,
  useEvaluationTasks,
  useRunEvaluationTask,
  useSaveEvaluationDatasetItems,
  useUpdateEvaluationDataset,
} from '@/api/evaluation';
import { useAiModels } from '@/api/system';
import { formatDateTime } from '@/utils/date';
import type {
  EvalDataset,
  EvalDatasetCreateDTO,
  EvalDatasetItem,
  EvalTask,
  EvalTaskResultItem,
} from '@/types/evaluation';

const { Paragraph, Text } = Typography;
const { TextArea } = Input;

const STATUS_COLOR_MAP: Record<string, string> = {
  PENDING: 'default',
  RUNNING: 'processing',
  DONE: 'success',
  FAILED: 'error',
};

function normalizeStatus(status?: string) {
  return status ? status.toUpperCase() : 'PENDING';
}

function buildRadarOption(task: NonNullable<ReturnType<typeof useEvaluationTask>['data']>, t: TFunction) {
  const summaries = task.modelSummaries || [];
  const maxLatency = Math.max(...summaries.map((item) => item.avgLatencyMs || 0), 1);
  const maxCost = Math.max(...summaries.map((item) => item.avgCost || 0), 1);
  const radarData = summaries.map((item) => ({
    name: item.modelName,
    value: [
      Math.max(0, 100 - ((item.avgLatencyMs || 0) / maxLatency) * 100),
      Math.max(0, 100 - ((item.avgCost || 0) / maxCost) * 100),
      item.avgScore || 0,
      item.successRate || 0,
    ],
  }));

  return {
    tooltip: { trigger: 'item' },
    legend: { top: 0 },
    radar: {
      radius: '62%',
      indicator: [
        { name: t('evaluation.radar.latency'), max: 100 },
        { name: t('evaluation.radar.cost'), max: 100 },
        { name: t('evaluation.radar.score'), max: 100 },
        { name: t('evaluation.radar.stability'), max: 100 },
      ],
      splitArea: {
        areaStyle: {
          color: ['rgba(22, 119, 255, 0.04)', 'rgba(22, 119, 255, 0.02)'],
        },
      },
    },
    series: [
      {
        type: 'radar',
        data: radarData,
        areaStyle: { opacity: 0.18 },
      },
    ],
  };
}

function resolveTaskRoute(taskId?: string) {
  return taskId ? `/evaluation/${taskId}` : '/evaluation/tasks';
}

export default function EvaluationCenter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { taskId } = useParams<{ taskId: string }>();
  const [datasetForm] = Form.useForm();
  const [taskForm] = Form.useForm();
  const [datasetQuery, setDatasetQuery] = useState({ page: 1, size: 8, keyword: '' });
  const [taskQuery, setTaskQuery] = useState({ page: 1, size: 10, status: undefined as string | undefined });
  const [datasetModalOpen, setDatasetModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingDatasetId, setEditingDatasetId] = useState<string>();

  const activeTab = useMemo(() => {
    if (taskId) {
      return 'results';
    }
    if (location.pathname.includes('/tasks')) {
      return 'tasks';
    }
    return 'datasets';
  }, [location.pathname, taskId]);

  const datasetPage = useEvaluationDatasets(datasetQuery);
  const editingDataset = useEvaluationDataset(editingDatasetId);
  const taskPage = useEvaluationTasks(taskQuery);
  const taskDetail = useEvaluationTask(taskId, true);
  const aiModels = useAiModels();
  const createDatasetMutation = useCreateEvaluationDataset();
  const updateDatasetMutation = useUpdateEvaluationDataset();
  const saveDatasetItemsMutation = useSaveEvaluationDatasetItems();
  const deleteDatasetMutation = useDeleteEvaluationDataset();
  const createTaskMutation = useCreateEvaluationTask();
  const runTaskMutation = useRunEvaluationTask();

  useEffect(() => {
    if (!datasetModalOpen) {
      return;
    }
    if (!editingDatasetId) {
      datasetForm.setFieldsValue({
        name: '',
        description: '',
        items: [{ inputText: '', expectedOutput: '' }],
      });
      return;
    }
    if (editingDataset.data) {
      datasetForm.setFieldsValue({
        name: editingDataset.data.name,
        description: editingDataset.data.description,
        items: editingDataset.data.items?.length
          ? editingDataset.data.items.map((item) => ({
              inputText: item.inputText,
              expectedOutput: item.expectedOutput,
              metadata: item.metadata,
              sortOrder: item.sortOrder,
            }))
          : [{ inputText: '', expectedOutput: '' }],
      });
    }
  }, [datasetForm, datasetModalOpen, editingDataset.data, editingDatasetId]);

  const openCreateDatasetModal = () => {
    setEditingDatasetId(undefined);
    setDatasetModalOpen(true);
  };

  const openEditDatasetModal = (datasetId: string) => {
    setEditingDatasetId(datasetId);
    setDatasetModalOpen(true);
  };

  const handleSaveDataset = async () => {
    const values = await datasetForm.validateFields();
    const items = (values.items || []).filter((item: EvalDatasetItem) => item?.inputText);
    if (!editingDatasetId) {
      const payload: EvalDatasetCreateDTO = {
        name: values.name,
        description: values.description,
        items,
      };
      await createDatasetMutation.mutateAsync(payload);
      message.success(t('common.createSuccess'));
    } else {
      await updateDatasetMutation.mutateAsync({
        id: editingDatasetId,
        data: {
          name: values.name,
          description: values.description,
        },
      });
      await saveDatasetItemsMutation.mutateAsync({
        id: editingDatasetId,
        data: { items },
      });
      message.success(t('common.saveSuccess'));
    }
    setDatasetModalOpen(false);
  };

  const handleDeleteDataset = async (id: string) => {
    await deleteDatasetMutation.mutateAsync(id);
    message.success(t('common.deleteSuccess'));
  };

  const handleCreateTask = async () => {
    const values = await taskForm.validateFields();
    await createTaskMutation.mutateAsync({
      name: values.name,
      datasetId: values.datasetId,
      modelIds: values.modelIds,
    });
    message.success(t('common.createSuccess'));
    setTaskModalOpen(false);
    navigate('/evaluation/tasks');
  };

  const handleRunTask = async (id: string) => {
    await runTaskMutation.mutateAsync(id);
    message.success(t('evaluation.taskRerunSuccess'));
  };

  const datasetCards = datasetPage.data?.records || [];
  const taskRecords = taskPage.data?.records || [];
  const taskDetailData = taskDetail.data;
  const taskSummaryCards = useMemo(
    () => taskDetailData?.modelSummaries ?? [],
    [taskDetailData],
  );
  const latestDatasetUsedAt = datasetCards
    .map((item) => item.lastUsedAt)
    .filter((item): item is string => Boolean(item))
    .sort((left, right) => right.localeCompare(left))[0];
  const datasetSampleCount = datasetCards.reduce((total, item) => total + (item.itemCount || 0), 0);
  const taskStatusSummary = taskRecords.reduce<Record<string, number>>((acc, item) => {
    const status = normalizeStatus(item.status);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const bestModel = [...taskSummaryCards].sort((left, right) => (right.avgScore || 0) - (left.avgScore || 0))[0];
  const avgLatency = taskSummaryCards.length
    ? taskSummaryCards.reduce((total, item) => total + (item.avgLatencyMs || 0), 0) / taskSummaryCards.length
    : 0;
  const avgCost = taskSummaryCards.length
    ? taskSummaryCards.reduce((total, item) => total + (item.avgCost || 0), 0) / taskSummaryCards.length
    : 0;
  const overviewConfig = activeTab === 'datasets'
    ? {
        kicker: t('evaluation.datasetsTab'),
        title: t('evaluation.datasetsDeckTitle'),
        description: t('evaluation.datasetsDeckDescription'),
        stats: [
          { label: t('evaluation.summaryDatasetCount'), value: datasetPage.data?.total ?? 0, footer: t('evaluation.datasetsTab') },
          { label: t('evaluation.summarySampleCount'), value: datasetSampleCount, footer: t('evaluation.itemCount', { count: datasetSampleCount }) },
          { label: t('evaluation.summaryRecentUse'), value: latestDatasetUsedAt ? formatDateTime(latestDatasetUsedAt) : '-', footer: t('evaluation.lastUsedAt') },
        ],
      }
    : activeTab === 'tasks'
    ? {
        kicker: t('evaluation.tasksTab'),
        title: t('evaluation.tasksDeckTitle'),
        description: t('evaluation.tasksDeckDescription'),
        stats: [
          { label: t('evaluation.summaryTaskCount'), value: taskPage.data?.total ?? 0, footer: t('evaluation.tasksTab') },
          { label: t('evaluation.summaryRunningCount'), value: taskStatusSummary.RUNNING || 0, footer: 'RUNNING' },
          { label: t('evaluation.summaryDoneCount'), value: taskStatusSummary.DONE || 0, footer: 'DONE' },
        ],
      }
    : {
        kicker: t('evaluation.resultsTab'),
        title: t('evaluation.resultsDeckTitle'),
        description: t('evaluation.resultsDeckDescription'),
        stats: [
          { label: t('evaluation.summaryBestModel'), value: bestModel?.modelName || '-', footer: bestModel ? `${t('evaluation.radar.score')} ${bestModel.avgScore.toFixed(1)}` : '-' },
          { label: t('evaluation.summaryAverageLatency'), value: `${avgLatency.toFixed(0)}ms`, footer: t('evaluation.latency') },
          { label: t('evaluation.summaryAverageCost'), value: `$${avgCost.toFixed(4)}`, footer: t('evaluation.cost') },
        ],
      };

  const resultTableColumns = useMemo<TableColumnsType<EvalTaskResultItem>>(() => {
    if (!taskDetailData) {
      return [];
    }
    const baseColumns = [
      {
        title: t('evaluation.inputText'),
        dataIndex: 'inputText',
        key: 'inputText',
        width: 260,
        render: (value: string) => <Paragraph style={{ marginBottom: 0 }}>{value || '-'}</Paragraph>,
      },
      {
        title: t('evaluation.expectedOutput'),
        dataIndex: 'expectedOutput',
        key: 'expectedOutput',
        width: 240,
        render: (value: string) => <Paragraph style={{ marginBottom: 0 }}>{value || '-'}</Paragraph>,
      },
    ];
    const modelColumns = taskSummaryCards.map((summary) => ({
      title: summary.modelName,
      key: summary.modelId,
      width: 300,
      render: (_: unknown, record: EvalTaskResultItem) => {
        const result = record.modelResults.find((item) => item.modelId === summary.modelId);
        if (!result) {
          return <Text type="secondary">-</Text>;
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Tag color={STATUS_COLOR_MAP[normalizeStatus(result.status)] || 'default'}>
              {normalizeStatus(result.status)}
            </Tag>
            <Paragraph style={{ marginBottom: 0 }} ellipsis={{ rows: 4, expandable: true, symbol: t('common.view') }}>
              {result.outputText || result.errorMessage || '-'}
            </Paragraph>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Text type="secondary">{t('evaluation.radar.score')}: {result.score ?? 0}</Text>
              <Text type="secondary">{t('evaluation.latency')}: {result.latencyMs ?? 0}ms</Text>
              <Text type="secondary">{t('evaluation.cost')}: ${(result.cost ?? 0).toFixed(4)}</Text>
            </div>
          </div>
        );
      },
    }));
    return [...baseColumns, ...modelColumns];
  }, [t, taskDetailData, taskSummaryCards]);

  return (
    <PageContainer
      title={t('menu.evaluation')}
      description={t('evaluation.pageDescription')}
      extra={(
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-end' }}>
          {activeTab === 'datasets' && (
            <>
              <Input.Search
                placeholder={t('evaluation.datasetSearch')}
                allowClear
                style={{ width: 260 }}
                onSearch={(value) => setDatasetQuery((prev) => ({ ...prev, page: 1, keyword: value }))}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDatasetModal}>
                {t('evaluation.createDataset')}
              </Button>
            </>
          )}
          {activeTab === 'tasks' && (
            <>
              <Select
                allowClear
                style={{ width: 180 }}
                placeholder={t('evaluation.statusFilter')}
                value={taskQuery.status}
                onChange={(value) => setTaskQuery((prev) => ({ ...prev, page: 1, status: value }))}
                options={[
                  { label: 'PENDING', value: 'PENDING' },
                  { label: 'RUNNING', value: 'RUNNING' },
                  { label: 'DONE', value: 'DONE' },
                  { label: 'FAILED', value: 'FAILED' },
                ]}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setTaskModalOpen(true)}>
                {t('evaluation.createTask')}
              </Button>
            </>
          )}
          {activeTab === 'results' && taskId && (
            <Button icon={<ReloadOutlined />} onClick={() => handleRunTask(taskId)}>
              {t('evaluation.rerunTask')}
            </Button>
          )}
        </div>
      )}
    >
      <AnalyticsHeroCard
        kicker={overviewConfig.kicker}
        title={overviewConfig.title}
        description={overviewConfig.description}
        stats={overviewConfig.stats}
      />

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          if (key === 'datasets') {
            navigate('/evaluation/datasets');
            return;
          }
          if (key === 'tasks') {
            navigate('/evaluation/tasks');
            return;
          }
          navigate(resolveTaskRoute(taskId));
        }}
        items={[
          {
            key: 'datasets',
            label: t('evaluation.datasetsTab'),
            children: (
              <Spin spinning={datasetPage.isLoading || (datasetModalOpen && !!editingDatasetId && editingDataset.isLoading)}>
                {datasetCards.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Row gutter={[16, 16]}>
                      {datasetCards.map((dataset: EvalDataset) => (
                        <Col xs={24} md={12} xl={8} key={dataset.id}>
                          <Card
                            variant="borderless"
                            title={dataset.name}
                            extra={<Tag color="blue" style={{ margin: 0 }}>{t('evaluation.itemCount', { count: dataset.itemCount })}</Tag>}
                            style={{ height: '100%' }}
                            actions={[
                              <Button key="edit" type="link" onClick={() => openEditDatasetModal(dataset.id)}>{t('common.edit')}</Button>,
                              <Popconfirm
                                key="delete"
                                title={t('common.deleteConfirm')}
                                onConfirm={() => handleDeleteDataset(dataset.id)}
                              >
                                <Button type="link" danger icon={<DeleteOutlined />}>
                                  {t('common.delete')}
                                </Button>
                              </Popconfirm>,
                            ]}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                              <Paragraph ellipsis={{ rows: 3 }} style={{ minHeight: 66, marginBottom: 0 }}>
                                {dataset.description || t('common.noDescription')}
                              </Paragraph>
                              <div
                                style={{
                                  display: 'grid',
                                  gap: 10,
                                  padding: 14,
                                  borderRadius: 16,
                                  background: 'var(--color-fill-light)',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                  <Text type="secondary">{t('evaluation.lastUsedAt')}</Text>
                                  <Text>{dataset.lastUsedAt ? formatDateTime(dataset.lastUsedAt) : '-'}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                  <Text type="secondary">{t('common.createTime')}</Text>
                                  <Text>{dataset.createdAt ? formatDateTime(dataset.createdAt) : '-'}</Text>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                    <Pagination
                      align="end"
                      current={datasetPage.data?.current}
                      pageSize={datasetPage.data?.size}
                      total={datasetPage.data?.total}
                      onChange={(page, size) => setDatasetQuery((prev) => ({ ...prev, page, size }))}
                    />
                  </div>
                ) : (
                  <Empty description={t('evaluation.emptyDataset')} />
                )}
              </Spin>
            ),
          },
          {
            key: 'tasks',
            label: t('evaluation.tasksTab'),
            children: (
              <ReportSectionCard title={t('evaluation.tasksTab')} description={t('evaluation.tasksDeckDescription')}>
                <Table
                  rowKey="id"
                  loading={taskPage.isLoading}
                  dataSource={taskRecords}
                  pagination={{
                    current: taskPage.data?.current,
                    pageSize: taskPage.data?.size,
                    total: taskPage.data?.total,
                    onChange: (page, size) => setTaskQuery((prev) => ({ ...prev, page, size })),
                  }}
                  columns={[
                    {
                      title: t('common.name'),
                      dataIndex: 'name',
                      key: 'name',
                    },
                    {
                      title: t('evaluation.dataset'),
                      dataIndex: 'datasetName',
                      key: 'datasetName',
                    },
                    {
                      title: t('evaluation.models'),
                      dataIndex: 'modelNames',
                      key: 'modelNames',
                      render: (value: string[]) => (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {(value || []).map((item) => <Tag key={item}>{item}</Tag>)}
                        </div>
                      ),
                    },
                    {
                      title: t('common.status'),
                      dataIndex: 'status',
                      key: 'status',
                      render: (value: string) => <Tag color={STATUS_COLOR_MAP[normalizeStatus(value)] || 'default'}>{normalizeStatus(value)}</Tag>,
                    },
                    {
                      title: t('evaluation.progress'),
                      dataIndex: 'progress',
                      key: 'progress',
                      width: 180,
                      render: (value: number) => <Progress percent={Math.round(value || 0)} size="small" />,
                    },
                    {
                      title: t('common.updateTime'),
                      dataIndex: 'finishedAt',
                      key: 'finishedAt',
                      render: (value: string, record: EvalTask) => formatDateTime(value || record.createdAt),
                    },
                    {
                      title: t('common.actions'),
                      key: 'actions',
                      width: 180,
                      render: (_: unknown, record: EvalTask) => (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/evaluation/${record.id}`)}>
                            {t('common.detail')}
                          </Button>
                          <Button type="link" icon={<ReloadOutlined />} onClick={() => handleRunTask(record.id)}>
                            {t('evaluation.rerunTask')}
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                />
              </ReportSectionCard>
            ),
          },
          ...(taskId ? [{
            key: 'results',
            label: t('evaluation.resultsTab'),
            children: taskDetail.isLoading ? (
              <Spin spinning />
            ) : !taskDetailData ? (
              <Empty description={t('evaluation.emptyTask')} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <AnalyticsHeroCard
                  kicker={t('evaluation.resultsTab')}
                  title={taskDetailData.name}
                  description={(
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <Tag color={STATUS_COLOR_MAP[normalizeStatus(taskDetailData.status)] || 'default'}>
                        {normalizeStatus(taskDetailData.status)}
                      </Tag>
                      <Tag>{taskDetailData.datasetName || '-'}</Tag>
                    </div>
                  )}
                  stats={[
                    { label: t('evaluation.progress'), value: `${Math.round(taskDetailData.progress || 0)}%` },
                    { label: t('evaluation.dataset'), value: taskDetailData.datasetName || '-' },
                    { label: t('evaluation.models'), value: taskDetailData.modelNames?.length || 0 },
                  ]}
                />

                <Row gutter={[16, 16]}>
                  {taskSummaryCards.map((item) => (
                    <Col xs={24} md={12} xl={6} key={item.modelId}>
                      <MetricCard
                        title={item.modelName}
                        value={item.avgScore.toFixed(1)}
                        footer={(
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Text>{t('evaluation.latency')}: {item.avgLatencyMs.toFixed(0)}ms</Text>
                            <Text>{t('evaluation.cost')}: ${item.avgCost.toFixed(4)}</Text>
                            <Text>{t('evaluation.radar.stability')}: {item.successRate.toFixed(1)}%</Text>
                          </div>
                        )}
                        tone="primary"
                      />
                    </Col>
                  ))}
                </Row>

                <ReportSectionCard title={t('evaluation.resultsOverview')} description={t('evaluation.resultsOverviewHint')}>
                  <LightweightECharts option={buildRadarOption(taskDetailData, t)} height={360} />
                </ReportSectionCard>

                <ReportSectionCard title={t('evaluation.itemComparison')} description={t('evaluation.itemComparisonHint')}>
                  <Table
                    rowKey="itemId"
                    scroll={{ x: 'max-content' }}
                    pagination={{ pageSize: 10 }}
                    dataSource={taskDetailData.resultItems}
                    columns={resultTableColumns}
                  />
                </ReportSectionCard>
              </div>
            ),
	          }] : [])
	        ]}
	      />

      <Modal
        title={editingDatasetId ? t('evaluation.editDataset') : t('evaluation.createDataset')}
        open={datasetModalOpen}
        onOk={handleSaveDataset}
        onCancel={() => setDatasetModalOpen(false)}
        width={960}
        confirmLoading={createDatasetMutation.isPending || updateDatasetMutation.isPending || saveDatasetItemsMutation.isPending}
        destroyOnHidden
      >
        <Form form={datasetForm} layout="vertical">
          <Form.Item
            name="name"
            label={t('common.name')}
            rules={[{ required: true, message: t('evaluation.datasetNameRequired') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t('common.description')}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={t('evaluation.itemIndex', { index: index + 1 })}
                    extra={fields.length > 1 ? (
                      <Button type="link" danger onClick={() => remove(field.name)}>
                        {t('common.delete')}
                      </Button>
                    ) : null}
                  >
                    <Row gutter={[12, 12]}>
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'inputText']}
                          label={t('evaluation.inputText')}
                          rules={[{ required: true, message: t('evaluation.inputRequired') }]}
                        >
                          <TextArea rows={4} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'expectedOutput']}
                          label={t('evaluation.expectedOutput')}
                        >
                          <TextArea rows={4} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'sortOrder']}
                          label={t('common.sortOrder')}
                        >
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button block icon={<PlusOutlined />} onClick={() => add({ inputText: '', expectedOutput: '' })}>
                  {t('evaluation.addItem')}
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title={t('evaluation.createTask')}
        open={taskModalOpen}
        onOk={handleCreateTask}
        onCancel={() => setTaskModalOpen(false)}
        confirmLoading={createTaskMutation.isPending}
        destroyOnHidden
      >
        <Form form={taskForm} layout="vertical">
          <Form.Item name="name" label={t('common.name')}>
            <Input placeholder={t('evaluation.taskNamePlaceholder')} />
          </Form.Item>
          <Form.Item
            name="datasetId"
            label={t('evaluation.dataset')}
            rules={[{ required: true, message: t('evaluation.datasetRequired') }]}
          >
            <Select
              options={datasetCards.map((item) => ({
                label: `${item.name} (${item.itemCount})`,
                value: item.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="modelIds"
            label={t('evaluation.models')}
            rules={[{ required: true, message: t('evaluation.modelsRequired') }]}
          >
            <Select
              mode="multiple"
              options={(aiModels.data || []).map((item) => ({
                label: item.name,
                value: item.id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

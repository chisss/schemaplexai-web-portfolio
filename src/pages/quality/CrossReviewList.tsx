import { useMemo, useState } from 'react';
import { Badge, Button, Card, Drawer, Form, Input, message, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCrossReviewDetail, useCrossReviews, useCreateCrossReview, useQualityProfiles } from '@/api/quality';
import { useSpecDetail, useSpecList } from '@/api/spec';
import { useAiModels } from '@/api/system';
import type { CrossReview, CrossReviewQueryDTO } from '@/types/quality';
import type { Spec } from '@/types/spec';
import { formatDateTime } from '@/utils/date';
import PageContainer from '@/components/PageContainer/PageContainer';
import CrossReviewDetailView from './components/CrossReviewDetailView';

const { Text } = Typography;
const COMPLETED_SPEC_STATUSES = new Set(['completed', 'acceptance', 'archived']);

interface CrossReviewListProps {
  embedded?: boolean;
}

export default function CrossReviewList({ embedded = false }: CrossReviewListProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState<CrossReviewQueryDTO>({ page: 1, size: 10 });
  const [keywordInput, setKeywordInput] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string>();
  const [form] = Form.useForm();
  const selectedSpecId = Form.useWatch('specId', form);

  const { data: pageData, isLoading } = useCrossReviews(query);
  const { data: reviewDetail, isLoading: detailLoading } = useCrossReviewDetail(selectedReviewId || '');
  const { data: specPage } = useSpecList({ page: 1, size: 200 });
  const { data: selectedSpecDetail } = useSpecDetail(selectedSpecId || '');
  const { data: modelList } = useAiModels();
  const { data: profileList } = useQualityProfiles();
  const createMutation = useCreateCrossReview();

  const specOptions = useMemo(
    () => (specPage?.records || [])
      .filter((item: Spec) => COMPLETED_SPEC_STATUSES.has(item.status))
      .map((item: Spec) => ({ value: item.id, label: item.name })),
    [specPage?.records],
  );
  const modelOptions = useMemo(() => (modelList || []).map((item) => ({ value: item.id, label: item.name })), [modelList]);
  const profileOptions = useMemo(() => (profileList || []).map((item) => ({ value: item.id, label: `${item.name} (${item.code})` })), [profileList]);

  const statusMap = useMemo<Record<string, { text: string; status: 'success' | 'processing' | 'error' | 'warning' | 'default' }>>(() => ({
    pending: { text: t('quality.crossReview.statusPending'), status: 'default' },
    running: { text: t('quality.crossReview.statusRunning'), status: 'processing' },
    reviewing: { text: t('quality.crossReview.statusReviewing'), status: 'processing' },
    completed: { text: t('quality.crossReview.statusCompleted'), status: 'success' },
    succeeded: { text: t('quality.crossReview.statusCompleted'), status: 'success' },
    failed: { text: t('quality.crossReview.statusFailed'), status: 'error' },
    cancelled: { text: t('quality.crossReview.statusCancelled'), status: 'warning' },
  }), [t]);

  const columns = [
    {
      title: t('quality.crossReview.columnId'),
      dataIndex: 'id',
      key: 'id',
      width: 220,
      ellipsis: true,
      render: (value: string, record: CrossReview) => <Button type="link" style={{ padding: 0 }} onClick={() => setSelectedReviewId(record.id)}>{value}</Button>,
    },
    {
      title: 'Spec',
      dataIndex: 'specName',
      key: 'specName',
      width: 180,
      ellipsis: true,
      render: (value: string) => value || '-',
    },
    {
      title: t('quality.crossReview.columnIssueType'),
      dataIndex: 'issueType',
      key: 'issueType',
      width: 120,
      render: (value: string) => {
        if (value === 'deviation') return <Tag color="orange">{t('quality.crossReview.issueTypeDeviation')}</Tag>;
        if (value === 'intent_defect') return <Tag color="blue">{t('quality.crossReview.issueTypeIntentDefect')}</Tag>;
        return <Tag color="purple">{t('quality.crossReview.issueTypeBoth')}</Tag>;
      },
    },
    {
      title: t('quality.crossReview.columnModels'),
      key: 'models',
      width: 280,
      render: (_: unknown, record: CrossReview) => (
        <Space wrap>
          <Tag>{record.modelAName || record.modelAId}</Tag>
          {record.modelBId ? <Tag>{record.modelBName || record.modelBId}</Tag> : <Tag>{t('quality.crossReview.singleModel')}</Tag>}
        </Space>
      ),
    },
    {
      title: t('quality.crossReview.columnStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: string) => {
        const cfg = statusMap[(value || '').toLowerCase()] || { text: value, status: 'default' as const };
        return <Badge status={cfg.status} text={cfg.text} />;
      },
    },
    {
      title: t('quality.crossReview.columnCreatedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
  ];

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        variant="borderless"
        className="shadow-sm"
        title={t('quality.crossReview.resultCardTitle')}
        extra={(
          <Button icon={<PlusOutlined />} type="primary" onClick={() => setCreateOpen(true)}>
            {t('quality.crossReview.createButton')}
          </Button>
        )}
      >
        <Space wrap style={{ marginBottom: 12 }}>
          <Select
            allowClear
            showSearch
            placeholder="Spec"
            style={{ minWidth: 140, flex: 1, maxWidth: 240 }}
            value={query.specId}
            onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, specId: value }))}
            options={specOptions}
          />
          <Select
            allowClear
            placeholder={t('quality.crossReview.filterStatusPlaceholder')}
            style={{ minWidth: 100, flex: 1, maxWidth: 160 }}
            value={query.status}
            onChange={(value) => setQuery((prev) => ({ ...prev, page: 1, status: value }))}
            options={[
              { label: t('quality.crossReview.statusPending'), value: 'pending' },
              { label: t('quality.crossReview.statusRunning'), value: 'running' },
              { label: t('quality.crossReview.statusCompleted'), value: 'succeeded' },
              { label: t('quality.crossReview.statusFailed'), value: 'failed' },
            ]}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t('quality.crossReview.searchByIdPlaceholder')}
            style={{ minWidth: 160, flex: 1, maxWidth: 280 }}
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
          />
        </Space>
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          scroll={{ x: 1240 }}
          dataSource={(pageData?.records || []).filter((item) => !keywordInput || item.id.includes(keywordInput))}
          pagination={{
            current: query.page || 1,
            pageSize: query.size || 10,
            total: pageData?.total || 0,
            onChange: (page, size) => setQuery((prev) => ({ ...prev, page, size })),
            showSizeChanger: true,
            showTotal: (total) => t('common.total', { total }),
          }}
        />
      </Card>

      <Modal
        title={t('quality.crossReview.createModalTitle')}
        open={createOpen}
        destroyOnHidden
        onCancel={() => {
          setCreateOpen(false);
          form.resetFields();
        }}
        confirmLoading={createMutation.isPending}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ issueType: 'both' }}
          onFinish={(values) => {
            const modelIds: string[] = values.modelIds || [];
            if (modelIds.length < 1 || modelIds.length > 2) {
              message.warning(t('quality.crossReview.pleaseSelectModels'));
              return;
            }
            if (!selectedSpecDetail || !COMPLETED_SPEC_STATUSES.has(selectedSpecDetail.status)) {
              message.warning('仅支持对已完成的 Spec 发起交叉审查');
              return;
            }
            if (!selectedSpecDetail.primaryArtifactId) {
              message.warning('所选 Spec 尚未生成主产物，无法执行交叉审查');
              return;
            }
            createMutation.mutate(
              {
                specId: values.specId,
                taskId: values.taskId,
                profileId: values.profileId,
                issueType: values.issueType,
                artifactId: selectedSpecDetail.primaryArtifactId,
                targetContent: values.targetContent,
                referenceContent: values.referenceContent,
                modelIds,
              },
              {
                onSuccess: () => {
                  message.success(t('quality.crossReview.createSuccess'));
                  setCreateOpen(false);
                  form.resetFields();
                },
              },
            );
          }}
        >
          <Form.Item
            name="specId"
            label="Spec"
            extra="仅支持已完成且已生成主产物的 Spec，系统会优先扫描最终交付产物。"
            rules={[{ required: true, message: t('quality.crossReview.pleaseSelectSpec') }]}
          >
            <Select showSearch optionFilterProp="label" options={specOptions} />
          </Form.Item>
          <Form.Item name="profileId" label={t('quality.crossReview.profileLabel')}>
            <Select allowClear showSearch options={profileOptions} placeholder={t('quality.crossReview.profilePlaceholder')} />
          </Form.Item>
          <Form.Item name="issueType" label={t('quality.crossReview.issueTypeLabel')}>
            <Select
              options={[
                { label: t('quality.crossReview.issueTypeBoth'), value: 'both' },
                { label: t('quality.crossReview.issueTypeDeviation'), value: 'deviation' },
                { label: t('quality.crossReview.issueTypeIntentDefect'), value: 'intent_defect' },
              ]}
            />
          </Form.Item>
          <Form.Item name="modelIds" label={t('quality.crossReview.modelSelectLabel')} rules={[{ required: true, message: t('quality.crossReview.pleaseSelectModel') }]}>
            <Select mode="multiple" maxCount={2} options={modelOptions} placeholder={t('quality.crossReview.modelSelectPlaceholder')} />
          </Form.Item>
          <Form.Item name="taskId" label={t('quality.crossReview.taskIdLabel')}>
            <Input placeholder={t('quality.crossReview.taskIdPlaceholder')} />
          </Form.Item>
          <Form.Item name="targetContent" label="审查对象（可选）" extra="不填则自动使用 Spec 主产物内容">
            <Input.TextArea rows={3} placeholder="粘贴自定义的待审查内容" />
          </Form.Item>
          <Form.Item name="referenceContent" label="参照基线（可选）" extra="不填则自动从 Spec 描述或文档解析">
            <Input.TextArea rows={3} placeholder="粘贴自定义的参照基线内容（如用户需求/PRD）" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        size={typeof window !== 'undefined' && window.innerWidth < 768 ? 'default' : 'large'}
        title={t('quality.crossReview.drawerTitle')}
        open={!!selectedReviewId}
        onClose={() => setSelectedReviewId(undefined)}
      >
        {detailLoading && <Text>{t('quality.crossReview.loading')}</Text>}
        {!detailLoading && reviewDetail ? <CrossReviewDetailView review={reviewDetail} /> : null}
      </Drawer>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <PageContainer title={t('quality.crossReview.pageTitle')}>
      {content}
    </PageContainer>
  );
}

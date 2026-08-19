import { useEffect, useState } from 'react';
import {
  Alert, Card, Descriptions, Button, Tag, Space, Tabs, Table, Spin, Modal,
  Form, Input, Select, Upload, message, Popconfirm, Typography,
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, PlusOutlined,
  CameraOutlined, UndoOutlined, EyeOutlined, UploadOutlined, DownloadOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import PageContainer from '@/components/PageContainer/PageContainer';
import {
  useContextDetail,
  useContextItems,
  useAddContextItem,
  useUpdateContextItem,
  useDeleteContextItem,
  useContextSnapshots,
  useCreateContextSnapshot,
  useRestoreContextSnapshot,
  useKnowledgeDocuments,
  useUploadKnowledgeDocument,
  fetchKnowledgeDocumentDownloadUrl,
} from '@/api/context';
import { useRagOperations } from '@/api/system';
import type { ContextItem, ContextSnapshot, KnowledgeDocument } from '@/types/context';
import type { RagOperationLog } from '@/types/system';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDateTime } from '@/utils/date';

const VECTOR_STATUS_MAP: Record<string, { color: string; label: string }> = {
  completed: { color: 'success', label: '已向量化' },
  processing: { color: 'processing', label: '处理中' },
  scanning: { color: 'warning', label: '安全扫描中' },
  failed: { color: 'error', label: '失败' },
  blocked: { color: 'error', label: '已拦截' },
  pending: { color: 'default', label: '待处理' },
  none: { color: 'default', label: '未构建' },
};

const RAG_LOG_STATUS_MAP: Record<string, { color: string; label: string }> = {
  success: { color: 'success', label: '成功' },
  completed: { color: 'success', label: '完成' },
  processing: { color: 'processing', label: '处理中' },
  pending: { color: 'default', label: '待处理' },
  failed: { color: 'error', label: '失败' },
  skipped: { color: 'warning', label: '跳过' },
};

export default function ContextDetail() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams();
  const contextId = id!;
  const { hasPermission } = useAuthStore();
  const canUpdate = hasPermission('context:update');
  const canSnapshot = hasPermission('context:snapshot');

  // 数据查询
  const { data: contextData, isLoading, refetch: refetchContextDetail } = useContextDetail(contextId);
  const { data: items, isLoading: itemsLoading } = useContextItems(contextId);
  const { data: snapshots, isLoading: snapshotsLoading } = useContextSnapshots(contextId);
  const { data: knowledgeDocuments = [], isLoading: knowledgeLoading } = useKnowledgeDocuments(contextId);
  const { data: ragOperations = [], isLoading: ragOperationsLoading } = useRagOperations({ contextId, limit: 20 });

  // 变更操作
  const addItemMutation = useAddContextItem();
  const updateItemMutation = useUpdateContextItem();
  const deleteItemMutation = useDeleteContextItem();
  const createSnapshotMutation = useCreateContextSnapshot();
  const restoreSnapshotMutation = useRestoreContextSnapshot();
  const uploadKnowledgeMutation = useUploadKnowledgeDocument();

  // 条目 Modal 状态
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContextItem | null>(null);
  const [itemForm] = Form.useForm();

  // 快照 Modal 状态
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [snapshotForm] = Form.useForm();

  // 查看详情 Modal 状态
  const [viewItem, setViewItem] = useState<ContextItem | null>(null);
  const [viewSnapshot, setViewSnapshot] = useState<ContextSnapshot | null>(null);

  // 层级映射
  const levelLabelMap: Record<string, string> = {
    global: t('context.levelGlobal'),
    project: t('context.levelProject'),
    task: t('context.levelTask'),
    agent: t('context.levelAgent'),
  };
  const levelColorMap: Record<string, string> = {
    global: 'purple',
    project: 'blue',
    task: 'cyan',
    agent: 'orange',
  };

  // ====== 条目操作 ======
  const handleOpenAddItem = () => {
    setEditingItem(null);
    itemForm.resetFields();
    setItemModalOpen(true);
  };

  const handleOpenEditItem = (record: ContextItem) => {
    setEditingItem(record);
    setItemModalOpen(true);
  };

  const handleItemSubmit = async () => {
    try {
      const values = await itemForm.validateFields();
      if (editingItem) {
        // 编辑
        await updateItemMutation.mutateAsync({
          contextId,
          itemId: editingItem.id,
          data: values,
        });
        message.success(t('common.updateSuccess'));
      } else {
        // 新增
        await addItemMutation.mutateAsync({ contextId, data: values });
        message.success(t('common.createSuccess'));
      }
      setItemModalOpen(false);
      itemForm.resetFields();
      setEditingItem(null);
    } catch {
      // 表单校验失败，不处理
    }
  };

  const handleDeleteItem = (itemId: string) => {
    deleteItemMutation.mutate(
      { contextId, itemId },
      { onSuccess: () => message.success(t('common.deleteSuccess')) },
    );
  };

  // ====== 快照操作 ======
  const handleOpenCreateSnapshot = () => {
    snapshotForm.resetFields();
    setSnapshotModalOpen(true);
  };

  const handleSnapshotSubmit = async () => {
    try {
      const values = await snapshotForm.validateFields();
      await createSnapshotMutation.mutateAsync({
        contextId,
        snapshotName: values.snapshotName,
      });
      message.success(t('context.snapshotCreated'));
      setSnapshotModalOpen(false);
    } catch {
      // 校验失败
    }
  };

  const handleRestoreSnapshot = (snapId: string) => {
    restoreSnapshotMutation.mutate(
      { contextId, snapId },
      { onSuccess: () => message.success(t('context.snapshotRestored')) },
    );
  };

  // ====== 条目表格列 ======
  const itemColumns: ColumnsType<ContextItem> = [
    {
      title: t('context.itemTitle'),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: t('context.itemType'),
      dataIndex: 'itemType',
      key: 'itemType',
      width: 120,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: t('context.tokenCount'),
      dataIndex: 'tokenCount',
      key: 'tokenCount',
      width: 100,
    },
    {
      title: '向量状态',
      key: 'vectorStatus',
      width: 180,
      render: (_: any, record: ContextItem) => {
        const status = VECTOR_STATUS_MAP[record.vectorStatus || 'none'] || VECTOR_STATUS_MAP.none;
        return (
          <Space size={6}>
            <Tag color={status.color}>{status.label}</Tag>
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>
              {record.chunkCount ?? 0} chunks
            </span>
          </Space>
        );
      },
    },
    {
      title: t('common.updateTime'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 200,
      render: (_: any, record: ContextItem) => (
        <Space size="middle">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setViewItem(record)}>
            {t('common.view')}
          </Button>
          {canUpdate && (
            <Button type="link" size="small" onClick={() => handleOpenEditItem(record)} style={{ paddingInline: 0 }}>
              {t('common.edit')}
            </Button>
          )}
          {canUpdate && (
            <Popconfirm
              title={t('context.deleteItemConfirm')}
              onConfirm={() => handleDeleteItem(record.id)}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
            >
              <Button type="link" size="small" danger style={{ paddingInline: 0 }}>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // ====== 快照表格列 ======
  const snapshotColumns: ColumnsType<ContextSnapshot> = [
    {
      title: t('context.snapshotName'),
      dataIndex: 'snapshotName',
      key: 'snapshotName',
      ellipsis: true,
    },
    {
      title: t('context.itemCountLabel'),
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 100,
    },
    {
      title: t('context.totalTokens'),
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      width: 120,
    },
    {
      title: t('common.createTime'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 180,
      render: (_: any, record: ContextSnapshot) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setViewSnapshot(record)}>
            {t('common.view')}
          </Button>
          {canSnapshot && (
            <Popconfirm
              title={t('context.restoreSnapshotConfirm')}
              onConfirm={() => handleRestoreSnapshot(record.id)}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
            >
              <Button type="link" icon={<UndoOutlined />}>
                {t('context.restoreSnapshot')}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const knowledgeColumns: ColumnsType<KnowledgeDocument> = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
      render: (value: string, record) => value || record.title || record.id,
    },
    {
      title: 'MIME',
      dataIndex: 'mimeType',
      key: 'mimeType',
      width: 140,
      ellipsis: true,
      render: (value?: string) => value || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: string) => {
        const status = VECTOR_STATUS_MAP[value || 'none'] || VECTOR_STATUS_MAP.none;
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      title: '分块',
      dataIndex: 'chunkCount',
      key: 'chunkCount',
      width: 90,
      render: (value?: number) => value ?? 0,
    },
    {
      title: 'Tokens',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      width: 100,
      render: (value?: number) => value ?? 0,
    },
    {
      title: '来源',
      dataIndex: 'uploadChannel',
      key: 'uploadChannel',
      width: 80,
      render: (value?: string) => value || 'web',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (value?: string) => value ? formatDateTime(value) : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: KnowledgeDocument) => (
        record.status === 'completed' ? (
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={async () => {
              try {
                const res = await fetchKnowledgeDocumentDownloadUrl(record.id);
                if (res.data) window.open(res.data, '_blank');
              } catch {
                message.error('获取下载链接失败');
              }
            }}
          >
            下载
          </Button>
        ) : null
      ),
    },
  ];

  const handleUploadKnowledge = async (options: any) => {
    const file = options.file as File;
    try {
      await uploadKnowledgeMutation.mutateAsync({ contextId, file });
      message.success(`文档「${file.name}」已上传，后台开始向量化`);
      options.onSuccess?.({}, file);
    } catch (error) {
      message.error(`文档「${file.name}」上传失败`);
      options.onError?.(error);
    }
  };

  const ragOperationColumns: ColumnsType<RagOperationLog> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 150,
      render: (value?: string) => value ? formatDateTime(value) : '-',
    },
    {
      title: '类型',
      dataIndex: 'operationType',
      width: 90,
      render: (value?: string) => <Tag>{value || '-'}</Tag>,
    },
    {
      title: '来源',
      dataIndex: 'sourceType',
      width: 120,
      ellipsis: true,
      render: (value?: string) => value || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 96,
      render: (value: string) => {
        const status = RAG_LOG_STATUS_MAP[value] ?? { color: 'default', label: value };
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      title: '分块/命中',
      key: 'chunkHit',
      width: 110,
      render: (_, record) => `${record.chunkCount ?? 0}/${record.retrievedCount ?? 0}`,
    },
    {
      title: '耗时',
      dataIndex: 'durationMs',
      width: 88,
      render: (value?: number) => value != null ? `${value}ms` : '-',
    },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      ellipsis: true,
      render: (value?: string) => value || '-',
    },
  ];

  useEffect(() => {
    if (!contextId) {
      return;
    }
    refetchContextDetail();
  }, [
    contextId,
    refetchContextDetail,
    knowledgeDocuments.length,
    knowledgeDocuments.map((document) => `${document.id}:${document.status}:${document.chunkCount ?? 0}`).join('|'),
  ]);

  // ====== Tab 配置 ======
  const tabItems = [
    {
      key: 'items',
      label: t('context.itemsTab'),
      children: (
        <Card variant="borderless" className="shadow-sm">
          <div className="mb-4 flex justify-end">
            {canUpdate && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddItem}>
                {t('context.addItem')}
              </Button>
            )}
          </div>
          <Table
            columns={itemColumns}
            dataSource={items ?? []}
            rowKey="id"
            loading={itemsLoading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'snapshots',
      label: t('context.snapshotsTab'),
      children: (
        <Card variant="borderless" className="shadow-sm">
          <div className="mb-4 flex justify-end">
            {canSnapshot && (
              <Button type="primary" icon={<CameraOutlined />} onClick={handleOpenCreateSnapshot}>
                {t('context.createSnapshot')}
              </Button>
            )}
          </div>
          <Table
            columns={snapshotColumns}
            dataSource={snapshots ?? []}
            rowKey="id"
            loading={snapshotsLoading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'knowledge',
      label: '知识文档 / RAG',
      children: (
        <Card variant="borderless" className="shadow-sm">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-4">
            <div>
              <Alert
                type="info"
                showIcon
                className="mb-4"
                message="知识文档说明"
                description="在这里上传 PDF、Markdown、TXT 等资料后，系统会按当前 RAG 配置进行文本清洗、分块和向量写入。"
              />
              <div className="mb-4 flex justify-between items-center">
                <div style={{ color: 'var(--color-text-secondary)' }}>
                  已上传 {knowledgeDocuments.length} 份文档，当前上下文向量状态：
                  <Tag className="ml-2" color={(VECTOR_STATUS_MAP[contextData?.vectorStatus || 'none'] || VECTOR_STATUS_MAP.none).color}>
                    {(VECTOR_STATUS_MAP[contextData?.vectorStatus || 'none'] || VECTOR_STATUS_MAP.none).label}
                  </Tag>
                </div>
                {canUpdate && (
                  <Upload showUploadList={false} customRequest={handleUploadKnowledge} multiple={false}>
                    <Button type="primary" icon={<UploadOutlined />} loading={uploadKnowledgeMutation.isPending}>
                      上传知识文档
                    </Button>
                  </Upload>
                )}
              </div>
              <Table
                columns={knowledgeColumns}
                dataSource={knowledgeDocuments}
                rowKey="id"
                loading={knowledgeLoading}
                pagination={{ pageSize: 10 }}
              />
            </div>

            <Card title="RAG 操作日志" size="small" variant="borderless" className="shadow-sm bg-[var(--color-fill-quaternary)]">
              <Table
                columns={ragOperationColumns}
                dataSource={ragOperations}
                rowKey="id"
                loading={ragOperationsLoading}
                pagination={false}
                size="small"
                scroll={{ y: 480 }}
                locale={{ emptyText: '当前上下文暂无 RAG 日志' }}
              />
            </Card>
          </div>
        </Card>
      ),
    },
  ];

  if (isLoading) {
    return (
      <PageContainer title={t('context.detailTitle')}>
        <div className="flex justify-center items-center py-32">
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`${t('context.detailTitle')} - ${contextData?.name ?? ''}`}
      extra={
        <Space>
          {canUpdate && (
            <Button
              icon={<EditOutlined />}
              type="primary"
              onClick={() => navigate(`/context/${contextId}/edit`)}
            >
              {t('context.editContext')}
            </Button>
          )}
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            {t('common.back')}
          </Button>
        </Space>
      }
    >
      {/* 基本信息卡片 */}
      <Card className="mb-6 shadow-sm" variant="borderless">
        <Descriptions column={3}>
          <Descriptions.Item label={t('context.contextLevel')}>
            <Tag color={levelColorMap[contextData?.contextLevel ?? ''] || 'default'}>
              {levelLabelMap[contextData?.contextLevel ?? ''] || contextData?.contextLevel}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('context.entityCountLabel')}>
            {contextData?.itemCount ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label={t('context.totalTokens')}>
            {contextData?.totalTokens ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label="向量状态">
            <Tag color={(VECTOR_STATUS_MAP[contextData?.vectorStatus || 'none'] || VECTOR_STATUS_MAP.none).color}>
              {(VECTOR_STATUS_MAP[contextData?.vectorStatus || 'none'] || VECTOR_STATUS_MAP.none).label}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('common.status')}>
            <Tag color={contextData?.status === 'active' ? 'green' : 'default'}>
              {contextData?.status ?? '-'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('common.updateTime')}>
            {contextData?.updatedAt ? formatDateTime(contextData.updatedAt) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.createTime')}>
            {contextData?.createdAt ? formatDateTime(contextData.createdAt) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="向量分块数">
            {contextData?.vectorChunkCount ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label="知识文档数">
            {contextData?.knowledgeDocumentCount ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label="最近向量更新时间" span={3}>
            {contextData?.vectorUpdatedAt ? formatDateTime(contextData.vectorUpdatedAt) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.description')} span={3}>
            {contextData?.description}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Tab 页签 */}
      <Tabs items={tabItems} size="large" />

      {/* 条目编辑/新增 Modal */}
      <Modal
        title={editingItem ? t('context.editItem') : t('context.addItem')}
        open={itemModalOpen}
        onOk={handleItemSubmit}
        onCancel={() => { setItemModalOpen(false); setEditingItem(null); itemForm.resetFields(); }}
        confirmLoading={addItemMutation.isPending || updateItemMutation.isPending}
        afterOpenChange={(open) => {
          // Modal 打开后回显编辑数据
          if (open && editingItem) {
            itemForm.setFieldsValue({
              title: editingItem.title,
              itemType: editingItem.itemType,
              content: editingItem.content,
              sourceUrl: editingItem.sourceUrl,
            });
          }
        }}
      >
        <Form form={itemForm} layout="vertical">
          <Form.Item
            name="title"
            label={t('context.itemTitle')}
            rules={[{ required: true, message: t('context.itemTitleRequired') }]}
          >
            <Input placeholder={t('context.itemTitlePlaceholder')} />
          </Form.Item>
          <Form.Item
            name="itemType"
            label={t('context.itemType')}
            rules={[{ required: true, message: t('context.itemTypeRequired') }]}
          >
            <Select placeholder={t('context.itemTypePlaceholder')}>
              <Select.Option value="document">{t('context.itemTypeDocument')}</Select.Option>
              <Select.Option value="code">{t('context.itemTypeCode')}</Select.Option>
              <Select.Option value="knowledge">{t('context.itemTypeKnowledge')}</Select.Option>
              <Select.Option value="config">{t('context.itemTypeConfig')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="content"
            label={t('context.itemContent')}
            rules={[{ required: true, message: t('context.itemContentRequired') }]}
          >
            <Input.TextArea rows={6} placeholder={t('context.itemContentPlaceholder')} />
          </Form.Item>
          <Form.Item name="sourceUrl" label={t('context.itemSourceUrl')}>
            <Input placeholder={t('context.itemSourceUrlPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建快照 Modal */}
      <Modal
        title={t('context.createSnapshot')}
        open={snapshotModalOpen}
        onOk={handleSnapshotSubmit}
        onCancel={() => setSnapshotModalOpen(false)}
        confirmLoading={createSnapshotMutation.isPending}
        destroyOnHidden
      >
        <Form form={snapshotForm} layout="vertical" preserve={false}>
          <Form.Item
            name="snapshotName"
            label={t('context.snapshotName')}
            rules={[{ required: true, message: t('context.snapshotNameRequired') }]}
          >
            <Input placeholder={t('context.snapshotNamePlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看条目详情 Modal */}
      <Modal
        title={viewItem?.title || t('context.itemTitle')}
        open={!!viewItem}
        onCancel={() => setViewItem(null)}
        footer={<Button onClick={() => setViewItem(null)}>{t('common.close')}</Button>}
        width={720}
      >
        {viewItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={t('context.itemTitle')}>{viewItem.title}</Descriptions.Item>
            <Descriptions.Item label={t('context.itemType')}>
              <Tag>{viewItem.itemType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('context.tokenCount')}>{viewItem.tokenCount ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="向量状态">
              <Tag color={(VECTOR_STATUS_MAP[viewItem.vectorStatus || 'none'] || VECTOR_STATUS_MAP.none).color}>
                {(VECTOR_STATUS_MAP[viewItem.vectorStatus || 'none'] || VECTOR_STATUS_MAP.none).label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="分块数">{viewItem.chunkCount ?? 0}</Descriptions.Item>
            {viewItem.sourceUrl && (
              <Descriptions.Item label={t('context.itemSourceUrl')}>
                <Typography.Text copyable>{viewItem.sourceUrl}</Typography.Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t('context.itemContent')}>
              <Typography.Paragraph
                style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13, maxHeight: 400, overflow: 'auto' }}
              >
                {viewItem.content}
              </Typography.Paragraph>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 查看快照详情 Modal */}
      <Modal
        title={viewSnapshot?.snapshotName || t('context.snapshotName')}
        open={!!viewSnapshot}
        onCancel={() => setViewSnapshot(null)}
        footer={<Button onClick={() => setViewSnapshot(null)}>{t('common.close')}</Button>}
        width={480}
      >
        {viewSnapshot && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={t('context.snapshotName')}>{viewSnapshot.snapshotName}</Descriptions.Item>
            <Descriptions.Item label={t('context.itemCountLabel')}>{viewSnapshot.itemCount}</Descriptions.Item>
            <Descriptions.Item label={t('context.totalTokens')}>{viewSnapshot.totalTokens}</Descriptions.Item>
            <Descriptions.Item label={t('common.createTime')}>{viewSnapshot.createdAt}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </PageContainer>
  );
}

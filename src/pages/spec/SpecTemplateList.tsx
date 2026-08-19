/**
 * Spec 模板管理页面
 * 模板列表（按分类/文档类型筛选）、创建模板、删除模板、预览模板内容
 */
import { useState } from 'react';
import { Table, Button, Space, Card, Tag, Modal, Form, Input, Select, Popconfirm, message, Typography, Empty } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import MarkdownPreview from '@/components/MarkdownPreview/MarkdownPreview';
import { useSpecTemplateList, useCreateSpecTemplate, useDeleteSpecTemplate } from '@/api/spec';
import { useAuthStore } from '@/store/useAuthStore';
import type { SpecCategory, DocType } from '@/types/spec';
import type { ColumnsType } from 'antd/es/table';
import { formatDateTime } from '@/utils/date';

const { Paragraph } = Typography;

/** 分类选项 */
const CATEGORY_OPTIONS: { value: SpecCategory; labelKey: string; defaultLabel: string }[] = [
  { value: 'feature-development', labelKey: 'spec.categoryFeature', defaultLabel: 'Feature Development' },
  { value: 'bug-fix', labelKey: 'spec.categoryBugFix', defaultLabel: 'Bug Fix' },
  { value: 'refactoring', labelKey: 'spec.categoryRefactoring', defaultLabel: 'Refactoring' },
  { value: 'data-analysis', labelKey: 'spec.categoryDataAnalysis', defaultLabel: 'Data Analysis' },
  { value: 'config-change', labelKey: 'spec.categoryConfigChange', defaultLabel: 'Config Change' },
];

/** 文档类型选项 */
const DOC_TYPE_OPTIONS: { value: DocType; labelKey: string; defaultLabel: string }[] = [
  { value: 'requirements', labelKey: 'spec.requirements', defaultLabel: 'Requirements' },
  { value: 'design', labelKey: 'spec.design', defaultLabel: 'Design' },
  { value: 'tasks', labelKey: 'spec.tasks', defaultLabel: 'Tasks' },
];

export default function SpecTemplateList() {
  const { t } = useTranslation();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('spec:template:create');
  const canDelete = hasPermission('spec:template:delete');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [docTypeFilter, setDocTypeFilter] = useState<string | undefined>(undefined);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ name: string; content: string }>({ name: '', content: '' });
  const [form] = Form.useForm();

  // 查询参数
  const queryParams: any = {};
  if (categoryFilter) queryParams.category = categoryFilter;
  if (docTypeFilter) queryParams.docType = docTypeFilter;

  // 获取模板列表
  const { data: templates, isLoading } = useSpecTemplateList(
    Object.keys(queryParams).length > 0 ? queryParams : undefined
  );

  // Mutations
  const createTemplate = useCreateSpecTemplate();
  const deleteTemplate = useDeleteSpecTemplate();

  const categoryLabels: Record<string, string> = {
    'feature-development': t('spec.categoryFeature'),
    'bug-fix': t('spec.categoryBugFix'),
    'refactoring': t('spec.categoryRefactoring'),
    'data-analysis': t('spec.categoryDataAnalysis'),
    'config-change': t('spec.categoryConfigChange'),
  };

  const docTypeLabels: Record<string, string> = {
    requirements: t('spec.requirements'),
    design: t('spec.design'),
    tasks: t('spec.tasks'),
  };

  /** 创建模板 */
  const handleCreate = async (values: any) => {
    try {
      await createTemplate.mutateAsync(values);
      message.success(t('spec.template.createSuccess'));
      setCreateModalOpen(false);
      form.resetFields();
    } catch (error) {
      message.error(t('spec.template.createFail'));
    }
  };

  /** 删除模板 */
  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      message.success(t('common.deleteSuccess'));
    } catch (error) {
      // 错误已在拦截器中处理
    }
  };

  /** 预览模板 */
  const handlePreview = (record: any) => {
    setPreviewContent({ name: record.name, content: record.content || '' });
    setPreviewModalOpen(true);
  };

  // 表格列
  const columns: ColumnsType<any> = [
    {
      title: t('spec.template.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string) => (
        <Space>
          <FileTextOutlined className="text-blue-500" />
          <span className="font-medium">{text}</span>
        </Space>
      ),
    },
    {
      title: t('spec.category'),
      dataIndex: 'category',
      key: 'category',
      width: 160,
      render: (category: string) =>
        category ? <Tag>{categoryLabels[category] || category}</Tag> : '-',
    },
    {
      title: t('spec.template.docType'),
      dataIndex: 'docType',
      key: 'docType',
      width: 140,
      render: (docType: string) =>
        docType ? <Tag color="blue">{docTypeLabels[docType] || docType}</Tag> : '-',
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => (
        <Paragraph className="mb-0 text-gray-500" ellipsis={{ rows: 1 }}>
          {desc || '-'}
        </Paragraph>
      ),
    },
    {
      title: t('spec.template.builtIn'),
      dataIndex: 'builtIn',
      key: 'builtIn',
      width: 100,
      render: (builtIn: boolean) =>
        builtIn ? (
          <Tag color="green">{t('spec.template.yes')}</Tag>
        ) : (
          <Tag>{t('spec.template.no')}</Tag>
        ),
    },
    {
      title: t('common.updateTime'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (time: string) => (formatDateTime(time)),
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          >
            {t('spec.template.preview')}
          </Button>
          {!record.builtIn && canDelete && (
            <Popconfirm
              title={t('spec.template.deleteConfirm')}
              onConfirm={() => handleDelete(record.id)}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          )}
          {record.builtIn && (
            <Button type="link" size="small" disabled icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title={t('spec.template.management')}
      extra={
        canCreate ? (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            {t('spec.template.create')}
          </Button>
        ) : null
      }
    >
      {/* 筛选栏 + 模板列表 */}
      <Card variant="borderless" className="rounded-xl shadow-sm">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
          <Select
            placeholder={t('spec.filterCategory')}
            allowClear
            style={{ width: 180 }}
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={CATEGORY_OPTIONS.map((opt) => ({
              label: t(opt.labelKey),
              value: opt.value,
            }))}
          />
          <Select
            placeholder={t('spec.template.filterDocType')}
            allowClear
            style={{ width: 180 }}
            value={docTypeFilter}
            onChange={setDocTypeFilter}
            options={DOC_TYPE_OPTIONS.map((opt) => ({
              label: t(opt.labelKey),
              value: opt.value,
            }))}
          />
        </div>
        <Table
          columns={columns}
          dataSource={templates?.records || templates || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          locale={{ emptyText: <Empty description={t('common.noData')} /> }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => t('common.total', { total }),
          }}
        />
      </Card>

      {/* 创建模板弹窗 */}
      <Modal
        title={t('spec.template.create')}
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={createTemplate.isPending}
        width={720}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label={t('spec.template.name')}
            rules={[{ required: true, message: t('spec.template.namePlaceholder') }]}
          >
            <Input placeholder={t('spec.template.namePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="category"
            label={t('spec.category')}
            rules={[{ required: true, message: t('spec.template.categoryRequired') }]}
          >
            <Select placeholder={t('spec.template.categoryRequired')}>
              {CATEGORY_OPTIONS.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="docType"
            label={t('spec.template.docType')}
            rules={[{ required: true, message: t('spec.template.docTypeRequired') }]}
          >
            <Select placeholder={t('spec.template.docTypeRequired')}>
              {DOC_TYPE_OPTIONS.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label={t('common.description')}>
            <Input.TextArea
              rows={2}
              placeholder={t('spec.template.descPlaceholder')}
            />
          </Form.Item>

          <Form.Item
            name="content"
            label={t('spec.template.content')}
            rules={[{ required: true, message: t('spec.template.contentRequired') }]}
          >
            <Input.TextArea
              rows={12}
              placeholder={t('spec.template.contentPlaceholder')}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 预览模板弹窗 */}
      <Modal
        title={`${t('spec.template.preview')} - ${previewContent.name}`}
        open={previewModalOpen}
        onCancel={() => setPreviewModalOpen(false)}
        footer={null}
        width={800}
      >
        {previewContent.content ? (
          <div className="border rounded-lg p-6" style={{ maxHeight: 500, overflow: 'auto' }}>
            <MarkdownPreview content={previewContent.content} />
          </div>
        ) : (
          <Empty description={t('spec.template.noContent')} />
        )}
      </Modal>
    </PageContainer>
  );
}

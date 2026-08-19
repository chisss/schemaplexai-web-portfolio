import { useState } from 'react';
import { Descriptions, Button, Space, Tag, Badge, Modal, Form, Input, Select, message, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { usePipelineDetail, useUpdatePipeline, useDeletePipeline, useTriggerPipeline } from '@/api/cicd';

const { TextArea } = Input;

const typeColorMap: Record<string, string> = {
  jenkins: 'red', gitlab_ci: 'orange', github_actions: 'blue',
};
const statusMap: Record<string, { color: string; textKey: string }> = {
  inactive: { color: 'default', textKey: 'common.inactive' },
  active: { color: 'success', textKey: 'common.active' },
};
const runStatusMap: Record<string, { color: string; textKey: string }> = {
  pending: { color: 'default', textKey: 'cicd.runStatusPending' },
  running: { color: 'processing', textKey: 'cicd.runStatusRunning' },
  success: { color: 'success', textKey: 'cicd.runStatusSuccess' },
  failed: { color: 'error', textKey: 'cicd.runStatusFailed' },
  cancelled: { color: 'warning', textKey: 'cicd.runStatusCancelled' },
};

export default function CicdDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: pipeline, isLoading } = usePipelineDetail(id!);
  const updateMutation = useUpdatePipeline();
  const deleteMutation = useDeletePipeline();
  const triggerMutation = useTriggerPipeline();
  const [editOpen, setEditOpen] = useState(false);
  const [form] = Form.useForm();

  if (isLoading) return <Spin size="large" className="flex justify-center mt-20" />;
  if (!pipeline) return null;

  const st = statusMap[pipeline.status] || { color: 'default', textKey: pipeline.status };
  const runSt = pipeline.lastRunStatus ? (runStatusMap[pipeline.lastRunStatus] || { color: 'default', textKey: pipeline.lastRunStatus }) : null;

  const handleEdit = () => {
    form.setFieldsValue({
      name: pipeline.name,
      status: pipeline.status,
      description: pipeline.description,
      config: pipeline.config ? JSON.stringify(pipeline.config, null, 2) : '',
      triggerRules: pipeline.triggerRules ? JSON.stringify(pipeline.triggerRules, null, 2) : '',
    });
    setEditOpen(true);
  };

  const handleUpdate = async (values: any) => {
    try {
      const data: any = { ...values };
      if (values.config) data.config = JSON.parse(values.config);
      if (values.triggerRules) data.triggerRules = JSON.parse(values.triggerRules);
      await updateMutation.mutateAsync({ id: id!, data });
      message.success(t('common.updateSuccess'));
      setEditOpen(false);
    } catch (e: any) {
      if (e instanceof SyntaxError) message.error(t('common.jsonParseError'));
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: t('common.confirmDelete'),
      content: `${t('common.confirmDeleteContent')} ${pipeline.name}?`,
      onOk: () => deleteMutation.mutateAsync(id!).then(() => {
        message.success(t('common.deleteSuccess'));
        navigate('/integration/cicd');
      }),
    });
  };

  const handleTrigger = () => {
    triggerMutation.mutateAsync(id!).then(() => {
      message.success(t('cicd.triggerSuccess'));
    }).catch(() => {
      message.error(t('cicd.triggerFailed'));
    });
  };

  return (
    <PageContainer
      title={pipeline.name}
      extra={
        <Space>
          <Button icon={<PlayCircleOutlined />} onClick={handleTrigger} loading={triggerMutation.isPending}>
            {t('cicd.trigger')}
          </Button>
          <Button icon={<EditOutlined />} onClick={handleEdit}>{t('common.edit')}</Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>{t('common.delete')}</Button>
        </Space>
      }
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label={t('cicd.name')}>{pipeline.name}</Descriptions.Item>
        <Descriptions.Item label={t('cicd.pipelineType')}>
          <Tag color={typeColorMap[pipeline.pipelineType]}>{pipeline.pipelineType}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <Badge status={st.color as any} text={t(st.textKey)} />
        </Descriptions.Item>
        <Descriptions.Item label={t('common.createdAt')}>{pipeline.createdAt}</Descriptions.Item>
        <Descriptions.Item label={t('cicd.lastRunStatus')}>
          {runSt ? <Badge status={runSt.color as any} text={t(runSt.textKey)} /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('cicd.lastRunAt')}>{pipeline.lastRunAt || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('common.createdBy')}>{pipeline.createdByName || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('common.description')}>{pipeline.description || '-'}</Descriptions.Item>
        {pipeline.config && (
          <Descriptions.Item label={t('cicd.config')} span={2}>
            <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(pipeline.config, null, 2)}</pre>
          </Descriptions.Item>
        )}
        {pipeline.triggerRules && (
          <Descriptions.Item label={t('cicd.triggerRules')} span={2}>
            <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(pipeline.triggerRules, null, 2)}</pre>
          </Descriptions.Item>
        )}
      </Descriptions>

      <Modal title={t('common.edit')} open={editOpen} onCancel={() => setEditOpen(false)}
        onOk={() => form.submit()} confirmLoading={updateMutation.isPending} width={640}>
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item name="name" label={t('cicd.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label={t('common.status')}>
            <Select options={[
              { label: t('common.active'), value: 'active' },
              { label: t('common.inactive'), value: 'inactive' },
            ]} />
          </Form.Item>
          <Form.Item name="config" label={t('cicd.config')}>
            <TextArea rows={6} />
          </Form.Item>
          <Form.Item name="triggerRules" label={t('cicd.triggerRules')}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="description" label={t('common.description')}>
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

import { useState } from 'react';
import { Badge, Button, Descriptions, Form, Input, Modal, Select, Space, Spin, Tag, message } from 'antd';
import { EditOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useChannelDetail, useUpdateChannel, useDeleteChannel, useTestChannel } from '@/api/channel';
import { buildChannelConfig, ChannelConfigFields, extractChannelConfigValues } from './channelConfigFields';
import { CHANNEL_TYPE_KEYS } from './channelMeta';

const { TextArea } = Input;

const typeColorMap: Record<string, string> = {
  dingtalk: 'blue', wechat_work: 'green', feishu: 'purple',
  slack: 'orange', email: 'cyan', sms: 'magenta',
};
const statusMap: Record<string, { color: string; textKey: string }> = {
  active: { color: 'success', textKey: 'common.active' },
  inactive: { color: 'default', textKey: 'common.inactive' },
  error: { color: 'error', textKey: 'common.error' },
};

export default function ChannelDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: channel, isLoading } = useChannelDetail(id!);
  const updateMutation = useUpdateChannel();
  const deleteMutation = useDeleteChannel();
  const testMutation = useTestChannel();
  const [editOpen, setEditOpen] = useState(false);
  const [form] = Form.useForm();

  if (isLoading) return <Spin size="large" className="flex justify-center mt-20" />;
  if (!channel) return null;

  const st = statusMap[channel.status] || { color: 'default', textKey: channel.status };

  const handleEdit = () => {
    form.setFieldsValue({
      name: channel.name,
      status: channel.status,
      description: channel.description,
      notificationRules: channel.notificationRules ? JSON.stringify(channel.notificationRules, null, 2) : '',
      ...extractChannelConfigValues(channel.channelType, channel.config),
    });
    setEditOpen(true);
  };

  const handleUpdate = async (values: any) => {
    try {
      const data: any = {
        name: values.name,
        status: values.status,
        description: values.description,
        config: buildChannelConfig(channel.channelType, values),
      };
      if (values.notificationRules) data.notificationRules = JSON.parse(values.notificationRules);
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
      content: `${t('common.confirmDeleteContent')} ${channel.name}?`,
      onOk: () => deleteMutation.mutateAsync(id!).then(() => {
        message.success(t('common.deleteSuccess'));
        navigate('/notification/channel');
      }),
    });
  };

  const handleTest = () => {
    testMutation.mutateAsync(id!).then(() => {
      message.success(t('channel.testSuccess'));
    }).catch(() => {
      message.error(t('channel.testFailed'));
    });
  };

  return (
    <PageContainer
      title={channel.name}
      extra={
        <Space>
          <Button icon={<SendOutlined />} onClick={handleTest} loading={testMutation.isPending}>
            {t('channel.test')}
          </Button>
          <Button icon={<EditOutlined />} onClick={handleEdit}>{t('common.edit')}</Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>{t('common.delete')}</Button>
        </Space>
      }
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label={t('channel.name')}>{channel.name}</Descriptions.Item>
        <Descriptions.Item label={t('channel.type')}>
          <Tag color={typeColorMap[channel.channelType]}>{t(CHANNEL_TYPE_KEYS[channel.channelType] || channel.channelType)}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><Badge status={st.color as any} text={t(st.textKey)} /></Descriptions.Item>
        <Descriptions.Item label={t('common.createdAt')}>{channel.createdAt}</Descriptions.Item>
        <Descriptions.Item label={t('channel.lastTestAt')}>{channel.lastTestAt || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('common.createdBy')}>{channel.createdByName || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('common.description')} span={2}>{channel.description || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('channel.config')} span={2}>
          <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(channel.config, null, 2)}</pre>
        </Descriptions.Item>
        {channel.notificationRules && (
          <Descriptions.Item label={t('channel.notificationRules')} span={2}>
            <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(channel.notificationRules, null, 2)}</pre>
          </Descriptions.Item>
        )}
        {channel.errorMessage && (
          <Descriptions.Item label={t('common.errorMessage')} span={2}>
            <span style={{ color: 'var(--color-error)' }}>{channel.errorMessage}</span>
          </Descriptions.Item>
        )}
      </Descriptions>

      <Modal title={t('common.edit')} open={editOpen} onCancel={() => setEditOpen(false)}
        onOk={() => form.submit()} confirmLoading={updateMutation.isPending} width={640}>
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item name="name" label={t('channel.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label={t('common.status')}>
            <Select options={[
              { label: t('common.active'), value: 'active' },
              { label: t('common.inactive'), value: 'inactive' },
            ]} />
          </Form.Item>
          <ChannelConfigFields channelType={channel.channelType} />
          <Form.Item name="notificationRules" label={t('channel.notificationRules')}>
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

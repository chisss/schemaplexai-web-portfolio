import { useEffect } from 'react';
import { Button, Form, Input, Select, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useCreateChannel } from '@/api/channel';
import type { NotificationChannelCreateDTO } from '@/types/integration';
import { buildChannelConfig, ChannelConfigFields } from './channelConfigFields';
import { getChannelTypeOptions } from './channelMeta';

const { TextArea } = Input;

export default function ChannelCreate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const createMutation = useCreateChannel();
  const channelType = Form.useWatch('channelType', form);

  useEffect(() => {
    form.setFieldsValue({ configReceiveIdType: 'chat_id' });
  }, [form]);

  const handleSubmit = async (values: any) => {
    try {
      const dto: NotificationChannelCreateDTO = {
        name: values.name,
        channelType: values.channelType,
        config: buildChannelConfig(values.channelType, values),
        description: values.description,
        notificationRules: values.notificationRules ? JSON.parse(values.notificationRules) : undefined,
      };
      await createMutation.mutateAsync(dto);
      message.success(t('common.createSuccess'));
      navigate('/notification/channel');
    } catch (e: any) {
      if (e instanceof SyntaxError) {
        message.error(t('common.jsonParseError'));
      }
    }
  };

  return (
    <PageContainer title={t('channel.create')}>
      <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ maxWidth: 640 }}>
        <Form.Item name="name" label={t('channel.name')} rules={[{ required: true }]}>
          <Input placeholder={t('channel.namePlaceholder')} />
        </Form.Item>
        <Form.Item name="channelType" label={t('channel.type')} rules={[{ required: true }]}>
          <Select
            placeholder={t('channel.typePlaceholder')}
            options={getChannelTypeOptions(t)}
          />
        </Form.Item>
        <ChannelConfigFields channelType={channelType} />
        <Form.Item name="notificationRules" label={t('channel.notificationRules')}
          tooltip={t('channel.notificationRulesTooltip')}>
          <TextArea rows={4} placeholder='{"events": ["build_success", "build_failed"]}' />
        </Form.Item>
        <Form.Item name="description" label={t('common.description')}>
          <TextArea rows={3} placeholder={t('common.descriptionPlaceholder')} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
            {t('common.submit')}
          </Button>
          <Button className="ml-2" onClick={() => navigate('/notification/channel')}>
            {t('common.cancel')}
          </Button>
        </Form.Item>
      </Form>
    </PageContainer>
  );
}

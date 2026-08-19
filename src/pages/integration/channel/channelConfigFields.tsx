import { Alert, Form, Input, Select } from 'antd';
import { useTranslation } from 'react-i18next';

const FEISHU_RECEIVE_TYPE_OPTIONS = [
  { value: 'chat_id', labelKey: 'channel.feishuReceiveTypeChat' },
  { value: 'user_id', labelKey: 'channel.feishuReceiveTypeUser' },
  { value: 'open_id', labelKey: 'channel.feishuReceiveTypeOpen' },
];

export function buildChannelConfig(channelType: string, values: Record<string, any>) {
  switch (channelType) {
    case 'feishu':
      return {
        app_id: values.configAppId,
        app_secret: values.configAppSecret,
        receive_id_type: values.configReceiveIdType || 'chat_id',
        receive_id: values.configReceiveId,
        ...(values.configDocumentFolderToken ? { document_folder_token: values.configDocumentFolderToken } : {}),
      };
    case 'dingtalk':
    case 'wechat_work':
    case 'slack':
      return { webhook_url: values.configWebhookUrl };
    case 'email':
      return {
        from: values.configEmailFrom,
        to: values.configEmailTo,
      };
    case 'sms':
      return {
        provider: values.configSmsProvider,
        phone: values.configSmsPhone,
      };
    default:
      return {};
  }
}

export function extractChannelConfigValues(channelType: string, config?: Record<string, any>) {
  const next = config ?? {};
  switch (channelType) {
    case 'feishu':
      return {
        configAppId: next.app_id ?? next.appId ?? '',
        configAppSecret: next.app_secret ?? next.appSecret ?? '',
        configReceiveIdType: next.receive_id_type ?? next.receiveIdType ?? 'chat_id',
        configReceiveId: next.receive_id ?? next.receiveId ?? next.chat_id ?? '',
        configDocumentFolderToken: next.document_folder_token ?? next.documentFolderToken ?? next.folder_token ?? next.folderToken ?? '',
      };
    case 'dingtalk':
    case 'wechat_work':
    case 'slack':
      return {
        configWebhookUrl: next.webhook_url ?? '',
      };
    case 'email':
      return {
        configEmailFrom: next.from ?? '',
        configEmailTo: next.to ?? '',
      };
    case 'sms':
      return {
        configSmsProvider: next.provider ?? '',
        configSmsPhone: next.phone ?? '',
      };
    default:
      return {};
  }
}

export function ChannelConfigFields({ channelType }: { channelType?: string }) {
  const { t } = useTranslation();

  if (!channelType) {
    return null;
  }

  if (channelType === 'feishu') {
    return (
      <>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('channel.feishuConfigHint')}
        />
        <Form.Item name="configAppId" label={t('channel.feishuAppId')} rules={[{ required: true }]}>
          <Input placeholder="cli_xxxxxxxxxxxxxxxx" />
        </Form.Item>
        <Form.Item name="configAppSecret" label={t('channel.feishuAppSecret')} rules={[{ required: true }]}>
          <Input.Password placeholder={t('channel.feishuAppSecretPlaceholder')} />
        </Form.Item>
        <Form.Item name="configReceiveIdType" label={t('channel.feishuReceiveIdType')} rules={[{ required: true }]}>
          <Select
            options={FEISHU_RECEIVE_TYPE_OPTIONS.map((item) => ({
              value: item.value,
              label: t(item.labelKey),
            }))}
          />
        </Form.Item>
        <Form.Item name="configReceiveId" label={t('channel.feishuReceiveId')} rules={[{ required: true }]}>
          <Input placeholder="oc_xxxxxxxxxxxxxxxx" />
        </Form.Item>
        <Form.Item
          name="configDocumentFolderToken"
          label="默认飞书文档目录 Token"
          extra="可选。配置后，使用该渠道创建飞书文档时会优先写入此目录；Spec 或工作流节点可继续覆盖。"
        >
          <Input placeholder="可填写云文档文件夹 token，例如 fldcnxxxxxxxx" />
        </Form.Item>
      </>
    );
  }

  if (channelType === 'email') {
    return (
      <>
        <Form.Item name="configEmailFrom" label={t('channel.emailFrom')} rules={[{ required: true }]}>
          <Input placeholder="noreply@example.com" />
        </Form.Item>
        <Form.Item name="configEmailTo" label={t('channel.emailTo')} rules={[{ required: true }]}>
          <Input placeholder="foo@example.com,bar@example.com" />
        </Form.Item>
      </>
    );
  }

  if (channelType === 'sms') {
    return (
      <>
        <Form.Item name="configSmsProvider" label={t('channel.smsProvider')}>
          <Input placeholder="aliyun / tencent" />
        </Form.Item>
        <Form.Item name="configSmsPhone" label={t('channel.smsPhone')} rules={[{ required: true }]}>
          <Input placeholder="+8613800000000" />
        </Form.Item>
      </>
    );
  }

  return (
    <Form.Item name="configWebhookUrl" label={t('channel.webhookUrl')} rules={[{ required: true }]}>
      <Input placeholder="https://example.com/webhook" />
    </Form.Item>
  );
}

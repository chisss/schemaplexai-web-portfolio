import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import MarkdownPreview from '@/components/MarkdownPreview/MarkdownPreview';
import { useNotificationRecords } from '@/api/notificationRecord';
import { useMessageTemplateDefinitions } from '@/api/messageTemplate';
import type { NotificationRecord, NotificationRecordQueryDTO } from '@/types/integration';
import { getChannelTypeOptions } from '@/pages/integration/channel/channelMeta';

const { RangePicker } = DatePicker;
const { Text, Paragraph } = Typography;

const SOURCE_TYPE_KEYS: Record<string, string> = {
  workflow_notification: 'notificationRecord.sourceTypeWorkflow',
  human_review: 'notificationRecord.sourceTypeHumanReview',
  channel_test: 'notificationRecord.sourceTypeChannelTest',
};

export default function NotificationRecordList() {
  const { t } = useTranslation();
  const [query, setQuery] = useState<NotificationRecordQueryDTO>({ page: 1, size: 10 });
  const [selectedRecord, setSelectedRecord] = useState<NotificationRecord | null>(null);
  const { data, isLoading } = useNotificationRecords(query);
  const { data: definitions = [] } = useMessageTemplateDefinitions();

  const templateTypeOptions = useMemo(
    () => definitions.map((item) => ({
      value: item.templateType,
      label: item.templateName,
    })),
    [definitions],
  );

  const columns: ColumnsType<NotificationRecord> = [
    {
      title: t('notificationRecord.channel'),
      dataIndex: 'channelName',
      render: (_value, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.channelName || '-'}</div>
          <Text type="secondary">
            {record.channelType
              ? t(`channel.type${record.channelType
                .split('_')
                .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
                .join('')}`, { defaultValue: record.channelType })
              : '-'}
          </Text>
        </div>
      ),
    },
    {
      title: t('notificationRecord.template'),
      dataIndex: 'templateName',
      render: (_value, record) => (
        <div>
          <div>{record.templateName || '-'}</div>
          <Text type="secondary">
            {templateTypeOptions.find((item) => item.value === record.templateType)?.label || record.templateType || '-'}
          </Text>
        </div>
      ),
    },
    {
      title: t('notificationRecord.sourceType'),
      dataIndex: 'sourceType',
      width: 160,
      render: (value?: string) => value
        ? <Tag>{t(SOURCE_TYPE_KEYS[value] || value)}</Tag>
        : '-',
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      width: 120,
      render: (value: string) => (
        <Tag color={value === 'success' ? 'green' : 'red'}>
          {value === 'success' ? t('notificationRecord.statusSuccess') : t('notificationRecord.statusFailed')}
        </Tag>
      ),
    },
    {
      title: t('notificationRecord.billing'),
      dataIndex: 'billingAmount',
      width: 180,
      render: (_value, record) => {
        if (record.billingAmount === undefined || record.billingAmount === null) {
          return '-';
        }
        return `${record.billingAmount} ${record.billingCurrency || ''} / ${record.billingUnit || '-'} x ${record.billingQuantity || 0}`;
      },
    },
    {
      title: t('notificationRecord.sentAt'),
      dataIndex: 'sentAt',
      width: 180,
    },
    {
      title: t('common.actions'),
      width: 100,
      render: (_value, record) => (
        <Button type="link" onClick={() => setSelectedRecord(record)}>
          {t('notificationRecord.detail')}
        </Button>
      ),
    },
  ];

  return (
    <PageContainer title={t('notificationRecord.management')}>
      <Card variant="borderless" className="shadow-sm rounded-xl">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t('notificationRecord.keywordPlaceholder')}
            style={{ width: 280 }}
            onChange={(e) => setQuery((current) => ({ ...current, keyword: e.target.value, page: 1 }))}
          />
          <Select
            allowClear
            placeholder={t('channel.type')}
            style={{ width: 160 }}
            options={getChannelTypeOptions(t)}
            onChange={(value) => setQuery((current) => ({ ...current, channelType: value, page: 1 }))}
          />
          <Select
            allowClear
            placeholder={t('notificationRecord.templateType')}
            style={{ width: 180 }}
            options={templateTypeOptions}
            onChange={(value) => setQuery((current) => ({ ...current, templateType: value, page: 1 }))}
          />
          <Select
            allowClear
            placeholder={t('notificationRecord.sourceType')}
            style={{ width: 180 }}
            options={Object.entries(SOURCE_TYPE_KEYS).map(([value, labelKey]) => ({
              value,
              label: t(labelKey),
            }))}
            onChange={(value) => setQuery((current) => ({ ...current, sourceType: value, page: 1 }))}
          />
          <Select
            allowClear
            placeholder={t('common.status')}
            style={{ width: 160 }}
            options={[
              { value: 'success', label: t('notificationRecord.statusSuccess') },
              { value: 'failed', label: t('notificationRecord.statusFailed') },
            ]}
            onChange={(value) => setQuery((current) => ({ ...current, status: value, page: 1 }))}
          />
          <RangePicker
            showTime
            style={{ width: 360 }}
            placeholder={[t('notificationRecord.sentAtStart'), t('notificationRecord.sentAtEnd')]}
            onChange={(_, dateStrings) => setQuery((current) => ({
              ...current,
              sentAtStart: dateStrings[0] || undefined,
              sentAtEnd: dateStrings[1] || undefined,
              page: 1,
            }))}
          />
        </div>

        <Table<NotificationRecord>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.records ?? []}
          pagination={{
            current: data?.current ?? query.page ?? 1,
            pageSize: data?.size ?? query.size ?? 10,
            total: data?.total ?? 0,
            onChange: (page, size) => setQuery((current) => ({ ...current, page, size })),
            showSizeChanger: true,
            showTotal: (total) => t('common.total', { total }),
          }}
        />
      </Card>

      <Drawer
        open={!!selectedRecord}
        title={t('notificationRecord.detail')}
        width={760}
        onClose={() => setSelectedRecord(null)}
      >
        {selectedRecord && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label={t('notificationRecord.channel')}>
                {selectedRecord.channelName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('notificationRecord.template')}>
                {selectedRecord.templateName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('notificationRecord.sourceType')}>
                {selectedRecord.sourceType ? t(SOURCE_TYPE_KEYS[selectedRecord.sourceType] || selectedRecord.sourceType) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('common.status')}>
                {selectedRecord.status === 'success'
                  ? t('notificationRecord.statusSuccess')
                  : t('notificationRecord.statusFailed')}
              </Descriptions.Item>
              <Descriptions.Item label={t('notificationRecord.billing')}>
                {selectedRecord.billingAmount ?? '-'} {selectedRecord.billingCurrency || ''} / {selectedRecord.billingUnit || '-'} x {selectedRecord.billingQuantity || 0}
              </Descriptions.Item>
              <Descriptions.Item label={t('notificationRecord.sentAt')}>
                {selectedRecord.sentAt || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('notificationRecord.responseSummary')}>
                <Paragraph style={{ marginBottom: 0 }}>{selectedRecord.responseSummary || '-'}</Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label={t('common.errorMessage')}>
                <Paragraph style={{ marginBottom: 0 }}>{selectedRecord.errorMessage || '-'}</Paragraph>
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title={t('notificationRecord.title')}>
              <Paragraph style={{ marginBottom: 0 }}>{selectedRecord.title || '-'}</Paragraph>
            </Card>

            <Card size="small" title={t('messageTemplate.contentTemplate')}>
              {selectedRecord.content ? (
                <MarkdownPreview content={selectedRecord.content} />
              ) : (
                <Text type="secondary">-</Text>
              )}
            </Card>

            <Card size="small" title={t('notificationRecord.requestPayload')}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(selectedRecord.requestPayload || {}, null, 2)}
              </pre>
            </Card>

            <Card size="small" title={t('notificationRecord.responsePayload')}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(selectedRecord.responsePayload || {}, null, 2)}
              </pre>
            </Card>
          </Space>
        )}
      </Drawer>
    </PageContainer>
  );
}

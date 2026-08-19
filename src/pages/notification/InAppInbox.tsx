import { useMemo, useState } from 'react';
import { Button, Card, Empty, Input, List, Segmented, Space, Tag, Typography, message } from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import {
  useArchiveInAppMessage,
  useInAppInbox,
  useInAppUnreadCount,
  useMarkInAppMessageRead,
} from '@/api/inAppMessage';
import type { InAppMessage } from '@/types/notification';
import { isExternalActionUrl, normalizeActionUrl } from '@/utils/actionUrl';

const { Paragraph, Text } = Typography;

type InboxFilterStatus = 'all' | 'unread' | 'read' | 'archived';

const STATUS_COLOR_MAP: Record<string, string> = {
  unread: 'processing',
  read: 'default',
  archived: 'default',
};

/** 评审通知 businessType 对应的图标 */
const BUSINESS_TYPE_ICON_MAP: Record<string, React.ReactNode> = {
  review_completed: <CheckCircleOutlined style={{ fontSize: 18, color: '#52c41a' }} />,
  review_remind: <ClockCircleOutlined style={{ fontSize: 18, color: '#faad14' }} />,
  review_escalate: <ExclamationCircleOutlined style={{ fontSize: 18, color: '#ff4d4f' }} />,
};

const PAGE_SIZE = 10;

export default function InAppInbox() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const [keywordDraft, setKeywordDraft] = useState(searchParams.get('keyword') || '');
  const currentStatus = (searchParams.get('status') as InboxFilterStatus) || 'all';
  const currentPage = Number(searchParams.get('page') || 1);
  const keyword = searchParams.get('keyword') || undefined;
  const { data: inboxData, isLoading } = useInAppInbox({
    page: currentPage,
    size: PAGE_SIZE,
    status: currentStatus === 'all' ? undefined : currentStatus,
    keyword,
  });
  const { data: unreadCount = 0 } = useInAppUnreadCount();
  const markRead = useMarkInAppMessageRead();
  const archiveMessage = useArchiveInAppMessage();

  const statusOptions = useMemo(
    (): Array<{ label: string; value: InboxFilterStatus }> => ([
      { label: t('notification.statusAll'), value: 'all' },
      { label: t('notification.statusUnread'), value: 'unread' },
      { label: t('notification.statusRead'), value: 'read' },
      { label: t('notification.statusArchived'), value: 'archived' },
    ]),
    [t],
  );

  const updateQuery = (patch: Partial<Record<'status' | 'keyword' | 'page', string>>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (!value || (key === 'status' && value === 'all')) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    setSearchParams(next);
  };

  const handleMarkRead = async (item: InAppMessage, silent = false) => {
    if (item.status !== 'unread') {
      return true;
    }
    try {
      await markRead.mutateAsync(item.recipientId);
      if (!silent) {
        message.success(t('notification.readSuccess'));
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleArchive = async (item: InAppMessage) => {
    try {
      await archiveMessage.mutateAsync(item.recipientId);
      message.success(t('notification.archiveSuccess'));
    } catch {
      // 请求异常由全局拦截器统一处理
    }
  };

  const handleOpen = async (item: InAppMessage) => {
    const marked = await handleMarkRead(item, true);
    if (!marked) {
      return;
    }
    const actionUrl = normalizeActionUrl(item.actionUrl);
    if (!actionUrl) {
      message.info(t('notification.noAction'));
      return;
    }
    if (isExternalActionUrl(actionUrl)) {
      window.location.assign(actionUrl);
      return;
    }
    navigate(actionUrl);
  };

  return (
    <PageContainer
      title={t('notification.inboxTitle')}
      extra={(
        <Tag color={unreadCount > 0 ? 'processing' : 'default'}>
          {t('notification.unreadCount', { count: unreadCount })}
        </Tag>
      )}
    >
      <Card variant="borderless" className="shadow-sm">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text type="secondary">{t('notification.inboxDescription')}</Text>
            <Space wrap>
              <Input.Search
                allowClear
                value={keywordDraft}
                placeholder={t('notification.searchPlaceholder')}
                style={{ width: 280 }}
                onChange={(event) => setKeywordDraft(event.target.value)}
                onSearch={(value) => updateQuery({ keyword: value || '', page: '1' })}
              />
              <Segmented<InboxFilterStatus>
                value={currentStatus}
                options={statusOptions}
                onChange={(value) => updateQuery({ status: value, page: '1' })}
              />
            </Space>
          </div>

          <List<InAppMessage>
            loading={isLoading}
            dataSource={inboxData?.records || []}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('notification.empty')}
                />
              ),
            }}
            pagination={{
              current: inboxData?.current || currentPage,
              pageSize: inboxData?.size || PAGE_SIZE,
              total: inboxData?.total || 0,
              onChange: (page) => updateQuery({ page: String(page) }),
            }}
            renderItem={(item) => (
              <List.Item
                key={item.recipientId}
                actions={[
                  <Button key="open" type="link" icon={<BellOutlined />} onClick={() => void handleOpen(item)}>
                    {t('notification.openAction')}
                  </Button>,
                  item.status === 'unread' ? (
                    <Button key="read" type="link" icon={<ReadOutlined />} onClick={() => void handleMarkRead(item)}>
                      {t('notification.markRead')}
                    </Button>
                  ) : null,
                  item.status !== 'archived' ? (
                    <Button key="archive" type="link" onClick={() => void handleArchive(item)}>
                      {t('notification.archive')}
                    </Button>
                  ) : null,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={(() => {
                    const businessType = item.businessType ?? 'unknown';
                    return BUSINESS_TYPE_ICON_MAP[businessType]
                      || <InboxOutlined style={{ fontSize: 18, color: item.status === 'unread' ? '#1677ff' : '#94a3b8' }} />;
                  })()}
                  title={(
                    <Space size={8} wrap>
                      <Text strong={item.status === 'unread'}>{item.title}</Text>
                      <Tag color={STATUS_COLOR_MAP[item.status] || 'default'}>
                        {t(`notification.status${item.status.charAt(0).toUpperCase()}${item.status.slice(1)}`)}
                      </Tag>
                      {item.businessType ? <Tag>{item.businessType}</Tag> : null}
                    </Space>
                  )}
                  description={(
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                        {item.content}
                      </Paragraph>
                      <Text type="secondary">{item.createdAt}</Text>
                    </Space>
                  )}
                />
              </List.Item>
            )}
          />
        </Space>
      </Card>
    </PageContainer>
  );
}

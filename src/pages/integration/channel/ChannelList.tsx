import { useState } from 'react';
import { Row, Col, Card, Button, Input, Select, Badge, Modal, Space, message, Empty } from 'antd';
import {
  PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined, SendOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useChannels, useDeleteChannel, useTestChannel } from '@/api/channel';
import type { NotificationChannel, NotificationChannelQueryDTO } from '@/types/integration';
import { useAuthStore } from '@/store/useAuthStore';
import { CHANNEL_TYPE_KEYS, ChannelLogo } from './channelMeta';

const statusMap: Record<string, { color: string; textKey: string }> = {
  active: { color: 'success', textKey: 'common.active' },
  inactive: { color: 'default', textKey: 'common.inactive' },
  error: { color: 'error', textKey: 'channel.statusError' },
};

export default function ChannelList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('integration:channel:create');
  const canUpdate = hasPermission('integration:channel:update');
  const canDelete = hasPermission('integration:channel:delete');
  const [query, setQuery] = useState<NotificationChannelQueryDTO>({ page: 1, size: 20 });
  const { data, isLoading } = useChannels(query);
  const deleteMutation = useDeleteChannel();
  const testMutation = useTestChannel();

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: t('common.confirmDelete'),
      content: `${t('common.confirmDeleteContent')} ${name}?`,
      onOk: () => deleteMutation.mutateAsync(id).then(() => message.success(t('common.deleteSuccess'))),
    });
  };

  const handleTest = (id: string) => {
    testMutation.mutateAsync(id)
      .then(() => message.success(t('channel.testSuccess')))
      .catch(() => message.error(t('channel.testFailed')));
  };

  const records = data?.records ?? [];

  return (
    <PageContainer
      title={t('channel.management')}
      extra={
        canCreate ? (
          <Space>
            <Button onClick={() => navigate('/notification/message-template')}>
              {t('channel.templateConfig')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/notification/channel/create')}>
              {t('channel.create')}
            </Button>
          </Space>
        ) : null
      }
    >
      <Card variant="borderless" className="shadow-sm rounded-xl">
        {/* 搜索筛选栏 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
          <Input
            placeholder={t('common.search')}
            prefix={<SearchOutlined />}
            allowClear
            onChange={(e) => setQuery((q) => ({ ...q, keyword: e.target.value, page: 1 }))}
            style={{ width: 240 }}
          />
          <Select
            placeholder={t('channel.type')}
            allowClear
            onChange={(val) => setQuery((q) => ({ ...q, channelType: val, page: 1 }))}
            style={{ width: 150 }}
            options={Object.entries(CHANNEL_TYPE_KEYS).map(([value, key]) => ({ value, label: t(key) }))}
          />
          <Select
            placeholder={t('common.status')}
            allowClear
            onChange={(val) => setQuery((q) => ({ ...q, status: val, page: 1 }))}
            style={{ width: 150 }}
            options={[
              { label: t('common.active'), value: 'active' },
              { label: t('common.inactive'), value: 'inactive' },
              { label: t('common.error'), value: 'error' },
            ]}
          />
        </div>

        {/* 卡片网格 */}
        {isLoading || records.length > 0 ? (
          <Row gutter={[16, 16]}>
            {records.map((ch: NotificationChannel) => {
              const st = statusMap[ch.status] || { color: 'default', textKey: ch.status };
              return (
                <Col key={ch.id} xs={24} sm={12} lg={8} xl={6} style={{ display: 'flex' }}>
                  <Card
                    hoverable
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid var(--color-border)' }}
                    styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
                    onClick={() => navigate(`/notification/channel/${ch.id}`)}
                    actions={[
                      <SendOutlined key="test" onClick={(e) => { e.stopPropagation(); handleTest(ch.id); }} />,
                      ...(canUpdate ? [<EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); navigate(`/notification/channel/${ch.id}`); }} />] : []),
                      ...(canDelete ? [<DeleteOutlined key="delete" onClick={(e) => { e.stopPropagation(); handleDelete(ch.id, ch.name); }} />] : []),
                    ]}
                  >
                    {/* 标题区：Logo + 名称 + 类型 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <ChannelLogo type={ch.channelType} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ch.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                          {t(CHANNEL_TYPE_KEYS[ch.channelType] || ch.channelType)}
                        </div>
                      </div>
                    </div>
                    {/* 状态 + 描述 — flex:1 撑满保证卡片等高 */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Badge status={st.color as any} text={<span style={{ fontSize: 13 }}>{t(st.textKey)}</span>} />
                      {ch.lastTestAt && (
                        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                          {t('channel.lastTestPrefix')}: {ch.lastTestAt}
                        </span>
                      )}
                      {ch.description && (
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {ch.description}
                        </span>
                      )}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          <Empty description={t('common.noData')} />
        )}
      </Card>
    </PageContainer>
  );
}

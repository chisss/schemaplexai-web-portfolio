import { useMemo, useState } from 'react';
import { Button, Card, Col, Drawer, Empty, Input, Row, Select, Space, Tag, Typography, message } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useInstallMarketplacePlugin, useMarketplacePlugins, useUninstallMarketplacePlugin } from '@/api/marketplace';
import type { MarketplacePluginQuery, MarketplacePlugin } from '@/types/marketplace';

const { Text, Paragraph, Title } = Typography;

export default function Marketplace() {
  const { t } = useTranslation();
  const [query, setQuery] = useState<MarketplacePluginQuery>({
    page: 1,
    size: 24,
    sourceType: undefined,
    installed: undefined,
    keyword: '',
  });
  const [selectedPlugin, setSelectedPlugin] = useState<MarketplacePlugin | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const params = useMemo(
    () => ({
      ...query,
      keyword: query.keyword?.trim() || undefined,
    }),
    [query],
  );

  const { data, isLoading, refetch } = useMarketplacePlugins(params);
  const installMutation = useInstallMarketplacePlugin();
  const uninstallMutation = useUninstallMarketplacePlugin();
  const records = data?.records ?? [];

  const setFilter = (patch: Partial<MarketplacePluginQuery>) => {
    setQuery((prev) => ({ ...prev, page: 1, ...patch }));
  };

  const handleCardClick = (plugin: MarketplacePlugin) => {
    setSelectedPlugin(plugin);
    setDrawerOpen(true);
  };

  const handleInstallToggle = async (id: string, installed: boolean) => {
    try {
      if (installed) {
        await uninstallMutation.mutateAsync(id);
        message.success(t('marketplace.uninstalled'));
      } else {
        await installMutation.mutateAsync(id);
        message.success(t('marketplace.installed'));
      }
    } catch {
      // 统一拦截器处理
    }
  };

  const sourceLabelMap: Record<string, string> = {
    skill: t('marketplace.sourceSkill'),
    mcp: t('marketplace.sourceMcp'),
  };

  return (
    <PageContainer
      title={t('marketplace.title')}
      extra={
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
          {t('common.refresh')}
        </Button>
      }
    >
      <Card variant="borderless" className="mb-4 shadow-sm">
        <Space wrap size={12}>
          <Input
            allowClear
            style={{ width: 280 }}
            placeholder={t('marketplace.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={query.keyword}
            onChange={(e) => setFilter({ keyword: e.target.value })}
          />
          <Select
            allowClear
            style={{ width: 140 }}
            placeholder={t('marketplace.source')}
            value={query.sourceType}
            options={[
              { value: 'skill', label: t('marketplace.sourceSkill') },
              { value: 'mcp', label: t('marketplace.sourceMcp') },
            ]}
            onChange={(value) => setFilter({ sourceType: value })}
          />
          <Select
            allowClear
            style={{ width: 140 }}
            placeholder={t('marketplace.installStatus')}
            value={query.installed}
            options={[
              { value: true, label: t('marketplace.statusInstalled') },
              { value: false, label: t('marketplace.statusUninstalled') },
            ]}
            onChange={(value) => setFilter({ installed: value })}
          />
        </Space>
      </Card>

      {records.length === 0 && !isLoading ? (
        <Card variant="borderless" className="shadow-sm">
          <Empty description={t('marketplace.noPlugins')} />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {records.map((item) => (
            <Col key={item.id} xs={24} sm={12} lg={8} xl={6}>
              <Card
                hoverable
                className="h-full"
                onClick={() => handleCardClick(item)}
                title={
                  <Space>
                    <span>{item.name}</span>
                    {item.installed
                      ? <Tag color="success">{t('marketplace.statusInstalled')}</Tag>
                      : <Tag>{t('marketplace.statusUninstalled')}</Tag>}
                  </Space>
                }
                extra={<Tag color={item.sourceType === 'mcp' ? 'purple' : 'blue'}>{sourceLabelMap[item.sourceType] || item.sourceType}</Tag>}
                actions={[
                  <Button
                    key="install"
                    type={item.installed ? 'default' : 'primary'}
                    danger={item.installed}
                    loading={installMutation.isPending || uninstallMutation.isPending}
                    onClick={() => handleInstallToggle(item.id, item.installed)}
                  >
                    {item.installed ? t('marketplace.uninstall') : t('marketplace.install')}
                  </Button>,
                ]}
              >
                <Paragraph ellipsis={{ rows: 3 }} className="min-h-[66px]">
                  {item.description || t('common.noDescription')}
                </Paragraph>
                <Space wrap>
                  <Tag>{item.category || t('marketplace.uncategorized')}</Tag>
                  {item.installedVersion && <Text type="secondary">{t('marketplace.version')} {item.installedVersion}</Text>}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Drawer
        title={selectedPlugin?.name}
        placement="right"
        width={480}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button
            type={selectedPlugin?.installed ? 'default' : 'primary'}
            danger={selectedPlugin?.installed}
            loading={installMutation.isPending || uninstallMutation.isPending}
            onClick={() => selectedPlugin && handleInstallToggle(selectedPlugin.id, selectedPlugin.installed)}
          >
            {selectedPlugin?.installed ? t('marketplace.uninstall') : t('marketplace.install')}
          </Button>
        }
      >
        {selectedPlugin && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Space wrap>
              <Tag color={selectedPlugin.sourceType === 'mcp' ? 'purple' : 'blue'}>
                {sourceLabelMap[selectedPlugin.sourceType] || selectedPlugin.sourceType}
              </Tag>
              {selectedPlugin.installed && <Tag color="success">{t('marketplace.statusInstalled')}</Tag>}
              {selectedPlugin.installedVersion && (
                <Text type="secondary">{t('marketplace.version')} {selectedPlugin.installedVersion}</Text>
              )}
            </Space>

            <div>
              <Title level={5}>{t('marketplace.description')}</Title>
              <Paragraph>{selectedPlugin.description || t('common.noDescription')}</Paragraph>
            </div>

            <div>
              <Title level={5}>{t('marketplace.category')}</Title>
              <Tag>{selectedPlugin.category || t('marketplace.uncategorized')}</Tag>
            </div>
          </Space>
        )}
      </Drawer>
    </PageContainer>
  );
}

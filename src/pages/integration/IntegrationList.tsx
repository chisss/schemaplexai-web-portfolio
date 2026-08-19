import { Card, Row, Col, Typography, Button, Badge, Spin, message } from 'antd';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useIntegrations, useDeleteIntegration, useTestIntegrationConnection } from '@/api/integration';

const { Title, Text, Paragraph } = Typography;

export default function IntegrationList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: integrationData, isLoading } = useIntegrations({ page: 1, size: 20 });
  const deleteIntegrationMutation = useDeleteIntegration();
  const testConnectionMutation = useTestIntegrationConnection();

  const integrations = integrationData?.records ?? [];

  // 平台对应的图标映射
  const platformIconMap: Record<string, string> = {
    gitlab: '🦊',
    github: '🐙',
    jira: '📋',
    dingtalk: '🔔',
    mcp: '🔌',
  };

  const handleDisconnect = (id: string) => {
    deleteIntegrationMutation.mutate(id, {
      onSuccess: () => message.success(t('integration.disconnected')),
    });
  };

  const handleTestConnection = (id: string) => {
    testConnectionMutation.mutate(id, {
      onSuccess: (res) => {
        if (res?.data?.connected) {
          message.success(t('integration.testSuccess'));
        } else {
          message.warning(t('integration.testFail'));
        }
      },
    });
  };

  return (
    <PageContainer
      title={t('integration.center')}
      extra={
        <div className="flex gap-2">
          <Button onClick={() => navigate('/integration/marketplace')}>
            {t('marketplace.title')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />}>
            {t('integration.addCustom')}
          </Button>
        </div>
      }
    >
      <div className="mb-6">
        <Paragraph type="secondary" className="text-base">
          {t('integration.desc')}
        </Paragraph>
      </div>

      <Spin spinning={isLoading}>
      <Row gutter={[24, 24]}>
        {integrations.map((item) => {
          const isConnected = item.status === 'ACTIVE' || item.status === 'connected';
          const icon = platformIconMap[item.platform?.toLowerCase()] ?? '🔗';
          return (
          <Col xs={24} sm={12} lg={8} xl={6} key={item.id}>
            <Card
              hoverable
              className={`h-full border ${isConnected ? 'border-primary/30' : 'border-gray-200'}`}
              actions={[
                <Button type="text" icon={<SettingOutlined />} onClick={() => navigate(`/integration/${item.id}`)}>{t('integration.configure')}</Button>,
                <Button
                  type={isConnected ? 'text' : 'primary'}
                  danger={isConnected}
                  ghost={!isConnected}
                  onClick={() => isConnected ? handleDisconnect(item.id) : handleTestConnection(item.id)}
                >
                  {isConnected ? t('integration.disconnect') : t('integration.connect')}
                </Button>
              ]}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{icon}</div>
                <Badge
                  status={isConnected ? 'success' : 'default'}
                  text={isConnected ? t('integration.connected') : t('integration.notConnected')}
                />
              </div>
              <Title level={4} className="mt-0 mb-1">{item.name}</Title>
              <Text type="secondary" className="text-xs mb-3 block">{item.integrationType ?? item.platform}</Text>
              <Paragraph className="text-sm text-gray-500 line-clamp-3" style={{ height: '60px' }}>
                {item.config?.description ?? `${item.platform} ${t('integration.integration')}`}
              </Paragraph>
            </Card>
          </Col>
          );
        })}
      </Row>
      </Spin>
    </PageContainer>
  );
}

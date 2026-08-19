import {
  Alert,
  Button,
  Card,
  Col,
  List,
  Row,
  Space,
  Statistic,
  Tag,
  Timeline,
  Typography,
  theme,
} from 'antd';
import {
  ApiOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  LockOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';

const { Paragraph, Text, Title } = Typography;

export default function AiGateway() {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  const featureCards = [
    {
      key: 'control',
      icon: <LockOutlined style={{ fontSize: 22, color: token.colorPrimary }} />,
      title: t('integration.aiGateway.blocks.control.title'),
      description: t('integration.aiGateway.blocks.control.description'),
      items: [
        t('integration.aiGateway.blocks.control.item1'),
        t('integration.aiGateway.blocks.control.item2'),
        t('integration.aiGateway.blocks.control.item3'),
      ],
    },
    {
      key: 'parameters',
      icon: <ThunderboltOutlined style={{ fontSize: 22, color: '#FF7D00' }} />,
      title: t('integration.aiGateway.blocks.parameters.title'),
      description: t('integration.aiGateway.blocks.parameters.description'),
      items: [
        t('integration.aiGateway.blocks.parameters.item1'),
        t('integration.aiGateway.blocks.parameters.item2'),
        t('integration.aiGateway.blocks.parameters.item3'),
      ],
    },
    {
      key: 'compliance',
      icon: <AuditOutlined style={{ fontSize: 22, color: '#0f766e' }} />,
      title: t('integration.aiGateway.blocks.compliance.title'),
      description: t('integration.aiGateway.blocks.compliance.description'),
      items: [
        t('integration.aiGateway.blocks.compliance.item1'),
        t('integration.aiGateway.blocks.compliance.item2'),
        t('integration.aiGateway.blocks.compliance.item3'),
      ],
    },
  ];

  const roadmapItems = [
    {
      color: token.colorPrimary,
      children: (
        <div>
          <Text strong>{t('integration.aiGateway.roadmap.phase1.title')}</Text>
          <Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
            {t('integration.aiGateway.roadmap.phase1.description')}
          </Paragraph>
        </div>
      ),
    },
    {
      color: '#FF7D00',
      children: (
        <div>
          <Text strong>{t('integration.aiGateway.roadmap.phase2.title')}</Text>
          <Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
            {t('integration.aiGateway.roadmap.phase2.description')}
          </Paragraph>
        </div>
      ),
    },
    {
      color: '#0f766e',
      children: (
        <div>
          <Text strong>{t('integration.aiGateway.roadmap.phase3.title')}</Text>
          <Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
            {t('integration.aiGateway.roadmap.phase3.description')}
          </Paragraph>
        </div>
      ),
    },
  ];

  const architectureSteps = [
    t('integration.aiGateway.architecture.step1'),
    t('integration.aiGateway.architecture.step2'),
    t('integration.aiGateway.architecture.step3'),
    t('integration.aiGateway.architecture.step4'),
  ];

  return (
    <PageContainer
      title={t('integration.aiGateway.title')}
      extra={<Tag color="gold">{t('securityCompliance.badge')}</Tag>}
    >
      <Card
        variant="borderless"
        style={{
          marginBottom: 24,
          borderRadius: 12,
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${token.colorBgContainer} 0%, rgba(22, 119, 255, 0.12) 55%, rgba(13, 148, 136, 0.16) 100%)`,
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} xl={15}>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <Tag color="processing" style={{ width: 'fit-content', margin: 0 }}>
                {t('integration.aiGateway.badge')}
              </Tag>
              <Title level={2} style={{ margin: 0 }}>
                {t('integration.aiGateway.heroTitle')}
              </Title>
              <Paragraph style={{ fontSize: 16, margin: 0, color: token.colorTextSecondary }}>
                {t('integration.aiGateway.heroDescription')}
              </Paragraph>
              <Space wrap>
                <Button type="primary" disabled>
                  {t('integration.aiGateway.primaryAction')}
                </Button>
                <Button disabled>{t('integration.aiGateway.secondaryAction')}</Button>
              </Space>
            </Space>
          </Col>
          <Col xs={24} xl={9}>
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Card size="small" styles={{ body: { padding: 16 } }}>
                  <Statistic title={t('integration.aiGateway.stats.access')} value="32+" prefix={<ApiOutlined />} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" styles={{ body: { padding: 16 } }}>
                  <Statistic title={t('integration.aiGateway.stats.policy')} value="18" prefix={<LockOutlined />} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" styles={{ body: { padding: 16 } }}>
                  <Statistic title={t('integration.aiGateway.stats.audit')} value="100%" prefix={<AuditOutlined />} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Alert
        type="info"
        showIcon
        message={t('integration.aiGateway.alertTitle')}
        description={t('integration.aiGateway.alertDescription')}
        style={{ marginBottom: 24, borderRadius: 8 }}
      />

      <Row gutter={[24, 24]}>
        {featureCards.map((card) => (
          <Col xs={24} lg={8} key={card.key}>
            <Card
              className="h-full"
              style={{
                borderRadius: 8,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Space align="start">
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'rgba(15, 23, 42, 0.04)',
                    }}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>
                      {card.title}
                    </Title>
                    <Text type="secondary">{card.description}</Text>
                  </div>
                </Space>
                <List
                  split={false}
                  dataSource={card.items}
                  renderItem={(item) => (
                    <List.Item style={{ padding: '6px 0' }}>
                      <Space align="start">
                        <CheckCircleOutlined style={{ color: token.colorSuccess, marginTop: 4 }} />
                        <Text>{item}</Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} xl={10}>
          <Card
            title={t('integration.aiGateway.roadmap.title')}
            style={{ borderRadius: 8, height: '100%' }}
          >
            <Timeline items={roadmapItems} />
          </Card>
        </Col>
        <Col xs={24} xl={14}>
          <Card
            title={t('integration.aiGateway.architecture.title')}
            style={{ borderRadius: 8, height: '100%' }}
          >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {architectureSteps.map((step, index) => (
                <div
                  key={step}
                  style={{
                    padding: 18,
                    borderRadius: 8,
                    border: `1px dashed ${index === architectureSteps.length - 1 ? token.colorSuccessBorder : token.colorBorder}`,
                    background: index % 2 === 0 ? 'rgba(22, 119, 255, 0.04)' : 'rgba(15, 118, 110, 0.05)',
                  }}
                >
                  <Text strong>{step}</Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}

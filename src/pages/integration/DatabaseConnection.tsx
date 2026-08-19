import { useDeferredValue, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DatabaseOutlined,
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  TableOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useDatabaseSources, useDeleteDatabaseSource, useTestDatabaseSource } from '@/api/database';
import type { DatabaseConnectionMode, DatabaseSource } from '@/types/database';
import DatabaseSourceModal from './database/DatabaseSourceModal';
import {
  DATABASE_TYPE_OPTIONS,
  DatabaseTypeAvatar,
  resolveDatabaseTypeMeta,
} from './database/databaseMeta';

const { Paragraph, Text, Title } = Typography;

export default function DatabaseConnection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>();
  const [databaseType, setDatabaseType] = useState<string>();
  const [connectionMode, setConnectionMode] = useState<DatabaseConnectionMode>();
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<DatabaseSource | null>(null);
  const deferredKeyword = useDeferredValue(keyword);
  const { data, isLoading } = useDatabaseSources({
    page: 1,
    size: 200,
    keyword: deferredKeyword || undefined,
    status,
    databaseType,
    connectionMode,
  });
  const deleteMutation = useDeleteDatabaseSource();
  const testMutation = useTestDatabaseSource();

  const databaseServers = data?.records ?? [];
  const healthyCount = useMemo(
    () => databaseServers.filter((item) => item.status === 'active').length,
    [databaseServers],
  );

  const handleOpenCreate = () => {
    setEditingSource(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (source: DatabaseSource) => {
    setEditingSource(source);
    setModalOpen(true);
  };

  const handleDelete = (source: DatabaseSource) => {
    Modal.confirm({
      title: t('database.confirmDeleteTitle', { name: source.name }),
      content: t('database.confirmDeleteContent'),
      onOk: async () => {
        await deleteMutation.mutateAsync(source.id);
        message.success(t('database.deleteSuccess'));
      },
    });
  };

  const handleTest = async (source: DatabaseSource) => {
    const result = await testMutation.mutateAsync(source.id);
    message.success(
      result.data.connected
        ? t('database.testConnectSuccess', { name: source.name, count: result.data.toolCount ?? 0 })
        : result.data.message || t('database.testConnectFail', { name: source.name }),
    );
  };

  const renderStatusTag = (value: string) => {
    if (value === 'active') {
      return <Tag color="green">active</Tag>;
    }
    if (value === 'error') {
      return <Tag color="red">error</Tag>;
    }
    return <Tag>{value || 'inactive'}</Tag>;
  };

  return (
    <PageContainer
      title={t('database.pageTitle')}
      extra={
        <Space>
          <Button onClick={() => navigate('/data-management/database-text2sql')}>{t('database.openQueryAssistant')}</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            {t('database.createButton')}
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <Card style={{ borderRadius: 8 }}>
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} xl={15}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Tag color="cyan" style={{ width: 'fit-content', margin: 0 }}>
                  Database Workspace
                </Tag>
                <Title level={2} style={{ margin: 0 }}>
                  {t('database.heroTitle')}
                </Title>
                <Paragraph style={{ margin: 0 }}>
                  {t('database.heroDescription')}
                </Paragraph>
                <Space wrap>
                  <Button type="primary" onClick={handleOpenCreate}>
                    {t('database.createFirstDataSource')}
                  </Button>
                  <Button onClick={() => navigate('/data-management/database-text2sql')}>{t('database.enterText2SQL')}</Button>
                </Space>
              </Space>
            </Col>
            <Col xs={24} xl={9}>
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic title={t('database.supportedTypes')} value={DATABASE_TYPE_OPTIONS.length} prefix={<DatabaseOutlined />} />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic title={t('database.registered')} value={databaseServers.length} prefix={<LinkOutlined />} />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic title={t('database.healthyConnections')} value={healthyCount} prefix={<ThunderboltOutlined />} />
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        <Alert
          type="info"
          showIcon
          message={t('database.accessStrategy')}
          description={t('database.accessStrategyDescNew')}
        />

        <Card style={{ borderRadius: 8 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} xl={8}>
              <Input
                allowClear
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder={t('database.filterPlaceholder')}
              />
            </Col>
            <Col xs={12} xl={4}>
              <Select
                allowClear
                value={databaseType}
                onChange={setDatabaseType}
                style={{ width: '100%' }}
                placeholder={t('database.filterDbType')}
                options={DATABASE_TYPE_OPTIONS.map((item) => ({ label: item.label, value: item.code }))}
              />
            </Col>
            <Col xs={12} xl={4}>
              <Select
                allowClear
                value={status}
                onChange={setStatus}
                style={{ width: '100%' }}
                placeholder={t('database.filterStatus')}
                options={[
                  { label: 'active', value: 'active' },
                  { label: 'inactive', value: 'inactive' },
                  { label: 'error', value: 'error' },
                ]}
              />
            </Col>
            <Col xs={12} xl={4}>
              <Select
                allowClear
                value={connectionMode}
                onChange={setConnectionMode}
                style={{ width: '100%' }}
                placeholder={t('database.filterConnectionMode')}
                options={[
                  { label: t('database.presetConnection'), value: 'preset' },
                  { label: t('database.customMcp'), value: 'custom' },
                ]}
              />
            </Col>
            <Col xs={12} xl={4}>
              <Segmented
                value={viewMode}
                onChange={(value) => setViewMode(value as 'card' | 'table')}
                block
                options={[
                  { label: t('database.viewCard'), value: 'card', icon: <TableOutlined /> },
                  { label: t('database.viewTable'), value: 'table', icon: <UnorderedListOutlined /> },
                ]}
              />
            </Col>
          </Row>
        </Card>

        <Card
          title={t('database.boundDataSources')}
          extra={<Tag color="gold">{t('database.connectionCount', { count: databaseServers.length })}</Tag>}
          style={{ borderRadius: 8 }}
        >
          <Spin spinning={isLoading}>
            {databaseServers.length === 0 ? (
              <Empty
                description={t('database.emptyDataSourceDescription')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={handleOpenCreate}>
                  {t('database.createFirstButton')}
                </Button>
              </Empty>
            ) : viewMode === 'table' ? (
              <Table
                rowKey="id"
                pagination={false}
                dataSource={databaseServers}
                columns={[
                  {
                    title: t('database.columnName'),
                    dataIndex: 'name',
                    key: 'name',
                    render: (value: string, record: DatabaseSource) => (
                      <Space>
                        <DatabaseTypeAvatar databaseType={record.databaseType} size={32} />
                        <div>
                          <Button type="link" onClick={() => handleOpenEdit(record)} style={{ padding: 0 }}>
                            {value}
                          </Button>
                          <div>
                            <Text type="secondary">{resolveDatabaseTypeMeta(record.databaseType).label}</Text>
                          </div>
                        </div>
                      </Space>
                    ),
                  },
                  {
                    title: t('database.columnEndpoint'),
                    key: 'endpoint',
                    render: (_value, record: DatabaseSource) => (
                      <Text type="secondary">
                        {[record.host, record.port, record.database].filter(Boolean).join(' / ') || record.url || '-'}
                      </Text>
                    ),
                  },
                  {
                    title: t('database.columnConnectionMode'),
                    dataIndex: 'connectionMode',
                    key: 'connectionMode',
                    render: (value: DatabaseConnectionMode) => (
                      <Tag color={value === 'preset' ? 'blue' : 'default'}>
                        {value === 'preset' ? t('database.presetConnection') : t('database.customMcp')}
                      </Tag>
                    ),
                  },
                  {
                    title: t('database.columnToolCount'),
                    key: 'toolCount',
                    render: (_value, record: DatabaseSource) => record.toolCount ?? record.tools?.length ?? 0,
                  },
                  {
                    title: t('database.columnStatus'),
                    dataIndex: 'status',
                    key: 'status',
                    render: (value: string) => renderStatusTag(value),
                  },
                  {
                    title: t('database.columnActions'),
                    key: 'actions',
                    render: (_value, record: DatabaseSource) => (
                      <Space>
                        <Button size="small" icon={<ThunderboltOutlined />} onClick={() => handleTest(record)}>
                          {t('database.testButton')}
                        </Button>
                        <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(record)}>
                          {t('database.editButton')}
                        </Button>
                        <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                          {t('database.deleteButton')}
                        </Button>
                      </Space>
                    ),
                  },
                ]}
              />
            ) : (
              <Row gutter={[16, 16]}>
                {databaseServers.map((source) => {
                  const meta = resolveDatabaseTypeMeta(source.databaseType);
                  return (
                    <Col xs={24} md={12} xl={8} key={source.id}>
                      <Card style={{ borderRadius: 12, height: '100%' }}>
                        <Space direction="vertical" size={14} style={{ width: '100%' }}>
                          <Space align="start" style={{ justifyContent: 'space-between', width: '100%' }}>
                            <Space align="start">
                              <DatabaseTypeAvatar databaseType={source.databaseType} size={44} />
                              <div>
                                <Title level={5} style={{ margin: 0 }}>{source.name}</Title>
                                <Text type="secondary">{meta.label}</Text>
                              </div>
                            </Space>
                            {renderStatusTag(source.status)}
                          </Space>
                          <Paragraph type="secondary" style={{ marginBottom: 0, minHeight: 44 }}>
                            {source.description || meta.description}
                          </Paragraph>
                          <Space wrap>
                            <Tag>{source.connectionMode === 'preset' ? t('database.presetConnection') : t('database.customMcp')}</Tag>
                            <Tag>{source.transportType || 'stdio'}</Tag>
                            <Tag color="gold">{t('database.toolCountLabel', { count: source.toolCount ?? source.tools?.length ?? 0 })}</Tag>
                          </Space>
                          <div>
                            <Text type="secondary">{t('database.connectionInfo')}</Text>
                            <Paragraph style={{ marginBottom: 0 }}>
                              {[source.host, source.port, source.database].filter(Boolean).join(' / ') || source.url || t('database.notConfigured')}
                            </Paragraph>
                          </div>
                          <div>
                            <Text type="secondary">{t('database.lastHealthCheck')}</Text>
                            <Paragraph style={{ marginBottom: 0 }}>
                              {source.lastHealthCheck || t('database.notChecked')}
                            </Paragraph>
                          </div>
                          <Space wrap>
                            <Button icon={<ThunderboltOutlined />} onClick={() => handleTest(source)}>
                              {t('database.testConnectionButton')}
                            </Button>
                            <Button icon={<EditOutlined />} onClick={() => handleOpenEdit(source)}>
                              {t('database.editButton')}
                            </Button>
                            <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(source)}>
                              {t('database.deleteButton')}
                            </Button>
                          </Space>
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Spin>
        </Card>

        <Card style={{ borderRadius: 8 }}>
          <Space align="start">
            <SafetyCertificateOutlined style={{ color: '#1677ff', marginTop: 4 }} />
            <div>
              <Text strong>{t('database.securityAdvice')}</Text>
              <Paragraph style={{ marginBottom: 0, marginTop: 8 }}>
                {t('database.securityAdviceDescNew')}
              </Paragraph>
            </div>
          </Space>
        </Card>
      </Space>
      <DatabaseSourceModal
        open={modalOpen}
        initialValue={editingSource}
        onCancel={() => setModalOpen(false)}
        onSuccess={() => setModalOpen(false)}
      />
    </PageContainer>
  );
}

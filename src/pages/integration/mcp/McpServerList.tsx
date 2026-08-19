import { useState } from 'react';
import { Card, Row, Col, Button, Badge, Space, Spin, Input, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, HeartOutlined, ToolOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useMcpServers, useHealthCheckMcpServer, useDiscoverMcpServerTools } from '@/api/mcp';
import type { McpServerQueryDTO } from '@/types/integration';
import { useAuthStore } from '@/store/useAuthStore';

const { Text } = Typography;

export default function McpServerList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('integration:mcp:create');
  const [query, setQuery] = useState<McpServerQueryDTO>({ page: 1, size: 20 });
  const { data, isLoading } = useMcpServers(query);
  const healthCheckMutation = useHealthCheckMcpServer();
  const discoverToolsMutation = useDiscoverMcpServerTools();

  const servers = data?.records ?? [];

  return (
    <PageContainer
      title={t('mcp.management')}
      extra={
        canCreate ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/integration/mcp/create')}>
            {t('mcp.register')}
          </Button>
        ) : null
      }
    >
      <Space className="mb-4">
        <Input
          placeholder={t('common.search')}
          prefix={<SearchOutlined />}
          allowClear
          onChange={(e) => setQuery((q) => ({ ...q, keyword: e.target.value, page: 1 }))}
          style={{ width: 300 }}
        />
      </Space>

      <Spin spinning={isLoading}>
        <Row gutter={[24, 24]}>
          {servers.map((server) => {
            const isActive = server.status === 'active';
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={server.id}>
                <Card
                  hoverable
                  className="h-full"
                  onClick={() => navigate(`/integration/mcp/${server.id}`)}
                  actions={[
                    <Button type="text" icon={<HeartOutlined />} onClick={(e) => { e.stopPropagation(); healthCheckMutation.mutate(server.id); }}>{t('mcp.healthCheck')}</Button>,
                    <Button type="text" icon={<ToolOutlined />} onClick={(e) => { e.stopPropagation(); discoverToolsMutation.mutate(server.id); }}>{t('mcp.discoverTools')}</Button>,
                  ]}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">🔧</div>
                    <Badge status={isActive ? 'success' : 'default'} text={isActive ? t('common.active') : t('common.inactive')} />
                  </div>
                  <Text strong className="text-lg block mb-1">{server.name}</Text>
                  <Text type="secondary" className="text-xs block mb-2">{server.url}</Text>
                  <Space>
                    <Text type="secondary">{t('mcp.toolCount')}: {server.tools?.length ?? 0}</Text>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Spin>
    </PageContainer>
  );
}

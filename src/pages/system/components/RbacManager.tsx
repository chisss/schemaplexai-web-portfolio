/**
 * RBAC 权限管理展示组件
 * 展示角色权限矩阵，提供跳转角色管理页面的入口
 */
import { Row, Col, Card, Tag, Skeleton, Empty, Typography, Alert } from 'antd';
import { SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAllRoles } from '@/api/system';

const { Title, Text, Paragraph } = Typography;

/** 角色状态颜色映射 */
const ROLE_STATUS_COLOR: Record<string, string> = {
  active: 'green',
  ACTIVE: 'green',
  inactive: 'default',
  INACTIVE: 'default',
};

export default function RbacManager() {
  const { t } = useTranslation();
  const { data: roles, isLoading } = useAllRoles();
  const roleStatusLabel: Record<string, string> = {
    active: t('common.enabled'),
    ACTIVE: t('common.enabled'),
    inactive: t('common.disabled'),
    INACTIVE: t('common.disabled'),
  };

  return (
    <div>
      {/* 页面标题说明 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <SafetyCertificateOutlined
            style={{ fontSize: 20, color: '#165DFF' }}
          />
          <Title level={5} className="m-0">
            {t('system.rbac.title')}
          </Title>
        </div>
        <Paragraph type="secondary" className="mb-0">
          {t('system.rbac.description')}
        </Paragraph>
      </div>

      {/* 角色权限矩阵 */}
      {isLoading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4].map((i) => (
            <Col key={i} xs={24} sm={12} lg={6}>
              <Card className="shadow-sm">
                <Skeleton active paragraph={{ rows: 3 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : !roles || roles.length === 0 ? (
        <Empty description={t('system.rbac.emptyRoles')} />
      ) : (
        <Row gutter={[16, 16]}>
          {roles.map((role) => (
            <Col key={role.id} xs={24} sm={12} lg={6}>
              <Card
                className="shadow-sm hover:shadow-md transition-shadow duration-200 h-full"
                styles={{ body: { padding: '20px' } }}
              >
                {/* 角色头部 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-lg"
                      style={{
                        background: role.isSystem
                          ? 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
                          : 'linear-gradient(135deg, #165DFF 0%, #0E42D2 100%)',
                      }}
                    >
                      <TeamOutlined className="text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 text-sm leading-tight">
                        {role.name}
                      </div>
                      {role.isSystem && (
                        <Tag color="orange" className="mt-0.5 text-xs">
                          {t('system.role.systemRole')}
                        </Tag>
                      )}
                    </div>
                  </div>
                  <Tag color={ROLE_STATUS_COLOR[role.status] ?? 'default'}>
                    {roleStatusLabel[role.status] ?? role.status}
                  </Tag>
                </div>

                {/* 角色编码 */}
                <div className="mb-3">
                  <code className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                    {role.code}
                  </code>
                </div>

                {/* 描述 */}
                {role.description && (
                  <Text type="secondary" className="text-xs block mb-3">
                    {role.description}
                  </Text>
                )}

                {/* 权限数量 */}
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <Text type="secondary" className="text-xs">
                    {t('system.rbac.permissionCount')}
                  </Text>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: '#165DFF' }}
                  >
                    {role.permissions?.length ?? 0} {t('system.rbac.permissionUnit')}
                  </span>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 底部说明 */}
      <Alert
        className="mt-6"
        type="info"
        showIcon
        message={t('system.rbac.tipTitle')}
        description={t('system.rbac.tipDescription')}
      />
    </div>
  );
}

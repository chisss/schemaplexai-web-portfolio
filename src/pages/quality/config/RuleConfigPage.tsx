import React from 'react';
import { Card, Table, Button, Space, Tag, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const SEVERITY_LABEL_KEYS: Record<string, string> = {
  critical: 'quality.severity.critical',
  high: 'quality.severity.high',
  warning: 'quality.severity.warning',
  medium: 'quality.severity.medium',
  info: 'quality.severity.info',
  low: 'quality.severity.low',
};

/**
 * 规则配置页面
 */
const RuleConfigPage: React.FC = () => {
  const { t } = useTranslation();
  const columns = [
    { title: t('quality.rule.code'), dataIndex: 'code', key: 'code' },
    { title: t('quality.rule.name'), dataIndex: 'name', key: 'name' },
    { title: t('quality.rule.dimension'), dataIndex: 'dimensionCode', key: 'dimensionCode' },
    { title: t('quality.rule.type'), dataIndex: 'ruleType', key: 'ruleType' },
    {
      title: t('quality.rule.severity'),
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const color = severity === 'critical' ? 'red' : severity === 'warning' ? 'orange' : 'blue';
        return <Tag color={color}>{SEVERITY_LABEL_KEYS[severity] ? t(SEVERITY_LABEL_KEYS[severity]) : severity}</Tag>;
      },
    },
    {
      title: t('common.actions'),
      key: 'action',
      render: () => (
        <Space>
          <Tooltip title={t('common.edit')}><Button type="text" size="small" icon={<EditOutlined />} /></Tooltip>
          <Tooltip title={t('common.delete')}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={t('quality.rule.pageTitle')}
      variant="borderless"
      className="shadow-sm"
      extra={<Button type="primary" icon={<PlusOutlined />}>{t('quality.rule.create')}</Button>}
    >
      <Table columns={columns} dataSource={[]} loading={false} />
    </Card>
  );
};

export default RuleConfigPage;

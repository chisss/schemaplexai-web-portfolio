import { Button, Popconfirm, Table, Tag } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useAmendments, useDeleteAmendment } from '@/api/amendment';
import type { ToolApprovalAmendment } from '@/api/amendment';

interface AmendmentRulesTabProps {
  agentId: string;
}

export default function AmendmentRulesTab({ agentId }: AmendmentRulesTabProps) {
  const { data: amendments, isLoading } = useAmendments(agentId);
  const deleteMutation = useDeleteAmendment();

  const columns = [
    {
      title: '工具',
      dataIndex: 'toolCode',
      key: 'toolCode',
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '命令模式',
      dataIndex: 'commandPattern',
      key: 'commandPattern',
      ellipsis: true,
    },
    {
      title: '匹配类型',
      dataIndex: 'matchType',
      key: 'matchType',
      render: (type: string) => {
        const colorMap: Record<string, string> = { PREFIX: 'green', EXACT: 'orange', REGEX: 'purple' };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: '作用域',
      dataIndex: 'scope',
      key: 'scope',
      render: (scope: string) => scope === 'TENANT' ? '租户全局' : '当前Agent',
    },
    {
      title: '使用次数',
      dataIndex: 'useCount',
      key: 'useCount',
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      render: (val: string) => val ? new Date(val).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: ToolApprovalAmendment) => (
        <Popconfirm title="确认删除此信任规则？" onConfirm={() => deleteMutation.mutate(record.id)}>
          <Button type="link" danger icon={<DeleteOutlined />} size="small">删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table
      dataSource={amendments || []}
      columns={columns}
      rowKey="id"
      loading={isLoading}
      pagination={{ pageSize: 10 }}
      locale={{ emptyText: '暂无信任规则，当您批准工具执行时会自动生成' }}
    />
  );
}

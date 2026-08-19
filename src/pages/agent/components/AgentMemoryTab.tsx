import { Button, Popconfirm, Table, Tag, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useAgentMemories, useDeleteAgentMemory } from '@/api/agentMemory';
import type { AgentMemory } from '@/api/agentMemory';

const { Paragraph } = Typography;

interface AgentMemoryTabProps {
  agentId: string;
}

const MEMORY_TYPE_COLORS: Record<string, string> = {
  FACT: 'blue',
  PREFERENCE: 'green',
  CONSTRAINT: 'orange',
  PATTERN: 'purple',
};

const MEMORY_TYPE_LABELS: Record<string, string> = {
  FACT: '事实',
  PREFERENCE: '偏好',
  CONSTRAINT: '约束',
  PATTERN: '模式',
};

export default function AgentMemoryTab({ agentId }: AgentMemoryTabProps) {
  const { data: memories, isLoading } = useAgentMemories(agentId);
  const deleteMutation = useDeleteAgentMemory();

  const columns = [
    {
      title: '类型',
      dataIndex: 'memoryType',
      key: 'memoryType',
      width: 80,
      render: (type: string) => (
        <Tag color={MEMORY_TYPE_COLORS[type] || 'default'}>
          {MEMORY_TYPE_LABELS[type] || type}
        </Tag>
      ),
      filters: Object.entries(MEMORY_TYPE_LABELS).map(([value, text]) => ({ text, value })),
      onFilter: (value: unknown, record: AgentMemory) => record.memoryType === value,
    },
    {
      title: '阶段',
      dataIndex: 'phase',
      key: 'phase',
      width: 80,
      render: (phase: string) => (
        <Tag color={phase === 'CONSOLIDATED' ? 'cyan' : 'default'}>
          {phase === 'CONSOLIDATED' ? '已合并' : '原始'}
        </Tag>
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      render: (content: string) => (
        <Paragraph ellipsis={{ rows: 2, expandable: true }} style={{ marginBottom: 0 }}>
          {content}
        </Paragraph>
      ),
    },
    {
      title: '相关性',
      dataIndex: 'relevanceScore',
      key: 'relevanceScore',
      width: 80,
      render: (score: number) => score?.toFixed(2) || '-',
      sorter: (a: AgentMemory, b: AgentMemory) => (a.relevanceScore || 0) - (b.relevanceScore || 0),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (val: string) => val ? new Date(val).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: AgentMemory) => (
        <Popconfirm title="确认删除此记忆？" onConfirm={() => deleteMutation.mutate(record.id)}>
          <Button type="link" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table
      dataSource={memories || []}
      columns={columns}
      rowKey="id"
      loading={isLoading}
      pagination={{ pageSize: 15 }}
      size="small"
      locale={{ emptyText: '暂无记忆，Agent 执行后会自动提取关键信息' }}
    />
  );
}

import { Button, Empty, Space, Tag, Typography } from 'antd';
import { AimOutlined, ToolOutlined } from '@ant-design/icons';
import type { WorkflowValidationIssue } from '../utils/workflowValidator';

const { Text } = Typography;

interface WorkflowIssuePanelProps {
  issues: WorkflowValidationIssue[];
  onSelectNode?: (nodeId: string) => void;
  onFixIssue?: (issue: WorkflowValidationIssue) => void;
}

export default function WorkflowIssuePanel({ issues, onSelectNode, onFixIssue }: WorkflowIssuePanelProps) {
  if (!issues.length) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        right: 16,
        top: 16,
        zIndex: 15,
        width: 320,
        maxWidth: 'calc(100% - 32px)',
        maxHeight: 'calc(100% - 32px)',
        overflow: 'auto',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.96)',
        boxShadow: '0 18px 45px rgba(15,23,42,0.14)',
        border: '1px solid rgba(148,163,184,0.2)',
        padding: 12,
      }}
    >
      <Space orientation="vertical" size={10} style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text strong>校验问题</Text>
          <Tag color={issues.some((item) => item.level === 'error') ? 'red' : 'gold'}>{issues.length}</Tag>
        </div>
        {issues.length ? issues.map((issue) => (
          <div
            key={`${issue.code}-${issue.nodeId || 'global'}`}
            style={{
              borderRadius: 8,
              border: `1px solid ${issue.level === 'error' ? 'rgba(239,68,68,0.24)' : 'rgba(245,158,11,0.26)'}`,
              background: issue.level === 'error' ? 'rgba(254,242,242,0.92)' : 'rgba(255,251,235,0.92)',
              padding: 10,
            }}
          >
            <Space orientation="vertical" size={6} style={{ width: '100%' }}>
              <Space wrap size={6}>
                <Tag color={issue.level === 'error' ? 'red' : 'gold'}>{issue.level}</Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>{issue.code}</Text>
              </Space>
              <Text style={{ fontSize: 13 }}>{issue.message}</Text>
              <Space wrap size={6}>
                {issue.nodeId ? (
                  <Button size="small" icon={<AimOutlined />} onClick={() => onSelectNode?.(issue.nodeId!)}>
                    定位节点
                  </Button>
                ) : null}
                {issue.fixAction ? (
                  <Button size="small" icon={<ToolOutlined />} onClick={() => onFixIssue?.(issue)}>
                    修复建议
                  </Button>
                ) : null}
              </Space>
            </Space>
          </div>
        )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有校验问题" />}
      </Space>
    </div>
  );
}

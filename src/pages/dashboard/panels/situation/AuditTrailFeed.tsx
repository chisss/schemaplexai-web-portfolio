import { List, Tag, Typography } from 'antd';
import { FileProtectOutlined, LinkOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import type { AuditTrail } from '@/types/homepage';

const { Text } = Typography;

interface Props {
  trails: AuditTrail[];
}

export default function AuditTrailFeed({ trails }: Props) {
  const isDark = useAppStore((s) => s.theme === 'dark');

  if (!trails.length) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <FileProtectOutlined style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }} />
        <Text style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>
          审计追踪
        </Text>
      </div>
      <List
        size="small"
        dataSource={trails}
        split={false}
        renderItem={(trail) => (
          <List.Item
            key={trail.id}
            style={{ padding: '6px 10px', borderRadius: 6, marginBottom: 2 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>
                  <Text strong style={{ fontSize: 12 }}>{trail.username}</Text>
                  {' '}{trail.action} {trail.resource}
                </Text>
                {trail.severity && (
                  <Tag color={severityColor(trail.severity)} style={{ marginInlineEnd: 0, fontSize: 10 }}>
                    {trail.severity}
                  </Tag>
                )}
              </div>
              {trail.detail && (
                <Text ellipsis style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8' }}>
                  {trail.detail}
                </Text>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 10, color: isDark ? '#475569' : '#cbd5e1' }}>
                  {new Date(trail.createdAt).toLocaleString()}
                </Text>
                {trail.resourceId && (
                  <Text style={{ fontSize: 10, color: isDark ? '#64748b' : '#94a3b8' }}>
                    {trail.resourceId}
                  </Text>
                )}
                {trail.traceId && (
                  <Text style={{ fontSize: 10, color: isDark ? '#64748b' : '#94a3b8' }}>
                    trace {trail.traceId}
                  </Text>
                )}
                {trail.targetUrl && (
                  <a href={trail.targetUrl} style={{ fontSize: 10 }}>
                    <LinkOutlined /> 证据
                  </a>
                )}
              </div>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}

function severityColor(severity: AuditTrail['severity']) {
  if (severity === 'CRITICAL' || severity === 'HIGH') {
    return 'red';
  }
  if (severity === 'MEDIUM') {
    return 'gold';
  }
  return 'blue';
}

import { useState } from 'react';
import { Card, Button, Input, Space, Tag, Descriptions, Spin, Alert } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useTestApiGateway } from '../../../../api/apiGateway';
import type { ApiGatewayTestResult } from '../../../../types/integration';

const { TextArea } = Input;

interface Props {
  gatewayId: string;
}

export default function ApiTestPanel({ gatewayId }: Props) {
  const [headersStr, setHeadersStr] = useState('');
  const [queryStr, setQueryStr] = useState('');
  const [bodyStr, setBodyStr] = useState('');
  const [result, setResult] = useState<ApiGatewayTestResult | null>(null);
  const testMutation = useTestApiGateway();

  const handleTest = async () => {
    const data: any = {};
    if (headersStr) {
      try { data.headers = JSON.parse(headersStr); } catch { /* ignore */ }
    }
    if (queryStr) {
      try { data.queryParams = JSON.parse(queryStr); } catch { /* ignore */ }
    }
    if (bodyStr) {
      data.body = bodyStr;
    }

    const res = await testMutation.mutateAsync({ id: gatewayId, data });
    setResult(res.data);
  };

  const formatJson = (str?: string) => {
    if (!str) return '';
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  return (
    <Card title="API 测试" style={{ marginTop: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <label style={{ fontWeight: 500 }}>覆盖请求头 (JSON, 可选)</label>
          <TextArea rows={2} value={headersStr} onChange={e => setHeadersStr(e.target.value)}
            placeholder='{"X-Custom-Header": "value"}' />
        </div>
        <div>
          <label style={{ fontWeight: 500 }}>覆盖查询参数 (JSON, 可选)</label>
          <TextArea rows={2} value={queryStr} onChange={e => setQueryStr(e.target.value)}
            placeholder='{"key": "value"}' />
        </div>
        <div>
          <label style={{ fontWeight: 500 }}>请求体 (可选)</label>
          <TextArea rows={4} value={bodyStr} onChange={e => setBodyStr(e.target.value)}
            placeholder='{"title": "test", "body": "content"}' />
        </div>

        <Button type="primary" icon={<PlayCircleOutlined />}
          loading={testMutation.isPending} onClick={handleTest}>
          发送测试请求
        </Button>

        {testMutation.isPending && <Spin tip="请求中..." />}

        {result && (
          <Card size="small" title="响应结果" style={{ marginTop: 8 }}>
            <Descriptions column={3} size="small">
              <Descriptions.Item label="状态">
                <Tag color={result.success ? 'success' : 'error'}>
                  {result.success ? '成功' : '失败'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态码">
                <Tag color={result.statusCode && result.statusCode < 400 ? 'blue' : 'red'}>
                  {result.statusCode || '-'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="耗时">
                {result.durationMs ? `${result.durationMs}ms` : '-'}
              </Descriptions.Item>
            </Descriptions>

            {result.errorMessage && (
              <Alert type="error" message={result.errorMessage} style={{ marginTop: 8 }} />
            )}

            {result.responseBody && (
              <div style={{ marginTop: 8 }}>
                <label style={{ fontWeight: 500 }}>响应体:</label>
                <pre style={{
                  background: '#f5f5f5', padding: 12, borderRadius: 6,
                  maxHeight: 400, overflow: 'auto', fontSize: 12, marginTop: 4,
                }}>
                  {formatJson(result.responseBody)}
                </pre>
              </div>
            )}
          </Card>
        )}
      </Space>
    </Card>
  );
}

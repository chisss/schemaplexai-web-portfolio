import { useEffect } from 'react';
import { Card, Form, InputNumber, Select, Switch, Button, Space, message, Divider } from 'antd';
import { useApiGatewayPolicy, useUpdateApiGatewayPolicy } from '../../../../api/apiGateway';

interface Props {
  gatewayId: string;
}

export default function PolicyConfigForm({ gatewayId }: Props) {
  const [form] = Form.useForm();
  const { data: policy, isLoading } = useApiGatewayPolicy(gatewayId);
  const updateMutation = useUpdateApiGatewayPolicy();

  useEffect(() => {
    if (policy) {
      form.setFieldsValue(policy);
    }
  }, [policy, form]);

  const handleSave = async (values: any) => {
    try {
      await updateMutation.mutateAsync({ id: gatewayId, data: values });
      message.success('策略更新成功');
    } catch {
      message.error('策略更新失败');
    }
  };

  return (
    <Card title="策略配置" loading={isLoading} style={{ marginTop: 16 }}>
      <Form form={form} layout="vertical" onFinish={handleSave}
        initialValues={{
          rateLimitPerMinute: 60,
          rateLimitPerHour: 1000,
          rateLimitPerDay: 10000,
          costPerCall: 0,
          dailyCostLimit: 0,
          monthlyCostLimit: 0,
          accessLevel: 'standard',
          requireApproval: false,
          enabled: true,
        }}
      >
        <Divider titlePlacement="start">频率限制</Divider>
        <Space size="large" wrap>
          <Form.Item name="rateLimitPerMinute" label="每分钟限制">
            <InputNumber min={0} style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="rateLimitPerHour" label="每小时限制">
            <InputNumber min={0} style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="rateLimitPerDay" label="每日限制">
            <InputNumber min={0} style={{ width: 140 }} />
          </Form.Item>
        </Space>

        <Divider titlePlacement="start">费用控制</Divider>
        <Space size="large" wrap>
          <Form.Item name="costPerCall" label="单次调用费用">
            <InputNumber min={0} step={0.01} prefix="¥" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="dailyCostLimit" label="日费用上限">
            <InputNumber min={0} step={1} prefix="¥" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="monthlyCostLimit" label="月费用上限">
            <InputNumber min={0} step={1} prefix="¥" style={{ width: 140 }} />
          </Form.Item>
        </Space>

        <Divider titlePlacement="start">权限与合规</Divider>
        <Space size="large" wrap>
          <Form.Item name="accessLevel" label="访问级别">
            <Select style={{ width: 160 }}
              options={[
                { label: '受限', value: 'restricted' },
                { label: '标准', value: 'standard' },
                { label: '高级', value: 'premium' },
              ]}
            />
          </Form.Item>
          <Form.Item name="requireApproval" label="需要审批" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="enabled" label="启用策略" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Space>

        <Form.Item style={{ marginTop: 16 }}>
          <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
            保存策略
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

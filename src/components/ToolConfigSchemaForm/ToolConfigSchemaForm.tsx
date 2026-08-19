/**
 * 工具配置 Schema 表单
 * 根据 JSON Schema 动态渲染表单
 */
import { useMemo } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Checkbox,
  Tooltip,
  Space,
  Typography,
} from 'antd';
import { InfoCircleOutlined, LockOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import type { ReactNode } from 'react';
import type { Rule } from 'antd/es/form';

const { TextArea } = Input;
const { Text } = Typography;
type SchemaFormValues = Record<string, unknown>;

interface SchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';
  title?: string;
  description?: string;
  default?: unknown;
  enum?: Array<string | number>;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  required?: string[];
  properties?: Record<string, SchemaProperty>;
  items?: SchemaProperty | SchemaProperty[];
  sensitive?: boolean;
}

interface ToolConfigSchemaFormProps {
  schema: {
    type?: string;
    properties?: Record<string, SchemaProperty>;
    required?: string[];
  };
  form?: FormInstance<SchemaFormValues>;
  values?: SchemaFormValues;
  onValuesChange?: (changed: SchemaFormValues, all: SchemaFormValues) => void;
  disabled?: boolean;
  layout?: 'vertical' | 'horizontal';
}

function buildInitialValues(
  properties: Record<string, SchemaProperty>,
  values?: SchemaFormValues,
): SchemaFormValues {
  const nextValues: SchemaFormValues = { ...(values || {}) };
  Object.entries(properties).forEach(([key, prop]) => {
    if (nextValues[key] === undefined && prop.default !== undefined) {
      nextValues[key] = prop.default;
    }
  });
  return nextValues;
}

export default function ToolConfigSchemaForm({
  schema,
  form,
  values,
  onValuesChange,
  disabled = false,
  layout = 'vertical',
}: ToolConfigSchemaFormProps) {
  const properties = useMemo(() => schema?.properties ?? {}, [schema?.properties]);
  const requiredFields = useMemo(() => schema?.required ?? [], [schema?.required]);
  const initialValues = useMemo(
    () => buildInitialValues(properties, values),
    [properties, values],
  );

  const renderField = (key: string, prop: SchemaProperty, isRequired: boolean): ReactNode => {
    const rules: Rule[] = [];

    if (isRequired) {
      rules.push({ required: true, message: `请输入 ${prop.title || key}` });
    }

    if (prop.minLength != null) {
      rules.push({ min: prop.minLength, message: `最小长度为 ${prop.minLength}` });
    }
    if (prop.maxLength != null) {
      rules.push({ max: prop.maxLength, message: `最大长度为 ${prop.maxLength}` });
    }
    if (prop.pattern) {
      rules.push({ pattern: new RegExp(prop.pattern), message: '格式不正确' });
    }

    const label = (
      <Space size={4}>
        <span>{prop.title || key}</span>
        {prop.sensitive && (
          <Tooltip title="敏感字段，值将加密存储">
            <LockOutlined style={{ color: '#faad14' }} />
          </Tooltip>
        )}
        {prop.description && (
          <Tooltip title={prop.description}>
            <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
          </Tooltip>
        )}
      </Space>
    );

    const placeholder = prop.description || `请输入 ${prop.title || key}`;

    switch (prop.type) {
      case 'string':
        if (prop.enum) {
          return (
            <Form.Item key={key} name={key} label={label} rules={rules}>
              <Select
                disabled={disabled}
                placeholder={placeholder}
                options={prop.enum.map((item) => ({ value: item, label: item }))}
              />
            </Form.Item>
          );
        }
        if (prop.format === 'textarea') {
          return (
            <Form.Item key={key} name={key} label={label} rules={rules}>
              <TextArea rows={4} disabled={disabled} placeholder={placeholder} />
            </Form.Item>
          );
        }
        return (
          <Form.Item key={key} name={key} label={label} rules={rules}>
            <Input
              disabled={disabled}
              placeholder={placeholder}
              type={prop.format === 'password' ? 'password' : 'text'}
            />
          </Form.Item>
        );

      case 'number':
      case 'integer':
        return (
          <Form.Item key={key} name={key} label={label} rules={rules}>
            <InputNumber
              disabled={disabled}
              placeholder={placeholder}
              style={{ width: '100%' }}
              min={prop.minimum}
              max={prop.maximum}
            />
          </Form.Item>
        );

      case 'boolean':
        return (
          <Form.Item
            key={key}
            name={key}
            label={label}
            valuePropName="checked"
          >
            <Switch disabled={disabled} />
          </Form.Item>
        );

      case 'array':
        if (prop.items && typeof prop.items === 'object' && !Array.isArray(prop.items)) {
          const itemProp = prop.items as SchemaProperty;
          if (itemProp.enum) {
            return (
              <Form.Item
                key={key}
                name={key}
                label={label}
              >
                <Checkbox.Group disabled={disabled} options={itemProp.enum.map((e) => ({ value: e, label: e }))} />
              </Form.Item>
            );
          }
        }
        return (
          <Form.Item key={key} name={key} label={label}>
            <Select
              disabled={disabled}
              mode="tags"
              placeholder="输入后按回车添加"
            />
          </Form.Item>
        );

      case 'object':
        if (prop.properties) {
          return (
            <div key={key} className="border rounded-lg p-4 bg-gray-50">
              <Text type="secondary" className="text-sm mb-3 block">{prop.title || key}</Text>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(prop.properties).map(([subKey, subProp]) =>
                  renderField(`${key}.${subKey}`, subProp as SchemaProperty, (prop.required || []).includes(subKey))
                )}
              </div>
            </div>
          );
        }
        return (
          <Form.Item key={key} name={key} label={label}>
            <TextArea rows={3} disabled={disabled} placeholder="JSON 格式" />
          </Form.Item>
        );

      default:
        return (
          <Form.Item key={key} name={key} label={label} rules={rules}>
            <Input disabled={disabled} placeholder={placeholder} />
          </Form.Item>
        );
    }
  };

  return (
    <Form
      form={form}
      layout={layout}
      initialValues={initialValues}
      onValuesChange={onValuesChange}
      className="w-full"
    >
      {Object.entries(properties).map(([key, prop]) =>
        renderField(key, prop, requiredFields.includes(key))
      )}
    </Form>
  );
}

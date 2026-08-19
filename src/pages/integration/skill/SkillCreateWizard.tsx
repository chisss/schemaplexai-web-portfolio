/**
 * 技能创建向导
 * 分步引导用户创建自定义技能
 */
import { useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Steps,
  Space,
  Table,
  Switch,
  Tag,
  Divider,
  message,
  Alert,
  Radio,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  CodeOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useCreateSkill } from '@/api/skill';
import { useSkillDraftStore } from '@/store/skillDraftStore';
import type { ParameterSchema, SkillType } from '@/store/skillDraftStore';

const { TextArea } = Input;
type ParameterTableRow = ParameterSchema & { key: number };

const categoryOptions = [
  { value: 'builtin', label: '内置脚本', icon: <CodeOutlined /> },
  { value: 'http', label: 'HTTP 调用', icon: <GlobalOutlined /> },
  { value: 'javascript', label: 'JavaScript', icon: <CodeOutlined /> },
  { value: 'python', label: 'Python', icon: <CodeOutlined /> },
];

const parameterColumns: TableColumnsType<ParameterTableRow> = [
  {
    title: '参数名',
    dataIndex: 'name',
    width: 150,
    render: (value, _record, index) => (
      <Input
        value={value}
        placeholder="参数名"
        onChange={(e) => {
          const draft = useSkillDraftStore.getState().draft;
          const params = [...draft.parameters];
          params[index] = { ...params[index], name: e.target.value };
          useSkillDraftStore.getState().updateParameters(params);
        }}
      />
    ),
  },
  {
    title: '类型',
    dataIndex: 'type',
    width: 120,
    render: (value, _record, index) => (
      <Select
        value={value}
        style={{ width: '100%' }}
        options={[
          { value: 'string', label: '字符串' },
          { value: 'number', label: '数字' },
          { value: 'boolean', label: '布尔值' },
          { value: 'object', label: '对象' },
          { value: 'array', label: '数组' },
        ]}
        onChange={(v) => {
          const draft = useSkillDraftStore.getState().draft;
          const params = [...draft.parameters];
          params[index] = { ...params[index], type: v };
          useSkillDraftStore.getState().updateParameters(params);
        }}
      />
    ),
  },
  {
    title: '必填',
    dataIndex: 'required',
    width: 80,
    render: (value, _record, index) => (
      <Switch
        checked={value}
        size="small"
        onChange={(checked) => {
          const draft = useSkillDraftStore.getState().draft;
          const params = [...draft.parameters];
          params[index] = { ...params[index], required: checked };
          useSkillDraftStore.getState().updateParameters(params);
        }}
      />
    ),
  },
  {
    title: '默认值',
    dataIndex: 'default',
    width: 120,
    render: (value, _record, index) => (
      <Input
        value={value}
        placeholder="可选"
        onChange={(e) => {
          const draft = useSkillDraftStore.getState().draft;
          const params = [...draft.parameters];
          params[index] = { ...params[index], default: e.target.value };
          useSkillDraftStore.getState().updateParameters(params);
        }}
      />
    ),
  },
  {
    title: '描述',
    dataIndex: 'description',
    render: (value, _record, index) => (
      <Input
        value={value}
        placeholder="参数说明"
        onChange={(e) => {
          const draft = useSkillDraftStore.getState().draft;
          const params = [...draft.parameters];
          params[index] = { ...params[index], description: e.target.value };
          useSkillDraftStore.getState().updateParameters(params);
        }}
      />
    ),
  },
  {
    title: '操作',
    width: 60,
    render: (_value, _record, index) => (
      <Button
        type="text"
        danger
        icon={<DeleteOutlined />}
        onClick={() => useSkillDraftStore.getState().removeParameter(index)}
      />
    ),
  },
];

export default function SkillCreateWizard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { draft, currentStep, resetDraft, updateBasicInfo, updateImplementation, setCurrentStep } =
    useSkillDraftStore();
  const createMutation = useCreateSkill();

  useEffect(() => {
    return () => {
      resetDraft();
    };
  }, [resetDraft]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        category: draft.category,
        parameters: draft.parameters.filter((p) => p.name.trim()),
        implementation:
          draft.category === 'http'
            ? { type: 'http', url: draft.implementation.url, method: draft.implementation.method || 'GET' }
            : { type: 'script', content: draft.implementation.content },
      };
      createMutation.mutate(payload, {
        onSuccess: () => {
          message.success(t('common.createSuccess'));
          navigate('/integration/skill');
        },
        onError: () => {
          message.error(t('common.createFail'));
        },
      });
    } catch {
      // 表单校验失败
    }
  };

  const renderStep1 = () => (
    <Card variant="borderless" className="shadow-sm rounded-xl">
      <Form form={form} layout="vertical" initialValues={draft}>
        <div className="mb-6">
          <h3 className="text-base font-medium mb-2">基本信息</h3>
          <p className="text-gray-500 text-sm">填写技能的基本标识信息</p>
        </div>

        <Form.Item
          name="name"
          label="技能代码"
          rules={[
            { required: true, message: '请输入技能代码' },
            { pattern: /^[a-z][a-z0-9_]*$/, message: '只能包含小写字母、数字和下划线' },
          ]}
        >
          <Input
            placeholder="例如: my_calculator"
            onChange={(e) => updateBasicInfo({ name: e.target.value })}
          />
        </Form.Item>

        <Form.Item
          name="displayName"
          label="显示名称"
          rules={[{ required: true, message: '请输入显示名称' }]}
        >
          <Input
            placeholder="用户友好的名称"
            onChange={(e) => updateBasicInfo({ displayName: e.target.value })}
          />
        </Form.Item>

        <Form.Item name="description" label="描述">
          <TextArea
            rows={3}
            placeholder="技能的详细描述"
            onChange={(e) => updateBasicInfo({ description: e.target.value })}
          />
        </Form.Item>

        <Form.Item name="version" label="版本号">
          <Input
            placeholder="1.0.0"
            defaultValue="1.0.0"
            onChange={(e) => updateBasicInfo({ version: e.target.value })}
          />
        </Form.Item>
      </Form>

      <Divider />
      <div className="flex justify-end">
        <Space>
          <Button onClick={() => navigate('/integration/skill')}>{t('common.cancel')}</Button>
          <Button type="primary" onClick={() => setCurrentStep(1)}>
            下一步
          </Button>
        </Space>
      </div>
    </Card>
  );

  const renderStep2 = () => (
    <Card variant="borderless" className="shadow-sm rounded-xl">
      <div className="mb-6">
        <h3 className="text-base font-medium mb-2">技能类型</h3>
        <p className="text-gray-500 text-sm">选择技能的实现方式</p>
      </div>

      <Radio.Group
        value={draft.category}
        onChange={(e) => updateBasicInfo({ category: e.target.value as SkillType })}
        className="grid grid-cols-2 gap-4 mb-6"
      >
        {categoryOptions.map((opt) => (
          <Card
            key={opt.value}
            hoverable
            className={`text-center cursor-pointer ${
              draft.category === opt.value ? 'border-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => updateBasicInfo({ category: opt.value as SkillType })}
          >
            <div className="text-2xl mb-2">{opt.icon}</div>
            <div>{opt.label}</div>
          </Card>
        ))}
      </Radio.Group>

      <Divider />
      <div className="flex justify-between">
        <Button onClick={() => setCurrentStep(0)}>上一步</Button>
        <Button type="primary" onClick={() => setCurrentStep(2)}>
          下一步
        </Button>
      </div>
    </Card>
  );

  const renderStep3 = () => (
    <Card variant="borderless" className="shadow-sm rounded-xl">
      <div className="mb-6">
        <h3 className="text-base font-medium mb-2">参数配置</h3>
        <p className="text-gray-500 text-sm">定义技能输入参数（可选）</p>
      </div>

      <Alert
        message="参数说明"
        description="定义技能执行时需要的输入参数，前端将根据参数生成表单"
        type="info"
        showIcon
        className="mb-4"
      />

      <Table
        dataSource={draft.parameters.map((p, i) => ({ ...p, key: i }))}
        columns={parameterColumns}
        pagination={false}
        size="small"
        bordered
        className="mb-4"
      />

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => useSkillDraftStore.getState().addParameter()}
        className="w-full mb-6"
      >
        添加参数
      </Button>

      <Divider />
      <div className="flex justify-between">
        <Button onClick={() => setCurrentStep(1)}>上一步</Button>
        <Button type="primary" onClick={() => setCurrentStep(3)}>
          下一步
        </Button>
      </div>
    </Card>
  );

  const renderStep4 = () => (
    <Card variant="borderless" className="shadow-sm rounded-xl">
      <div className="mb-6">
        <h3 className="text-base font-medium mb-2">实现代码</h3>
        <p className="text-gray-500 text-sm">
          {draft.category === 'http' ? '配置 HTTP 请求' : '编写技能执行脚本'}
        </p>
      </div>

      {draft.category === 'http' ? (
        <Form layout="vertical">
          <Form.Item label="请求 URL" required>
            <Input
              placeholder="https://api.example.com/endpoint"
              value={draft.implementation.url}
              onChange={(e) =>
                updateImplementation({ ...draft.implementation, url: e.target.value })
              }
            />
          </Form.Item>
          <Form.Item label="请求方法">
            <Select
              value={draft.implementation.method || 'GET'}
              options={[
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'DELETE', label: 'DELETE' },
              ]}
              onChange={(v) =>
                updateImplementation({ ...draft.implementation, method: v })
              }
            />
          </Form.Item>
          <Form.Item label="请求体模板（JSON）">
            <TextArea
              rows={6}
              placeholder='{"key": "value"}'
              value={draft.implementation.content}
              onChange={(e) =>
                updateImplementation({ ...draft.implementation, content: e.target.value })
              }
            />
          </Form.Item>
        </Form>
      ) : (
        <>
          <Alert
            message="脚本说明"
            description={
              draft.category === 'javascript'
                ? '使用 Nashorn JavaScript 引擎执行，可以通过 args 对象访问传入参数'
                : '通过系统 Python 解释器执行，可以通过 args 对象访问传入参数'
            }
            type="info"
            showIcon
            className="mb-4"
          />
          <TextArea
            rows={12}
            placeholder={
              draft.category === 'javascript'
                ? '// 访问参数: args.paramName\nfunction execute(args) {\n  return { result: "Hello " + (args.name || "World") };\n}\nexecute(args);'
                : '# 访问参数: args["param_name"]\ndef execute(args):\n    return {"result": f\'Hello {args.get("name", "World")}\'}'
            }
            value={draft.implementation.content}
            onChange={(e) =>
              updateImplementation({ ...draft.implementation, content: e.target.value })
            }
            className="font-mono text-sm"
          />
        </>
      )}

      <Divider />
      <div className="flex justify-between">
        <Button onClick={() => setCurrentStep(2)}>上一步</Button>
        <Space>
          <Button onClick={() => setCurrentStep(4)}>预览</Button>
          <Button type="primary" loading={createMutation.isPending} onClick={handleSubmit}>
            创建技能
          </Button>
        </Space>
      </div>
    </Card>
  );

  const renderStep5 = () => (
    <Card variant="borderless" className="shadow-sm rounded-xl">
      <div className="mb-6">
        <h3 className="text-base font-medium mb-2">预览确认</h3>
        <p className="text-gray-500 text-sm">确认技能配置信息</p>
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">基本信息</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-500">技能代码:</div>
            <div className="font-mono">{draft.name}</div>
            <div className="text-gray-500">显示名称:</div>
            <div>{draft.displayName}</div>
            <div className="text-gray-500">描述:</div>
            <div>{draft.description || '-'}</div>
            <div className="text-gray-500">版本:</div>
            <div>{draft.version}</div>
            <div className="text-gray-500">类型:</div>
            <div>
              <Tag>{categoryOptions.find((c) => c.value === draft.category)?.label}</Tag>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">参数配置</h4>
          {draft.parameters.length === 0 ? (
            <p className="text-gray-400 text-sm">无参数</p>
          ) : (
            <div className="space-y-2">
              {draft.parameters.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Tag color={p.required ? 'red' : 'default'}>{p.required ? '必填' : '可选'}</Tag>
                  <code>{p.name}</code>
                  <span className="text-gray-400">({p.type})</span>
                  {p.description && <span className="text-gray-500">- {p.description}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">实现预览</h4>
          <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-48 font-mono">
            {draft.category === 'http'
              ? `HTTP ${draft.implementation.method || 'GET'} ${draft.implementation.url || '-'}`
              : draft.implementation.content || '(空脚本)'}
          </pre>
        </div>
      </div>

      <Divider />
      <div className="flex justify-between">
        <Button onClick={() => setCurrentStep(3)}>上一步</Button>
        <Button type="primary" loading={createMutation.isPending} onClick={handleSubmit}>
          创建技能
        </Button>
      </div>
    </Card>
  );

  const stepTitles = ['基本信息', '技能类型', '参数配置', '实现代码', '预览确认'];

  return (
    <PageContainer
      title="创建自定义技能"
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/integration/skill')}>
          {t('common.back')}
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <Steps
          current={currentStep}
          className="mb-8 mt-4"
          items={stepTitles.map((title) => ({ title }))}
        />

        {currentStep === 0 && renderStep1()}
        {currentStep === 1 && renderStep2()}
        {currentStep === 2 && renderStep3()}
        {currentStep === 3 && renderStep4()}
        {currentStep === 4 && renderStep5()}
      </div>
    </PageContainer>
  );
}

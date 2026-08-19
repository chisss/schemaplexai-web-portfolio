import { useState } from 'react';
import { Card, Form, Input, Select, Button, Space, Typography, message, Row, Col } from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, FileOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useCreateWorkflowTemplate } from '@/api/workflow';
import TemplateSelector from './components/TemplateSelector';
import type { WorkflowTemplate } from '@/types/workflow';

const { Title, Text, Paragraph } = Typography;

export default function WorkflowCreate() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const createTemplate = useCreateWorkflowTemplate();
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [createMode, setCreateMode] = useState<'blank' | 'template' | null>(null);

  const handleSelectTemplate = (tpl: WorkflowTemplate) => {
    setSelectedTemplate(tpl);
    setCreateMode('template');
    form.setFieldsValue({
      name: tpl.name + t('workflow.copySuffix'),
      description: tpl.description,
      category: tpl.category,
    });
    setTemplateModalOpen(false);
  };

  const handleSelectBlank = () => {
    setCreateMode('blank');
    setSelectedTemplate(null);
    form.resetFields();
    form.setFieldsValue({ category: 'feature-development' });
  };

  const onFinish = (values: any) => {
    createTemplate.mutate(
      {
        name: values.name,
        description: values.description,
        category: values.category,
        definition: selectedTemplate?.definition ?? { nodes: [], edges: [] },
        recommendedAgentSkills: selectedTemplate?.recommendedAgentSkills ?? [],
      },
      {
        onSuccess: (res) => {
          message.success(t('common.createSuccess'));
          navigate(`/workflow/designer?id=${res.data.id}`);
        },
        onError: () => {
          message.error(t('workflow.create.createFail'));
        },
      },
    );
  };

  return (
    <PageContainer
      title={t('workflow.create.title')}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {t('common.back')}
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        {/* 创建模式选择 */}
        {createMode === null && (
          <Row gutter={[20, 20]} className="mb-6">
            <Col xs={24} sm={12}>
              <Card
                hoverable
                className="rounded-xl text-center"
                style={{ border: '2px solid transparent', minHeight: 180 }}
                styles={{ body: { padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } }}
                onClick={handleSelectBlank}
              >
                <div
                  className="flex items-center justify-center mb-4 rounded-xl"
                  style={{
                    width: 56, height: 56,
                    background: 'linear-gradient(135deg, #165DFF 0%, #0E42D2 100%)',
                  }}
                >
                  <FileOutlined style={{ fontSize: 24, color: '#fff' }} />
                </div>
                <Title level={5} style={{ marginBottom: 4 }}>
                  {t('workflow.blankWorkflow')}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('workflow.blankWorkflowDesc')}
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card
                hoverable
                className="rounded-xl text-center"
                style={{ border: '2px solid transparent', minHeight: 180 }}
                styles={{ body: { padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } }}
                onClick={() => setTemplateModalOpen(true)}
              >
                <div
                  className="flex items-center justify-center mb-4 rounded-xl"
                  style={{
                    width: 56, height: 56,
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  }}
                >
                  <AppstoreOutlined style={{ fontSize: 24, color: '#fff' }} />
                </div>
                <Title level={5} style={{ marginBottom: 4 }}>
                  {t('workflow.fromTemplate')}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('workflow.fromTemplateDesc')}
                </Text>
              </Card>
            </Col>
          </Row>
        )}

        {/* 选中模板提示 */}
        {selectedTemplate && (
          <Card
            size="small"
            className="mb-4 rounded-xl"
            style={{ background: '#f0f5ff', border: '1px solid #adc6ff' }}
            styles={{ body: { padding: '8px 16px' } }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AppstoreOutlined style={{ color: '#1677ff' }} />
                <Text style={{ fontSize: 13 }}>
                  {t('workflow.basedOnTemplate')}
                  <Text strong style={{ marginLeft: 4 }}>{selectedTemplate.name}</Text>
                </Text>
              </div>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  setSelectedTemplate(null);
                  setCreateMode(null);
                  form.resetFields();
                }}
              >
                {t('workflow.changeTemplate')}
              </Button>
            </div>
          </Card>
        )}

        {/* 表单区域 */}
        {createMode !== null && (
          <Card variant="borderless" className="shadow-sm rounded-xl">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{ category: 'feature-development' }}
            >
              <Title level={5} className="mb-4">
                {t('workflow.create.basicInfo')}
              </Title>
              <Paragraph type="secondary" className="mb-6" style={{ fontSize: 13 }}>
                {t('workflow.create.basicInfoDesc')}
              </Paragraph>

              <Form.Item
                name="name"
                label={t('workflow.create.workflowName')}
                rules={[{ required: true, message: t('workflow.create.nameRequired') }]}
              >
                <Input
                  placeholder={t('workflow.create.namePlaceholder')}
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="category"
                label={t('workflow.create.scenarioType')}
                rules={[{ required: true }]}
              >
                <Select size="large">
                  <Select.Option value="feature-development">
                    {t('workflow.templateCategoryFeature')}
                  </Select.Option>
                  <Select.Option value="bug-fix">
                    {t('workflow.templateCategoryBugfix')}
                  </Select.Option>
                  <Select.Option value="review">
                    {t('workflow.templateCategoryReview')}
                  </Select.Option>
                  <Select.Option value="custom">
                    {t('workflow.templateCategoryCustom')}
                  </Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="description"
                label={t('workflow.create.workflowDesc')}
              >
                <Input.TextArea
                  rows={4}
                  placeholder={t('workflow.create.descPlaceholder')}
                />
              </Form.Item>

              <div className="mt-8 flex justify-end">
                <Space>
                  <Button
                    size="large"
                    onClick={() => {
                      setCreateMode(null);
                      setSelectedTemplate(null);
                      form.resetFields();
                    }}
                  >
                    {t('common.back')}
                  </Button>
                  <Button
                    size="large"
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={createTemplate.isPending}
                  >
                    {t('workflow.create.createAndDesign')}
                  </Button>
                </Space>
              </div>
            </Form>
          </Card>
        )}
      </div>

      {/* 模板选择器弹窗 */}
      <TemplateSelector
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSelect={handleSelectTemplate}
      />
    </PageContainer>
  );
}

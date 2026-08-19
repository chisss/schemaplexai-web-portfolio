/**
 * Spec 创建页面
 * 支持手动创建、从模板创建、智能体辅助新建（预留入口）
 */
import { useEffect, useState } from 'react';
import { Card, Form, Input, Select, Button, Space, Typography, message, Radio, Modal, List, Tag, Empty, Spin, Alert } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, FileTextOutlined, CopyOutlined, RobotOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useAuthStore } from '@/store/useAuthStore';
import { useCreateSpec, useSpecTemplateList, useCreateSpecFromTemplate, useAgentAssistSpec } from '@/api/spec';
import { useAgentList } from '@/api/agent';
import { useWorkspaces } from '@/api/workspace';
import { useWorkflowTemplates } from '@/api/workflow';
import { useChannels } from '@/api/channel';
import type { SpecCategory } from '@/types/spec';

const { Title, Paragraph, Text } = Typography;

type CreateMode = 'manual' | 'template' | 'agent' | 'jira-import';

/** 分类选项 */
const CATEGORY_OPTIONS: { value: SpecCategory; labelKey: string; defaultLabel: string }[] = [
  { value: 'feature-development', labelKey: 'spec.categoryFeature', defaultLabel: 'Feature Development' },
  { value: 'bug-fix', labelKey: 'spec.categoryBugFix', defaultLabel: 'Bug Fix' },
  { value: 'refactoring', labelKey: 'spec.categoryRefactoring', defaultLabel: 'Refactoring' },
  { value: 'data-analysis', labelKey: 'spec.categoryDataAnalysis', defaultLabel: 'Data Analysis' },
  { value: 'config-change', labelKey: 'spec.categoryConfigChange', defaultLabel: 'Config Change' },
];

const MARKETING_CATEGORY_OPTIONS: { value: SpecCategory; label: string }[] = [
  { value: 'campaign-copy', label: '营销活动文案' },
  { value: 'ad-copy', label: '广告投放文案' },
  { value: 'sms-copy', label: '短信文案' },
  { value: 'landing-page-copy', label: '落地页文案' },
  { value: 'social-post', label: '社媒文案' },
];

export default function SpecCreate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('spec:create');
  const [form] = Form.useForm();
  const { mutateAsync, isPending } = useCreateSpec();
  const createFromTemplate = useCreateSpecFromTemplate();
  const selectedSpecType = Form.useWatch('specType', form) || 'rd';
  const selectedDeliveryType = Form.useWatch(['profileData', 'deliveryConfig', 'deliveryType'], form);

  const [createMode, setCreateMode] = useState<CreateMode>('manual');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateCategory, setTemplateCategory] = useState<string | undefined>(undefined);
  const [agentAssistAgentId, setAgentAssistAgentId] = useState<string | undefined>();
  const [agentAssistDesc, setAgentAssistDesc] = useState('');
  const agentAssist = useAgentAssistSpec();
  const { data: agentListData } = useAgentList({ page: 1, size: 100 });

  const { data: templates, isLoading: loadingTemplates } = useSpecTemplateList(
    templateCategory ? { category: templateCategory } : undefined
  );
  const templateList = templates?.records || templates || [];

  const { data: workspacePage } = useWorkspaces({ page: 1, size: 100 });
  const workspaceOptions = (workspacePage?.records || []).map((ws: any) => ({
    label: ws.name,
    value: ws.id,
  }));

  const { data: workflowTemplatePage } = useWorkflowTemplates({ page: 1, size: 100 });
  const workflowTemplateOptions = (workflowTemplatePage?.records || []).map((wt: any) => ({
    label: wt.name,
    value: wt.id,
  }));
  const { data: feishuChannelPage } = useChannels({ page: 1, size: 100, status: 'active', channelType: 'feishu' });
  const feishuChannelOptions = (feishuChannelPage?.records || []).map((channel: any) => ({
    label: channel.name,
    value: channel.id,
  }));

  useEffect(() => {
    if (selectedSpecType !== 'marketing') {
      return;
    }
    form.setFieldsValue({
      jiraTicket: undefined,
      targetBranch: undefined,
    });
    if (!form.getFieldValue('category')) {
      form.setFieldValue('category', 'campaign-copy');
    }
    if (!form.getFieldValue('workflowId')) {
      const marketingWorkflow = workflowTemplateOptions.find((item) => String(item.label).includes('营销'));
      if (marketingWorkflow) {
        form.setFieldValue('workflowId', marketingWorkflow.value);
      }
    }
    if (!form.getFieldValue(['profileData', 'deliveryConfig', 'deliveryType'])) {
      form.setFieldValue(['profileData', 'deliveryConfig', 'deliveryType'], 'feishu_doc');
    }
    if (
      ((selectedDeliveryType as string | undefined) || form.getFieldValue(['profileData', 'deliveryConfig', 'deliveryType']) || 'feishu_doc') === 'feishu_doc'
      && !form.getFieldValue(['profileData', 'deliveryConfig', 'channelId'])
      && feishuChannelOptions.length > 0
    ) {
      form.setFieldValue(['profileData', 'deliveryConfig', 'channelId'], feishuChannelOptions[0].value);
    }
  }, [feishuChannelOptions, form, selectedDeliveryType, selectedSpecType, workflowTemplateOptions]);

  const onFinish = async (values: any) => {
    try {
      const result = await mutateAsync({
        name: values.name,
        specType: values.specType,
        description: values.description,
        profileData: values.profileData,
        workspaceIds: values.workspaceIds || [],
        priority: values.priority,
        category: values.category,
        tags: values.tags,
        workflowId: values.workflowId,
        jiraTicket: values.specType === 'marketing' ? undefined : values.jiraTicket,
        targetBranch: values.specType === 'marketing' ? undefined : values.targetBranch,
      });
      message.success(t('spec.create.createSuccess'));
      navigate(`/spec/${result.data.id}/edit`);
    } catch {
      message.error(t('spec.create.createFail'));
    }
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) {
      message.warning(t('spec.create.selectTemplateTip'));
      return;
    }
    try {
      const values = await form.validateFields();
      const result = await createFromTemplate.mutateAsync({
        templateId: selectedTemplate.id,
        data: {
          name: values.name,
          specType: values.specType,
          profileData: values.profileData,
          workspaceIds: values.workspaceIds || [],
          priority: values.priority,
          category: values.category,
          workflowId: values.workflowId,
        },
      });
      message.success(t('spec.create.createSuccess'));
      navigate(`/spec/${result.data.id}/edit`);
    } catch {
      message.error(t('spec.create.createFail'));
    }
  };

  const handleSelectTemplate = (tpl: any) => {
    setSelectedTemplate(tpl);
    setTemplateModalOpen(false);
    if (tpl.category) {
      form.setFieldValue('category', tpl.category);
    }
  };

  const handleAgentAssist = async () => {
    if (!agentAssistAgentId) { message.warning(t('spec.agentAssist.selectAgentFirst')); return; }
    if (!agentAssistDesc.trim()) { message.warning(t('spec.agentAssist.requirementRequired')); return; }
    try {
      const result = await agentAssist.mutateAsync({ agentId: agentAssistAgentId, description: agentAssistDesc });
      const generated = result.data;
      if (generated.name) form.setFieldValue('name', generated.name);
      if (generated.description) form.setFieldValue('description', generated.description);
      if (generated.category) form.setFieldValue('category', generated.category);
      if (generated.tags?.length) form.setFieldValue('tags', generated.tags);
      message.success(t('spec.agentAssist.generatedApplied'));
      setCreateMode('manual');
    } catch {
      message.error(t('spec.agentAssist.generateFailed'));
    }
  };

  return (
    <PageContainer
      title={t('spec.create.title')}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {t('common.back')}
        </Button>
      }
    >
      <div className="max-w-3xl mx-auto mt-4">
        <Card variant="borderless" className="shadow-sm rounded-xl mb-6">
          <Title level={5} className="mb-4">
            {t('spec.create.createMode')}
          </Title>
          <Radio.Group
            value={createMode}
            onChange={(e) => {
              setCreateMode(e.target.value);
              setSelectedTemplate(null);
            }}
            optionType="button"
            buttonStyle="solid"
            size="large"
          >
            <Radio.Button value="manual">
              <FileTextOutlined className="mr-2" />
              {t('spec.create.manualCreate')}
            </Radio.Button>
            <Radio.Button value="template">
              <CopyOutlined className="mr-2" />
              {t('spec.create.fromTemplate')}
            </Radio.Button>
            <Radio.Button value="agent">
              <RobotOutlined className="mr-2" />
              {t('spec.create.agentAssist')}
            </Radio.Button>
            <Radio.Button value="jira-import" disabled>
              Jira导入（预留）
            </Radio.Button>
          </Radio.Group>
          <div className="mt-3">
            <Button
              type="link"
              className="px-0"
              onClick={() => message.info('Jira 导入模式正在规划中，当前版本先保留入口。')}
            >
              Jira导入模式说明
            </Button>
          </div>

          {createMode === 'agent' && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <div className="mb-1 font-medium text-sm">{t('spec.agentAssist.selectAgent')}</div>
                  <Select
                    showSearch
                    allowClear
                    placeholder={t('spec.agentAssist.selectAgentPlaceholder')}
                    value={agentAssistAgentId}
                    onChange={setAgentAssistAgentId}
                    style={{ width: '100%' }}
                    filterOption={(input, option) =>
                      (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={(agentListData?.records ?? []).map((a: any) => ({
                      value: a.id,
                      label: a.name,
                    }))}
                  />
                </div>
                <div>
                  <div className="mb-1 font-medium text-sm">{t('spec.agentAssist.requirementDesc')}</div>
                  <Input.TextArea
                    rows={5}
                    placeholder={t('spec.agentAssist.requirementPlaceholder')}
                    value={agentAssistDesc}
                    onChange={(e) => setAgentAssistDesc(e.target.value)}
                  />
                </div>
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  loading={agentAssist.isPending}
                  onClick={handleAgentAssist}
                >
                  {t('spec.agentAssist.generate')}
                </Button>
              </Space>
            </div>
          )}

          {createMode === 'template' && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              {templateList.length === 0 && (
                <Alert
                  type="warning"
                  showIcon
                  className="mb-3"
                  message="当前没有可用模板"
                  description={
                    <Space size={4}>
                      <span>请先创建模板后再进行“从模板创建”。</span>
                      <Button type="link" className="px-0" onClick={() => navigate('/spec/templates')}>
                        去模板管理
                      </Button>
                    </Space>
                  }
                />
              )}
              {selectedTemplate ? (
                <div className="flex items-center justify-between">
                  <Space>
                    <FileTextOutlined className="text-blue-500 text-lg" />
                    <div>
                      <Text strong>{selectedTemplate.name}</Text>
                      <br />
                      <Text type="secondary" className="text-xs">{selectedTemplate.description}</Text>
                    </div>
                  </Space>
                  <Button onClick={() => setTemplateModalOpen(true)}>
                    {t('spec.create.changeTemplate')}
                  </Button>
                </div>
              ) : (
                  <Button
                    type="dashed"
                    block
                    size="large"
                    icon={<CopyOutlined />}
                    onClick={() => setTemplateModalOpen(true)}
                  >
                    {templateList.length > 0 ? t('spec.create.selectTemplate') : '暂无模板，点击查看'}
                  </Button>
              )}
            </div>
          )}
        </Card>

        {createMode !== 'agent' && (
          <Card variant="borderless" className="shadow-sm rounded-xl">
            <Form
              form={form}
              layout="vertical"
              onFinish={createMode === 'manual' ? onFinish : undefined}
              initialValues={{ priority: 'medium', specType: 'rd' }}
            >
              <Title level={5} className="mb-6">{t('spec.create.basicInfo')}</Title>

              <Form.Item
                name="specType"
                label={t('spec.type')}
                rules={[{ required: true }]}
              >
                <Select size="large">
                  <Select.Option value="rd">{t('spec.typeRd')}</Select.Option>
                  <Select.Option value="marketing">{t('spec.typeMarketing')}</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="name"
                label={t('spec.create.specName')}
                rules={[{ required: true, message: t('spec.create.specNamePlaceholder') }]}
              >
                <Input placeholder={t('spec.create.specNamePlaceholder')} size="large" />
              </Form.Item>

              <Form.Item
                name="workspaceIds"
                label={t('spec.create.workspaces')}
              >
                <Select
                  mode="multiple"
                  size="large"
                  placeholder={t('spec.create.workspacesPlaceholder')}
                  options={workspaceOptions}
                  allowClear
                  showSearch
                  listHeight={240}
                  maxTagCount="responsive"
                  filterOption={(input, opt) =>
                    (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>

              {selectedSpecType === 'marketing' ? (
                <>
                  <Alert
                    type="info"
                    showIcon
                    className="mb-4"
                    message={t('spec.marketingHint')}
                    description={t('spec.marketingHintDesc')}
                  />
                  <Form.Item
                    name={['profileData', 'productName']}
                    label={t('spec.marketing.productName')}
                    rules={[{ required: true, message: t('spec.marketing.productNamePlaceholder') }]}
                  >
                    <Input placeholder={t('spec.marketing.productNamePlaceholder')} size="large" />
                  </Form.Item>
                  <Form.Item
                    name={['profileData', 'marketRegion']}
                    label={t('spec.marketing.marketRegion')}
                    rules={[{ required: true, message: t('spec.marketing.marketRegionPlaceholder') }]}
                  >
                    <Input placeholder={t('spec.marketing.marketRegionPlaceholder')} size="large" />
                  </Form.Item>
                  <Form.Item
                    name={['profileData', 'language']}
                    label={t('spec.marketing.language')}
                    rules={[{ required: true, message: t('spec.marketing.languagePlaceholder') }]}
                  >
                    <Select
                      size="large"
                      placeholder={t('spec.marketing.languagePlaceholder')}
                      options={[
                        { label: 'English', value: 'en-US' },
                        { label: 'Tagalog', value: 'tl-PH' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item
                    name={['profileData', 'channels']}
                    label={t('spec.marketing.channels')}
                  >
                    <Select
                      mode="multiple"
                      size="large"
                      placeholder={t('spec.marketing.channelsPlaceholder')}
                      options={[
                        { label: 'Facebook Ads', value: 'facebook_ads' },
                        { label: 'Google Ads', value: 'google_ads' },
                        { label: 'SMS', value: 'sms' },
                        { label: 'Landing Page', value: 'landing_page' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item
                    name={['profileData', 'targetAudience']}
                    label={t('spec.marketing.targetAudience')}
                  >
                    <Input.TextArea rows={4} placeholder={t('spec.marketing.targetAudiencePlaceholder')} />
                  </Form.Item>
                  <Card size="small" className="mb-4" title="产物交付配置">
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <Alert
                        type="info"
                        showIcon
                        message="这里决定本次营销 Spec 最终交付到哪里"
                        description="工作流模板可提供默认值，这里的配置会作为本次 Spec 的交付覆盖项。当前支持仅写入工作空间，或直接投递为飞书文档。"
                      />
                      <Form.Item
                        name={['profileData', 'deliveryConfig', 'deliveryType']}
                        label="最终交付类型"
                        rules={[{ required: true, message: '请选择最终交付类型' }]}
                      >
                        <Select
                          size="large"
                          options={[
                            { label: '工作空间文件', value: 'workspace_file' },
                            { label: '飞书文档', value: 'feishu_doc' },
                          ]}
                        />
                      </Form.Item>
                      {selectedDeliveryType === 'feishu_doc' && (
                        <>
                          <Form.Item
                            name={['profileData', 'deliveryConfig', 'channelId']}
                            label="飞书交付渠道"
                            rules={[{ required: true, message: '请选择飞书交付渠道' }]}
                            extra={feishuChannelOptions.length === 0 ? '当前没有可用的飞书渠道，请先到渠道管理中启用一个飞书渠道。' : '最终完成通知仍由工作流通知节点决定，这里控制产物落地到哪个飞书应用渠道。'}
                          >
                            <Select
                              size="large"
                              placeholder="请选择飞书渠道"
                              options={feishuChannelOptions}
                              showSearch
                              optionFilterProp="label"
                            />
                          </Form.Item>
                          <Form.Item
                            name={['profileData', 'deliveryConfig', 'title']}
                            label="飞书文档标题"
                            extra="可选。不填时默认使用工作流节点产物标题。"
                          >
                            <Input placeholder="例如：菲律宾信贷系统营销文案包" size="large" />
                          </Form.Item>
                          <Form.Item
                            name={['profileData', 'deliveryConfig', 'folderToken']}
                            label="飞书文档目录 Token"
                            extra="可选。填写后，文档会优先创建在该文件夹下；不填则使用渠道默认目录或飞书应用默认位置。"
                          >
                            <Input placeholder="例如：fldcnxxxxxxxxxxxxxxxx" size="large" />
                          </Form.Item>
                        </>
                      )}
                    </Space>
                  </Card>
                </>
              ) : (
                <>
                  <Form.Item
                    name="jiraTicket"
                    label="Jira号"
                  >
                    <Input placeholder="例如: YXH-5000" size="large" />
                  </Form.Item>

                  <Form.Item
                    name="targetBranch"
                    label="目标分支"
                    extra="不填写时会根据 Jira 号自动生成，例如 feature/YXH-5000"
                  >
                    <Input placeholder="例如: feature/YXH-5000" size="large" />
                  </Form.Item>
                </>
              )}

              <Form.Item
                name="category"
                label={t('spec.create.category')}
                rules={[{ required: true, message: t('spec.create.categoryPlaceholder') }]}
              >
                <Select size="large" placeholder={t('spec.create.categoryPlaceholder')}>
                  {(selectedSpecType === 'marketing' ? MARKETING_CATEGORY_OPTIONS : CATEGORY_OPTIONS).map((opt: any) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {'labelKey' in opt ? t(opt.labelKey, { defaultValue: opt.defaultLabel }) : opt.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="priority"
                label={t('spec.create.priority')}
                rules={[{ required: true }]}
              >
                <Select size="large">
                  <Select.Option value="low">{t('spec.create.priorityLow')}</Select.Option>
                  <Select.Option value="medium">{t('spec.create.priorityMedium')}</Select.Option>
                  <Select.Option value="high">{t('spec.create.priorityHigh')}</Select.Option>
                  <Select.Option value="critical">{t('spec.create.priorityCritical')}</Select.Option>
                </Select>
              </Form.Item>

              {createMode === 'manual' && (
                <>
                  <Form.Item name="tags" label={t('spec.create.tags')}>
                    <Select mode="tags" size="large" placeholder={t('spec.create.tagsPlaceholder')}>
                      <Select.Option value="frontend">{t('spec.create.tagFrontend')}</Select.Option>
                      <Select.Option value="backend">{t('spec.create.tagBackend')}</Select.Option>
                      <Select.Option value="infrastructure">{t('spec.create.tagInfrastructure')}</Select.Option>
                    </Select>
                  </Form.Item>
                </>
              )}

              <Form.Item
                name="workflowId"
                label={t('spec.create.bindWorkflow')}
                rules={[{ required: true, message: '请选择关联工作流' }]}
              >
                <Select
                  size="large"
                  placeholder={t('spec.create.bindWorkflowPlaceholder')}
                  options={workflowTemplateOptions}
                />
              </Form.Item>

              <div className="mt-8 flex justify-end">
                <Space>
                  <Button size="large" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
                  {createMode === 'manual' ? (
                    <Button
                      size="large"
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={isPending}
                      disabled={!canCreate}
                    >
                      保存并进入下一步
                    </Button>
                  ) : (
                    <Button
                      size="large"
                      type="primary"
                      icon={<CopyOutlined />}
                      loading={createFromTemplate.isPending}
                      disabled={!selectedTemplate || !canCreate || templateList.length === 0}
                      onClick={handleCreateFromTemplate}
                    >
                      {t('spec.create.createFromTemplate')}
                    </Button>
                  )}
                </Space>
              </div>
            </Form>
          </Card>
        )}
      </div>

      <Modal
        title={t('spec.create.selectTemplate')}
        open={templateModalOpen}
        onCancel={() => setTemplateModalOpen(false)}
        footer={null}
        width={720}
      >
        <div className="mb-4">
          <Select
            placeholder={t('spec.create.filterByCategory')}
            allowClear
            style={{ width: 240 }}
            value={templateCategory}
            onChange={setTemplateCategory}
            options={CATEGORY_OPTIONS.map((opt) => ({
              label: t(opt.labelKey, { defaultValue: opt.defaultLabel }),
              value: opt.value,
            }))}
          />
        </div>
        {loadingTemplates ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : (
          <List
            dataSource={templateList}
            locale={{ emptyText: <Empty description={t('common.noData')} /> }}
            renderItem={(item: any) => (
              <List.Item
                className="cursor-pointer hover:bg-slate-50 rounded-lg px-3"
                onClick={() => handleSelectTemplate(item)}
              >
                <List.Item.Meta
                  avatar={<FileTextOutlined className="text-blue-500 text-xl mt-1" />}
                  title={
                    <Space>
                      <Text strong>{item.name}</Text>
                      {item.category && <Tag>{item.category}</Tag>}
                      {item.docType && <Tag color="blue">{item.docType}</Tag>}
                    </Space>
                  }
                  description={
                    <Paragraph className="mb-0 text-gray-500" ellipsis={{ rows: 2 }}>
                      {item.description || t('common.noDescription')}
                    </Paragraph>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </PageContainer>
  );
}

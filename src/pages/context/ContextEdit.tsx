import { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Space, Typography, Spin, message, Tabs } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, FileTextOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import MarkdownEditor from '@/components/MarkdownEditor/MarkdownEditor';
import { useContextDetail, useUpdateContext, useContextItems, useAddContextItem, useUpdateContextItem } from '@/api/context';
import { useAuthStore } from '@/store/useAuthStore';

const { Title, Paragraph } = Typography;

export default function ContextEdit() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams();
  const contextId = id!;
  const { hasPermission } = useAuthStore();
  const canUpdate = hasPermission('context:update');
  const [form] = Form.useForm();
  const { data: contextData, isLoading } = useContextDetail(contextId);
  const updateContextMutation = useUpdateContext();
  const [selectedLevel, setSelectedLevel] = useState<string>('project');

  // 获取已有条目列表（取第一个 document 类型条目作为主内容）
  const { data: items } = useContextItems(contextId);
  const addItemMutation = useAddContextItem();
  const updateItemMutation = useUpdateContextItem();
  const [contentValue, setContentValue] = useState('');
  const [mainItemId, setMainItemId] = useState<string | null>(null);

  // 数据加载后预填表单
  useEffect(() => {
    if (contextData) {
      form.setFieldsValue({
        name: contextData.name,
        contextLevel: contextData.contextLevel,
        projectId: contextData.projectId,
        description: contextData.description,
      });
      setSelectedLevel(contextData.contextLevel || 'project');
    }
  }, [contextData, form]);

  // 加载主内容条目
  useEffect(() => {
    if (items?.length) {
      // 优先找 document 类型条目，否则取第一个
      const mainItem = items.find((item: any) => item.itemType === 'document') || items[0];
      if (mainItem) {
        setContentValue(mainItem.content || '');
        setMainItemId(mainItem.id);
      }
    }
  }, [items]);

  const onFinish = async (values: any) => {
    try {
      // 保存基本信息
      await updateContextMutation.mutateAsync({ id: contextId, data: values });

      // 保存内容（如果有修改）
      if (contentValue) {
        if (mainItemId) {
          // 更新已有条目
          await updateItemMutation.mutateAsync({
            contextId,
            itemId: mainItemId,
            data: { content: contentValue },
          });
        } else {
          // 创建新条目
          await addItemMutation.mutateAsync({
            contextId,
            data: {
              title: contextData?.name || 'Main Content',
              itemType: 'document',
              content: contentValue,
            },
          });
        }
      }

      message.success(t('common.updateSuccess'));
      navigate(`/context/${contextId}`);
    } catch {
      message.error(t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <PageContainer title={t('context.edit.title')}>
        <div className="flex justify-center items-center py-32">
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={t('context.edit.title')}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {t('common.back')}
        </Button>
      }
    >
      <div className="mx-auto w-full max-w-6xl">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ contextLevel: 'project' }}
        >
          <Tabs
            defaultActiveKey="basic"
            items={[
              {
                key: 'basic',
                label: (
                  <span><SettingOutlined className="mr-1" />{t('context.edit.basicTab')}</span>
                ),
                children: (
                  <Card variant="borderless" className="shadow-sm rounded-xl">
                    <Title level={5} className="mb-3">{t('context.create.basicInfo')}</Title>
                    <Paragraph type="secondary" className="mb-6 max-w-3xl">
                      {t('context.edit.description')}
                    </Paragraph>
                    <div className="grid gap-5 lg:grid-cols-2">
                      <Form.Item
                        name="name"
                        label={t('context.create.contextName')}
                        rules={[{ required: true, message: t('context.create.nameRequired') }]}
                        className="mb-0"
                      >
                        <Input placeholder={t('context.create.namePlaceholder')} size="large" />
                      </Form.Item>

                      <Form.Item
                        name="contextLevel"
                        label={t('context.create.contextLevel')}
                        rules={[{ required: true }]}
                        className="mb-0"
                      >
                        <Select size="large" onChange={(val) => setSelectedLevel(val)} disabled>
                          <Select.Option value="global">{t('context.create.levelGlobalDesc')}</Select.Option>
                          <Select.Option value="project">{t('context.create.levelProjectDesc')}</Select.Option>
                          <Select.Option value="task">{t('context.create.levelTaskDesc')}</Select.Option>
                          <Select.Option value="agent">{t('context.create.levelAgentDesc')}</Select.Option>
                        </Select>
                      </Form.Item>

                      {selectedLevel !== 'global' && (
                        <Form.Item
                          name="projectId"
                          label={t('context.create.projectId')}
                          className="mb-0 lg:col-span-2"
                        >
                          <Input placeholder={t('context.create.projectIdPlaceholder')} size="large" />
                        </Form.Item>
                      )}

                      <Form.Item
                        name="description"
                        label={t('context.create.contextDesc')}
                        className="mb-0 lg:col-span-2"
                      >
                        <Input.TextArea rows={4} placeholder={t('context.create.descPlaceholder')} />
                      </Form.Item>
                    </div>
                  </Card>
                ),
              },
              {
                key: 'content',
                label: (
                  <span><FileTextOutlined className="mr-1" />{t('context.edit.contentTab')}</span>
                ),
                children: (
                  <Card variant="borderless" className="shadow-sm rounded-xl">
                    <Title level={5} className="mb-4">
                      {t('context.edit.contentTitle')}
                    </Title>
                    <Paragraph type="secondary" className="mb-4 max-w-3xl">
                      {t('context.edit.contentDesc')}
                    </Paragraph>
                    <MarkdownEditor
                      value={contentValue}
                      onChange={setContentValue}
                      placeholder={t('context.edit.contentPlaceholder')}
                      rows={18}
                      minHeight={360}
                    />
                  </Card>
                ),
              },
            ]}
          />

          <div className="mt-6 flex justify-end">
            <Space>
              <Button size="large" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
              <Button
                size="large"
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                disabled={!canUpdate}
                loading={updateContextMutation.isPending || addItemMutation.isPending || updateItemMutation.isPending}
              >
                {t('context.edit.save')}
              </Button>
            </Space>
          </div>
        </Form>
      </div>
    </PageContainer>
  );
}

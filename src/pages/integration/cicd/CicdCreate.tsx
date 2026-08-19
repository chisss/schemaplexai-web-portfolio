import { Form, Input, Select, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useCreatePipeline } from '@/api/cicd';
import type { CicdPipelineCreateDTO } from '@/types/integration';

const { TextArea } = Input;

export default function CicdCreate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const createMutation = useCreatePipeline();

  const handleSubmit = async (values: any) => {
    try {
      const dto: CicdPipelineCreateDTO = {
        ...values,
        config: values.config ? JSON.parse(values.config) : undefined,
        triggerRules: values.triggerRules ? JSON.parse(values.triggerRules) : undefined,
      };
      await createMutation.mutateAsync(dto);
      message.success(t('common.createSuccess'));
      navigate('/integration/cicd');
    } catch (e: any) {
      if (e instanceof SyntaxError) {
        message.error(t('common.jsonParseError'));
      }
    }
  };

  return (
    <PageContainer title={t('cicd.create')}>
      <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ maxWidth: 640 }}>
        <Form.Item name="name" label={t('cicd.name')} rules={[{ required: true }]}>
          <Input placeholder={t('cicd.namePlaceholder')} />
        </Form.Item>
        <Form.Item name="pipelineType" label={t('cicd.pipelineType')} rules={[{ required: true }]}>
          <Select
            placeholder={t('cicd.pipelineTypePlaceholder')}
            options={[
              { label: t('cicd.typeJenkins'), value: 'jenkins' },
              { label: t('cicd.typeGitlabCi'), value: 'gitlab_ci' },
              { label: t('cicd.typeGithubActions'), value: 'github_actions' },
            ]}
          />
        </Form.Item>
        <Form.Item name="config" label={t('cicd.config')}
          tooltip={t('cicd.configTooltip')}>
          <TextArea rows={6} placeholder='{"job_name": "my-project-build", "server_url": "https://jenkins.example.com"}' />
        </Form.Item>
        <Form.Item name="triggerRules" label={t('cicd.triggerRules')}
          tooltip={t('cicd.triggerRulesTooltip')}>
          <TextArea rows={4} placeholder='{"on_push": true, "branches": ["main", "develop"]}' />
        </Form.Item>
        <Form.Item name="description" label={t('common.description')}>
          <TextArea rows={3} placeholder={t('common.descriptionPlaceholder')} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
            {t('common.submit')}
          </Button>
          <Button className="ml-2" onClick={() => navigate('/integration/cicd')}>
            {t('common.cancel')}
          </Button>
        </Form.Item>
      </Form>
    </PageContainer>
  );
}

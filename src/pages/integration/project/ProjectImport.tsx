import { useState } from 'react';
import { Steps, Form, Input, Select, Button, Card, Space, message, Row, Col, Typography, Descriptions, Alert, Divider } from 'antd';
import { GithubOutlined, GitlabOutlined, FolderOpenOutlined, EditOutlined, CheckCircleOutlined, ApiOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer/PageContainer';
import { useCreateWorkspace } from '@/api/workspace';
import type { WorkspaceCreateDTO } from '@/types/integration';

const { Title, Paragraph, Text } = Typography;

/** 从 Git URL 提取仓库名作为工作空间名称 */
function extractRepoName(url: string): string {
  if (!url) return '';
  const cleaned = url.replace(/\.git\s*$/, '').replace(/\/+$/, '');
  const parts = cleaned.split(/[/:]/).filter(Boolean);
  return parts.at(-1) || '';
}

/** 从本地路径提取目录名作为工作空间名称 */
function extractDirName(path: string): string {
  if (!path) return '';
  const cleaned = path.replace(/[/\\]+$/, '');
  const parts = cleaned.split(/[/\\]/).filter(Boolean);
  return parts.at(-1) || '';
}

export default function ProjectImport() {
  const { t } = useTranslation();

  /** 来源类型配置（依赖 t） */
  const SOURCE_TYPES = [
    {
      value: 'github',
      icon: <GithubOutlined style={{ fontSize: 32, color: '#333' }} />,
      label: t('workspace.sourceGithubName'),
      desc: t('workspace.sourceGithubDesc'),
      platform: 'github',
    },
    {
      value: 'gitlab',
      icon: <GitlabOutlined style={{ fontSize: 32, color: '#e24329' }} />,
      label: t('workspace.sourceGitlabName'),
      desc: t('workspace.sourceGitlabDesc'),
      platform: 'gitlab',
    },
    {
      value: 'gitee',
      icon: <ApiOutlined style={{ fontSize: 32, color: '#c0392b' }} />,
      label: t('workspace.sourceGiteeName'),
      desc: t('workspace.sourceGiteeDesc'),
      platform: 'gitee',
    },
    {
      value: 'local',
      icon: <FolderOpenOutlined style={{ fontSize: 32, color: '#FF7D00' }} />,
      label: t('workspace.sourceLocal'),
      desc: t('workspace.sourceLocalDesc'),
      platform: undefined,
    },
    {
      value: 'manual',
      icon: <EditOutlined style={{ fontSize: 32, color: '#6366f1' }} />,
      label: t('workspace.sourceManual'),
      desc: t('workspace.sourceManualDesc'),
      platform: undefined,
    },
  ];
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const createMutation = useCreateWorkspace();

  const [selectedSource, setSelectedSource] = useState<string>('github');
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);

  const sourceConfig = SOURCE_TYPES.find((s) => s.value === selectedSource);
  const isGit = ['github', 'gitlab', 'gitee'].includes(selectedSource);
  // 仅手动创建模式必须输入名称，git/local 可从 URL/路径自动推导
  const needManualName = selectedSource === 'manual';

  /** 验证凭证（模拟验证） */
  const handleValidateCredential = async () => {
    try {
      await form.validateFields(['gitUrl']);
      setValidating(true);
      await new Promise((r) => setTimeout(r, 1000));
      setValidated(true);
      message.success(t('workspace.credentialValid'));
    } catch {
      // 校验失败
    } finally {
      setValidating(false);
    }
  };

  /** 根据来源类型自动推导工作空间名称
   *  注意：使用 getFieldsValue(true) 获取所有字段值，包含已卸载的字段（如 Step1 切换到 Step2 后 gitUrl 等字段已卸载）
   */
  const deriveWorkspaceName = (): string => {
    const values = form.getFieldsValue(true);
    if (values.name) return values.name;
    if (isGit && values.gitUrl) return extractRepoName(values.gitUrl);
    if (selectedSource === 'local' && values.localPath) return extractDirName(values.localPath);
    return '';
  };

  const handleSubmit = async () => {
    try {
      // 使用 getFieldsValue(true) 获取所有字段值（包含已卸载的 Step1/Step2 字段）
      const values = form.getFieldsValue(true);
      // 自动推导名称：优先使用用户输入，否则从 URL/路径推导
      const workspaceName = values.name || deriveWorkspaceName();
      if (!workspaceName) {
        message.error(t('workspace.nameRequired'));
        return;
      }
      // local 类型必须有路径
      if (selectedSource === 'local' && !values.localPath) {
        message.error(t('workspace.localPathRequired'));
        return;
      }
      // git 类型必须有仓库地址
      if (isGit && !values.gitUrl) {
        message.error(t('workspace.gitUrlRequired'));
        return;
      }
      const dto: WorkspaceCreateDTO = {
        name: workspaceName,
        sourceType: isGit ? 'git' : selectedSource,
        description: values.description,
      };
      if (isGit) {
        dto.gitUrl = values.gitUrl;
        dto.gitPlatform = sourceConfig?.platform;
        dto.defaultBranch = values.defaultBranch || 'main';
        if (values.credentialType === 'token' && values.token) {
          dto.gitCredential = { type: 'token', token: values.token };
        }
      } else if (selectedSource === 'local') {
        dto.localPath = values.localPath;
      }
      await createMutation.mutateAsync(dto);
      message.success(t('common.createSuccess'));
      navigate('/project/workspaces');
    } catch (e: any) {
      if (e?.errorFields) return;
    }
  };

  const handleNext = async () => {
    if (current === 0) {
      // 仅手动创建模式在第一步校验名称
      if (needManualName) {
        await form.validateFields(['name']);
      }
    } else if (current === 1) {
      if (isGit) {
        await form.validateFields(['gitUrl']);
        // Git 模式下自动推导名称
        if (!form.getFieldValue('name')) {
          const derived = extractRepoName(form.getFieldValue('gitUrl'));
          if (derived) form.setFieldValue('name', derived);
        }
      } else if (selectedSource === 'local') {
        await form.validateFields(['localPath']);
        // 本地路径模式下自动推导名称
        if (!form.getFieldValue('name')) {
          const derived = extractDirName(form.getFieldValue('localPath'));
          if (derived) form.setFieldValue('name', derived);
        }
      }
    }
    setCurrent((c) => c + 1);
  };

  const steps = [
    {
      title: t('workspace.stepSource'),
      icon: <FolderOpenOutlined />,
    },
    {
      title: t('workspace.stepConfig'),
      icon: <EditOutlined />,
    },
    {
      title: t('workspace.stepConfirm'),
      icon: <CheckCircleOutlined />,
    },
  ];

  return (
    <PageContainer title={t('workspace.import')}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Steps current={current} items={steps} className="mb-8" />

        <Form form={form} layout="vertical">
          {/* Step 0：选择来源 */}
          {current === 0 && (
            <Card variant="borderless" className="shadow-sm rounded-xl">
              <Title level={5} className="mb-2">
                {t('workspace.chooseSource')}
              </Title>
              <Paragraph type="secondary" className="mb-6">
                {t('workspace.chooseSourceDesc')}
              </Paragraph>
              <Row gutter={[12, 12]}>
                {SOURCE_TYPES.map((src) => (
                  <Col key={src.value} xs={24} sm={12} md={8}>
                    <Card
                      hoverable
                      className="text-center cursor-pointer"
                      style={{
                        borderRadius: 10,
                        border: selectedSource === src.value ? '2px solid #6366f1' : '1px solid #e2e8f0',
                        background: selectedSource === src.value ? '#f5f3ff' : '#fff',
                        boxShadow: selectedSource === src.value ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                        transition: 'all 0.2s',
                        position: 'relative' as const,
                      }}
                      styles={{ body: { padding: '20px 12px' } }}
                      onClick={() => {
                        setSelectedSource(src.value);
                        setValidated(false);
                      }}
                    >
                      {selectedSource === src.value && (
                        <CheckCircleOutlined
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: '#6366f1',
                            fontSize: 18,
                          }}
                        />
                      )}
                      <div className="mb-3">{src.icon}</div>
                      <Text strong style={{ fontSize: 14 }}>{src.label}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{src.desc}</Text>
                    </Card>
                  </Col>
                ))}
              </Row>

              <Divider />

              {/* 仅手动创建模式必填名称，其他模式可选（后续自动推导） */}
              {needManualName ? (
                <Form.Item
                  name="name"
                  label={t('workspace.name')}
                  rules={[{ required: true, message: t('workspace.namePlaceholder') }]}
                >
                  <Input
                    size="large"
                    placeholder={t('workspace.namePlaceholder')}
                  />
                </Form.Item>
              ) : (
                <Form.Item
                  name="name"
                  label={t('workspace.name')}
                  extra={t('workspace.nameAutoHint')}
                >
                  <Input
                    size="large"
                    placeholder={t('workspace.nameAutoPlaceholder')}
                  />
                </Form.Item>
              )}
            </Card>
          )}

          {/* Step 1：配置信息 */}
          {current === 1 && (
            <Card variant="borderless" className="shadow-sm rounded-xl">
              <Title level={5} className="mb-6">
                {t('workspace.configDetail')}
                {sourceConfig && (
                  <span className="ml-2 text-base font-normal text-gray-500">
                    — {sourceConfig.label}
                  </span>
                )}
              </Title>

              {isGit && (
                <>
                  <Form.Item
                    name="gitUrl"
                    label={t('workspace.gitUrl')}
                    rules={[{ required: true, message: t('workspace.gitUrlRequired') }]}
                  >
                    <Input
                      size="large"
                      placeholder={`https://${sourceConfig?.value || 'github'}.com/org/repo.git`}
                      onChange={(e) => {
                        if (!form.getFieldValue('name')) {
                          const derived = extractRepoName(e.target.value);
                          if (derived) form.setFieldValue('name', derived);
                        }
                      }}
                      addonAfter={
                        <Button
                          type="link"
                          size="small"
                          loading={validating}
                          onClick={handleValidateCredential}
                          style={{ color: validated ? '#22c55e' : '#6366f1', padding: '0 4px' }}
                        >
                          {validated
                            ? t('workspace.validated')
                            : t('workspace.validate')}
                        </Button>
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    name="defaultBranch"
                    label={t('workspace.defaultBranch')}
                  >
                    <Select
                      size="large"
                      placeholder={t('workspace.defaultBranchPlaceholder')}
                      allowClear
                      showSearch
                      options={[
                        { label: 'main', value: 'main' },
                        { label: 'master', value: 'master' },
                        { label: 'develop', value: 'develop' },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item
                    name="credentialType"
                    label={t('workspace.credentialType')}
                  >
                    <Select
                      size="large"
                      placeholder={t('workspace.credentialTypePlaceholder')}
                      allowClear
                      options={[
                        { label: t('workspace.credentialToken'), value: 'token' },
                        { label: t('workspace.credentialSshKey'), value: 'ssh' },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, cur) => prev.credentialType !== cur.credentialType}
                  >
                    {({ getFieldValue }) =>
                      getFieldValue('credentialType') === 'token' && (
                        <Form.Item
                          name="token"
                          label={t('workspace.token')}
                          extra={t('workspace.tokenHint')}
                        >
                          <Input.Password
                            size="large"
                            placeholder={t('workspace.tokenPlaceholder')}
                          />
                        </Form.Item>
                      )
                    }
                  </Form.Item>
                </>
              )}

              {selectedSource === 'local' && (
                <Form.Item
                  name="localPath"
                  label={t('workspace.localPath')}
                  rules={[
                    { required: true, message: t('workspace.localPathRequired') },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        // 校验是否为绝对路径（Unix: / 开头；Windows: X:\ 或 X:/ 开头）
                        const isAbsolute = /^\//.test(value) || /^[A-Za-z]:[/\\]/.test(value);
                        if (!isAbsolute) {
                          return Promise.reject(new Error(t('workspace.localPathAbsoluteRequired')));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                  extra={t('workspace.localPathHint')}
                >
                  <Input
                    size="large"
                    placeholder="/data/projects/my-project"
                    onChange={(e) => {
                      if (!form.getFieldValue('name')) {
                        const derived = extractDirName(e.target.value);
                        if (derived) form.setFieldValue('name', derived);
                      }
                    }}
                    addonAfter={
                      <Button
                        type="text"
                        icon={<FolderOpenOutlined />}
                        style={{ padding: '0 4px', color: '#FF7D00' }}
                        title={t('workspace.localPathPickerTip')}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          // @ts-ignore: webkitdirectory 用于选择目录
                          input.webkitdirectory = true;
                          input.onchange = (e: any) => {
                            const files = e.target?.files;
                            if (!files?.length) return;
                            // 浏览器只能获取相对目录名，无法获取服务器绝对路径
                            const dirName = (files[0].webkitRelativePath || files[0].name).split('/')[0];
                            // 保留已有前缀，仅替换末段目录名，避免丢失用户已输入的路径前缀
                            const current = form.getFieldValue('localPath') as string | undefined;
                            let newPath: string;
                            if (current && (/^\//.test(current) || /^[A-Za-z]:[/\\]/.test(current))) {
                              // 已有绝对路径：替换最后一段
                              const idx = Math.max(current.lastIndexOf('/'), current.lastIndexOf('\\'));
                              newPath = idx > 0 ? `${current.slice(0, idx + 1)}${dirName}` : `/${dirName}`;
                            } else {
                              // 尚未填写路径：仅填入目录名，让校验提示用户补全前缀
                              newPath = dirName;
                            }
                            form.setFieldValue('localPath', newPath);
                            // 同步推导工作空间名称
                            if (!form.getFieldValue('name')) {
                              form.setFieldValue('name', dirName);
                            }
                            // 触发校验，让用户看到是否需要补全绝对路径
                            form.validateFields(['localPath']).catch(() => {});
                            message.info(
                              t('workspace.localPathPickerInfo', {
                                dirName,
                              }),
                            );
                          };
                          input.click();
                        }}
                      />
                    }
                  />
                </Form.Item>
              )}

              {selectedSource === 'manual' && (
                <Alert
                  type="info"
                  showIcon
                  message={t('workspace.manualHint')}
                  className="mb-4"
                />
              )}
            </Card>
          )}

          {/* Step 2：确认导入 */}
          {current === 2 && (
            <Card variant="borderless" className="shadow-sm rounded-xl">
              <Title level={5} className="mb-6">
                {t('workspace.confirmImport')}
              </Title>

              <Descriptions
                bordered
                column={1}
                size="middle"
                labelStyle={{ width: 140, fontWeight: 500 }}
              >
                <Descriptions.Item label={t('workspace.name')}>
                  <Text strong>{form.getFieldValue('name') || deriveWorkspaceName()}</Text>
                </Descriptions.Item>
                <Descriptions.Item label={t('workspace.sourceType')}>
                  <Space>
                    {sourceConfig?.icon && (
                      <span style={{ fontSize: 16 }}>{sourceConfig.icon}</span>
                    )}
                    {sourceConfig?.label}
                  </Space>
                </Descriptions.Item>
                {isGit && (
                  <>
                    <Descriptions.Item label={t('workspace.gitUrl')}>
                      <Text code style={{ wordBreak: 'break-all' }}>{form.getFieldValue('gitUrl')}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('workspace.defaultBranch')}>
                      {form.getFieldValue('defaultBranch') || 'main'}
                    </Descriptions.Item>
                  </>
                )}
                {selectedSource === 'local' && (
                  <Descriptions.Item label={t('workspace.localPath')}>
                    <Text code>{form.getFieldValue('localPath')}</Text>
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Form.Item name="description" label={t('common.description')} className="mt-6">
                <Input.TextArea rows={3} placeholder={t('common.descriptionPlaceholder')} />
              </Form.Item>

              {validated && (
                <Alert
                  type="success"
                  showIcon
                  message={t('workspace.readyToImport')}
                />
              )}
            </Card>
          )}

          {/* 导航按钮 */}
          <div className="flex justify-between mt-6">
            <Space>
              {current > 0 && (
                <Button size="large" onClick={() => setCurrent((c) => c - 1)}>
                  {t('common.prev')}
                </Button>
              )}
              <Button size="large" onClick={() => navigate('/integration/project')}>
                {t('common.cancel')}
              </Button>
            </Space>
            <Space>
              {current < steps.length - 1 && (
                <Button type="primary" size="large" onClick={handleNext}>
                  {t('common.next')}
                </Button>
              )}
              {current === steps.length - 1 && (
                <Button
                  type="primary"
                  size="large"
                  onClick={handleSubmit}
                  loading={createMutation.isPending}
                  icon={<CheckCircleOutlined />}
                >
                  {t('common.submit')}
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </div>
    </PageContainer>
  );
}

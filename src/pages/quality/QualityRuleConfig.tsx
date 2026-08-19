import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  App as AntApp,
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Slider,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
  Tooltip,
} from 'antd';
import { DeleteOutlined, PlusOutlined, QuestionCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { useAgentList } from '@/api/agent';
import { useWorkflowTemplates } from '@/api/workflow';
import { useSpecList } from '@/api/spec';
import { useAiModels } from '@/api/system';
import {
  useCreateQualityProfile,
  useDeleteQualityProfile,
  useQualityProfiles,
  useUpdateQualityProfile,
} from '@/api/quality';
import type {
  QualityProfileBinding,
  QualityProfileConfig,
  QualityProfileConfigCreateDTO,
  QualityThresholdConfig,
  QualityThresholdDimensionConfig,
} from '@/types/quality';
import PageContainer from '@/components/PageContainer/PageContainer';

const { Text, Paragraph } = Typography;

type DimensionKey = 'ambiguity' | 'contradiction' | 'omission' | 'vagueness';

const DEFAULT_DIMENSION_CONFIG: QualityThresholdDimensionConfig = {
  enabled: true,
  strictness: 70,
  confidenceThreshold: 70,
  maxFindings: 8,
  focusKeywords: [],
  blockOnCritical: true,
};

const DEFAULT_THRESHOLD_CONFIG: QualityThresholdConfig = {
  ambiguity: { ...DEFAULT_DIMENSION_CONFIG },
  contradiction: { ...DEFAULT_DIMENSION_CONFIG },
  omission: { ...DEFAULT_DIMENSION_CONFIG, strictness: 80, confidenceThreshold: 75 },
  vagueness: { ...DEFAULT_DIMENSION_CONFIG, strictness: 65, confidenceThreshold: 60, maxFindings: 12 },
};

const DEFAULT_DRAFT: QualityProfileConfigCreateDTO = {
  code: '',
  name: '',
  issueType: 'both',
  description: '',
  triggerModes: ['workflow', 'manual'],
  enabledDimensionCodes: ['ambiguity', 'contradiction', 'omission', 'vagueness'],
  enabledRuleCodes: [],
  thresholdConfig: DEFAULT_THRESHOLD_CONFIG,
  status: 'active',
  isDefault: false,
  modelIds: [],
  bindings: [],
};

function cloneDefaultDraft(): QualityProfileConfigCreateDTO {
  return JSON.parse(JSON.stringify(DEFAULT_DRAFT));
}

function getDimConfig(thresholdConfig: QualityProfileConfigCreateDTO['thresholdConfig'], key: DimensionKey): QualityThresholdDimensionConfig {
  const value = (thresholdConfig || {})[key];
  return {
    ...DEFAULT_DIMENSION_CONFIG,
    ...(value || {}),
  };
}

interface QualityRuleConfigProps {
  embedded?: boolean;
}

function mapProfileToDraft(profile: QualityProfileConfig): QualityProfileConfigCreateDTO {
  return {
    code: profile.code,
    name: profile.name,
    issueType: profile.issueType || 'both',
    description: profile.description || '',
    triggerModes: profile.triggerModes || [],
    enabledDimensionCodes: profile.enabledDimensionCodes || [],
    enabledRuleCodes: profile.enabledRuleCodes || [],
    thresholdConfig: profile.thresholdConfig || DEFAULT_THRESHOLD_CONFIG,
    status: profile.status || 'active',
    isDefault: !!profile.isDefault,
    modelIds: profile.modelIds || [],
    bindings: (profile.bindings || []).map((binding: QualityProfileBinding) => ({
      bindingType: binding.bindingType,
      bindingId: binding.bindingId,
    })),
  };
}

export default function QualityRuleConfig({ embedded = false }: QualityRuleConfigProps) {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const [selectedProfileId, setSelectedProfileId] = useState<string>();
  const [draft, setDraft] = useState<QualityProfileConfigCreateDTO>(cloneDefaultDraft());
  const [activeTab, setActiveTab] = useState<DimensionKey>('ambiguity');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  const { data: profileList, isLoading } = useQualityProfiles();
  const { data: modelList } = useAiModels();
  const { data: agentPage } = useAgentList({ page: 1, size: 200 });
  const { data: workflowPage } = useWorkflowTemplates({ page: 1, size: 200 });
  const { data: specPage } = useSpecList({ page: 1, size: 200 });
  const createMutation = useCreateQualityProfile();
  const updateMutation = useUpdateQualityProfile();
  const deleteMutation = useDeleteQualityProfile();

  const modelOptions = useMemo(() => (modelList || []).map((item) => ({ value: item.id, label: item.name })), [modelList]);
  const agentOptions = useMemo(() => (agentPage?.records || []).map((item) => ({ value: item.id, label: item.name })), [agentPage?.records]);
  const workflowOptions = useMemo(() => (workflowPage?.records || []).map((item) => ({ value: item.id, label: item.name })), [workflowPage?.records]);
  const specOptions = useMemo(() => (specPage?.records || []).map((item) => ({ value: item.id, label: item.name })), [specPage?.records]);

  const dimensionTitles = useMemo<Record<DimensionKey, string>>(() => ({
    ambiguity: t('quality.ruleConfig.dimensionAmbiguity'),
    contradiction: t('quality.ruleConfig.dimensionContradiction'),
    omission: t('quality.ruleConfig.dimensionOmission'),
    vagueness: t('quality.ruleConfig.dimensionVagueness'),
  }), [t]);

  const keywordOptions = useMemo(() => [
    { label: t('quality.ruleConfig.keywordAcceptanceCriteria'), value: '验收标准' },
    { label: t('quality.ruleConfig.keywordBoundaryCondition'), value: '边界条件' },
    { label: t('quality.ruleConfig.keywordExceptionHandling'), value: '异常处理' },
    { label: t('quality.ruleConfig.keywordAccessControl'), value: '权限控制' },
    { label: t('quality.ruleConfig.keywordIdempotency'), value: '幂等性' },
    { label: t('quality.ruleConfig.keywordRollbackStrategy'), value: '回滚策略' },
    { label: t('quality.ruleConfig.keywordDataConsistency'), value: '数据一致性' },
    { label: t('quality.ruleConfig.keywordMonitoringAlert'), value: '监控告警' },
  ], [t]);

  const bindingIds = useMemo(() => {
    const values = {
      agent: [] as string[],
      workflow: [] as string[],
      spec: [] as string[],
    };
    (draft.bindings || []).forEach((binding) => {
      const type = binding.bindingType;
      if (type === 'agent' || type === 'workflow' || type === 'spec') {
        values[type].push(binding.bindingId);
      }
    });
    return values;
  }, [draft.bindings]);

  const selectProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    const profile = (profileList || []).find((item) => item.id === profileId);
    if (!profile) {
      return;
    }
    setDraft(mapProfileToDraft(profile));
  };

  const updateDimensionConfig = (key: DimensionKey, patch: Partial<QualityThresholdDimensionConfig>) => {
    const current = getDimConfig(draft.thresholdConfig, key);
    setDraft((prev) => ({
      ...prev,
      thresholdConfig: {
        ...(prev.thresholdConfig || {}),
        [key]: {
          ...current,
          ...patch,
        },
      },
    }));
  };

  const updateBinding = (bindingType: 'agent' | 'workflow' | 'spec', ids: string[]) => {
    setDraft((prev) => {
      const retained = (prev.bindings || []).filter((item) => item.bindingType !== bindingType);
      const appended: QualityProfileBinding[] = ids.map((id) => ({ bindingType, bindingId: id }));
      return {
        ...prev,
        bindings: [...retained, ...appended],
      };
    });
  };

  const saveProfile = () => {
    if (!draft.code.trim() || !draft.name.trim()) {
      message.warning(t('quality.ruleConfig.pleaseEnterCodeAndName'));
      return;
    }
    if ((draft.modelIds || []).length < 1 || (draft.modelIds || []).length > 2) {
      message.warning(t('quality.ruleConfig.pleaseSelectModels'));
      return;
    }
    const normalizedThreshold: Record<string, QualityThresholdDimensionConfig> = {
      ambiguity: getDimConfig(draft.thresholdConfig, 'ambiguity'),
      contradiction: getDimConfig(draft.thresholdConfig, 'contradiction'),
      omission: getDimConfig(draft.thresholdConfig, 'omission'),
      vagueness: getDimConfig(draft.thresholdConfig, 'vagueness'),
    };
    const enabledDimensionCodes = (Object.keys(normalizedThreshold) as DimensionKey[]).filter((key) => normalizedThreshold[key].enabled);
    const payload: QualityProfileConfigCreateDTO = {
      ...draft,
      code: draft.code.trim(),
      name: draft.name.trim(),
      modelIds: Array.from(new Set(draft.modelIds || [])).slice(0, 2),
      enabledDimensionCodes,
      thresholdConfig: normalizedThreshold,
      bindings: (draft.bindings || []).filter((item) => item.bindingType && item.bindingId),
    };

    if (selectedProfileId) {
      updateMutation.mutate(
        { id: selectedProfileId, data: payload },
        { onSuccess: () => message.success(t('quality.ruleConfig.profileUpdated')) },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (res) => {
        message.success(t('quality.ruleConfig.profileCreated'));
        if (res?.data?.id) {
          setSelectedProfileId(res.data.id);
        }
      },
    });
  };

  const removeProfile = () => {
    if (!selectedProfileId) {
      return;
    }
    Modal.confirm({
      title: t('quality.ruleConfig.confirmDelete'),
      onOk: () => deleteMutation.mutate(selectedProfileId, {
        onSuccess: () => {
          message.success(t('quality.ruleConfig.profileDeleted'));
          setSelectedProfileId(undefined);
          setDraft(cloneDefaultDraft());
        },
      }),
    });
  };

  const activeDimensionConfig = getDimConfig(draft.thresholdConfig, activeTab);
  const crossReviewEnabled = (draft.modelIds || []).length === 2;

  const toggleProfileStatus = (profile: QualityProfileConfig, status: 'active' | 'inactive') => {
    updateMutation.mutate(
      {
        id: profile.id,
        data: {
          ...mapProfileToDraft(profile),
          status,
        },
      },
      {
        onSuccess: () => {
          message.success(status === 'active' ? '配置组已生效' : '配置组已失效');
          if (selectedProfileId === profile.id) {
            setDraft((prev) => ({ ...prev, status }));
          }
        },
      },
    );
  };

  const renderLabelWithTip = (label: string, tip: string) => (
    <Space size={4}>
      <span>{label}</span>
      <Tooltip title={tip}>
        <QuestionCircleOutlined style={{ color: 'var(--color-text-secondary)' }} />
      </Tooltip>
    </Space>
  );

  const content = (
    <Row gutter={16}>
      <Col xs={24} lg={8}>
        <Card
          variant="borderless"
          className="shadow-sm"
          title={t('quality.ruleConfig.profileListTitle')}
          loading={isLoading}
          extra={(
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
            >
              {t('quality.ruleConfig.createButton')}
            </Button>
          )}
        >
          {(profileList || []).length === 0 ? (
            <Empty description={t('quality.ruleConfig.emptyProfiles')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(profileList || []).map((item) => (
                <div
                  key={item.id}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginBottom: 8,
                    border: item.id === selectedProfileId ? '1px solid #165DFF' : '1px solid var(--color-border)',
                  }}
                  onClick={() => selectProfile(item.id)}
                >
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <Space wrap>
                        <Text strong>{item.name}</Text>
                        {item.isDefault && <Tag color="gold">{t('quality.ruleConfig.defaultTag')}</Tag>}
                        <Tag color={item.status === 'active' ? 'green' : 'default'}>{item.status || 'active'}</Tag>
                      </Space>
                      <Space size="small">
                        {item.status === 'inactive' ? (
                          <Button
                            size="small"
                            type="primary"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleProfileStatus(item, 'active');
                            }}
                          >
                            生效
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            danger
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleProfileStatus(item, 'inactive');
                            }}
                          >
                            失效
                          </Button>
                        )}
                        <Popconfirm
                          title="确认删除该配置组？"
                          onConfirm={(event) => {
                            event?.stopPropagation();
                            if (item.id === selectedProfileId) {
                              removeProfile();
                              return;
                            }
                            deleteMutation.mutate(item.id, {
                              onSuccess: () => {
                                message.success(t('quality.ruleConfig.profileDeleted'));
                              },
                            });
                          }}
                        >
                          <Button
                            size="small"
                            danger
                            onClick={(event) => event.stopPropagation()}
                          >
                            删除
                          </Button>
                        </Popconfirm>
                      </Space>
                    </div>
                    <Paragraph style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)' }}>
                      {item.code}
                    </Paragraph>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Col>

      <Col xs={24} lg={16}>
        <Card
          variant="borderless"
          className="shadow-sm"
          title={t('quality.ruleConfig.ruleConfigTitle')}
          extra={(
            <Space>
              <Button
                onClick={() => {
                  setSelectedProfileId(undefined);
                  setDraft(cloneDefaultDraft());
                }}
              >
                {t('quality.ruleConfig.clearButton')}
              </Button>
              <Button icon={<DeleteOutlined />} danger disabled={!selectedProfileId} onClick={removeProfile}>
                {t('quality.ruleConfig.deleteButton')}
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={createMutation.isPending || updateMutation.isPending}
                onClick={saveProfile}
              >
                {t('quality.ruleConfig.saveButton')}
              </Button>
            </Space>
          )}
        >
          <Alert
            className="mb-4"
            type={crossReviewEnabled ? 'success' : 'info'}
            showIcon
            title={crossReviewEnabled ? t('quality.ruleConfig.crossReviewEnabled') : t('quality.ruleConfig.crossReviewDisabled')}
            description={crossReviewEnabled
              ? t('quality.ruleConfig.crossReviewEnabledDesc')
              : t('quality.ruleConfig.crossReviewDisabledDesc')}
          />
          <Form layout="vertical">
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item label={t('quality.ruleConfig.labelCode')}>
                  <Input value={draft.code} onChange={(e) => setDraft((prev) => ({ ...prev, code: e.target.value }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={t('quality.ruleConfig.labelName')}>
                  <Input value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item label={t('quality.ruleConfig.labelIssueType')}>
                  <Select
                    value={draft.issueType}
                    onChange={(value) => setDraft((prev) => ({ ...prev, issueType: value }))}
                    options={[
                      { label: t('quality.ruleConfig.issueTypeBoth'), value: 'both' },
                      { label: t('quality.ruleConfig.issueTypeDeviation'), value: 'deviation' },
                      { label: t('quality.ruleConfig.issueTypeIntentDefect'), value: 'intent_defect' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={t('quality.ruleConfig.labelStatus')}>
                  <Select
                    value={draft.status}
                    onChange={(value) => setDraft((prev) => ({ ...prev, status: value }))}
                    options={[
                      { label: t('quality.ruleConfig.statusActive'), value: 'active' },
                      { label: t('quality.ruleConfig.statusInactive'), value: 'inactive' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label={t('quality.ruleConfig.labelDescription')}>
              <Input.TextArea rows={2} value={draft.description} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} />
            </Form.Item>

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item label={t('quality.ruleConfig.labelTriggerModes')}>
                  <Select
                    mode="multiple"
                    value={draft.triggerModes}
                    onChange={(value) => setDraft((prev) => ({ ...prev, triggerModes: value }))}
                    options={[
                      { label: t('quality.ruleConfig.triggerWorkflow'), value: 'workflow' },
                      { label: t('quality.ruleConfig.triggerManual'), value: 'manual' },
                      { label: t('quality.ruleConfig.triggerSystem'), value: 'system' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={t('quality.ruleConfig.labelModels')}>
                  <Select
                    mode="multiple"
                    maxCount={2}
                    value={draft.modelIds}
                    onChange={(value) => setDraft((prev) => ({ ...prev, modelIds: value }))}
                    options={modelOptions}
                    placeholder={t('quality.ruleConfig.modelsPlaceholder')}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Form.Item label={renderLabelWithTip(t('quality.ruleConfig.labelBindAgent'), t('quality.ruleConfig.tipBindAgent'))}>
                  <Select
                    mode="multiple"
                    allowClear
                    value={bindingIds.agent}
                    onChange={(value) => updateBinding('agent', value)}
                    options={agentOptions}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label={renderLabelWithTip(t('quality.ruleConfig.labelBindWorkflow'), t('quality.ruleConfig.tipBindWorkflow'))}>
                  <Select
                    mode="multiple"
                    allowClear
                    value={bindingIds.workflow}
                    onChange={(value) => updateBinding('workflow', value)}
                    options={workflowOptions}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label={renderLabelWithTip(t('quality.ruleConfig.labelBindSpec'), t('quality.ruleConfig.tipBindSpec'))}>
                  <Select
                    mode="multiple"
                    allowClear
                    value={bindingIds.spec}
                    onChange={(value) => updateBinding('spec', value)}
                    options={specOptions}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <Card size="small" style={{ marginTop: 8 }}>
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as DimensionKey)}
              items={(Object.keys(dimensionTitles) as DimensionKey[]).map((key) => ({
                key,
                label: dimensionTitles[key],
              }))}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Space>
                <Text>{t('quality.ruleConfig.enableDetection')}</Text>
                <Switch
                  checked={activeDimensionConfig.enabled}
                  onChange={(value) => updateDimensionConfig(activeTab, { enabled: value })}
                />
                <Text>{t('quality.ruleConfig.blockCriticalIssues')}</Text>
                <Switch
                  checked={activeDimensionConfig.blockOnCritical}
                  onChange={(value) => updateDimensionConfig(activeTab, { blockOnCritical: value })}
                />
              </Space>

              <div>
                <Text type="secondary">{t('quality.ruleConfig.strictnessLabel')}{activeDimensionConfig.strictness}</Text>
                <Slider
                  min={0}
                  max={100}
                  value={activeDimensionConfig.strictness}
                  onChange={(value) => updateDimensionConfig(activeTab, { strictness: Number(value) })}
                />
              </div>

              <div>
                <Text type="secondary">{t('quality.ruleConfig.confidenceLabel')}{activeDimensionConfig.confidenceThreshold}</Text>
                <Slider
                  min={0}
                  max={100}
                  value={activeDimensionConfig.confidenceThreshold}
                  onChange={(value) => updateDimensionConfig(activeTab, { confidenceThreshold: Number(value) })}
                />
              </div>

              <Form layout="inline">
                <Form.Item label={t('quality.ruleConfig.maxFindingsLabel')}>
                  <InputNumber
                    min={1}
                    max={50}
                    value={activeDimensionConfig.maxFindings}
                    onChange={(value) => updateDimensionConfig(activeTab, { maxFindings: Number(value || 1) })}
                  />
                </Form.Item>
              </Form>

              <div>
                <Text type="secondary">{t('quality.ruleConfig.focusKeywordsLabel')}</Text>
                <Select
                  mode="tags"
                  style={{ width: '100%', marginTop: 8 }}
                  value={activeDimensionConfig.focusKeywords || []}
                  onChange={(value) => updateDimensionConfig(activeTab, { focusKeywords: value })}
                  options={keywordOptions}
                  placeholder={t('quality.ruleConfig.focusKeywordsPlaceholder')}
                />
                <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>
                  {t('quality.ruleConfig.focusKeywordsHint')}
                </Paragraph>
              </div>

              <div>
                <Text type="secondary">{t('quality.ruleConfig.evaluationPromptLabel')}</Text>
                <Input.TextArea
                  rows={4}
                  style={{ marginTop: 8 }}
                  value={activeDimensionConfig.evaluationPrompt || ''}
                  onChange={(e) => updateDimensionConfig(activeTab, { evaluationPrompt: e.target.value })}
                  placeholder={t('quality.ruleConfig.evaluationPromptPlaceholder')}
                />
                <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>
                  {t('quality.ruleConfig.evaluationPromptHint')}
                </Paragraph>
              </div>
            </div>
          </Card>
        </Card>
      </Col>

      <Modal
        title={t('quality.ruleConfig.createModalTitle')}
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => {
          const name = newProfileName.trim();
          if (!name) {
            message.warning(t('quality.ruleConfig.pleaseEnterProfileName'));
            return;
          }
          const code = `qcfg_${Date.now()}`;
          setSelectedProfileId(undefined);
          setDraft({
            ...cloneDefaultDraft(),
            name,
            code,
          });
          setCreateModalOpen(false);
          setNewProfileName('');
        }}
      >
        <Input value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} placeholder={t('quality.ruleConfig.createModalPlaceholder')} />
      </Modal>
    </Row>
  );

  if (embedded) {
    return content;
  }

  return (
    <PageContainer title={t('quality.ruleConfig.pageTitle')}>
      {content}
    </PageContainer>
  );
}

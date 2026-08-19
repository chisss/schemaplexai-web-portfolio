/**
 * 租户行业配置向导
 * 多步骤：选择行业 → 选择场景 → 确认 → 初始化中 → 完成
 */
import { useState } from 'react';
import {
  Button, Card, Checkbox, Divider, Modal, Radio, Result,
  Space, Spin, Steps, Tag, Typography, message,
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined,
  LoadingOutlined, RocketOutlined,
} from '@ant-design/icons';
import {
  useUpdateTenantProfile, useInitTenantTemplate, useTenantInitStatus,
} from '@/api/system';
import { useTranslation } from 'react-i18next';
import type { Tenant } from '@/types/system';

const { Text, Title } = Typography;

interface Props {
  tenant: Tenant;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const INDUSTRIES = [
  { value: 'tech', label: '科技/研发', description: '代码审查、需求分析、技术文档、测试规划' },
  { value: 'finance', label: '金融/合规', description: '合规审查、风险评估、监管报告、反洗钱' },
  { value: 'retail', label: '零售/电商', description: '营销文案、客服机器人、商品描述优化' },
  { value: 'healthcare', label: '医疗/健康', description: '病历质控、临床文书、医学记录分析' },
  { value: 'manufacturing', label: '制造/工业', description: '质量检测、设备诊断、工艺优化' },
];

const SCENARIOS_BY_INDUSTRY: Record<string, Array<{ value: string; label: string }>> = {
  tech: [
    { value: 'code_review', label: '代码审查' },
    { value: 'requirements_analysis', label: '需求分析' },
    { value: 'doc_generation', label: '文档生成' },
    { value: 'test_planning', label: '测试规划' },
  ],
  finance: [
    { value: 'compliance_review', label: '合规审查' },
    { value: 'risk_assessment', label: '风险评估' },
    { value: 'regulatory_report', label: '监管报告' },
  ],
  retail: [
    { value: 'marketing_copy', label: '营销文案' },
    { value: 'customer_service', label: '客服支持' },
    { value: 'product_description', label: '商品描述' },
  ],
  healthcare: [
    { value: 'medical_record_qc', label: '病历质控' },
    { value: 'clinical_documentation', label: '临床文书' },
  ],
  manufacturing: [
    { value: 'quality_inspection', label: '质量检测' },
    { value: 'equipment_diagnostics', label: '设备诊断' },
    { value: 'process_optimization', label: '工艺优化' },
  ],
};

type WizardStep = 'industry' | 'scenarios' | 'confirm' | 'running' | 'done' | 'failed';

export default function TenantIndustrySetup({ tenant, open, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<WizardStep>('industry');
  const [selectedIndustry, setSelectedIndustry] = useState<string>(tenant.industry ?? '');
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(tenant.scenarios ?? []);

  const updateProfileMutation = useUpdateTenantProfile();
  const initTemplateMutation = useInitTenantTemplate();
  const { data: initStatus } = useTenantInitStatus(tenant.id, step === 'running');

  const displayStep: WizardStep =
    step === 'running' && initStatus === 'done'
      ? 'done'
      : step === 'running' && initStatus === 'failed'
        ? 'failed'
        : step;

  const resetWizard = () => {
    setStep('industry');
    setSelectedIndustry(tenant.industry ?? '');
    setSelectedScenarios(tenant.scenarios ?? []);
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const handleIndustryNext = () => {
    if (!selectedIndustry) {
      message.warning(t('system.tenant.setup.selectIndustryWarning'));
      return;
    }
    setStep('scenarios');
  };

  const handleScenariosNext = () => {
    setStep('confirm');
  };

  const handleConfirm = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        id: tenant.id,
        data: { industry: selectedIndustry, scenarios: selectedScenarios },
      });
      await initTemplateMutation.mutateAsync(tenant.id);
      setStep('running');
    } catch {
      message.error(t('system.tenant.setup.initFailedRetry'));
    }
  };

  const currentIndustry = INDUSTRIES.find((i) => i.value === selectedIndustry);
  const scenarioOptions = selectedIndustry ? (SCENARIOS_BY_INDUSTRY[selectedIndustry] ?? []) : [];

  const stepIndexMap: Record<WizardStep, number> = {
    industry: 0, scenarios: 1, confirm: 2, running: 3, done: 3, failed: 3,
  };

  const stepsItems = [
    { title: t('system.tenant.setup.stepIndustry') },
    { title: t('system.tenant.setup.stepScenario') },
    { title: t('system.tenant.setup.stepConfirm') },
    { title: t('system.tenant.setup.stepInit') },
  ];

  const renderBody = () => {
    switch (step) {
      case 'industry':
        return (
          <div className="mt-4">
            <Text type="secondary">{t('system.tenant.setup.industryDescription')}</Text>
            <Radio.Group
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full mt-4"
            >
              <div className="flex flex-col gap-3">
                {INDUSTRIES.map((ind) => (
                  <Radio key={ind.value} value={ind.value} className="w-full m-0">
                    <Card
                      size="small"
                      className={`w-full cursor-pointer transition-all ${selectedIndustry === ind.value ? 'border-blue-500 bg-blue-50' : ''}`}
                      styles={{ body: { padding: '8px 12px' } }}
                    >
                      <div className="flex items-start gap-3">
                        <div>
                          <div className="font-medium">{ind.label}</div>
                          <Text type="secondary" className="text-xs">{ind.description}</Text>
                        </div>
                      </div>
                    </Card>
                  </Radio>
                ))}
              </div>
            </Radio.Group>
          </div>
        );

      case 'scenarios':
        return (
          <div className="mt-4">
            <Text type="secondary">
              {t('system.tenant.setup.scenarioDescription')}
            </Text>
            <div className="mt-4 space-y-2">
              <Checkbox.Group
                value={selectedScenarios}
                onChange={(vals) => setSelectedScenarios(vals as string[])}
                className="w-full"
              >
                <div className="grid grid-cols-2 gap-2">
                  {scenarioOptions.map((sc) => (
                    <Card key={sc.value} size="small" className="w-full">
                      <Checkbox value={sc.value}>{sc.label}</Checkbox>
                    </Card>
                  ))}
                </div>
              </Checkbox.Group>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="mt-4 space-y-4">
            <div>
              <Text className="text-gray-500 block mb-1">{t('system.tenant.setup.selectedIndustry')}</Text>
              <Tag color="blue" className="text-sm">{currentIndustry?.label}</Tag>
            </div>
            <div>
              <Text className="text-gray-500 block mb-1">{t('system.tenant.setup.selectedScenario')}</Text>
              {selectedScenarios.length > 0 ? (
                <Space wrap>
                  {selectedScenarios.map((sc) => {
                    const opt = scenarioOptions.find((o) => o.value === sc);
                    return <Tag key={sc}>{opt?.label ?? sc}</Tag>;
                  })}
                </Space>
              ) : (
                <Text type="secondary">{t('system.tenant.setup.allScenarioFallback')}</Text>
              )}
            </div>
            <Divider />
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
              <strong>{t('system.tenant.setup.tipLabel')}</strong>{t('system.tenant.setup.tipContent')}
              <br />
              <strong>{t('system.tenant.setup.noteLabel')}</strong>{t('system.tenant.setup.noteContent')}
            </div>
          </div>
        );

      case 'running':
        return (
          <div className="flex flex-col items-center justify-center py-10">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} />} />
            <Title level={5} className="mt-6">{t('system.tenant.setup.runningTitle')}</Title>
            <Text type="secondary">{t('system.tenant.setup.runningDescription')}</Text>
          </div>
        );

      case 'done':
        return (
          <Result
            icon={<CheckCircleOutlined className="text-green-500" style={{ fontSize: 64 }} />}
            title={t('system.tenant.setup.doneTitle')}
            subTitle={t('system.tenant.setup.doneSubtitle', { industry: currentIndustry?.label ?? '-' })}
          />
        );

      case 'failed':
        return (
          <Result
            icon={<CloseCircleOutlined className="text-red-500" style={{ fontSize: 64 }} />}
            title={t('system.tenant.setup.failedTitle')}
            subTitle={t('system.tenant.setup.failedSubtitle')}
            extra={
              <Button type="primary" onClick={() => setStep('confirm')}>
                {t('common.retry')}
              </Button>
            }
          />
        );
    }
  };

  const renderFooter = () => {
    if (step === 'running' || step === 'done') {
      return (
        <div className="flex justify-end">
          <Button
            type="primary"
            onClick={() => {
              onSuccess();
              handleClose();
            }}
          >
            {step === 'done' ? t('common.finish') : t('common.close')}
          </Button>
        </div>
      );
    }
    if (step === 'failed') {
      return (
        <div className="flex justify-end">
          <Button onClick={handleClose}>{t('common.close')}</Button>
        </div>
      );
    }
    return (
      <div className="flex justify-between">
        <Button
          onClick={() => {
            if (step === 'industry') handleClose();
            else if (step === 'scenarios') setStep('industry');
            else if (step === 'confirm') setStep('scenarios');
          }}
        >
          {step === 'industry' ? t('common.cancel') : t('common.previousStep')}
        </Button>
        <Button
          type="primary"
          icon={step === 'confirm' ? <RocketOutlined /> : undefined}
          loading={updateProfileMutation.isPending || initTemplateMutation.isPending}
          onClick={() => {
            if (step === 'industry') handleIndustryNext();
            else if (step === 'scenarios') handleScenariosNext();
            else if (step === 'confirm') handleConfirm();
          }}
        >
          {step === 'confirm' ? t('system.tenant.setup.startInit') : t('common.nextStep')}
        </Button>
      </div>
    );
  };

  return (
    <Modal
      title={t('system.tenant.setup.title')}
      open={open}
      onCancel={handleClose}
      afterOpenChange={(visible) => {
        if (visible) {
          resetWizard();
        }
      }}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Steps
        current={stepIndexMap[displayStep]}
        items={stepsItems}
        size="small"
        className="mt-4"
      />
      {(() => {
        const currentStep = step;
        if (displayStep !== currentStep) {
          switch (displayStep) {
            case 'done':
              return (
                <Result
                  icon={<CheckCircleOutlined className="text-green-500" style={{ fontSize: 64 }} />}
                  title={t('system.tenant.setup.doneTitle')}
                  subTitle={t('system.tenant.setup.doneSubtitle', { industry: currentIndustry?.label ?? '-' })}
                />
              );
            case 'failed':
              return (
                <Result
                  icon={<CloseCircleOutlined className="text-red-500" style={{ fontSize: 64 }} />}
                  title={t('system.tenant.setup.failedTitle')}
                  subTitle={t('system.tenant.setup.failedSubtitle')}
                  extra={
                    <Button type="primary" onClick={() => setStep('confirm')}>
                      {t('common.retry')}
                    </Button>
                  }
                />
              );
            default:
              return renderBody();
          }
        }
        return renderBody();
      })()}
      <Divider className="mb-3" />
      {(() => {
        if (displayStep === 'done') {
          return (
            <div className="flex justify-end">
              <Button
                type="primary"
                onClick={() => {
                  onSuccess();
                  handleClose();
                }}
              >
                {t('common.finish')}
              </Button>
            </div>
          );
        }
        if (displayStep === 'failed') {
          return (
            <div className="flex justify-end">
              <Button onClick={handleClose}>{t('common.close')}</Button>
            </div>
          );
        }
        return renderFooter();
      })()}
    </Modal>
  );
}

import { useEffect } from 'react';
import { Form, Input, Select, InputNumber, Button, Typography, Switch } from 'antd';
import {
  CloseOutlined,
  PlayCircleOutlined, ClockCircleOutlined, ThunderboltOutlined,
  RobotOutlined, CodeOutlined, ApiOutlined, SendOutlined, DatabaseOutlined, FileTextOutlined,
  AuditOutlined, BranchesOutlined, ForkOutlined, RetweetOutlined, StopOutlined,
  SettingOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import type { Node } from '@xyflow/react';
import { NODE_TYPE_REGISTRY } from '@/types/workflow';
import { useAgentList } from '@/api/agent';
import { useChannels } from '@/api/channel';
import { useMessageTemplates } from '@/api/messageTemplate';
import { useAllRoles } from '@/api/system';
import type { Agent } from '@/types/agent';
import { CHANNEL_TYPE_KEYS, ChannelLogo } from '@/pages/integration/channel/channelMeta';

const { Text } = Typography;
const { TextArea } = Input;

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  PlayCircleOutlined, ClockCircleOutlined, ThunderboltOutlined,
  RobotOutlined, CodeOutlined, ApiOutlined, SendOutlined, DatabaseOutlined,
  FileTextOutlined,
  AuditOutlined, BranchesOutlined, ForkOutlined, RetweetOutlined, StopOutlined,
};

interface ConfigPanelProps {
  selectedNode: Node | null;
  onClose: () => void;
  onConfigChange: (nodeId: string, config: Record<string, any>) => void;
  onLabelChange: (nodeId: string, label: string) => void;
}

/** 配置分组卡片 */
function ConfigSection({ title, icon, color, children }: {
  title: string;
  icon?: React.ReactNode;
  color?: string;
  children: React.ReactNode;
}) {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  return (
    <div
      style={{
        background: isDark ? '#1e2d3d' : '#fff',
        borderRadius: 12,
        border: isDark ? '1px solid #3D3E40' : '1px solid #f0f0f5',
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      {/* 分组标题 */}
      <div
        className="flex items-center gap-2 px-3.5 py-2.5"
        style={{
          background: isDark ? 'linear-gradient(135deg, #253447, #1e2d3d)' : 'linear-gradient(135deg, #F7F8FA, #f1f5f9)',
          borderBottom: isDark ? '1px solid #3D3E40' : '1px solid #f0f0f5',
        }}
      >
        {icon && (
          <span style={{ color: color || '#4E5969', fontSize: 12 }}>{icon}</span>
        )}
        <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#86909C' : '#475569', letterSpacing: '0.02em' }}>
          {title}
        </span>
      </div>
      {/* 内容 */}
      <div className="px-3.5 py-3">
        {children}
      </div>
    </div>
  );
}

export default function ConfigPanel({ selectedNode, onClose, onConfigChange, onLabelChange }: ConfigPanelProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  // agent 类型节点需要加载 Agent 列表（其他节点用不到，但 Hook 不能条件调用，成本可忽略）
  const { data: agentListData, isLoading: agentListLoading } = useAgentList(
    { page: 1, size: 100,isBuiltin: false },
  );
  const agentList: Agent[] = agentListData?.records ?? [];
  const { data: channelListData } = useChannels({ page: 1, size: 100, status: 'active' });
  const { data: messageTemplateData } = useMessageTemplates({ page: 1, size: 100, status: 'active' });
  const { data: roleList = [] } = useAllRoles();
  const channelList = channelListData?.records ?? [];
  const messageTemplateList = messageTemplateData?.records ?? [];

  const nodeType = selectedNode?.type || '';
  const meta = NODE_TYPE_REGISTRY.find((m) => m.type === nodeType);
  const color = meta?.color || '#165DFF';
  const config = (selectedNode?.data as any)?.config || {};
  const IconComp = meta ? ICON_MAP[meta.icon] : RobotOutlined;

  const buildDocumentKey = (value: string, fallback: string) => {
    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return normalized || fallback;
  };

  useEffect(() => {
    if (selectedNode) {
      form.resetFields();
      let normalizedConfig = nodeType === 'agent'
        ? {
          ...config,
          instructionSource: config.instructionSource || (config.taskInstruction ? 'manual' : 'upstream'),
        }
        : { ...config };
      if (nodeType === 'document') {
        const nodeLabel = String((selectedNode.data as any)?.label || '文档编写');
        normalizedConfig = {
          ...normalizedConfig,
          documentKey: normalizedConfig.documentKey || buildDocumentKey(nodeLabel, selectedNode.id),
          documentTitle: normalizedConfig.documentTitle || nodeLabel,
          submitButtonText: normalizedConfig.submitButtonText || `提交${normalizedConfig.documentTitle || nodeLabel}`,
        };
      }
      if (nodeType === 'trigger_cron' && normalizedConfig.triggerInputs && typeof normalizedConfig.triggerInputs !== 'string') {
        normalizedConfig = {
          ...normalizedConfig,
          triggerInputs: JSON.stringify(normalizedConfig.triggerInputs, null, 2),
        };
      }
      if (nodeType === 'human_review') {
        const defaultTemplate = messageTemplateList.find((item) => item.templateType === 'human_review_pending') || messageTemplateList[0];
        normalizedConfig = {
          ...normalizedConfig,
          reviewerType: normalizedConfig.reviewerType || 'internal',
          timeoutStrategy: normalizedConfig.timeoutStrategy || 'remind',
          messageTemplateId: normalizedConfig.messageTemplateId || defaultTemplate?.id,
          messageTemplateName: normalizedConfig.messageTemplateName || defaultTemplate?.name,
          notificationChannels: Array.from(new Set(['in_app', ...(normalizedConfig.notificationChannels || [])])),
        };
      }
      form.setFieldsValue({
        label: (selectedNode.data as any)?.label || '',
        ...normalizedConfig,
      });
      if (JSON.stringify(normalizedConfig) !== JSON.stringify(config)) {
        onConfigChange(selectedNode.id, normalizedConfig);
      }
    }
  }, [config, form, messageTemplateList, nodeType, onConfigChange, selectedNode]);

  if (!selectedNode) return null;

  const handleValuesChange = (_: any, allValues: any) => {
    const { label, ...restConfig } = allValues;
    if (label !== undefined) {
      onLabelChange(selectedNode.id, label);
    }
    const nextConfig = { ...restConfig };
    if (nodeType === 'agent') {
      nextConfig.instructionSource = nextConfig.instructionSource || (nextConfig.taskInstruction ? 'manual' : 'upstream');
      const matchedAgent = agentList.find((item) => item.id === nextConfig.agentId);
      if (matchedAgent) {
        nextConfig.agentName = matchedAgent.name;
      } else {
        delete nextConfig.agentName;
      }
      if (nextConfig.artifactDeliveryType !== 'feishu_doc') {
        delete nextConfig.artifactDeliveryChannelId;
        delete nextConfig.artifactDeliveryChannelType;
        delete nextConfig.artifactDeliveryChannelName;
        delete nextConfig.artifactDeliveryTitle;
        delete nextConfig.artifactDeliveryFolderToken;
      } else {
        const matchedDeliveryChannel = channelList.find((item) => item.id === nextConfig.artifactDeliveryChannelId);
        if (matchedDeliveryChannel) {
          nextConfig.artifactDeliveryChannelType = matchedDeliveryChannel.channelType;
          nextConfig.artifactDeliveryChannelName = matchedDeliveryChannel.name;
        } else {
          delete nextConfig.artifactDeliveryChannelType;
          delete nextConfig.artifactDeliveryChannelName;
        }
      }
    }
    if (nodeType === 'notification') {
      const matchedChannel = channelList.find((item) => item.id === nextConfig.channelId);
      if (matchedChannel) {
        nextConfig.channelName = matchedChannel.name;
        nextConfig.channelType = matchedChannel.channelType;
      }
      const matchedTemplate = messageTemplateList.find((item) => item.id === nextConfig.messageTemplateId);
      if (matchedTemplate) {
        nextConfig.messageTemplateName = matchedTemplate.name;
      }
    }
    if (nodeType === 'document') {
      nextConfig.documentTitle = nextConfig.documentTitle || label || '文档编写';
      nextConfig.documentKey = nextConfig.documentKey || buildDocumentKey(nextConfig.documentTitle, selectedNode.id);
      nextConfig.submitButtonText = nextConfig.submitButtonText || `提交${nextConfig.documentTitle}`;
    }
    if (nodeType === 'human_review') {
      nextConfig.reviewerType = nextConfig.reviewerType || 'internal';
      nextConfig.timeoutStrategy = nextConfig.timeoutStrategy || 'remind';
      const matchedTemplate = messageTemplateList.find((item) => item.id === nextConfig.messageTemplateId);
      if (matchedTemplate) {
        nextConfig.messageTemplateName = matchedTemplate.name;
      }
      const matchedChannels = channelList.filter((item) => (nextConfig.notificationChannelIds || []).includes(item.id));
      nextConfig.notificationChannels = Array.from(
        new Set(['in_app', ...matchedChannels.map((item) => item.channelType)]),
      );
    }
    onConfigChange(selectedNode.id, nextConfig);
  };

  const channelOptions = channelList.map((item) => ({
    value: item.id,
    label: `${item.name} · ${t(CHANNEL_TYPE_KEYS[item.channelType] || item.channelType)}`,
    channelType: item.channelType,
  }));
  const roleOptions = roleList
    .filter((item) => item.status === 'active')
    .map((item) => ({
      value: item.code,
      label: `${item.name} (${item.code})`,
    }));
  const messageTemplateOptions = messageTemplateList.map((item) => ({
    value: item.id,
    label: item.name,
  }));
  const feishuChannelOptions = channelList
    .filter((item) => item.channelType === 'feishu')
    .map((item) => ({
      value: item.id,
      label: item.name,
    }));
  const headerIcon = nodeType === 'notification' && config.channelType
    ? <ChannelLogo type={config.channelType} size={36} />
    : (
      <div
        style={{
          width: 36, height: 36,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${color}18, ${color}08)`,
          border: `1.5px solid ${color}25`,
          color: color,
          fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {IconComp && <IconComp />}
      </div>
    );

  return (
    <div
      className="h-full flex flex-col"
      style={{
        width: 340,
        background: isDark
          ? 'linear-gradient(180deg, #1a2332 0%, #162130 100%)'
          : 'linear-gradient(180deg, #fafbfd 0%, #f5f7fa 100%)',
        borderLeft: isDark ? '1px solid #3D3E40' : '1px solid #e2e8f0',
      }}
    >
      {/* 头部 - 带节点类型图标和渐变 */}
      <div
        style={{
          borderBottom: isDark ? '1px solid #3D3E40' : '1px solid #e2e8f0',
          background: isDark ? '#2A2B2D' : '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 顶部渐变色带 */}
        <div style={{
          height: 3,
          background: `linear-gradient(90deg, ${color}, ${color}60)`,
        }} />

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {headerIcon}
            <div>
              <Text strong style={{ fontSize: 13, color: isDark ? '#F2F3F5' : '#1D2129', display: 'block', lineHeight: 1.3 }}>
                {t('workflow.designer.nodeConfigTitle')}
              </Text>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: `${color}12`,
                  color: color,
                  fontSize: 10,
                  fontWeight: 500,
                }}
              >
                {meta ? t(meta.labelKey) : nodeType}
              </span>
            </div>
          </div>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={onClose}
            style={{
              borderRadius: 8,
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          />
        </div>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 overflow-y-auto px-3 py-3" style={{ scrollbarWidth: 'thin' }}>
        <Form
          form={form}
          layout="vertical"
          size="small"
          onValuesChange={handleValuesChange}
          className="config-panel-form"
        >
          {/* 基本信息分组 */}
          <ConfigSection
            title={t('workflow.designer.basicInfo')}
            icon={<InfoCircleOutlined />}
            color={color}
          >
            <Form.Item
              label={
                <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
                  {t('workflow.designer.nodeName')}
                </span>
              }
              name="label"
              style={{ marginBottom: 0 }}
            >
              <Input
                style={{ borderRadius: 8 }}
                placeholder={t('workflow.designer.nodeNamePlaceholder')}
              />
            </Form.Item>
          </ConfigSection>

          {/* 专项配置分组 */}
          <ConfigSection
            title={t('workflow.designer.configuration')}
            icon={<SettingOutlined />}
            color={color}
          >
            {renderNodeConfig(nodeType, t, agentList, agentListLoading, channelOptions, feishuChannelOptions, messageTemplateOptions, roleOptions)}
          </ConfigSection>
        </Form>

        {/* 节点元信息 */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #f0f0f5',
            overflow: 'hidden',
          }}
        >
          <div
            className="px-3.5 py-2.5"
            style={{
              background: 'linear-gradient(135deg, #F7F8FA, #f1f5f9)',
              borderBottom: '1px solid #f0f0f5',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>
              {t('workflow.designer.nodeInfo')}
            </span>
          </div>
          <div className="px-3.5 py-2.5">
            <div className="flex items-center justify-between py-1">
              <span style={{ fontSize: 11, color: '#86909C' }}>
                {t('common.type')}
              </span>
              <span
                className="px-2 py-0.5 rounded-full"
                style={{
                  fontSize: 10,
                  color: color,
                  background: `${color}10`,
                  fontWeight: 500,
                }}
              >
                {meta ? t(meta.labelKey) : nodeType}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span style={{ fontSize: 11, color: '#86909C' }}>{t('workflow.designer.idLabel')}</span>
              <span style={{ fontSize: 10, color: '#4E5969', fontFamily: 'monospace' }}>
                {selectedNode.id.length > 12 ? `${selectedNode.id.slice(0, 12)}...` : selectedNode.id}
              </span>
            </div>
            {meta?.category && (
              <div className="flex items-center justify-between py-1">
                <span style={{ fontSize: 11, color: '#86909C' }}>
                  {t('workflow.category')}
                </span>
                <span style={{ fontSize: 10, color: '#4E5969' }}>
                  {meta ? t(`workflow.designer.nodeCategory${meta.category.charAt(0).toUpperCase()}${meta.category.slice(1)}`) : '-'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 按节点类型渲染专项配置表单 */
function renderNodeConfig(
  nodeType: string,
  t: (key: string, options?: Record<string, any>) => string,
  agentList: Agent[] = [],
  agentListLoading = false,
  channelOptions: Array<{ value: string; label: string; channelType: string }> = [],
  feishuChannelOptions: Array<{ value: string; label: string }> = [],
  messageTemplateOptions: Array<{ value: string; label: string }> = [],
  roleOptions: Array<{ value: string; label: string }> = [],
) {
  const labelStyle = { fontSize: 12, color: '#475569', fontWeight: 500 as const };
  const inputStyle = { borderRadius: 8 };

  switch (nodeType) {
    case 'trigger_manual':
      return (
        <Form.Item label={<span style={labelStyle}>{t('common.description')}</span>} name="description" style={{ marginBottom: 0 }}>
          <TextArea rows={2} placeholder={t('workflow.designer.triggerDescriptionPlaceholder')} style={{ ...inputStyle, resize: 'none' }} />
        </Form.Item>
      );

    case 'trigger_cron':
    case 'trigger_event':
      return (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', padding: '8px 0' }}>
          {t('trigger.configHint')}
        </Text>
      );

    case 'agent':
      return (
        <>
          <Form.Item
            label={<span style={labelStyle}>{t('agent.name')}</span>}
            name="agentId"
            rules={[{ required: true, message: '请选择要执行的 Agent' }]}
          >
            <Select
              showSearch
              allowClear
              loading={agentListLoading}
              placeholder={t('workflow.designer.selectAgentPlaceholder')}
              style={inputStyle}
              optionFilterProp="label"
              options={agentList.map((a) => ({
                value: a.id,
                label: a.name,
                title: a.description || a.name,
              }))}
            />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.instructionSource')}</span>} name="instructionSource">
            <Select style={inputStyle}>
              <Select.Option value="upstream">{t('workflow.designer.instructionSourceUpstream')}</Select.Option>
              <Select.Option value="manual">{t('workflow.designer.instructionSourceManual')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, next) => prev.instructionSource !== next.instructionSource}>
            {({ getFieldValue }) => (
              getFieldValue('instructionSource') === 'manual' ? (
                <Form.Item label={<span style={labelStyle}>{t('workflow.designer.taskInstruction')}</span>} name="taskInstruction">
                  <TextArea rows={3} placeholder={t('workflow.designer.taskInstructionPlaceholder')} style={{ ...inputStyle, resize: 'none' }} />
                </Form.Item>
              ) : null
            )}
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.timeoutMinutes')}</span>} name="timeoutMinutes">
            <InputNumber min={1} max={1440} style={{ width: '100%', ...inputStyle }} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.failStrategy')}</span>} name="failureStrategy">
            <Select>
              <Select.Option value="retry">{t('workflow.designer.retry')}</Select.Option>
              <Select.Option value="skip">{t('workflow.designer.skip')}</Select.Option>
              <Select.Option value="terminate">{t('workflow.designer.terminateFlow')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>产出文档类型</span>} name="artifactDocType">
            <Input placeholder="例如：requirements / design / tasks" style={inputStyle} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>产出文档标题</span>} name="artifactTitle">
            <Input placeholder="例如：需求分析文档" style={inputStyle} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>外部交付类型</span>} name="artifactDeliveryType">
            <Select
              allowClear
              style={inputStyle}
              placeholder="留空则仅写入工作空间"
              options={[
                { label: '工作空间文件', value: 'workspace_file' },
                { label: '飞书文档', value: 'feishu_doc' },
              ]}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, next) => prev.artifactDeliveryType !== next.artifactDeliveryType}>
            {({ getFieldValue }) => (
              getFieldValue('artifactDeliveryType') === 'feishu_doc' ? (
                <>
                  <Form.Item
                    label={<span style={labelStyle}>飞书交付渠道</span>}
                    name="artifactDeliveryChannelId"
                    rules={[{ required: true, message: '请选择飞书交付渠道' }]}
                  >
                    <Select
                      showSearch
                      style={inputStyle}
                      placeholder="请选择飞书渠道"
                      options={feishuChannelOptions}
                      optionFilterProp="label"
                      notFoundContent="没有可用的飞书渠道"
                    />
                  </Form.Item>
                  <Form.Item label={<span style={labelStyle}>飞书文档标题</span>} name="artifactDeliveryTitle">
                    <Input placeholder="可覆盖产物标题，留空则复用上方标题" style={inputStyle} />
                  </Form.Item>
                  <Form.Item label={<span style={labelStyle}>飞书目录 Token</span>} name="artifactDeliveryFolderToken">
                    <Input placeholder="可选，指定飞书文档创建目录 token" style={inputStyle} />
                  </Form.Item>
                </>
              ) : null
            )}
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>输出变量名</span>} name="outputVariableKey">
            <Input placeholder="例如：requirementsDoc / designDoc / tasksDoc" style={inputStyle} />
          </Form.Item>

          {/* 质量闸门配置 */}
          <div style={{ background: '#fafafa', borderRadius: 6, padding: '12px 12px 4px', marginBottom: 12, border: '1px solid #f0f0f0' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#1f1f1f' }}>质量闸门配置</div>
            <Form.Item label={<span style={labelStyle}>执行策略</span>} name="executionStrategy">
              <Select style={inputStyle} placeholder="选择质量检查执行策略">
                <Select.Option value="sync">同步规则检查（&lt;200ms）</Select.Option>
                <Select.Option value="short_wait">同步等待模型评估（&lt;15s）</Select.Option>
                <Select.Option value="async">异步深度审查</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label={<span style={labelStyle}>闸门模式</span>} name="qualityGateMode">
              <Select style={inputStyle} placeholder="选择闸门触发后的行为">
                <Select.Option value="disabled">关闭</Select.Option>
                <Select.Option value="warn">仅告警</Select.Option>
                <Select.Option value="pause">暂停工作流</Select.Option>
                <Select.Option value="fail">直接失败</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.qualityGateMode !== cur.qualityGateMode}>
              {({ getFieldValue }: any) => {
                const mode = getFieldValue('qualityGateMode');
                return (mode === 'pause' || mode === 'fail') ? (
                  <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 4, padding: '6px 10px', marginBottom: 8, fontSize: 12, color: '#d46b08' }}>
                    ⚠ 此模式将在质量检查不通过时{mode === 'pause' ? '暂停' : '终止'}工作流执行
                  </div>
                ) : null;
              }}
            </Form.Item>
            <Form.Item label={<span style={labelStyle}>质量配置组</span>} name="qualityProfileId">
              <Input placeholder="可选，指定质量配置组 ID" style={inputStyle} />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.executionStrategy !== cur.executionStrategy}>
              {({ getFieldValue }: any) =>
                getFieldValue('executionStrategy') === 'short_wait' ? (
                  <Form.Item label={<span style={labelStyle}>模型评估超时(秒)</span>} name="qualityGateTimeoutSeconds">
                    <InputNumber min={5} max={60} style={{ width: '100%', ...inputStyle }} placeholder="默认 15 秒" />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
            <Form.Item label={<span style={labelStyle}>最低质量分</span>} name="minQualityScore">
              <InputNumber min={0} max={100} style={{ width: '100%', ...inputStyle }} placeholder="例如：80" />
            </Form.Item>
            <Form.Item label={<span style={labelStyle}>最大偏离数</span>} name="maxDeviationCount">
              <InputNumber min={0} max={999} style={{ width: '100%', ...inputStyle }} placeholder="例如：0" />
            </Form.Item>
            <Form.Item label={<span style={labelStyle}>最大预警数</span>} name="maxWarningCount">
              <InputNumber min={0} max={999} style={{ width: '100%', ...inputStyle }} placeholder="例如：1" />
            </Form.Item>
            <Form.Item label={<span style={labelStyle}>质量任务失败时阻断</span>} name="blockOnQualityTaskFailed" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.maxRetries')}</span>} name="maxRetries" style={{ marginBottom: 0 }}>
            <InputNumber min={0} max={10} style={{ width: '100%', ...inputStyle }} />
          </Form.Item>
        </>
      );

    case 'script':
      return (
        <>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.scriptLanguage')}</span>} name="language">
            <Select>
              <Select.Option value="shell">{t('workflow.designer.scriptLanguageShell')}</Select.Option>
              <Select.Option value="python">{t('workflow.designer.scriptLanguagePython')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.scriptCode')}</span>} name="code">
            <TextArea
              rows={5}
              placeholder={t('workflow.designer.scriptCodePlaceholder')}
              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12, resize: 'none' }}
            />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.timeoutSeconds')}</span>} name="timeoutSeconds" style={{ marginBottom: 0 }}>
            <InputNumber min={1} max={3600} style={{ width: '100%', ...inputStyle }} />
          </Form.Item>
        </>
      );

    case 'api_call':
      return (
        <>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.httpMethod')}</span>} name="method">
            <Select>
              <Select.Option value="GET">GET</Select.Option>
              <Select.Option value="POST">POST</Select.Option>
              <Select.Option value="PUT">PUT</Select.Option>
              <Select.Option value="DELETE">DELETE</Select.Option>
              <Select.Option value="PATCH">PATCH</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.url')}</span>} name="url">
            <Input placeholder={t('workflow.designer.urlPlaceholder')} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12 }} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.requestBody')}</span>} name="body">
            <TextArea rows={3} placeholder={t('workflow.designer.requestBodyPlaceholder')} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12, resize: 'none' }} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.timeoutSeconds')}</span>} name="timeoutSeconds" style={{ marginBottom: 0 }}>
            <InputNumber min={1} max={300} style={{ width: '100%', ...inputStyle }} />
          </Form.Item>
        </>
      );

    case 'notification':
      return (
        <>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.channelType')}</span>} name="channelId">
            <Select
              showSearch
              placeholder={t('workflow.designer.selectIntegratedChannel')}
              options={channelOptions}
              optionFilterProp="label"
              notFoundContent={t('workflow.designer.noIntegratedChannels')}
            />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.messageTemplate')}</span>} name="messageTemplateId" style={{ marginBottom: 0 }}>
            <Select
              placeholder={t('workflow.designer.selectMessageTemplate')}
              options={messageTemplateOptions}
              notFoundContent={t('workflow.designer.noMessageTemplates')}
            />
          </Form.Item>
        </>
      );

    case 'document':
      return (
        <>
          <Form.Item label={<span style={labelStyle}>文档标识</span>} name="documentKey">
            <Input placeholder="例如：requirements / design / tasks / solution" style={inputStyle} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>文档标题</span>} name="documentTitle">
            <Input placeholder="例如：需求文档编写" style={inputStyle} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>提交按钮文案</span>} name="submitButtonText" style={{ marginBottom: 0 }}>
            <Input placeholder="例如：提交需求文档" style={inputStyle} />
          </Form.Item>
        </>
      );

    case 'database':
      return (
        <>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.operationType')}</span>} name="operationType">
            <Select>
              <Select.Option value="query">{t('workflow.designer.operationQuery')}</Select.Option>
              <Select.Option value="insert">{t('workflow.designer.operationInsert')}</Select.Option>
              <Select.Option value="update">{t('workflow.designer.operationUpdate')}</Select.Option>
              <Select.Option value="delete">{t('workflow.designer.operationDelete')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.dataSource')}</span>} name="dataSource">
            <Input placeholder={t('workflow.designer.dataSourcePlaceholder')} style={inputStyle} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.sql')}</span>} name="sql" style={{ marginBottom: 0 }}>
            <TextArea rows={4} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12, resize: 'none' }} placeholder={t('workflow.designer.sqlPlaceholder')} />
          </Form.Item>
        </>
      );

    case 'human_review':
      return (
        <>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.reviewerType')}</span>} name="reviewerType">
            <Select>
              <Select.Option value="internal">{t('workflow.designer.internalUser')}</Select.Option>
              <Select.Option value="external">{t('workflow.designer.externalUser')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.reviewerRoles')}</span>} name="reviewerRoles">
            <Select
              mode="multiple"
              showSearch
              optionFilterProp="label"
              placeholder={t('workflow.designer.selectRoles')}
              options={roleOptions}
            />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.timeoutHours')}</span>} name="timeoutHours">
            <InputNumber min={1} max={168} style={{ width: '100%', ...inputStyle }} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>审核文档类型</span>} name="documentKey">
            <Input placeholder="例如：requirements / design / tasks" style={inputStyle} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.timeoutStrategy')}</span>} name="timeoutStrategy">
            <Select>
              <Select.Option value="auto_pass">{t('workflow.designer.autoApprove')}</Select.Option>
              <Select.Option value="escalate">{t('workflow.designer.escalate')}</Select.Option>
              <Select.Option value="remind">{t('workflow.designer.remindOnly')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label={<span style={labelStyle}>待办消息模板</span>}
            name="messageTemplateId"
            tooltip="人工审核节点触发时，系统会默认发送站内信，此模板同时可用于外部通知文案。"
            rules={[{ required: true, message: '请选择人工审核通知模板' }]}
          >
            <Select
              placeholder="请选择人工审核通知模板"
              options={messageTemplateOptions}
              notFoundContent={t('workflow.designer.noMessageTemplates')}
            />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.notificationChannel')}</span>} name="notificationChannelIds" style={{ marginBottom: 0 }}>
            <Select
              mode="multiple"
              placeholder={t('workflow.designer.selectChannels')}
              options={channelOptions}
              optionFilterProp="label"
              notFoundContent={t('workflow.designer.noIntegratedChannels')}
            />
          </Form.Item>
          <div style={{ fontSize: 12, color: '#86909C', marginTop: 8 }}>
            站内信通知默认开启且不可关闭，可额外勾选飞书、邮件等外部渠道。
          </div>
        </>
      );

    case 'condition':
      return (
        <>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.conditionExpression')}</span>} name="expression">
            <TextArea rows={2} placeholder={t('workflow.designer.conditionExpressionPlaceholder')} style={{ fontFamily: 'monospace', fontSize: 12, borderRadius: 8, resize: 'none' }} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.trueLabel')}</span>} name="trueLabel">
            <Input placeholder={t('workflow.designer.trueBranchPlaceholder')} style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.falseLabel')}</span>} name="falseLabel" style={{ marginBottom: 0 }}>
            <Input placeholder={t('workflow.designer.falseBranchPlaceholder')} style={{ borderRadius: 8 }} />
          </Form.Item>
        </>
      );

    case 'parallel':
      return (
        <Form.Item label={<span style={labelStyle}>{t('workflow.designer.gatewayType')}</span>} name="gatewayType" style={{ marginBottom: 0 }}>
          <Select>
            <Select.Option value="fork">Fork ({t('workflow.designer.split')})</Select.Option>
            <Select.Option value="join">Join ({t('workflow.designer.merge')})</Select.Option>
          </Select>
        </Form.Item>
      );

    case 'loop':
      return (
        <>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.loopType')}</span>} name="loopType">
            <Select>
              <Select.Option value="count">{t('workflow.designer.fixedCount')}</Select.Option>
              <Select.Option value="condition">{t('workflow.designer.conditionLoop')}</Select.Option>
              <Select.Option value="foreach">{t('workflow.designer.loopForeach')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.maxIterations')}</span>} name="maxIterations">
            <InputNumber min={1} max={1000} style={{ width: '100%', borderRadius: 8 }} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>{t('workflow.designer.loopCondition')}</span>} name="condition" style={{ marginBottom: 0 }}>
            <Input placeholder={t('workflow.designer.loopConditionPlaceholder')} style={{ fontFamily: 'monospace', fontSize: 12, borderRadius: 8 }} />
          </Form.Item>
        </>
      );

    case 'end':
      return (
        <Form.Item label={<span style={labelStyle}>{t('common.description')}</span>} name="description" style={{ marginBottom: 0 }}>
          <TextArea rows={2} style={{ borderRadius: 8, resize: 'none' }} />
        </Form.Item>
      );

    default:
      return (
        <div className="flex flex-col items-center py-4" style={{ color: '#86909C' }}>
          <SettingOutlined style={{ fontSize: 20, marginBottom: 8, opacity: 0.5 }} />
          <span style={{ fontSize: 12 }}>
            {t('workflow.designer.noConfigAvailable')}
          </span>
        </div>
      );
  }
}

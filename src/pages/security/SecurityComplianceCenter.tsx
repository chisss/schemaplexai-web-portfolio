import {
  App as AntApp,
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
  theme,
} from 'antd';
import type { TableColumnsType, TabsProps } from 'antd';
import {
  AlertOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTenantRuntimePolicy, useUpdateTenantRuntimePolicy } from '@/api/runtimePolicy';
import PageContainer from '@/components/PageContainer/PageContainer';
import SecurityEvidencePanel from './components/SecurityEvidencePanel';
import SecurityPolicySummary from './components/SecurityPolicySummary';
import SecurityRiskQueue from './components/SecurityRiskQueue';
import {
  assignSecurityIncident,
  createSecurityPolicy,
  createSecurityRulePack,
  deleteSecurityPolicy,
  escalateSecurityIncident,
  fetchSecurityAuditEvents,
  fetchSecurityAuditEventsByTrace,
  fetchSecurityIncidentActions,
  fetchSecurityIncidentDetail,
  fetchSecurityIncidents,
  fetchSecurityOverview,
  fetchSecurityPolicies,
  fetchSecurityPolicyBindings,
  fetchSecurityPolicyDetail,
  fetchSecurityPolicyVersions,
  fetchSecurityRulePackBindings,
  fetchSecurityRulePackDetail,
  fetchSecurityRulePacks,
  fetchSecurityTargetOptions,
  ignoreSecurityIncident,
  publishSecurityPolicy,
  resolveSecurityIncident,
  resumeSecurityIncidentResource,
  runSecurityRuntimeCheck,
  saveSecurityPolicyBindings,
  saveSecurityRulePackBindings,
  toggleSecurityPolicy,
  toggleSecurityRulePack,
  updateSecurityPolicy,
  updateSecurityRulePack,
} from '@/api/securityCompliance';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  SecurityAuditEvent,
  SecurityBinding,
  SecurityCheckDecisionResult,
  SecurityDecision,
  SecurityDomainCode,
  SecurityIncident,
  SecurityIncidentAction,
  SecurityOverview,
  SecurityPolicy,
  SecurityPolicySaveDTO,
  SecurityPolicyVersion,
  SecurityRuleItemSaveDTO,
  SecurityRulePack,
  SecurityRulePackSaveDTO,
  SecurityScope,
  SecurityTargetOptions,
} from '@/types/securityCompliance';
import type { TenantRuntimePolicyUpdateDTO } from '@/types/runtimePolicy';
import { formatDateTime } from '@/utils/date';

const { Paragraph, Text, Title } = Typography;
const { Search, TextArea } = Input;
const tableCellNoWrapStyle = { display: 'inline-block', whiteSpace: 'nowrap' as const, wordBreak: 'keep-all' as const };
const tableTagNoWrapStyle = { whiteSpace: 'nowrap' as const };

type SecurityTabKey = 'overview' | 'runtime' | 'data' | 'risk' | 'industry';

interface BindingDraft {
  bindingType?: SecurityScope | string;
  targetId?: string;
  targetName?: string;
  priority?: number;
  bindingConfigText?: string;
}

interface PolicyEditorValues {
  policyCode: string;
  policyName: string;
  policyType: string;
  policyScope: SecurityScope;
  enforcementMode: 'audit' | 'warn' | 'block';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  controlPointsText?: string;
  tagsText?: string;
  description?: string;
  bindingDrafts?: BindingDraft[];
  advancedSelectorText?: string;
  advancedConfigText?: string;
  keywordsText?: string;
  regexPatternsText?: string;
  forbiddenToolsText?: string;
  forbiddenCommandsText?: string;
  maxLength?: number;
  reviewRequired?: boolean;
  hitAction?: SecurityDecision;
  sessionTtlMinutes?: number;
  maxSessions?: number;
  transportProtocol?: string;
  storageAlgorithm?: string;
  encryptStorage?: boolean;
  encryptTransport?: boolean;
  forbidMemoryWrite?: boolean;
  requireMaskedOutput?: boolean;
  allowedRegionsText?: string;
  tenantQps?: number;
  userDailyQuota?: number;
  temporaryBanMinutes?: number;
  anomalyThreshold?: number;
  auditRetentionDays?: number;
  ipAllowListText?: string;
  ipBlockListText?: string;
  highRiskTagsText?: string;
  autoEscalate?: boolean;
}

interface RuntimeCheckFormValues {
  scene: string;
  resourceType?: string;
  resourceName?: string;
  agentId?: string;
  workflowInstanceId?: string;
  workflowNodeId?: string;
  workspaceId?: string;
  toolCode?: string;
  tagsText?: string;
  content?: string;
  argumentsText?: string;
  contextText?: string;
}

interface IncidentActionValues {
  assigneeId?: string;
  assigneeName?: string;
  comment: string;
}

interface RuleItemDraft {
  itemCode: string;
  itemName: string;
  ruleSource?: string;
  ruleClause?: string;
  riskLevel?: string;
  action?: string;
  matchType?: string;
  matchContent?: string;
  sortOrder?: number;
  enabled?: boolean;
  itemConfigText?: string;
}

interface RulePackEditorValues {
  packCode: string;
  packName: string;
  industryCode: string;
  defaultAction: 'warn' | 'block' | 'pause';
  description?: string;
  businessLine?: string;
  regulatorsText?: string;
  reviewOwner?: string;
  evidenceRequired?: boolean;
  advancedConfigText?: string;
  bindingDrafts?: BindingDraft[];
  items?: RuleItemDraft[];
}

const TAB_META: Record<SecurityTabKey, { title: string; description: string; color: string; icon: ReactNode }> = {
  overview: {
    title: '安全合规总览',
    description: '统一查看策略覆盖、事件积压、规则包启用和最近审计链路。',
    color: '#1677ff',
    icon: <SafetyCertificateOutlined />,
  },
  runtime: {
    title: '运行时防护',
    description: '配置 Prompt、工具和命令级运行时策略，并用模拟检查验证拦截效果。',
    color: '#1677ff',
    icon: <ThunderboltOutlined />,
  },
  data: {
    title: '数据与会话',
    description: '管理会话时效、存储加密、输出脱敏和知识写入边界。',
    color: '#0f766e',
    icon: <DatabaseOutlined />,
  },
  risk: {
    title: '风控与审计',
    description: '围绕安全事件、审计链路和风控策略做处置闭环。',
    color: '#FF7D00',
    icon: <AlertOutlined />,
  },
  industry: {
    title: '行业合规',
    description: '管理行业规则包、条款命中规则和业务绑定范围。',
    color: '#7c3aed',
    icon: <GlobalOutlined />,
  },
};

const POLICY_TYPE_OPTIONS: Record<'runtime' | 'data' | 'risk', { label: string; value: string }[]> = {
  runtime: [
    { label: 'Prompt 注入防护', value: 'prompt_injection' },
    { label: '工具调用守卫', value: 'tool_guard' },
    { label: '输出安全校验', value: 'output_guard' },
    { label: '高危命令拦截', value: 'command_guard' },
  ],
  data: [
    { label: '数据加密基线', value: 'data_encryption' },
    { label: '会话生命周期', value: 'session_control' },
    { label: '租户隔离', value: 'tenant_isolation' },
    { label: '知识回写审核', value: 'knowledge_review' },
  ],
  risk: [
    { label: '访问限流', value: 'rate_limit' },
    { label: '异常行为识别', value: 'abuse_detection' },
    { label: '审计留痕', value: 'audit_trace' },
    { label: '高危标签升级', value: 'anomaly_detection' },
  ],
};

const POLICY_STATUS_OPTIONS = [
  { label: '草稿', value: 'draft' },
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
  { label: '归档', value: 'archived' },
];

const RISK_LEVEL_OPTIONS = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '严重', value: 'critical' },
];

const ENFORCEMENT_OPTIONS = [
  { label: '仅审计', value: 'audit' },
  { label: '告警', value: 'warn' },
  { label: '阻断', value: 'block' },
];

const DECISION_OPTIONS = [
  { label: '告警', value: 'warn' },
  { label: '阻断', value: 'block' },
  { label: '暂停', value: 'pause' },
];

const SCOPE_OPTIONS = [
  { label: '租户级', value: 'tenant' },
  { label: 'Agent', value: 'agent' },
  { label: '工作流', value: 'workflow' },
  { label: '工作空间', value: 'project' },
];

const INCIDENT_STATUS_OPTIONS = [
  { label: '新建', value: 'new' },
  { label: '已分派', value: 'assigned' },
  { label: '处理中', value: 'investigating' },
  { label: '已解决', value: 'resolved' },
  { label: '已忽略', value: 'ignored' },
  { label: '已升级', value: 'escalated' },
];

const AUDIT_STATUS_OPTIONS = [
  { label: '成功', value: 'success' },
  { label: '告警', value: 'warning' },
  { label: '拦截', value: 'blocked' },
  { label: '失败', value: 'failed' },
];

const INDUSTRY_OPTIONS = [
  { label: '金融', value: 'finance' },
  { label: '医疗', value: 'medical' },
  { label: '政企', value: 'gov' },
  { label: '互联网平台', value: 'platform' },
];

const AUDIT_EVENT_OPTIONS = [
  { label: '策略创建', value: 'policy_created' },
  { label: '策略更新', value: 'policy_updated' },
  { label: '策略发布', value: 'policy_published' },
  { label: '运行时检查', value: 'runtime_check' },
  { label: '运行时告警', value: 'runtime_warning' },
  { label: '运行时拦截', value: 'runtime_blocked' },
  { label: '运行时暂停', value: 'runtime_paused' },
];

const RUNTIME_CONFIG_KEYS = ['keywords', 'regexPatterns', 'forbiddenTools', 'forbiddenCommands', 'maxLength', 'reviewRequired', 'hitAction'];
const DATA_CONFIG_KEYS = ['sessionTtlMinutes', 'maxSessions', 'transportProtocol', 'storageAlgorithm', 'encryptStorage', 'encryptTransport', 'forbidMemoryWrite', 'requireMaskedOutput', 'allowedRegions'];
const RISK_CONFIG_KEYS = ['tenantQps', 'userDailyQuota', 'temporaryBanMinutes', 'anomalyThreshold', 'auditRetentionDays', 'ipAllowList', 'ipBlockList', 'highRiskTags', 'autoEscalate'];
const PACK_CONFIG_KEYS = ['businessLine', 'regulators', 'reviewOwner', 'evidenceRequired'];

function getActiveTab(pathname: string): SecurityTabKey {
  const tab = pathname.split('/').filter(Boolean).pop();
  if (tab === 'runtime' || tab === 'data' || tab === 'risk' || tab === 'industry') {
    return tab;
  }
  return 'overview';
}

function parseJsonText(text?: string) {
  if (!text?.trim()) {
    return undefined;
  }
  return JSON.parse(text) as Record<string, unknown>;
}

function stringifyJson(value?: unknown) {
  if (value == null) {
    return '{\n}';
  }
  return JSON.stringify(value, null, 2);
}

function splitTextValue(value?: string) {
  return value
    ?.split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean) ?? [];
}

function joinTextValue(value?: string[]) {
  return value?.length ? value.join('\n') : '';
}

function omitKeys(source: Record<string, unknown> | undefined, keys: string[]) {
  if (!source) {
    return {};
  }
  const next = { ...source };
  keys.forEach((key) => {
    delete next[key];
  });
  return next;
}

function riskColor(level?: string) {
  if (level === 'critical') return 'red';
  if (level === 'high') return 'volcano';
  if (level === 'medium') return 'gold';
  return 'green';
}

function decisionColor(decision?: string) {
  if (decision === 'block') return 'red';
  if (decision === 'pause') return 'orange';
  if (decision === 'warn') return 'gold';
  return 'green';
}

function auditColor(status?: string) {
  if (status === 'blocked') return 'red';
  if (status === 'warning') return 'gold';
  if (status === 'failed') return 'volcano';
  return 'green';
}

function domainLabel(domain?: string) {
  if (domain === 'runtime') return '运行时防护';
  if (domain === 'data') return '数据与会话';
  if (domain === 'risk') return '风控与审计';
  if (domain === 'industry') return '行业合规';
  return domain || '-';
}

function scopeLabel(scope?: string) {
  if (scope === 'tenant') return '租户级';
  if (scope === 'agent') return 'Agent';
  if (scope === 'workflow') return '工作流';
  if (scope === 'project') return '工作空间';
  return scope || '-';
}

function getTargetListByScope(targetOptions: SecurityTargetOptions | undefined, scope?: string) {
  if (scope === 'agent') {
    return targetOptions?.agent ?? [];
  }
  if (scope === 'workflow') {
    return targetOptions?.workflow ?? [];
  }
  if (scope === 'project') {
    return targetOptions?.project ?? [];
  }
  return targetOptions?.tenant ?? [];
}

function resolveTargetName(targetOptions: SecurityTargetOptions | undefined, scope: string | undefined, targetId?: string) {
  if (!targetId) {
    return scope === 'tenant' ? '当前租户' : '';
  }
  return getTargetListByScope(targetOptions, scope).find((item) => item.value === targetId)?.label || targetId;
}

function normalizePolicyBindings(policy: SecurityPolicy, bindings: SecurityBinding[]) {
  if (bindings.length) {
    return bindings.map((item, index) => ({
      bindingType: (item.bindingType || policy.policyScope) as SecurityScope,
      targetId: item.targetId,
      targetName: item.targetName,
      priority: item.priority ?? (index + 1) * 10,
      bindingConfigText: stringifyJson(item.bindingConfig),
    }));
  }
  const selector = policy.targetSelector || {};
  if (policy.policyScope === 'agent') {
    return (selector.agentIds as string[] | undefined)?.map((value, index) => ({
      bindingType: 'agent' as const,
      targetId: value,
      priority: (index + 1) * 10,
      bindingConfigText: '{\n}',
    })) ?? [];
  }
  if (policy.policyScope === 'workflow') {
    return (selector.workflowTemplateIds as string[] | undefined)?.map((value, index) => ({
      bindingType: 'workflow' as const,
      targetId: value,
      priority: (index + 1) * 10,
      bindingConfigText: '{\n}',
    })) ?? [];
  }
  if (policy.policyScope === 'project') {
    return (selector.workspaceIds as string[] | undefined)?.map((value, index) => ({
      bindingType: 'project' as const,
      targetId: value,
      priority: (index + 1) * 10,
      bindingConfigText: '{\n}',
    })) ?? [];
  }
  return [{ bindingType: 'tenant', priority: 10, bindingConfigText: '{\n}' }];
}

function buildPolicyTargetSelector(
  values: PolicyEditorValues,
  bindings: BindingDraft[],
  policyDomain: SecurityDomainCode,
) {
  const advancedSelector = parseJsonText(values.advancedSelectorText);
  const selector: Record<string, unknown> = { ...(advancedSelector || {}) };
  selector.scope = values.policyScope;
  if (values.policyScope === 'tenant') {
    selector.tenantScope = 'current';
    delete selector.agentIds;
    delete selector.workflowTemplateIds;
    delete selector.workspaceIds;
  }
  if (values.policyScope === 'agent') {
    selector.agentIds = bindings.map((item) => item.targetId).filter(Boolean);
    delete selector.workflowTemplateIds;
    delete selector.workspaceIds;
  }
  if (values.policyScope === 'workflow') {
    selector.workflowTemplateIds = bindings.map((item) => item.targetId).filter(Boolean);
    delete selector.agentIds;
    delete selector.workspaceIds;
  }
  if (values.policyScope === 'project') {
    selector.workspaceIds = bindings.map((item) => item.targetId).filter(Boolean);
    delete selector.agentIds;
    delete selector.workflowTemplateIds;
  }
  if (policyDomain !== 'runtime') {
    delete selector.traceId;
  }
  return selector;
}

function buildPolicyConfig(policyDomain: SecurityDomainCode, values: PolicyEditorValues) {
  const advancedConfig = parseJsonText(values.advancedConfigText);
  const config: Record<string, unknown> = { ...(advancedConfig || {}) };
  if (policyDomain === 'runtime') {
    config.keywords = splitTextValue(values.keywordsText);
    config.regexPatterns = splitTextValue(values.regexPatternsText);
    config.forbiddenTools = splitTextValue(values.forbiddenToolsText);
    config.forbiddenCommands = splitTextValue(values.forbiddenCommandsText);
    if (values.maxLength != null) {
      config.maxLength = values.maxLength;
    } else {
      delete config.maxLength;
    }
    config.reviewRequired = !!values.reviewRequired;
    if (values.hitAction) {
      config.hitAction = values.hitAction;
    }
  }
  if (policyDomain === 'data') {
    if (values.sessionTtlMinutes != null) config.sessionTtlMinutes = values.sessionTtlMinutes;
    if (values.maxSessions != null) config.maxSessions = values.maxSessions;
    if (values.transportProtocol) config.transportProtocol = values.transportProtocol;
    if (values.storageAlgorithm) config.storageAlgorithm = values.storageAlgorithm;
    config.encryptStorage = !!values.encryptStorage;
    config.encryptTransport = !!values.encryptTransport;
    config.forbidMemoryWrite = !!values.forbidMemoryWrite;
    config.requireMaskedOutput = !!values.requireMaskedOutput;
    config.allowedRegions = splitTextValue(values.allowedRegionsText);
  }
  if (policyDomain === 'risk') {
    if (values.tenantQps != null) config.tenantQps = values.tenantQps;
    if (values.userDailyQuota != null) config.userDailyQuota = values.userDailyQuota;
    if (values.temporaryBanMinutes != null) config.temporaryBanMinutes = values.temporaryBanMinutes;
    if (values.anomalyThreshold != null) config.anomalyThreshold = values.anomalyThreshold;
    if (values.auditRetentionDays != null) config.auditRetentionDays = values.auditRetentionDays;
    config.ipAllowList = splitTextValue(values.ipAllowListText);
    config.ipBlockList = splitTextValue(values.ipBlockListText);
    config.highRiskTags = splitTextValue(values.highRiskTagsText);
    config.autoEscalate = !!values.autoEscalate;
  }
  return config;
}

function buildRulePackConfig(values: RulePackEditorValues) {
  const advancedConfig = parseJsonText(values.advancedConfigText);
  return {
    ...(advancedConfig || {}),
    businessLine: values.businessLine,
    regulators: splitTextValue(values.regulatorsText),
    reviewOwner: values.reviewOwner,
    evidenceRequired: !!values.evidenceRequired,
  };
}

function mapPolicyToForm(policy: SecurityPolicy, bindings: SecurityBinding[]): PolicyEditorValues {
  const config = policy.policyConfig || {};
  const advancedKeys = policy.domainCode === 'runtime'
    ? RUNTIME_CONFIG_KEYS
    : policy.domainCode === 'data'
      ? DATA_CONFIG_KEYS
      : RISK_CONFIG_KEYS;
  const selector = policy.targetSelector || {};
  return {
    policyCode: policy.policyCode,
    policyName: policy.policyName,
    policyType: policy.policyType,
    policyScope: (policy.policyScope || 'tenant') as SecurityScope,
    enforcementMode: (policy.enforcementMode || 'warn') as 'audit' | 'warn' | 'block',
    riskLevel: (policy.riskLevel || 'medium') as 'low' | 'medium' | 'high' | 'critical',
    controlPointsText: joinTextValue(policy.controlPoints),
    tagsText: joinTextValue(policy.tags),
    description: policy.description,
    bindingDrafts: normalizePolicyBindings(policy, bindings),
    advancedSelectorText: stringifyJson(omitKeys(selector, ['scope', 'tenantScope', 'agentIds', 'workflowTemplateIds', 'workspaceIds', 'resolvedTargets', 'targetCount'])),
    advancedConfigText: stringifyJson(omitKeys(config, advancedKeys)),
    keywordsText: joinTextValue(config.keywords as string[] | undefined),
    regexPatternsText: joinTextValue(config.regexPatterns as string[] | undefined),
    forbiddenToolsText: joinTextValue(config.forbiddenTools as string[] | undefined),
    forbiddenCommandsText: joinTextValue(config.forbiddenCommands as string[] | undefined),
    maxLength: typeof config.maxLength === 'number' ? config.maxLength : undefined,
    reviewRequired: !!config.reviewRequired,
    hitAction: (config.hitAction as SecurityDecision | undefined) || undefined,
    sessionTtlMinutes: typeof config.sessionTtlMinutes === 'number' ? config.sessionTtlMinutes : undefined,
    maxSessions: typeof config.maxSessions === 'number' ? config.maxSessions : undefined,
    transportProtocol: config.transportProtocol as string | undefined,
    storageAlgorithm: config.storageAlgorithm as string | undefined,
    encryptStorage: !!config.encryptStorage,
    encryptTransport: !!config.encryptTransport,
    forbidMemoryWrite: !!config.forbidMemoryWrite,
    requireMaskedOutput: !!config.requireMaskedOutput,
    allowedRegionsText: joinTextValue(config.allowedRegions as string[] | undefined),
    tenantQps: typeof config.tenantQps === 'number' ? config.tenantQps : undefined,
    userDailyQuota: typeof config.userDailyQuota === 'number' ? config.userDailyQuota : undefined,
    temporaryBanMinutes: typeof config.temporaryBanMinutes === 'number' ? config.temporaryBanMinutes : undefined,
    anomalyThreshold: typeof config.anomalyThreshold === 'number' ? config.anomalyThreshold : undefined,
    auditRetentionDays: typeof config.auditRetentionDays === 'number' ? config.auditRetentionDays : undefined,
    ipAllowListText: joinTextValue(config.ipAllowList as string[] | undefined),
    ipBlockListText: joinTextValue(config.ipBlockList as string[] | undefined),
    highRiskTagsText: joinTextValue(config.highRiskTags as string[] | undefined),
    autoEscalate: !!config.autoEscalate,
  };
}

function mapRulePackToForm(rulePack: SecurityRulePack, bindings: SecurityBinding[]): RulePackEditorValues {
  const config = rulePack.packConfig || {};
  return {
    packCode: rulePack.packCode,
    packName: rulePack.packName,
    industryCode: rulePack.industryCode,
    defaultAction: (rulePack.defaultAction || 'warn') as 'warn' | 'block' | 'pause',
    description: rulePack.description,
    businessLine: config.businessLine as string | undefined,
    regulatorsText: joinTextValue(config.regulators as string[] | undefined),
    reviewOwner: config.reviewOwner as string | undefined,
    evidenceRequired: !!config.evidenceRequired,
    advancedConfigText: stringifyJson(omitKeys(config, PACK_CONFIG_KEYS)),
    bindingDrafts: bindings.map((item, index) => ({
      bindingType: item.bindingType,
      targetId: item.targetId,
      targetName: item.targetName,
      priority: item.priority ?? (index + 1) * 10,
      bindingConfigText: stringifyJson(item.bindingConfig),
    })),
    items: (rulePack.items || []).map((item) => ({
      itemCode: item.itemCode,
      itemName: item.itemName,
      ruleSource: item.ruleSource,
      ruleClause: item.ruleClause,
      riskLevel: item.riskLevel,
      action: item.action,
      matchType: item.matchType,
      matchContent: item.matchContent,
      sortOrder: item.sortOrder,
      enabled: item.enabled,
      itemConfigText: stringifyJson(item.itemConfig),
    })),
  };
}

function SecurityDecisionAlert({ decision }: { decision?: SecurityCheckDecisionResult | null }) {
  if (!decision) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无命中结果" />;
  }
  const type = decision.decision === 'block' ? 'error' : decision.decision === 'pause' ? 'warning' : decision.decision === 'warn' ? 'warning' : 'success';
  const matchedList = [...(decision.matchedPolicies || []), ...(decision.matchedRulePacks || [])];
  return (
    <Space orientation="vertical" style={{ width: '100%' }} size={12}>
      <Alert
        type={type}
        showIcon
        title={`决策结果: ${decision.decision || 'allow'}`}
        description={decision.message || decision.userActionTip || '未返回详细说明'}
      />
      {decision.userActionTip ? <Text type="secondary">给用户的提示: {decision.userActionTip}</Text> : null}
      {decision.adminActionTip ? <Text type="secondary">给管理员的建议: {decision.adminActionTip}</Text> : null}
      {decision.incidentId ? <Text copyable={{ text: decision.incidentId }}>事件单: {decision.incidentId}</Text> : null}
      {decision.traceId ? <Text copyable={{ text: decision.traceId }}>链路ID: {decision.traceId}</Text> : null}
      <Space wrap>
        {matchedList.map((item) => (
          <Tag color={decisionColor(item.action)} key={`${item.sourceType}-${item.sourceCode}-${item.itemCode || 'base'}`}>
            {item.sourceName || item.sourceCode}
            {item.itemName ? ` / ${item.itemName}` : ''}
          </Tag>
        ))}
      </Space>
    </Space>
  );
}

export default function SecurityComplianceCenter() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  const { token } = theme.useToken();
  const tenantId = useAuthStore((state) => state.tenantId);
  const activeTab = getActiveTab(location.pathname);
  const activeMeta = TAB_META[activeTab];

  const [policyKeyword, setPolicyKeyword] = useState('');
  const [policyStatus, setPolicyStatus] = useState<string>();
  const [policyRiskLevel, setPolicyRiskLevel] = useState<string>();
  const [auditKeyword, setAuditKeyword] = useState('');
  const [auditEventType, setAuditEventType] = useState<string>();
  const [auditStatus, setAuditStatus] = useState<string>();
  const [incidentKeyword, setIncidentKeyword] = useState('');
  const [incidentStatus, setIncidentStatus] = useState<string>();
  const [packKeyword, setPackKeyword] = useState('');
  const [packStatus, setPackStatus] = useState<string>();
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>();
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>();
  const [selectedRulePackId, setSelectedRulePackId] = useState<string>();
  const [policyEditorOpen, setPolicyEditorOpen] = useState(false);
  const [policyEditorDomain, setPolicyEditorDomain] = useState<'runtime' | 'data' | 'risk'>('runtime');
  const [editingPolicyId, setEditingPolicyId] = useState<string>();
  const [policyEditorLoading, setPolicyEditorLoading] = useState(false);
  const [rulePackEditorOpen, setRulePackEditorOpen] = useState(false);
  const [editingRulePackId, setEditingRulePackId] = useState<string>();
  const [rulePackEditorLoading, setRulePackEditorLoading] = useState(false);
  const [incidentActionType, setIncidentActionType] = useState<'assign' | 'resolve' | 'ignore' | 'escalate'>();
  const [incidentActionOpen, setIncidentActionOpen] = useState(false);
  const [runtimeDecision, setRuntimeDecision] = useState<SecurityCheckDecisionResult | null>(null);
  const [sandboxCommandInput, setSandboxCommandInput] = useState('');

  const [policyForm] = Form.useForm<PolicyEditorValues>();
  const [incidentActionForm] = Form.useForm<IncidentActionValues>();
  const [rulePackForm] = Form.useForm<RulePackEditorValues>();
  const [runtimeCheckForm] = Form.useForm<RuntimeCheckFormValues>();

  const watchedPolicyScope = Form.useWatch('policyScope', policyForm) || 'tenant';

  const overviewQuery = useQuery({
    queryKey: ['security', 'overview'],
    queryFn: async () => (await fetchSecurityOverview()).data,
  });

  const targetOptionsQuery = useQuery({
    queryKey: ['security', 'target-options'],
    queryFn: async () => (await fetchSecurityTargetOptions()).data,
  });
  const tenantRuntimePolicyQuery = useTenantRuntimePolicy(tenantId);
  const updateTenantRuntimePolicyMutation = useUpdateTenantRuntimePolicy(tenantId);

  const policyDomain = activeTab === 'runtime' || activeTab === 'data' || activeTab === 'risk' ? activeTab : undefined;

  const policiesQuery = useQuery({
    queryKey: ['security', 'policies', policyDomain, policyKeyword, policyStatus, policyRiskLevel],
    queryFn: async () => (await fetchSecurityPolicies({
      page: 1,
      size: 50,
      domainCode: policyDomain,
      keyword: policyKeyword || undefined,
      status: policyStatus,
      riskLevel: policyRiskLevel,
    })).data,
    enabled: !!policyDomain,
  });

  const auditsQuery = useQuery({
    queryKey: ['security', 'audits', activeTab, auditKeyword, auditEventType, auditStatus],
    queryFn: async () => (await fetchSecurityAuditEvents({
      page: 1,
      size: activeTab === 'overview' ? 8 : 20,
      domainCode: activeTab === 'risk' ? 'risk' : undefined,
      keyword: auditKeyword || undefined,
      eventType: auditEventType,
      eventStatus: auditStatus,
    })).data,
    enabled: activeTab === 'overview' || activeTab === 'risk',
  });

  const incidentsQuery = useQuery({
    queryKey: ['security', 'incidents', incidentKeyword, incidentStatus],
    queryFn: async () => (await fetchSecurityIncidents({
      page: 1,
      size: 30,
      keyword: incidentKeyword || undefined,
      status: incidentStatus,
    })).data,
    enabled: activeTab === 'risk' || activeTab === 'overview',
  });

  const rulePacksQuery = useQuery({
    queryKey: ['security', 'rule-packs', packKeyword, packStatus],
    queryFn: async () => (await fetchSecurityRulePacks({
      page: 1,
      size: 30,
      keyword: packKeyword || undefined,
      status: packStatus,
    })).data,
    enabled: activeTab === 'industry' || activeTab === 'overview',
  });

  const policyDetailQuery = useQuery({
    queryKey: ['security', 'policy-detail', selectedPolicyId],
    queryFn: async () => (await fetchSecurityPolicyDetail(selectedPolicyId!)).data,
    enabled: !!selectedPolicyId,
  });

  const policyVersionsQuery = useQuery({
    queryKey: ['security', 'policy-versions', selectedPolicyId],
    queryFn: async () => (await fetchSecurityPolicyVersions(selectedPolicyId!)).data,
    enabled: !!selectedPolicyId,
  });

  const policyBindingsQuery = useQuery({
    queryKey: ['security', 'policy-bindings', selectedPolicyId],
    queryFn: async () => (await fetchSecurityPolicyBindings(selectedPolicyId!)).data,
    enabled: !!selectedPolicyId,
  });

  const incidentDetailQuery = useQuery({
    queryKey: ['security', 'incident-detail', selectedIncidentId],
    queryFn: async () => (await fetchSecurityIncidentDetail(selectedIncidentId!)).data,
    enabled: !!selectedIncidentId,
  });

  const incidentActionsQuery = useQuery({
    queryKey: ['security', 'incident-actions', selectedIncidentId],
    queryFn: async () => (await fetchSecurityIncidentActions(selectedIncidentId!)).data,
    enabled: !!selectedIncidentId,
  });

  const traceAuditsQuery = useQuery({
    queryKey: ['security', 'incident-trace', incidentDetailQuery.data?.traceId],
    queryFn: async () => (await fetchSecurityAuditEventsByTrace(incidentDetailQuery.data!.traceId)).data,
    enabled: !!incidentDetailQuery.data?.traceId,
  });

  const rulePackDetailQuery = useQuery({
    queryKey: ['security', 'rule-pack-detail', selectedRulePackId],
    queryFn: async () => (await fetchSecurityRulePackDetail(selectedRulePackId!)).data,
    enabled: !!selectedRulePackId,
  });

  const rulePackBindingsQuery = useQuery({
    queryKey: ['security', 'rule-pack-bindings', selectedRulePackId],
    queryFn: async () => (await fetchSecurityRulePackBindings(selectedRulePackId!)).data,
    enabled: !!selectedRulePackId,
  });

  useEffect(() => {
    const next = policiesQuery.data?.records?.[0]?.id;
    if (next && !selectedPolicyId) {
      setSelectedPolicyId(next);
    }
  }, [policiesQuery.data?.records, selectedPolicyId]);

  useEffect(() => {
    const records = incidentsQuery.data?.records ?? [];
    if (records.length === 0) {
      if (selectedIncidentId) {
        setSelectedIncidentId(undefined);
      }
      return;
    }
    if (!selectedIncidentId || !records.some((item) => item.id === selectedIncidentId)) {
      setSelectedIncidentId(records[0].id);
    }
  }, [incidentsQuery.data?.records, selectedIncidentId]);

  useEffect(() => {
    const next = rulePacksQuery.data?.records?.[0]?.id;
    if (next && !selectedRulePackId) {
      setSelectedRulePackId(next);
    }
  }, [rulePacksQuery.data?.records, selectedRulePackId]);

  const invalidateSecurityQueries = () => {
    void queryClient.invalidateQueries({ queryKey: ['security'] });
  };

  const saveTenantRuntimePolicy = async (patch: Partial<TenantRuntimePolicyUpdateDTO>) => {
    const current = tenantRuntimePolicyQuery.data;
    if (!tenantId || !current) {
      message.warning('当前租户运行时策略尚未加载完成');
      return;
    }
    try {
      await updateTenantRuntimePolicyMutation.mutateAsync({
        workspaceRootPath: current.workspaceRootPath,
        maxWorkspaceGb: current.maxWorkspaceGb,
        maxExecutionMinutes: current.maxExecutionMinutes,
        sandboxProfile: current.sandboxProfile || 'standard',
        allowLocalImport: current.allowLocalImport,
        sandboxAllowedCommands: current.sandboxAllowedCommands || [],
        ...patch,
      });
      message.success('沙箱配置已更新');
    } catch {
      message.error('沙箱配置更新失败');
    }
  };

  const handleAddSandboxCommand = async () => {
    const command = sandboxCommandInput.trim();
    const current = tenantRuntimePolicyQuery.data;
    if (!command) {
      message.warning('请输入命令名称');
      return;
    }
    if (!/^[A-Za-z0-9._-]+$/.test(command)) {
      message.warning('命令仅支持字母、数字、点、下划线和中划线');
      return;
    }
    if (!current) {
      message.warning('当前租户运行时策略尚未加载完成');
      return;
    }
    const nextCommands = Array.from(new Set([...(current.sandboxAllowedCommands || []), command]));
    await saveTenantRuntimePolicy({ sandboxAllowedCommands: nextCommands });
    setSandboxCommandInput('');
  };

  const handleRemoveSandboxCommand = async (command: string) => {
    const current = tenantRuntimePolicyQuery.data;
    if (!current) {
      message.warning('当前租户运行时策略尚未加载完成');
      return;
    }
    const nextCommands = (current.sandboxAllowedCommands || []).filter((item) => item !== command);
    await saveTenantRuntimePolicy({ sandboxAllowedCommands: nextCommands });
  };

  const runtimeCheckMutation = useMutation({
    mutationFn: runSecurityRuntimeCheck,
    onSuccess: (res) => {
      setRuntimeDecision(res.data);
    },
  });

  const createOrUpdatePolicyMutation = useMutation({
    mutationFn: async (params: { id?: string; domain: 'runtime' | 'data' | 'risk'; values: PolicyEditorValues }) => {
      const bindings = (params.values.bindingDrafts || []).filter((item) => item.bindingType === 'tenant' || item.targetId);
      const payload: SecurityPolicySaveDTO = {
        policyCode: params.values.policyCode,
        policyName: params.values.policyName,
        domainCode: params.domain,
        policyType: params.values.policyType,
        policyScope: params.values.policyScope,
        enforcementMode: params.values.enforcementMode,
        riskLevel: params.values.riskLevel,
        controlPoints: splitTextValue(params.values.controlPointsText),
        tags: splitTextValue(params.values.tagsText),
        targetSelector: buildPolicyTargetSelector(params.values, bindings, params.domain),
        policyConfig: buildPolicyConfig(params.domain, params.values),
        description: params.values.description,
      };

      const policy = params.id
        ? (await updateSecurityPolicy(params.id, payload)).data
        : (await createSecurityPolicy(payload)).data;

      const bindingPayload = {
        bindings: bindings.map((item, index) => ({
          bindingType: params.values.policyScope,
          targetId: params.values.policyScope === 'tenant' ? undefined : item.targetId,
          targetName: params.values.policyScope === 'tenant'
            ? '当前租户'
            : resolveTargetName(targetOptionsQuery.data, params.values.policyScope, item.targetId),
          priority: item.priority ?? (index + 1) * 10,
          bindingConfig: parseJsonText(item.bindingConfigText),
        })),
      };
      await saveSecurityPolicyBindings(policy.id, bindingPayload);
      return policy;
    },
    onSuccess: (policy) => {
      message.success(editingPolicyId ? '安全策略已更新' : '安全策略已创建');
      setPolicyEditorOpen(false);
      setEditingPolicyId(undefined);
      setSelectedPolicyId(policy.id);
      invalidateSecurityQueries();
    },
  });

  const togglePolicyMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) => toggleSecurityPolicy(id, { status }),
    onSuccess: () => {
      message.success('策略状态已更新');
      invalidateSecurityQueries();
    },
  });

  const deletePolicyMutation = useMutation({
    mutationFn: deleteSecurityPolicy,
    onSuccess: () => {
      message.success('策略已删除');
      setSelectedPolicyId(undefined);
      invalidateSecurityQueries();
    },
  });

  const publishPolicyMutation = useMutation({
    mutationFn: publishSecurityPolicy,
    onSuccess: () => {
      message.success('策略已发布');
      invalidateSecurityQueries();
    },
  });

  const incidentActionMutation = useMutation({
    mutationFn: async (params: { type: 'assign' | 'resolve' | 'ignore' | 'escalate'; id: string; data: IncidentActionValues }) => {
      if (params.type === 'assign') return assignSecurityIncident(params.id, params.data);
      if (params.type === 'resolve') return resolveSecurityIncident(params.id, params.data);
      if (params.type === 'ignore') return ignoreSecurityIncident(params.id, params.data);
      return escalateSecurityIncident(params.id, params.data);
    },
    onSuccess: () => {
      message.success('事件已更新');
      setIncidentActionOpen(false);
      setIncidentActionType(undefined);
      incidentActionForm.resetFields();
      invalidateSecurityQueries();
    },
  });

  const resumeIncidentMutation = useMutation({
    mutationFn: resumeSecurityIncidentResource,
    onSuccess: () => {
      message.success('关联业务流程已恢复');
      invalidateSecurityQueries();
    },
  });

  const createOrUpdateRulePackMutation = useMutation({
    mutationFn: async (params: { id?: string; values: RulePackEditorValues }) => {
      const payload: SecurityRulePackSaveDTO = {
        packCode: params.values.packCode,
        packName: params.values.packName,
        industryCode: params.values.industryCode,
        defaultAction: params.values.defaultAction,
        description: params.values.description,
        packConfig: buildRulePackConfig(params.values),
        items: (params.values.items || []).map((item): SecurityRuleItemSaveDTO => ({
          itemCode: item.itemCode,
          itemName: item.itemName,
          ruleSource: item.ruleSource,
          ruleClause: item.ruleClause,
          riskLevel: item.riskLevel,
          action: item.action,
          matchType: item.matchType,
          matchContent: item.matchContent,
          sortOrder: item.sortOrder,
          enabled: item.enabled !== false,
          itemConfig: parseJsonText(item.itemConfigText),
        })),
      };
      const rulePack = params.id
        ? (await updateSecurityRulePack(params.id, payload)).data
        : (await createSecurityRulePack(payload)).data;

      const bindings = (params.values.bindingDrafts || []).filter((item) => item.bindingType === 'tenant' || item.targetId);
      await saveSecurityRulePackBindings(rulePack.id, {
        bindings: bindings.map((item, index) => ({
          bindingType: item.bindingType || 'tenant',
          targetId: item.bindingType === 'tenant' ? undefined : item.targetId,
          targetName: item.bindingType === 'tenant'
            ? '当前租户'
            : resolveTargetName(targetOptionsQuery.data, item.bindingType, item.targetId),
          priority: item.priority ?? (index + 1) * 10,
          bindingConfig: parseJsonText(item.bindingConfigText),
        })),
      });
      return rulePack;
    },
    onSuccess: (pack) => {
      message.success(editingRulePackId ? '规则包已更新' : '规则包已创建');
      setRulePackEditorOpen(false);
      setEditingRulePackId(undefined);
      setSelectedRulePackId(pack.id);
      invalidateSecurityQueries();
    },
  });

  const toggleRulePackMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => toggleSecurityRulePack(id, { status }),
    onSuccess: () => {
      message.success('规则包状态已更新');
      invalidateSecurityQueries();
    },
  });

  const openCreatePolicyDrawer = (domain: 'runtime' | 'data' | 'risk') => {
    setPolicyEditorDomain(domain);
    setEditingPolicyId(undefined);
    policyForm.setFieldsValue({
      policyCode: '',
      policyName: '',
      policyType: POLICY_TYPE_OPTIONS[domain][0]?.value,
      policyScope: 'tenant',
      enforcementMode: 'warn',
      riskLevel: domain === 'runtime' ? 'critical' : 'high',
      controlPointsText: '',
      tagsText: domain,
      description: '',
      bindingDrafts: [{ bindingType: 'tenant', priority: 10, bindingConfigText: '{\n}' }],
      advancedSelectorText: '{\n}',
      advancedConfigText: '{\n}',
    });
    setPolicyEditorOpen(true);
  };

  const openEditPolicyDrawer = async (policy: SecurityPolicy) => {
    setPolicyEditorDomain(policy.domainCode as 'runtime' | 'data' | 'risk');
    setEditingPolicyId(policy.id);
    setPolicyEditorLoading(true);
    try {
      const [detailRes, bindingsRes] = await Promise.all([
        fetchSecurityPolicyDetail(policy.id),
        fetchSecurityPolicyBindings(policy.id),
      ]);
      policyForm.setFieldsValue(mapPolicyToForm(detailRes.data, bindingsRes.data));
      setPolicyEditorOpen(true);
    } catch {
      message.error('加载策略详情失败');
    } finally {
      setPolicyEditorLoading(false);
    }
  };

  const openCreateRulePackDrawer = () => {
    setEditingRulePackId(undefined);
    rulePackForm.setFieldsValue({
      packCode: '',
      packName: '',
      industryCode: 'finance',
      defaultAction: 'block',
      description: '',
      regulatorsText: '',
      advancedConfigText: '{\n}',
      bindingDrafts: [{ bindingType: 'tenant', priority: 10, bindingConfigText: '{\n}' }],
      items: [
        {
          itemCode: '',
          itemName: '',
          riskLevel: 'high',
          action: 'block',
          matchType: 'contains',
          enabled: true,
          sortOrder: 10,
          itemConfigText: '{\n}',
        },
      ],
    });
    setRulePackEditorOpen(true);
  };

  const openEditRulePackDrawer = async (rulePack: SecurityRulePack) => {
    setEditingRulePackId(rulePack.id);
    setRulePackEditorLoading(true);
    try {
      const [detailRes, bindingsRes] = await Promise.all([
        fetchSecurityRulePackDetail(rulePack.id),
        fetchSecurityRulePackBindings(rulePack.id),
      ]);
      rulePackForm.setFieldsValue(mapRulePackToForm(detailRes.data, bindingsRes.data));
      setRulePackEditorOpen(true);
    } catch {
      message.error('加载规则包详情失败');
    } finally {
      setRulePackEditorLoading(false);
    }
  };

  const handleSubmitPolicy = async (values: PolicyEditorValues) => {
    try {
      await createOrUpdatePolicyMutation.mutateAsync({ id: editingPolicyId, domain: policyEditorDomain, values });
    } catch (error) {
      message.error(error instanceof Error ? error.message : '请输入合法的 JSON 配置');
    }
  };

  const handleSubmitRulePack = async (values: RulePackEditorValues) => {
    try {
      await createOrUpdateRulePackMutation.mutateAsync({ id: editingRulePackId, values });
    } catch (error) {
      message.error(error instanceof Error ? error.message : '请输入合法的 JSON 配置');
    }
  };

  const policyColumns: TableColumnsType<SecurityPolicy> = [
    {
      title: '策略',
      dataIndex: 'policyName',
      ellipsis: true,
      render: (_value, record) => (
        <Space orientation="vertical" size={2}>
          <Space>
            <Text strong ellipsis={{ tooltip: record.policyName }} style={{ maxWidth: 160 }}>{record.policyName}</Text>
            {record.isBuiltin ? <Tag color="purple">内置</Tag> : null}
          </Space>
          <Text type="secondary" ellipsis={{ tooltip: record.policyCode }} style={{ maxWidth: 180 }}>{record.policyCode}</Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'policyType',
      width: 120,
      ellipsis: true,
    },
    {
      title: '风险',
      dataIndex: 'riskLevel',
      width: 90,
      render: (value) => <Tag color={riskColor(value)} style={tableTagNoWrapStyle}>{value}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (value) => <Tag color={value === 'active' ? 'green' : value === 'draft' ? 'blue' : value === 'inactive' ? 'default' : 'purple'} style={tableTagNoWrapStyle}>{value}</Tag>,
    },
    {
      title: '动作',
      key: 'action',
      width: 180,
      render: (_value, record) => (
        <Space size={4} wrap>
          <Button size="small" type="link" onClick={() => setSelectedPolicyId(record.id)}>
            查看
          </Button>
          <Button size="small" type="link" onClick={() => void openEditPolicyDrawer(record)}>
            编辑
          </Button>
          {record.status === 'draft' ? (
            <Button size="small" type="link" onClick={() => publishPolicyMutation.mutate(record.id)}>
              发布
            </Button>
          ) : (
            <Button
              size="small"
              type="link"
              onClick={() => togglePolicyMutation.mutate({ id: record.id, status: record.status === 'active' ? 'inactive' : 'active' })}
            >
              {record.status === 'active' ? '停用' : '启用'}
            </Button>
          )}
          {!record.isBuiltin ? (
            <Popconfirm title="确认删除该策略吗？" onConfirm={() => deletePolicyMutation.mutate(record.id)}>
              <Button size="small" type="link" danger>
                删除
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  const incidentColumns: TableColumnsType<SecurityIncident> = [
    {
      title: '事件',
      dataIndex: 'eventTitle',
      render: (_value, record) => (
        <Space orientation="vertical" size={2}>
          <Text strong>{record.eventTitle}</Text>
          <Text type="secondary">{record.incidentNo}</Text>
        </Space>
      ),
    },
    {
      title: '决策',
      dataIndex: 'decision',
      width: 90,
      render: (value) => <Tag color={decisionColor(value)} style={tableTagNoWrapStyle}>{value || '-'}</Tag>,
    },
    {
      title: '等级',
      dataIndex: 'riskLevel',
      width: 90,
      render: (value) => <Tag color={riskColor(value)} style={tableTagNoWrapStyle}>{value}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value) => <Tag color={value === 'resolved' ? 'green' : value === 'ignored' ? 'default' : value === 'escalated' ? 'red' : 'processing'} style={tableTagNoWrapStyle}>{value}</Tag>,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (value) => formatDateTime(value),
    },
  ];

  const auditColumns: TableColumnsType<SecurityAuditEvent> = [
    {
      title: '标题',
      dataIndex: 'eventTitle',
      render: (_value, record) => (
        <Space orientation="vertical" size={2}>
          <Text strong>{record.eventTitle}</Text>
          <Text type="secondary">{record.traceId}</Text>
        </Space>
      ),
    },
    {
      title: '事件',
      dataIndex: 'eventType',
      width: 150,
      render: (value) => <span style={tableCellNoWrapStyle}>{value || '-'}</span>,
    },
    {
      title: '状态',
      dataIndex: 'eventStatus',
      width: 100,
      render: (value) => <Tag color={auditColor(value)} style={tableTagNoWrapStyle}>{value}</Tag>,
    },
    {
      title: '域',
      dataIndex: 'domainCode',
      width: 110,
      render: (value) => <span style={tableCellNoWrapStyle}>{domainLabel(value)}</span>,
    },
    {
      title: '时间',
      dataIndex: 'occurredAt',
      width: 180,
      render: (value) => formatDateTime(value),
    },
  ];

  const rulePackColumns: TableColumnsType<SecurityRulePack> = [
    {
      title: '规则包',
      dataIndex: 'packName',
      render: (_value, record) => (
        <Space orientation="vertical" size={2}>
          <Space>
            <Text strong>{record.packName}</Text>
            {record.isBuiltin ? <Tag color="purple">内置</Tag> : null}
          </Space>
          <Text type="secondary">{record.packCode}</Text>
        </Space>
      ),
    },
    {
      title: '行业',
      dataIndex: 'industryCode',
      width: 100,
      render: (value) => <span style={tableCellNoWrapStyle}>{value || '-'}</span>,
    },
    {
      title: '默认动作',
      dataIndex: 'defaultAction',
      width: 100,
      render: (value) => <Tag color={decisionColor(value)} style={tableTagNoWrapStyle}>{value}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value) => <Tag color={value === 'active' ? 'green' : value === 'draft' ? 'blue' : value === 'inactive' ? 'default' : 'purple'} style={tableTagNoWrapStyle}>{value}</Tag>,
    },
    {
      title: '动作',
      key: 'action',
      width: 180,
      render: (_value, record) => (
        <Space size={4}>
          <Button size="small" type="link" onClick={() => setSelectedRulePackId(record.id)}>
            查看
          </Button>
          <Button size="small" type="link" onClick={() => void openEditRulePackDrawer(record)}>
            编辑
          </Button>
          <Button
            size="small"
            type="link"
            onClick={() => toggleRulePackMutation.mutate({ id: record.id, status: record.status === 'active' ? 'inactive' : 'active' })}
          >
            {record.status === 'active' ? '停用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  const domainStats = useMemo(() => {
    const source = overviewQuery.data?.domainStats ?? [];
    return source.reduce<Record<string, { totalPolicies: number; activePolicies: number; blockedEvents24h: number }>>((acc, item) => {
      acc[item.domainCode] = item;
      return acc;
    }, {});
  }, [overviewQuery.data?.domainStats]);

  const policyDetail = policyDetailQuery.data;
  const policyVersions = policyVersionsQuery.data ?? [];
  const policyBindings = policyBindingsQuery.data ?? [];
  const incidentDetail = incidentDetailQuery.data;
  const incidentActions = incidentActionsQuery.data ?? [];
  const traceAudits = traceAuditsQuery.data ?? [];
  const rulePackDetail = rulePackDetailQuery.data;
  const rulePackBindings = rulePackBindingsQuery.data ?? [];

  const domainTabs: TabsProps['items'] = [
    { key: 'overview', label: '总览' },
    { key: 'runtime', label: '运行时防护' },
    { key: 'data', label: '数据与会话' },
    { key: 'risk', label: '风控与审计' },
    { key: 'industry', label: '行业合规' },
  ];

  const overview = overviewQuery.data as SecurityOverview | undefined;

  const renderStackList = <T,>({
    items,
    emptyDescription,
    getKey,
    renderItem,
  }: {
    items: T[];
    emptyDescription: string;
    getKey: (item: T, index: number) => string | number;
    renderItem: (item: T, index: number) => ReactNode;
  }) => {
    if (!items.length) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription} />;
    }

    return (
      <div style={{ width: '100%' }}>
        {items.map((item, index) => (
          <div
            key={getKey(item, index)}
            style={{
              padding: '12px 0',
              borderBottom: index === items.length - 1 ? 'none' : `1px solid ${token.colorSplit}`,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  };

  const renderHero = () => (
    <Card
      variant="borderless"
      style={{
        marginBottom: 24,
        borderRadius: 24,
        overflow: 'hidden',
        background: `linear-gradient(135deg, rgba(255,255,255,0.98) 0%, ${activeMeta.color}16 52%, ${activeMeta.color}10 100%)`,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Row gutter={[24, 24]} align="middle">
        <Col xs={24} xl={16}>
          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            <Space wrap>
              <Tag color="processing">策略执行链已接入</Tag>
              <Tag color="gold">主流程安全守卫在线</Tag>
            </Space>
            <Space align="start" size={14}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  display: 'grid',
                  placeItems: 'center',
                  background: `${activeMeta.color}18`,
                  color: activeMeta.color,
                  fontSize: 24,
                }}
              >
                {activeMeta.icon}
              </div>
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  {activeMeta.title}
                </Title>
                <Paragraph style={{ margin: '8px 0 0', color: token.colorTextSecondary }}>
                  {activeMeta.description}
                </Paragraph>
              </div>
            </Space>
          </Space>
        </Col>
        <Col xs={24} xl={8}>
          <Row gutter={[12, 12]}>
            <Col span={12}>
              <Card size="small" styles={{ body: { padding: 16 } }}>
                <Statistic title="启用策略" value={overview?.activePolicies ?? 0} prefix={<CheckCircleOutlined />} />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" styles={{ body: { padding: 16 } }}>
                <Statistic title="未结事件" value={overview?.openIncidents ?? 0} prefix={<AlertOutlined />} />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" styles={{ body: { padding: 16 } }}>
                <Statistic title="规则包" value={overview?.activeRulePacks ?? 0} prefix={<GlobalOutlined />} />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" styles={{ body: { padding: 16 } }}>
                <Statistic title="24h 拦截" value={overview?.blockedEvents24h ?? 0} prefix={<PauseCircleOutlined />} />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );

  const renderOverview = () => {
    const incidents = incidentsQuery.data?.records ?? overview?.recentIncidents ?? [];
    const blockedExecutions = overview?.blockedEvents24h ?? 0;
    const manualRecoveryCount = incidents.filter((item) => item.decision === 'pause' || item.status === 'assigned').length;
    const policyGapCount = Math.max((overview?.totalPolicies ?? 0) - (overview?.activePolicies ?? 0), 0);

    return (
      <Space orientation="vertical" style={{ width: '100%' }} size="large">
        <Row gutter={[16, 16]}>
          <Col xs={12} xl={6}>
            <Card><Statistic title="未结高危" value={incidents.filter((item) => item.riskLevel === 'critical' || item.riskLevel === 'high').length} /></Card>
          </Col>
          <Col xs={12} xl={6}>
            <Card><Statistic title="被阻断执行" value={blockedExecutions} /></Card>
          </Col>
          <Col xs={12} xl={6}>
            <Card><Statistic title="待人工恢复" value={manualRecoveryCount} /></Card>
          </Col>
          <Col xs={12} xl={6}>
            <Card><Statistic title="策略覆盖缺口" value={policyGapCount} /></Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card title="风险处置队列" style={{ borderRadius: 8 }}>
              <SecurityRiskQueue
                incidents={incidents}
                onOpen={(item) => {
                  setSelectedIncidentId(item.id);
                  navigate('/security-compliance/risk');
                }}
                onRunSimulation={() => navigate('/security-compliance/runtime')}
              />
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="证据链" style={{ borderRadius: 8 }}>
              <SecurityEvidencePanel events={auditsQuery.data?.records ?? overview?.recentAuditEvents ?? []} />
            </Card>
          </Col>
        </Row>

        <Card title="策略覆盖摘要" style={{ borderRadius: 8 }}>
          <SecurityPolicySummary overview={overview} onConfigureRuntime={() => navigate('/security-compliance/runtime')} />
        </Card>
      </Space>
    );
  };

  const renderPolicyDetail = (policy: SecurityPolicy | undefined, versions: SecurityPolicyVersion[], bindings: SecurityBinding[]) => {
    if (!policy) {
      return <Empty description="请选择左侧策略查看详情" />;
    }
    return (
      <Space orientation="vertical" style={{ width: '100%' }} size="large">
        <Card
          title={policy.policyName}
          extra={<Tag color={policy.status === 'active' ? 'green' : policy.status === 'draft' ? 'blue' : 'default'}>{policy.status}</Tag>}
          style={{ borderRadius: 20 }}
        >
          <Descriptions column={2} size="small">
            <Descriptions.Item label="策略编码">{policy.policyCode}</Descriptions.Item>
            <Descriptions.Item label="类型">{policy.policyType}</Descriptions.Item>
            <Descriptions.Item label="安全域">{domainLabel(policy.domainCode)}</Descriptions.Item>
            <Descriptions.Item label="生效范围">{scopeLabel(policy.policyScope)}</Descriptions.Item>
            <Descriptions.Item label="执行模式">{policy.enforcementMode}</Descriptions.Item>
            <Descriptions.Item label="风险等级">
              <Tag color={riskColor(policy.riskLevel)}>{policy.riskLevel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="版本">v{policy.version}</Descriptions.Item>
            <Descriptions.Item label="发布时间">{formatDateTime(policy.lastPublishedAt)}</Descriptions.Item>
          </Descriptions>
          <Divider />
          <Space orientation="vertical" size={8} style={{ width: '100%' }}>
            <Text strong>控制点</Text>
            <Space wrap>{(policy.controlPoints || []).map((item) => <Tag key={item}>{item}</Tag>)}</Space>
            <Text strong>标签</Text>
            <Space wrap>{(policy.tags || []).map((item) => <Tag key={item} color="blue">{item}</Tag>)}</Space>
            <Text strong>结构化配置</Text>
            <pre style={{ margin: 0, padding: 12, borderRadius: 12, background: token.colorFillAlter, whiteSpace: 'pre-wrap' }}>{stringifyJson(policy.policyConfig)}</pre>
          </Space>
        </Card>

        <Card title="策略版本" style={{ borderRadius: 20 }}>
          <Timeline
            items={versions.map((item) => ({
              color: item.versionNo === policy.version ? 'green' : 'blue',
              children: (
                <Space orientation="vertical" size={2}>
                  <Text strong>v{item.versionNo}</Text>
                  <Text type="secondary">{item.changeSummary || '发布快照'}</Text>
                  <Text type="secondary">{formatDateTime(item.publishedAt)}</Text>
                </Space>
              ),
            }))}
          />
        </Card>

        <Card title="绑定范围" style={{ borderRadius: 20 }}>
          {renderStackList({
            items: bindings,
            emptyDescription: '暂无绑定，默认按 targetSelector 生效',
            getKey: (item) => item.id,
            renderItem: (item) => (
              <Space orientation="vertical" size={2}>
                <Text strong>{scopeLabel(item.bindingType)}</Text>
                <Text type="secondary">{item.targetName || '当前租户'}</Text>
              </Space>
            ),
          })}
        </Card>
      </Space>
    );
  };

  const renderRuntimeWorkspace = () => (
    <Space orientation="vertical" style={{ width: '100%' }} size="large">
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title="运行时策略中心"
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openCreatePolicyDrawer('runtime')}>新增运行时策略</Button>}
            style={{ borderRadius: 20 }}
          >
            <Space wrap style={{ marginBottom: 16 }}>
              <Search placeholder="搜索策略名称或编码" allowClear onSearch={setPolicyKeyword} style={{ width: 220 }} />
              <Select placeholder="状态" allowClear style={{ width: 140 }} options={POLICY_STATUS_OPTIONS} onChange={setPolicyStatus} />
              <Select placeholder="风险等级" allowClear style={{ width: 140 }} options={RISK_LEVEL_OPTIONS} onChange={setPolicyRiskLevel} />
            </Space>
            <Table
              rowKey="id"
              size="small"
              dataSource={policiesQuery.data?.records ?? []}
              columns={policyColumns}
              pagination={false}
              scroll={{ x: 600 }}
              onRow={(record) => ({ onClick: () => setSelectedPolicyId(record.id) })}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无运行时策略" /> }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="运行时模拟检查" style={{ borderRadius: 20 }}>
            <Form
              form={runtimeCheckForm}
              layout="vertical"
              initialValues={{ scene: 'runtime', resourceType: 'security_policy' }}
              onFinish={(values) => {
                try {
                  runtimeCheckMutation.mutate({
                    scene: values.scene,
                    domainCode: 'runtime',
                    resourceType: values.resourceType,
                    resourceName: values.resourceName,
                    agentId: values.agentId,
                    workflowInstanceId: values.workflowInstanceId,
                    workflowNodeId: values.workflowNodeId,
                    workspaceId: values.workspaceId,
                    toolCode: values.toolCode,
                    tags: splitTextValue(values.tagsText),
                    content: values.content,
                    arguments: parseJsonText(values.argumentsText),
                    context: parseJsonText(values.contextText),
                  });
                } catch {
                  message.error('请输入合法的 JSON 参数');
                }
              }}
            >
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="场景" name="scene">
                    <Select options={[
                      { label: '通用运行时', value: 'runtime' },
                      { label: 'Agent 执行前', value: 'agent_execute' },
                      { label: '工作流启动前', value: 'workflow_start' },
                      { label: '工具执行前', value: 'tool_pre' },
                    ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="工具编码" name="toolCode">
                    <Input placeholder="例如 shell_command" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="内容" name="content">
                <TextArea rows={5} placeholder="输入待检查的 Prompt、工具参数或输出内容" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Agent ID" name="agentId">
                    <Input placeholder="可选" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="工作空间 ID" name="workspaceId">
                    <Input placeholder="可选" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="标签" name="tagsText">
                <Input placeholder="多个标签用逗号或换行分隔" />
              </Form.Item>
              <Form.Item label="工具参数 JSON" name="argumentsText">
                <TextArea rows={4} spellCheck={false} />
              </Form.Item>
              <Form.Item label="上下文 JSON" name="contextText">
                <TextArea rows={4} spellCheck={false} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={runtimeCheckMutation.isPending}>
                运行检查
              </Button>
            </Form>
            <Divider />
            <SecurityDecisionAlert decision={runtimeDecision} />
          </Card>
        </Col>
      </Row>
      <Card title="沙箱配置" style={{ borderRadius: 20 }} loading={tenantRuntimePolicyQuery.isLoading}>
        {!tenantId ? (
          <Alert type="warning" showIcon title="当前会话未识别租户，无法加载沙箱配置" />
        ) : (
          <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={10}>
                <Card size="small" title="运行模式">
                  <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                    <Select
                      value={tenantRuntimePolicyQuery.data?.sandboxProfile || 'standard'}
                      disabled={!tenantRuntimePolicyQuery.data || updateTenantRuntimePolicyMutation.isPending}
                      options={[
                        { label: 'STRICT', value: 'strict' },
                        { label: 'STANDARD', value: 'standard' },
                        { label: 'PERMISSIVE', value: 'permissive' },
                      ]}
                      onChange={(value) => {
                        void saveTenantRuntimePolicy({ sandboxProfile: value });
                      }}
                    />
                    <Space>
                      <Switch
                        checked={tenantRuntimePolicyQuery.data?.allowLocalImport ?? false}
                        disabled={!tenantRuntimePolicyQuery.data || updateTenantRuntimePolicyMutation.isPending}
                        onChange={(checked) => {
                          void saveTenantRuntimePolicy({ allowLocalImport: checked });
                        }}
                      />
                      <Typography.Text>允许本地导入</Typography.Text>
                    </Space>
                    <Alert
                      type="info"
                      showIcon
                      title="STRICT 禁止全部 bash，STANDARD 仅放行白名单，PERMISSIVE 允许更宽松的租户级控制。"
                    />
                  </Space>
                </Card>
              </Col>
              <Col xs={24} lg={14}>
                <Card size="small" title="当前基线">
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="工作区根目录">
                      {tenantRuntimePolicyQuery.data?.workspaceRootPath || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="最大工作区容量">
                      {tenantRuntimePolicyQuery.data?.maxWorkspaceGb ?? '-'} GB
                    </Descriptions.Item>
                    <Descriptions.Item label="最大执行时长">
                      {tenantRuntimePolicyQuery.data?.maxExecutionMinutes ?? '-'} 分钟
                    </Descriptions.Item>
                    <Descriptions.Item label="允许命令数">
                      {(tenantRuntimePolicyQuery.data?.sandboxAllowedCommands || []).length}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            <Card size="small" title="命令白名单">
              <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    value={sandboxCommandInput}
                    onChange={(event) => setSandboxCommandInput(event.target.value)}
                    onPressEnter={() => {
                      void handleAddSandboxCommand();
                    }}
                    placeholder="输入命令名，例如 ls、grep、git"
                    disabled={!tenantRuntimePolicyQuery.data || updateTenantRuntimePolicyMutation.isPending}
                  />
                  <Button
                    type="primary"
                    onClick={() => {
                      void handleAddSandboxCommand();
                    }}
                    loading={updateTenantRuntimePolicyMutation.isPending}
                  >
                    添加命令
                  </Button>
                </Space.Compact>
                {(tenantRuntimePolicyQuery.data?.sandboxAllowedCommands || []).length ? (
                  <Space wrap>
                    {(tenantRuntimePolicyQuery.data?.sandboxAllowedCommands || []).map((command) => (
                      <Tag
                        key={command}
                        closable
                        onClose={(event) => {
                          event.preventDefault();
                          void handleRemoveSandboxCommand(command);
                        }}
                      >
                        {command}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前未配置租户级命令白名单" />
                )}
              </Space>
            </Card>
          </Space>
        )}
      </Card>
      <Card title="策略详情与版本" style={{ borderRadius: 20 }}>
        {renderPolicyDetail(policyDetail, policyVersions, policyBindings)}
      </Card>
    </Space>
  );

  const renderDataWorkspace = () => (
    <Space orientation="vertical" style={{ width: '100%' }} size="large">
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title="数据与会话策略"
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openCreatePolicyDrawer('data')}>新增数据策略</Button>}
            style={{ borderRadius: 20 }}
          >
            <Space wrap style={{ marginBottom: 16 }}>
              <Search placeholder="搜索策略名称或编码" allowClear onSearch={setPolicyKeyword} style={{ width: 220 }} />
              <Select placeholder="状态" allowClear style={{ width: 140 }} options={POLICY_STATUS_OPTIONS} onChange={setPolicyStatus} />
              <Select placeholder="风险等级" allowClear style={{ width: 140 }} options={RISK_LEVEL_OPTIONS} onChange={setPolicyRiskLevel} />
            </Space>
            <Table
              rowKey="id"
              size="small"
              dataSource={policiesQuery.data?.records ?? []}
              columns={policyColumns}
              pagination={false}
              scroll={{ x: 600 }}
              onRow={(record) => ({ onClick: () => setSelectedPolicyId(record.id) })}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据策略" /> }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="生效基线" style={{ borderRadius: 20 }}>
            <Space orientation="vertical" style={{ width: '100%' }} size={12}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="当前启用策略">{domainStats['data']?.activePolicies ?? 0}</Descriptions.Item>
                <Descriptions.Item label="关键配置">{policyDetail?.domainCode === 'data' ? '查看右侧详情中的结构化配置' : '选择一条数据策略后查看'}</Descriptions.Item>
                <Descriptions.Item label="推荐接入点">Agent 对话输入、知识库导入、会话恢复、工作空间共享</Descriptions.Item>
                <Descriptions.Item label="命中后动作">支持告警、阻断，需人工复核时可切换为暂停</Descriptions.Item>
              </Descriptions>
              <div>
                <Text strong>建议的业务衔接</Text>
                <div style={{ marginTop: 12 }}>
                  {renderStackList({
                    items: [
                      '在知识回写前读取 forbidMemoryWrite，决定是否禁止将新内容落库。',
                      '在会话恢复时读取 sessionTtlMinutes 和 maxSessions，提示用户会话是否过期。',
                      '在数据导出或展示时读取 requireMaskedOutput，统一做脱敏提示。',
                    ],
                    emptyDescription: '暂无建议',
                    getKey: (_item, index) => index,
                    renderItem: (item) => <Text>{item}</Text>,
                  })}
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
      <Card title="数据策略详情" style={{ borderRadius: 20 }}>
        {renderPolicyDetail(policyDetail, policyVersions, policyBindings)}
      </Card>
    </Space>
  );

  const renderRiskWorkspace = () => (
    <Space orientation="vertical" style={{ width: '100%' }} size="large">
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="事件工作台" style={{ borderRadius: 20 }}>
            <Space wrap style={{ marginBottom: 16 }}>
              <Search placeholder="搜索事件号、标题、策略编码" allowClear onSearch={setIncidentKeyword} style={{ width: 240 }} />
              <Select placeholder="事件状态" allowClear style={{ width: 160 }} options={INCIDENT_STATUS_OPTIONS} onChange={setIncidentStatus} />
            </Space>
            <Table
              rowKey="id"
              size="small"
              dataSource={incidentsQuery.data?.records ?? []}
              columns={incidentColumns}
              pagination={false}
              scroll={{ x: 700 }}
              onRow={(record) => ({ onClick: () => setSelectedIncidentId(record.id) })}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无安全事件" /> }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="事件处置面板" style={{ borderRadius: 20 }}>
            {!incidentDetail ? (
              <Empty description="请选择左侧事件" />
            ) : (
              <Space orientation="vertical" style={{ width: '100%' }} size={14}>
                <Alert
                  type={incidentDetail.decision === 'block' ? 'error' : incidentDetail.decision === 'pause' ? 'warning' : 'info'}
                  showIcon
                  message={incidentDetail.eventTitle}
                  description={incidentDetail.eventDetail || '无补充描述'}
                />
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="事件号">{incidentDetail.incidentNo}</Descriptions.Item>
                  <Descriptions.Item label="链路ID">
                    <Text copyable={{ text: incidentDetail.traceId }}>{incidentDetail.traceId}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="来源">{incidentDetail.sourceType} / {incidentDetail.sourceName || incidentDetail.sourceId || '-'}</Descriptions.Item>
                  <Descriptions.Item label="风险等级">
                    <Tag color={riskColor(incidentDetail.riskLevel)}>{incidentDetail.riskLevel}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Space size={4}>
                      <Tag color={incidentDetail.status === 'resolved' ? 'green' : incidentDetail.status === 'ignored' ? 'default' : incidentDetail.status === 'escalated' ? 'red' : 'processing'}>
                        {INCIDENT_STATUS_OPTIONS.find(o => o.value === incidentDetail.status)?.label ?? incidentDetail.status}
                      </Tag>
                      <Tag color={decisionColor(incidentDetail.decision)}>{incidentDetail.decision}</Tag>
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
                <Space wrap>
                  <Button onClick={() => {
                    setIncidentActionType('assign');
                    setIncidentActionOpen(true);
                  }}
                  >
                    分派
                  </Button>
                  <Button onClick={() => {
                    setIncidentActionType('resolve');
                    setIncidentActionOpen(true);
                  }}
                  >
                    解决
                  </Button>
                  <Button onClick={() => {
                    setIncidentActionType('ignore');
                    setIncidentActionOpen(true);
                  }}
                  >
                    忽略
                  </Button>
                  <Button danger onClick={() => {
                    setIncidentActionType('escalate');
                    setIncidentActionOpen(true);
                  }}
                  >
                    升级
                  </Button>
                  {(() => {
                    const resumable =
                      (incidentDetail.sourceType === 'agent_execution' || incidentDetail.sourceType === 'workflow_instance')
                      && incidentDetail.decision !== 'block'
                      && ['new', 'assigned', 'investigating'].includes(incidentDetail.status);
                    if (!resumable) return null;
                    return (
                      <Button
                        type="primary"
                        loading={resumeIncidentMutation.isPending}
                        onClick={() => {
                          Modal.confirm({
                            title: '确认恢复业务流程',
                            content: '恢复后关联的 Agent 执行或工作流将继续运行，请确认安全事件已完成人工评估。',
                            okText: '确认恢复',
                            okType: 'primary',
                            cancelText: '取消',
                            onOk: () => resumeIncidentMutation.mutate(incidentDetail.id),
                          });
                        }}
                      >
                        恢复业务流程
                      </Button>
                    );
                  })()}
                </Space>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={10}>
          <Card title="处置轨迹" style={{ borderRadius: 20 }}>
            <Timeline
              items={incidentActions.map((item: SecurityIncidentAction) => ({
                color: item.actionType === 'resolve' ? 'green' : item.actionType === 'escalate' ? 'red' : 'blue',
                children: (
                  <Space orientation="vertical" size={2}>
                    <Text strong>{item.actionType}</Text>
                    <Text type="secondary">{item.comment || '-'}</Text>
                    <Text type="secondary">{item.operatorName || 'system'} · {formatDateTime(item.actionAt)}</Text>
                  </Space>
                ),
              }))}
            />
          </Card>
        </Col>
        <Col xs={24} xl={14}>
          <Card title="链路审计" style={{ borderRadius: 20 }}>
            <Table
              rowKey="id"
              size="small"
              dataSource={traceAudits}
              columns={auditColumns}
              pagination={false}
              scroll={{ x: 700 }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前事件暂无链路审计" /> }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="风控策略与审计检索"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openCreatePolicyDrawer('risk')}>新增风控策略</Button>}
        style={{ borderRadius: 20 }}
      >
        <Space wrap style={{ marginBottom: 16 }}>
          <Search placeholder="搜索审计标题或 traceId" allowClear onSearch={setAuditKeyword} style={{ width: 240 }} />
          <Select placeholder="事件类型" allowClear style={{ width: 160 }} options={AUDIT_EVENT_OPTIONS} onChange={setAuditEventType} />
          <Select placeholder="审计状态" allowClear style={{ width: 140 }} options={AUDIT_STATUS_OPTIONS} onChange={setAuditStatus} />
        </Space>
        <Table
          rowKey="id"
          size="small"
          dataSource={auditsQuery.data?.records ?? []}
          columns={auditColumns}
          pagination={false}
          scroll={{ x: 700 }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无审计记录" /> }}
        />
        <Divider />
        <Table
          rowKey="id"
          size="small"
          dataSource={policiesQuery.data?.records ?? []}
          columns={policyColumns}
          pagination={false}
          scroll={{ x: 600 }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无风控策略" /> }}
        />
      </Card>
    </Space>
  );

  const renderIndustryWorkspace = () => (
    <Space orientation="vertical" style={{ width: '100%' }} size="large">
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title="行业规则包"
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreateRulePackDrawer}>新增规则包</Button>}
            style={{ borderRadius: 20 }}
          >
            <Space wrap style={{ marginBottom: 16 }}>
              <Search placeholder="搜索规则包名称或编码" allowClear onSearch={setPackKeyword} style={{ width: 240 }} />
              <Select placeholder="状态" allowClear style={{ width: 140 }} options={POLICY_STATUS_OPTIONS} onChange={setPackStatus} />
            </Space>
            <Table
              rowKey="id"
              size="small"
              dataSource={rulePacksQuery.data?.records ?? []}
              columns={rulePackColumns}
              pagination={false}
              scroll={{ x: 680 }}
              onRow={(record) => ({ onClick: () => setSelectedRulePackId(record.id) })}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无规则包" /> }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="行业命中策略" style={{ borderRadius: 20 }}>
            {!rulePackDetail ? (
              <Empty description="请选择左侧规则包" />
            ) : (
              <Space orientation="vertical" style={{ width: '100%' }} size={12}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="规则包">{rulePackDetail.packName}</Descriptions.Item>
                  <Descriptions.Item label="默认动作">
                    <Tag color={decisionColor(rulePackDetail.defaultAction)}>{rulePackDetail.defaultAction}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="版本">v{rulePackDetail.packVersion}</Descriptions.Item>
                  <Descriptions.Item label="绑定数量">{rulePackBindings.length}</Descriptions.Item>
                </Descriptions>
                <Alert
                  type="info"
                  showIcon
                  message="行业合规接入建议"
                  description="在输出生成后、渠道下发前、审批留痕前执行规则包校验，并把命中条款与 traceId 回写到审计中心。"
                />
              </Space>
            )}
          </Card>
        </Col>
      </Row>
      <Card title="规则包详情" style={{ borderRadius: 20 }}>
        {!rulePackDetail ? (
          <Empty description="请选择左侧规则包查看详情" />
        ) : (
          <Space orientation="vertical" style={{ width: '100%' }} size="large">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="编码">{rulePackDetail.packCode}</Descriptions.Item>
              <Descriptions.Item label="行业">{rulePackDetail.industryCode}</Descriptions.Item>
              <Descriptions.Item label="状态">{rulePackDetail.status}</Descriptions.Item>
              <Descriptions.Item label="默认动作">{rulePackDetail.defaultAction}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{rulePackDetail.description || '-'}</Descriptions.Item>
            </Descriptions>
            <div>
              <Text strong>规则项</Text>
              <Table
                rowKey="id"
                style={{ marginTop: 12 }}
                size="small"
                pagination={false}
                dataSource={rulePackDetail.items ?? []}
                columns={[
                  { title: '规则项', dataIndex: 'itemName', render: (_value, record) => <Space orientation="vertical" size={2}><Text strong>{record.itemName}</Text><Text type="secondary">{record.itemCode}</Text></Space> },
                  { title: '匹配方式', dataIndex: 'matchType', width: 100, render: (value) => <span style={tableCellNoWrapStyle}>{value || '-'}</span> },
                  { title: '匹配内容', dataIndex: 'matchContent' },
                  { title: '动作', dataIndex: 'action', width: 90, render: (value) => <Tag color={decisionColor(value)} style={tableTagNoWrapStyle}>{value}</Tag> },
                  { title: '等级', dataIndex: 'riskLevel', width: 90, render: (value) => <Tag color={riskColor(value)} style={tableTagNoWrapStyle}>{value}</Tag> },
                ]}
                scroll={{ x: 720 }}
              />
            </div>
            <div>
              <Text strong>绑定范围</Text>
              <div style={{ marginTop: 12 }}>
                {renderStackList({
                  items: rulePackBindings,
                  emptyDescription: '暂无绑定',
                  getKey: (item) => item.id,
                  renderItem: (item) => (
                    <Space orientation="vertical" size={2}>
                      <Text strong>{scopeLabel(item.bindingType)}</Text>
                      <Text type="secondary">{item.targetName || '当前租户'}</Text>
                    </Space>
                  ),
                })}
              </div>
            </div>
          </Space>
        )}
      </Card>
    </Space>
  );

  return (
    <PageContainer
      title="安全合规管理"
      extra={<Tag color="gold">策略执行链已生效</Tag>}
    >
      {activeTab === 'overview' ? null : renderHero()}

      <Tabs
        activeKey={activeTab}
        items={domainTabs}
        onChange={(key) => navigate(`/security-compliance/${key}`)}
        style={{ marginBottom: 24 }}
      />

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'runtime' && renderRuntimeWorkspace()}
      {activeTab === 'data' && renderDataWorkspace()}
      {activeTab === 'risk' && renderRiskWorkspace()}
      {activeTab === 'industry' && renderIndustryWorkspace()}

      <Drawer
        title={editingPolicyId ? '编辑安全策略' : '新增安全策略'}
        size={760}
        open={policyEditorOpen}
        onClose={() => {
          setPolicyEditorOpen(false);
          setEditingPolicyId(undefined);
        }}
        destroyOnClose
      >
        <Form
          form={policyForm}
          layout="vertical"
          onFinish={handleSubmitPolicy}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="策略编码" name="policyCode" rules={[{ required: true, message: '请输入策略编码' }]}>
                <Input disabled={policyEditorLoading} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="策略名称" name="policyName" rules={[{ required: true, message: '请输入策略名称' }]}>
                <Input disabled={policyEditorLoading} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="策略类型" name="policyType" rules={[{ required: true, message: '请选择策略类型' }]}>
                <Select options={POLICY_TYPE_OPTIONS[policyEditorDomain]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="生效范围" name="policyScope" rules={[{ required: true, message: '请选择生效范围' }]}>
                <Select options={SCOPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="风险等级" name="riskLevel" rules={[{ required: true, message: '请选择风险等级' }]}>
                <Select options={RISK_LEVEL_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="执行模式" name="enforcementMode" rules={[{ required: true, message: '请选择执行模式' }]}>
            <Select options={ENFORCEMENT_OPTIONS} />
          </Form.Item>
          <Form.Item label="控制点" name="controlPointsText">
            <TextArea rows={3} placeholder="多个控制点用换行分隔" />
          </Form.Item>
          <Form.Item label="标签" name="tagsText">
            <Input placeholder="多个标签用逗号或换行分隔" />
          </Form.Item>

          <Card size="small" title="绑定范围" style={{ marginBottom: 16 }}>
            <Form.List name="bindingDrafts">
              {(fields, { add, remove }) => (
                <Space orientation="vertical" style={{ width: '100%' }} size={12}>
                  {fields.map((field) => (
                    <Row gutter={12} key={field.key}>
                      <Col span={8}>
                        <Form.Item {...field} label="绑定范围" name={[field.name, 'bindingType']}>
                          <Select
                            disabled
                            value={watchedPolicyScope}
                            options={SCOPE_OPTIONS.filter((item) => item.value === watchedPolicyScope)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item
                          {...field}
                          label="目标"
                          name={[field.name, 'targetId']}
                          rules={watchedPolicyScope === 'tenant' ? [] : [{ required: true, message: '请选择目标' }]}
                        >
                          {watchedPolicyScope === 'tenant' ? (
                            <Input value="当前租户" disabled />
                          ) : (
                            <Select
                              showSearch
                              options={getTargetListByScope(targetOptionsQuery.data, watchedPolicyScope).map((item) => ({ label: item.label, value: item.value }))}
                              placeholder="请选择目标"
                            />
                          )}
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item {...field} label="优先级" name={[field.name, 'priority']}>
                          <InputNumber min={1} max={999} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button type="link" danger style={{ marginTop: 30 }} onClick={() => remove(field.name)}>
                          删除
                        </Button>
                      </Col>
                      <Col span={24}>
                        <Form.Item {...field} label="绑定扩展 JSON" name={[field.name, 'bindingConfigText']}>
                          <TextArea rows={3} spellCheck={false} />
                        </Form.Item>
                      </Col>
                    </Row>
                  ))}
                  <Button
                    onClick={() => add({ bindingType: watchedPolicyScope, priority: 10, bindingConfigText: '{\n}' })}
                  >
                    新增绑定
                  </Button>
                </Space>
              )}
            </Form.List>
          </Card>

          <Card size="small" title="结构化配置" style={{ marginBottom: 16 }}>
            {policyEditorDomain === 'runtime' ? (
              <>
                <Form.Item label="关键字黑名单" name="keywordsText">
                  <TextArea rows={3} placeholder="每行一个关键字" />
                </Form.Item>
                <Form.Item label="正则模式" name="regexPatternsText">
                  <TextArea rows={3} placeholder="每行一个正则表达式" />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="高危工具" name="forbiddenToolsText">
                      <TextArea rows={3} placeholder="例如 shell_command" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="高危命令" name="forbiddenCommandsText">
                      <TextArea rows={3} placeholder="例如 rm -rf" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="最大长度" name="maxLength">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="命中动作" name="hitAction">
                      <Select allowClear options={DECISION_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="人工复核" name="reviewRequired" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ) : null}

            {policyEditorDomain === 'data' ? (
              <>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="会话 TTL(分钟)" name="sessionTtlMinutes">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="最大并发会话数" name="maxSessions">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="传输协议" name="transportProtocol">
                      <Input placeholder="例如 TLS1.3" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="存储算法" name="storageAlgorithm">
                      <Input placeholder="例如 AES-256" />
                    </Form.Item>
                  </Col>
                  <Col span={16}>
                    <Form.Item label="允许区域" name="allowedRegionsText">
                      <Input placeholder="多个区域用逗号分隔" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={6}>
                    <Form.Item label="存储加密" name="encryptStorage" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="传输加密" name="encryptTransport" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="禁止知识回写" name="forbidMemoryWrite" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="输出脱敏" name="requireMaskedOutput" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ) : null}

            {policyEditorDomain === 'risk' ? (
              <>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="租户 QPS" name="tenantQps">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="用户日配额" name="userDailyQuota">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="封禁时长(分钟)" name="temporaryBanMinutes">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="异常阈值" name="anomalyThreshold">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="审计保留(天)" name="auditRetentionDays">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="自动升级" name="autoEscalate" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="IP 白名单" name="ipAllowListText">
                  <TextArea rows={2} />
                </Form.Item>
                <Form.Item label="IP 黑名单" name="ipBlockListText">
                  <TextArea rows={2} />
                </Form.Item>
                <Form.Item label="高危标签" name="highRiskTagsText">
                  <Input placeholder="多个标签用逗号分隔" />
                </Form.Item>
              </>
            ) : null}
          </Card>

          <Form.Item label="高级目标选择 JSON" name="advancedSelectorText">
            <TextArea rows={4} spellCheck={false} />
          </Form.Item>
          <Form.Item label="高级配置 JSON" name="advancedConfigText">
            <TextArea rows={6} spellCheck={false} />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <TextArea rows={3} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={createOrUpdatePolicyMutation.isPending || policyEditorLoading}>
              保存策略
            </Button>
            <Button onClick={() => setPolicyEditorOpen(false)}>取消</Button>
          </Space>
        </Form>
      </Drawer>

      <Drawer
        title={editingRulePackId ? '编辑规则包' : '新增规则包'}
        size={820}
        open={rulePackEditorOpen}
        onClose={() => {
          setRulePackEditorOpen(false);
          setEditingRulePackId(undefined);
        }}
        destroyOnClose
      >
        <Form
          form={rulePackForm}
          layout="vertical"
          onFinish={handleSubmitRulePack}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="规则包编码" name="packCode" rules={[{ required: true, message: '请输入编码' }]}>
                <Input disabled={rulePackEditorLoading} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="规则包名称" name="packName" rules={[{ required: true, message: '请输入名称' }]}>
                <Input disabled={rulePackEditorLoading} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="行业编码" name="industryCode" rules={[{ required: true, message: '请选择行业' }]}>
                <Select options={INDUSTRY_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="默认动作" name="defaultAction">
                <Select options={DECISION_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="业务线" name="businessLine">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="审核负责人" name="reviewOwner">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={18}>
              <Form.Item label="监管机构" name="regulatorsText">
                <Input placeholder="多个监管机构用逗号分隔" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="要求证据留存" name="evidenceRequired" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="描述" name="description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item label="高级配置 JSON" name="advancedConfigText">
            <TextArea rows={4} spellCheck={false} />
          </Form.Item>

          <Card size="small" title="绑定范围" style={{ marginBottom: 16 }}>
            <Form.List name="bindingDrafts">
              {(fields, { add, remove }) => (
                <Space orientation="vertical" style={{ width: '100%' }} size={12}>
                  {fields.map((field) => {
                    const bindingType = rulePackForm.getFieldValue(['bindingDrafts', field.name, 'bindingType']);
                    return (
                      <Row gutter={12} key={field.key}>
                        <Col span={6}>
                          <Form.Item {...field} label="范围" name={[field.name, 'bindingType']}>
                            <Select options={SCOPE_OPTIONS} />
                          </Form.Item>
                        </Col>
                        <Col span={10}>
                          <Form.Item {...field} label="目标" name={[field.name, 'targetId']}>
                            {bindingType === 'tenant' ? (
                              <Input value="当前租户" disabled />
                            ) : (
                              <Select
                                showSearch
                                options={getTargetListByScope(targetOptionsQuery.data, bindingType).map((item) => ({ label: item.label, value: item.value }))}
                              />
                            )}
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item {...field} label="优先级" name={[field.name, 'priority']}>
                            <InputNumber min={1} max={999} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Button type="link" danger style={{ marginTop: 30 }} onClick={() => remove(field.name)}>
                            删除
                          </Button>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...field} label="绑定扩展 JSON" name={[field.name, 'bindingConfigText']}>
                            <TextArea rows={3} spellCheck={false} />
                          </Form.Item>
                        </Col>
                      </Row>
                    );
                  })}
                  <Button onClick={() => add({ bindingType: 'tenant', priority: 10, bindingConfigText: '{\n}' })}>
                    新增绑定
                  </Button>
                </Space>
              )}
            </Form.List>
          </Card>

          <Card size="small" title="规则项">
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <Space orientation="vertical" style={{ width: '100%' }} size={16}>
                  {fields.map((field) => (
                    <Card key={field.key} size="small" type="inner" title={`规则项 ${field.name + 1}`}>
                      <Row gutter={12}>
                        <Col span={8}>
                          <Form.Item {...field} label="规则项编码" name={[field.name, 'itemCode']} rules={[{ required: true, message: '请输入编码' }]}>
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item {...field} label="规则项名称" name={[field.name, 'itemName']} rules={[{ required: true, message: '请输入名称' }]}>
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item {...field} label="规则来源" name={[field.name, 'ruleSource']}>
                            <Input />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={12}>
                        <Col span={8}>
                          <Form.Item {...field} label="匹配方式" name={[field.name, 'matchType']}>
                            <Select options={[
                              { label: '包含', value: 'contains' },
                              { label: '精确', value: 'exact' },
                              { label: '正则', value: 'regex' },
                            ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item {...field} label="动作" name={[field.name, 'action']}>
                            <Select options={DECISION_OPTIONS} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item {...field} label="排序" name={[field.name, 'sortOrder']}>
                            <InputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item {...field} label="启用" name={[field.name, 'enabled']} valuePropName="checked">
                            <Switch />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item {...field} label="条款" name={[field.name, 'ruleClause']}>
                        <Input />
                      </Form.Item>
                      <Form.Item {...field} label="匹配内容" name={[field.name, 'matchContent']}>
                        <TextArea rows={2} />
                      </Form.Item>
                      <Form.Item {...field} label="扩展 JSON" name={[field.name, 'itemConfigText']}>
                        <TextArea rows={3} spellCheck={false} />
                      </Form.Item>
                      <Button type="link" danger onClick={() => remove(field.name)}>删除规则项</Button>
                    </Card>
                  ))}
                  <Button
                    onClick={() => add({
                      riskLevel: 'high',
                      action: 'block',
                      matchType: 'contains',
                      enabled: true,
                      sortOrder: 10,
                      itemConfigText: '{\n}',
                    })}
                  >
                    新增规则项
                  </Button>
                </Space>
              )}
            </Form.List>
          </Card>

          <Divider />
          <Space>
            <Button type="primary" htmlType="submit" loading={createOrUpdateRulePackMutation.isPending || rulePackEditorLoading}>
              保存规则包
            </Button>
            <Button onClick={() => setRulePackEditorOpen(false)}>取消</Button>
          </Space>
        </Form>
      </Drawer>

      <Modal
        title="事件处置"
        open={incidentActionOpen}
        onCancel={() => {
          setIncidentActionOpen(false);
          setIncidentActionType(undefined);
        }}
        onOk={() => incidentActionForm.submit()}
        confirmLoading={incidentActionMutation.isPending}
      >
        <Form
          form={incidentActionForm}
          layout="vertical"
          onFinish={(values) => {
            if (!incidentActionType || !selectedIncidentId) {
              return;
            }
            incidentActionMutation.mutate({ type: incidentActionType, id: selectedIncidentId, data: values });
          }}
        >
          {incidentActionType === 'assign' ? (
            <>
              <Form.Item label="负责人 ID" name="assigneeId">
                <Input />
              </Form.Item>
              <Form.Item label="负责人名称" name="assigneeName">
                <Input />
              </Form.Item>
            </>
          ) : null}
          <Form.Item label="处置说明" name="comment" rules={[{ required: true, message: '请输入处置说明' }]}>
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

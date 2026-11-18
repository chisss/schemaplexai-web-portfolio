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
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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

function getTabMeta(t: TFunction): Record<SecurityTabKey, { title: string; description: string; color: string; icon: ReactNode }> {
  return {
    overview: {
      title: t('security.hero.overviewTitle'),
      description: t('security.hero.overviewDesc'),
      color: '#1677ff',
      icon: <SafetyCertificateOutlined />,
    },
    runtime: {
      title: t('security.hero.runtimeTitle'),
      description: t('security.hero.runtimeDesc'),
      color: '#1677ff',
      icon: <ThunderboltOutlined />,
    },
    data: {
      title: t('security.hero.dataTitle'),
      description: t('security.hero.dataDesc'),
      color: '#0f766e',
      icon: <DatabaseOutlined />,
    },
    risk: {
      title: t('security.hero.riskTitle'),
      description: t('security.hero.riskDesc'),
      color: '#FF7D00',
      icon: <AlertOutlined />,
    },
    industry: {
      title: t('security.hero.industryTitle'),
      description: t('security.hero.industryDesc'),
      color: '#7c3aed',
      icon: <GlobalOutlined />,
    },
  };
}

const POLICY_TYPE_KEY_MAP: Record<string, string> = {
  prompt_injection: 'security.policyType.promptInjection',
  tool_guard: 'security.policyType.toolGuard',
  output_guard: 'security.policyType.outputGuard',
  command_guard: 'security.policyType.commandGuard',
  data_encryption: 'security.policyType.dataEncryption',
  session_control: 'security.policyType.sessionControl',
  tenant_isolation: 'security.policyType.tenantIsolation',
  knowledge_review: 'security.policyType.knowledgeReview',
  rate_limit: 'security.policyType.rateLimit',
  abuse_detection: 'security.policyType.abuseDetection',
  audit_trace: 'security.policyType.auditTrace',
  anomaly_detection: 'security.policyType.anomalyDetection',
};

const POLICY_TYPE_GROUPS: Record<'runtime' | 'data' | 'risk', string[]> = {
  runtime: ['prompt_injection', 'tool_guard', 'output_guard', 'command_guard'],
  data: ['data_encryption', 'session_control', 'tenant_isolation', 'knowledge_review'],
  risk: ['rate_limit', 'abuse_detection', 'audit_trace', 'anomaly_detection'],
};

function getPolicyTypeOptions(t: TFunction) {
  return {
    runtime: POLICY_TYPE_GROUPS.runtime.map((value) => ({ label: t(POLICY_TYPE_KEY_MAP[value]), value })),
    data: POLICY_TYPE_GROUPS.data.map((value) => ({ label: t(POLICY_TYPE_KEY_MAP[value]), value })),
    risk: POLICY_TYPE_GROUPS.risk.map((value) => ({ label: t(POLICY_TYPE_KEY_MAP[value]), value })),
  };
}

const STATUS_KEY_MAP: Record<string, string> = {
  draft: 'security.status.draft',
  active: 'security.status.active',
  inactive: 'security.status.inactive',
  archived: 'security.status.archived',
};

const RISK_LEVEL_KEY_MAP: Record<string, string> = {
  low: 'security.riskLevel.low',
  medium: 'security.riskLevel.medium',
  high: 'security.riskLevel.high',
  critical: 'security.riskLevel.critical',
};

const ENFORCEMENT_KEY_MAP: Record<string, string> = {
  audit: 'security.enforcement.audit',
  warn: 'security.enforcement.warn',
  block: 'security.enforcement.block',
};

const DECISION_KEY_MAP: Record<string, string> = {
  allow: 'security.decision.allow',
  warn: 'security.decision.warn',
  block: 'security.decision.block',
  pause: 'security.decision.pause',
};

const SCOPE_KEY_MAP: Record<string, string> = {
  tenant: 'security.scope.tenant',
  agent: 'security.scope.agent',
  workflow: 'security.scope.workflow',
  project: 'security.scope.project',
};

const INCIDENT_STATUS_KEY_MAP: Record<string, string> = {
  new: 'security.incidentStatus.new',
  assigned: 'security.incidentStatus.assigned',
  investigating: 'security.incidentStatus.investigating',
  resolved: 'security.incidentStatus.resolved',
  ignored: 'security.incidentStatus.ignored',
  escalated: 'security.incidentStatus.escalated',
};

const AUDIT_STATUS_KEY_MAP: Record<string, string> = {
  success: 'security.auditStatus.success',
  warning: 'security.auditStatus.warning',
  blocked: 'security.auditStatus.blocked',
  failed: 'security.auditStatus.failed',
};

const INDUSTRY_KEY_MAP: Record<string, string> = {
  finance: 'security.industry.finance',
  medical: 'security.industry.medical',
  gov: 'security.industry.gov',
  platform: 'security.industry.platform',
};

const AUDIT_EVENT_KEY_MAP: Record<string, string> = {
  policy_created: 'security.auditEvent.policyCreated',
  policy_updated: 'security.auditEvent.policyUpdated',
  policy_published: 'security.auditEvent.policyPublished',
  runtime_check: 'security.auditEvent.runtimeCheck',
  runtime_warning: 'security.auditEvent.runtimeWarning',
  runtime_blocked: 'security.auditEvent.runtimeBlocked',
  runtime_paused: 'security.auditEvent.runtimePaused',
};

const ACTION_TYPE_KEY_MAP: Record<string, string> = {
  assign: 'security.actionType.assign',
  resolve: 'security.actionType.resolve',
  ignore: 'security.actionType.ignore',
  escalate: 'security.actionType.escalate',
};

const MATCH_TYPE_KEY_MAP: Record<string, string> = {
  contains: 'security.matchType.contains',
  exact: 'security.matchType.exact',
  regex: 'security.matchType.regex',
};

function getOptionsFromMap(keyMap: Record<string, string>, t: TFunction) {
  return Object.entries(keyMap).map(([value, key]) => ({ label: t(key), value }));
}

const getPolicyStatusOptions = (t: TFunction) => getOptionsFromMap(STATUS_KEY_MAP, t);
const getRiskLevelOptions = (t: TFunction) => getOptionsFromMap(RISK_LEVEL_KEY_MAP, t);
const getEnforcementOptions = (t: TFunction) => getOptionsFromMap(ENFORCEMENT_KEY_MAP, t);
const getDecisionOptions = (t: TFunction) => getOptionsFromMap(DECISION_KEY_MAP, t);
const getScopeOptions = (t: TFunction) => getOptionsFromMap(SCOPE_KEY_MAP, t);
const getIncidentStatusOptions = (t: TFunction) => getOptionsFromMap(INCIDENT_STATUS_KEY_MAP, t);
const getAuditStatusOptions = (t: TFunction) => getOptionsFromMap(AUDIT_STATUS_KEY_MAP, t);
const getIndustryOptions = (t: TFunction) => getOptionsFromMap(INDUSTRY_KEY_MAP, t);
const getAuditEventOptions = (t: TFunction) => getOptionsFromMap(AUDIT_EVENT_KEY_MAP, t);
const getMatchTypeOptions = (t: TFunction) => getOptionsFromMap(MATCH_TYPE_KEY_MAP, t);

function labelOf(keyMap: Record<string, string>, value: string | null | undefined, t: TFunction): string {
  if (!value) {
    return '-';
  }
  return keyMap[value] ? t(keyMap[value]) : value;
}

const statusLabel = (value: string | undefined, t: TFunction) => labelOf(STATUS_KEY_MAP, value, t);
const riskLevelLabel = (value: string | undefined, t: TFunction) => labelOf(RISK_LEVEL_KEY_MAP, value, t);
const enforcementLabel = (value: string | undefined, t: TFunction) => labelOf(ENFORCEMENT_KEY_MAP, value, t);
const decisionLabel = (value: string | undefined, t: TFunction) => labelOf(DECISION_KEY_MAP, value, t);
const auditStatusLabel = (value: string | undefined, t: TFunction) => labelOf(AUDIT_STATUS_KEY_MAP, value, t);
const incidentStatusLabel = (value: string | undefined, t: TFunction) => labelOf(INCIDENT_STATUS_KEY_MAP, value, t);
const industryLabel = (value: string | undefined, t: TFunction) => labelOf(INDUSTRY_KEY_MAP, value, t);
const eventTypeLabel = (value: string | undefined, t: TFunction) => labelOf(AUDIT_EVENT_KEY_MAP, value, t);
const actionTypeLabel = (value: string | undefined, t: TFunction) => labelOf(ACTION_TYPE_KEY_MAP, value, t);
const matchTypeLabel = (value: string | undefined, t: TFunction) => labelOf(MATCH_TYPE_KEY_MAP, value, t);
const policyTypeLabel = (value: string | undefined, t: TFunction) => labelOf(POLICY_TYPE_KEY_MAP, value, t);

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

const DOMAIN_KEY_MAP: Record<string, string> = {
  runtime: 'security.tab.runtime',
  data: 'security.tab.data',
  risk: 'security.tab.risk',
  industry: 'security.tab.industry',
};

const domainLabel = (domain: string | undefined, t: TFunction) => labelOf(DOMAIN_KEY_MAP, domain, t);
const scopeLabel = (scope: string | undefined, t: TFunction) => labelOf(SCOPE_KEY_MAP, scope, t);

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

function resolveTargetName(targetOptions: SecurityTargetOptions | undefined, scope: string | undefined, targetId: string | undefined, t: TFunction) {
  if (!targetId) {
    return scope === 'tenant' ? t('security.common.currentTenant') : '';
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
  const { t } = useTranslation();
  if (!decision) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('security.decisionAlert.noResult')} />;
  }
  const type = decision.decision === 'block' ? 'error' : decision.decision === 'pause' ? 'warning' : decision.decision === 'warn' ? 'warning' : 'success';
  const matchedList = [...(decision.matchedPolicies || []), ...(decision.matchedRulePacks || [])];
  return (
    <Space orientation="vertical" style={{ width: '100%' }} size={12}>
      <Alert
        type={type}
        showIcon
        title={t('security.decisionAlert.resultTitle', { decision: decisionLabel(decision.decision || 'allow', t) })}
        description={decision.message || decision.userActionTip || t('security.decisionAlert.noDetail')}
      />
      {decision.userActionTip ? <Text type="secondary">{t('security.decisionAlert.userTip', { tip: decision.userActionTip })}</Text> : null}
      {decision.adminActionTip ? <Text type="secondary">{t('security.decisionAlert.adminTip', { tip: decision.adminActionTip })}</Text> : null}
      {decision.incidentId ? <Text copyable={{ text: decision.incidentId }}>{t('security.decisionAlert.incident', { id: decision.incidentId })}</Text> : null}
      {decision.traceId ? <Text copyable={{ text: decision.traceId }}>{t('security.decisionAlert.traceId', { id: decision.traceId })}</Text> : null}
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
  const { t } = useTranslation();
  const tenantId = useAuthStore((state) => state.tenantId);
  const activeTab = getActiveTab(location.pathname);
  const activeMeta = getTabMeta(t)[activeTab];

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
      message.warning(t('security.msg.policyNotLoaded'));
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
      message.success(t('security.msg.sandboxUpdated'));
    } catch {
      message.error(t('security.msg.sandboxUpdateFailed'));
    }
  };

  const handleAddSandboxCommand = async () => {
    const command = sandboxCommandInput.trim();
    const current = tenantRuntimePolicyQuery.data;
    if (!command) {
      message.warning(t('security.msg.enterCommandName'));
      return;
    }
    if (!/^[A-Za-z0-9._-]+$/.test(command)) {
      message.warning(t('security.msg.commandCharset'));
      return;
    }
    if (!current) {
      message.warning(t('security.msg.policyNotLoaded'));
      return;
    }
    const nextCommands = Array.from(new Set([...(current.sandboxAllowedCommands || []), command]));
    await saveTenantRuntimePolicy({ sandboxAllowedCommands: nextCommands });
    setSandboxCommandInput('');
  };

  const handleRemoveSandboxCommand = async (command: string) => {
    const current = tenantRuntimePolicyQuery.data;
    if (!current) {
      message.warning(t('security.msg.policyNotLoaded'));
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
            ? t('security.common.currentTenant')
            : resolveTargetName(targetOptionsQuery.data, params.values.policyScope, item.targetId, t),
          priority: item.priority ?? (index + 1) * 10,
          bindingConfig: parseJsonText(item.bindingConfigText),
        })),
      };
      await saveSecurityPolicyBindings(policy.id, bindingPayload);
      return policy;
    },
    onSuccess: (policy) => {
      message.success(editingPolicyId ? t('security.msg.policyUpdated') : t('security.msg.policyCreated'));
      setPolicyEditorOpen(false);
      setEditingPolicyId(undefined);
      setSelectedPolicyId(policy.id);
      invalidateSecurityQueries();
    },
  });

  const togglePolicyMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) => toggleSecurityPolicy(id, { status }),
    onSuccess: () => {
      message.success(t('security.msg.policyStatusUpdated'));
      invalidateSecurityQueries();
    },
  });

  const deletePolicyMutation = useMutation({
    mutationFn: deleteSecurityPolicy,
    onSuccess: () => {
      message.success(t('security.msg.policyDeleted'));
      setSelectedPolicyId(undefined);
      invalidateSecurityQueries();
    },
  });

  const publishPolicyMutation = useMutation({
    mutationFn: publishSecurityPolicy,
    onSuccess: () => {
      message.success(t('security.msg.policyPublished'));
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
      message.success(t('security.msg.incidentUpdated'));
      setIncidentActionOpen(false);
      setIncidentActionType(undefined);
      incidentActionForm.resetFields();
      invalidateSecurityQueries();
    },
  });

  const resumeIncidentMutation = useMutation({
    mutationFn: resumeSecurityIncidentResource,
    onSuccess: () => {
      message.success(t('security.msg.businessResumed'));
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
            ? t('security.common.currentTenant')
            : resolveTargetName(targetOptionsQuery.data, item.bindingType, item.targetId, t),
          priority: item.priority ?? (index + 1) * 10,
          bindingConfig: parseJsonText(item.bindingConfigText),
        })),
      });
      return rulePack;
    },
    onSuccess: (pack) => {
      message.success(editingRulePackId ? t('security.msg.rulePackUpdated') : t('security.msg.rulePackCreated'));
      setRulePackEditorOpen(false);
      setEditingRulePackId(undefined);
      setSelectedRulePackId(pack.id);
      invalidateSecurityQueries();
    },
  });

  const toggleRulePackMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => toggleSecurityRulePack(id, { status }),
    onSuccess: () => {
      message.success(t('security.msg.rulePackStatusUpdated'));
      invalidateSecurityQueries();
    },
  });

  const openCreatePolicyDrawer = (domain: 'runtime' | 'data' | 'risk') => {
    setPolicyEditorDomain(domain);
    setEditingPolicyId(undefined);
    policyForm.setFieldsValue({
      policyCode: '',
      policyName: '',
      policyType: getPolicyTypeOptions(t)[domain][0]?.value,
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
      message.error(t('security.msg.loadPolicyFailed'));
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
      message.error(t('security.msg.loadRulePackFailed'));
    } finally {
      setRulePackEditorLoading(false);
    }
  };

  const handleSubmitPolicy = async (values: PolicyEditorValues) => {
    try {
      await createOrUpdatePolicyMutation.mutateAsync({ id: editingPolicyId, domain: policyEditorDomain, values });
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('security.msg.invalidJsonConfig'));
    }
  };

  const handleSubmitRulePack = async (values: RulePackEditorValues) => {
    try {
      await createOrUpdateRulePackMutation.mutateAsync({ id: editingRulePackId, values });
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('security.msg.invalidJsonConfig'));
    }
  };

  const policyColumns: TableColumnsType<SecurityPolicy> = [
    {
      title: t('security.table.policy'),
      dataIndex: 'policyName',
      ellipsis: true,
      render: (_value, record) => (
        <Space orientation="vertical" size={2}>
          <Space>
            <Text strong ellipsis={{ tooltip: record.policyName }} style={{ maxWidth: 160 }}>{record.policyName}</Text>
            {record.isBuiltin ? <Tag color="purple">{t('security.common.builtin')}</Tag> : null}
          </Space>
          <Text type="secondary" ellipsis={{ tooltip: record.policyCode }} style={{ maxWidth: 180 }}>{record.policyCode}</Text>
        </Space>
      ),
    },
    {
      title: t('security.table.type'),
      dataIndex: 'policyType',
      width: 120,
      ellipsis: true,
      render: (value) => <span style={tableCellNoWrapStyle}>{policyTypeLabel(value, t)}</span>,
    },
    {
      title: t('security.table.risk'),
      dataIndex: 'riskLevel',
      width: 90,
      render: (value) => <Tag color={riskColor(value)} style={tableTagNoWrapStyle}>{riskLevelLabel(value, t)}</Tag>,
    },
    {
      title: t('security.table.status'),
      dataIndex: 'status',
      width: 90,
      render: (value) => <Tag color={value === 'active' ? 'green' : value === 'draft' ? 'blue' : value === 'inactive' ? 'default' : 'purple'} style={tableTagNoWrapStyle}>{statusLabel(value, t)}</Tag>,
    },
    {
      title: t('security.table.actions'),
      key: 'action',
      width: 180,
      render: (_value, record) => (
        <Space size={4} wrap>
          <Button size="small" type="link" onClick={() => setSelectedPolicyId(record.id)}>
            {t('security.common.view')}
          </Button>
          <Button size="small" type="link" onClick={() => void openEditPolicyDrawer(record)}>
            {t('security.common.edit')}
          </Button>
          {record.status === 'draft' ? (
            <Button size="small" type="link" onClick={() => publishPolicyMutation.mutate(record.id)}>
              {t('security.common.publish')}
            </Button>
          ) : (
            <Button
              size="small"
              type="link"
              onClick={() => togglePolicyMutation.mutate({ id: record.id, status: record.status === 'active' ? 'inactive' : 'active' })}
            >
              {record.status === 'active' ? t('security.common.disable') : t('security.common.enable')}
            </Button>
          )}
          {!record.isBuiltin ? (
            <Popconfirm title={t('security.confirm.deletePolicy')} onConfirm={() => deletePolicyMutation.mutate(record.id)}>
              <Button size="small" type="link" danger>
                {t('security.common.delete')}
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  const incidentColumns: TableColumnsType<SecurityIncident> = [
    {
      title: t('security.table.incident'),
      dataIndex: 'eventTitle',
      render: (_value, record) => (
        <Space orientation="vertical" size={2}>
          <Text strong>{record.eventTitle}</Text>
          <Text type="secondary">{record.incidentNo}</Text>
        </Space>
      ),
    },
    {
      title: t('security.table.decision'),
      dataIndex: 'decision',
      width: 90,
      render: (value) => <Tag color={decisionColor(value)} style={tableTagNoWrapStyle}>{decisionLabel(value, t)}</Tag>,
    },
    {
      title: t('security.table.level'),
      dataIndex: 'riskLevel',
      width: 90,
      render: (value) => <Tag color={riskColor(value)} style={tableTagNoWrapStyle}>{riskLevelLabel(value, t)}</Tag>,
    },
    {
      title: t('security.table.status'),
      dataIndex: 'status',
      width: 100,
      render: (value) => <Tag color={value === 'resolved' ? 'green' : value === 'ignored' ? 'default' : value === 'escalated' ? 'red' : 'processing'} style={tableTagNoWrapStyle}>{incidentStatusLabel(value, t)}</Tag>,
    },
    {
      title: t('security.table.time'),
      dataIndex: 'createdAt',
      width: 180,
      render: (value) => formatDateTime(value),
    },
  ];

  const auditColumns: TableColumnsType<SecurityAuditEvent> = [
    {
      title: t('security.table.title'),
      dataIndex: 'eventTitle',
      render: (_value, record) => (
        <Space orientation="vertical" size={2}>
          <Text strong>{record.eventTitle}</Text>
          <Text type="secondary">{record.traceId}</Text>
        </Space>
      ),
    },
    {
      title: t('security.table.event'),
      dataIndex: 'eventType',
      width: 150,
      render: (value) => <span style={tableCellNoWrapStyle}>{eventTypeLabel(value, t)}</span>,
    },
    {
      title: t('security.table.status'),
      dataIndex: 'eventStatus',
      width: 100,
      render: (value) => <Tag color={auditColor(value)} style={tableTagNoWrapStyle}>{auditStatusLabel(value, t)}</Tag>,
    },
    {
      title: t('security.table.domain'),
      dataIndex: 'domainCode',
      width: 110,
      render: (value) => <span style={tableCellNoWrapStyle}>{domainLabel(value, t)}</span>,
    },
    {
      title: t('security.table.time'),
      dataIndex: 'occurredAt',
      width: 180,
      render: (value) => formatDateTime(value),
    },
  ];

  const rulePackColumns: TableColumnsType<SecurityRulePack> = [
    {
      title: t('security.table.rulePack'),
      dataIndex: 'packName',
      render: (_value, record) => (
        <Space orientation="vertical" size={2}>
          <Space>
            <Text strong>{record.packName}</Text>
            {record.isBuiltin ? <Tag color="purple">{t('security.common.builtin')}</Tag> : null}
          </Space>
          <Text type="secondary">{record.packCode}</Text>
        </Space>
      ),
    },
    {
      title: t('security.table.industry'),
      dataIndex: 'industryCode',
      width: 100,
      render: (value) => <span style={tableCellNoWrapStyle}>{industryLabel(value, t)}</span>,
    },
    {
      title: t('security.table.defaultAction'),
      dataIndex: 'defaultAction',
      width: 100,
      render: (value) => <Tag color={decisionColor(value)} style={tableTagNoWrapStyle}>{decisionLabel(value, t)}</Tag>,
    },
    {
      title: t('security.table.status'),
      dataIndex: 'status',
      width: 100,
      render: (value) => <Tag color={value === 'active' ? 'green' : value === 'draft' ? 'blue' : value === 'inactive' ? 'default' : 'purple'} style={tableTagNoWrapStyle}>{statusLabel(value, t)}</Tag>,
    },
    {
      title: t('security.table.actions'),
      key: 'action',
      width: 180,
      render: (_value, record) => (
        <Space size={4}>
          <Button size="small" type="link" onClick={() => setSelectedRulePackId(record.id)}>
            {t('security.common.view')}
          </Button>
          <Button size="small" type="link" onClick={() => void openEditRulePackDrawer(record)}>
            {t('security.common.edit')}
          </Button>
          <Button
            size="small"
            type="link"
            onClick={() => toggleRulePackMutation.mutate({ id: record.id, status: record.status === 'active' ? 'inactive' : 'active' })}
          >
            {record.status === 'active' ? t('security.common.disable') : t('security.common.enable')}
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
    { key: 'overview', label: t('security.tab.overview') },
    { key: 'runtime', label: t('security.tab.runtime') },
    { key: 'data', label: t('security.tab.data') },
    { key: 'risk', label: t('security.tab.risk') },
    { key: 'industry', label: t('security.tab.industry') },
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
              <Tag color="processing">{t('security.hero.chainActive')}</Tag>
              <Tag color="gold">{t('security.hero.guardOnline')}</Tag>
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
                <Statistic title={t('security.stat.activePolicies')} value={overview?.activePolicies ?? 0} prefix={<CheckCircleOutlined />} />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" styles={{ body: { padding: 16 } }}>
                <Statistic title={t('security.stat.openIncidents')} value={overview?.openIncidents ?? 0} prefix={<AlertOutlined />} />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" styles={{ body: { padding: 16 } }}>
                <Statistic title={t('security.stat.rulePacks')} value={overview?.activeRulePacks ?? 0} prefix={<GlobalOutlined />} />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" styles={{ body: { padding: 16 } }}>
                <Statistic title={t('security.stat.blocked24h')} value={overview?.blockedEvents24h ?? 0} prefix={<PauseCircleOutlined />} />
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
            <Card><Statistic title={t('security.stat.criticalOpen')} value={incidents.filter((item) => item.riskLevel === 'critical' || item.riskLevel === 'high').length} /></Card>
          </Col>
          <Col xs={12} xl={6}>
            <Card><Statistic title={t('security.stat.blockedExecutions')} value={blockedExecutions} /></Card>
          </Col>
          <Col xs={12} xl={6}>
            <Card><Statistic title={t('security.stat.pendingRecovery')} value={manualRecoveryCount} /></Card>
          </Col>
          <Col xs={12} xl={6}>
            <Card><Statistic title={t('security.stat.coverageGap')} value={policyGapCount} /></Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card title={t('security.overview.riskQueue')} style={{ borderRadius: 8 }}>
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
            <Card title={t('security.overview.evidenceChain')} style={{ borderRadius: 8 }}>
              <SecurityEvidencePanel events={auditsQuery.data?.records ?? overview?.recentAuditEvents ?? []} />
            </Card>
          </Col>
        </Row>

        <Card title={t('security.overview.coverageSummary')} style={{ borderRadius: 8 }}>
          <SecurityPolicySummary overview={overview} onConfigureRuntime={() => navigate('/security-compliance/runtime')} />
        </Card>
      </Space>
    );
  };

  const renderPolicyDetail = (policy: SecurityPolicy | undefined, versions: SecurityPolicyVersion[], bindings: SecurityBinding[]) => {
    if (!policy) {
      return <Empty description={t('security.detail.selectPolicy')} />;
    }
    return (
      <Space orientation="vertical" style={{ width: '100%' }} size="large">
        <Card
          title={policy.policyName}
          extra={<Tag color={policy.status === 'active' ? 'green' : policy.status === 'draft' ? 'blue' : 'default'}>{statusLabel(policy.status, t)}</Tag>}
          style={{ borderRadius: 20 }}
        >
          <Descriptions column={2} size="small">
            <Descriptions.Item label={t('security.label.policyCode')}>{policy.policyCode}</Descriptions.Item>
            <Descriptions.Item label={t('security.table.type')}>{policyTypeLabel(policy.policyType, t)}</Descriptions.Item>
            <Descriptions.Item label={t('security.label.securityDomain')}>{domainLabel(policy.domainCode, t)}</Descriptions.Item>
            <Descriptions.Item label={t('security.label.effectiveScope')}>{scopeLabel(policy.policyScope, t)}</Descriptions.Item>
            <Descriptions.Item label={t('security.label.enforcementMode')}>{enforcementLabel(policy.enforcementMode, t)}</Descriptions.Item>
            <Descriptions.Item label={t('security.label.riskLevel')}>
              <Tag color={riskColor(policy.riskLevel)}>{riskLevelLabel(policy.riskLevel, t)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('security.label.version')}>v{policy.version}</Descriptions.Item>
            <Descriptions.Item label={t('security.label.publishedAt')}>{formatDateTime(policy.lastPublishedAt)}</Descriptions.Item>
          </Descriptions>
          <Divider />
          <Space orientation="vertical" size={8} style={{ width: '100%' }}>
            <Text strong>{t('security.label.controlPoints')}</Text>
            <Space wrap>{(policy.controlPoints || []).map((item) => <Tag key={item}>{item}</Tag>)}</Space>
            <Text strong>{t('security.label.tags')}</Text>
            <Space wrap>{(policy.tags || []).map((item) => <Tag key={item} color="blue">{item}</Tag>)}</Space>
            <Text strong>{t('security.label.structuredConfig')}</Text>
            <pre style={{ margin: 0, padding: 12, borderRadius: 12, background: token.colorFillAlter, whiteSpace: 'pre-wrap' }}>{stringifyJson(policy.policyConfig)}</pre>
          </Space>
        </Card>

        <Card title={t('security.detail.policyVersions')} style={{ borderRadius: 20 }}>
          <Timeline
            items={versions.map((item) => ({
              color: item.versionNo === policy.version ? 'green' : 'blue',
              children: (
                <Space orientation="vertical" size={2}>
                  <Text strong>v{item.versionNo}</Text>
                  <Text type="secondary">{item.changeSummary || t('security.detail.snapshot')}</Text>
                  <Text type="secondary">{formatDateTime(item.publishedAt)}</Text>
                </Space>
              ),
            }))}
          />
        </Card>

        <Card title={t('security.label.bindings')} style={{ borderRadius: 20 }}>
          {renderStackList({
            items: bindings,
            emptyDescription: t('security.detail.noBindings'),
            getKey: (item) => item.id,
            renderItem: (item) => (
              <Space orientation="vertical" size={2}>
                <Text strong>{scopeLabel(item.bindingType)}</Text>
                <Text type="secondary">{item.targetName || t('security.common.currentTenant')}</Text>
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
            title={t('security.runtime.center')}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openCreatePolicyDrawer('runtime')}>{t('security.runtime.create')}</Button>}
            style={{ borderRadius: 20 }}
          >
            <Space wrap style={{ marginBottom: 16 }}>
              <Search placeholder={t('security.runtime.searchPlaceholder')} allowClear onSearch={setPolicyKeyword} style={{ width: 220 }} />
              <Select placeholder={t('security.filter.status')} allowClear style={{ width: 140 }} options={getPolicyStatusOptions(t)} onChange={setPolicyStatus} />
              <Select placeholder={t('security.filter.riskLevel')} allowClear style={{ width: 140 }} options={getRiskLevelOptions(t)} onChange={setPolicyRiskLevel} />
            </Space>
            <Table
              rowKey="id"
              size="small"
              dataSource={policiesQuery.data?.records ?? []}
              columns={policyColumns}
              pagination={false}
              scroll={{ x: 600 }}
              onRow={(record) => ({ onClick: () => setSelectedPolicyId(record.id) })}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('security.runtime.empty')} /> }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title={t('security.runtime.simCheck')} style={{ borderRadius: 20 }}>
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
                  message.error(t('security.msg.invalidJsonParams'));
                }
              }}
            >
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label={t('security.label.scene')} name="scene">
                    <Select options={[
                      { label: t('security.runtime.sceneGeneric'), value: 'runtime' },
                      { label: t('security.runtime.sceneAgentExec'), value: 'agent_execute' },
                      { label: t('security.runtime.sceneWorkflowStart'), value: 'workflow_start' },
                      { label: t('security.runtime.sceneToolPre'), value: 'tool_pre' },
                    ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={t('security.label.toolCode')} name="toolCode">
                    <Input placeholder={t('security.runtime.toolCodePlaceholder')} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label={t('security.label.content')} name="content">
                <TextArea rows={5} placeholder={t('security.runtime.contentPlaceholder')} />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Agent ID" name="agentId">
                    <Input placeholder={t('security.common.optional')} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={t('security.label.workspaceId')} name="workspaceId">
                    <Input placeholder={t('security.common.optional')} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label={t('security.label.tags')} name="tagsText">
                <Input placeholder={t('security.runtime.tagsPlaceholder')} />
              </Form.Item>
              <Form.Item label={t('security.label.argsJson')} name="argumentsText">
                <TextArea rows={4} spellCheck={false} />
              </Form.Item>
              <Form.Item label={t('security.label.contextJson')} name="contextText">
                <TextArea rows={4} spellCheck={false} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={runtimeCheckMutation.isPending}>
                {t('security.runtime.run')}
              </Button>
            </Form>
            <Divider />
            <SecurityDecisionAlert decision={runtimeDecision} />
          </Card>
        </Col>
      </Row>
      <Card title={t('security.runtime.sandbox')} style={{ borderRadius: 20 }} loading={tenantRuntimePolicyQuery.isLoading}>
        {!tenantId ? (
          <Alert type="warning" showIcon title={t('security.runtime.noTenant')} />
        ) : (
          <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={10}>
                <Card size="small" title={t('security.runtime.runMode')}>
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
                      <Typography.Text>{t('security.runtime.allowLocalImport')}</Typography.Text>
                    </Space>
                    <Alert
                      type="info"
                      showIcon
                      title={t('security.runtime.modeHint')}
                    />
                  </Space>
                </Card>
              </Col>
              <Col xs={24} lg={14}>
                <Card size="small" title={t('security.runtime.baseline')}>
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label={t('security.label.workspaceRoot')}>
                      {tenantRuntimePolicyQuery.data?.workspaceRootPath || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('security.label.maxWorkspace')}>
                      {tenantRuntimePolicyQuery.data?.maxWorkspaceGb ?? '-'} GB
                    </Descriptions.Item>
                    <Descriptions.Item label={t('security.label.maxExecution')}>
                      {tenantRuntimePolicyQuery.data?.maxExecutionMinutes ?? '-'} {t('security.runtime.minutes')}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('security.label.allowedCommands')}>
                      {(tenantRuntimePolicyQuery.data?.sandboxAllowedCommands || []).length}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            <Card size="small" title={t('security.runtime.commandWhitelist')}>
              <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    value={sandboxCommandInput}
                    onChange={(event) => setSandboxCommandInput(event.target.value)}
                    onPressEnter={() => {
                      void handleAddSandboxCommand();
                    }}
                    placeholder={t('security.runtime.commandPlaceholder')}
                    disabled={!tenantRuntimePolicyQuery.data || updateTenantRuntimePolicyMutation.isPending}
                  />
                  <Button
                    type="primary"
                    onClick={() => {
                      void handleAddSandboxCommand();
                    }}
                    loading={updateTenantRuntimePolicyMutation.isPending}
                  >
                    {t('security.runtime.addCommand')}
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
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('security.runtime.noWhitelist')} />
                )}
              </Space>
            </Card>
          </Space>
        )}
      </Card>
      <Card title={t('security.runtime.detailVersions')} style={{ borderRadius: 20 }}>
        {renderPolicyDetail(policyDetail, policyVersions, policyBindings)}
      </Card>
    </Space>
  );

  const renderDataWorkspace = () => (
    <Space orientation="vertical" style={{ width: '100%' }} size="large">
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title={t('security.data.policyCenter')}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openCreatePolicyDrawer('data')}>{t('security.data.create')}</Button>}
            style={{ borderRadius: 20 }}
          >
            <Space wrap style={{ marginBottom: 16 }}>
              <Search placeholder={t('security.runtime.searchPlaceholder')} allowClear onSearch={setPolicyKeyword} style={{ width: 220 }} />
              <Select placeholder={t('security.filter.status')} allowClear style={{ width: 140 }} options={getPolicyStatusOptions(t)} onChange={setPolicyStatus} />
              <Select placeholder={t('security.filter.riskLevel')} allowClear style={{ width: 140 }} options={getRiskLevelOptions(t)} onChange={setPolicyRiskLevel} />
            </Space>
            <Table
              rowKey="id"
              size="small"
              dataSource={policiesQuery.data?.records ?? []}
              columns={policyColumns}
              pagination={false}
              scroll={{ x: 600 }}
              onRow={(record) => ({ onClick: () => setSelectedPolicyId(record.id) })}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('security.data.empty')} /> }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title={t('security.data.baseline')} style={{ borderRadius: 20 }}>
            <Space orientation="vertical" style={{ width: '100%' }} size={12}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label={t('security.data.activePolicies')}>{domainStats['data']?.activePolicies ?? 0}</Descriptions.Item>
                <Descriptions.Item label={t('security.data.keyConfig')}>{policyDetail?.domainCode === 'data' ? t('security.data.keyConfigSelected') : t('security.data.keyConfigHint')}</Descriptions.Item>
                <Descriptions.Item label={t('security.data.recommendedPoints')}>{t('security.data.recommendedPointsValue')}</Descriptions.Item>
                <Descriptions.Item label={t('security.data.hitAction')}>{t('security.data.hitActionValue')}</Descriptions.Item>
              </Descriptions>
              <div>
                <Text strong>{t('security.data.suggestedFlow')}</Text>
                <div style={{ marginTop: 12 }}>
                  {renderStackList({
                    items: [
                      t('security.data.suggestion1'),
                      t('security.data.suggestion2'),
                      t('security.data.suggestion3'),
                    ],
                    emptyDescription: t('security.data.noSuggestion'),
                    getKey: (_item, index) => index,
                    renderItem: (item) => <Text>{item}</Text>,
                  })}
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
      <Card title={t('security.data.detail')} style={{ borderRadius: 20 }}>
        {renderPolicyDetail(policyDetail, policyVersions, policyBindings)}
      </Card>
    </Space>
  );

  const renderRiskWorkspace = () => (
    <Space orientation="vertical" style={{ width: '100%' }} size="large">
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title={t('security.risk.workbench')} style={{ borderRadius: 20 }}>
            <Space wrap style={{ marginBottom: 16 }}>
              <Search placeholder={t('security.risk.searchPlaceholder')} allowClear onSearch={setIncidentKeyword} style={{ width: 240 }} />
              <Select placeholder={t('security.risk.statusFilter')} allowClear style={{ width: 160 }} options={getIncidentStatusOptions(t)} onChange={setIncidentStatus} />
            </Space>
            <Table
              rowKey="id"
              size="small"
              dataSource={incidentsQuery.data?.records ?? []}
              columns={incidentColumns}
              pagination={false}
              scroll={{ x: 700 }}
              onRow={(record) => ({ onClick: () => setSelectedIncidentId(record.id) })}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('security.risk.empty')} /> }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title={t('security.risk.handlePanel')} style={{ borderRadius: 20 }}>
            {!incidentDetail ? (
              <Empty description={t('security.risk.selectIncident')} />
            ) : (
              <Space orientation="vertical" style={{ width: '100%' }} size={14}>
                <Alert
                  type={incidentDetail.decision === 'block' ? 'error' : incidentDetail.decision === 'pause' ? 'warning' : 'info'}
                  showIcon
                  message={incidentDetail.eventTitle}
                  description={incidentDetail.eventDetail || t('security.risk.noDetail')}
                />
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={t('security.label.incidentNo')}>{incidentDetail.incidentNo}</Descriptions.Item>
                  <Descriptions.Item label={t('security.label.traceId')}>
                    <Text copyable={{ text: incidentDetail.traceId }}>{incidentDetail.traceId}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('security.label.source')}>{incidentDetail.sourceType} / {incidentDetail.sourceName || incidentDetail.sourceId || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('security.label.riskLevel')}>
                    <Tag color={riskColor(incidentDetail.riskLevel)}>{riskLevelLabel(incidentDetail.riskLevel, t)}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('security.table.status')}>
                    <Space size={4}>
                      <Tag color={incidentDetail.status === 'resolved' ? 'green' : incidentDetail.status === 'ignored' ? 'default' : incidentDetail.status === 'escalated' ? 'red' : 'processing'}>
                        {incidentStatusLabel(incidentDetail.status, t)}
                      </Tag>
                      <Tag color={decisionColor(incidentDetail.decision)}>{decisionLabel(incidentDetail.decision, t)}</Tag>
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
                <Space wrap>
                  <Button onClick={() => {
                    setIncidentActionType('assign');
                    setIncidentActionOpen(true);
                  }}
                  >
                    {t('security.risk.assign')}
                  </Button>
                  <Button onClick={() => {
                    setIncidentActionType('resolve');
                    setIncidentActionOpen(true);
                  }}
                  >
                    {t('security.risk.resolve')}
                  </Button>
                  <Button onClick={() => {
                    setIncidentActionType('ignore');
                    setIncidentActionOpen(true);
                  }}
                  >
                    {t('security.risk.ignore')}
                  </Button>
                  <Button danger onClick={() => {
                    setIncidentActionType('escalate');
                    setIncidentActionOpen(true);
                  }}
                  >
                    {t('security.risk.escalate')}
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
                            title: t('security.risk.resumeConfirmTitle'),
                            content: t('security.risk.resumeConfirmContent'),
                            okText: t('security.risk.resumeOk'),
                            okType: 'primary',
                            cancelText: t('security.common.cancel'),
                            onOk: () => resumeIncidentMutation.mutate(incidentDetail.id),
                          });
                        }}
                      >
                        {t('security.risk.resume')}
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
          <Card title={t('security.risk.track')} style={{ borderRadius: 20 }}>
            <Timeline
              items={incidentActions.map((item: SecurityIncidentAction) => ({
                color: item.actionType === 'resolve' ? 'green' : item.actionType === 'escalate' ? 'red' : 'blue',
                children: (
                  <Space orientation="vertical" size={2}>
                    <Text strong>{actionTypeLabel(item.actionType, t)}</Text>
                    <Text type="secondary">{item.comment || '-'}</Text>
                    <Text type="secondary">{item.operatorName || 'system'} · {formatDateTime(item.actionAt)}</Text>
                  </Space>
                ),
              }))}
            />
          </Card>
        </Col>
        <Col xs={24} xl={14}>
          <Card title={t('security.risk.traceAudit')} style={{ borderRadius: 20 }}>
            <Table
              rowKey="id"
              size="small"
              dataSource={traceAudits}
              columns={auditColumns}
              pagination={false}
              scroll={{ x: 700 }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('security.risk.noTrace')} /> }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={t('security.risk.controlCenter')}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openCreatePolicyDrawer('risk')}>{t('security.risk.createPolicy')}</Button>}
        style={{ borderRadius: 20 }}
      >
        <Space wrap style={{ marginBottom: 16 }}>
          <Search placeholder={t('security.risk.searchAudit')} allowClear onSearch={setAuditKeyword} style={{ width: 240 }} />
          <Select placeholder={t('security.risk.eventType')} allowClear style={{ width: 160 }} options={getAuditEventOptions(t)} onChange={setAuditEventType} />
          <Select placeholder={t('security.risk.auditStatus')} allowClear style={{ width: 140 }} options={getAuditStatusOptions(t)} onChange={setAuditStatus} />
        </Space>
        <Table
          rowKey="id"
          size="small"
          dataSource={auditsQuery.data?.records ?? []}
          columns={auditColumns}
          pagination={false}
          scroll={{ x: 700 }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('security.risk.noAudit')} /> }}
        />
        <Divider />
        <Table
          rowKey="id"
          size="small"
          dataSource={policiesQuery.data?.records ?? []}
          columns={policyColumns}
          pagination={false}
          scroll={{ x: 600 }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('security.risk.noPolicy')} /> }}
        />
      </Card>
    </Space>
  );

  const renderIndustryWorkspace = () => (
    <Space orientation="vertical" style={{ width: '100%' }} size="large">
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title={t('security.industryPack.packCenter')}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreateRulePackDrawer}>{t('security.industryPack.createPack')}</Button>}
            style={{ borderRadius: 20 }}
          >
            <Space wrap style={{ marginBottom: 16 }}>
              <Search placeholder={t('security.industryPack.searchPlaceholder')} allowClear onSearch={setPackKeyword} style={{ width: 240 }} />
              <Select placeholder={t('security.filter.status')} allowClear style={{ width: 140 }} options={getPolicyStatusOptions(t)} onChange={setPackStatus} />
            </Space>
            <Table
              rowKey="id"
              size="small"
              dataSource={rulePacksQuery.data?.records ?? []}
              columns={rulePackColumns}
              pagination={false}
              scroll={{ x: 680 }}
              onRow={(record) => ({ onClick: () => setSelectedRulePackId(record.id) })}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('security.industryPack.emptyPack')} /> }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title={t('security.industryPack.hitPolicy')} style={{ borderRadius: 20 }}>
            {!rulePackDetail ? (
              <Empty description={t('security.industryPack.selectPack')} />
            ) : (
              <Space orientation="vertical" style={{ width: '100%' }} size={12}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={t('security.industryPack.pack')}>{rulePackDetail.packName}</Descriptions.Item>
                  <Descriptions.Item label={t('security.table.defaultAction')}>
                    <Tag color={decisionColor(rulePackDetail.defaultAction)}>{decisionLabel(rulePackDetail.defaultAction, t)}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('security.label.version')}>v{rulePackDetail.packVersion}</Descriptions.Item>
                  <Descriptions.Item label={t('security.industryPack.bindingCount')}>{rulePackBindings.length}</Descriptions.Item>
                </Descriptions>
                <Alert
                  type="info"
                  showIcon
                  message={t('security.industryPack.adviceTitle')}
                  description={t('security.industryPack.adviceDesc')}
                />
              </Space>
            )}
          </Card>
        </Col>
      </Row>
      <Card title={t('security.industryPack.packDetail')} style={{ borderRadius: 20 }}>
        {!rulePackDetail ? (
          <Empty description={t('security.industryPack.selectPackDetail')} />
        ) : (
          <Space orientation="vertical" style={{ width: '100%' }} size="large">
            <Descriptions column={2} size="small">
              <Descriptions.Item label={t('security.label.code')}>{rulePackDetail.packCode}</Descriptions.Item>
              <Descriptions.Item label={t('security.label.industry')}>{industryLabel(rulePackDetail.industryCode, t)}</Descriptions.Item>
              <Descriptions.Item label={t('security.table.status')}>{statusLabel(rulePackDetail.status, t)}</Descriptions.Item>
              <Descriptions.Item label={t('security.table.defaultAction')}>{decisionLabel(rulePackDetail.defaultAction, t)}</Descriptions.Item>
              <Descriptions.Item label={t('security.label.description')} span={2}>{rulePackDetail.description || '-'}</Descriptions.Item>
            </Descriptions>
            <div>
              <Text strong>{t('security.industryPack.items')}</Text>
              <Table
                rowKey="id"
                style={{ marginTop: 12 }}
                size="small"
                pagination={false}
                dataSource={rulePackDetail.items ?? []}
                columns={[
                  { title: t('security.industryPack.items'), dataIndex: 'itemName', render: (_value, record) => <Space orientation="vertical" size={2}><Text strong>{record.itemName}</Text><Text type="secondary">{record.itemCode}</Text></Space> },
                  { title: t('security.label.matchType'), dataIndex: 'matchType', width: 100, render: (value) => <span style={tableCellNoWrapStyle}>{matchTypeLabel(value, t)}</span> },
                  { title: t('security.label.matchContent'), dataIndex: 'matchContent' },
                  { title: t('security.label.action'), dataIndex: 'action', width: 90, render: (value) => <Tag color={decisionColor(value)} style={tableTagNoWrapStyle}>{decisionLabel(value, t)}</Tag> },
                  { title: t('security.table.level'), dataIndex: 'riskLevel', width: 90, render: (value) => <Tag color={riskColor(value)} style={tableTagNoWrapStyle}>{riskLevelLabel(value, t)}</Tag> },
                ]}
                scroll={{ x: 720 }}
              />
            </div>
            <div>
              <Text strong>{t('security.label.bindings')}</Text>
              <div style={{ marginTop: 12 }}>
                {renderStackList({
                  items: rulePackBindings,
                  emptyDescription: t('security.industryPack.noBindings'),
                  getKey: (item) => item.id,
                  renderItem: (item) => (
                    <Space orientation="vertical" size={2}>
                      <Text strong>{scopeLabel(item.bindingType)}</Text>
                      <Text type="secondary">{item.targetName || t('security.common.currentTenant')}</Text>
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
      title={t('security.pageTitle')}
      extra={<Tag color="gold">{t('security.hero.tagEffective')}</Tag>}
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
        title={editingPolicyId ? t('security.editor.editPolicy') : t('security.editor.createPolicy')}
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
              <Form.Item label={t('security.label.policyCode')} name="policyCode" rules={[{ required: true, message: t('security.rule.policyCodeRequired') }]}>
                <Input disabled={policyEditorLoading} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('security.label.policyName')} name="policyName" rules={[{ required: true, message: t('security.rule.policyNameRequired') }]}>
                <Input disabled={policyEditorLoading} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label={t('security.label.policyType')} name="policyType" rules={[{ required: true, message: t('security.rule.policyTypeRequired') }]}>
                <Select options={getPolicyTypeOptions(t)[policyEditorDomain]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={t('security.label.effectiveScope')} name="policyScope" rules={[{ required: true, message: t('security.rule.scopeRequired') }]}>
                <Select options={getScopeOptions(t)} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={t('security.label.riskLevel')} name="riskLevel" rules={[{ required: true, message: t('security.rule.riskLevelRequired') }]}>
                <Select options={getRiskLevelOptions(t)} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label={t('security.label.enforcementMode')} name="enforcementMode" rules={[{ required: true, message: t('security.rule.enforcementRequired') }]}>
            <Select options={getEnforcementOptions(t)} />
          </Form.Item>
          <Form.Item label={t('security.label.controlPoints')} name="controlPointsText">
            <TextArea rows={3} placeholder={t('security.editor.controlPointsPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('security.label.tags')} name="tagsText">
            <Input placeholder={t('security.runtime.tagsPlaceholder')} />
          </Form.Item>

          <Card size="small" title={t('security.label.bindings')} style={{ marginBottom: 16 }}>
            <Form.List name="bindingDrafts">
              {(fields, { add, remove }) => (
                <Space orientation="vertical" style={{ width: '100%' }} size={12}>
                  {fields.map((field) => (
                    <Row gutter={12} key={field.key}>
                      <Col span={8}>
                        <Form.Item {...field} label={t('security.label.bindings')} name={[field.name, 'bindingType']}>
                          <Select
                            disabled
                            value={watchedPolicyScope}
                            options={getScopeOptions(t).filter((item) => item.value === watchedPolicyScope)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item
                          {...field}
                          label={t('security.label.target')}
                          name={[field.name, 'targetId']}
                          rules={watchedPolicyScope === 'tenant' ? [] : [{ required: true, message: t('security.rule.targetRequired') }]}
                        >
                          {watchedPolicyScope === 'tenant' ? (
                            <Input value={t('security.common.currentTenant')} disabled />
                          ) : (
                            <Select
                              showSearch
                              options={getTargetListByScope(targetOptionsQuery.data, watchedPolicyScope).map((item) => ({ label: item.label, value: item.value }))}
                              placeholder={t('security.rule.targetRequired')}
                            />
                          )}
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item {...field} label={t('security.label.priority')} name={[field.name, 'priority']}>
                          <InputNumber min={1} max={999} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button type="link" danger style={{ marginTop: 30 }} onClick={() => remove(field.name)}>
                          {t('security.common.delete')}
                        </Button>
                      </Col>
                      <Col span={24}>
                        <Form.Item {...field} label={t('security.label.bindingExtJson')} name={[field.name, 'bindingConfigText']}>
                          <TextArea rows={3} spellCheck={false} />
                        </Form.Item>
                      </Col>
                    </Row>
                  ))}
                  <Button
                    onClick={() => add({ bindingType: watchedPolicyScope, priority: 10, bindingConfigText: '{\n}' })}
                  >
                    {t('security.editor.addBinding')}
                  </Button>
                </Space>
              )}
            </Form.List>
          </Card>

          <Card size="small" title={t('security.label.structuredConfig')} style={{ marginBottom: 16 }}>
            {policyEditorDomain === 'runtime' ? (
              <>
                <Form.Item label={t('security.label.keywordBlacklist')} name="keywordsText">
                  <TextArea rows={3} placeholder={t('security.editor.keywordPlaceholder')} />
                </Form.Item>
                <Form.Item label={t('security.label.regexPatterns')} name="regexPatternsText">
                  <TextArea rows={3} placeholder={t('security.editor.regexPlaceholder')} />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label={t('security.label.forbiddenTools')} name="forbiddenToolsText">
                      <TextArea rows={3} placeholder={t('security.runtime.toolCodePlaceholder')} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={t('security.label.forbiddenCommands')} name="forbiddenCommandsText">
                      <TextArea rows={3} placeholder={t('security.editor.forbiddenCommandsPlaceholder')} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label={t('security.label.maxLength')} name="maxLength">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label={t('security.label.hitAction')} name="hitAction">
                      <Select allowClear options={getDecisionOptions(t)} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label={t('security.label.manualReview')} name="reviewRequired" valuePropName="checked">
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
                    <Form.Item label={t('security.label.sessionTtl')} name="sessionTtlMinutes">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label={t('security.label.maxSessions')} name="maxSessions">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label={t('security.label.transportProtocol')} name="transportProtocol">
                      <Input placeholder={t('security.editor.transportPlaceholder')} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label={t('security.label.storageAlgorithm')} name="storageAlgorithm">
                      <Input placeholder={t('security.editor.storagePlaceholder')} />
                    </Form.Item>
                  </Col>
                  <Col span={16}>
                    <Form.Item label={t('security.label.allowedRegions')} name="allowedRegionsText">
                      <Input placeholder={t('security.editor.regionsPlaceholder')} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={6}>
                    <Form.Item label={t('security.label.encryptStorage')} name="encryptStorage" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label={t('security.label.encryptTransport')} name="encryptTransport" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label={t('security.label.forbidMemoryWrite')} name="forbidMemoryWrite" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label={t('security.label.maskedOutput')} name="requireMaskedOutput" valuePropName="checked">
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
                    <Form.Item label={t('security.label.tenantQps')} name="tenantQps">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label={t('security.label.userDailyQuota')} name="userDailyQuota">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label={t('security.label.temporaryBan')} name="temporaryBanMinutes">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label={t('security.label.anomalyThreshold')} name="anomalyThreshold">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label={t('security.label.auditRetention')} name="auditRetentionDays">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label={t('security.label.autoEscalate')} name="autoEscalate" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label={t('security.label.ipAllowList')} name="ipAllowListText">
                  <TextArea rows={2} />
                </Form.Item>
                <Form.Item label={t('security.label.ipBlockList')} name="ipBlockListText">
                  <TextArea rows={2} />
                </Form.Item>
                <Form.Item label={t('security.label.highRiskTags')} name="highRiskTagsText">
                  <Input placeholder={t('security.editor.highRiskTagsPlaceholder')} />
                </Form.Item>
              </>
            ) : null}
          </Card>

          <Form.Item label={t('security.label.advancedSelector')} name="advancedSelectorText">
            <TextArea rows={4} spellCheck={false} />
          </Form.Item>
          <Form.Item label={t('security.label.advancedConfig')} name="advancedConfigText">
            <TextArea rows={6} spellCheck={false} />
          </Form.Item>
          <Form.Item label={t('security.label.description')} name="description">
            <TextArea rows={3} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={createOrUpdatePolicyMutation.isPending || policyEditorLoading}>
              {t('security.editor.savePolicy')}
            </Button>
            <Button onClick={() => setPolicyEditorOpen(false)}>{t('security.common.cancel')}</Button>
          </Space>
        </Form>
      </Drawer>

      <Drawer
        title={editingRulePackId ? t('security.editor.editRulePack') : t('security.editor.createRulePack')}
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
              <Form.Item label={t('security.label.packCode')} name="packCode" rules={[{ required: true, message: t('security.rule.codeRequired') }]}>
                <Input disabled={rulePackEditorLoading} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={t('security.label.packName')} name="packName" rules={[{ required: true, message: t('security.rule.nameRequired') }]}>
                <Input disabled={rulePackEditorLoading} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={t('security.label.industryCode')} name="industryCode" rules={[{ required: true, message: t('security.rule.industryRequired') }]}>
                <Select options={getIndustryOptions(t)} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label={t('security.table.defaultAction')} name="defaultAction">
                <Select options={getDecisionOptions(t)} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={t('security.label.businessLine')} name="businessLine">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={t('security.label.reviewOwner')} name="reviewOwner">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={18}>
              <Form.Item label={t('security.label.regulators')} name="regulatorsText">
                <Input placeholder={t('security.editor.regulatorsPlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={t('security.label.evidenceRequired')} name="evidenceRequired" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label={t('security.label.description')} name="description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item label={t('security.label.advancedConfig')} name="advancedConfigText">
            <TextArea rows={4} spellCheck={false} />
          </Form.Item>

          <Card size="small" title={t('security.label.bindings')} style={{ marginBottom: 16 }}>
            <Form.List name="bindingDrafts">
              {(fields, { add, remove }) => (
                <Space orientation="vertical" style={{ width: '100%' }} size={12}>
                  {fields.map((field) => {
                    const bindingType = rulePackForm.getFieldValue(['bindingDrafts', field.name, 'bindingType']);
                    return (
                      <Row gutter={12} key={field.key}>
                        <Col span={6}>
                          <Form.Item {...field} label={t('security.label.scope')} name={[field.name, 'bindingType']}>
                            <Select options={getScopeOptions(t)} />
                          </Form.Item>
                        </Col>
                        <Col span={10}>
                          <Form.Item {...field} label={t('security.label.target')} name={[field.name, 'targetId']}>
                            {bindingType === 'tenant' ? (
                              <Input value={t('security.common.currentTenant')} disabled />
                            ) : (
                              <Select
                                showSearch
                                options={getTargetListByScope(targetOptionsQuery.data, bindingType).map((item) => ({ label: item.label, value: item.value }))}
                              />
                            )}
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item {...field} label={t('security.label.priority')} name={[field.name, 'priority']}>
                            <InputNumber min={1} max={999} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Button type="link" danger style={{ marginTop: 30 }} onClick={() => remove(field.name)}>
                            {t('security.common.delete')}
                          </Button>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...field} label={t('security.label.bindingExtJson')} name={[field.name, 'bindingConfigText']}>
                            <TextArea rows={3} spellCheck={false} />
                          </Form.Item>
                        </Col>
                      </Row>
                    );
                  })}
                  <Button onClick={() => add({ bindingType: 'tenant', priority: 10, bindingConfigText: '{\n}' })}>
                    {t('security.editor.addBinding')}
                  </Button>
                </Space>
              )}
            </Form.List>
          </Card>

          <Card size="small" title={t('security.industryPack.items')}>
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <Space orientation="vertical" style={{ width: '100%' }} size={16}>
                  {fields.map((field) => (
                    <Card key={field.key} size="small" type="inner" title={t('security.editor.itemIndex', { index: field.name + 1 })}>
                      <Row gutter={12}>
                        <Col span={8}>
                          <Form.Item {...field} label={t('security.label.itemCode')} name={[field.name, 'itemCode']} rules={[{ required: true, message: t('security.rule.codeRequired') }]}>
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item {...field} label={t('security.label.itemName')} name={[field.name, 'itemName']} rules={[{ required: true, message: t('security.rule.nameRequired') }]}>
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item {...field} label={t('security.label.ruleSource')} name={[field.name, 'ruleSource']}>
                            <Input />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={12}>
                        <Col span={8}>
                          <Form.Item {...field} label={t('security.label.matchType')} name={[field.name, 'matchType']}>
                            <Select options={[
                              { label: t('security.matchType.contains'), value: 'contains' },
                              { label: t('security.matchType.exact'), value: 'exact' },
                              { label: t('security.matchType.regex'), value: 'regex' },
                            ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item {...field} label={t('security.label.action')} name={[field.name, 'action']}>
                            <Select options={getDecisionOptions(t)} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item {...field} label={t('security.label.sortOrder')} name={[field.name, 'sortOrder']}>
                            <InputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item {...field} label={t('security.label.enabled')} name={[field.name, 'enabled']} valuePropName="checked">
                            <Switch />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item {...field} label={t('security.label.clause')} name={[field.name, 'ruleClause']}>
                        <Input />
                      </Form.Item>
                      <Form.Item {...field} label={t('security.label.matchContent')} name={[field.name, 'matchContent']}>
                        <TextArea rows={2} />
                      </Form.Item>
                      <Form.Item {...field} label={t('security.label.extJson')} name={[field.name, 'itemConfigText']}>
                        <TextArea rows={3} spellCheck={false} />
                      </Form.Item>
                      <Button type="link" danger onClick={() => remove(field.name)}>{t('security.editor.deleteItem')}</Button>
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
                    {t('security.editor.addItem')}
                  </Button>
                </Space>
              )}
            </Form.List>
          </Card>

          <Divider />
          <Space>
            <Button type="primary" htmlType="submit" loading={createOrUpdateRulePackMutation.isPending || rulePackEditorLoading}>
              {t('security.editor.savePack')}
            </Button>
            <Button onClick={() => setRulePackEditorOpen(false)}>{t('security.common.cancel')}</Button>
          </Space>
        </Form>
      </Drawer>

      <Modal
        title={t('security.incidentModal.title')}
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
              <Form.Item label={t('security.label.assigneeId')} name="assigneeId">
                <Input />
              </Form.Item>
              <Form.Item label={t('security.label.assigneeName')} name="assigneeName">
                <Input />
              </Form.Item>
            </>
          ) : null}
          <Form.Item label={t('security.label.comment')} name="comment" rules={[{ required: true, message: t('security.rule.commentRequired') }]}>
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

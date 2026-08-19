/**
 * 安全合规模块类型定义
 */

export type SecurityDomainCode = 'runtime' | 'data' | 'risk' | 'industry';
export type SecurityScope = 'tenant' | 'agent' | 'workflow' | 'project';
export type SecurityPolicyStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type SecurityRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type SecurityEnforcementMode = 'audit' | 'warn' | 'block';
export type SecurityDecision = 'allow' | 'warn' | 'block' | 'pause';
export type SecurityAuditStatus = 'success' | 'warning' | 'blocked' | 'failed';
export type SecurityIncidentStatus = 'new' | 'assigned' | 'investigating' | 'resolved' | 'ignored' | 'escalated';

export interface SecurityTargetOption {
  scope: SecurityScope | string;
  value: string;
  label: string;
  status?: string;
  extra?: Record<string, unknown>;
}

export interface SecurityTargetOptions {
  tenant: SecurityTargetOption[];
  agent: SecurityTargetOption[];
  workflow: SecurityTargetOption[];
  project: SecurityTargetOption[];
}

export interface SecurityPolicyTargetSelector {
  scope?: SecurityScope | string;
  tenantScope?: string;
  agentIds?: string[];
  workflowTemplateIds?: string[];
  workspaceIds?: string[];
  resolvedTargets?: Array<Record<string, unknown>>;
  targetCount?: number;
  [key: string]: unknown;
}

export interface SecurityPolicy {
  id: string;
  tenantId: string;
  policyCode: string;
  policyName: string;
  domainCode: SecurityDomainCode | string;
  policyType: string;
  policyScope: SecurityScope | string;
  status: SecurityPolicyStatus | string;
  enforcementMode: SecurityEnforcementMode | string;
  riskLevel: SecurityRiskLevel | string;
  version: number;
  isBuiltin: boolean;
  controlPoints?: string[];
  tags?: string[];
  targetSelector?: SecurityPolicyTargetSelector;
  policyConfig?: Record<string, unknown>;
  description?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  lastPublishedAt?: string;
}

export interface SecurityPolicyVersion {
  id: string;
  policyId: string;
  versionNo: number;
  snapshotConfig?: Record<string, unknown>;
  snapshotTargets?: Record<string, unknown>;
  changeSummary?: string;
  publishedBy?: string;
  publishedAt?: string;
}

export interface SecurityBinding {
  id: string;
  sourceType: string;
  sourceId: string;
  sourceCode?: string;
  sourceName?: string;
  bindingType: SecurityScope | string;
  targetId?: string;
  targetName?: string;
  domainCode?: SecurityDomainCode | string;
  status?: string;
  priority?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  bindingConfig?: Record<string, unknown>;
}

export interface SecurityAuditEvent {
  id: string;
  tenantId: string;
  traceId: string;
  eventType: string;
  eventSource: string;
  eventStatus: SecurityAuditStatus | string;
  riskLevel?: SecurityRiskLevel | string;
  domainCode?: SecurityDomainCode | string;
  policyId?: string;
  policyCode?: string;
  resourceType?: string;
  resourceId?: string;
  eventTitle: string;
  eventDetail?: string;
  actorUserId?: string;
  actorUsername?: string;
  clientIp?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

export interface SecurityMatchedRule {
  sourceType: string;
  sourceId: string;
  sourceCode?: string;
  sourceName?: string;
  itemId?: string;
  itemCode?: string;
  itemName?: string;
  riskLevel?: SecurityRiskLevel | string;
  action?: SecurityDecision | string;
  hitReason?: string;
}

export interface SecurityCheckDecisionResult {
  decision: SecurityDecision | string;
  traceId: string;
  incidentId?: string;
  message?: string;
  userActionTip?: string;
  adminActionTip?: string;
  shouldCreateIncident?: boolean;
  matchedPolicies?: SecurityMatchedRule[];
  matchedRulePacks?: SecurityMatchedRule[];
}

export interface SecurityIncidentAction {
  id: string;
  incidentId: string;
  actionType: string;
  actionResult?: string;
  comment?: string;
  metadata?: Record<string, unknown>;
  operatorId?: string;
  operatorName?: string;
  actionAt?: string;
}

export interface SecurityIncident {
  id: string;
  tenantId: string;
  incidentNo: string;
  traceId: string;
  domainCode: SecurityDomainCode | string;
  riskLevel: SecurityRiskLevel | string;
  status: SecurityIncidentStatus | string;
  sourceType: string;
  sourceId?: string;
  sourceName?: string;
  policyId?: string;
  policyCode?: string;
  decision?: SecurityDecision | string;
  eventTitle: string;
  eventDetail?: string;
  assignedTo?: string;
  assignedName?: string;
  resolvedAt?: string;
  resolutionSummary?: string;
  payload?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  actions?: SecurityIncidentAction[];
}

export interface SecurityRuleItem {
  id: string;
  packId: string;
  itemCode: string;
  itemName: string;
  ruleSource?: string;
  ruleClause?: string;
  riskLevel?: SecurityRiskLevel | string;
  action?: SecurityDecision | string;
  matchType?: string;
  matchContent?: string;
  sortOrder?: number;
  enabled?: boolean;
  itemConfig?: Record<string, unknown>;
}

export interface SecurityRulePack {
  id: string;
  tenantId: string;
  packCode: string;
  packName: string;
  industryCode: string;
  status: SecurityPolicyStatus | string;
  packVersion: number;
  defaultAction: SecurityDecision | string;
  isBuiltin: boolean;
  description?: string;
  packConfig?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  items?: SecurityRuleItem[];
  bindings?: SecurityBinding[];
}

export interface SecurityDomainOverview {
  domainCode: SecurityDomainCode | string;
  totalPolicies: number;
  activePolicies: number;
  blockedEvents24h: number;
}

export interface SecurityOverview {
  totalPolicies: number;
  activePolicies: number;
  draftPolicies: number;
  criticalPolicies: number;
  blockedEvents24h: number;
  warningEvents24h: number;
  openIncidents: number;
  activeRulePacks: number;
  latestPublishedAt?: string;
  domainStats: SecurityDomainOverview[];
  recentAuditEvents: SecurityAuditEvent[];
  recentIncidents: SecurityIncident[];
}

export interface SecurityPolicyQueryDTO {
  page?: number;
  size?: number;
  domainCode?: SecurityDomainCode | string;
  status?: string;
  riskLevel?: string;
  keyword?: string;
}

export interface SecurityPolicySaveDTO {
  policyCode: string;
  policyName: string;
  domainCode: SecurityDomainCode | string;
  policyType: string;
  policyScope: SecurityScope | string;
  enforcementMode: SecurityEnforcementMode | string;
  riskLevel: SecurityRiskLevel | string;
  controlPoints?: string[];
  tags?: string[];
  targetSelector?: SecurityPolicyTargetSelector;
  policyConfig?: Record<string, unknown>;
  description?: string;
}

export interface SecurityPolicyToggleDTO {
  status: 'active' | 'inactive';
}

export interface SecurityAuditEventQueryDTO {
  page?: number;
  size?: number;
  domainCode?: SecurityDomainCode | string;
  eventType?: string;
  eventStatus?: string;
  riskLevel?: string;
  traceId?: string;
  keyword?: string;
  startTime?: string;
  endTime?: string;
}

export interface SecurityBindingSaveDTO {
  bindings: Array<{
    bindingType: SecurityScope | string;
    targetId?: string;
    targetName?: string;
    priority?: number;
    effectiveFrom?: string;
    effectiveTo?: string;
    bindingConfig?: Record<string, unknown>;
  }>;
}

export interface SecurityIncidentQueryDTO {
  page?: number;
  size?: number;
  domainCode?: SecurityDomainCode | string;
  status?: string;
  riskLevel?: string;
  sourceType?: string;
  decision?: string;
  keyword?: string;
  traceId?: string;
  startTime?: string;
  endTime?: string;
}

export interface SecurityIncidentActionDTO {
  assigneeId?: string;
  assigneeName?: string;
  comment: string;
}

export interface SecurityRulePackQueryDTO {
  page?: number;
  size?: number;
  industryCode?: string;
  status?: string;
  keyword?: string;
}

export interface SecurityRuleItemSaveDTO {
  itemCode: string;
  itemName: string;
  ruleSource?: string;
  ruleClause?: string;
  riskLevel?: SecurityRiskLevel | string;
  action?: SecurityDecision | string;
  matchType?: string;
  matchContent?: string;
  sortOrder?: number;
  enabled?: boolean;
  itemConfig?: Record<string, unknown>;
}

export interface SecurityRulePackSaveDTO {
  packCode: string;
  packName: string;
  industryCode: string;
  defaultAction: Exclude<SecurityDecision, 'allow'> | string;
  description?: string;
  packConfig?: Record<string, unknown>;
  items?: SecurityRuleItemSaveDTO[];
}

export interface SecurityRulePackToggleDTO {
  status: SecurityPolicyStatus | string;
}

export interface SecurityRuntimeCheckDTO {
  scene?: string;
  domainCode?: SecurityDomainCode | string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  agentId?: string;
  workflowInstanceId?: string;
  workflowNodeId?: string;
  workspaceId?: string;
  traceId?: string;
  content?: string;
  toolCode?: string;
  arguments?: Record<string, unknown>;
  tags?: string[];
  context?: Record<string, unknown>;
}

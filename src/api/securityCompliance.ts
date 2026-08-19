import request from './request';
import type { PageResult, R } from '@/types/common';
import type {
  SecurityAuditEvent,
  SecurityAuditEventQueryDTO,
  SecurityBinding,
  SecurityBindingSaveDTO,
  SecurityCheckDecisionResult,
  SecurityIncident,
  SecurityIncidentAction,
  SecurityIncidentActionDTO,
  SecurityIncidentQueryDTO,
  SecurityOverview,
  SecurityPolicy,
  SecurityPolicyQueryDTO,
  SecurityPolicySaveDTO,
  SecurityPolicyToggleDTO,
  SecurityPolicyVersion,
  SecurityRuleItem,
  SecurityRulePack,
  SecurityRulePackQueryDTO,
  SecurityRulePackSaveDTO,
  SecurityRulePackToggleDTO,
  SecurityRuntimeCheckDTO,
  SecurityTargetOptions,
} from '@/types/securityCompliance';

/**
 * 获取安全合规总览
 */
export const fetchSecurityOverview = () =>
  request.get<unknown, R<SecurityOverview>>('/security-compliance/overview');

/**
 * 查询安全策略目标选项
 */
export const fetchSecurityTargetOptions = (scope?: string) =>
  request.get<unknown, R<SecurityTargetOptions>>('/security-compliance/targets/options', {
    params: { scope },
  });

/**
 * 分页查询安全策略
 */
export const fetchSecurityPolicies = (params: SecurityPolicyQueryDTO) =>
  request.get<unknown, R<PageResult<SecurityPolicy>>>('/security-compliance/policies', { params });

/**
 * 获取安全策略详情
 */
export const fetchSecurityPolicyDetail = (id: string) =>
  request.get<unknown, R<SecurityPolicy>>(`/security-compliance/policies/${id}`);

/**
 * 获取安全策略版本
 */
export const fetchSecurityPolicyVersions = (id: string) =>
  request.get<unknown, R<SecurityPolicyVersion[]>>(`/security-compliance/policies/${id}/versions`);

/**
 * 获取安全策略绑定
 */
export const fetchSecurityPolicyBindings = (id: string) =>
  request.get<unknown, R<SecurityBinding[]>>(`/security-compliance/policies/${id}/bindings`);

/**
 * 保存安全策略绑定
 */
export const saveSecurityPolicyBindings = (id: string, data: SecurityBindingSaveDTO) =>
  request.post<unknown, R<SecurityBinding[]>>(`/security-compliance/policies/${id}/bindings`, data);

/**
 * 创建安全策略
 */
export const createSecurityPolicy = (data: SecurityPolicySaveDTO) =>
  request.post<unknown, R<SecurityPolicy>>('/security-compliance/policies', data);

/**
 * 更新安全策略
 */
export const updateSecurityPolicy = (id: string, data: SecurityPolicySaveDTO) =>
  request.put<unknown, R<SecurityPolicy>>(`/security-compliance/policies/${id}`, data);

/**
 * 发布安全策略
 */
export const publishSecurityPolicy = (id: string) =>
  request.post<unknown, R<SecurityPolicy>>(`/security-compliance/policies/${id}/publish`);

/**
 * 切换安全策略状态
 */
export const toggleSecurityPolicy = (id: string, data: SecurityPolicyToggleDTO) =>
  request.post<unknown, R<SecurityPolicy>>(`/security-compliance/policies/${id}/toggle`, data);

/**
 * 删除安全策略
 */
export const deleteSecurityPolicy = (id: string) =>
  request.delete<unknown, R<void>>(`/security-compliance/policies/${id}`);

/**
 * 分页查询安全审计事件
 */
export const fetchSecurityAuditEvents = (params: SecurityAuditEventQueryDTO) =>
  request.get<unknown, R<PageResult<SecurityAuditEvent>>>('/security-compliance/audit-events', { params });

/**
 * 获取安全审计事件详情
 */
export const fetchSecurityAuditEventDetail = (id: string) =>
  request.get<unknown, R<SecurityAuditEvent>>(`/security-compliance/audit-events/${id}`);

/**
 * 根据链路查询安全审计
 */
export const fetchSecurityAuditEventsByTrace = (traceId: string) =>
  request.get<unknown, R<SecurityAuditEvent[]>>(`/security-compliance/audit-events/trace/${traceId}`);

/**
 * 分页查询安全事件
 */
export const fetchSecurityIncidents = (params: SecurityIncidentQueryDTO) =>
  request.get<unknown, R<PageResult<SecurityIncident>>>('/security-compliance/incidents', { params });

/**
 * 获取安全事件详情
 */
export const fetchSecurityIncidentDetail = (id: string) =>
  request.get<unknown, R<SecurityIncident>>(`/security-compliance/incidents/${id}`);

/**
 * 获取安全事件处置记录
 */
export const fetchSecurityIncidentActions = (id: string) =>
  request.get<unknown, R<SecurityIncidentAction[]>>(`/security-compliance/incidents/${id}/actions`);

/**
 * 分派事件
 */
export const assignSecurityIncident = (id: string, data: SecurityIncidentActionDTO) =>
  request.post<unknown, R<SecurityIncident>>(`/security-compliance/incidents/${id}/assign`, data);

/**
 * 解决事件
 */
export const resolveSecurityIncident = (id: string, data: SecurityIncidentActionDTO) =>
  request.post<unknown, R<SecurityIncident>>(`/security-compliance/incidents/${id}/resolve`, data);

/**
 * 忽略事件
 */
export const ignoreSecurityIncident = (id: string, data: SecurityIncidentActionDTO) =>
  request.post<unknown, R<SecurityIncident>>(`/security-compliance/incidents/${id}/ignore`, data);

/**
 * 升级事件
 */
export const escalateSecurityIncident = (id: string, data: SecurityIncidentActionDTO) =>
  request.post<unknown, R<SecurityIncident>>(`/security-compliance/incidents/${id}/escalate`, data);

/**
 * 恢复被安全暂停的资源
 */
export const resumeSecurityIncidentResource = (id: string) =>
  request.post<unknown, R<SecurityIncident>>(`/security-compliance/incidents/${id}/resume-resource`);

/**
 * 分页查询规则包
 */
export const fetchSecurityRulePacks = (params: SecurityRulePackQueryDTO) =>
  request.get<unknown, R<PageResult<SecurityRulePack>>>('/security-compliance/rule-packs', { params });

/**
 * 获取规则包详情
 */
export const fetchSecurityRulePackDetail = (id: string) =>
  request.get<unknown, R<SecurityRulePack>>(`/security-compliance/rule-packs/${id}`);

/**
 * 创建规则包
 */
export const createSecurityRulePack = (data: SecurityRulePackSaveDTO) =>
  request.post<unknown, R<SecurityRulePack>>('/security-compliance/rule-packs', data);

/**
 * 更新规则包
 */
export const updateSecurityRulePack = (id: string, data: SecurityRulePackSaveDTO) =>
  request.put<unknown, R<SecurityRulePack>>(`/security-compliance/rule-packs/${id}`, data);

/**
 * 切换规则包状态
 */
export const toggleSecurityRulePack = (id: string, data: SecurityRulePackToggleDTO) =>
  request.post<unknown, R<SecurityRulePack>>(`/security-compliance/rule-packs/${id}/toggle`, data);

/**
 * 获取规则项
 */
export const fetchSecurityRuleItems = (id: string) =>
  request.get<unknown, R<SecurityRuleItem[]>>(`/security-compliance/rule-packs/${id}/items`);

/**
 * 获取规则包绑定
 */
export const fetchSecurityRulePackBindings = (id: string) =>
  request.get<unknown, R<SecurityBinding[]>>(`/security-compliance/rule-packs/${id}/bindings`);

/**
 * 保存规则包绑定
 */
export const saveSecurityRulePackBindings = (id: string, data: SecurityBindingSaveDTO) =>
  request.post<unknown, R<SecurityBinding[]>>(`/security-compliance/rule-packs/${id}/bind-tenants`, data);

/**
 * 执行运行时安全检查
 */
export const runSecurityRuntimeCheck = (data: SecurityRuntimeCheckDTO) =>
  request.post<unknown, R<SecurityCheckDecisionResult>>('/security-compliance/checks/runtime', data);

/**
 * 路由语义解析
 * 统一为 Header、Breadcrumb、PageContainer 提供模块名、页面名与路径轨迹
 */
import type { TFunction } from 'i18next';

const DETAIL_SEGMENT_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MODULE_LABEL_KEYS: Array<{ prefix: string; key: string }> = [
  { prefix: '/agent', key: 'menu.agent' },
  { prefix: '/spec', key: 'menu.spec' },
  { prefix: '/context', key: 'menu.context' },
  { prefix: '/workflow', key: 'menu.workflow' },
  { prefix: '/quality', key: 'menu.quality' },
  { prefix: '/monitor', key: 'menu.monitor' },
  { prefix: '/cost', key: 'menu.cost' },
  { prefix: '/evaluation', key: 'menu.evaluation' },
  { prefix: '/approval-center', key: 'menu.approvalCenter' },
  { prefix: '/profile', key: 'menu.userMemory' },
  { prefix: '/project', key: 'menu.projectManagement' },
  { prefix: '/security-compliance', key: 'menu.securityCompliance' },
  { prefix: '/data-management', key: 'menu.dataManagement' },
  { prefix: '/integration', key: 'menu.integration' },
  { prefix: '/notification', key: 'menu.notificationManagement' },
  { prefix: '/system', key: 'menu.system' },
];

const EXACT_ROUTE_LABEL_KEYS: Record<string, string> = {
  '/': 'menu.dashboard',
  '/agent': 'menu.agent',
  '/agent/create': 'agent.createAgent',
  '/spec': 'menu.spec',
  '/spec/create': 'spec.create.title',
  '/spec/templates': 'spec.createTemplate',
  '/context': 'menu.context',
  '/context/create': 'context.create.title',
  '/workflow/config': 'workflow.center',
  '/workflow/executions': 'workflow.executionList',
  '/workflow/triggers': 'trigger.title',
  '/workflow/create': 'workflow.create.title',
  '/workflow/designer': 'workflow.designer.title',
  '/quality': 'menu.quality',
  '/quality/deviations': 'quality.deviation.pageTitle',
  '/quality/intent-defects': 'quality.defect.pageTitle',
  '/quality/cross-reviews': 'quality.crossReview.pageTitle',
  '/quality/rules': 'quality.ruleConfig.pageTitle',
  '/monitor': 'monitor.center',
  '/monitor/reports': 'monitor.reportsCenter',
  '/monitor/traces': 'monitor.traceCenter',
  '/cost': 'cost.center',
  '/evaluation': 'menu.evaluation',
  '/evaluation/datasets': 'evaluation.datasetsTab',
  '/evaluation/tasks': 'evaluation.tasksTab',
  '/approval-center': 'approvalCenter.title',
  '/profile': 'userMemory.pageTitle',
  '/project/workspaces': 'menu.projectWorkspaceManagement',
  '/project/import': 'workspace.import',
  '/project/branches': 'menu.projectBranchManagement',
  '/project/branch-rules': 'menu.projectBranchRuleManagement',
  '/security-compliance/overview': 'menu.securityComplianceOverview',
  '/security-compliance/runtime': 'menu.securityComplianceRuntime',
  '/security-compliance/data': 'menu.securityComplianceData',
  '/security-compliance/risk': 'menu.securityComplianceRisk',
  '/security-compliance/industry': 'menu.securityComplianceIndustry',
  '/integration/marketplace': 'marketplace.title',
  '/integration/skill': 'menu.integrationSkill',
  '/integration/mcp': 'menu.integrationMcp',
  '/integration/cicd': 'menu.integrationCicd',
  '/data-management/ai-gateway': 'menu.integrationAiGateway',
  '/data-management/database-connection': 'menu.integrationDatabaseConnection',
  '/data-management/database-text2sql': 'menu.integrationDatabaseText2Sql',
  '/data-management/semantic-models': 'menu.semanticModels',
  '/data-management/semantic-query': 'menu.semanticQuery',
  '/notification/inbox': 'notification.inboxTitle',
  '/notification/channel': 'menu.notificationChannel',
  '/notification/message-template': 'menu.notificationMessageTemplate',
  '/notification/record': 'notificationRecord.management',
  '/system/user': 'system.user.title',
  '/system/role': 'system.role.title',
  '/system/menu': 'system.menu.title',
  '/system/model': 'system.config.title',
  '/system/rag': 'menu.systemRag',
  '/system/dict': 'menu.systemDict',
  '/system/tenant': 'system.tenant.title',
};

const SEGMENT_LABEL_KEYS: Record<string, string> = {
  agent: 'menu.agent',
  spec: 'menu.spec',
  context: 'menu.context',
  workflow: 'menu.workflow',
  config: 'menu.workflowConfig',
  executions: 'menu.workflowExecutions',
  triggers: 'menu.workflowTriggers',
  quality: 'menu.quality',
  deviations: 'menu.qualityDeviation',
  'intent-defects': 'menu.qualityIntentDefect',
  'cross-reviews': 'menu.qualityCrossReview',
  rules: 'menu.qualityRuleConfig',
  monitor: 'menu.monitor',
  reports: 'menu.monitorReports',
  traces: 'menu.monitorTraces',
  cost: 'menu.cost',
  evaluation: 'menu.evaluation',
  datasets: 'evaluation.datasetsTab',
  tasks: 'evaluation.tasksTab',
  'approval-center': 'menu.approvalCenter',
  profile: 'menu.userMemory',
  project: 'menu.projectManagement',
  workspaces: 'menu.projectWorkspaceManagement',
  import: 'workspace.import',
  branches: 'menu.projectBranchManagement',
  'branch-rules': 'menu.projectBranchRuleManagement',
  integration: 'menu.integration',
  'data-management': 'menu.dataManagement',
  'ai-gateway': 'menu.integrationAiGateway',
  'database-connection': 'menu.integrationDatabaseConnection',
  'database-text2sql': 'menu.integrationDatabaseText2Sql',
  'semantic-models': 'menu.semanticModels',
  'semantic-query': 'menu.semanticQuery',
  marketplace: 'marketplace.title',
  skill: 'menu.integrationSkill',
  mcp: 'menu.integrationMcp',
  cicd: 'menu.integrationCicd',
  notification: 'menu.notificationManagement',
  inbox: 'notification.inboxTitle',
  channel: 'menu.notificationChannel',
  'message-template': 'menu.notificationMessageTemplate',
  record: 'notificationRecord.management',
  system: 'menu.system',
  user: 'menu.systemUser',
  role: 'menu.systemRole',
  menu: 'menu.systemMenu',
  model: 'menu.systemModel',
  rag: 'menu.systemRag',
  dict: 'menu.systemDict',
  tenant: 'menu.systemTenant',
  'security-compliance': 'menu.securityCompliance',
  overview: 'menu.securityComplianceOverview',
  runtime: 'menu.securityComplianceRuntime',
  data: 'menu.securityComplianceData',
  risk: 'menu.securityComplianceRisk',
  industry: 'menu.securityComplianceIndustry',
  create: 'common.create',
  edit: 'common.edit',
};

const normalizePath = (pathname: string) => {
  if (!pathname || pathname === '/') {
    return '/';
  }
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
};

const humanizeSegment = (segment: string) =>
  segment
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

const translatePathSegment = (segment: string, t: TFunction) => {
  if (!segment) {
    return t('menu.dashboard');
  }
  if (DETAIL_SEGMENT_PATTERN.test(segment)) {
    return t('common.detail');
  }
  const labelKey = SEGMENT_LABEL_KEYS[segment];
  if (labelKey) {
    return t(labelKey);
  }
  return humanizeSegment(segment);
};

export interface RouteContext {
  moduleLabel: string;
  pageLabel: string;
  trailLabel: string;
  normalizedPath: string;
}

export function resolveRouteContext(pathname: string, t: TFunction): RouteContext {
  const normalizedPath = normalizePath(pathname);
  if (normalizedPath === '/') {
    return {
      moduleLabel: t('layout.subtitle'),
      pageLabel: t('menu.dashboard'),
      trailLabel: t('layout.subtitle'),
      normalizedPath,
    };
  }

  const moduleKey = MODULE_LABEL_KEYS.find((item) => normalizedPath.startsWith(item.prefix))?.key ?? 'menu.dashboard';
  const exactLabelKey = EXACT_ROUTE_LABEL_KEYS[normalizedPath];
  const segments = normalizedPath.split('/').filter(Boolean);
  const isSemanticWorkbench = segments.length === 3
    && segments[0] === 'data-management'
    && segments[1] === 'semantic-models';
  const pageLabel = isSemanticWorkbench
    ? t('semantic.workbench.title')
    : exactLabelKey
      ? t(exactLabelKey)
      : translatePathSegment(segments[segments.length - 1], t);
  const trailLabel = segments
    .map((segment, index) => (isSemanticWorkbench && index === segments.length - 1
      ? pageLabel
      : translatePathSegment(segment, t)))
    .join(' / ');

  return {
    moduleLabel: t(moduleKey),
    pageLabel,
    trailLabel,
    normalizedPath,
  };
}

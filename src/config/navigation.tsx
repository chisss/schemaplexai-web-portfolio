/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react';
import {
  DashboardOutlined,
  RobotOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  ApartmentOutlined,
  SettingOutlined,
  SafetyOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  DollarOutlined,
  ExperimentOutlined,
  ApiOutlined,
  FolderOutlined,
  BranchesOutlined,
  SlidersOutlined,
  MessageOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  RocketOutlined,
  AlertOutlined,
  AuditOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  DeploymentUnitOutlined,
  HistoryOutlined,
  BugOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
  ReadOutlined,
  BookOutlined,
  BankOutlined,
  HddOutlined,
} from '@ant-design/icons';

export interface NavigationItem {
  path: string;
  labelKey: string;
  permissionCode?: string;
  icon?: ReactNode;
  children?: NavigationItem[];
  defaultForRoles?: string[];
  navGroup?: string;
  hiddenInMenu?: boolean;
}

const iconStyle = { fontSize: 18 };

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { path: '/', labelKey: 'menu.dashboard', icon: <DashboardOutlined style={iconStyle} />, navGroup: 'workspace' },
  { path: '/agent', labelKey: 'menu.agent', permissionCode: 'agent:list', icon: <RobotOutlined style={iconStyle} />, navGroup: 'workspace' },
  { path: '/agent/create', labelKey: 'menu.agent', permissionCode: 'agent:create:page', hiddenInMenu: true },
  { path: '/spec', labelKey: 'menu.spec', permissionCode: 'spec:list', icon: <FileTextOutlined style={iconStyle} />, navGroup: 'workspace' },
  { path: '/spec/create', labelKey: 'menu.spec', permissionCode: 'spec:create:page', hiddenInMenu: true },
  { path: '/spec/templates', labelKey: 'menu.spec', permissionCode: 'spec:template', hiddenInMenu: true },
  { path: '/artifacts', labelKey: 'menu.spec', permissionCode: 'spec:list', hiddenInMenu: true },
  {
    path: '/data-management',
    labelKey: 'menu.dataManagement',
    permissionCode: 'data-management',
    icon: <HddOutlined style={iconStyle} />,
    navGroup: 'data',
    children: [
      { path: '/data-management/ai-gateway', labelKey: 'menu.integrationAiGateway', permissionCode: 'data-management', icon: <ApiOutlined /> },
      { path: '/data-management/database-connection', labelKey: 'menu.integrationDatabaseConnection', permissionCode: 'data-management', icon: <DatabaseOutlined /> },
      { path: '/data-management/database-text2sql', labelKey: 'menu.integrationDatabaseText2Sql', permissionCode: 'data-management', icon: <SearchOutlined /> },
    ],
  },
  { path: '/context', labelKey: 'menu.context', permissionCode: 'context:list', icon: <DatabaseOutlined style={iconStyle} />, navGroup: 'workspace' },
  { path: '/context/create', labelKey: 'menu.context', permissionCode: 'context:create:page', hiddenInMenu: true },
  {
    path: '/workflow',
    labelKey: 'menu.workflow',
    permissionCode: 'workflow:list',
    icon: <ApartmentOutlined style={iconStyle} />,
    navGroup: 'workspace',
    children: [
      { path: '/workflow/config', labelKey: 'menu.workflowConfig', permissionCode: 'workflow:list', icon: <DeploymentUnitOutlined /> },
      { path: '/workflow/executions', labelKey: 'menu.workflowExecutions', permissionCode: 'workflow:instance:list', icon: <HistoryOutlined /> },
      { path: '/workflow/triggers', labelKey: 'menu.workflowTriggers', permissionCode: 'workflow:list', icon: <ThunderboltOutlined /> },
    ],
  },
  { path: '/workflow/create', labelKey: 'menu.workflowConfig', permissionCode: 'workflow:create:page', hiddenInMenu: true },
  { path: '/workflow/designer', labelKey: 'menu.workflowConfig', permissionCode: 'workflow:designer', hiddenInMenu: true },
  {
    path: '/quality',
    labelKey: 'menu.quality',
    permissionCode: 'quality:list',
    icon: <SafetyOutlined style={iconStyle} />,
    navGroup: 'governance',
    children: [
      { path: '/quality/issues', labelKey: 'menu.qualityIssue', permissionCode: 'quality:list', icon: <BugOutlined /> },
      { path: '/quality/deviations', labelKey: 'menu.qualityDeviation', permissionCode: 'quality:list', icon: <BranchesOutlined /> },
      { path: '/quality/intent-defects', labelKey: 'menu.qualityIntentDefect', permissionCode: 'quality:list', icon: <SearchOutlined /> },
      { path: '/quality/cross-reviews', labelKey: 'menu.qualityCrossReview', permissionCode: 'quality:list', icon: <TeamOutlined /> },
      { path: '/quality/rules', labelKey: 'menu.qualityRuleConfig', permissionCode: 'quality:list', icon: <SlidersOutlined /> },
    ],
  },
  {
    path: '/monitor-section',
    labelKey: 'menu.monitor',
    icon: <BarChartOutlined style={iconStyle} />,
    navGroup: 'governance',
    children: [
      { path: '/monitor', labelKey: 'menu.monitorOverview', permissionCode: 'monitor:list', icon: <ThunderboltOutlined /> },
      { path: '/monitor/reports', labelKey: 'menu.monitorReports', permissionCode: 'monitor:list', icon: <BarChartOutlined /> },
      { path: '/monitor/traces', labelKey: 'menu.monitorTraces', permissionCode: 'monitor:list', icon: <BranchesOutlined /> },
    ],
  },
  { path: '/cost', labelKey: 'menu.cost', permissionCode: 'monitor:cost', icon: <DollarOutlined style={iconStyle} />, navGroup: 'governance' },
  { path: '/evaluation', labelKey: 'menu.evaluation', permissionCode: 'monitor:list', icon: <ExperimentOutlined style={iconStyle} />, navGroup: 'governance' },
  { path: '/approval-center', labelKey: 'menu.approvalCenter', permissionCode: 'approval:center:view', icon: <AuditOutlined style={iconStyle} />, navGroup: 'governance' },
  { path: '/profile', labelKey: 'menu.userMemory', icon: <UserOutlined style={iconStyle} />, navGroup: 'workspace' },
  {
    path: '/security-compliance',
    labelKey: 'menu.securityCompliance',
    permissionCode: 'security:compliance:view',
    icon: <SafetyCertificateOutlined style={iconStyle} />,
    navGroup: 'governance',
    children: [
      { path: '/security-compliance/overview', labelKey: 'menu.securityComplianceOverview', permissionCode: 'security:compliance:view', icon: <AppstoreOutlined /> },
      { path: '/security-compliance/runtime', labelKey: 'menu.securityComplianceRuntime', permissionCode: 'security:compliance:view', icon: <ThunderboltOutlined /> },
      { path: '/security-compliance/data', labelKey: 'menu.securityComplianceData', permissionCode: 'security:compliance:view', icon: <DatabaseOutlined /> },
      { path: '/security-compliance/risk', labelKey: 'menu.securityComplianceRisk', permissionCode: 'security:compliance:view', icon: <AlertOutlined /> },
      { path: '/security-compliance/industry', labelKey: 'menu.securityComplianceIndustry', permissionCode: 'security:compliance:view', icon: <GlobalOutlined /> },
    ],
  },
  {
    path: '/project',
    labelKey: 'menu.projectManagement',
    permissionCode: 'project:list',
    icon: <FolderOutlined style={iconStyle} />,
    navGroup: 'platform',
    children: [
      { path: '/project/workspaces', labelKey: 'menu.projectWorkspaceManagement', permissionCode: 'project:list', icon: <FolderOutlined /> },
      { path: '/project/branches', labelKey: 'menu.projectBranchManagement', permissionCode: 'project:list', icon: <BranchesOutlined /> },
      { path: '/project/branch-rules', labelKey: 'menu.projectBranchRuleManagement', permissionCode: 'project:list', icon: <SlidersOutlined /> },
    ],
  },
  {
    path: '/integration',
    labelKey: 'menu.integration',
    permissionCode: 'integration:list',
    icon: <ApiOutlined style={iconStyle} />,
    navGroup: 'platform',
    children: [
      { path: '/integration/skill', labelKey: 'menu.integrationSkill', permissionCode: 'integration:skill:list', icon: <ThunderboltOutlined /> },
      { path: '/integration/mcp', labelKey: 'menu.integrationMcp', permissionCode: 'integration:mcp:list', icon: <ToolOutlined /> },
      { path: '/integration/cicd', labelKey: 'menu.integrationCicd', permissionCode: 'integration:cicd:list', icon: <RocketOutlined /> },
      { path: '/integration/marketplace', labelKey: 'marketplace.title', permissionCode: 'integration:marketplace:list', icon: <RocketOutlined /> },
    ],
  },
  {
    path: '/notification',
    labelKey: 'menu.notificationManagement',
    permissionCode: 'integration:channel:list',
    icon: <MessageOutlined style={iconStyle} />,
    navGroup: 'platform',
    children: [
      { path: '/notification/inbox', labelKey: 'menu.notificationInbox', permissionCode: 'integration:channel:list', icon: <AlertOutlined /> },
      { path: '/notification/channel', labelKey: 'menu.notificationChannel', permissionCode: 'integration:channel:list', icon: <MessageOutlined /> },
      { path: '/notification/message-template', labelKey: 'menu.notificationMessageTemplate', permissionCode: 'integration:channel:list', icon: <MessageOutlined /> },
      { path: '/notification/record', labelKey: 'menu.notificationRecord', permissionCode: 'integration:channel:list', icon: <AlertOutlined /> },
    ],
  },
  {
    path: '/system',
    labelKey: 'menu.system',
    permissionCode: 'system:config:page',
    icon: <SettingOutlined style={iconStyle} />,
    navGroup: 'platform',
    children: [
      { path: '/system/user', labelKey: 'menu.systemUser', permissionCode: 'system:user:page', icon: <UserOutlined /> },
      { path: '/system/role', labelKey: 'menu.systemRole', permissionCode: 'system:role:page', icon: <TeamOutlined /> },
      { path: '/system/menu', labelKey: 'menu.systemMenu', permissionCode: 'system:menu:page', icon: <AppstoreOutlined /> },
      { path: '/system/model', labelKey: 'menu.systemModel', permissionCode: 'system:config:page', icon: <ExperimentOutlined /> },
      { path: '/system/rag', labelKey: 'menu.systemRag', permissionCode: 'system:config:page', icon: <ReadOutlined /> },
      { path: '/system/dict', labelKey: 'menu.systemDict', permissionCode: 'system:dict:page', icon: <BookOutlined /> },
      { path: '/system/tenant', labelKey: 'menu.systemTenant', permissionCode: 'system:tenant:page', icon: <BankOutlined /> },
    ],
  },
];

const flattenNavigation = (items: NavigationItem[]): NavigationItem[] =>
  items.flatMap((item) => [item, ...(item.children ? flattenNavigation(item.children) : [])]);

export const FLAT_NAVIGATION_ITEMS = flattenNavigation(NAVIGATION_ITEMS);

export const isPermissionPrefixMatch = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export const findNavigationPermission = (pathname: string) =>
  [...FLAT_NAVIGATION_ITEMS]
    .filter((item) => item.permissionCode && isPermissionPrefixMatch(pathname, item.path))
    .sort((a, b) => b.path.length - a.path.length)[0]?.permissionCode;

export const findMenuPermission = (path: string) =>
  FLAT_NAVIGATION_ITEMS.find((item) => item.path === path)?.permissionCode;

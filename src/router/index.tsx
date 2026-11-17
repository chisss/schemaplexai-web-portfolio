/**
 * 路由配置
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import type { ComponentType, LazyExoticComponent } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import AuthGuard from '@/components/Layout/AuthGuard';
import RoutePlaceholder from './RoutePlaceholder';
import LazyRouteErrorBoundary from './LazyRouteErrorBoundary';
import RouteErrorBoundary from './RouteErrorBoundary';

// 懒加载组件
const Login = lazy(() => import('@/pages/auth/Login'));
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const AgentList = lazy(() => import('@/pages/agent/AgentList'));
const AgentCreate = lazy(() => import('@/pages/agent/AgentCreate'));
const AgentDetail = lazy(() => import('@/pages/agent/AgentDetail'));
const SpecList = lazy(() => import('@/pages/spec/SpecList'));
const SpecCreate = lazy(() => import('@/pages/spec/SpecCreate'));
const SpecDetail = lazy(() => import('@/pages/spec/SpecDetail'));
const SpecEditor = lazy(() => import('@/pages/spec/SpecEditor'));
const ArtifactDetail = lazy(() => import('@/pages/artifact/ArtifactDetail'));
const SpecTemplateList = lazy(() => import('@/pages/spec/SpecTemplateList'));
const ContextList = lazy(() => import('@/pages/context/ContextList'));
const ContextCreate = lazy(() => import('@/pages/context/ContextCreate'));
const ContextDetail = lazy(() => import('@/pages/context/ContextDetail'));
const ContextEdit = lazy(() => import('@/pages/context/ContextEdit'));
const WorkflowList = lazy(() => import('@/pages/workflow/WorkflowList'));
const WorkflowCreate = lazy(() => import('@/pages/workflow/WorkflowCreate'));
const WorkflowDesigner = lazy(() => import('@/pages/workflow/WorkflowDesigner'));
const WorkflowInstanceDetail = lazy(() => import('@/pages/workflow/WorkflowInstanceDetail'));
const WorkflowExecutionList = lazy(() => import('@/pages/workflow/WorkflowExecutionList'));
const WorkflowTriggerList = lazy(() => import('@/pages/workflow/WorkflowTriggerList'));
const QualityList = lazy(() => import('@/pages/quality/QualityList'));
const DeviationList = lazy(() => import('@/pages/quality/DeviationList'));
const IntentDefectList = lazy(() => import('@/pages/quality/IntentDefectList'));
const CrossReviewList = lazy(() => import('@/pages/quality/CrossReviewList'));
const QualityRuleConfig = lazy(() => import('@/pages/quality/QualityRuleConfig'));
const QualityDetail = lazy(() => import('@/pages/quality/QualityDetail'));
const IntegrationList = lazy(() => import('@/pages/integration/IntegrationList'));
const Marketplace = lazy(() => import('@/pages/integration/Marketplace'));
const ApiGatewayList = lazy(() => import('@/pages/integration/gateway/ApiGatewayList'));
const ApiGatewayCreate = lazy(() => import('@/pages/integration/gateway/ApiGatewayCreate'));
const ApiGatewayDetail = lazy(() => import('@/pages/integration/gateway/ApiGatewayDetail'));
const DatabaseConnection = lazy(() => import('@/pages/integration/DatabaseConnection'));
const DatabaseText2Sql = lazy(() => import('@/pages/integration/DatabaseText2Sql'));
const SemanticModelCatalog = lazy(() => import('@/pages/semantic/SemanticModelCatalog'));
const SemanticWorkbench = lazy(() => import('@/pages/semantic/SemanticWorkbench'));
const InAppInbox = lazy(() => import('@/pages/notification/InAppInbox'));
const NotificationRecordList = lazy(() => import('@/pages/notification/NotificationRecordList'));
// 集成扩展子模块
const SkillList = lazy(() => import('@/pages/integration/skill/SkillList'));
const SkillCreate = lazy(() => import('@/pages/integration/skill/SkillCreate'));
const SkillDetail = lazy(() => import('@/pages/integration/skill/SkillDetail'));
const McpServerList = lazy(() => import('@/pages/integration/mcp/McpServerList'));
const McpServerCreate = lazy(() => import('@/pages/integration/mcp/McpServerCreate'));
const McpServerDetail = lazy(() => import('@/pages/integration/mcp/McpServerDetail'));
const ChannelList = lazy(() => import('@/pages/integration/channel/ChannelList'));
const ChannelCreate = lazy(() => import('@/pages/integration/channel/ChannelCreate'));
const ChannelDetail = lazy(() => import('@/pages/integration/channel/ChannelDetail'));
const MessageTemplateList = lazy(() => import('@/pages/integration/message-template/MessageTemplateList'));
const ProjectList = lazy(() => import('@/pages/integration/project/ProjectList'));
const ProjectImport = lazy(() => import('@/pages/integration/project/ProjectImport'));
const ProjectDetail = lazy(() => import('@/pages/integration/project/ProjectDetail'));
const ProjectBranchManagement = lazy(() => import('@/pages/integration/project/ProjectBranchManagement'));
const BranchRuleManagement = lazy(() => import('@/pages/integration/project/BranchRuleManagement'));
const CicdList = lazy(() => import('@/pages/integration/cicd/CicdList'));
const CicdCreate = lazy(() => import('@/pages/integration/cicd/CicdCreate'));
const CicdDetail = lazy(() => import('@/pages/integration/cicd/CicdDetail'));
const MonitorList = lazy(() => import('@/pages/monitor/MonitorList'));
const MonitorReports = lazy(() => import('@/pages/monitor/MonitorReports'));
const AgentTracePage = lazy(() => import('@/pages/monitor/AgentTracePage'));
const CostList = lazy(() => import('@/pages/monitor/CostList'));
const EvaluationCenter = lazy(() => import('@/pages/evaluation/EvaluationCenter'));
const ApprovalCenter = lazy(() => import('@/pages/approval/ApprovalCenter'));
const SystemConfig = lazy(() => import('@/pages/system/SystemConfig'));
const SystemUser = lazy(() => import('@/pages/system/SystemUser'));
const SystemRole = lazy(() => import('@/pages/system/SystemRole'));
const SystemMenu = lazy(() => import('@/pages/system/SystemMenu'));
const SystemTenant = lazy(() => import('@/pages/system/SystemTenant'));
const SystemDict = lazy(() => import('@/pages/system/SystemDict'));
const SystemRag = lazy(() => import('@/pages/system/SystemRag'));
const SecurityComplianceCenter = lazy(() => import('@/pages/security/SecurityComplianceCenter'));
const UserMemoryPreferences = lazy(() => import('@/pages/profile/UserMemoryPreferences'));

// 懒加载包装器
const renderLazy = (Component: LazyExoticComponent<ComponentType>) => (
  <LazyRouteErrorBoundary>
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-full">
          <Spin size="large" />
        </div>
      }
    >
      <Component />
    </Suspense>
  </LazyRouteErrorBoundary>
);

const router = createBrowserRouter([
  {
    path: '/login',
    element: renderLazy(Login),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: renderLazy(Dashboard) },
      { path: 'agent', element: renderLazy(AgentList) },
      { path: 'agent/create', element: renderLazy(AgentCreate) },
      { path: 'agent/:id', element: renderLazy(AgentDetail) },
      { path: 'spec', element: renderLazy(SpecList) },
      { path: 'spec/create', element: renderLazy(SpecCreate) },
      { path: 'spec/templates', element: renderLazy(SpecTemplateList) },
      { path: 'spec/:id', element: renderLazy(SpecDetail) },
      { path: 'spec/:id/edit', element: renderLazy(SpecEditor) },
      { path: 'artifacts/:id', element: renderLazy(ArtifactDetail) },
      { path: 'context', element: renderLazy(ContextList) },
      { path: 'context/create', element: renderLazy(ContextCreate) },
      { path: 'context/:id', element: renderLazy(ContextDetail) },
      { path: 'context/:id/edit', element: renderLazy(ContextEdit) },
      { path: 'workflow', element: <Navigate to="/workflow/config" replace /> },
      { path: 'workflow/config', element: renderLazy(WorkflowList) },
      { path: 'workflow/executions', element: renderLazy(WorkflowExecutionList) },
      { path: 'workflow/triggers', element: renderLazy(WorkflowTriggerList) },
      { path: 'workflow/create', element: renderLazy(WorkflowCreate) },
      { path: 'workflow/designer', element: renderLazy(WorkflowDesigner) },
      { path: 'workflow/:id', element: renderLazy(WorkflowInstanceDetail) },
      { path: 'system', element: renderLazy(SystemConfig) },
      { path: 'system/user', element: renderLazy(SystemUser) },
      { path: 'system/role', element: renderLazy(SystemRole) },
      { path: 'system/menu', element: renderLazy(SystemMenu) },
      { path: 'system/model', element: renderLazy(SystemConfig) },
      { path: 'system/rag', element: renderLazy(SystemRag) },
      { path: 'system/tenant', element: renderLazy(SystemTenant) },
      { path: 'system/dict', element: renderLazy(SystemDict) },
      { path: 'quality', element: renderLazy(QualityList) },
      { path: 'quality/dashboard', element: <Navigate to="/quality" replace /> },
      { path: 'quality/issues', element: <Navigate to="/quality" replace /> },
      { path: 'quality/issues/:id', element: <Navigate to="/quality" replace /> },
      { path: 'quality/deviations', element: renderLazy(DeviationList) },
      { path: 'quality/intent-defects', element: renderLazy(IntentDefectList) },
      { path: 'quality/cross-reviews', element: renderLazy(CrossReviewList) },
      { path: 'quality/rules', element: renderLazy(QualityRuleConfig) },
      { path: 'quality/:id', element: renderLazy(QualityDetail) },
      { path: 'monitor', element: renderLazy(MonitorList) },
      { path: 'monitor/reports', element: renderLazy(MonitorReports) },
      { path: 'monitor/traces', element: renderLazy(AgentTracePage) },
      { path: 'monitor/agent', element: <Navigate to="/monitor/traces" replace /> },
      { path: 'cost', element: renderLazy(CostList) },
      { path: 'evaluation', element: <Navigate to="/evaluation/datasets" replace /> },
      { path: 'evaluation/datasets', element: renderLazy(EvaluationCenter) },
      { path: 'evaluation/tasks', element: renderLazy(EvaluationCenter) },
      { path: 'evaluation/:taskId', element: renderLazy(EvaluationCenter) },
      { path: 'approval-center', element: renderLazy(ApprovalCenter) },
      { path: 'project', element: <Navigate to="/project/workspaces" replace /> },
      { path: 'project/workspaces', element: renderLazy(ProjectList) },
      { path: 'project/import', element: renderLazy(ProjectImport) },
      { path: 'project/branches', element: renderLazy(ProjectBranchManagement) },
      { path: 'project/branch-rules', element: renderLazy(BranchRuleManagement) },
      { path: 'project/workspaces/:id', element: renderLazy(ProjectDetail) },
      { path: 'project/:id', element: renderLazy(ProjectDetail) },
      { path: 'security-compliance', element: <Navigate to="/security-compliance/overview" replace /> },
      { path: 'security-compliance/overview', element: renderLazy(SecurityComplianceCenter) },
      { path: 'security-compliance/runtime', element: renderLazy(SecurityComplianceCenter) },
      { path: 'security-compliance/data', element: renderLazy(SecurityComplianceCenter) },
      { path: 'security-compliance/risk', element: renderLazy(SecurityComplianceCenter) },
      { path: 'security-compliance/industry', element: renderLazy(SecurityComplianceCenter) },
      { path: 'integration', element: renderLazy(IntegrationList) },
      { path: 'integration/marketplace', element: renderLazy(Marketplace) },
      { path: 'data-management/ai-gateway', element: renderLazy(ApiGatewayList) },
      { path: 'data-management/ai-gateway/create', element: renderLazy(ApiGatewayCreate) },
      { path: 'data-management/ai-gateway/:id/edit', element: renderLazy(ApiGatewayCreate) },
      { path: 'data-management/ai-gateway/:id', element: renderLazy(ApiGatewayDetail) },
      { path: 'data-management/database-connection', element: renderLazy(DatabaseConnection) },
      { path: 'data-management/database-text2sql', element: renderLazy(DatabaseText2Sql) },
      {
        path: 'data-management/semantic-models',
        element: renderLazy(SemanticModelCatalog),
      },
      {
        path: 'data-management/semantic-models/:modelId',
        element: renderLazy(SemanticWorkbench),
      },
      {
        path: 'data-management/semantic-query',
        element: renderLazy(DatabaseText2Sql),
      },
      { path: 'integration/channel', element: renderLazy(ChannelList) },
      { path: 'integration/channel/create', element: renderLazy(ChannelCreate) },
      { path: 'integration/channel/:id', element: renderLazy(ChannelDetail) },
      { path: 'integration/message-template', element: renderLazy(MessageTemplateList) },
      { path: 'integration/skill', element: renderLazy(SkillList) },
      { path: 'integration/skill/create', element: renderLazy(SkillCreate) },
      { path: 'integration/skill/:id', element: renderLazy(SkillDetail) },
      { path: 'integration/mcp', element: renderLazy(McpServerList) },
      { path: 'integration/mcp/create', element: renderLazy(McpServerCreate) },
      { path: 'integration/mcp/:id', element: renderLazy(McpServerDetail) },
      { path: 'integration/cicd', element: renderLazy(CicdList) },
      { path: 'integration/cicd/create', element: renderLazy(CicdCreate) },
      { path: 'integration/cicd/:id', element: renderLazy(CicdDetail) },
      { path: 'notification', element: <Navigate to="/notification/inbox" replace /> },
      { path: 'notification/inbox', element: renderLazy(InAppInbox) },
      { path: 'notification/channel', element: renderLazy(ChannelList) },
      { path: 'notification/channel/create', element: renderLazy(ChannelCreate) },
      { path: 'notification/channel/:id', element: renderLazy(ChannelDetail) },
      { path: 'notification/message-template', element: renderLazy(MessageTemplateList) },
      { path: 'notification/record', element: renderLazy(NotificationRecordList) },
      { path: 'profile', element: renderLazy(UserMemoryPreferences) },
      { path: 'settings', element: <RoutePlaceholder i18nKey="route.accountSettings" /> },
      { path: '*', element: <RoutePlaceholder i18nKey="route.notFound" /> },
    ],
  },
]);

export default router;

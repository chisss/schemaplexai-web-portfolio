import { http, HttpResponse } from 'msw';
import type { HomepageAggregate } from '@/types/homepage';

const defaultData: HomepageAggregate = {
  contextSummary: {
    pendingApprovalCount: 3,
    blockedWorkflowCount: 1,
    runningWorkflowCount: 5,
    securityEventCount: 1,
    qualityDeviationCount: 2,
    summaryText: '你有 3 个待审批、1 个被阻塞的流程、5 个运行中的工作流、1 个安全事件',
  },
  actions: [
    {
      actionId: 'act-001',
      actionType: 'UNBLOCK',
      title: '处理 1 个被阻塞的流程',
      targetUrl: '/workflow/executions?status=blocked',
      priority: 1,
    },
    {
      actionId: 'act-002',
      actionType: 'INVESTIGATE',
      title: '处理 1 个安全事件',
      targetUrl: '/security/incidents',
      priority: 2,
    },
    {
      actionId: 'act-003',
      actionType: 'APPROVE',
      title: '审批 3 个待处理评审',
      targetUrl: '/approval-center?view=pending',
      priority: 3,
    },
    {
      actionId: 'act-004',
      actionType: 'CONTINUE',
      title: '继续跟进 5 个运行中的工作流',
      targetUrl: '/workflow/executions?status=running',
      priority: 4,
    },
  ],
  taskPanel: {
    inProgressTasks: [
      { id: 'wf-001', itemType: 'workflow', title: '数据清洗流水线 v2', status: 'RUNNING', targetUrl: '/workflow/executions/wf-001', updatedAt: '2026-04-19T10:30:00' },
      { id: 'wf-002', itemType: 'workflow', title: 'API 集成测试套件', status: 'RUNNING', targetUrl: '/workflow/executions/wf-002', updatedAt: '2026-04-19T09:15:00' },
      { id: 'ae-001', itemType: 'agent_execution', title: '代码审查 Agent', status: 'RUNNING', targetUrl: '/agent/ae-001', updatedAt: '2026-04-19T11:00:00' },
    ],
    blockedTasks: [
      { id: 'wf-003', itemType: 'workflow', title: '生产部署流程', status: 'PAUSED', severity: 'HIGH', targetUrl: '/workflow/executions/wf-003', updatedAt: '2026-04-19T08:45:00' },
    ],
    pendingApprovals: [
      { id: 'pa-001', itemType: 'approval', title: '审批: 安全策略变更', status: 'PENDING_REVIEW', targetUrl: '/approval-center?view=pending', updatedAt: '2026-04-19T07:30:00' },
      { id: 'pa-002', itemType: 'approval', title: '审批: 工作流发布', status: 'PENDING_REVIEW', targetUrl: '/approval-center?view=pending', updatedAt: '2026-04-19T06:00:00' },
      { id: 'pa-003', itemType: 'approval', title: '审批: Agent 配置变更', status: 'PENDING_REVIEW', targetUrl: '/approval-center?view=pending', updatedAt: '2026-04-18T18:00:00' },
    ],
    quickEntries: [
      { id: 'quick-create-agent', label: '创建 Agent', icon: 'RobotOutlined', targetUrl: '/agent/create' },
      { id: 'quick-create-workflow', label: '创建工作流', icon: 'ApartmentOutlined', targetUrl: '/workflow/create' },
      { id: 'quick-write-spec', label: '编写 Spec', icon: 'FileTextOutlined', targetUrl: '/spec/create' },
      { id: 'quick-view-monitor', label: '查看监控', icon: 'BarChartOutlined', targetUrl: '/monitor' },
    ],
  },
  situationPanel: {
    systemHealth: {
      status: 'healthy',
      cpuUsage: 42,
      memoryUsage: 58,
      diskUsage: 35,
      serviceStatus: { gateway: 'healthy', scheduler: 'healthy', runtime: 'healthy' },
    },
    riskAlerts: [
      { id: 'ra-001', alertType: 'security', severity: 'HIGH', title: '异常登录尝试检测', description: '检测到来自未知 IP 的多次登录尝试', targetUrl: '/security/incidents/ra-001', createdAt: '2026-04-19T09:00:00' },
      { id: 'ra-002', alertType: 'quality', severity: 'MEDIUM', title: 'API 响应时间偏差', description: '过去 1 小时 P99 延迟超过阈值', targetUrl: '/quality/deviations/ra-002', createdAt: '2026-04-19T08:30:00' },
    ],
    blockChains: [
      { id: 'bc-001', blockerType: 'workflow', blockerTitle: '安全策略审批', blockedResource: '生产部署流程', status: 'PAUSED', targetUrl: '/workflow/executions/wf-003' },
    ],
    recentAuditTrails: [
      { id: 'at-001', username: 'admin', action: '更新', resource: '安全策略', detail: '修改了 API 访问控制规则', createdAt: '2026-04-19T10:00:00' },
      { id: 'at-002', username: 'dev-lead', action: '审批', resource: '工作流', detail: '批准了数据迁移工作流', createdAt: '2026-04-19T09:30:00' },
    ],
    anomalyTrend: {
      dailyCounts: [2, 1, 3, 2, 4, 3, 2],
      labels: ['04-13', '04-14', '04-15', '04-16', '04-17', '04-18', '04-19'],
      trend: 'down',
      totalCount: 17,
    },
  },
};

export const homepageHandlers = [
  http.get('/api/homepage/aggregate', () =>
    HttpResponse.json({ code: 200, message: 'success', data: defaultData }),
  ),
];

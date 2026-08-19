export interface ContextSummary {
  pendingApprovalCount: number;
  blockedWorkflowCount: number;
  runningWorkflowCount: number;
  securityEventCount: number;
  qualityDeviationCount: number;
  summaryText: string;
}

export interface RecommendedAction {
  actionId: string;
  actionType: 'CONTINUE' | 'UNBLOCK' | 'APPROVE' | 'INVESTIGATE';
  title: string;
  targetUrl: string;
  targetId?: string;
  priority: number;
}

export interface TaskItem {
  id: string;
  itemType: 'workflow' | 'approval' | 'quality' | 'security' | 'agent_execution';
  title: string;
  status: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  targetUrl: string;
  updatedAt?: string;
  ownerUserId?: string;
  ownerRole?: string;
  slaDueAt?: string;
  impactScope?: string;
  evidenceCount?: number;
  requiresAction?: boolean;
}

export interface QuickEntry {
  id: string;
  label: string;
  icon: string;
  targetUrl: string;
}

export interface TaskPanel {
  inProgressTasks: TaskItem[];
  blockedTasks: TaskItem[];
  pendingApprovals: TaskItem[];
  quickEntries: QuickEntry[];
}

export interface RiskAlert {
  id: string;
  alertType: 'security' | 'quality' | 'workflow' | 'system';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description?: string;
  targetUrl: string;
  createdAt?: string;
}

export interface BlockChain {
  id: string;
  blockerType: string;
  blockerTitle: string;
  blockedResource: string;
  status: string;
  targetUrl: string;
}

export interface AuditTrail {
  id: string;
  username: string;
  action: string;
  resource: string;
  resourceId?: string;
  detail?: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  targetUrl?: string;
  traceId?: string;
  createdAt: string;
}

export interface TrendSummary {
  dailyCounts: number[];
  labels: string[];
  trend: 'up' | 'down' | 'stable';
  totalCount: number;
}

export interface SituationPanel {
  systemHealth: {
    status: string;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    serviceStatus: Record<string, string>;
  };
  riskAlerts: RiskAlert[];
  blockChains: BlockChain[];
  recentAuditTrails: AuditTrail[];
  anomalyTrend: TrendSummary;
}

export interface HomepageAggregate {
  contextSummary: ContextSummary;
  actions: RecommendedAction[];
  taskPanel: TaskPanel;
  situationPanel: SituationPanel;
}

export type HomepageMode = 'tasks' | 'ai' | 'situation';

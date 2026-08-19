export type ApprovalCenterView = 'pending' | 'all' | 'processed';
export type ApprovalCenterType = 'workflow_review' | 'quality_issue' | 'security_incident';
export type ApprovalCenterReviewDecision = 'approve' | 'reject' | 'request_modify';

export interface ApprovalCenterItem {
  id: string;
  approvalType: ApprovalCenterType;
  title: string;
  summary?: string;
  status: string;
  statusLabel?: string;
  pending: boolean;
  specId?: string;
  specName?: string;
  workflowInstanceId?: string;
  workflowNodeId?: string;
  workflowNodeLabel?: string;
  sourceId?: string;
  sourceName?: string;
  documentType?: string;
  applicantId?: string;
  applicantName?: string;
  assigneeId?: string;
  assigneeName?: string;
  approverId?: string;
  approverName?: string;
  approverAt?: string;
  deadline?: string;
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  slaDueAt?: string;
  impactScope?: string;
  evidenceSummary?: string;
  blockedResource?: string;
  actionUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApprovalCenterQueryDTO {
  view?: ApprovalCenterView;
  type?: ApprovalCenterType;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface ApprovalCenterBatchReviewDTO {
  ids: string[];
  decision: ApprovalCenterReviewDecision;
  comment?: string;
  modifyInstruction?: string;
}

export interface ApprovalCenterBatchAssignDTO {
  approvalType: Extract<ApprovalCenterType, 'quality_issue' | 'security_incident'>;
  ids: string[];
  assigneeId: string;
  assigneeName?: string;
  comment?: string;
}

export interface ApprovalCenterBatchActionFailure {
  id: string;
  reason: string;
}

export interface ApprovalCenterBatchActionResult {
  totalCount: number;
  successCount: number;
  failedCount: number;
  successIds: string[];
  failures: ApprovalCenterBatchActionFailure[];
}

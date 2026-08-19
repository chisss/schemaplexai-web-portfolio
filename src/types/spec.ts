/**
 * Spec 相关类型定义
 * 与后端 SpecVO / SpecCreateRequest / SpecUpdateRequest 对齐
 */
import type { Artifact } from '@/types/artifact';
import type {AgentStatus} from "@/types/agent.ts";
import type {WorkflowInstanceStatus} from "@/types/workflow.ts";

type StatusType = AgentStatus | SpecStatus | WorkflowInstanceStatus;

export type SpecStatus =
  | 'draft'
  | 'requirements_review'
  | 'requirements_approved'
  | 'design_review'
  | 'design_approved'
  | 'tasks_review'
  | 'ready'
  | 'in_progress'
  | 'failed'
  | 'completed'
  | 'acceptance'
  | 'archived';

export type SpecPriority = 'low' | 'medium' | 'high' | 'critical';
export type SpecCategory =
  | 'feature-development'
  | 'bug-fix'
  | 'refactoring'
  | 'data-analysis'
  | 'config-change'
  | 'campaign-copy'
  | 'ad-copy'
  | 'sms-copy'
  | 'landing-page-copy'
  | 'social-post';
export type ReviewLevel = 'auto' | 'manual' | 'multi_stage';
export type DocType = 'requirements' | 'design' | 'tasks';
export type SpecLifecycleMode = 'legacy' | 'workflow';
export type SpecType = 'rd' | 'marketing' | 'qa' | 'ops';
export type SpecArtifactDeliveryType = 'workspace_file' | 'feishu_doc';

export interface MarketingSpecDeliveryConfig {
  deliveryType?: SpecArtifactDeliveryType;
  channelId?: string;
  channelType?: string;
  title?: string;
  folderToken?: string;
}

export interface MarketingSpecProfileData extends Record<string, any> {
  productName?: string;
  marketRegion?: string;
  language?: string;
  channels?: string[];
  targetAudience?: string;
  deliveryConfig?: MarketingSpecDeliveryConfig;
}

/** Spec 文档（对应后端 SpecDocumentVO） */
export interface SpecDocument {
  id: string;
  docType: string;
  content: string;
  version: number;
  workflowNodeId?: string;
  specId?: string;
  wordCount?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt: string;
}

/** Spec 版本（对应后端 SpecVersionVO） */
export interface SpecVersion {
  id: string;
  docType: string;
  content: string;
  versionNumber: number;
  changeSummary?: string;
  workflowNodeId?: string;
  createdBy?: string;
  createdAt: string;
}

/** Spec 实体（对应后端 SpecVO） */
export interface Spec {
  id: string;
  name: string;
  version: string;
  status: StatusType;
  priority: string;
  owner: string;
  ownerName?: string;
  category: string;
  specType?: SpecType;
  tags: string[];
  reviewLevel:string;
  description: string;
  profileData?: MarketingSpecProfileData | Record<string, any>;
  projectId?: string; // deprecated, use workspaceIds
  workspaceIds?: string[];
  workflowId?: string;
  workflowInstanceId?: string;
  lifecycleMode?: SpecLifecycleMode;
  currentNodeId?: string;
  currentNodeType?: string;
  currentNodeLabel?: string;
  workflowStatusSnapshot?: string;
  jiraTicket?: string;
  targetBranch?: string;
  artifactDocPath?: string;
  primaryArtifactId?: string;
  primaryArtifact?: Artifact;
  documents?: SpecDocument[];
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

/** 创建 Spec 请求（对应后端 SpecCreateRequest） */
export interface SpecCreateDTO {
  name: string;
  specType?: SpecType;
  category?: string;
  priority?: string;
  description?: string;
  profileData?: MarketingSpecProfileData | Record<string, any>;
  tags?: string[];
  projectId?: string; // deprecated, use workspaceIds
  workspaceIds?: string[],
  workflowId?: string;
  jiraTicket?: string;
  targetBranch?: string;
}

export interface SpecWorkflowStartDTO {
  description: string;
}

/** 更新 Spec 请求（对应后端 SpecUpdateRequest） */
export interface SpecUpdateDTO {
  name?: string;
  specType?: SpecType;
  category?: string;
  priority?: string;
  description?: string;
  profileData?: MarketingSpecProfileData | Record<string, any>;
  tags?: string[];
  workflowId?: string;
  jiraTicket?: string;
  targetBranch?: string;
}

/** Spec 查询参数（对应后端 SpecQueryRequest） */
export interface SpecQueryDTO {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
  category?: string;
  specType?: string;
  priority?: string;
  owner?: string;
  projectId?: string;
}

/** Spec 文档更新请求（对应后端 SpecDocumentRequest） */
export interface SpecDocumentDTO {
  content: string;
  changeSummary?: string;
}

export interface SpecDocumentSubmitDTO {
  content: string;
  changeSummary?: string;
  comment?: string;
}

export interface SpecWorkbenchNode {
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: string;
  current?: boolean;
  config?: Record<string, any>;
  document?: SpecDocument;
  reviewSession?: import('./workflow').ReviewSession;
  outputData?: Record<string, any>;
  errorMessage?: string;
}

export interface SpecWorkbench {
  spec: Spec;
  workflowInstance?: import('./workflow').WorkflowInstance | null;
  nodes?: SpecWorkbenchNode[];
}

/**
 * 上下文相关类型定义
 * 与后端 ContextVO / ContextDetailVO / ContextItemVO / ContextSnapshotVO 对齐
 */

export type ContextLevel = 'global' | 'project' | 'task' | 'agent';
export type ContextItemType = 'document' | 'code' | 'knowledge' | 'config';

/** 上下文条目（对应后端 ContextItemVO） */
export interface ContextItem {
  id: string;
  contextId: string;
  itemType: string;
  title: string;
  content: string;
  sourceUrl?: string;
  metadata?: Record<string, any>;
  tokenCount?: number;
  sortOrder?: number;
  isAgentInstructions?: boolean;
  vectorStatus?: 'none' | 'pending' | 'processing' | 'completed' | 'failed';
  vectorUpdatedAt?: string;
  chunkCount?: number;
  createdAt: string;
}

/** 上下文快照（对应后端 ContextSnapshotVO） */
export interface ContextSnapshot {
  id: string;
  contextId: string;
  snapshotName: string;
  itemCount: number;
  totalTokens: number;
  createdAt: string;
}

/** 上下文关联关系（对应后端 ContextRelationVO） */
export interface ContextRelation {
  id: string;
  fromContextId: string;
  toContextId: string;
  fromContextName?: string;
  toContextName?: string;
  /** depends_on / extends / references / belongs_to */
  relationType: string;
  description?: string;
  createdAt: string;
}

/** 上下文（对应后端 ContextVO） */
export interface Context {
  id: string;
  name: string;
  contextLevel: string;
  projectId?: string;
  description: string;
  status?: string;
  metadata?: Record<string, any>;
  itemCount?: number;
  totalTokens?: number;
  vectorized?: boolean;
  vectorStatus?: 'none' | 'processing' | 'completed' | 'failed';
  vectorChunkCount?: number;
  knowledgeDocumentCount?: number;
  vectorUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
  relations?: ContextRelation[];
}

/** 上下文详情（对应后端 ContextDetailVO，继承 ContextVO） */
export interface ContextDetail extends Context {
  items: ContextItem[];
}

export interface KnowledgeDocument {
  id: string;
  contextId: string;
  title?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  /** pending / processing / scanning / completed / failed / blocked */
  status: 'pending' | 'processing' | 'scanning' | 'completed' | 'failed' | 'blocked';
  chunkCount?: number;
  totalTokens?: number;
  embeddingModel?: string;
  errorMessage?: string;
  /** 文件 SHA256（hex） */
  contentSha256?: string;
  /** MIME 类型 */
  mimeType?: string;
  /** 上传来源: web/api/mcp/import */
  uploadChannel?: string;
  /** 上传人 ID */
  createdBy?: string;
  /** 上传人用户名 */
  createdByName?: string;
  /** 内容安全扫描命中的 warning 规则列表 */
  contentWarnings?: Array<Record<string, any>>;
  /** 重试次数 */
  retryCount?: number;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

/** 创建上下文请求（对应后端 ContextCreateRequest） */
export interface ContextCreateDTO {
  name: string;
  contextLevel: string;
  projectId?: string;
  description?: string;
  metadata?: Record<string, any>;
  linkedContextIds?: string[];
}

/** 更新上下文请求（对应后端 ContextUpdateRequest） */
export interface ContextUpdateDTO {
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
}

/** 上下文查询参数（对应后端 ContextQueryRequest） */
export interface ContextQueryDTO {
  page?: number;
  size?: number;
  keyword?: string;
  contextLevel?: string;
  projectId?: string;
}

/** 创建上下文条目请求（对应后端 ContextItemCreateRequest） */
export interface ContextItemCreateDTO {
  itemType: string;
  title: string;
  content: string;
  sourceUrl?: string;
  metadata?: Record<string, any>;
  sortOrder?: number;
}

/** 更新上下文条目请求（对应后端 ContextItemUpdateRequest） */
export interface ContextItemUpdateDTO {
  title?: string;
  content?: string;
  sourceUrl?: string;
  metadata?: Record<string, any>;
  sortOrder?: number;
}

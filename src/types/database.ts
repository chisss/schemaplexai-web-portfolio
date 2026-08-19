export type DatabaseConnectionMode = 'preset' | 'custom';
export type DatabaseTransportType = 'streamable_http' | 'sse' | 'stdio';

export interface DatabaseSource {
  id: string;
  name: string;
  description?: string;
  databaseType: string;
  connectionMode: DatabaseConnectionMode;
  presetCode?: string;
  url?: string;
  transportType?: DatabaseTransportType;
  authType?: string;
  authConfig?: Record<string, any>;
  headers?: Record<string, any>;
  host?: string;
  port?: string;
  database?: string;
  schema?: string;
  username?: string;
  passwordConfigured?: boolean;
  connectionUri?: string;
  sslMode?: string;
  readOnly?: boolean;
  queryToolName?: string;
  tags?: string[];
  command?: string[];
  environment?: Record<string, string>;
  connectionConfig?: Record<string, any>;
  transportConfig?: Record<string, any>;
  tools?: Array<Record<string, any>>;
  toolCount?: number;
  status: string;
  lastHealthCheck?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DatabaseSourceQueryDTO {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
  databaseType?: string;
  connectionMode?: DatabaseConnectionMode;
}

export interface DatabaseSourceSaveDTO {
  name: string;
  databaseType: string;
  description?: string;
  connectionMode?: DatabaseConnectionMode;
  presetCode?: string;
  transportType?: DatabaseTransportType;
  url?: string;
  authType?: string;
  authConfig?: Record<string, any>;
  headers?: Record<string, any>;
  host?: string;
  port?: string;
  database?: string;
  schema?: string;
  username?: string;
  password?: string;
  connectionUri?: string;
  sslMode?: string;
  readOnly?: boolean;
  queryToolName?: string;
  tags?: string[];
  command?: string[];
  environment?: Record<string, string>;
}

export interface DatabaseSourceTestResult {
  connected: boolean;
  message?: string;
  recommendedQueryTool?: string;
  toolCount?: number;
  tools?: Array<Record<string, any>>;
}

export interface DatabaseQueryResult {
  toolName?: string;
  columns: string[];
  rows: Array<Record<string, any>>;
  rowCount: number;
  truncated?: boolean;
  elapsedMs?: number;
  rawPayload?: Record<string, any>;
  rawText?: string;
  warnings?: string[];
}


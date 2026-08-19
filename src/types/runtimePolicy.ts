export interface TenantRuntimePolicy {
  tenantId: string;
  workspaceRootPath?: string;
  maxWorkspaceGb?: number;
  maxExecutionMinutes?: number;
  sandboxProfile?: 'strict' | 'standard' | 'permissive';
  allowLocalImport?: boolean;
  sandboxAllowedCommands: string[];
  updatedAt?: string;
}

export interface TenantRuntimePolicyUpdateDTO {
  workspaceRootPath?: string;
  maxWorkspaceGb?: number;
  maxExecutionMinutes?: number;
  sandboxProfile?: 'strict' | 'standard' | 'permissive';
  allowLocalImport?: boolean;
  sandboxAllowedCommands?: string[];
}

import type { DatabasePresetCode, McpTransportType } from '@/types/integration';

export interface DatabasePresetDefinition {
  code: DatabasePresetCode;
  label: string;
  description: string;
  commandPreview: string;
  transportType: McpTransportType;
}

export const DATABASE_PRESET_OPTIONS: DatabasePresetDefinition[] = [
  {
    code: 'postgresql',
    label: 'PostgreSQL',
    description: '使用官方 `@modelcontextprotocol/server-postgres` 启动本地 stdio MCP。',
    commandPreview: 'npx -y @modelcontextprotocol/server-postgres postgresql://user:password@host:5432/database',
    transportType: 'stdio',
  },
  {
    code: 'mysql',
    label: 'MySQL',
    description: '使用社区 `@benborla29/mcp-server-mysql`，通过环境变量注入连接信息。',
    commandPreview: 'npx -y @benborla29/mcp-server-mysql',
    transportType: 'stdio',
  },
  {
    code: 'oracle',
    label: 'Oracle SQLcl MCP',
    description: '使用 Oracle SQLcl 的 `sql -mcp` 模式，适合企业库和已保存连接场景。',
    commandPreview: 'sql -mcp',
    transportType: 'stdio',
  },
];

export function findDatabasePreset(code?: string | null) {
  return DATABASE_PRESET_OPTIONS.find((item) => item.code === code);
}

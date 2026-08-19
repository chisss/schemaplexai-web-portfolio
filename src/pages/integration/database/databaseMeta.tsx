import { Avatar } from 'antd';

export interface DatabaseTypeMeta {
  code: string;
  label: string;
  shortLabel: string;
  color: string;
  defaultPort?: string;
  presetSupported: boolean;
  description: string;
}

export const DATABASE_TYPE_OPTIONS: DatabaseTypeMeta[] = [
  {
    code: 'postgresql',
    label: 'PostgreSQL',
    shortLabel: 'PG',
    color: '#2563eb',
    defaultPort: '5432',
    presetSupported: true,
    description: '适合业务主库、报表库与分析型查询场景。',
  },
  {
    code: 'mysql',
    label: 'MySQL',
    shortLabel: 'MY',
    color: '#0891b2',
    defaultPort: '3306',
    presetSupported: true,
    description: '适合中台业务库、SaaS 应用与轻量分析场景。',
  },
  {
    code: 'oracle',
    label: 'Oracle',
    shortLabel: 'OR',
    color: '#dc2626',
    defaultPort: '1521',
    presetSupported: true,
    description: '适合企业核心交易库和传统业务系统。',
  },
  {
    code: 'sqlserver',
    label: 'SQL Server',
    shortLabel: 'MS',
    color: '#2563eb',
    defaultPort: '1433',
    presetSupported: false,
    description: '当前通过自定义 MCP 命令或 URL 接入。',
  },
  {
    code: 'clickhouse',
    label: 'ClickHouse',
    shortLabel: 'CH',
    color: '#ca8a04',
    defaultPort: '8123',
    presetSupported: false,
    description: '适合日志分析、指标报表与高速聚合查询。',
  },
  {
    code: 'sqlite',
    label: 'SQLite',
    shortLabel: 'SQ',
    color: '#475569',
    presetSupported: false,
    description: '适合本地文件型数据库与开发调试场景。',
  },
  {
    code: 'mariadb',
    label: 'MariaDB',
    shortLabel: 'MA',
    color: '#0f766e',
    defaultPort: '3306',
    presetSupported: false,
    description: '当前通过自定义 MCP 命令或 URL 接入。',
  },
  {
    code: 'mongodb',
    label: 'MongoDB',
    shortLabel: 'MG',
    color: '#16a34a',
    defaultPort: '27017',
    presetSupported: false,
    description: '适合文档型数据与灵活 schema 场景。',
  },
  {
    code: 'redis',
    label: 'Redis',
    shortLabel: 'RD',
    color: '#b91c1c',
    defaultPort: '6379',
    presetSupported: false,
    description: '适合缓存、会话、排行榜与轻量结构化数据。',
  },
];

export function resolveDatabaseTypeMeta(databaseType?: string | null) {
  return DATABASE_TYPE_OPTIONS.find((item) => item.code === databaseType) ?? {
    code: databaseType ?? 'unknown',
    label: databaseType ?? '未知类型',
    shortLabel: (databaseType ?? 'UN').slice(0, 2).toUpperCase(),
    color: '#64748b',
    presetSupported: false,
    description: '通过自定义 MCP 接入。',
  };
}

export function isPresetSupported(databaseType?: string | null) {
  return resolveDatabaseTypeMeta(databaseType).presetSupported;
}

export function parseCommandText(commandText?: string) {
  if (!commandText?.trim()) {
    return undefined;
  }
  const tokens = commandText.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  const normalized = tokens
    .map((item) => item.replace(/^"(.*)"$/, '$1').trim())
    .filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
}

export function stringifyCommand(command?: string[]) {
  return (command ?? []).join(' ');
}

export function DatabaseTypeAvatar({ databaseType, size = 40 }: { databaseType?: string; size?: number }) {
  const meta = resolveDatabaseTypeMeta(databaseType);
  return (
    <Avatar
      size={size}
      style={{
        backgroundColor: meta.color,
        color: '#fff',
        fontWeight: 700,
      }}
    >
      {meta.shortLabel}
    </Avatar>
  );
}


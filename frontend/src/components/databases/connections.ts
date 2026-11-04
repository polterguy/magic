/*
 * Pure helpers for the Databases page — name validation, the external
 * database types, and reading connection strings out of the config.
 */

import type { MagicConfig } from '../../lib/api';

export const DB_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const STATUS_BADGES: Record<string, string> = { live: 'badge-get', down: 'badge-error' };

export const CSTRING_NAME_PATTERN = /^\w+$/;

export const EXTERNAL_TYPES = [
  { name: 'MySQL', type: 'mysql' },
  { name: 'PostgreSQL', type: 'pgsql' },
  { name: 'SQL Server', type: 'mssql' },
];

export interface ConnectionRow {
  type: string;
  name: string;
  connectionString: string;
  status: 'testing' | 'live' | 'down';
}

export function statusBadge(status: string) {
  return 'badge ' + (STATUS_BADGES[status] ?? 'badge-debug');
}

// SQL Studio deep link, consumed once by its database selection.
export function sqlStudioUrl(type: string, connectionString: string, database: string) {
  return '/sql-studio?dbType=' + type + '&dbCString=' + connectionString + '&dbName=' + database;
}

// Every external connection string in the config, each still to be tested.
export function connectionRows(config: MagicConfig | null | undefined): ConnectionRow[] {
  const found: ConnectionRow[] = [];
  for (const dbType of EXTERNAL_TYPES.map(entry => entry.type)) {
    // Next to the per-type maps sits "default", a plain string naming the default type.
    const entry = config?.magic?.databases?.[dbType];
    const connections = typeof entry === 'object' ? entry : {};
    for (const key of Object.keys(connections)) {
      found.push({
        type: dbType,
        name: key,
        connectionString: connections[key],
        status: 'testing',
      });
    }
  }
  return found;
}

// Marks one row live or down, leaving the others as they are.
export function withStatus(
  rows: ConnectionRow[],
  row: ConnectionRow,
  status: 'live' | 'down',
): ConnectionRow[] {
  return rows.map(candidate =>
    candidate.type === row.type && candidate.name === row.name
      ? { ...candidate, status }
      : candidate,
  );
}

/*
 * Why a new connection cannot be tested or added, or null when it can —
 * checked in this order, and the first failure is the one reported.
 */
export function connectionError(
  type: string,
  name: string,
  connectionString: string,
  rows: ConnectionRow[],
): string | null {
  if (!name || !connectionString) {
    return 'Give the connection a name and a connection string';
  }
  if (!connectionString.includes('{database}')) {
    return 'The connection string must contain the {database} placeholder';
  }
  if (!CSTRING_NAME_PATTERN.test(name)) {
    return 'Connection names accept alphanumeric characters and _';
  }
  if (rows.some(row => row.type === type && row.name === name)) {
    return 'That name is already in use for ' + type;
  }
  return null;
}

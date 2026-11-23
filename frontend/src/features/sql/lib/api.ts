/*
 * The calls this feature makes to the backend. The transport they go through — base URL, token,
 * errors — is shared/api.
 */
import { bustSchemaCache, http, type MagicResponse } from '@shared/api';

// One row of an SQL result set, column name to value.
export type SqlRow = Record<string, unknown>;

export function executeSql(
  databaseType: string,
  database: string,
  sql: string,
  safeMode: boolean,
  batch: boolean,
) {
  return http.post<SqlRow[][]>('/magic/system/sql/evaluate', {
    databaseType,
    database,
    sql,
    safeMode,
    batch,
  });
}

/*
 * Imports a CSV file, creating a table named after the file with one column per
 * CSV column. The backend runs the import on a background thread and announces
 * completion over the magic.backend.message socket, so this resolves as soon as
 * the import has started, not when it finishes.
 */
export function importCsvFile(
  databaseType: string,
  connectionString: string,
  databaseName: string,
  file: File,
) {
  const formData = new FormData();
  formData.append('databaseType', databaseType);
  formData.append('connectionString', connectionString);
  formData.append('databaseName', databaseName);
  formData.append('file', file, file.name);
  return http.post<MagicResponse>('/magic/system/sql/import-csv-file', formData);
}

export async function addTable(
  databaseType: string,
  connectionString: string,
  databaseName: string,
  tableName: string,
  pkName: string,
  pkType: string,
  pkLength: number,
) {
  const result = await http.post<MagicResponse>('/magic/system/sql/ddl/table', {
    databaseType,
    connectionString,
    databaseName,
    tableName,
    pkName,
    pkType,
    pkLength,
    pkDefault: null,
  });
  await bustSchemaCache(databaseType, connectionString);
  return result;
}

export async function dropTable(
  databaseType: string,
  connectionString: string,
  databaseName: string,
  tableName: string,
) {
  const result = await http.delete<MagicResponse>(
    '/magic/system/sql/ddl/table?databaseType=' +
      encodeURIComponent(databaseType) +
      '&connectionString=' +
      encodeURIComponent(connectionString) +
      '&databaseName=' +
      encodeURIComponent(databaseName) +
      '&tableName=' +
      encodeURIComponent(tableName),
  );
  await bustSchemaCache(databaseType, connectionString);
  return result;
}

// The table a column is added to, and the database it is in.
export interface ColumnTarget {
  databaseType: string;
  connectionString: string;
  databaseName: string;
  tableName: string;
}

export interface NewColumn {
  columnName: string;
  columnType: string;
  defaultValue: string | null;
  nullable: boolean;
  columnLength: number | null;
}

export interface NewForeignKey {
  columnName: string;
  columnType: string;
  foreignTable: string;
  foreignField: string;
  nullable: boolean;
  columnLength: number | null;
  cascading: boolean;
}

export async function addColumn(target: ColumnTarget, column: NewColumn) {
  const result = await http.post<MagicResponse>('/magic/system/sql/ddl/column', {
    databaseType: target.databaseType,
    connectionString: target.connectionString,
    databaseName: target.databaseName,
    tableName: target.tableName,
    columnName: column.columnName,
    columnType: column.columnType,
    defaultValue: column.defaultValue,
    nullable: column.nullable,
    indexed: false,
    columnLength: column.columnLength,
  });
  await bustSchemaCache(target.databaseType, target.connectionString);
  return result;
}

export async function addForeignKey(target: ColumnTarget, column: NewForeignKey) {
  const result = await http.post<MagicResponse>('/magic/system/sql/ddl/column', {
    databaseType: target.databaseType,
    connectionString: target.connectionString,
    databaseName: target.databaseName,
    tableName: target.tableName,
    columnName: column.columnName,
    columnType: column.columnType,
    foreignTable: column.foreignTable,
    foreignField: column.foreignField,
    nullable: column.nullable,
    columnLength: column.columnLength,
    cascading: column.cascading,
  });
  await bustSchemaCache(target.databaseType, target.connectionString);
  return result;
}

export async function dropColumn(
  databaseType: string,
  connectionString: string,
  databaseName: string,
  tableName: string,
  columnName: string,
) {
  const result = await http.delete<MagicResponse>(
    '/magic/system/sql/ddl/column?databaseType=' +
      encodeURIComponent(databaseType) +
      '&connectionString=' +
      encodeURIComponent(connectionString) +
      '&databaseName=' +
      encodeURIComponent(databaseName) +
      '&tableName=' +
      encodeURIComponent(tableName) +
      '&columnName=' +
      encodeURIComponent(columnName),
  );
  await bustSchemaCache(databaseType, connectionString);
  return result;
}

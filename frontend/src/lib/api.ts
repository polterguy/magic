/*
 * HTTP layer towards the currently connected Magic backend, plus one
 * function per backend endpoint the dashboard consumes — mirroring the
 * Angular service layer.
 */

import { loadBackend } from './backend';

let baseUrl = '';
let bearerToken: string | null = null;

export function configureApi(url: string, token: string | null) {
  baseUrl = url;
  bearerToken = token;
}

// Lets anything caching backend answers notice that the backend changed.
export function apiBaseUrl() {
  return baseUrl;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  method: string,
  url: string,
  body?: any,
  opts?: { text?: boolean; noBase?: boolean }): Promise<T> {

  const headers: Record<string, string> = {};
  if (bearerToken) {
    headers['Authorization'] = 'Bearer ' + bearerToken;
  }
  let payload: BodyInit | undefined = undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const response = await fetch((opts?.noBase ? '' : baseUrl) + url, {
    method,
    headers,
    body: payload,
  });
  if (!response.ok) {
    let message = response.statusText;
    try {
      const err = await response.json();
      message = err.message ?? message;
    } catch {
      // Non-JSON error body, statusText is the best we have.
    }
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) {
    return null as T;
  }
  const text = await response.text();
  if (opts?.text) {
    return text as T;
  }
  // The backend answers with text/plain for scalar results and JSON otherwise.
  const contentType = response.headers.get('Content-Type') ?? '';
  if (!contentType.includes('json')) {
    return text as T;
  }
  return (text === '' ? null : JSON.parse(text)) as T;
}

export const http = {
  get: <T,>(url: string) => request<T>('GET', url),
  getText: (url: string) => request<string>('GET', url, undefined, { text: true }),
  post: <T,>(url: string, body: any) => request<T>('POST', url, body),
  put: <T,>(url: string, body: any) => request<T>('PUT', url, body),
  patch: <T,>(url: string, body: any) => request<T>('PATCH', url, body),
  delete: <T,>(url: string) => request<T>('DELETE', url),
};

export interface MagicResponse {
  result: string;
}

/*
 * Authentication.
 */

export function authenticate(url: string, username: string, password: string) {
  const query =
    '?username=' + encodeURIComponent(username) +
    '&password=' + encodeURIComponent(password);
  return request<{ ticket: string }>(
    'GET',
    url + '/magic/system/auth/authenticate' + query,
    undefined,
    { noBase: true });
}

export function refreshTicket() {
  return http.get<{ ticket: string }>('/magic/system/auth/refresh-ticket');
}

export function changePassword(password: string) {
  return http.put<MagicResponse>('/magic/system/auth/change-password', { password });
}

/*
 * Status and version.
 */

export function getStatus() {
  return http.get<{ result: string }>('/magic/system/config/status');
}

/*
 * First-run setup: the backend generates its own JWT secret, ensures the
 * magic database exists and creates or re-passwords root, answering with a
 * ticket signed by the new secret. It deliberately sleeps a couple of
 * seconds on the way, so this is a slow call.
 */
export function setupSystem(payload: {
  password: string;
  name: string;
  email: string;
  subscribe: boolean;
}) {
  return http.post<{ ticket: string }>('/magic/system/config/setup', payload);
}

/*
 * Writes an extra field, adding it when the user hasn't got one yet. Setup
 * only stores name and email when it CREATES root — on an install where root
 * already exists it takes the change-password branch and drops them — so
 * they have to be written separately to be sure they stick.
 */
export async function saveUserExtra(user: string, type: string, value: string) {
  const existing = await listUsers(user, 0, 1);
  const match = existing.find(candidate => candidate.username === user);
  const has = match?.extra?.some(entry => entry.type === type) ?? false;
  if (value === '') {
    return has ? deleteUserExtra(user, type) : Promise.resolve();
  }
  return has ? updateUserExtra(user, type, value) : addUserExtra(user, type, value);
}

export function getVersion() {
  return http.get<{ version: string }>('/magic/system/version');
}

export function getSystemInformation() {
  return http.get<any>('/magic/system/diagnostics/system-information');
}

/*
 * Files and folders.
 */

export function listFiles(folder: string, filter?: string) {
  let query = '?folder=' + encodeURIComponent(folder);
  if (filter) {
    query += '&filter=' + encodeURIComponent(filter);
  }
  return http.get<string[]>('/magic/system/file-system/list-files' + query);
}

export function listFolders(folder: string) {
  return http.get<string[]>(
    '/magic/system/file-system/list-folders?folder=' + encodeURIComponent(folder));
}

export function listFoldersRecursively(folder: string, sysFiles: boolean) {
  return http.get<string[]>(
    '/magic/system/file-system/list-folders-recursively?folder=' +
    encodeURIComponent(folder) + '&sys=' + sysFiles);
}

export function listFilesRecursively(folder: string, sysFiles: boolean) {
  return http.get<string[]>(
    '/magic/system/file-system/list-files-recursively?folder=' +
    encodeURIComponent(folder) + '&sys=' + sysFiles);
}

/*
 * Installs a module from a ZIP file into /modules/. The backend takes the
 * archive's name as the module name, so it must be "<name>.zip" with no
 * further dots and only lowercase letters, digits, hyphens or underscores.
 */
/*
 * The module name a ZIP would install as, or null when the archive can't be
 * one. The backend takes the folder name straight from the filename, so it
 * has to be "<name>.zip" with no further dots.
 */
export function moduleNameFromZip(file: File): string | null {
  const match = /^([a-z0-9_-]+)\.zip$/.exec(file.name);
  return match ? match[1] : null;
}

export function installModule(file: File) {
  const formData = new FormData();
  formData.append('file', file, file.name);
  return http.put<any>('/magic/system/file-system/install-module', formData);
}

export function loadFile(filename: string) {
  return http.getText('/magic/system/file-system/file?file=' + encodeURIComponent(filename));
}

export function saveFile(filename: string, content: string) {
  const folder = filename.substring(0, filename.lastIndexOf('/') + 1);
  const formData = new FormData();
  const blob = new Blob([content], { type: 'text/plain' });
  formData.append('file', blob, filename.substring(filename.lastIndexOf('/') + 1));
  return http.put<any>(
    '/magic/system/file-system/file?folder=' + encodeURIComponent(folder), formData);
}

export function deleteFile(file: string) {
  return http.delete<MagicResponse>(
    '/magic/system/file-system/file?file=' + encodeURIComponent(file));
}

export function renamePath(oldName: string, newName: string) {
  return http.post<MagicResponse>('/magic/system/file-system/rename', { oldName, newName });
}

export function createFolder(folder: string) {
  return http.put<MagicResponse>('/magic/system/file-system/folder', { folder });
}

export function deleteFolder(folder: string) {
  return http.delete<MagicResponse>(
    '/magic/system/file-system/folder?folder=' + encodeURIComponent(folder));
}

export function uploadFile(folder: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return http.put<any>(
    '/magic/system/file-system/file?folder=' + encodeURIComponent(folder), formData);
}

export function downloadFileRaw(file: string) {
  return requestRaw(
    'GET', '/magic/system/file-system/file?file=' + encodeURIComponent(file));
}

export function downloadFolderRaw(folder: string) {
  return requestRaw(
    'GET', '/magic/system/file-system/download-folder?folder=' + encodeURIComponent(folder));
}

export function getOpenApiSpec(filter: string) {
  return http.get<any>(
    '/magic/system/endpoints/openapi?system=true&filter=' + encodeURIComponent(filter));
}

/*
 * Hyperlambda evaluator.
 */

/*
 * Returns the raw response body — text/plain for scalar results,
 * JSON text for node results.
 */
export function evaluate(hyperlambda: string) {
  return request<string>(
    'POST', '/magic/system/evaluator/evaluate', { hyperlambda }, { text: true });
}

/*
 * Returns the [.arguments] collection of the given Hyperlambda as
 * {name: {type, mandatory?}}, or null if the code takes no arguments.
 */
export function getHyperlambdaArguments(hyperlambda: string) {
  return http.post<Record<string, { type: string; mandatory?: boolean }> | null>(
    '/magic/system/evaluator/get-arguments', { hyperlambda });
}

/*
 * Issues a request and returns the raw response so callers can dispatch on
 * Content-Type and Content-Disposition (JSON, HTML, files, anything).
 * Throws on non-2xx unless allowErrors is set — invokers want to SHOW
 * error responses rather than throw.
 */
async function requestRaw(
  method: string, url: string, body?: string | FormData, contentType?: string, allowErrors = false) {

  const headers: Record<string, string> = {};
  if (bearerToken) {
    headers['Authorization'] = 'Bearer ' + bearerToken;
  }
  // FormData bodies set their own multipart content-type with boundary.
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = contentType ?? 'application/json';
  }
  const started = performance.now();
  const response = await fetch(baseUrl + url, { method, headers, body });
  if (!response.ok && !allowErrors) {
    let message = response.statusText;
    try {
      message = (await response.json()).message ?? message;
    } catch {
      // Non-JSON error body.
    }
    throw new ApiError(response.status, message);
  }
  // Every response header, so the invoker can show what the server sent.
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, name) => { responseHeaders[name] = value; });
  return {
    blob: await response.blob(),
    contentType: response.headers.get('Content-Type') ?? '',
    disposition: response.headers.get('Content-Disposition') ?? '',
    headers: responseHeaders,
    status: response.status,
    elapsed: Math.round(performance.now() - started),
  };
}

/*
 * Executes Hyperlambda decorated with the given arguments — this is how
 * endpoint files are executed, since plain evaluate refuses them.
 */
export function evaluateWithArgs(hyperlambda: string, args: any) {
  return requestRaw(
    'POST',
    '/magic/system/evaluator/evaluate-with-args',
    JSON.stringify({ hyperlambda, args }));
}

/*
 * Invokes an endpoint with its actual HTTP verb. url includes any query
 * parameters; payload is the raw request body for POST/PUT/PATCH.
 * Error responses are returned, not thrown, so the invoker can display them.
 */
export function invokeEndpoint(
  verb: string, url: string, payload?: string | FormData, contentType?: string) {
  return requestRaw(verb.toUpperCase(), '/' + url, payload, contentType, true);
}

/*
 * SQL.
 */

export function defaultDatabaseType() {
  return http.get<{ default: string; options: string[] }>(
    '/magic/system/sql/default-database-type');
}

export function listDatabases(databaseType: string, connectionString: string) {
  return http.get<any>(
    '/magic/system/sql/databases?databaseType=' + encodeURIComponent(databaseType) +
    '&connectionString=' + encodeURIComponent(connectionString));
}

export function executeSql(
  databaseType: string, database: string, sql: string, safeMode: boolean, batch: boolean) {
  return http.post<any[][]>('/magic/system/sql/evaluate', {
    databaseType,
    database,
    sql,
    safeMode,
    batch,
  });
}

/*
 * Databases management.
 */

export function createDatabase(
  databaseType: string, connectionString: string, databaseName: string) {
  return http.post<MagicResponse>('/magic/system/sql/ddl/database', {
    databaseType,
    connectionString,
    databaseName,
  });
}

export function dropDatabase(
  databaseType: string, connectionString: string, databaseName: string) {
  return http.delete<MagicResponse>(
    '/magic/system/sql/ddl/database?databaseType=' + encodeURIComponent(databaseType) +
    '&connectionString=' + encodeURIComponent(connectionString) +
    '&databaseName=' + encodeURIComponent(databaseName));
}

/*
 * Direct download URL carrying the JWT as query parameter — the pattern the
 * old dashboard uses for SQLite backup downloads.
 */
export function fileWithTokenUrl(file: string) {
  return baseUrl + '/magic/system/file-system/file-with-token?file=' +
    encodeURIComponent(file) + '&access_token=' + encodeURIComponent(bearerToken ?? '');
}

export function uploadDatabaseBackup(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return http.put<any>('/magic/system/sql/backup', formData);
}

export function loadConfig() {
  return http.get<any>('/magic/system/config/load');
}

export function saveConfig(config: any) {
  return http.post<MagicResponse>('/magic/system/config/save', config);
}

export function testConnectionString(databaseType: string, connectionString: string) {
  return http.post<{ result: string; message?: string }>(
    '/magic/system/sql/test-connection-string', { databaseType, connectionString });
}

export function addConnectionString(
  databaseType: string, name: string, connectionString: string, useAsDefault: boolean) {
  return http.post<MagicResponse>('/magic/system/sql/connection-string', {
    databaseType,
    name,
    connectionString,
    useAsDefault,
  });
}

export function deleteConnectionString(databaseType: string, name: string) {
  return http.delete<MagicResponse>(
    '/magic/system/sql/connection-string?databaseType=' + encodeURIComponent(databaseType) +
    '&name=' + encodeURIComponent(name));
}

/*
 * Backend generator — one invocation per verb per table.
 */
export function crudify(payload: any) {
  return http.post<{ loc: number; result: string }>(
    '/magic/system/crudifier/crudify', payload);
}

export function customSqlEndpoint(payload: {
  databaseType: string;
  database: string;
  authorization: string;
  moduleName: string;
  endpointName: string;
  verb: string;
  sql: string;
  arguments: string;
  overwrite: boolean;
}) {
  return http.post<MagicResponse>('/magic/system/crudifier/custom-sql', payload);
}

export function exportDdl(
  databaseType: string, connectionString: string, databaseName: string,
  tables: string[], full: boolean) {
  return http.post<{ result: string }>('/magic/system/sql/ddl/export-tables', {
    databaseType,
    connectionString,
    databaseName,
    tables,
    full,
  });
}

/*
 * DDL mutations — create/drop tables, columns, foreign keys, indexes.
 * Every mutation invalidates the cached schema for the connection.
 */
export function flushSchemaCache(databaseType: string, connectionString: string) {
  return http.delete<any>('/magic/system/cache/delete?id=' +
    encodeURIComponent('magic.sql.databases.' + databaseType + '.' + connectionString + '.*'));
}

function bustSchemaCache(databaseType: string, connectionString: string) {
  return flushSchemaCache(databaseType, connectionString).catch(() => {});
}

export async function addTable(
  databaseType: string, connectionString: string, databaseName: string,
  tableName: string, pkName: string, pkType: string, pkLength: number) {
  const result = await http.post<any>('/magic/system/sql/ddl/table', {
    databaseType, connectionString, databaseName,
    tableName, pkName, pkType, pkLength, pkDefault: null,
  });
  await bustSchemaCache(databaseType, connectionString);
  return result;
}

export async function dropTable(
  databaseType: string, connectionString: string, databaseName: string, tableName: string) {
  const result = await http.delete<any>(
    '/magic/system/sql/ddl/table?databaseType=' + encodeURIComponent(databaseType) +
    '&connectionString=' + encodeURIComponent(connectionString) +
    '&databaseName=' + encodeURIComponent(databaseName) +
    '&tableName=' + encodeURIComponent(tableName));
  await bustSchemaCache(databaseType, connectionString);
  return result;
}

export async function addColumn(
  databaseType: string, connectionString: string, databaseName: string, tableName: string,
  columnName: string, columnType: string, defaultValue: string | null,
  nullable: boolean, columnLength: number | null) {
  const result = await http.post<any>('/magic/system/sql/ddl/column', {
    databaseType, connectionString, databaseName, tableName,
    columnName, columnType, defaultValue, nullable, indexed: false, columnLength,
  });
  await bustSchemaCache(databaseType, connectionString);
  return result;
}

export async function addForeignKey(
  databaseType: string, connectionString: string, databaseName: string, tableName: string,
  columnName: string, columnType: string, foreignTable: string, foreignField: string,
  nullable: boolean, columnLength: number | null, cascading: boolean) {
  const result = await http.post<any>('/magic/system/sql/ddl/column', {
    databaseType, connectionString, databaseName, tableName,
    columnName, columnType, foreignTable, foreignField, nullable, columnLength, cascading,
  });
  await bustSchemaCache(databaseType, connectionString);
  return result;
}

export async function dropColumn(
  databaseType: string, connectionString: string, databaseName: string,
  tableName: string, columnName: string) {
  const result = await http.delete<any>(
    '/magic/system/sql/ddl/column?databaseType=' + encodeURIComponent(databaseType) +
    '&connectionString=' + encodeURIComponent(connectionString) +
    '&databaseName=' + encodeURIComponent(databaseName) +
    '&tableName=' + encodeURIComponent(tableName) +
    '&columnName=' + encodeURIComponent(columnName));
  await bustSchemaCache(databaseType, connectionString);
  return result;
}

export async function addLinkTable(
  databaseType: string, connectionString: string, databaseName: string, args: any) {
  const result = await http.post<any>('/magic/system/sql/ddl/link-table', {
    databaseType, connectionString, databaseName, args,
  });
  await bustSchemaCache(databaseType, connectionString);
  return result;
}

/*
 * Endpoints.
 */

export interface Endpoint {
  path: string;
  verb: string;
  consumes?: string;
  produces?: string;
  auth?: string[];
  description?: string;
  type?: string;
  input?: { name: string; type: string }[];
}

export function listEndpoints() {
  return http.get<Endpoint[]>('/magic/system/endpoints/list');
}

/*
 * Users and roles.
 */

/*
 * The users endpoint joins in each user's roles and extra fields, so the
 * list gives us everything without per-user round-trips.
 */
export interface UserExtra {
  type: string;
  value: string;
}

export interface User {
  username: string;
  created?: string;
  roles?: string[];
  extra?: UserExtra[];
}

export interface Role {
  name: string;
  description?: string;
}

// Value of an extra field, or empty when the user hasn't got that field.
export function userExtra(user: User, type: string) {
  return user.extra?.find(entry => entry.type === type)?.value ?? '';
}

export function listUsers(
  filter: string, offset: number, limit: number,
  sort?: { column: string | null; direction: 'asc' | 'desc' }) {
  const order = sort?.column
    ? `&order=${encodeURIComponent(sort.column)}&direction=${sort.direction}`
    : '&order=username';
  let query = `?limit=${limit}&offset=${offset}` + order;
  if (filter) {
    query += '&username.like=' + encodeURIComponent(filter + '%');
  }
  return http.get<User[]>('/magic/system/magic/users' + query);
}

export function countUsers(filter: string) {
  let query = '';
  if (filter) {
    query = '?username.like=' + encodeURIComponent(filter + '%');
  }
  return http.get<{ count: number }>('/magic/system/magic/users-count' + query);
}

export function createUser(username: string, password: string) {
  return http.post<any>('/magic/system/magic/users', { username, password });
}

export function deleteUser(username: string) {
  return http.delete<any>('/magic/system/magic/users?username=' + encodeURIComponent(username));
}

export function changeUserPassword(username: string, password: string) {
  return http.put<any>('/magic/system/magic/users', { username, password });
}

export function listRoles() {
  return http.get<Role[]>('/magic/system/magic/roles?limit=-1&order=name');
}

export function createRole(name: string, description: string) {
  return http.post<any>('/magic/system/magic/roles', { name, description });
}

export function updateRole(name: string, description: string) {
  return http.put<any>('/magic/system/magic/roles', { name, description });
}

export function deleteRole(name: string) {
  return http.delete<any>('/magic/system/magic/roles?name=' + encodeURIComponent(name));
}

/*
 * Extra fields associated with a user — name, email, or anything else the
 * application wants to store per user.
 */
export function addUserExtra(user: string, type: string, value: string) {
  return http.post<any>('/magic/system/magic/users_extra', { user, type, value });
}

export function updateUserExtra(user: string, type: string, value: string) {
  return http.put<any>('/magic/system/magic/users_extra', { user, type, value });
}

export function deleteUserExtra(user: string, type: string) {
  return http.delete<any>(
    '/magic/system/magic/users_extra?user=' + encodeURIComponent(user) +
    '&type=' + encodeURIComponent(type));
}

export function addUserToRole(user: string, role: string) {
  return http.post<any>('/magic/system/magic/users_roles', { user, role });
}

export function removeUserFromRole(user: string, role: string) {
  return http.delete<any>(
    '/magic/system/magic/users_roles?user=' + encodeURIComponent(user) +
    '&role=' + encodeURIComponent(role));
}

/*
 * Tasks.
 */

export interface Task {
  id: string;
  description?: string;
  hyperlambda?: string;
  created?: string;
  schedules?: { id: number; due: string; repeats?: string }[];
}

export function listTasks(offset: number, limit: number, filter?: string) {
  let url = `/magic/system/tasks/list?offset=${offset}&limit=${limit}`;
  if (filter) {
    url += '&filter=' + encodeURIComponent('%' + filter + '%');
  }
  return http.get<Task[]>(url);
}

export function countTasks(filter?: string) {
  let url = '/magic/system/tasks/count';
  if (filter) {
    url += '?filter=' + encodeURIComponent('%' + filter + '%');
  }
  return http.get<{ count: number }>(url);
}

/*
 * The endpoint returns the task's properties without its name — the name is
 * the node the properties hang off, and that gets stripped on the way out —
 * so we put it back to hand callers a complete task.
 */
export async function getTask(name: string) {
  const task = await http.get<Task>('/magic/system/tasks/get?name=' + encodeURIComponent(name));
  return { ...task, id: name };
}

export function createTask(id: string, description: string, hyperlambda: string) {
  return http.post<MagicResponse>('/magic/system/tasks/create', { id, description, hyperlambda });
}

export function updateTask(id: string, description: string, hyperlambda: string) {
  return http.post<MagicResponse>('/magic/system/tasks/update', { id, description, hyperlambda });
}

export function deleteTask(id: string) {
  return http.delete<MagicResponse>('/magic/system/tasks/delete?id=' + encodeURIComponent(id));
}

export function executeTask(id: string) {
  return http.post<MagicResponse>('/magic/system/tasks/execute', { id });
}

export function scheduleTask(id: string, due?: string, repeats?: string) {
  const payload: any = { id };
  if (repeats) {
    payload.repeats = repeats;
  } else {
    payload.due = due;
  }
  return http.post<MagicResponse>('/magic/system/tasks/due/add', payload);
}

export function deleteSchedule(id: number) {
  return http.delete<MagicResponse>('/magic/system/tasks/due/delete?id=' + id);
}

/*
 * Machine learning.
 */

export function backendInfo() {
  return { url: baseUrl, token: bearerToken };
}

export function mlTypes() {
  return http.get<any[]>('/magic/system/magic/ml_types?limit=-1&order=type');
}

export function mlTypeCreate(type: any) {
  return http.post<any>('/magic/system/magic/ml_types', type);
}

export function mlTypeUpdate(type: any) {
  return http.put<any>('/magic/system/magic/ml_types', type);
}

export function mlTypeDelete(type: string) {
  return http.delete<any>('/magic/system/magic/ml_types?type=' + encodeURIComponent(type));
}

/*
 * Search text matches against prompt, completion or uri — the endpoints nest
 * these three inside an [or], so they widen the search rather than narrowing
 * it, while the type stays ANDed. The uri match is a prefix, since URIs start
 * with their domain.
 */
function snippetSearchQuery(filter: string) {
  if (!filter) {
    return '';
  }
  const like = encodeURIComponent('%' + filter + '%');
  return '&ml_training_snippets.prompt.like=' + like +
    '&ml_training_snippets.completion.like=' + like +
    '&ml_training_snippets.uri.like=' + encodeURIComponent(filter + '%');
}

export function mlSnippets(
  type: string, filter: string, offset: number, limit: number,
  sort?: { column: string | null; direction: 'asc' | 'desc' },
  vectorSearch = false) {
  /*
   * Vector search asks the model which snippets are semantically closest to
   * the search text, and answers with a distance per snippet — it takes no
   * ordering or LIKE filters.
   */
  if (vectorSearch) {
    return http.get<any[]>(
      '/magic/system/magic/ml_training_snippets-vss' +
      `?limit=${limit}&offset=${offset}` +
      '&type=' + encodeURIComponent(type) +
      '&filter=' + encodeURIComponent(filter));
  }
  const order = sort?.column
    ? `&order=${encodeURIComponent(sort.column)}&direction=${sort.direction}`
    : '&order=created&direction=desc';
  const query = `?limit=${limit}&offset=${offset}` + order +
    '&ml_training_snippets.type.eq=' + encodeURIComponent(type) +
    snippetSearchQuery(filter);
  return http.get<any[]>('/magic/system/magic/ml_training_snippets' + query);
}

export function mlSnippetsCount(type: string, filter: string, vectorSearch = false) {
  // Vector search always considers the whole type, so its count ignores the filter.
  const query = '?ml_training_snippets.type.eq=' + encodeURIComponent(type) +
    (vectorSearch ? '' : snippetSearchQuery(filter));
  return http.get<{ count: number }>('/magic/system/magic/ml_training_snippets-count' + query);
}

/*
 * Deletes every snippet matching the current filter, rather than one at a
 * time — the filter is passed exactly as the listing uses it.
 */
export function mlSnippetsDeleteAll(type: string, filter: string) {
  const query = '?ml_training_snippets.type.eq=' + encodeURIComponent(type) +
    snippetSearchQuery(filter);
  return http.delete<any>('/magic/system/magic/ml_training_snippets_all' + query);
}

/*
 * Downloads every snippet matching the filter as CSV — the whole filtered
 * set, not just the page on screen.
 */
export function mlSnippetsExportRaw(type: string, filter: string) {
  const query = '?ml_training_snippets.type.eq=' + encodeURIComponent(type) +
    snippetSearchQuery(filter);
  return requestRaw('GET', '/magic/system/magic/ml_training_snippets_export' + query);
}

export function mlSnippetCreate(snippet: any) {
  return http.post<any>('/magic/system/magic/ml_training_snippets', snippet);
}

export function mlSnippetUpdate(snippet: any) {
  return http.put<any>('/magic/system/magic/ml_training_snippets', snippet);
}

export function mlSnippetDelete(id: number) {
  return http.delete<any>('/magic/system/magic/ml_training_snippets?id=' + id);
}

export function mlRequests(type: string, offset: number, limit: number) {
  return http.get<any[]>(
    `/magic/system/magic/ml_requests?limit=${limit}&offset=${offset}` +
    '&order=created&direction=desc&ml_requests.type.eq=' + encodeURIComponent(type));
}

/*
 * OpenID Connect. Both of these run before the user is signed in, and
 * against a backend that isn't configured yet, so they take the URL
 * explicitly and send no Authorization header.
 */
export interface OidcProvider {
  name: string;
  issuer: string;
  nonce?: string;
  url?: string;
  client_id?: string;
  response_type?: string;
  scope?: string;
}

/*
 * Providers the backend has configured — there may be none at all, or
 * several, so the login screen renders whatever comes back.
 */
/*
 * Whether the backend can email a sign in link, which needs SMTP. Answers
 * false rather than throwing, so a backend without the endpoint simply
 * doesn't offer the option.
 */
export async function canResetPassword(backendUrl: string) {
  try {
    const response = await fetch(
      backendUrl.replace(/\/+$/, '') + '/magic/system/auth/can-reset-password');
    if (!response.ok) {
      return false;
    }
    return (await response.json()).result === true;
  } catch {
    return false;
  }
}

/*
 * Asks the backend to email a sign in link. The answer is deliberately the
 * same whether or not the account exists, so it says nothing about who does.
 */
export async function sendResetPasswordLink(backendUrl: string, user: string) {
  const response = await fetch(
    backendUrl.replace(/\/+$/, '') + '/magic/system/auth/send-reset-password-link',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });
  if (!response.ok) {
    throw new ApiError(response.status, response.statusText);
  }
  return await response.json() as { result: string };
}

/*
 * Whether the configured token is accepted by the backend. Used after a
 * magnetic link hands us a token, to find out whether it is any good before
 * showing the dashboard.
 */
export async function verifyTicket() {
  const response = await http.get<{ result: string }>('/magic/system/auth/verify-ticket');
  return response.result === 'success';
}

export async function openidProviders(backendUrl: string) {
  const response = await fetch(
    backendUrl.replace(/\/+$/, '') +
    '/magic/system/auth/openid-providers?createNonce=true');
  if (!response.ok) {
    return [];
  }
  const text = await response.text();
  return text === '' ? [] : JSON.parse(text) as OidcProvider[];
}

// Exchanges a provider's id_token for a Magic JWT.
export async function openidLogin(backendUrl: string, token: string) {
  const response = await fetch(
    backendUrl.replace(/\/+$/, '') +
    '/magic/system/auth/openid-login?token=' + encodeURIComponent(token));
  if (!response.ok) {
    let message = response.statusText;
    try {
      message = (await response.json()).message ?? message;
    } catch {
      // Non-JSON error body, statusText is the best we have.
    }
    throw new ApiError(response.status, message);
  }
  return await response.json() as { ticket: string };
}

export function openaiIsConfigured() {
  return http.get<{ result: boolean }>('/magic/system/openai/is-configured');
}

// The currently configured OpenAI API key, empty when none is set.
export function openaiGetKey() {
  return http.get<{ result: string }>('/magic/system/openai/key');
}

// Stores the OpenAI API key in the backend's configuration.
export function openaiSetKey(key: string) {
  return http.post<any>('/magic/system/openai/key', { key });
}

/*
 * Asks the AI to generate code. Hyperlambda prompts go to the public
 * Hyperlambda generator at ainiro.io — same service the old dashboard used,
 * invoked anonymously — while other file types go through the connected
 * backend's OpenAI proxy.
 */
const GENERATOR_URL = 'https://ainiro.io';

export async function aiQuery(
  prompt: string,
  fileType: string,
  contextOverride?: string,
  session?: string): Promise<{ result: string }> {

  const payload = new FormData();
  payload.append('prompt', prompt);
  if (contextOverride) {
    payload.append('system_message_override', contextOverride);
  }
  if (fileType === 'hl') {
    const response = await fetch(
      GENERATOR_URL + '/magic/modules/hyperlambda-generator/chat',
      { method: 'POST', body: payload });
    if (!response.ok) {
      let message = response.statusText;
      try {
        message = (await response.json()).message ?? message;
      } catch {
        // Non-JSON error body, statusText is the best we have.
      }
      throw new ApiError(response.status, message);
    }
    return await response.json();
  }
  payload.append('type', fileType);
  payload.append('user_id', loadBackend()?.username ?? '');
  payload.append('references', 'false');
  payload.append('stream', 'false');
  if (session) {
    payload.append('session', session);
  }
  return http.post<{ result: string }>('/magic/system/openai/chat', payload);
}

export function openaiModels() {
  return http.get<{ id: string; chat?: boolean; vector?: boolean }[]>(
    '/magic/system/openai/models');
}

export function gibberish() {
  return http.get<{ result: string }>('/magic/system/misc/gibberish?min=20&max=30');
}

export function vectoriseType(type: string, channel: string) {
  return http.post<any>('/magic/system/openai/vectorise', {
    type,
    'feedback-channel': channel,
  });
}

/*
 * Prompts the model — stream=false, so the completion comes back in the
 * response instead of over the socket.
 */
export function openaiChat(prompt: string, type: string, session: string, username: string) {
  const payload = new FormData();
  payload.append('prompt', prompt);
  payload.append('session', session);
  payload.append('references', 'true');
  payload.append('type', type);
  payload.append('user_id', username);
  payload.append('stream', 'false');
  return http.post<any>('/magic/system/openai/chat', payload);
}

/*
 * Scrapes every URL listed in a CSV file — the file must have a single
 * column containing nothing but URLs. Progress arrives on the feedback
 * channel over the socket, as it does for crawling.
 */
export function uploadUrlList(
  type: string, file: File, channel: string, vectorize: boolean) {
  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('type', type);
  formData.append('feedback-channel', channel);
  formData.append('vectorize', vectorize ? 'true' : 'false');
  return http.post<any>('/magic/system/openai/upload-url-list', formData);
}

/*
 * Scrapes one single page into training snippets — "spicing" a model with
 * one more page rather than crawling a whole site.
 */
export function importPage(args: {
  url: string;
  type: string;
  threshold: number;
  images: boolean;
  lists: boolean;
  code: boolean;
  channel: string;
}) {
  return http.post<any>('/magic/system/openai/import-page', {
    url: args.url,
    type: args.type,
    threshold: args.threshold,
    images: args.images,
    lists: args.lists,
    code: args.code,
    'feedback-channel': args.channel,
  });
}

// HTML widgets a model can render as part of an answer.
export function availableWidgets() {
  return http.get<{ name: string; description: string; file: string }[]>(
    '/magic/system/openai/available-widgets?private=false');
}

/*
 * Crawls a website into training snippets — progress arrives on the
 * feedback channel over the socket.
 */
export function importUrl(args: {
  url: string;
  type: string;
  delay: number;
  max: number;
  threshold: number;
  summarize: boolean;
  insert_url: boolean;
  images: boolean;
  lists: boolean;
  code: boolean;
  channel: string;
  // Tag associated with the generated snippets — the backend defaults it.
  meta?: string;
}) {
  return http.post<any>('/magic/system/openai/import-url', {
    url: args.url,
    type: args.type,
    delay: args.delay,
    max: args.max,
    threshold: args.threshold,
    summarize: args.summarize,
    insert_url: args.insert_url,
    images: args.images,
    lists: args.lists,
    code: args.code,
    'feedback-channel': args.channel,
    meta: args.meta || null,
  });
}

// Backend prompt that turns raw content into a searchable one-line summary.
const SUMMARISE_PROMPT =
  'Create a short keyword-based single descriptive sentence from the following ' +
  'information intended for doing VSS-based search on it later to retrieve it using RAG';

export interface UploadOptions {
  summarize?: boolean;
  forceAsText?: boolean;
  // Structured files: which fields in the file become prompt/completion.
  promptField?: string;
  completionField?: string;
  // PDF-only options.
  preservePages?: boolean;
  overwrite?: boolean;
  massage?: string;
}

/*
 * Uploads a text/structured/PDF file as training data. Structured formats
 * (csv/xml/yaml/json) parse into lists of objects, and promptField /
 * completionField name which fields substitute as prompt and completion.
 */
export function uploadTrainingFile(type: string, file: File, options: UploadOptions = {}) {
  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('type', type);
  formData.append('prompt', options.promptField || 'prompt');
  formData.append('completion', options.completionField || 'completion');
  if (options.forceAsText) {
    formData.append('forceAsText', 'true');
  }
  const isPdf = file.name.toLowerCase().endsWith('.pdf');
  if (isPdf) {
    if (options.massage) {
      formData.append('massage', options.massage);
    }
    if (options.preservePages) {
      formData.append('preservePages', 'true');
    }
    if (options.overwrite) {
      formData.append('overwrite', 'true');
    }
  }
  if (options.summarize) {
    formData.append('massagePrompt', SUMMARISE_PROMPT);
  }
  return http.post<{ count: number }>('/magic/system/openai/upload-training-data', formData);
}

/*
 * Uploads a CSV whose columns become prompt/completion pairs directly.
 */
export function uploadCsvFile(type: string, file: File) {
  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('type', type);
  return http.post<{ count: number }>('/magic/system/openai/upload-csv', formData);
}

/*
 * Uploads an image, vectorising it as training data.
 */
export function uploadImageFile(type: string, file: File) {
  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('type', type);
  return http.post<{ count: number }>('/magic/system/openai/upload-image', formData);
}

export function openaiThemes() {
  return http.get<string[]>('/magic/system/openai/themes');
}

export function openaiThemesSearch() {
  return http.get<string[]>('/magic/system/openai/themes-search');
}

/*
 * Crawls a website and builds a chatbot from it — the "chatbot wizard" as one
 * call. Long running: progress is published on [channel] over the socket, and
 * the answer only arrives once the crawl is done.
 *
 * [flavor] is the persona's template, stored as the model's system message.
 * [instruction] is what makes the backend hand that template to OpenAI to be
 * filled in from the crawled site — without it the placeholders stay literal.
 */
export function createBot(args: {
  url: string;
  model: string;
  flavor: string;
  instruction: string;
  max: number;
  autoDestruct: boolean;
  channel: string;
}) {
  return http.post<any>('/magic/system/openai/create-bot', {
    url: args.url,
    model: args.model,
    flavor: args.flavor,
    instruction: args.instruction,
    max: args.max,
    auto_destruct: args.autoDestruct,
    vectorize: true,
    autocrawl: false,
    'feedback-channel': args.channel,
  });
}

export function openaiSystemMessages() {
  return http.get<any[]>('/magic/system/openai/system-messages');
}

/*
 * Kicks off dynamic system-message generation: the backend crawls `url`,
 * uses `instruction` to fill the `[[...]]` placeholders in `template`, and
 * streams the result back on the socket `channel`.
 */
export function createSystemMessage(
  instruction: string, template: string, url: string, channel: string) {
  return http.post<MagicResponse>('/magic/system/openai/create-system-message', {
    instruction,
    template,
    url,
    channel,
  });
}

export function openaiCompletionSlots() {
  return http.get<{ slots: string[] }>('/magic/system/openai/completion-slots');
}

/*
 * Plugins / Bazar. Available plugins come from the external bazar; installed
 * manifests and the install action go through the local backend.
 */
const BAZAR_URL = 'https://ainiro.io';

export function availablePlugins() {
  return request<any[]>('GET', BAZAR_URL + '/magic/modules/bazar/bazar-apps', undefined, {
    noBase: true,
  });
}

export function installedPlugins() {
  return http.get<any[]>('/magic/system/bazar/app-manifests');
}

export function installPlugin(app: { name: string; type: string }) {
  return http.post<MagicResponse>('/magic/system/bazar/install-plugin', {
    url: BAZAR_URL + '/magic/modules/bazar/download-bazar-app?name=' + encodeURIComponent(app.name),
    name: app.name,
    type: app.type,
  });
}

export function availableWorkflows() {
  return http.get<{ name: string; description: string; file: string }[]>(
    '/magic/system/openai/available-workflows?private=false');
}

interface HyperlambdaArguments {
  function?: boolean;
  description?: string;
  args?: { name: string; type: string; description?: string }[];
}

// CRUD-generated filter suffixes, described once as a group rather than per argument.
const FILTER_SUFFIXES = ['eq', 'neq', 'like', 'mt', 'lt', 'mteq', 'lteq'];

const FILTER_LEGEND = `
If any of the other arguments ends with:

* lt it implies 'less than'
* mt it implies 'more than'
* lteq it implies 'less than or equal to'
* mteq it implies 'more than or equal to'
* eq it implies 'equals to'
* neq it implies 'not equal to'
* like it implies a LIKE SQL type of query, with % being wildcard character
`;

/*
 * Builds the AI-function declaration for a Hyperlambda file. The endpoint
 * returns the file's arguments and description — the declaration itself is
 * assembled here, exactly as the old dashboard assembled it.
 */
export async function getFunctionDeclaration(path: string) {
  const result = await http.post<HyperlambdaArguments>(
    '/magic/system/workflows/get-hyperlambda-arguments', { path });

  // Files without an [.arguments] collection can't be invoked as functions.
  if (result.function !== true) {
    return '';
  }

  let declaration = (result.description ?? '') + '\n\n___\n';
  declaration += 'FUNCTION_INVOCATION[' + path + ']';
  const args = result.args ?? [];
  if (args.length === 0) {
    return (declaration + '\n___').trim();
  }

  const example: Record<string, string> = {};
  for (const argument of args) {
    example[argument.name] = '[' + argument.type.toUpperCase() + '_VALUE]';
  }
  declaration += ':\n' + JSON.stringify(example, null, 2) +
    '\n___\n\n### Description of arguments:\n\n';

  let hasFilters = false;
  for (const argument of args) {
    const parts = argument.name.split('.');
    if (FILTER_SUFFIXES.includes(parts[parts.length - 1])) {
      hasFilters = true;
      // Only the bare column name is described, not each filter variant.
      if (parts.length > 1) {
        continue;
      }
    }
    declaration += '* ' + argument.name +
      (argument.description ? ' - ' + argument.description : '') + '\n';
  }
  if (hasFilters) {
    declaration += FILTER_LEGEND;
  }
  return declaration.trim();
}

/*
 * Log.
 */

export interface LogItem {
  id: number;
  created: string;
  type: string;
  content: string;
  exception?: string;
}

export function listLog(from: number | null, max: number, query?: string) {
  let url = '/magic/system/log/list?max=' + max;
  if (from) {
    url += '&from=' + from;
  }
  if (query) {
    url += '&query=' + encodeURIComponent(query.includes('%') ? query : query + '%');
  }
  return http.get<LogItem[]>(url);
}

export function countLog(query?: string) {
  let url = '/magic/system/log/count';
  if (query) {
    url += '?query=' + encodeURIComponent(query.includes('%') ? query : query + '%');
  }
  return http.get<{ count: number }>(url);
}

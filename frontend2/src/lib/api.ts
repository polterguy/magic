/*
 * HTTP layer towards the currently connected Magic backend, plus one
 * function per backend endpoint the dashboard consumes — mirroring the
 * Angular service layer.
 */

let baseUrl = '';
let bearerToken: string | null = null;

export function configureApi(url: string, token: string | null) {
  baseUrl = url;
  bearerToken = token;
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
 * Executes Hyperlambda decorated with the given arguments — this is how
 * endpoint files are executed, since plain evaluate refuses them.
 */
export function evaluateWithArgs(hyperlambda: string, args: any) {
  return request<string>(
    'POST', '/magic/system/evaluator/evaluate-with-args', { hyperlambda, args }, { text: true });
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

export interface User {
  username: string;
  locked?: boolean;
  created?: string;
}

export interface Role {
  name: string;
  description?: string;
}

export function listUsers(filter: string, offset: number, limit: number) {
  let query = `?limit=${limit}&offset=${offset}&order=username`;
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

export function listRoles() {
  return http.get<Role[]>('/magic/system/magic/roles?limit=-1&order=name');
}

export function createRole(name: string, description: string) {
  return http.post<any>('/magic/system/magic/roles', { name, description });
}

export function deleteRole(name: string) {
  return http.delete<any>('/magic/system/magic/roles?name=' + encodeURIComponent(name));
}

export function getUserRoles(username: string) {
  return http.get<{ user: string; role: string }[]>(
    '/magic/system/magic/users_roles?user.eq=' + encodeURIComponent(username));
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

export function getTask(name: string) {
  return http.get<Task>('/magic/system/tasks/get?name=' + encodeURIComponent(name));
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

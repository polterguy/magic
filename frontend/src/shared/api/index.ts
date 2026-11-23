/*
 * HTTP layer towards the currently connected Magic backend, plus the backend
 * calls the app shell, the shared components or more than one feature make.
 *
 * A call only one feature makes lives in that feature's lib/api.ts and goes
 * through the http helper exported here, so it leaves with the feature.
 */

import { httpUrl, loadBackend, withoutTrailingSlashes } from '../auth/backend';

export let baseUrl = '';
let bearerToken: string | null = null;

export function configureApi(url: string, token: string | null) {
  // The one place a backend URL enters the API layer, and it ends up in hrefs.
  baseUrl = httpUrl(url);
  bearerToken = token;
}

// Lets anything caching backend answers notice that the backend changed.
export function apiBaseUrl() {
  return baseUrl;
}

export class ApiError extends Error {
  status: number;
  // Id of the log entry the backend wrote for this error, when its
  // exception handler returned one — the toast turns it into a deep link.
  logId?: number;
  constructor(status: number, message: string, logId?: number) {
    super(message);
    this.status = status;
    this.logId = logId;
  }
}

/*
 * Called when the backend rejects the bearer token — the session is dead,
 * and whoever owns the token (the auth context) should discard it once,
 * centrally, instead of every page raining its own 401 toasts.
 */
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

/*
 * Turns a non-2xx response into a thrown ApiError, using the backend's JSON
 * error message when there is one.
 */
async function throwApiError(response: Response): Promise<never> {
  let message = response.statusText;
  let logId: number | undefined;
  try {
    const payload = (await response.json()) as { message?: string; 'log-id'?: number };
    message = payload.message ?? message;
    logId = payload['log-id'];
  } catch {
    // Non-JSON error body, statusText is the best we have.
  }
  throw new ApiError(response.status, message, logId);
}

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
  opts?: { text?: boolean; noBase?: boolean },
): Promise<T> {
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
    if (response.status === 401 && headers['Authorization']) {
      unauthorizedHandler?.();
    }
    await throwApiError(response);
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
  get: <T>(url: string) => request<T>('GET', url),
  getText: (url: string) => request<string>('GET', url, undefined, { text: true }),
  post: <T>(url: string, body: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body: unknown) => request<T>('PUT', url, body),
  patch: <T>(url: string, body: unknown) => request<T>('PATCH', url, body),
  delete: <T>(url: string) => request<T>('DELETE', url),
};

export interface MagicResponse {
  result: string;
}

/*
 * The backend's appsettings, as /magic/system/config/load returns it. Only the parts the
 * dashboard reads are spelled out; the rest is passed through untouched.
 */
export interface MagicConfig {
  magic?: {
    smtp?: { host?: string; [key: string]: unknown };
    // Connection strings per database type, plus "default" naming the default type.
    // A type with no connection strings can be configured as null.
    databases?: Record<string, Record<string, string> | string | null | undefined>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// A database, its tables, their columns, foreign keys and indexes, as /magic/system/sql/databases returns them.
export interface ColumnMeta {
  name: string;
  db: string;
  nullable?: boolean;
  primary?: boolean;
  automatic?: boolean;
  // The Hyperlambda type crudify maps the column to.
  hl?: string;
}

export interface ForeignKeyMeta {
  column: string;
  foreign_table: string;
  foreign_column: string;
  [key: string]: unknown;
}

export interface TableMeta {
  name: string;
  columns?: ColumnMeta[] | null;
  foreign_keys?: ForeignKeyMeta[] | null;
  indexes?: Record<string, unknown>[] | null;
}

export interface DatabaseMeta {
  name: string;
  tables?: TableMeta[] | null;
}

/*
 * Authentication.
 */

export function authenticate(url: string, username: string, password: string) {
  const query =
    '?username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password);
  return request<{ ticket: string }>(
    'GET',
    url + '/magic/system/auth/authenticate' + query,
    undefined,
    { noBase: true },
  );
}

export function refreshTicket() {
  return http.get<{ ticket: string }>('/magic/system/auth/refresh-ticket');
}

export function changePassword(password: string) {
  return http.put<MagicResponse>('/magic/system/auth/change-password', { password });
}

// Minimum password length, enforced everywhere a password can be set.
export const MIN_PASSWORD = 12;

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
  return http.get<Record<string, unknown>>('/magic/system/diagnostics/system-information');
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
    '/magic/system/file-system/list-folders?folder=' + encodeURIComponent(folder),
  );
}

export function listFilesRecursively(folder: string, sysFiles: boolean) {
  return http.get<string[]>(
    '/magic/system/file-system/list-files-recursively?folder=' +
      encodeURIComponent(folder) +
      '&sys=' +
      sysFiles,
  );
}

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
  return http.put<MagicResponse>('/magic/system/file-system/install-module', formData);
}

export function loadFile(filename: string) {
  return http.getText('/magic/system/file-system/file?file=' + encodeURIComponent(filename));
}

export function saveFile(filename: string, content: string) {
  const folder = filename.slice(0, filename.lastIndexOf('/') + 1);
  const formData = new FormData();
  const blob = new Blob([content], { type: 'text/plain' });
  formData.append('file', blob, filename.slice(filename.lastIndexOf('/') + 1));
  return http.put<MagicResponse>(
    '/magic/system/file-system/file?folder=' + encodeURIComponent(folder),
    formData,
  );
}

export function deleteFile(file: string) {
  return http.delete<MagicResponse>(
    '/magic/system/file-system/file?file=' + encodeURIComponent(file),
  );
}

export function createFolder(folder: string) {
  return http.put<MagicResponse>('/magic/system/file-system/folder', { folder });
}

export function deleteFolder(folder: string) {
  return http.delete<MagicResponse>(
    '/magic/system/file-system/folder?folder=' + encodeURIComponent(folder),
  );
}

export function uploadFile(folder: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return http.put<MagicResponse>(
    '/magic/system/file-system/file?folder=' + encodeURIComponent(folder),
    formData,
  );
}

export function downloadFileRaw(file: string) {
  return requestRaw('GET', '/magic/system/file-system/file?file=' + encodeURIComponent(file));
}

export function getOpenApiSpec(filter: string) {
  return http.get<unknown>(
    '/magic/system/endpoints/openapi?system=true&filter=' + encodeURIComponent(filter),
  );
}

/*
 * One foreign key an argument or a returned column carries, when the
 * endpoint's generator recorded one for it.
 */
export interface EndpointLookup {
  table?: string;
  key?: string;
  name?: string;
  long?: boolean;
}

export interface EndpointField {
  name: string;
  type: string;
  description?: string;
  lookup?: EndpointLookup[];
}

/*
 * One endpoint, as returned by the root-only, rich sibling of
 * /system/auth/endpoints — that one is public and gives only {path, verb,
 * auth}; this one adds [type] (crudify's own `.type`, e.g. "crud-read"),
 * [input]/[output] with names, types and FK lookups, and [array].
 */
export interface EndpointMeta {
  path: string;
  verb: string;
  type?: string;
  auth?: string[];
  description?: string;
  input?: EndpointField[];
  output?: EndpointField[];
  array?: boolean;
  produces?: string;
  consumes?: string;
}

// Root-only. The Web Designer's own session always is, so this is never gated here.
export function listEndpointsDetailed() {
  return http.get<EndpointMeta[]>('/magic/system/endpoints/list');
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
    'POST',
    '/magic/system/evaluator/evaluate',
    { hyperlambda },
    { text: true },
  );
}

/*
 * Returns the [.arguments] collection of the given Hyperlambda as
 * {name: {type, mandatory?}}, or null if the code takes no arguments.
 */
export function getHyperlambdaArguments(hyperlambda: string) {
  return http.post<Record<string, { type: string; mandatory?: boolean }> | null>(
    '/magic/system/evaluator/get-arguments',
    { hyperlambda },
  );
}

/*
 * Issues a request and returns the raw response so callers can dispatch on
 * Content-Type and Content-Disposition (JSON, HTML, files, anything).
 * Throws on non-2xx unless allowErrors is set — invokers want to SHOW
 * error responses rather than throw.
 */
export async function requestRaw(
  method: string,
  url: string,
  body?: string | FormData,
  contentType?: string,
  allowErrors = false,
  token?: string,
) {
  const headers: Record<string, string> = {};
  if (token ?? bearerToken) {
    headers['Authorization'] = 'Bearer ' + (token ?? bearerToken);
  }
  // FormData bodies set their own multipart content-type with boundary.
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = contentType ?? 'application/json';
  }
  const started = performance.now();
  const response = await fetch(baseUrl + url, { method, headers, body });
  if (!response.ok && !allowErrors) {
    if (response.status === 401 && headers['Authorization']) {
      unauthorizedHandler?.();
    }
    await throwApiError(response);
  }
  // Every response header, so the invoker can show what the server sent.
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, name) => {
    responseHeaders[name] = value;
  });
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
/*
 * One entry per slot the debugger recorded, [lambda] being the entire lambda
 * object as it looked immediately after that slot was invoked.
 */
export interface DebugStep {
  slot: string;
  path: string;
  elapsed: number;
  lambda: string;
}

export interface DebugRecording {
  steps: DebugStep[] | null;
  returned?: unknown;
  error?: { message: string; type: string };
}

/*
 * Executes Hyperlambda through [system.debug], which records every slot it
 * invokes. Wrapping happens server side, since indenting the source into a
 * [system.debug] block here would corrupt multi-line strings.
 */
export function debugHyperlambda(hyperlambda: string, args: unknown) {
  return http.post<DebugRecording>('/magic/system/evaluator/debug', { hyperlambda, args });
}

/*
 * Invokes an endpoint with its actual HTTP verb. url includes any query
 * parameters; payload is the raw request body for POST/PUT/PATCH.
 * Error responses are returned, not thrown, so the invoker can display them.
 */
export function invokeEndpoint(
  verb: string,
  url: string,
  payload?: string | FormData,
  contentType?: string,
  token?: string,
) {
  return requestRaw(verb.toUpperCase(), '/' + url, payload, contentType, true, token);
}

/*
 * Mints a short lived JWT for the given role, so root can invoke an endpoint as a caller
 * holding only that role. Root-only. The username need not exist.
 */
export async function generateRoleToken(role: string) {
  const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const response = await http.get<{ ticket: string }>(
    '/magic/system/auth/generate-token?username=' +
      encodeURIComponent('impersonated-' + role) +
      '&role=' +
      encodeURIComponent(role) +
      '&expires=' +
      encodeURIComponent(expires),
  );
  return response.ticket;
}

/*
 * SQL.
 */

export function defaultDatabaseType() {
  return http.get<{ default: string; options: string[] }>(
    '/magic/system/sql/default-database-type',
  );
}

export function listDatabases(databaseType: string, connectionString: string) {
  return http.get<{ databases: DatabaseMeta[] | null }>(
    '/magic/system/sql/databases?databaseType=' +
      encodeURIComponent(databaseType) +
      '&connectionString=' +
      encodeURIComponent(connectionString),
  );
}

/*
 * Direct download URL carrying the JWT as query parameter — the pattern the
 * old dashboard uses for SQLite backup downloads.
 */
export function fileWithTokenUrl(file: string) {
  return (
    baseUrl +
    '/magic/system/file-system/file-with-token?file=' +
    encodeURIComponent(file) +
    '&access_token=' +
    encodeURIComponent(bearerToken ?? '')
  );
}

export function loadConfig() {
  return http.get<MagicConfig>('/magic/system/config/load');
}

export function saveConfig(config: MagicConfig) {
  return http.post<MagicResponse>('/magic/system/config/save', config);
}

export function crudify(payload: Record<string, unknown>) {
  return http.post<{ loc: number; result: string }>('/magic/system/crudifier/crudify', payload);
}

export function exportDdl(
  databaseType: string,
  connectionString: string,
  databaseName: string,
  tables: string[],
  full: boolean,
) {
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
  /*
   * The schema is cached under this EXACT key (no suffix) — see
   * system/sql/databases.get.hl. A trailing ".*" wildcard silently matches
   * nothing, since the wildcard filter keeps the trailing dot.
   */
  return http.delete<MagicResponse>(
    '/magic/system/cache/delete?id=' +
      encodeURIComponent('magic.sql.databases.' + databaseType + '.' + connectionString),
  );
}

export function bustSchemaCache(databaseType: string, connectionString: string) {
  return flushSchemaCache(databaseType, connectionString).catch(() => {});
}

export async function addLinkTable(
  databaseType: string,
  connectionString: string,
  databaseName: string,
  args: Record<string, unknown>,
) {
  const result = await http.post<MagicResponse>('/magic/system/sql/ddl/link-table', {
    databaseType,
    connectionString,
    databaseName,
    args,
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

export function listUsers(
  filter: string,
  offset: number,
  limit: number,
  sort?: { column: string | null; direction: 'asc' | 'desc' },
) {
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

export function listRoles() {
  return http.get<Role[]>('/magic/system/magic/roles?limit=-1&order=name');
}

/*
 * Extra fields associated with a user — name, email, or anything else the
 * application wants to store per user.
 */
export function addUserExtra(user: string, type: string, value: string) {
  return http.post<MagicResponse>('/magic/system/magic/users_extra', { user, type, value });
}

export function updateUserExtra(user: string, type: string, value: string) {
  return http.put<MagicResponse>('/magic/system/magic/users_extra', { user, type, value });
}

export function deleteUserExtra(user: string, type: string) {
  return http.delete<MagicResponse>(
    '/magic/system/magic/users_extra?user=' +
      encodeURIComponent(user) +
      '&type=' +
      encodeURIComponent(type),
  );
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

export function executeTask(id: string) {
  return http.post<MagicResponse>('/magic/system/tasks/execute', { id });
}

/*
 * Machine learning.
 */

export function backendInfo() {
  return { url: baseUrl, token: bearerToken };
}

/*
 * One machine learning type (a "model"), a row of ml_types. The table has grown columns
 * over time, so the ones the dashboard does not use itself are carried along untyped.
 */
export interface MlType {
  type: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  auth?: string | null;
  supervised?: number;
  cached?: number;
  use_embeddings?: number;
  threshold?: number;
  vector_model?: string;
  max_context_tokens?: number | null;
  max_request_tokens?: number | null;
  greeting?: string | null;
  system_message?: string | null;
  initial_questionnaire?: string | null;
  completion_slot?: string;
  retrieval?: string;
  system_message_token_count?: number;
  [key: string]: unknown;
}

// A training snippet, a row of ml_training_snippets.
export interface MlSnippet {
  id: number;
  created?: string;
  type: string;
  prompt: string;
  completion: string;
  uri?: string | null;
  filename?: string | null;
  meta?: string | null;
  cached?: number | null;
  pushed?: number;
  embedding_vss?: unknown;
  // Only on vector search results: how far the snippet is from the search text.
  distance?: number;
}

/*
 * A system message template ("flavor") a model can start from. Files under
 * system-messages/ carry whatever fields they want, so the rest is untyped.
 */
export interface SystemMessage {
  name: string;
  description?: string;
  instruction?: string;
  prefix?: string;
  max_context_tokens?: number;
  max_request_tokens?: number;
  [key: string]: unknown;
}

// A plugin, either one available from the Bazar or one installed manifest.
export interface BazarApp {
  name: string;
  type: string;
  description?: string;
  module_name?: string;
  [key: string]: unknown;
}

export function mlTypes() {
  return http.get<MlType[]>('/magic/system/magic/ml_types?limit=-1&order=type');
}

export function mlTypeUpdate(type: MlType) {
  return http.put<MagicResponse>('/magic/system/magic/ml_types', type);
}

export function mlSnippetCreate(snippet: Omit<Partial<MlSnippet>, 'id'>) {
  return http.post<MagicResponse>('/magic/system/magic/ml_training_snippets', snippet);
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
  // Present on authorization-code + PKCE providers.
  state?: string;
  code_challenge?: string;
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
      withoutTrailingSlashes(backendUrl) + '/magic/system/auth/can-reset-password',
    );
    if (!response.ok) {
      return false;
    }
    return ((await response.json()) as { result?: unknown }).result === true;
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
    withoutTrailingSlashes(backendUrl) + '/magic/system/auth/send-reset-password-link',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    },
  );
  if (!response.ok) {
    throw new ApiError(response.status, response.statusText);
  }
  return (await response.json()) as { result: string };
}

/*
 * Whether the configured token is accepted by the backend. Used after a
 * magic link hands us a token, to find out whether it is any good before
 * showing the dashboard.
 */
export async function verifyTicket() {
  const response = await http.get<{ result: string }>('/magic/system/auth/verify-ticket');
  return response.result === 'success';
}

export async function openidProviders(backendUrl: string) {
  const response = await fetch(
    withoutTrailingSlashes(backendUrl) + '/magic/system/auth/openid-providers?createNonce=true',
  );
  if (!response.ok) {
    return [];
  }
  const text = await response.text();
  return text === '' ? [] : (JSON.parse(text) as OidcProvider[]);
}

// Exchanges a provider's id_token for a Magic JWT.
export async function openidLogin(backendUrl: string, token: string) {
  const response = await fetch(
    withoutTrailingSlashes(backendUrl) +
      '/magic/system/auth/openid-login?token=' +
      encodeURIComponent(token),
  );
  if (!response.ok) {
    await throwApiError(response);
  }
  return (await response.json()) as { ticket: string };
}

/*
 * Exchanges an authorization code for a Magic JWT — the code-flow sibling of
 * openidLogin. The backend does the actual exchange with the provider, so the
 * PKCE verifier and any client secret never reach the browser.
 */
export async function openidExchange(
  backendUrl: string,
  code: string,
  state: string,
  redirectUri: string,
) {
  const response = await fetch(
    withoutTrailingSlashes(backendUrl) + '/magic/system/auth/openid-exchange',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state, redirect_uri: redirectUri }),
    },
  );
  if (!response.ok) {
    await throwApiError(response);
  }
  return (await response.json()) as { ticket: string };
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
  return http.post<MagicResponse>('/magic/system/openai/key', { key });
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
  session?: string,
  oldCode?: string,
): Promise<{ result: string }> {
  const payload = new FormData();
  payload.append('prompt', prompt);
  if (fileType === 'hl') {
    /*
     * The generator takes no system message — it loads its own, which carries
     * everything the model knows about Hyperlambda. Code being changed travels
     * as [data], which the generator turns into [old_code]: it hands that to
     * the model as its own message, and keeps the file's existing comment
     * rather than replacing it with an instruction describing the change.
     */
    if (oldCode) {
      payload.append('data', oldCode);
    }
    const response = await fetch(GENERATOR_URL + '/magic/modules/hyperlambda-generator/chat', {
      method: 'POST',
      body: payload,
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    const generated = (await response.json()) as { result?: string };
    return { ...generated, result: unfence(generated.result ?? '', fileType) };
  }
  /*
   * Only the OpenAI proxy takes a system message — it has no instruction of its
   * own, so SQL Studio and the Endpoint Generator put the schema here.
   */
  if (contextOverride) {
    payload.append('system_message_override', contextOverride);
  }
  payload.append('type', fileType);
  payload.append('user_id', loadBackend()?.username ?? '');
  payload.append('references', 'false');
  payload.append('stream', 'false');
  if (session) {
    payload.append('session', session);
  }
  const answer = await http.post<{ result: string }>('/magic/system/openai/chat', payload);
  return { ...answer, result: unfence(answer.result ?? '', fileType) };
}

/*
 * Builds the system message for the AI prompt bar.
 *
 * Hyperlambda gets none. It goes to the generator module, which loads its own
 * system instruction — the one carrying everything the model knows about
 * Hyperlambda — and overriding that with a generic "return only code" line, or
 * with the file being edited, throws that training away. Existing code reaches
 * the generator as [data] instead; see aiQuery.
 *
 * Every other file type goes through the backend's OpenAI proxy, which has no
 * instruction of its own and no channel for existing code, so there the system
 * message stays the only place to put either.
 */
/*
 * The rule that has to be in EVERY system message for a code answer.
 *
 * Nothing else states it. The backend proxy supplies no system message of its
 * own — whatever is sent here IS the whole instruction — and left to itself a
 * model formats a code answer the way it formats a code answer: wrapped in a
 * ```html fence with a sentence of explanation around it. That is then written
 * into the file verbatim.
 */
const CODE_ONLY =
  'You are a software developer AI assistant and you will return ONLY CODE! No ``` ' +
  'characters, no markdown code fences, no explanations and no commentary before or ' +
  'after — ONLY the raw code.';

/*
 * The system message for generating or changing a file.
 *
 * The rule above used to be attached only when the file was EMPTY, so every
 * edit of existing code — which is almost every edit — went out with nothing
 * but "change this", and came back fenced and explained. Both branches carry
 * it now.
 */
export function aiContextForFile(path: string, content: string): string | undefined {
  if (path.endsWith('.hl')) {
    return undefined;
  }
  if (content.length > 0) {
    return (
      CODE_ONLY +
      '\n\nChange or modify this code according to instructions in the next message:\n\n' +
      content
    );
  }
  return (
    CODE_ONLY +
    ' In the next message you will be given a natural language query ' +
    'being a request from the user. Return only the RAW code that solves the user\u2019s problem.'
  );
}

/*
 * The code out of an answer that arrived wrapped in markdown anyway.
 *
 * A belt to the instruction's braces: the instruction is what should keep
 * fences out, and this is what stops one reaching a file when it does not.
 * Prose on either side of the fence goes with it, since a model that explains
 * itself puts the explanation outside the block.
 *
 * Markdown is exempt, for the obvious reason that a fence in a markdown file
 * is content rather than packaging.
 */
export function unfence(answer: string, fileType: string): string {
  if (fileType === 'md' || fileType === 'markdown') {
    return answer;
  }
  const open = answer.indexOf('```');
  const close = open < 0 ? -1 : answer.indexOf('```', open + 3);
  if (close < 0) {
    return answer;
  }
  // Past the fence comes an optional language tag, spaces and one line break.
  const body = answer.slice(open + 3, close).replace(/^[a-zA-Z0-9+#.-]*[ \t]*\r?\n?/, '');
  return body.trimEnd();
}

export interface OpenAiModel {
  id: string;
  chat?: boolean;
  vector?: boolean;
  tokens?: number;
  // USD per 1,000,000 tokens, when the backend knows the model's price.
  input_price?: number;
  output_price?: number;
}

export function openaiModels() {
  return http.get<OpenAiModel[]>('/magic/system/openai/models');
}

/*
 * A compact "  ·  $2.50 in / $15 out per 1M" suffix for a model dropdown
 * option — empty when the backend doesn't publish a price for that model.
 */
export function modelPriceLabel(model?: { input_price?: number; output_price?: number }): string {
  if (model?.input_price == null || model.output_price == null) {
    return '';
  }
  const usd = (n: number) => '$' + Number(n).toFixed(2);
  return `  ·  ${usd(model.input_price)} in / ${usd(model.output_price)} out per 1M`;
}

export function gibberish() {
  return http.get<{ result: string }>('/magic/system/misc/gibberish?min=20&max=30');
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
  return http.post<{ result: string }>('/magic/system/openai/chat', payload);
}

export function openaiSystemMessages() {
  return http.get<SystemMessage[]>('/magic/system/openai/system-messages');
}

/*
 * Plugins / Bazar. Available plugins come from the external bazar; installed
 * manifests and the install action go through the local backend.
 */
const BAZAR_URL = 'https://ainiro.io';

export function availablePlugins() {
  return request<BazarApp[]>('GET', BAZAR_URL + '/magic/modules/bazar/bazar-apps', undefined, {
    noBase: true,
  });
}

export function installPlugin(app: { name: string; type: string }) {
  return http.post<MagicResponse>('/magic/system/bazar/install-plugin', {
    url: BAZAR_URL + '/magic/modules/bazar/download-bazar-app?name=' + encodeURIComponent(app.name),
    name: app.name,
    type: app.type,
  });
}

export function countLog(query?: string) {
  let url = '/magic/system/log/count';
  if (query) {
    url += '?query=' + encodeURIComponent(query.includes('%') ? query : query + '%');
  }
  return http.get<{ count: number }>(url);
}

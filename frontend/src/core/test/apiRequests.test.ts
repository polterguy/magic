// @vitest-environment jsdom
/*
 * Unit tests for the API layer: what each endpoint function sends (verb, URL and body), and how
 * the request helper treats the answer. fetch is replaced, so nothing here needs a backend.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api';

const BASE = 'https://backend.test';
const FILE = Symbol('file');

interface Sent {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

let sent: Sent[] = [];

// The body as the tests compare it: parsed JSON, the word form for an upload, otherwise nothing.
function sentBody(body: unknown) {
  if (body instanceof FormData) {
    return 'form';
  }
  return typeof body === 'string' ? (JSON.parse(body) as unknown) : undefined;
}

// Answers every request with the given response, and keeps what was sent.
function mockFetch(respond: () => Response) {
  sent = [];
  vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
    const body = init.body;
    sent.push({
      url,
      method: init.method ?? 'GET',
      headers: (init.headers ?? {}) as Record<string, string>,
      body: sentBody(body),
    });
    return Promise.resolve(respond());
  });
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  mockFetch(() => json({}));
  api.configureApi(BASE, null);
  api.setUnauthorizedHandler(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/*
 * One row per endpoint function: its name, the arguments it is called with (a space in every
 * string shows that it is URL-encoded), and the verb, URL and JSON body it sends.
 */
type Row = [string, unknown[], string, string, unknown];
const ENDPOINTS: Row[] = [
  ['refreshTicket', [], 'GET', '/magic/system/auth/refresh-ticket', undefined],
  ['changePassword', ['a b'], 'PUT', '/magic/system/auth/change-password', { password: 'a b' }],
  ['getStatus', [], 'GET', '/magic/system/config/status', undefined],
  ['getVersion', [], 'GET', '/magic/system/version', undefined],
  ['getSystemInformation', [], 'GET', '/magic/system/diagnostics/system-information', undefined],
  [
    'listFiles',
    ['a b', 'a b'],
    'GET',
    '/magic/system/file-system/list-files?folder=a%20b&filter=a%20b',
    undefined,
  ],
  ['listFolders', ['a b'], 'GET', '/magic/system/file-system/list-folders?folder=a%20b', undefined],
  [
    'listFoldersRecursively',
    ['a b', true],
    'GET',
    '/magic/system/file-system/list-folders-recursively?folder=a%20b&sys=true',
    undefined,
  ],
  [
    'listFilesRecursively',
    ['a b', true],
    'GET',
    '/magic/system/file-system/list-files-recursively?folder=a%20b&sys=true',
    undefined,
  ],
  ['installModule', [FILE], 'PUT', '/magic/system/file-system/install-module', 'form'],
  ['loadFile', ['a b'], 'GET', '/magic/system/file-system/file?file=a%20b', undefined],
  ['saveFile', ['a b', 'a b'], 'PUT', '/magic/system/file-system/file?folder=', 'form'],
  ['deleteFile', ['a b'], 'DELETE', '/magic/system/file-system/file?file=a%20b', undefined],
  [
    'renamePath',
    ['a b', 'a b'],
    'POST',
    '/magic/system/file-system/rename',
    { oldName: 'a b', newName: 'a b' },
  ],
  ['createFolder', ['a b'], 'PUT', '/magic/system/file-system/folder', { folder: 'a b' }],
  ['deleteFolder', ['a b'], 'DELETE', '/magic/system/file-system/folder?folder=a%20b', undefined],
  ['uploadFile', ['a b', FILE], 'PUT', '/magic/system/file-system/file?folder=a%20b', 'form'],
  ['downloadFileRaw', ['a b'], 'GET', '/magic/system/file-system/file?file=a%20b', undefined],
  [
    'downloadFolderRaw',
    ['a b'],
    'GET',
    '/magic/system/file-system/download-folder?folder=a%20b',
    undefined,
  ],
  [
    'getOpenApiSpec',
    ['a b'],
    'GET',
    '/magic/system/endpoints/openapi?system=true&filter=a%20b',
    undefined,
  ],
  ['listEndpointsDetailed', [], 'GET', '/magic/system/endpoints/list', undefined],
  ['loadWebsiteConfig', [], 'GET', '/magic/system/www/config', undefined],
  ['ensureWidgetAssets', [], 'POST', '/magic/system/www/ensure-widget-assets', {}],
  ['evaluate', ['a b'], 'POST', '/magic/system/evaluator/evaluate', { hyperlambda: 'a b' }],
  [
    'getHyperlambdaArguments',
    ['a b'],
    'POST',
    '/magic/system/evaluator/get-arguments',
    { hyperlambda: 'a b' },
  ],
  ['listDynamicSlots', [], 'GET', '/magic/system/evaluator/slots', undefined],
  ['defaultDatabaseType', [], 'GET', '/magic/system/sql/default-database-type', undefined],
  [
    'listDatabases',
    ['a b', 'a b'],
    'GET',
    '/magic/system/sql/databases?databaseType=a%20b&connectionString=a%20b',
    undefined,
  ],
  [
    'executeSql',
    ['a b', 'a b', 'a b', true, true],
    'POST',
    '/magic/system/sql/evaluate',
    { databaseType: 'a b', database: 'a b', sql: 'a b', safeMode: true, batch: true },
  ],
  [
    'createDatabase',
    ['a b', 'a b', 'a b'],
    'POST',
    '/magic/system/sql/ddl/database',
    { databaseType: 'a b', connectionString: 'a b', databaseName: 'a b' },
  ],
  [
    'dropDatabase',
    ['a b', 'a b', 'a b'],
    'DELETE',
    '/magic/system/sql/ddl/database?databaseType=a%20b&connectionString=a%20b&databaseName=a%20b',
    undefined,
  ],
  ['uploadDatabaseBackup', [FILE], 'PUT', '/magic/system/sql/backup', 'form'],
  ['loadConfig', [], 'GET', '/magic/system/config/load', undefined],
  [
    'testConnectionString',
    ['a b', 'a b'],
    'POST',
    '/magic/system/sql/test-connection-string',
    { databaseType: 'a b', connectionString: 'a b' },
  ],
  [
    'addConnectionString',
    ['a b', 'a b', 'a b', true],
    'POST',
    '/magic/system/sql/connection-string',
    { databaseType: 'a b', name: 'a b', connectionString: 'a b', useAsDefault: true },
  ],
  [
    'deleteConnectionString',
    ['a b', 'a b'],
    'DELETE',
    '/magic/system/sql/connection-string?databaseType=a%20b&name=a%20b',
    undefined,
  ],
  ['parseOpenApi', ['a b'], 'POST', '/magic/system/openapi/parse', { url: 'a b' }],
  [
    'flushSchemaCache',
    ['a b', 'a b'],
    'DELETE',
    '/magic/system/cache/delete?id=magic.sql.databases.a%20b.a%20b',
    undefined,
  ],
  [
    'importCsvFile',
    ['a b', 'a b', 'a b', FILE],
    'POST',
    '/magic/system/sql/import-csv-file',
    'form',
  ],
  ['listEndpoints', [], 'GET', '/magic/system/endpoints/list', undefined],
  ['countEndpoints', [], 'GET', '/magic/system/endpoints/count', undefined],
  ['countPublicEndpoints', [], 'GET', '/magic/system/endpoints/count-public', undefined],
  [
    'countUsers',
    ['a b'],
    'GET',
    '/magic/system/magic/users-count?username.like=a%20b%25',
    undefined,
  ],
  [
    'createUser',
    ['a b', 'a b'],
    'POST',
    '/magic/system/magic/users',
    { username: 'a b', password: 'a b' },
  ],
  ['deleteUser', ['a b'], 'DELETE', '/magic/system/magic/users?username=a%20b', undefined],
  [
    'changeUserPassword',
    ['a b', 'a b'],
    'PUT',
    '/magic/system/magic/users',
    { username: 'a b', password: 'a b' },
  ],
  ['listRoles', [], 'GET', '/magic/system/magic/roles?limit=-1&order=name', undefined],
  [
    'createRole',
    ['a b', 'a b'],
    'POST',
    '/magic/system/magic/roles',
    { name: 'a b', description: 'a b' },
  ],
  [
    'updateRole',
    ['a b', 'a b'],
    'PUT',
    '/magic/system/magic/roles',
    { name: 'a b', description: 'a b' },
  ],
  ['deleteRole', ['a b'], 'DELETE', '/magic/system/magic/roles?name=a%20b', undefined],
  [
    'addUserExtra',
    ['a b', 'a b', 'a b'],
    'POST',
    '/magic/system/magic/users_extra',
    { user: 'a b', type: 'a b', value: 'a b' },
  ],
  [
    'updateUserExtra',
    ['a b', 'a b', 'a b'],
    'PUT',
    '/magic/system/magic/users_extra',
    { user: 'a b', type: 'a b', value: 'a b' },
  ],
  [
    'deleteUserExtra',
    ['a b', 'a b'],
    'DELETE',
    '/magic/system/magic/users_extra?user=a%20b&type=a%20b',
    undefined,
  ],
  [
    'addUserToRole',
    ['a b', 'a b'],
    'POST',
    '/magic/system/magic/users_roles',
    { user: 'a b', role: 'a b' },
  ],
  [
    'removeUserFromRole',
    ['a b', 'a b'],
    'DELETE',
    '/magic/system/magic/users_roles?user=a%20b&role=a%20b',
    undefined,
  ],
  [
    'listTasks',
    [7, 7, 'a b'],
    'GET',
    '/magic/system/tasks/list?offset=7&limit=7&filter=%25a%20b%25',
    undefined,
  ],
  ['countTasks', ['a b'], 'GET', '/magic/system/tasks/count?filter=%25a%20b%25', undefined],
  ['getTask', ['a b'], 'GET', '/magic/system/tasks/get?name=a%20b', undefined],
  [
    'createTask',
    ['a b', 'a b', 'a b'],
    'POST',
    '/magic/system/tasks/create',
    { id: 'a b', description: 'a b', hyperlambda: 'a b' },
  ],
  [
    'updateTask',
    ['a b', 'a b', 'a b'],
    'POST',
    '/magic/system/tasks/update',
    { id: 'a b', description: 'a b', hyperlambda: 'a b' },
  ],
  ['deleteTask', ['a b'], 'DELETE', '/magic/system/tasks/delete?id=a%20b', undefined],
  ['executeTask', ['a b'], 'POST', '/magic/system/tasks/execute', { id: 'a b' }],
  [
    'scheduleTask',
    ['a b', 'a b', 'a b'],
    'POST',
    '/magic/system/tasks/due/add',
    { id: 'a b', repeats: 'a b' },
  ],
  ['deleteSchedule', [7], 'DELETE', '/magic/system/tasks/due/delete?id=7', undefined],
  ['mlTypes', [], 'GET', '/magic/system/magic/ml_types?limit=-1&order=type', undefined],
  ['mlTypeDelete', ['a b'], 'DELETE', '/magic/system/magic/ml_types?type=a%20b', undefined],
  [
    'listQuestionnaires',
    [],
    'GET',
    '/magic/system/magic/questionnaires?limit=-1&order=questionnaires.name',
    undefined,
  ],
  [
    'deleteQuestionnaire',
    ['a b'],
    'DELETE',
    '/magic/system/magic/questionnaires?name=a%20b',
    undefined,
  ],
  [
    'listQuestions',
    ['a b'],
    'GET',
    '/magic/system/magic/questions?limit=-1&order=questions.question_id&questions.questionnaire.eq=a%20b',
    undefined,
  ],
  ['deleteQuestion', [7], 'DELETE', '/magic/system/magic/questions?question_id=7', undefined],
  [
    'mlUnvectorisedCount',
    ['a b'],
    'GET',
    '/magic/system/magic/ml_training_snippets-count?not_embedded=true&ml_training_snippets.type.eq=a%20b',
    undefined,
  ],
  [
    'mlSnippetsDeleteAll',
    ['a b', 'a b'],
    'DELETE',
    '/magic/system/magic/ml_training_snippets_all?ml_training_snippets.type.eq=a%20b&ml_training_snippets.prompt.like=%25a%20b%25&ml_training_snippets.completion.like=%25a%20b%25&ml_training_snippets.uri.like=a%20b%25',
    undefined,
  ],
  [
    'mlSnippetsExportRaw',
    ['a b', 'a b'],
    'GET',
    '/magic/system/magic/ml_training_snippets_export?ml_training_snippets.type.eq=a%20b&ml_training_snippets.prompt.like=%25a%20b%25&ml_training_snippets.completion.like=%25a%20b%25&ml_training_snippets.uri.like=a%20b%25',
    undefined,
  ],
  ['mlSnippetDelete', [7], 'DELETE', '/magic/system/magic/ml_training_snippets?id=7', undefined],
  [
    'mlRequests',
    ['a b', 7, 7],
    'GET',
    '/magic/system/magic/ml_requests?limit=7&offset=7&order=created&direction=desc&ml_requests.type.eq=a%20b',
    undefined,
  ],
  [
    'mlRequestsCount',
    ['a b'],
    'GET',
    '/magic/system/magic/ml_requests-count?ml_requests.type.eq=a%20b',
    undefined,
  ],
  [
    'sendResetPasswordLink',
    ['a b', 'a b'],
    'POST',
    'a b/magic/system/auth/send-reset-password-link',
    { user: 'a b' },
  ],
  ['verifyTicket', [], 'GET', '/magic/system/auth/verify-ticket', undefined],
  [
    'openidExchange',
    ['a b', 'a b', 'a b', 'a b'],
    'POST',
    'a b/magic/system/auth/openid-exchange',
    { code: 'a b', state: 'a b', redirect_uri: 'a b' },
  ],
  ['openaiIsConfigured', [], 'GET', '/magic/system/openai/is-configured', undefined],
  ['openaiGetKey', [], 'GET', '/magic/system/openai/key', undefined],
  ['openaiSetKey', ['a b'], 'POST', '/magic/system/openai/key', { key: 'a b' }],
  ['aiQuery', ['a b', 'a b', 'a b', 'a b', 'a b'], 'POST', '/magic/system/openai/chat', 'form'],
  ['openaiModels', [], 'GET', '/magic/system/openai/models', undefined],
  ['gibberish', [], 'GET', '/magic/system/misc/gibberish?min=20&max=30', undefined],
  ['killExecution', ['a b'], 'POST', '/magic/system/misc/kill-execution', { execution_id: 'a b' }],
  ['vectoriseSnippet', [7], 'POST', '/magic/system/openai/vectorise-snippet', { id: 7 }],
  [
    'vectoriseType',
    ['a b', 'a b'],
    'POST',
    '/magic/system/openai/vectorise',
    { type: 'a b', 'feedback-channel': 'a b' },
  ],
  ['deleteVectors', ['a b'], 'DELETE', '/magic/system/openai/vectors?type=a%20b', undefined],
  ['openaiChat', ['a b', 'a b', 'a b', 'a b'], 'POST', '/magic/system/openai/chat', 'form'],
  [
    'uploadUrlList',
    ['a b', FILE, 'a b', true],
    'POST',
    '/magic/system/openai/upload-url-list',
    'form',
  ],
  [
    'availableWidgets',
    [],
    'GET',
    '/magic/system/openai/available-widgets?private=false',
    undefined,
  ],
  ['uploadCsvFile', ['a b', FILE], 'POST', '/magic/system/openai/upload-csv', 'form'],
  ['uploadImageFile', ['a b', FILE], 'POST', '/magic/system/openai/upload-image', 'form'],
  ['openaiThemes', [], 'GET', '/magic/system/openai/themes', undefined],
  ['openaiSystemMessages', [], 'GET', '/magic/system/openai/system-messages', undefined],
  [
    'createSystemMessage',
    ['a b', 'a b', 'a b', 'a b'],
    'POST',
    '/magic/system/openai/create-system-message',
    { instruction: 'a b', template: 'a b', url: 'a b', channel: 'a b' },
  ],
  ['openaiCompletionSlots', [], 'GET', '/magic/system/openai/completion-slots', undefined],
  ['availablePlugins', [], 'GET', 'https://ainiro.io/magic/modules/bazar/bazar-apps', undefined],
  ['installedPlugins', [], 'GET', '/magic/system/bazar/app-manifests', undefined],
  [
    'availableWorkflows',
    [],
    'GET',
    '/magic/system/openai/available-workflows?private=false',
    undefined,
  ],
  [
    'getFileDescription',
    ['a b'],
    'POST',
    '/magic/system/workflows/get-hyperlambda-arguments',
    { path: 'a b' },
  ],
  ['countLog', ['a b'], 'GET', '/magic/system/log/count?query=a%20b%25', undefined],
  ['gitStatus', ['a b'], 'GET', '/magic/system/git/status?path=a%20b', undefined],
  ['gitDiff', ['a b', 'a b'], 'GET', '/magic/system/git/diff?path=a%20b&file=a%20b', undefined],
  ['gitRestore', ['a b', 'a b'], 'POST', '/magic/system/git/restore', { path: 'a b', file: 'a b' }],
  ['gitBranches', ['a b'], 'GET', '/magic/system/git/branches?path=a%20b', undefined],
  [
    'gitCommit',
    ['a b', 'a b'],
    'POST',
    '/magic/system/git/commit',
    { path: 'a b', message: 'a b' },
  ],
  ['gitPush', ['a b', 'a b'], 'POST', '/magic/system/git/push', { path: 'a b', branch: 'a b' }],
  [
    'gitPull',
    ['a b', 'a b'],
    'POST',
    '/magic/system/git/pull',
    { path: 'a b', branch: 'a b', merge: true },
  ],
  ['gitFetch', ['a b'], 'POST', '/magic/system/git/fetch', { path: 'a b' }],
  ['gitMerge', ['a b', 'a b'], 'POST', '/magic/system/git/merge', { path: 'a b', branch: 'a b' }],
  ['gitMergeAbort', ['a b'], 'POST', '/magic/system/git/merge', { path: 'a b', abort: true }],
  ['gitLog', ['a b', 'a b'], 'GET', '/magic/system/git/log?path=a%20b&range=a%20b', undefined],
  ['gitInit', ['a b'], 'POST', '/magic/system/git/init', { path: 'a b' }],
  ['gitClone', ['a b', 'a b'], 'POST', '/magic/system/git/clone', { path: 'a b', url: 'a b' }],
  ['gitRemoteAdd', ['a b', 'a b'], 'POST', '/magic/system/git/remote', { path: 'a b', url: 'a b' }],
  [
    'gitGithubCreate',
    ['a b', true],
    'POST',
    '/magic/system/git/github-create',
    { name: 'a b', private: true },
  ],
];

describe('endpoint functions', () => {
  it.each(ENDPOINTS)('%s sends the expected request', async (name, args, method, url, body) => {
    const call = (api as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>)[name];
    await call(...args.map(a => (a === FILE ? new File(['x'], 'f.txt') : a)));
    expect(sent).toHaveLength(1);
    expect(sent[0].method).toBe(method);
    expect(sent[0].url).toBe(url.startsWith('/') ? BASE + url : url);
    if (body === 'form') {
      expect(sent[0].body).toBe('form');
    } else {
      expect(sent[0].body).toEqual(body);
    }
  });
});

describe('request handling', () => {
  it('sends the token as a bearer header, and no header without one', async () => {
    await api.getVersion();
    expect(sent[0].headers['Authorization']).toBeUndefined();
    api.configureApi(BASE, 'secret');
    await api.getVersion();
    expect(sent[1].headers['Authorization']).toBe('Bearer secret');
  });

  it('sends JSON bodies with a content type, and leaves form data alone', async () => {
    await api.changePassword('x');
    expect(sent[0].headers['Content-Type']).toBe('application/json');
    await api.uploadDatabaseBackup(new File(['x'], 'f.db'));
    expect(sent[1].headers['Content-Type']).toBeUndefined();
  });

  it('returns null for an empty answer, and for 204', async () => {
    mockFetch(
      () => new Response('', { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    expect(await api.getVersion()).toBeNull();
    mockFetch(() => new Response(null, { status: 204 }));
    expect(await api.getVersion()).toBeNull();
  });

  it('returns plain text for a non-JSON answer', async () => {
    mockFetch(
      () => new Response('v1.2.3', { status: 200, headers: { 'Content-Type': 'text/plain' } }),
    );
    expect(await api.getVersion()).toBe('v1.2.3');
  });

  it('throws an ApiError with the backend message and log id', async () => {
    mockFetch(() => json({ message: 'Nope', 'log-id': 42 }, 500));
    const error = await api.getVersion().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(api.ApiError);
    expect(error).toMatchObject({ status: 500, message: 'Nope', logId: 42 });
  });

  it('falls back to the status text when the error is not JSON', async () => {
    mockFetch(() => new Response('<html>', { status: 502, statusText: 'Bad Gateway' }));
    await expect(api.getVersion()).rejects.toMatchObject({ status: 502, message: 'Bad Gateway' });
  });

  it('tells the unauthorized handler once a token has been rejected', async () => {
    const handler = vi.fn();
    api.setUnauthorizedHandler(handler);
    mockFetch(() => json({ message: 'Denied' }, 401));
    await api.getVersion().catch(() => undefined);
    expect(handler).not.toHaveBeenCalled();
    api.configureApi(BASE, 'expired');
    await api.getVersion().catch(() => undefined);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('asks for a role token that expires in the future, for the impersonated user', async () => {
    await api.generateRoleToken('admin x');
    const url = new URL(sent[0].url);
    expect(url.pathname).toBe('/magic/system/auth/generate-token');
    expect(url.searchParams.get('role')).toBe('admin x');
    expect(Date.parse(url.searchParams.get('expires') ?? '')).toBeGreaterThan(Date.now());
  });

  it('signs in against the URL it is given, not the configured backend', async () => {
    await api.authenticate('https://other.test', 'a b', 'p&q');
    expect(sent[0].url).toBe(
      'https://other.test/magic/system/auth/authenticate?username=a%20b&password=p%26q',
    );
  });

  it('keeps only http(s) backend URLs', () => {
    api.configureApi('javascript:alert(1)', null);
    expect(api.apiBaseUrl()).toBe('');
    api.configureApi(BASE, null);
    expect(api.apiBaseUrl()).toBe(BASE);
  });

  it('builds the download link with the token in it', () => {
    api.configureApi(BASE, 'a b');
    expect(api.fileWithTokenUrl('/data/x y.db')).toBe(
      BASE + '/magic/system/file-system/file-with-token?file=%2Fdata%2Fx%20y.db&access_token=a%20b',
    );
  });
});

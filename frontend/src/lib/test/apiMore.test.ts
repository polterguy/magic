// @vitest-environment jsdom
/*
 * More API layer tests: the endpoint functions apiRequests.test.ts does not reach (DDL mutations,
 * machine learning, uploads, auth helpers that call fetch directly), asserting verb, URL and body.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api';

const BASE = 'https://backend.test';

interface Sent {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

let sent: Sent[] = [];
let respond: (url: string) => Response;

function sentBody(body: unknown) {
  if (body instanceof FormData) {
    return body;
  }
  return typeof body === 'string' ? (JSON.parse(body) as unknown) : undefined;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  sent = [];
  respond = () => json({ result: 'success' });
  vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
    sent.push({
      url,
      method: init?.method ?? 'GET',
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: sentBody(init?.body),
    });
    return Promise.resolve(respond(url));
  });
  api.configureApi(BASE, 'tok');
  api.setUnauthorizedHandler(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function last(): Sent {
  const item = sent.at(-1);
  if (!item) {
    throw new Error('nothing was sent');
  }
  return item;
}

describe('http helpers', () => {
  it('patch sends a JSON body with the bearer token', async () => {
    await api.http.patch('/x', { a: 1 });
    expect(last()).toMatchObject({
      url: BASE + '/x',
      method: 'PATCH',
      body: { a: 1 },
      headers: { Authorization: 'Bearer tok', 'Content-Type': 'application/json' },
    });
  });
});

describe('simple endpoints', () => {
  type Row = [string, () => unknown, string, string, unknown];
  const rows: Row[] = [
    [
      'setupSystem',
      () => api.setupSystem({ password: 'p', name: 'n', email: 'e', subscribe: true }),
      'POST',
      '/magic/system/config/setup',
      { password: 'p', name: 'n', email: 'e', subscribe: true },
    ],
    [
      'saveWebsiteConfig',
      () => api.saveWebsiteConfig({ a: 1 } as never),
      'PUT',
      '/magic/system/www/config',
      { a: 1 },
    ],
    [
      'debugHyperlambda',
      () => api.debugHyperlambda('log.info', { x: 1 }),
      'POST',
      '/magic/system/evaluator/debug',
      { hyperlambda: 'log.info', args: { x: 1 } },
    ],
    [
      'saveConfig',
      () => api.saveConfig({ magic: {} }),
      'POST',
      '/magic/system/config/save',
      { magic: {} },
    ],
    [
      'crudify',
      () => api.crudify({ table: 't' }),
      'POST',
      '/magic/system/crudifier/crudify',
      { table: 't' },
    ],
    [
      'exportDdl',
      () => api.exportDdl('sqlite', 'cs', 'db', ['a', 'b'], true),
      'POST',
      '/magic/system/sql/ddl/export-tables',
      {
        databaseType: 'sqlite',
        connectionString: 'cs',
        databaseName: 'db',
        tables: ['a', 'b'],
        full: true,
      },
    ],
    [
      'mlTypeCreate',
      () => api.mlTypeCreate({ type: 't' }),
      'POST',
      '/magic/system/magic/ml_types',
      { type: 't' },
    ],
    [
      'mlTypeUpdate',
      () => api.mlTypeUpdate({ type: 't' }),
      'PUT',
      '/magic/system/magic/ml_types',
      { type: 't' },
    ],
    [
      'createQuestionnaire',
      () => api.createQuestionnaire({ name: 'q' } as never),
      'POST',
      '/magic/system/magic/questionnaires',
      { name: 'q' },
    ],
    [
      'updateQuestionnaire',
      () => api.updateQuestionnaire({ name: 'q' } as never),
      'PUT',
      '/magic/system/magic/questionnaires',
      { name: 'q' },
    ],
    [
      'createQuestion',
      () => api.createQuestion({ question: 'a', questionnaire: 'q', type: 't', context: 1 }),
      'POST',
      '/magic/system/magic/questions',
      { question: 'a', questionnaire: 'q', type: 't', context: 1 },
    ],
    [
      'updateQuestion',
      () =>
        api.updateQuestion({
          question_id: 3,
          question: 'a',
          questionnaire: 'q',
          type: 't',
          context: 0,
        }),
      'PUT',
      '/magic/system/magic/questions',
      { question_id: 3, question: 'a', questionnaire: 'q', type: 't', context: 0 },
    ],
    [
      'mlSnippetCreate',
      () => api.mlSnippetCreate({ prompt: 'p' }),
      'POST',
      '/magic/system/magic/ml_training_snippets',
      { prompt: 'p' },
    ],
    [
      'mlSnippetUpdate',
      () => api.mlSnippetUpdate({ id: 4, prompt: 'p' }),
      'PUT',
      '/magic/system/magic/ml_training_snippets',
      { id: 4, prompt: 'p' },
    ],
    [
      'gitCheckout',
      () => api.gitCheckout('/p', 'main', true),
      'POST',
      '/magic/system/git/checkout',
      { path: '/p', branch: 'main', create: true },
    ],
    [
      'installPlugin',
      () => api.installPlugin({ name: 'a b', type: 'app' }),
      'POST',
      '/magic/system/bazar/install-plugin',
      expect.objectContaining({
        name: 'a b',
        type: 'app',
        url: expect.stringContaining('name=a%20b'),
      }),
    ],
  ];

  it.each(rows)('%s sends the expected request', async (_name, call, method, url, body) => {
    await call();
    expect(last().method).toBe(method);
    expect(last().url).toBe(BASE + url);
    expect(last().body).toEqual(body);
  });

  it('custom sql, sandbox and search endpoints post their payload unchanged', async () => {
    const sql = {
      databaseType: 'sqlite',
      database: 'd',
      authorization: 'root',
      moduleName: 'm',
      endpointName: 'e',
      verb: 'get',
      sql: 'select 1',
      arguments: '',
      overwrite: false,
    };
    await api.customSqlEndpoint(sql);
    expect(last().url).toBe(BASE + '/magic/system/crudifier/custom-sql');
    expect(last().body).toEqual(sql);
    const sandbox = {
      moduleName: 'm',
      endpointName: 'e',
      verb: 'get',
      inputMode: 'x',
      authorization: 'root',
      policy: '{}',
      overwrite: true,
    };
    await api.generateSandboxEndpoint(sandbox);
    expect(last().url).toBe(BASE + '/magic/system/crudifier/sandbox-api');
    expect(last().body).toEqual(sandbox);
    const search = {
      moduleName: 'm',
      endpointName: 'e',
      verb: 'get',
      type: 't',
      retrieval: 'both',
      limit: 5,
      uri: 'u',
      meta: 'm',
      result: 'r',
      authorization: 'root',
      rateLimit: 1,
      rateWindow: 2,
      cacheSeconds: 3,
      overwrite: false,
    };
    await api.generateSearchEndpoint(search);
    expect(last().url).toBe(BASE + '/magic/system/crudifier/search-api');
    expect(last().body).toEqual(search);
  });

  it('importOpenApi posts to the importer', async () => {
    await api.importOpenApi({ url: 'u', channel: 'c' } as never);
    expect(last().url).toBe(BASE + '/magic/system/openapi/import');
    expect(last().method).toBe('POST');
  });
});

describe('raw requests', () => {
  it('evaluateWithArgs posts the code and arguments and returns status and blob', async () => {
    respond = () => new Response('out', { status: 200, headers: { 'Content-Type': 'text/plain' } });
    const result = await api.evaluateWithArgs('log.info', { a: 1 });
    expect(last().url).toBe(BASE + '/magic/system/evaluator/evaluate-with-args');
    expect(last().body).toEqual({ hyperlambda: 'log.info', args: { a: 1 } });
    expect(result.status).toBe(200);
    expect(result.contentType).toBe('text/plain');
    expect(await result.blob.text()).toBe('out');
  });

  it('invokeEndpoint upper-cases the verb, prefixes a slash and returns errors instead of throwing', async () => {
    respond = () => new Response('nope', { status: 500, headers: { 'X-Test': 'yes' } });
    const result = await api.invokeEndpoint(
      'post',
      'magic/modules/x',
      '{"a":1}',
      'text/json',
      'other',
    );
    expect(last().method).toBe('POST');
    expect(last().url).toBe(BASE + '/magic/modules/x');
    expect(last().headers).toEqual({ Authorization: 'Bearer other', 'Content-Type': 'text/json' });
    expect(result.status).toBe(500);
    expect(result.headers['x-test']).toBe('yes');
  });

  it('a raw request that is rejected with 401 notifies the unauthorized handler', async () => {
    const handler = vi.fn();
    api.setUnauthorizedHandler(handler);
    respond = () => json({ message: 'denied' }, 401);
    await expect(api.evaluateWithArgs('x', {})).rejects.toMatchObject({
      status: 401,
      message: 'denied',
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('DDL mutations', () => {
  it('addTable posts the table definition and then flushes the schema cache', async () => {
    await api.addTable('sqlite', 'cs', 'db', 'tbl', 'id', 'int', 0);
    expect(sent).toHaveLength(2);
    expect(sent[0].url).toBe(BASE + '/magic/system/sql/ddl/table');
    expect(sent[0].body).toEqual({
      databaseType: 'sqlite',
      connectionString: 'cs',
      databaseName: 'db',
      tableName: 'tbl',
      pkName: 'id',
      pkType: 'int',
      pkLength: 0,
      pkDefault: null,
    });
    expect(sent[1].method).toBe('DELETE');
    expect(sent[1].url).toBe(
      BASE + '/magic/system/cache/delete?id=' + encodeURIComponent('magic.sql.databases.sqlite.cs'),
    );
  });

  it('dropTable encodes every argument and flushes the cache', async () => {
    await api.dropTable('sqlite', 'a b', 'db', 't 1');
    expect(sent[0].method).toBe('DELETE');
    expect(sent[0].url).toBe(
      BASE +
        '/magic/system/sql/ddl/table?databaseType=sqlite&connectionString=a%20b&databaseName=db&tableName=t%201',
    );
    expect(sent).toHaveLength(2);
  });

  it('addColumn posts the column with indexed false', async () => {
    const target = {
      databaseType: 'sqlite',
      connectionString: 'cs',
      databaseName: 'db',
      tableName: 't',
    };
    await api.addColumn(target, {
      columnName: 'c',
      columnType: 'text',
      defaultValue: null,
      nullable: true,
      columnLength: 10,
    });
    expect(sent[0].url).toBe(BASE + '/magic/system/sql/ddl/column');
    expect(sent[0].body).toMatchObject({
      tableName: 't',
      columnName: 'c',
      indexed: false,
      columnLength: 10,
    });
    expect(sent).toHaveLength(2);
  });

  it('addForeignKey posts the foreign table and cascading flag', async () => {
    const target = {
      databaseType: 'sqlite',
      connectionString: 'cs',
      databaseName: 'db',
      tableName: 't',
    };
    await api.addForeignKey(target, {
      columnName: 'fk',
      columnType: 'int',
      foreignTable: 'other',
      foreignField: 'id',
      nullable: false,
      columnLength: null,
      cascading: true,
    });
    expect(sent[0].body).toMatchObject({
      foreignTable: 'other',
      foreignField: 'id',
      cascading: true,
    });
  });

  it('dropColumn encodes the column in the query', async () => {
    await api.dropColumn('sqlite', 'cs', 'db', 't', 'a&b');
    expect(sent[0].url).toContain('&columnName=a%26b');
    expect(sent[0].method).toBe('DELETE');
  });

  it('addLinkTable posts its args', async () => {
    await api.addLinkTable('sqlite', 'cs', 'db', { left: 'a', right: 'b' });
    expect(sent[0].url).toBe(BASE + '/magic/system/sql/ddl/link-table');
    expect(sent[0].body).toEqual({
      databaseType: 'sqlite',
      connectionString: 'cs',
      databaseName: 'db',
      args: { left: 'a', right: 'b' },
    });
  });

  it('a failing schema cache flush does not fail the mutation', async () => {
    respond = url =>
      url.includes('/cache/delete') ? json({ message: 'boom' }, 500) : json({ result: 'ok' });
    await expect(api.addTable('sqlite', 'cs', 'db', 't', 'id', 'int', 0)).resolves.toEqual({
      result: 'ok',
    });
  });

  it('a failing mutation is thrown and the cache is not flushed', async () => {
    respond = () => json({ message: 'exists' }, 409);
    await expect(api.dropTable('sqlite', 'cs', 'db', 't')).rejects.toMatchObject({
      status: 409,
      message: 'exists',
    });
    expect(sent).toHaveLength(1);
  });
});

describe('users', () => {
  it('userExtra returns the value of a field, or empty', () => {
    const user = { username: 'u', extra: [{ type: 'email', value: 'a@b.c' }] } as never;
    expect(api.userExtra(user, 'email')).toBe('a@b.c');
    expect(api.userExtra(user, 'name')).toBe('');
    expect(api.userExtra({ username: 'u' }, 'name')).toBe('');
  });

  it('listUsers sorts by username by default and filters with a prefix like', async () => {
    await api.listUsers('jo e', 10, 5);
    expect(last().url).toBe(
      BASE + '/magic/system/magic/users?limit=5&offset=10&order=username&username.like=jo%20e%25',
    );
  });

  it('listUsers uses the requested sort and omits the filter when empty', async () => {
    await api.listUsers('', 0, 5, { column: 'created', direction: 'desc' });
    expect(last().url).toBe(
      BASE + '/magic/system/magic/users?limit=5&offset=0&order=created&direction=desc',
    );
  });

  describe('saveUserExtra', () => {
    function backend(users: unknown) {
      respond = url => (url.includes('/users?') ? json(users) : json({ result: 'ok' }));
    }
    const withEmail = [{ username: 'bob', extra: [{ type: 'email', value: 'x' }] }];
    const withoutEmail = [{ username: 'bob', extra: [] }];

    it('adds a field the user does not have', async () => {
      backend(withoutEmail);
      await api.saveUserExtra('bob', 'email', 'a@b.c');
      expect(last().method).toBe('POST');
      expect(last().body).toEqual({ user: 'bob', type: 'email', value: 'a@b.c' });
    });

    it('updates a field the user already has', async () => {
      backend(withEmail);
      await api.saveUserExtra('bob', 'email', 'new');
      expect(last().method).toBe('PUT');
      expect(last().body).toEqual({ user: 'bob', type: 'email', value: 'new' });
    });

    it('deletes an existing field when the value is empty', async () => {
      backend(withEmail);
      await api.saveUserExtra('bob', 'email', '');
      expect(last().method).toBe('DELETE');
      expect(last().url).toContain('users_extra?user=bob&type=email');
    });

    it('does nothing when an empty value is saved for a missing field', async () => {
      backend(withoutEmail);
      await api.saveUserExtra('bob', 'email', '');
      expect(sent).toHaveLength(1);
    });

    it('treats a user missing from the listing as having no fields', async () => {
      backend([{ username: 'someone-else', extra: [{ type: 'email', value: 'x' }] }]);
      await api.saveUserExtra('bob', 'email', 'v');
      expect(last().method).toBe('POST');
    });
  });
});

describe('backendInfo and machine learning', () => {
  it('backendInfo exposes the configured url and token', () => {
    expect(api.backendInfo()).toEqual({ url: BASE, token: 'tok' });
  });

  it('mlSnippets filters, orders newest first by default', async () => {
    await api.mlSnippets('t y', 'abc', 0, 10);
    const url = last().url;
    expect(url).toContain('/magic/system/magic/ml_training_snippets?limit=10&offset=0');
    expect(url).toContain('&order=created&direction=desc');
    expect(url).toContain('&ml_training_snippets.type.eq=t%20y');
    expect(url).toContain('&ml_training_snippets.prompt.like=%25abc%25');
    expect(url).toContain('&ml_training_snippets.uri.like=abc%25');
  });

  it('mlSnippets honours a column sort and leaves out the like filters without a filter', async () => {
    await api.mlSnippets('t', '', 5, 10, { column: 'uri', direction: 'asc' });
    expect(last().url).toContain('&order=uri&direction=asc');
    expect(last().url).not.toContain('.like=');
  });

  it('mlSnippets with vector search uses the vss endpoint without ordering', async () => {
    await api.mlSnippets('t', 'a b', 0, 10, undefined, true);
    expect(last().url).toBe(
      BASE + '/magic/system/magic/ml_training_snippets-vss?limit=10&offset=0&type=t&filter=a%20b',
    );
  });

  it('mlSnippetsCount applies the filter, except for vector search', async () => {
    respond = () => json({ count: 3 });
    await expect(api.mlSnippetsCount('t', 'abc')).resolves.toEqual({ count: 3 });
    expect(last().url).toContain('.like=%25abc%25');
    await api.mlSnippetsCount('t', 'abc', true);
    expect(last().url).toBe(
      BASE + '/magic/system/magic/ml_training_snippets-count?ml_training_snippets.type.eq=t',
    );
  });
});

describe('auth helpers that call fetch directly', () => {
  it('canResetPassword is true only for result true', async () => {
    respond = () => json({ result: true });
    await expect(api.canResetPassword('https://x.test///')).resolves.toBe(true);
    expect(last().url).toBe('https://x.test/magic/system/auth/can-reset-password');
    respond = () => json({ result: 'yes' });
    await expect(api.canResetPassword('https://x.test')).resolves.toBe(false);
  });

  it('canResetPassword is false on an error status and when the request fails', async () => {
    respond = () => json({}, 404);
    await expect(api.canResetPassword('https://x.test')).resolves.toBe(false);
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('offline')));
    await expect(api.canResetPassword('https://x.test')).resolves.toBe(false);
  });

  it('openidProviders returns the providers, an empty list for no body or an error', async () => {
    respond = () => json([{ name: 'google' }]);
    await expect(api.openidProviders('https://x.test/')).resolves.toEqual([{ name: 'google' }]);
    expect(last().url).toBe('https://x.test/magic/system/auth/openid-providers?createNonce=true');
    respond = () => new Response('', { status: 200 });
    await expect(api.openidProviders('https://x.test')).resolves.toEqual([]);
    respond = () => json({}, 500);
    await expect(api.openidProviders('https://x.test')).resolves.toEqual([]);
  });

  it('openidLogin encodes the token and returns the ticket', async () => {
    respond = () => json({ ticket: 'jwt' });
    await expect(api.openidLogin('https://x.test', 'a b')).resolves.toEqual({ ticket: 'jwt' });
    expect(last().url).toBe('https://x.test/magic/system/auth/openid-login?token=a%20b');
  });

  it('openidLogin throws the backend message on failure', async () => {
    respond = () => json({ message: 'bad token' }, 401);
    await expect(api.openidLogin('https://x.test', 't')).rejects.toMatchObject({
      status: 401,
      message: 'bad token',
    });
  });
});

describe('chat, import and upload', () => {
  it('chatPrompt builds the form with files capped and optional upload-only flag', async () => {
    const files = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
      i => new File(['x'], 'f' + i + '.txt'),
    );
    await api.chatPrompt('sess', 'hello', 'user1', files, true);
    const form = last().body as FormData;
    expect(last().url).toBe(BASE + '/magic/system/openai/chat');
    expect(form.get('prompt')).toBe('hello');
    expect(form.get('session')).toBe('sess');
    expect(form.get('user_id')).toBe('user1');
    expect(form.get('stream')).toBe('true');
    expect(form.get('upload_file_only')).toBe('true');
    expect((form.get('file') as File).name).toBe('f1.txt');
    expect((form.get('file1') as File).name).toBe('f2.txt');
    const fileKeys = [...form.keys()].filter(key => key.startsWith('file'));
    expect(fileKeys.length).toBeLessThan(files.length);
  });

  it('chatPrompt without files or upload-only sends neither', async () => {
    await api.chatPrompt('s', 'p', 'u');
    const form = last().body as FormData;
    expect(form.has('upload_file_only')).toBe(false);
    expect(form.has('file')).toBe(false);
  });

  it('chatDownloadUrl encodes the ticket and file against the backend url', () => {
    expect(api.chatDownloadUrl('a b', '/x y.txt')).toBe(
      BASE + '/magic/system/file-system/file-with-token?access_token=a%20b&file=%2Fx%20y.txt',
    );
  });

  it('importPage uses the minimum threshold and the feedback channel', async () => {
    await api.importPage({ url: 'https://p', type: 't', images: true, channel: 'ch' });
    expect(last().url).toBe(BASE + '/magic/system/openai/import-page');
    expect(last().body).toEqual({
      url: 'https://p',
      type: 't',
      threshold: 25,
      images: true,
      'feedback-channel': 'ch',
    });
  });

  it('importUrl sends meta as null when not given', async () => {
    await api.importUrl({
      url: 'https://p',
      type: 't',
      delay: 1,
      max: 2,
      insert_url: true,
      images: false,
      channel: 'ch',
    });
    expect(last().body).toMatchObject({ threshold: 25, meta: null, max: 2, insert_url: true });
    await api.importUrl({
      url: 'https://p',
      type: 't',
      delay: 1,
      max: 2,
      insert_url: true,
      images: false,
      channel: 'ch',
      meta: 'tag',
    });
    expect(last().body).toMatchObject({ meta: 'tag' });
  });

  it('uploadTrainingFile sends plain options for a non-PDF file', async () => {
    await api.uploadTrainingFile('t', new File(['x'], 'a.csv'), {
      promptField: 'q',
      forceAsText: true,
      summarize: true,
      preservePages: true,
    });
    const form = last().body as FormData;
    expect(form.get('type')).toBe('t');
    expect(form.get('prompt')).toBe('q');
    expect(form.get('completion')).toBe('completion');
    expect(form.get('forceAsText')).toBe('true');
    expect(form.get('massagePrompt')).toEqual(expect.stringContaining('keyword-based'));
    // PDF-only options are ignored for other file types.
    expect(form.has('preservePages')).toBe(false);
  });

  it('uploadTrainingFile sends the PDF-only options for a PDF', async () => {
    await api.uploadTrainingFile('t', new File(['x'], 'A.PDF'), {
      massage: 'tidy',
      preservePages: true,
      overwrite: true,
    });
    const form = last().body as FormData;
    expect(form.get('massage')).toBe('tidy');
    expect(form.get('preservePages')).toBe('true');
    expect(form.get('overwrite')).toBe('true');
    expect(form.has('massagePrompt')).toBe(false);
  });

  it('createBot posts the bot definition with vectorize on and autocrawl off', async () => {
    await api.createBot({
      url: 'https://s',
      model: 'm',
      flavor: 'f',
      instruction: 'i',
      max: 5,
      autoDestruct: true,
      channel: 'ch',
    });
    expect(last().url).toBe(BASE + '/magic/system/openai/create-bot');
    expect(last().body).toMatchObject({
      auto_destruct: true,
      vectorize: true,
      autocrawl: false,
      'feedback-channel': 'ch',
    });
  });
});

describe('log listing', () => {
  it('listLog without paging or query only sends max', async () => {
    await api.listLog(null, 50);
    expect(last().url).toBe(BASE + '/magic/system/log/list?max=50');
  });

  it('listLog adds from and appends a wildcard to a plain query', async () => {
    await api.listLog(7, 50, 'err or');
    expect(last().url).toBe(BASE + '/magic/system/log/list?max=50&from=7&query=err%20or%25');
  });

  it('listLog keeps a query that already has a wildcard', async () => {
    await api.listLog(null, 10, '%err');
    expect(last().url).toBe(BASE + '/magic/system/log/list?max=10&query=%25err');
  });
});

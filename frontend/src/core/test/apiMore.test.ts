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
      'mlTypeUpdate',
      () => api.mlTypeUpdate({ type: 't' }),
      'PUT',
      '/magic/system/magic/ml_types',
      { type: 't' },
    ],
    [
      'mlSnippetCreate',
      () => api.mlSnippetCreate({ prompt: 'p' }),
      'POST',
      '/magic/system/magic/ml_training_snippets',
      { prompt: 'p' },
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
});

describe('raw requests', () => {
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
});

describe('DDL mutations', () => {
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
});

describe('users', () => {
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

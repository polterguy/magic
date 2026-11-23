// @vitest-environment jsdom
/*
 * The branches of the API layer the other api tests leave alone: optional arguments left out,
 * answers without a Content-Type or message, no token configured, and failed side requests.
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
let respond: () => Response | object;

function parsed(body: unknown) {
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

function last(): Sent {
  const item = sent.at(-1);
  if (!item) {
    throw new Error('nothing was sent');
  }
  return item;
}

function form(): FormData {
  return last().body as FormData;
}

beforeEach(() => {
  sent = [];
  respond = () => json({ result: 'ok' });
  vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
    sent.push({
      url,
      method: init?.method ?? 'GET',
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: parsed(init?.body),
    });
    return Promise.resolve(respond());
  });
  api.configureApi(BASE, 'tok');
  api.setUnauthorizedHandler(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('responses', () => {
  it('uses the status text when the error body carries no message', async () => {
    respond = () =>
      new Response(JSON.stringify({ 'log-id': 7 }), { status: 500, statusText: 'Boom' });
    const error = await api.http.get('/x').catch((err: unknown) => err);
    expect(error).toBeInstanceOf(api.ApiError);
    expect(error).toMatchObject({ status: 500, message: 'Boom', logId: 7 });
  });

  it('hands back the text of an answer that has no Content-Type', async () => {
    respond = () => ({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: () => Promise.resolve('{"a":1}'),
    });
    expect(await api.http.get('/x')).toBe('{"a":1}');
  });

  it('reports an empty content type for a raw file answer without one', async () => {
    respond = () => ({
      ok: true,
      status: 200,
      headers: new Headers(),
      blob: () => Promise.resolve(new Blob(['x'])),
    });
    const raw = await api.downloadFileRaw('/scripts/a.txt');
    expect(raw.contentType).toBe('');
    expect(raw.disposition).toBe('');
    expect(raw.status).toBe(200);
  });

  it('sends no Authorization header without a token', async () => {
    api.configureApi(BASE, null);
    await api.downloadFileRaw('/scripts/a.txt');
    expect(last().headers).toEqual({});
  });
});

describe('an unauthorised raw request', () => {
  it('does not report a dead session when no token was sent', async () => {
    const handler = vi.fn();
    api.setUnauthorizedHandler(handler);
    api.configureApi(BASE, null);
    respond = () => new Response('', { status: 401, statusText: 'Unauthorized' });
    await expect(api.downloadFileRaw('/scripts/a.txt')).rejects.toMatchObject({ status: 401 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('reports a dead session when the token was rejected', async () => {
    const handler = vi.fn();
    api.setUnauthorizedHandler(handler);
    respond = () => new Response('', { status: 401, statusText: 'Unauthorized' });
    await expect(api.downloadFileRaw('/scripts/a.txt')).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('fileWithTokenUrl', () => {
  it('leaves the token empty when signed out', () => {
    api.configureApi(BASE, null);
    expect(api.fileWithTokenUrl('/a b.txt')).toBe(
      BASE + '/magic/system/file-system/file-with-token?file=%2Fa%20b.txt&access_token=',
    );
  });
});

describe('optional arguments left out', () => {
  it('listFiles adds a filter only when given', async () => {
    await api.listFiles('/a/');
    expect(last().url).toBe(BASE + '/magic/system/file-system/list-files?folder=%2Fa%2F');
    await api.listFiles('/a/', '.hl');
    expect(last().url).toContain('&filter=.hl');
  });

  it('countUsers sends a filter only when given', async () => {
    await api.countUsers('');
    expect(last().url).toBe(BASE + '/magic/system/magic/users-count');
    await api.countUsers('jo');
    expect(last().url).toContain('?username.like=jo%25');
  });

  it('listTasks and countTasks send a filter only when given', async () => {
    await api.listTasks(0, 10);
    expect(last().url).toBe(BASE + '/magic/system/tasks/list?offset=0&limit=10');
    await api.listTasks(0, 10, 'x');
    expect(last().url).toContain('&filter=%25x%25');
    await api.countTasks();
    expect(last().url).toBe(BASE + '/magic/system/tasks/count');
    await api.countTasks('x');
    expect(last().url).toContain('?filter=%25x%25');
  });

  it('scheduleTask sends due for a one-off and repeats for a recurring schedule', async () => {
    await api.scheduleTask('t1', '2030-01-01T00:00:00');
    expect(last().body).toEqual({ id: 't1', due: '2030-01-01T00:00:00' });
    await api.scheduleTask('t1', undefined, '5.seconds');
    expect(last().body).toEqual({ id: 't1', repeats: '5.seconds' });
  });

  it('countLog keeps a query that already has a wildcard and adds one otherwise', async () => {
    await api.countLog();
    expect(last().url).toBe(BASE + '/magic/system/log/count');
    await api.countLog('a%b');
    expect(last().url).toBe(BASE + '/magic/system/log/count?query=a%25b');
    await api.countLog('ab');
    expect(last().url).toBe(BASE + '/magic/system/log/count?query=ab%25');
  });

  it('the git helpers send the optional file, branch and range only when given', async () => {
    await api.gitRestore('/repo');
    expect(last().body).toEqual({ path: '/repo' });
    await api.gitRestore('/repo', 'a.hl');
    expect(last().body).toEqual({ path: '/repo', file: 'a.hl' });
    await api.gitPush('/repo');
    expect(last().body).toEqual({ path: '/repo' });
    await api.gitPush('/repo', 'main');
    expect(last().body).toEqual({ path: '/repo', branch: 'main' });
    await api.gitPull('/repo');
    expect(last().body).toEqual({ path: '/repo', merge: true });
    await api.gitPull('/repo', 'main');
    expect(last().body).toEqual({ path: '/repo', branch: 'main', merge: true });
    await api.gitLog('/repo');
    expect(last().url).toBe(BASE + '/magic/system/git/log?path=%2Frepo');
    await api.gitLog('/repo', 'HEAD...@{u}');
    expect(last().url).toContain('&range=HEAD...%40%7Bu%7D');
  });
});

describe('uploads', () => {
  const file = new File(['a,b'], 'data.csv');

  it('uploadUrlList says whether to vectorize', async () => {
    await api.uploadUrlList('t', file, 'ch', false);
    expect(form().get('vectorize')).toBe('false');
    await api.uploadUrlList('t', file, 'ch', true);
    expect(form().get('vectorize')).toBe('true');
  });

  it('uploadTrainingFile falls back to the default prompt and completion fields', async () => {
    await api.uploadTrainingFile('t', file);
    expect(form().get('prompt')).toBe('prompt');
    expect(form().get('completion')).toBe('completion');
    expect(form().has('forceAsText')).toBe(false);
    expect(form().has('massagePrompt')).toBe(false);
  });

  it('uploadTrainingFile passes named fields, text mode and summarising', async () => {
    await api.uploadTrainingFile('t', file, {
      promptField: 'q',
      completionField: 'a',
      forceAsText: true,
      summarize: true,
    });
    expect(form().get('prompt')).toBe('q');
    expect(form().get('completion')).toBe('a');
    expect(form().get('forceAsText')).toBe('true');
    expect(form().get('massagePrompt')).toBeTruthy();
  });

  it('uploadTrainingFile sends the PDF options only for a PDF', async () => {
    const options = { massage: 'tidy', preservePages: true, overwrite: true };
    await api.uploadTrainingFile('t', file, options);
    expect(form().has('massage')).toBe(false);
    expect(form().has('preservePages')).toBe(false);
    expect(form().has('overwrite')).toBe(false);
    await api.uploadTrainingFile('t', new File(['x'], 'Doc.PDF'), options);
    expect(form().get('massage')).toBe('tidy');
    expect(form().get('preservePages')).toBe('true');
    expect(form().get('overwrite')).toBe('true');
    await api.uploadTrainingFile('t', new File(['x'], 'doc.pdf'));
    expect(form().has('massage')).toBe(false);
    expect(form().has('preservePages')).toBe(false);
    expect(form().has('overwrite')).toBe(false);
  });
});

describe('side requests that fail', () => {
  it('sendResetPasswordLink throws the status text', async () => {
    respond = () => new Response('nope', { status: 429, statusText: 'Too Many Requests' });
    await expect(api.sendResetPasswordLink(BASE + '/', 'joe')).rejects.toMatchObject({
      status: 429,
      message: 'Too Many Requests',
    });
    expect(last().url).toBe(BASE + '/magic/system/auth/send-reset-password-link');
  });

  it('openidExchange throws the backend message', async () => {
    respond = () => json({ message: 'bad code' }, 400);
    await expect(api.openidExchange(BASE, 'c', 's', 'https://app/cb')).rejects.toMatchObject({
      status: 400,
      message: 'bad code',
    });
    expect(last().body).toEqual({ code: 'c', state: 's', redirect_uri: 'https://app/cb' });
  });
});

describe('aiQuery through the generator', () => {
  it('sends only the prompt when there is no code to change', async () => {
    respond = () => json({ result: '```hyperlambda\nlog.info:x\n```' });
    const answer = await api.aiQuery('make it', 'hl');
    expect(last().url).toBe('https://ainiro.io/magic/modules/hyperlambda-generator/chat');
    expect(form().get('prompt')).toBe('make it');
    expect(form().has('data')).toBe(false);
    expect(answer.result).toBe('log.info:x');
  });

  it('sends existing code as data', async () => {
    await api.aiQuery('change it', 'hl', undefined, undefined, 'old:code');
    expect(form().get('data')).toBe('old:code');
  });

  it('answers an empty result when the generator returns none', async () => {
    respond = () => json({});
    expect((await api.aiQuery('p', 'hl')).result).toBe('');
  });

  it('throws when the generator fails', async () => {
    respond = () => json({ message: 'overloaded' }, 503);
    await expect(api.aiQuery('p', 'hl')).rejects.toMatchObject({
      status: 503,
      message: 'overloaded',
    });
  });
});

describe('aiQuery through the OpenAI proxy', () => {
  it('leaves out the system message and session when not given', async () => {
    await api.aiQuery('p', 'sql');
    expect(form().has('system_message_override')).toBe(false);
    expect(form().has('session')).toBe(false);
    expect(form().get('type')).toBe('sql');
  });

  it('sends the system message and session when given', async () => {
    await api.aiQuery('p', 'sql', 'schema here', 'sess-1');
    expect(form().get('system_message_override')).toBe('schema here');
    expect(form().get('session')).toBe('sess-1');
  });

  it('answers an empty result when the proxy returns none', async () => {
    respond = () => json({});
    expect((await api.aiQuery('p', 'sql')).result).toBe('');
  });
});

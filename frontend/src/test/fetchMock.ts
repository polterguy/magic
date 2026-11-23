/*
 * A stand-in for fetch, for tests of the functions that call the backend: it keeps every request
 * the code sends, and answers each with whatever the test asked for. Call installFetchMock inside
 * a describe block; the tests in it then read `sent` (or `last()`) and set answers with
 * `respondWith`.
 */
import { configureApi, setUnauthorizedHandler } from '@core/api';
import { afterEach, beforeEach, expect, vi } from 'vitest';

export const BASE = 'https://backend.test';

// Stands for a file argument in a table of calls; the runner swaps in a real File.
export const FILE = Symbol('file');

export interface Sent {
  url: string;
  method: string;
  headers: Record<string, string>;
  // The JSON body parsed, the FormData of an upload, or undefined without a body.
  body: unknown;
}

// The requests of the running test, emptied before each one.
export const sent: Sent[] = [];

type Responder = (url: string) => Response | object;
let responder: Responder = (_url: string) => json({});

export function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Answers every request from now on with what the function returns.
export function respondWith(next: Responder) {
  responder = next;
}

export function last(): Sent {
  const item = sent.at(-1);
  if (!item) {
    throw new Error('nothing was sent');
  }
  return item;
}

// The form data of the last request, for uploads.
export function form(): FormData {
  return last().body as FormData;
}

function parsed(body: unknown) {
  if (body instanceof FormData) {
    return body;
  }
  return typeof body === 'string' ? (JSON.parse(body) as unknown) : undefined;
}

/*
 * Replaces fetch for each test in the enclosing describe, pointing the API at BASE with the given
 * token and answering with `initial` until a test says otherwise.
 */
export function installFetchMock(
  token: string | null,
  initial: Responder = (_url: string) => json({}),
) {
  beforeEach(() => {
    sent.length = 0;
    responder = initial;
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
      sent.push({
        url,
        method: init?.method ?? 'GET',
        headers: (init?.headers ?? {}) as Record<string, string>,
        body: parsed(init?.body),
      });
      return Promise.resolve(responder(url));
    });
    configureApi(BASE, token);
    setUnauthorizedHandler(null);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });
}

type Call = (...args: unknown[]) => Promise<unknown>;
export type EndpointRow = [string, unknown[], string, string, unknown];

/*
 * Runs one row of an endpoint table — the function's name, its arguments, and the verb, URL and
 * body it must send ('form' for an upload) — against the module that exports the function.
 */
export async function expectEndpointRow(module: object, row: EndpointRow) {
  const [name, args, method, url, body] = row;
  const call = (module as Record<string, Call>)[name];
  await call(...args.map(arg => (arg === FILE ? new File(['x'], 'f.txt') : arg)));
  expect(sent).toHaveLength(1);
  expect(sent[0].method).toBe(method);
  expect(sent[0].url).toBe(url.startsWith('/') ? BASE + url : url);
  if (body === 'form') {
    expect(sent[0].body).toBeInstanceOf(FormData);
  } else {
    expect(sent[0].body).toEqual(body);
  }
}

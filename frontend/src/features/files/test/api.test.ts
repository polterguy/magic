// @vitest-environment jsdom
/*
 * This feature's calls to the backend: what each one sends — verb, URL and body — and what it
 * makes of the answer. fetch is replaced, so nothing here needs a backend.
 */
import * as api from '@shared/api';
import { describe, expect, it, vi } from 'vitest';

import {
  BASE,
  type EndpointRow,
  expectEndpointRow,
  installFetchMock,
  json,
  last,
  respondWith,
} from '../../../test/fetchMock';
import * as featureApi from '../lib/api';

/*
 * One row per function: its name, the arguments it is called with (a space in every string shows
 * that it is URL-encoded), and the verb, URL and JSON body it sends.
 */
const ENDPOINTS: EndpointRow[] = [
  [
    'listFoldersRecursively',
    ['a b', true],
    'GET',
    '/magic/system/file-system/list-folders-recursively?folder=a%20b&sys=true',
    undefined,
  ],
  [
    'renamePath',
    ['a b', 'a b'],
    'POST',
    '/magic/system/file-system/rename',
    { oldName: 'a b', newName: 'a b' },
  ],
  [
    'downloadFolderRaw',
    ['a b'],
    'GET',
    '/magic/system/file-system/download-folder?folder=a%20b',
    undefined,
  ],
  [
    'getFileDescription',
    ['a b'],
    'POST',
    '/magic/system/workflows/get-hyperlambda-arguments',
    { path: 'a b' },
  ],
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
  [
    'gitCheckout',
    ['/p', 'main', true],
    'POST',
    '/magic/system/git/checkout',
    { path: '/p', branch: 'main', create: true },
  ],
];

describe('endpoint functions', () => {
  installFetchMock(null, () => json({}));

  it.each(ENDPOINTS)('%s sends the expected request', async (...row) => {
    await expectEndpointRow(featureApi, row);
  });
});

describe('raw requests', () => {
  installFetchMock('tok', () => json({ result: 'success' }));

  it('evaluateWithArgs posts the code and arguments and returns status and blob', async () => {
    respondWith(
      () => new Response('out', { status: 200, headers: { 'Content-Type': 'text/plain' } }),
    );
    const result = await featureApi.evaluateWithArgs('log.info', { a: 1 });
    expect(last().url).toBe(BASE + '/magic/system/evaluator/evaluate-with-args');
    expect(last().body).toEqual({ hyperlambda: 'log.info', args: { a: 1 } });
    expect(result.status).toBe(200);
    expect(result.contentType).toBe('text/plain');
    expect(await result.blob.text()).toBe('out');
  });

  it('a raw request that is rejected with 401 notifies the unauthorized handler', async () => {
    const handler = vi.fn();
    api.setUnauthorizedHandler(handler);
    respondWith(() => json({ message: 'denied' }, 401));
    await expect(featureApi.evaluateWithArgs('x', {})).rejects.toMatchObject({
      status: 401,
      message: 'denied',
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('optional arguments left out', () => {
  installFetchMock('tok', () => json({ result: 'ok' }));

  it('the git helpers send the optional file, branch and range only when given', async () => {
    await featureApi.gitRestore('/repo');
    expect(last().body).toEqual({ path: '/repo' });
    await featureApi.gitRestore('/repo', 'a.hl');
    expect(last().body).toEqual({ path: '/repo', file: 'a.hl' });
    await featureApi.gitPush('/repo');
    expect(last().body).toEqual({ path: '/repo' });
    await featureApi.gitPush('/repo', 'main');
    expect(last().body).toEqual({ path: '/repo', branch: 'main' });
    await featureApi.gitPull('/repo');
    expect(last().body).toEqual({ path: '/repo', merge: true });
    await featureApi.gitPull('/repo', 'main');
    expect(last().body).toEqual({ path: '/repo', branch: 'main', merge: true });
    await featureApi.gitLog('/repo');
    expect(last().url).toBe(BASE + '/magic/system/git/log?path=%2Frepo');
    await featureApi.gitLog('/repo', 'HEAD...@{u}');
    expect(last().url).toContain('&range=HEAD...%40%7Bu%7D');
  });
});

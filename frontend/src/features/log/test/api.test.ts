// @vitest-environment jsdom
/*
 * This feature's calls to the backend: what each one sends — verb, URL and body — and what it
 * makes of the answer. fetch is replaced, so nothing here needs a backend.
 */
import { describe, expect, it } from 'vitest';

import { BASE, installFetchMock, json, last } from '../../../test/fetchMock';
import * as featureApi from '../lib/api';

describe('log listing', () => {
  installFetchMock('tok', () => json({ result: 'success' }));

  it('listLog without paging or query only sends max', async () => {
    await featureApi.listLog(null, 50);
    expect(last().url).toBe(BASE + '/magic/system/log/list?max=50');
  });

  it('listLog adds from and appends a wildcard to a plain query', async () => {
    await featureApi.listLog(7, 50, 'err or');
    expect(last().url).toBe(BASE + '/magic/system/log/list?max=50&from=7&query=err%20or%25');
  });

  it('listLog keeps a query that already has a wildcard', async () => {
    await featureApi.listLog(null, 10, '%err');
    expect(last().url).toBe(BASE + '/magic/system/log/list?max=10&query=%25err');
  });
});

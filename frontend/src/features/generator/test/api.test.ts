// @vitest-environment jsdom
/*
 * This feature's calls to the backend: what each one sends — verb, URL and body — and what it
 * makes of the answer. fetch is replaced, so nothing here needs a backend.
 */
import { describe, expect, it } from 'vitest';

import {
  BASE,
  type EndpointRow,
  expectEndpointRow,
  installFetchMock,
  json,
  last,
} from '../../../test/fetchMock';
import * as featureApi from '../lib/api';

/*
 * One row per function: its name, the arguments it is called with (a space in every string shows
 * that it is URL-encoded), and the verb, URL and JSON body it sends.
 */
const ENDPOINTS: EndpointRow[] = [
  ['listDynamicSlots', [], 'GET', '/magic/system/evaluator/slots', undefined],
  ['parseOpenApi', ['a b'], 'POST', '/magic/system/openapi/parse', { url: 'a b' }],
];

describe('endpoint functions', () => {
  installFetchMock(null, () => json({}));

  it.each(ENDPOINTS)('%s sends the expected request', async (...row) => {
    await expectEndpointRow(featureApi, row);
  });
});

describe('simple endpoints', () => {
  installFetchMock('tok', () => json({ result: 'success' }));

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
    await featureApi.customSqlEndpoint(sql);
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
    await featureApi.generateSandboxEndpoint(sandbox);
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
    await featureApi.generateSearchEndpoint(search);
    expect(last().url).toBe(BASE + '/magic/system/crudifier/search-api');
    expect(last().body).toEqual(search);
  });

  it('importOpenApi posts to the importer', async () => {
    await featureApi.importOpenApi({ url: 'u', channel: 'c' } as never);
    expect(last().url).toBe(BASE + '/magic/system/openapi/import');
    expect(last().method).toBe('POST');
  });
});

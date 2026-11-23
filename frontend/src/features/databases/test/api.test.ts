// @vitest-environment jsdom
/*
 * This feature's calls to the backend: what each one sends — verb, URL and body — and what it
 * makes of the answer. fetch is replaced, so nothing here needs a backend.
 */
import * as api from '@shared/api';
import { describe, expect, it } from 'vitest';

import {
  type EndpointRow,
  expectEndpointRow,
  FILE,
  installFetchMock,
  json,
  sent,
} from '../../../test/fetchMock';
import * as featureApi from '../lib/api';

/*
 * One row per function: its name, the arguments it is called with (a space in every string shows
 * that it is URL-encoded), and the verb, URL and JSON body it sends.
 */
const ENDPOINTS: EndpointRow[] = [
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
];

describe('endpoint functions', () => {
  installFetchMock(null, () => json({}));

  it.each(ENDPOINTS)('%s sends the expected request', async (...row) => {
    await expectEndpointRow(featureApi, row);
  });
});

describe('request handling', () => {
  installFetchMock(null, () => json({}));

  it('sends JSON bodies with a content type, and leaves form data alone', async () => {
    await api.changePassword('x');
    expect(sent[0].headers['Content-Type']).toBe('application/json');
    await featureApi.uploadDatabaseBackup(new File(['x'], 'f.db'));
    expect(sent[1].headers['Content-Type']).toBeUndefined();
  });
});

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
  FILE,
  installFetchMock,
  json,
  respondWith,
  sent,
} from '../../../test/fetchMock';
import * as featureApi from '../lib/api';

/*
 * One row per function: its name, the arguments it is called with (a space in every string shows
 * that it is URL-encoded), and the verb, URL and JSON body it sends.
 */
const ENDPOINTS: EndpointRow[] = [
  [
    'executeSql',
    ['a b', 'a b', 'a b', true, true],
    'POST',
    '/magic/system/sql/evaluate',
    { databaseType: 'a b', database: 'a b', sql: 'a b', safeMode: true, batch: true },
  ],
  [
    'importCsvFile',
    ['a b', 'a b', 'a b', FILE],
    'POST',
    '/magic/system/sql/import-csv-file',
    'form',
  ],
];

describe('endpoint functions', () => {
  installFetchMock(null, () => json({}));

  it.each(ENDPOINTS)('%s sends the expected request', async (...row) => {
    await expectEndpointRow(featureApi, row);
  });
});

describe('DDL mutations', () => {
  installFetchMock('tok', () => json({ result: 'success' }));

  it('addTable posts the table definition and then flushes the schema cache', async () => {
    await featureApi.addTable('sqlite', 'cs', 'db', 'tbl', 'id', 'int', 0);
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
    await featureApi.dropTable('sqlite', 'a b', 'db', 't 1');
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
    await featureApi.addColumn(target, {
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
    await featureApi.addForeignKey(target, {
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
    await featureApi.dropColumn('sqlite', 'cs', 'db', 't', 'a&b');
    expect(sent[0].url).toContain('&columnName=a%26b');
    expect(sent[0].method).toBe('DELETE');
  });

  it('a failing schema cache flush does not fail the mutation', async () => {
    respondWith(url =>
      url.includes('/cache/delete') ? json({ message: 'boom' }, 500) : json({ result: 'ok' }),
    );
    await expect(featureApi.addTable('sqlite', 'cs', 'db', 't', 'id', 'int', 0)).resolves.toEqual({
      result: 'ok',
    });
  });

  it('a failing mutation is thrown and the cache is not flushed', async () => {
    respondWith(() => json({ message: 'exists' }, 409));
    await expect(featureApi.dropTable('sqlite', 'cs', 'db', 't')).rejects.toMatchObject({
      status: 409,
      message: 'exists',
    });
    expect(sent).toHaveLength(1);
  });
});

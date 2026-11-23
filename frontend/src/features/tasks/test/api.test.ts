// @vitest-environment jsdom
/*
 * This feature's calls to the backend: what each one sends — verb, URL and body — and what it
 * makes of the answer. fetch is replaced, so nothing here needs a backend.
 */
import { describe, expect, it } from 'vitest';

import {
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
  [
    'scheduleTask',
    ['a b', 'a b', 'a b'],
    'POST',
    '/magic/system/tasks/due/add',
    { id: 'a b', repeats: 'a b' },
  ],
  ['deleteSchedule', [7], 'DELETE', '/magic/system/tasks/due/delete?id=7', undefined],
];

describe('endpoint functions', () => {
  installFetchMock(null, () => json({}));

  it.each(ENDPOINTS)('%s sends the expected request', async (...row) => {
    await expectEndpointRow(featureApi, row);
  });
});

describe('optional arguments left out', () => {
  installFetchMock('tok', () => json({ result: 'ok' }));

  it('scheduleTask sends due for a one-off and repeats for a recurring schedule', async () => {
    await featureApi.scheduleTask('t1', '2030-01-01T00:00:00');
    expect(last().body).toEqual({ id: 't1', due: '2030-01-01T00:00:00' });
    await featureApi.scheduleTask('t1', undefined, '5.seconds');
    expect(last().body).toEqual({ id: 't1', repeats: '5.seconds' });
  });
});

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
} from '../../../test/fetchMock';
import * as featureApi from '../lib/api';

/*
 * One row per function: its name, the arguments it is called with (a space in every string shows
 * that it is URL-encoded), and the verb, URL and JSON body it sends.
 */
const ENDPOINTS: EndpointRow[] = [
  [
    'createUser',
    ['a b', 'a b'],
    'POST',
    '/magic/system/magic/users',
    { username: 'a b', password: 'a b' },
  ],
  ['deleteUser', ['a b'], 'DELETE', '/magic/system/magic/users?username=a%20b', undefined],
  [
    'changeUserPassword',
    ['a b', 'a b'],
    'PUT',
    '/magic/system/magic/users',
    { username: 'a b', password: 'a b' },
  ],
  [
    'createRole',
    ['a b', 'a b'],
    'POST',
    '/magic/system/magic/roles',
    { name: 'a b', description: 'a b' },
  ],
  [
    'updateRole',
    ['a b', 'a b'],
    'PUT',
    '/magic/system/magic/roles',
    { name: 'a b', description: 'a b' },
  ],
  ['deleteRole', ['a b'], 'DELETE', '/magic/system/magic/roles?name=a%20b', undefined],
  [
    'addUserToRole',
    ['a b', 'a b'],
    'POST',
    '/magic/system/magic/users_roles',
    { user: 'a b', role: 'a b' },
  ],
  [
    'removeUserFromRole',
    ['a b', 'a b'],
    'DELETE',
    '/magic/system/magic/users_roles?user=a%20b&role=a%20b',
    undefined,
  ],
];

describe('endpoint functions', () => {
  installFetchMock(null, () => json({}));

  it.each(ENDPOINTS)('%s sends the expected request', async (...row) => {
    await expectEndpointRow(featureApi, row);
  });
});

describe('users', () => {
  installFetchMock('tok', () => json({ result: 'success' }));

  it('userExtra returns the value of a field, or empty', () => {
    const user = { username: 'u', extra: [{ type: 'email', value: 'a@b.c' }] } as never;
    expect(featureApi.userExtra(user, 'email')).toBe('a@b.c');
    expect(featureApi.userExtra(user, 'name')).toBe('');
    expect(featureApi.userExtra({ username: 'u' }, 'name')).toBe('');
  });
});

/*
 * Unit tests for the users page's pure helpers — the CSV export row and the
 * roles tab filter. Node environment only.
 */

import { describe, expect, it } from 'vitest';

import { PAGE_SIZE, PROTECTED_ROLES, PROTECTED_USERS } from '../constants';
import { filterRoles, userCsvRow } from '../helpers';

describe('userCsvRow', () => {
  it('flattens a local user with extras and roles', () => {
    expect(
      userCsvRow({
        username: 'jane',
        created: '2024-01-02T03:04:05Z',
        roles: ['admin', 'guest'],
        extra: [
          { type: 'name', value: 'Jane Doe' },
          { type: 'email', value: 'jane@example.com' },
        ],
      }),
    ).toEqual({
      username: 'jane',
      name: 'Jane Doe',
      email: 'jane@example.com',
      roles: 'admin, guest',
      created: '2024-01-02T03:04:05Z',
    });
  });

  it('drops the provider prefix from OIDC usernames, up to the first colon only', () => {
    expect(userCsvRow({ username: 'google:jane@example.com' }).username).toBe('jane@example.com');
    expect(userCsvRow({ username: 'a:b:c' }).username).toBe('b:c');
  });

  it('leaves a leading colon alone, since the prefix must be non-empty', () => {
    expect(userCsvRow({ username: ':jane' }).username).toBe(':jane');
  });

  it('fills missing fields with empty strings', () => {
    expect(userCsvRow({ username: 'bob' })).toEqual({
      username: 'bob',
      name: '',
      email: '',
      roles: '',
      created: '',
    });
  });
});

describe('filterRoles', () => {
  const roles = [
    { name: 'root', description: 'Full access' },
    { name: 'guest', description: 'Read only' },
    { name: 'Editor' },
  ];

  it('returns every role for an empty or blank filter', () => {
    expect(filterRoles(roles, '')).toEqual(roles);
    expect(filterRoles(roles, '   ')).toEqual(roles);
  });

  it('matches the name case-insensitively, ignoring surrounding space', () => {
    expect(filterRoles(roles, '  EDIT ')).toEqual([{ name: 'Editor' }]);
  });

  it('matches the description too', () => {
    expect(filterRoles(roles, 'read')).toEqual([{ name: 'guest', description: 'Read only' }]);
  });

  it('returns nothing when no role matches', () => {
    expect(filterRoles(roles, 'nope')).toEqual([]);
  });
});

describe('constants', () => {
  it('protects root as both a user and a role', () => {
    expect(PROTECTED_USERS.has('root')).toBe(true);
    expect(PROTECTED_ROLES.has('root')).toBe(true);
    expect(PAGE_SIZE).toBe(15);
  });
});

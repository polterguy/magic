/*
 * Unit tests for the pure helpers behind the Endpoints page — module
 * detection, source files, filtering and grouping.
 *
 * Run with `npm run test`. Node environment only.
 */

import { describe, expect, it } from 'vitest';

import type { Endpoint } from '../../../lib/api';
import { groupEndpoints, isVisible, moduleOf, sourceFile } from '../helpers';

const endpoint = (path: string, verb = 'get', auth?: string[]): Endpoint => ({ path, verb, auth });

describe('moduleOf', () => {
  it('names system modules after the folder below magic/system/', () => {
    expect(moduleOf(endpoint('magic/system/auth/authenticate'))).toEqual({
      name: 'auth',
      system: true,
    });
  });

  it('names user modules after the folder below magic/modules/', () => {
    expect(moduleOf(endpoint('magic/modules/crm/contacts'))).toEqual({
      name: 'crm',
      system: false,
    });
  });

  it('names other endpoints after the folder below magic/', () => {
    expect(moduleOf(endpoint('magic/foo/bar'))).toEqual({ name: 'foo', system: false });
  });

  it('falls back when the path stops at the system or modules folder', () => {
    expect(moduleOf(endpoint('magic/system'))).toEqual({ name: 'system', system: true });
    expect(moduleOf(endpoint('magic/modules'))).toEqual({ name: 'modules', system: false });
  });

  it('falls back to the whole path when it has no slash', () => {
    expect(moduleOf(endpoint('magic'))).toEqual({ name: 'magic', system: false });
  });
});

describe('sourceFile', () => {
  it('maps an endpoint to its Hyperlambda file, verb lowercased', () => {
    expect(sourceFile(endpoint('magic/modules/foo/bar', 'GET'))).toBe('/modules/foo/bar.get.hl');
    expect(sourceFile(endpoint('magic/system/auth/x', 'delete'))).toBe('/system/auth/x.delete.hl');
  });

  it('strips the first six characters whatever they are', () => {
    expect(sourceFile(endpoint('other/foo', 'post'))).toBe('/foo.post.hl');
  });
});

describe('isVisible', () => {
  const user = { name: 'crm', system: false };
  const system = { name: 'auth', system: true };

  it('hides system modules unless asked to show them', () => {
    expect(isVisible(endpoint('magic/system/auth/x'), system, '', false, false)).toBe(false);
    expect(isVisible(endpoint('magic/system/auth/x'), system, '', true, false)).toBe(true);
  });

  it('hides endpoints that require a role when public only', () => {
    expect(isVisible(endpoint('magic/modules/crm/x', 'get', ['root']), user, '', false, true)).toBe(
      false,
    );
    expect(isVisible(endpoint('magic/modules/crm/x', 'get', []), user, '', false, true)).toBe(true);
    expect(isVisible(endpoint('magic/modules/crm/x'), user, '', false, true)).toBe(true);
  });

  it('matches the query against path, verb and module name', () => {
    const target = endpoint('magic/modules/crm/contacts', 'POST');
    expect(isVisible(target, user, 'contacts', false, false)).toBe(true);
    expect(isVisible(target, user, 'post', false, false)).toBe(true);
    expect(isVisible(target, user, 'crm', false, false)).toBe(true);
    expect(isVisible(target, user, 'nothing', false, false)).toBe(false);
  });

  it('expects the query already lowercased', () => {
    expect(isVisible(endpoint('magic/modules/crm/contacts'), user, 'CONTACTS', false, false)).toBe(
      false,
    );
  });
});

describe('groupEndpoints', () => {
  const all = [
    endpoint('magic/system/auth/b', 'get'),
    endpoint('magic/modules/zeta/x', 'post'),
    endpoint('magic/modules/alpha/y', 'put'),
    endpoint('magic/modules/alpha/y', 'get'),
    endpoint('magic/modules/alpha/a', 'get', ['root']),
    endpoint('magic/system/auth/a', 'get'),
  ];

  it('groups by module, user modules first, alphabetical within each', () => {
    const groups = groupEndpoints(all, '', true, false);
    expect(groups.map(group => group.key)).toEqual(['user:alpha', 'user:zeta', 'system:auth']);
    expect(groups.map(group => group.folder)).toEqual([
      '/modules/alpha/',
      '/modules/zeta/',
      '/system/auth/',
    ]);
  });

  it('sorts endpoints by path, then verb', () => {
    const [alpha, , auth] = groupEndpoints(all, '', true, false);
    expect(alpha.endpoints.map(e => e.verb + ' ' + e.path)).toEqual([
      'get magic/modules/alpha/a',
      'get magic/modules/alpha/y',
      'put magic/modules/alpha/y',
    ]);
    expect(auth.endpoints.map(e => e.path)).toEqual(['magic/system/auth/a', 'magic/system/auth/b']);
  });

  it('leaves out hidden endpoints and modules left empty', () => {
    const groups = groupEndpoints(all, '', false, true);
    expect(groups.map(group => group.key)).toEqual(['user:alpha', 'user:zeta']);
    expect(groups[0].endpoints).toHaveLength(2);
  });

  it('keeps a system and a user module with the same name apart', () => {
    const groups = groupEndpoints(
      [endpoint('magic/system/foo/x'), endpoint('magic/modules/foo/x')],
      '',
      true,
      false,
    );
    expect(groups.map(group => group.key)).toEqual(['user:foo', 'system:foo']);
  });

  it('gives nothing for no endpoints', () => {
    expect(groupEndpoints([], '', true, false)).toEqual([]);
  });
});

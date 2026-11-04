/*
 * Unit tests for the pure helpers behind the Hyper IDE page — argument
 * conversion, endpoint detection, folder ancestry and workspace restoring.
 *
 * Run with `npm run test`. Node environment only.
 */

import { describe, expect, it } from 'vitest';

import {
  ancestorsOf,
  convertArgument,
  ENDPOINT_VERBS,
  endpointOf,
  type OpenTab,
  PROTECTED_FOLDERS,
  restoredSelection,
  withRestored,
} from '../helpers';

const tab = (path: string, content = 'x'): OpenTab => ({ path, content, saved: content });

describe('PROTECTED_FOLDERS', () => {
  it('protects the root and the system folders', () => {
    for (const folder of ['/', '/system/', '/misc/', '/data/', '/config/', '/etc/', '/modules/']) {
      expect(PROTECTED_FOLDERS.has(folder)).toBe(true);
    }
  });

  it('does not protect folders inside them, or paths without a trailing slash', () => {
    expect(PROTECTED_FOLDERS.has('/modules/foo/')).toBe(false);
    expect(PROTECTED_FOLDERS.has('/system')).toBe(false);
  });
});

describe('convertArgument', () => {
  it('converts every numeric type to a number', () => {
    for (const type of [
      'int',
      'uint',
      'long',
      'ulong',
      'short',
      'ushort',
      'decimal',
      'double',
      'float',
    ]) {
      expect(convertArgument('42', type)).toBe(42);
    }
    expect(convertArgument('3.5', 'decimal')).toBe(3.5);
    expect(convertArgument('-7', 'int')).toBe(-7);
  });

  it('gives NaN for a numeric type with non-numeric input', () => {
    expect(convertArgument('abc', 'int')).toBeNaN();
  });

  it('gives 0 for a numeric type with blank input', () => {
    expect(convertArgument('', 'int')).toBe(0);
    expect(convertArgument('  ', 'double')).toBe(0);
  });

  it('does not truncate a fraction given for an integer type', () => {
    expect(convertArgument('1.9', 'int')).toBe(1.9);
  });

  it('only matches the exact numeric type names', () => {
    expect(convertArgument('42', 'integer')).toBe('42');
    expect(convertArgument('42', 'Int')).toBe('42');
    expect(convertArgument('42', 'byte')).toBe('42');
  });

  it('treats true, 1 and yes as true for bool', () => {
    expect(convertArgument('true', 'bool')).toBe(true);
    expect(convertArgument('1', 'bool')).toBe(true);
    expect(convertArgument('yes', 'bool')).toBe(true);
  });

  it('treats anything else as false for bool, case-sensitively', () => {
    expect(convertArgument('false', 'bool')).toBe(false);
    expect(convertArgument('0', 'bool')).toBe(false);
    expect(convertArgument('', 'bool')).toBe(false);
    expect(convertArgument('TRUE', 'bool')).toBe(false);
    expect(convertArgument('Yes', 'bool')).toBe(false);
  });

  it('passes strings and unknown types through unchanged', () => {
    expect(convertArgument('hello', 'string')).toBe('hello');
    expect(convertArgument('2024-01-01', 'date')).toBe('2024-01-01');
    expect(convertArgument('42', '*')).toBe('42');
  });
});

describe('endpointOf', () => {
  it('recognises every HTTP verb under modules/', () => {
    for (const verb of ENDPOINT_VERBS) {
      expect(endpointOf('/modules/foo/bar.' + verb + '.hl')).toEqual({
        path: 'magic/modules/foo/bar',
        verb,
      });
    }
  });

  it('recognises endpoints under system/', () => {
    expect(endpointOf('/system/auth/authenticate.get.hl')).toEqual({
      path: 'magic/system/auth/authenticate',
      verb: 'get',
    });
  });

  it('accepts paths without, or with several, leading slashes', () => {
    expect(endpointOf('modules/foo/bar.post.hl')).toEqual({
      path: 'magic/modules/foo/bar',
      verb: 'post',
    });
    expect(endpointOf('///modules/foo/bar.put.hl')).toEqual({
      path: 'magic/modules/foo/bar',
      verb: 'put',
    });
  });

  it('rejects files outside modules/ and system/', () => {
    expect(endpointOf('/misc/foo.get.hl')).toBeNull();
    expect(endpointOf('/etc/foo.get.hl')).toBeNull();
    expect(endpointOf('/foo.get.hl')).toBeNull();
  });

  it('rejects socket files and unknown verbs', () => {
    expect(endpointOf('/modules/foo/bar.socket.hl')).toBeNull();
    expect(endpointOf('/modules/foo/bar.head.hl')).toBeNull();
    expect(endpointOf('/modules/foo/bar.options.hl')).toBeNull();
  });

  it('is case-sensitive on the verb', () => {
    expect(endpointOf('/modules/foo/bar.GET.hl')).toBeNull();
  });

  it('rejects plain Hyperlambda files and non-Hyperlambda files', () => {
    expect(endpointOf('/modules/foo/bar.hl')).toBeNull();
    expect(endpointOf('/modules/foo/bar.get.js')).toBeNull();
    expect(endpointOf('/modules/foo/bar.get')).toBeNull();
  });

  it('rejects paths with a dot outside the filename', () => {
    expect(endpointOf('/modules/x.y/foo.get.hl')).toBeNull();
    expect(endpointOf('/modules/foo/bar.baz.get.hl')).toBeNull();
  });

  it('rejects folders and the empty path', () => {
    expect(endpointOf('/modules/foo/')).toBeNull();
    expect(endpointOf('')).toBeNull();
  });
});

describe('ancestorsOf', () => {
  it('lists every folder above a file, outermost first', () => {
    expect(ancestorsOf('/a/b/c.hl')).toEqual(['/a/', '/a/b/']);
  });

  it('gives nothing for a file in the root', () => {
    expect(ancestorsOf('/c.hl')).toEqual([]);
    expect(ancestorsOf('')).toEqual([]);
  });

  it('ignores repeated slashes', () => {
    expect(ancestorsOf('//a//b/c.hl')).toEqual(['/a/', '/a/b/']);
  });

  it('treats the last segment of a folder path as the leaf', () => {
    expect(ancestorsOf('/a/b/')).toEqual(['/a/']);
  });
});

describe('withRestored', () => {
  it('puts the restored tabs in front of the current ones', () => {
    const result = withRestored([tab('/c')], [tab('/a'), tab('/b')]);
    expect(result.map(file => file.path)).toEqual(['/a', '/b', '/c']);
  });

  it('keeps the current tab, and its content, over a restored one with the same path', () => {
    const result = withRestored([tab('/a', 'edited')], [tab('/a', 'fresh'), tab('/b')]);
    expect(result.map(file => file.path)).toEqual(['/b', '/a']);
    expect(result[1].content).toBe('edited');
  });

  it('handles empty lists on either side', () => {
    expect(withRestored([], [tab('/a')]).map(file => file.path)).toEqual(['/a']);
    expect(withRestored([tab('/a')], []).map(file => file.path)).toEqual(['/a']);
    expect(withRestored([], [])).toEqual([]);
  });
});

describe('restoredSelection', () => {
  it('keeps the remembered selection when it was restored', () => {
    expect(restoredSelection([tab('/a'), tab('/b')], '/a')).toBe('/a');
  });

  it('falls back to the last restored tab when the selection was not restored', () => {
    expect(restoredSelection([tab('/a'), tab('/b')], '/gone')).toBe('/b');
  });

  it('falls back to the last restored tab when nothing was selected', () => {
    expect(restoredSelection([tab('/a'), tab('/b')], undefined)).toBe('/b');
    expect(restoredSelection([tab('/a')], '')).toBe('/a');
  });

  it('throws on an empty list — callers only use it with at least one tab', () => {
    expect(() => restoredSelection([], undefined)).toThrow(TypeError);
  });
});

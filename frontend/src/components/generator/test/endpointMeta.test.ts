/*
 * Unit tests for the helpers behind the Execute files wizard's description
 * tooltip — matching a file to its endpoint, reading a file's leading comment,
 * and formatting what the tooltip shows.
 *
 * Run with `npm run test`. Node environment only.
 */

import { describe, expect, it } from 'vitest';

import {
  endpointKey,
  extractFileComment,
  formatEndpointMeta,
  formatFallbackMeta,
} from '../endpointMeta';

describe('endpointKey', () => {
  it('turns a verb-suffixed file into a path|verb key', () => {
    expect(endpointKey('/modules/oauth/authorize.get.hl')).toBe('magic/oauth/authorize|get');
    expect(endpointKey('/modules/shop/orders.delete.hl')).toBe('magic/shop/orders|delete');
    expect(endpointKey('/modules/chat/feed.socket.hl')).toBe('magic/chat/feed|socket');
  });

  it('strips a leading /system/ the same way as /modules/', () => {
    expect(endpointKey('/system/users/list.get.hl')).toBe('magic/users/list|get');
  });

  it('keeps every other leading folder as part of the path', () => {
    expect(endpointKey('/etc/x/y.post.hl')).toBe('magic//etc/x/y|post');
  });

  it('returns null for files without an HTTP verb suffix', () => {
    expect(endpointKey('/modules/shop/startup.hl')).toBeNull();
    expect(endpointKey('/modules/shop/orders.get.js')).toBeNull();
    expect(endpointKey('/modules/shop/orders.GET.hl')).toBeNull();
    expect(endpointKey('/modules/shop/orders.head.hl')).toBeNull();
  });

  it('only treats the last verb segment as the verb', () => {
    expect(endpointKey('/modules/a/get.post.hl')).toBe('magic/a/get|post');
  });
});

describe('extractFileComment', () => {
  it('reads a multi-line block comment without its markers', () => {
    const content = '/*\n * Lists orders.\n * Paged.\n */\n.arguments\n';
    expect(extractFileComment(content)).toBe('Lists orders.\nPaged.');
  });

  it('reads a one-line block comment', () => {
    expect(extractFileComment('/* Lists orders. */\nreturn')).toBe('Lists orders.');
  });

  it('reads text on the opening and closing lines of a block comment', () => {
    expect(extractFileComment('/* First\n * second\n * last */')).toBe('First\nsecond\nlast');
  });

  it('keeps the indentation of a body line without a leading *', () => {
    expect(extractFileComment('/* First\n   last */')).toBe('First\n   last');
  });

  it('reads a leading run of // lines', () => {
    const content = '// Lists orders.\n//   Indented.\n//\n// Paged.\nreturn\n// later';
    expect(extractFileComment(content)).toBe('Lists orders.\n  Indented.\n\nPaged.');
  });

  it('skips leading blank lines', () => {
    expect(extractFileComment('\n\n   \n// Hello')).toBe('Hello');
  });

  it('returns null when the file does not start with a comment', () => {
    expect(extractFileComment('.arguments\n/* not first */')).toBeNull();
    expect(extractFileComment('')).toBeNull();
    expect(extractFileComment('\n  \n')).toBeNull();
  });

  it('returns null for an empty comment', () => {
    expect(extractFileComment('/* */')).toBeNull();
    expect(extractFileComment('//\n//')).toBeNull();
  });

  it('reads an unterminated block comment to the end of the file', () => {
    expect(extractFileComment('/*\n * Never closed')).toBe('Never closed');
  });
});

describe('formatEndpointMeta', () => {
  it('shows the description and each argument', () => {
    expect(
      formatEndpointMeta({
        path: 'magic/modules/shop/orders',
        verb: 'get',
        description: 'Lists orders',
        input: [
          { name: 'limit', type: 'long', description: 'Most rows returned' },
          { name: 'offset', type: 'long' },
        ],
      }),
    ).toBe('Lists orders\n\nArguments:\n  limit: long — Most rows returned\n  offset: long');
  });

  it('falls back to a placeholder description and leaves out empty arguments', () => {
    expect(formatEndpointMeta({ path: 'magic/x', verb: 'get' })).toBe('No description.');
    expect(formatEndpointMeta({ path: 'magic/x', verb: 'get', input: [] })).toBe('No description.');
  });
});

describe('formatFallbackMeta', () => {
  it('shows the description and each argument, flagging mandatory ones', () => {
    expect(
      formatFallbackMeta('Lists orders', {
        limit: { type: 'long' },
        customer: { type: 'string', mandatory: true },
        sort: { type: 'string', mandatory: false },
      }),
    ).toBe(
      'Lists orders\n\nArguments:\n  limit: long\n  customer: string (mandatory)\n  sort: string',
    );
  });

  it('shows just the description when there are no arguments', () => {
    expect(formatFallbackMeta('Lists orders', null)).toBe('Lists orders');
    expect(formatFallbackMeta('Lists orders', {})).toBe('Lists orders');
  });
});

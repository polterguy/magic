/*
 * Unit tests for the OpenID dialog's pure parts — turning the evaluator's slot
 * list into providers, and reading and writing magic.oidc. Node environment only.
 */

import { describe, expect, it } from 'vitest';

import {
  applyOidcValues,
  initialOidcValues,
  OIDC_SLOT_PREFIX,
  oidcProvidersFromSlots,
} from '../oidc';

describe('oidcProvidersFromSlots', () => {
  it('keeps provider slots only, strips the prefix and sorts', () => {
    expect(
      oidcProvidersFromSlots([
        'io.file.load',
        OIDC_SLOT_PREFIX + 'microsoft',
        OIDC_SLOT_PREFIX + 'google',
        'magic.openid.other',
      ]),
    ).toEqual(['google', 'microsoft']);
  });

  it('handles a missing list', () => {
    expect(oidcProvidersFromSlots(null)).toEqual([]);
    expect(oidcProvidersFromSlots(undefined)).toEqual([]);
  });
});

describe('initialOidcValues', () => {
  it('turns every stored setting into text', () => {
    expect(
      initialOidcValues({
        google: { 'client-id': 'abc' },
        microsoft: { tenant: 'common', port: 1, nested: { a: 1 } },
        broken: 'not an object',
      }),
    ).toEqual({
      google: { 'client-id': 'abc' },
      microsoft: { tenant: 'common', port: '1', nested: '{"a":1}' },
      broken: {},
    });
  });
});

describe('applyOidcValues', () => {
  const parse = (text: string | null): unknown => JSON.parse(text ?? 'null');

  it('returns null when the config is not a JSON object', () => {
    expect(applyOidcValues('nope', { google: { 'client-id': 'x' } })).toBeNull();
    expect(applyOidcValues('[]', { google: { 'client-id': 'x' } })).toBeNull();
  });

  it('writes trimmed values and creates magic.oidc when absent', () => {
    expect(parse(applyOidcValues('{}', { google: { 'client-id': '  abc  ' } }))).toEqual({
      magic: { oidc: { google: { 'client-id': 'abc' } } },
    });
  });

  it('keeps other settings and providers it was not given', () => {
    const config = JSON.stringify({
      other: 1,
      magic: {
        smtp: { host: 'h' },
        oidc: { slack: { 'client-id': 's' }, google: { 'client-id': 'old', extra: 'kept' } },
      },
    });
    expect(parse(applyOidcValues(config, { google: { 'client-id': 'new' } }))).toEqual({
      other: 1,
      magic: {
        smtp: { host: 'h' },
        oidc: { slack: { 'client-id': 's' }, google: { 'client-id': 'new', extra: 'kept' } },
      },
    });
  });

  it('removes blank keys, then empty providers, then an empty magic.oidc', () => {
    const config = JSON.stringify({ magic: { oidc: { google: { 'client-id': 'abc' } } } });
    expect(parse(applyOidcValues(config, { google: { 'client-id': '   ' } }))).toEqual({
      magic: {},
    });
  });

  it('removes a blank key but keeps the provider while it has others', () => {
    const config = JSON.stringify({
      magic: { oidc: { microsoft: { 'client-id': 'abc', tenant: 't' } } },
    });
    expect(parse(applyOidcValues(config, { microsoft: { 'client-id': '' } }))).toEqual({
      magic: { oidc: { microsoft: { tenant: 't' } } },
    });
  });

  it('leaves settings nobody edited exactly as they were', () => {
    // Round trip through the dialog: untouched numbers, objects and padding survive.
    const oidc = { google: { nested: { a: 1 }, port: 443, 'client-id': ' padded ' } };
    const config = JSON.stringify({ magic: { oidc } });
    const initial = initialOidcValues(oidc);
    expect(parse(applyOidcValues(config, initial, initial))).toEqual({ magic: { oidc } });
  });

  it('writes only the edited setting, trimmed', () => {
    const oidc = { google: { nested: { a: 1 }, 'client-id': 'old' } };
    const initial = initialOidcValues(oidc);
    const values = { google: { ...initial.google, 'client-id': '  new  ' } };
    expect(parse(applyOidcValues(JSON.stringify({ magic: { oidc } }), values, initial))).toEqual({
      magic: { oidc: { google: { nested: { a: 1 }, 'client-id': 'new' } } },
    });
  });

  it('removes an edited setting cleared to blank', () => {
    const oidc = { google: { 'client-id': 'abc', port: 443 } };
    const initial = initialOidcValues(oidc);
    const values = { google: { ...initial.google, 'client-id': '' } };
    expect(parse(applyOidcValues(JSON.stringify({ magic: { oidc } }), values, initial))).toEqual({
      magic: { oidc: { google: { port: 443 } } },
    });
  });

  it('pretty prints with two spaces', () => {
    expect(applyOidcValues('{}', { google: { 'client-id': 'a' } })).toBe(
      '{\n  "magic": {\n    "oidc": {\n      "google": {\n        "client-id": "a"\n      }\n    }\n  }\n}',
    );
  });
});

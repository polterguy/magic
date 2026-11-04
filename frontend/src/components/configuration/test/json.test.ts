/*
 * Unit tests for the helpers the configuration dialogs read and patch the
 * editor's JSON text with. Node environment only.
 */

import { describe, it, expect } from 'vitest';
import { asObject, configSection, fieldText, parseObject, settingText } from '../json';

describe('asObject', () => {
  it('returns a JSON object as is', () => {
    const value = { a: 1 };
    expect(asObject(value)).toBe(value);
  });

  it('returns an empty object for anything else', () => {
    expect(asObject(undefined)).toEqual({});
    expect(asObject(null)).toEqual({});
    expect(asObject([1, 2])).toEqual({});
    expect(asObject('text')).toEqual({});
    expect(asObject(42)).toEqual({});
    expect(asObject(true)).toEqual({});
  });
});

describe('parseObject', () => {
  it('parses a JSON object', () => {
    expect(parseObject('{"magic":{"smtp":{"host":"x"}}}')).toEqual({
      magic: { smtp: { host: 'x' } },
    });
  });

  it('returns null for invalid JSON', () => {
    expect(parseObject('')).toBeNull();
    expect(parseObject('{')).toBeNull();
    expect(parseObject('{magic: 1}')).toBeNull();
  });

  it('returns null for valid JSON that is not an object', () => {
    expect(parseObject('null')).toBeNull();
    expect(parseObject('[]')).toBeNull();
    expect(parseObject('[{"a":1}]')).toBeNull();
    expect(parseObject('"text"')).toBeNull();
    expect(parseObject('42')).toBeNull();
    expect(parseObject('true')).toBeNull();
  });
});

describe('configSection', () => {
  const text = JSON.stringify({
    magic: {
      smtp: { host: 'mail.example.com', port: 465 },
      git: { github: { username: 'octo' } },
      auth: 'not an object',
    },
  });

  it('follows the path to a nested object', () => {
    expect(configSection(text, 'magic', 'smtp')).toEqual({ host: 'mail.example.com', port: 465 });
    expect(configSection(text, 'magic', 'git', 'github')).toEqual({ username: 'octo' });
  });

  it('returns the whole object for an empty path', () => {
    expect(configSection(text)).toEqual(JSON.parse(text));
  });

  it('returns an empty object for a missing path', () => {
    expect(configSection(text, 'magic', 'oidc')).toEqual({});
    expect(configSection(text, 'nope', 'deeper', 'still')).toEqual({});
  });

  it('returns an empty object when the path passes through a non-object', () => {
    expect(configSection(text, 'magic', 'auth', 'recaptcha')).toEqual({});
    expect(configSection(text, 'magic', 'smtp', 'host')).toEqual({});
  });

  it('returns an empty object when the text is not a JSON object', () => {
    expect(configSection('not json', 'magic')).toEqual({});
    expect(configSection('[1]', 'magic')).toEqual({});
    expect(configSection('')).toEqual({});
  });
});

describe('fieldText', () => {
  it('shows strings as they are', () => {
    expect(fieldText('abc')).toBe('abc');
    expect(fieldText('')).toBe('');
  });

  it('shows numbers, booleans and bigints as text', () => {
    expect(fieldText(465)).toBe('465');
    expect(fieldText(false)).toBe('false');
    expect(fieldText(10n)).toBe('10');
  });

  it('shows structures as JSON', () => {
    expect(fieldText({ a: 1 })).toBe('{"a":1}');
    expect(fieldText([1, 'x'])).toBe('[1,"x"]');
  });

  it('shows nothing for null, undefined and other values', () => {
    expect(fieldText(null)).toBe('');
    expect(fieldText(undefined)).toBe('');
    expect(fieldText(() => 1)).toBe('');
    expect(fieldText(Symbol('s'))).toBe('');
  });
});

describe('settingText', () => {
  it('uses the fallback for a missing or null setting', () => {
    expect(settingText(undefined)).toBe('');
    expect(settingText(null)).toBe('');
    expect(settingText(undefined, '465')).toBe('465');
    expect(settingText(null, 'github.com')).toBe('github.com');
  });

  it('shows a present setting through fieldText, ignoring the fallback', () => {
    expect(settingText('smtp.example.com', 'x')).toBe('smtp.example.com');
    expect(settingText(587, '465')).toBe('587');
    expect(settingText(false, 'x')).toBe('false');
    expect(settingText({ a: 1 })).toBe('{"a":1}');
  });

  it('keeps an empty string rather than using the fallback', () => {
    expect(settingText('', '465')).toBe('');
  });
});

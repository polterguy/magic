/*
 * Unit tests for the pure parts of the client libraries — JWT claim parsing
 * and the small helpers in the API layer that need no backend to verify.
 *
 * Run with `npm run test`. Node environment only: nothing here touches
 * localStorage, the DOM, or the network.
 */

import { describe, it, expect } from 'vitest';
import { tokenExpiration, tokenExpired, tokenRoles, tokenUsername, isRootToken } from './backend';
import { moduleNameFromZip, modelPriceLabel, unfence, aiContextForFile } from './api';

/*
 * Builds an unsigned JWT-shaped token. These helpers only decode the payload,
 * they never verify a signature — that check belongs to the backend.
 */
function makeToken(payload: object): string {
  const b64 = (o: object) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64(payload)}.signature`;
}

describe('tokenExpiration', () => {
  it('returns the exp claim when present', () => {
    expect(tokenExpiration(makeToken({ exp: 1700000000 }))).toBe(1700000000);
  });

  it('returns null for malformed tokens', () => {
    expect(tokenExpiration('not-a-token')).toBeNull();
    expect(tokenExpiration('only.two')).toBeNull();
  });

  it('returns null when exp is not a number', () => {
    expect(tokenExpiration(makeToken({ exp: 'soon' }))).toBeNull();
  });
});

describe('tokenExpired', () => {
  it('is true for tokens in the past', () => {
    expect(tokenExpired(makeToken({ exp: 946684800 }))).toBe(true);
  });

  it('is false for tokens in the future', () => {
    expect(tokenExpired(makeToken({ exp: 4102444800 }))).toBe(false);
  });

  it('is false when the token cannot be parsed', () => {
    expect(tokenExpired('garbage')).toBe(false);
  });
});

describe('tokenRoles', () => {
  it('wraps a single string role in an array', () => {
    expect(tokenRoles(makeToken({ role: 'root' }))).toEqual(['root']);
  });

  it('passes an array of roles through', () => {
    expect(tokenRoles(makeToken({ role: ['root', 'admin'] }))).toEqual(['root', 'admin']);
  });

  it('answers empty when there is no role claim', () => {
    expect(tokenRoles(makeToken({}))).toEqual([]);
    expect(tokenRoles(makeToken({ role: 42 }))).toEqual([]);
  });
});

describe('isRootToken', () => {
  it('is true only when root is among the roles', () => {
    expect(isRootToken(makeToken({ role: 'root' }))).toBe(true);
    expect(isRootToken(makeToken({ role: ['admin', 'root'] }))).toBe(true);
    expect(isRootToken(makeToken({ role: 'admin' }))).toBe(false);
  });
});

describe('tokenUsername', () => {
  it('reads the unique_name claim', () => {
    expect(tokenUsername(makeToken({ unique_name: 'root' }))).toBe('root');
  });

  it('answers empty without the claim', () => {
    expect(tokenUsername(makeToken({}))).toBe('');
  });
});

describe('moduleNameFromZip', () => {
  it('takes the module name from a plain zip filename', () => {
    expect(moduleNameFromZip(new File(['x'], 'crm.zip'))).toBe('crm');
    expect(moduleNameFromZip(new File(['x'], 'my-module_2.zip'))).toBe('my-module_2');
  });

  it('rejects names that would break the install folder convention', () => {
    expect(moduleNameFromZip(new File(['x'], 'CRM.zip'))).toBeNull();
    expect(moduleNameFromZip(new File(['x'], 'two.dots.zip'))).toBeNull();
    expect(moduleNameFromZip(new File(['x'], 'no-extension'))).toBeNull();
  });
});

describe('modelPriceLabel', () => {
  it('is empty when the model or its prices are unknown', () => {
    expect(modelPriceLabel()).toBe('');
    expect(modelPriceLabel({})).toBe('');
    expect(modelPriceLabel({ input_price: 2.5 })).toBe('');
  });

  it('formats known prices per million tokens', () => {
    expect(modelPriceLabel({ input_price: 2.5, output_price: 15 }))
      .toBe('  ·  $2.50 in / $15.00 out per 1M');
  });
});

/*
 * The model is told not to fence its answers, and mostly does not. This is
 * what keeps a stray ```html out of somebody's page when it does.
 */
describe('unfence', () => {
  it('takes the code out of a fenced answer', () => {
    expect(unfence('```html\n<h1>Hi</h1>\n```', 'html')).toBe('<h1>Hi</h1>');
  });

  it('handles a fence with no language tag', () => {
    expect(unfence('```\n<h1>Hi</h1>\n```', 'html')).toBe('<h1>Hi</h1>');
  });

  it('drops explanation before and after the fence', () => {
    const answer = 'Sure! Here is the updated markup:\n\n```html\n<h1>Hi</h1>\n```\n\n' +
      'Let me know if you would like anything else.';
    expect(unfence(answer, 'html')).toBe('<h1>Hi</h1>');
  });

  it('handles a fence with the code on the same line', () => {
    expect(unfence('```<h1>Hi</h1>```', 'html')).toBe('<h1>Hi</h1>');
  });

  it('keeps indentation inside the block', () => {
    expect(unfence('```html\n<div>\n  <p>Hi</p>\n</div>\n```', 'html'))
      .toBe('<div>\n  <p>Hi</p>\n</div>');
  });

  it('leaves an unfenced answer exactly as it came', () => {
    const raw = '<h1>Hi</h1>\n<p>There</p>\n';
    expect(unfence(raw, 'html')).toBe(raw);
  });

  it('leaves markdown alone, where a fence is content and not packaging', () => {
    const doc = '# Title\n\n```js\nconst x = 1;\n```\n';
    expect(unfence(doc, 'md')).toBe(doc);
  });

  it('works for the other languages the editor generates', () => {
    expect(unfence('```sql\nselect 1\n```', 'sql')).toBe('select 1');
    expect(unfence('```css\n.a { color: red }\n```', 'css')).toBe('.a { color: red }');
  });
});

/*
 * The instruction that stops the fences arriving in the first place. It used
 * to be attached only to an EMPTY file, so every edit of existing code went
 * out without it.
 */
describe('aiContextForFile', () => {
  it('forbids fences when changing existing code', () => {
    const context = aiContextForFile('/etc/www/x.html', '<h1>Hi</h1>')!;
    expect(context).toContain('ONLY CODE');
    expect(context).toContain('no markdown code fences');
    expect(context).toContain('<h1>Hi</h1>');
  });

  it('forbids them for an empty file too', () => {
    const context = aiContextForFile('/etc/www/x.html', '')!;
    expect(context).toContain('ONLY CODE');
    expect(context).toContain('no markdown code fences');
  });

  it('sends no system message for Hyperlambda, which has its own', () => {
    expect(aiContextForFile('/modules/x.hl', 'foo')).toBeUndefined();
  });
});

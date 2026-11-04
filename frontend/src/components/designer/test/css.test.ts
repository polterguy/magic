/*
 * Unit tests for the string half of the designer's stylesheet handling.
 * Node environment: the parts that need the browser's CSS engine (parsing a
 * fenced block, matching selectors) are left to the browser.
 */

import { describe, it, expect } from 'vitest';
import { absoluteUrls, joinCss, overrideCss, scriptPaths, splitCss, stylesheetPaths } from '../css';

// A document stand-in that answers querySelectorAll from a table.
function fakeDoc(table: Record<string, Record<string, string>[]>) {
  return {
    querySelectorAll: (selector: string) =>
      (table[selector] ?? []).map(attributes => ({
        getAttribute: (name: string) => attributes[name] ?? null,
      })),
  } as unknown as Document;
}

describe('overrideCss', () => {
  it('writes each selector with its declarations in order', () => {
    expect(overrideCss({ '.a': { color: 'red', margin: '0' }, h1: { 'font-size': '2em' } })).toBe(
      '.a {\n  color: red;\n  margin: 0;\n}\n\nh1 {\n  font-size: 2em;\n}',
    );
  });

  it('leaves out selectors with nothing left in them', () => {
    expect(overrideCss({ '.a': {}, '.b': { color: 'blue' } })).toBe('.b {\n  color: blue;\n}');
    expect(overrideCss({})).toBe('');
  });
});

describe('joinCss', () => {
  it('writes no fence when there are no overrides', () => {
    expect(joinCss('body { margin: 0; }\n\n\n', {})).toBe('body { margin: 0; }\n');
    expect(joinCss('a {}', {}, '\n@media print { a {} }\n')).toBe(
      'a {}\n\n@media print { a {} }\n',
    );
  });

  it('turns an empty stylesheet into a single newline', () => {
    expect(joinCss('', {})).toBe('\n');
  });

  it('fences the block between the author head and tail', () => {
    const css = joinCss('a {}', { '.b': { color: 'red' } }, 'i {}');
    expect(css.startsWith('a {}\n\n/* === Web Designer === */\n/* !! WARNING !!')).toBe(true);
    expect(css).toContain('.b {\n  color: red;\n}\n/* === Web Designer end === */\n\ni {}\n');
  });
});

describe('splitCss', () => {
  it('treats a stylesheet without a fence as all head', () => {
    expect(splitCss('a { color: red; }')).toEqual({
      head: 'a { color: red; }',
      overrides: {},
      tail: '',
    });
  });
});

describe('absoluteUrls', () => {
  const href = 'https://site.test/css/site.css';

  it('resolves relative url() against the stylesheet, keeping the quotes', () => {
    expect(absoluteUrls('a { background: url(img/x.png) }', href)).toBe(
      'a { background: url(https://site.test/css/img/x.png) }',
    );
    expect(absoluteUrls('a { background: url("../x.png") }', href)).toBe(
      'a { background: url("https://site.test/x.png") }',
    );
    expect(absoluteUrls("a { background: url( 'x.png' ) }", href)).toBe(
      "a { background: url('https://site.test/css/x.png') }",
    );
  });

  it('leaves rooted, schemed and fragment addresses alone', () => {
    const css = 'a { b: url(/x.png); c: url(data:image/png;base64,AA); d: url(#f) }';
    expect(absoluteUrls(css, href)).toBe(css);
  });

  it('resolves @import strings', () => {
    expect(absoluteUrls("@import 'other.css';", href)).toBe(
      "@import 'https://site.test/css/other.css';",
    );
    expect(absoluteUrls('@import "/root.css";', href)).toBe('@import "/root.css";');
  });

  it('resolves an empty quoted url() to the stylesheet itself', () => {
    expect(absoluteUrls('a { b: url("") }', href)).toBe(
      'a { b: url("https://site.test/css/site.css") }',
    );
  });
});

describe('stylesheetPaths and scriptPaths', () => {
  const doc = fakeDoc({
    'link[rel~="stylesheet"][href]': [
      { href: 'css/a.css' },
      { href: 'https://cdn.test/b.css' },
      { href: '/c.css?v=2' },
    ],
    'script[src]': [{ src: '../app.js' }, { src: 'https://cdn.test/lib.js' }],
  });
  const base = 'https://site.test/docs/page';

  it('lists local stylesheets as files under the web root, in link order', () => {
    expect(stylesheetPaths(doc, base)).toEqual(['/etc/www/docs/css/a.css', '/etc/www/c.css']);
  });

  it('lists local scripts the same way', () => {
    expect(scriptPaths(doc, base)).toEqual(['/etc/www/app.js']);
  });
});

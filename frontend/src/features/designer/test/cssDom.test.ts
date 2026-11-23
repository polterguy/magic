// @vitest-environment jsdom
/*
 * Unit tests for the parts of the stylesheet handling that need a DOM:
 * choosing selectors for an element, taking over a linked stylesheet, and
 * reading the fenced block.
 */

import { describe, expect, it } from 'vitest';

import { joinCss, matchingSelectors, ownStylesheet, selectorsFor, splitCss } from '../css';
import { TOOL_ATTRIBUTE } from '../html';

function page(html: string) {
  return new DOMParser().parseFromString(
    '<html><head></head><body>' + html + '</body></html>',
    'text/html',
  );
}

describe('selectorsFor without a stylesheet', () => {
  it('starts from the element itself: classes, tag-qualified classes, id, then tag', () => {
    const doc = page('<a id="go" class="btn primary">x</a>');
    expect(selectorsFor(doc.querySelector('a')!, '', {})).toEqual([
      '.btn',
      '.primary',
      'a.btn',
      'a.primary',
      '#go',
      'a',
    ]);
  });

  it('offers just the tag for a bare element', () => {
    const doc = page('<p>x</p>');
    expect(selectorsFor(doc.querySelector('p')!, '', {})).toEqual(['p']);
  });

  it('ignores extra whitespace in the class attribute', () => {
    const doc = page('<p class="  a   b ">x</p>');
    expect(selectorsFor(doc.querySelector('p')!, '', {})).toEqual(['.a', '.b', 'p.a', 'p.b', 'p']);
  });

  it('adds override selectors that match, without duplicating, and skips ones that do not parse', () => {
    const doc = page('<p class="a">x</p>');
    const found = selectorsFor(doc.querySelector('p')!, '', {
      '.a': { color: 'red' },
      'body p': { color: 'blue' },
      '.other': { color: 'green' },
      '[[bad': { color: 'pink' },
    });
    expect(found).toEqual(['.a', 'p.a', 'p', 'body p']);
  });
});

describe('ownStylesheet', () => {
  const file = '/etc/www/css/site.css';

  function linked() {
    const doc = page('');
    doc.head.innerHTML =
      '<link rel="stylesheet" href="https://cloud.test/css/other.css">' +
      '<link rel="stylesheet" href="https://cloud.test/css/site.css">';
    return doc;
  }

  it('disables the link and puts the author css in a marked style right after it', () => {
    const doc = linked();
    ownStylesheet(doc, file, 'a { color: red; }', 'b { color: blue; }');
    const link = doc.querySelector<HTMLLinkElement>('link[href$="site.css"]')!;
    expect(link.disabled).toBe(true);
    expect(link.hasAttribute('data-magic-disabled')).toBe(true);
    const style = link.nextElementSibling as HTMLStyleElement;
    expect(style.tagName).toBe('STYLE');
    expect(style.hasAttribute(TOOL_ATTRIBUTE)).toBe(true);
    expect(style.hasAttribute('data-magic-author')).toBe(true);
    expect(style.textContent).toBe('a { color: red; }\nb { color: blue; }');
  });

  it('leaves other stylesheets alone', () => {
    const doc = linked();
    ownStylesheet(doc, file, '', '');
    const other = doc.querySelector<HTMLLinkElement>('link[href$="other.css"]')!;
    expect(other.disabled).toBeFalsy();
    expect(other.hasAttribute('data-magic-disabled')).toBe(false);
  });

  it('reuses its own style element when called again', () => {
    const doc = linked();
    ownStylesheet(doc, file, 'a {}', '');
    ownStylesheet(doc, file, 'c {}', '');
    expect(doc.querySelectorAll('style[data-magic-author]')).toHaveLength(1);
    expect(doc.querySelector('style[data-magic-author]')!.textContent).toBe('c {}\n');
  });

  it('makes relative urls in the author css absolute against the link', () => {
    const doc = linked();
    ownStylesheet(doc, file, 'a { background: url(img/x.png) }', '');
    expect(doc.querySelector('style[data-magic-author]')!.textContent).toContain(
      'url(https://cloud.test/css/img/x.png)',
    );
  });

  it('does nothing when no link points at the file', () => {
    const doc = linked();
    ownStylesheet(doc, '/etc/www/css/missing.css', 'a {}', '');
    expect(doc.querySelector('style')).toBeNull();
    expect(doc.querySelector('[data-magic-disabled]')).toBeNull();
  });
});

describe('splitCss without parsing', () => {
  it('finds nothing to split when the fence is absent', () => {
    expect(splitCss('')).toEqual({ head: '', overrides: {}, tail: '' });
  });

  it('keeps the whole text as head when there is no opening marker, even with a closing one', () => {
    const css = 'a {}\n/* === Web Designer end === */\nb {}';
    expect(splitCss(css)).toEqual({ head: css, overrides: {}, tail: '' });
  });
});

describe('stylesheet parsing', () => {
  it('matchingSelectors lists the rules an element matches, skipping pseudo and universal ones', () => {
    const doc = page('<a class="btn">x</a>');
    const css =
      '* { margin: 0 } a { color: red } .btn:hover { color: blue } .btn { color: green } a { top: 0 } .none {}';
    expect(matchingSelectors(css, doc.querySelector('a')!)).toEqual(['a', '.btn']);
  });

  it('splitCss reads the block back and keeps the author text either side', () => {
    const css = joinCss('a { color: red; }', { '.b': { color: 'blue' } }, 'i { top: 0; }');
    const split = splitCss(css);
    expect(split.head.trim()).toBe('a { color: red; }');
    expect(split.overrides).toEqual({ '.b': { color: 'blue' } });
    expect(split.tail.trim()).toBe('i { top: 0; }');
  });

  it('splitCss reads a block written under the old name', () => {
    const css =
      'a {}\n/* === App Designer === */\n.x { color: red; }\n/* === App Designer end === */\nz {}';
    const split = splitCss(css);
    expect(split.overrides).toEqual({ '.x': { color: 'red' } });
    expect(split.tail.trim()).toBe('z {}');
  });

  it('splitCss lifts a hand-written media query out of an unclosed block into the tail', () => {
    const css =
      'a {}\n/* === Web Designer === */\n.x { color: red; }\n@media print { .x { color: black; } }';
    const split = splitCss(css);
    expect(split.overrides).toEqual({ '.x': { color: 'red' } });
    expect(split.tail).toContain('@media print');
  });

  it('splitCss merges repeated selectors, later declarations winning', () => {
    const css =
      '/* === Web Designer === */\n.x { color: red; padding-top: 1px; }\n.x { color: blue; }\n/* === Web Designer end === */';
    expect(splitCss(css).overrides).toEqual({ '.x': { color: 'blue', 'padding-top': '1px' } });
  });

  it('selectorsFor adds the stylesheet rules that match', () => {
    const doc = page('<p class="a">x</p>');
    expect(selectorsFor(doc.querySelector('p')!, 'body p { color: red }', {})).toEqual([
      '.a',
      'p.a',
      'p',
      'body p',
    ]);
  });
});

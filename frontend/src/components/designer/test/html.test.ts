// @vitest-environment jsdom
/*
 * Unit tests for the designer's document handling: preparing a file for the
 * canvas, serializing it back out, server-filled slots, and the sandbox
 * attributes. Needs a DOM, so jsdom.
 */

import { describe, expect, it } from 'vitest';

import {
  canContainChildren,
  hasSlot,
  isSlot,
  liveSandbox,
  prepareDocument,
  serializeDocument,
  SLOT_ATTRIBUTE,
  slotsDropped,
  TOOL_ATTRIBUTE,
} from '../html';

function parse(source: string) {
  return new DOMParser().parseFromString(source, 'text/html');
}

describe('hasSlot', () => {
  it('detects a {{expression}}', () => {
    expect(hasSlot('Hello {{name}}')).toBe(true);
    expect(hasSlot('{{ a.b }}')).toBe(true);
  });

  it('ignores plain text and unbalanced braces', () => {
    expect(hasSlot('Hello')).toBe(false);
    expect(hasSlot('{{open')).toBe(false);
    expect(hasSlot('{ {x} }')).toBe(false);
    expect(hasSlot('')).toBe(false);
  });
});

describe('slotsDropped', () => {
  it('is empty when nothing was lost', () => {
    expect(slotsDropped('{{a}}', '{{a}}')).toEqual([]);
    expect(slotsDropped('plain', 'other')).toEqual([]);
  });

  it('reports the expression that went when one was replaced by text', () => {
    expect(slotsDropped('Hi {{name}}', 'Hi Bob')).toEqual(['{{name}}']);
  });

  it('does not call a rename a loss, since the count is unchanged', () => {
    expect(slotsDropped('{{a}}', '{{b}}')).toEqual([]);
  });

  it('reports only the one that is no longer there when one of two goes', () => {
    expect(slotsDropped('{{a}} {{b}}', '{{a}} x')).toEqual(['{{b}}']);
  });

  it('is empty when slots were added', () => {
    expect(slotsDropped('x', '{{a}}')).toEqual([]);
  });
});

describe('isSlot', () => {
  it('is true only for an element carrying the slot marker', () => {
    const doc = parse('<p><span data-magic-slot="">{{x}}</span><span>y</span>text</p>');
    const [marked, plain] = Array.from(doc.querySelectorAll('span'));
    expect(isSlot(marked)).toBe(true);
    expect(isSlot(plain)).toBe(false);
    expect(isSlot(doc.querySelector('p')!.lastChild!)).toBe(false);
  });
});

describe('liveSandbox', () => {
  it('keeps allow-same-origin in the order scripts, same-origin, forms, popups', () => {
    expect(liveSandbox(false)).toBe('allow-scripts allow-same-origin allow-forms allow-popups');
  });

  it('drops allow-same-origin when sharing the cloudlet origin', () => {
    expect(liveSandbox(true)).toBe('allow-scripts allow-forms allow-popups');
  });
});

describe('canContainChildren', () => {
  const doc = parse('<div></div><img><script></script><style></style><pre></pre><br>');
  const can = (selector: string) => canContainChildren(doc.querySelector(selector)!);

  it('allows ordinary containers', () => {
    expect(can('div')).toBe(true);
  });

  it('refuses void elements', () => {
    expect(can('img')).toBe(false);
    expect(can('br')).toBe(false);
  });

  it('refuses raw-text elements', () => {
    expect(can('script')).toBe(false);
    expect(can('style')).toBe(false);
    expect(can('pre')).toBe(false);
  });
});

describe('prepareDocument', () => {
  const source = '<!doctype html><html><head><title>T</title></head><body><p>Hi</p></body></html>';
  // Checked as text: the output is a serialized document, and the tests read it as one.
  const bodyOf = (out: string) => out.slice(out.lastIndexOf('<body'));
  // The text of some markup, the tags dropped.
  const textOf = (markup: string) =>
    markup
      .split('<')
      .map(part => part.slice(part.indexOf('>') + 1))
      .join('');
  const slotSpans = new RegExp('<span[^>]*' + SLOT_ATTRIBUTE + '[^>]*>([^<]*)</span>', 'g');

  it('starts with a doctype and puts the base first in the head', () => {
    const out = prepareDocument(source, 'https://cloud.test/');
    expect(out.startsWith('<!doctype html>\n')).toBe(true);
    const head = out.slice(out.indexOf('<head>') + '<head>'.length);
    expect(head.trimStart().startsWith('<base ')).toBe(true);
    const base = head.slice(head.indexOf('<base '), head.indexOf('>') + 1);
    expect(base).toContain('href="https://cloud.test/"');
    expect(base).toContain(TOOL_ATTRIBUTE);
  });

  it('adds the canvas stylesheet and the overrides sheet, both marked as tool-owned', () => {
    const out = prepareDocument(source, '/');
    const styles = out
      .split('<style')
      .slice(1)
      .map(chunk => '<style' + chunk.slice(0, chunk.indexOf('</style>') + '</style>'.length));
    expect(styles).toHaveLength(2);
    styles.forEach(style => expect(style).toContain(TOOL_ATTRIBUTE));
    expect(styles[0]).toContain('[data-magic-slot]');
    expect(styles[1]).toContain('data-magic-overrides');
    expect(styles[1]).toMatch(/><\/style>$/);
  });

  it('wraps every {{expression}} in the body in a marked span', () => {
    const out = prepareDocument(
      '<html><body><p>Hello {{user.name}}, you have {{count}} items</p></body></html>',
      '/',
    );
    const chips = Array.from(bodyOf(out).matchAll(slotSpans), match => match[1]);
    expect(chips).toEqual(['{{user.name}}', '{{count}}']);
    expect(textOf(bodyOf(out))).toContain('Hello {{user.name}}, you have {{count}} items');
  });

  it('leaves slots inside script, style, pre and textarea alone', () => {
    const out = prepareDocument(
      '<html><body><script>var a = "{{a}}";</script><style>.x{content:"{{b}}"}</style>' +
        '<pre>{{c}}</pre><textarea>{{d}}</textarea></body></html>',
      '/',
    );
    expect(bodyOf(out)).not.toContain(SLOT_ATTRIBUTE);
    expect(bodyOf(out)).toContain('{{a}}');
  });

  it('does not mark slots in the head', () => {
    const out = prepareDocument(
      '<html><head><title>{{title}}</title></head><body></body></html>',
      '/',
    );
    expect(out.slice(0, out.lastIndexOf('<body'))).not.toContain('<span');
    expect(out).toContain('<title>{{title}}</title>');
  });

  it('copes with an empty file', () => {
    const out = prepareDocument('', '/');
    expect(out).toContain('<base ');
    expect(out).toContain('<body');
  });
});

describe('serializeDocument', () => {
  it('writes the doctype and indents block elements', () => {
    const doc = parse(
      '<!doctype html><html><head><title>T</title></head><body><div><p>Hi</p></div></body></html>',
    );
    expect(serializeDocument(doc)).toBe(
      [
        '<!doctype html>',
        '<html>',
        '  <head>',
        '    <title>T</title>',
        '  </head>',
        '  <body>',
        '    <div>',
        '      <p>Hi</p>',
        '    </div>',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
    );
  });

  it('omits the doctype when the document has none', () => {
    const doc = document.implementation.createHTMLDocument('x');
    doc.doctype!.remove();
    expect(serializeDocument(doc).startsWith('<html>')).toBe(true);
  });

  it('writes void elements without a closing tag', () => {
    const doc = parse('<body><div><img src="a.png" alt=""><hr><br></div></body>');
    const out = serializeDocument(doc);
    expect(out).toContain('<img src="a.png" alt="">');
    expect(out).toContain('<hr>');
    expect(out).not.toContain('</img>');
    expect(out).not.toContain('</hr>');
  });

  it('keeps inline content on one line and collapses whitespace in text', () => {
    const doc = parse('<body><p>Some   <b>bold</b>\n  and <i>italic</i> text</p></body>');
    expect(serializeDocument(doc)).toContain('<p>Some <b>bold</b> and <i>italic</i> text</p>');
  });

  it('escapes &, < and > in text and & and " in attribute values', () => {
    const doc = parse('<body><p title="a &amp; &quot;b&quot;">1 &lt; 2 &amp; 3 &gt; 2</p></body>');
    const out = serializeDocument(doc);
    expect(out).toContain('title="a &amp; &quot;b&quot;"');
    expect(out).toContain('1 &lt; 2 &amp; 3 &gt; 2');
  });

  it('quotes empty attributes', () => {
    const doc = parse('<body><div><p hidden>x</p></div></body>');
    expect(serializeDocument(doc)).toContain('<p hidden="">x</p>');
  });

  it('keeps script and style text, and their own indentation, untouched', () => {
    const doc = parse(
      '<head><style>\n  a { color: red; }\n</style><script>\nif (a < b) {\n  go();\n}\n</script></head><body></body>',
    );
    const out = serializeDocument(doc);
    expect(out).toContain('    <style>\n  a { color: red; }\n    </style>');
    expect(out).toContain('    <script>\nif (a < b) {\n  go();\n}\n    </script>');
  });

  it('writes an empty script on one line', () => {
    const doc = parse('<head><script src="a.js"></script></head><body></body>');
    expect(serializeDocument(doc)).toContain('<script src="a.js"></script>');
  });

  it('keeps pre content on one line exactly as it is', () => {
    const doc = parse('<body><div><pre>  a\n  b</pre></div></body>');
    expect(serializeDocument(doc)).toContain('<pre>  a\n  b</pre>');
  });

  it('keeps text and comments that sit among block elements', () => {
    const doc = parse('<body><div>loose  text<!-- note --><p>x</p></div></body>');
    const out = serializeDocument(doc);
    expect(out).toContain('      loose text');
    expect(out).toContain('<!-- note -->');
  });

  it('keeps comments inside inline content', () => {
    const doc = parse('<body><p>a<!--c--><b>b</b></p></body>');
    expect(serializeDocument(doc)).toContain('<p>a<!--c--><b>b</b></p>');
  });

  it('removes everything the designer added and every data-magic- attribute', () => {
    const tool = TOOL_ATTRIBUTE + '=""';
    const prepared = parse(
      '<html><head><base href="https://cloud.test/" ' +
        tool +
        '><title>T</title><style ' +
        tool +
        '>.x{}</style><style ' +
        tool +
        ' data-magic-overrides=""></style></head>' +
        '<body><div data-magic-empty="" id="a"><p>Hi</p></div></body></html>',
    );
    const out = serializeDocument(prepared);
    expect(out).not.toContain('<base');
    expect(out).not.toContain('data-magic');
    expect(out).not.toContain('<style');
    expect(out).toContain('<div id="a">');
  });

  it('unwraps slot markers and editing spans rather than deleting their text', () => {
    const prepared = parse(
      '<html><body><p>Hello <span ' +
        SLOT_ATTRIBUTE +
        '="">{{name}}</span> and <span data-magic-editing="">typed</span></p></body></html>',
    );
    const out = serializeDocument(prepared);
    expect(out).toContain('<p>Hello {{name}} and typed</p>');
    expect(out).not.toContain('span');
  });

  it('switches a link the designer disabled back on', () => {
    const doc = parse(
      '<head><link rel="stylesheet" href="a.css" disabled="" data-magic-disabled=""></head><body></body>',
    );
    const out = serializeDocument(doc);
    expect(out).toContain('<link rel="stylesheet" href="a.css">');
    expect(out).not.toContain('disabled');
  });

  it('does not change the document it was given', () => {
    const doc = parse(
      '<body><span data-magic-slot="">{{a}}</span><i data-magic-tool=""></i></body>',
    );
    serializeDocument(doc);
    expect(doc.querySelector('[data-magic-slot]')).not.toBeNull();
    expect(doc.querySelector('[data-magic-tool]')).not.toBeNull();
  });

  it('leaves a document that is already in its own format exactly as it is', () => {
    const formatted = [
      '<!doctype html>',
      '<html>',
      '  <head>',
      '    <title>T</title>',
      '  </head>',
      '  <body>',
      '    <header>',
      '      <h1>Hi <em>there</em></h1>',
      '    </header>',
      '    <main>',
      '      <p>One</p>',
      '      <p>Two</p>',
      '    </main>',
      '  </body>',
      '</html>',
      '',
    ].join('\n');
    expect(serializeDocument(parse(formatted))).toBe(formatted);
  });
});

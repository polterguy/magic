// @vitest-environment jsdom
/*
 * Unit tests for the block palette: the invariants of the GROUPS data, the
 * house-style class a block borrows from its page, and customBlock.
 */

import { describe, expect, it } from 'vitest';

import { customBlock, GROUPS } from '../palette';

function pageWith(body: string) {
  const doc = new DOMParser().parseFromString(
    '<html><body>' + body + '</body></html>',
    'text/html',
  );
  return doc;
}

const allBlocks = GROUPS.flatMap(group => group.blocks);

function blockByKey(key: string) {
  const found = allBlocks.find(candidate => candidate.key === key);
  if (!found) {
    throw new Error('No block ' + key);
  }
  return found;
}

describe('GROUPS', () => {
  it('has labelled, non-empty groups', () => {
    expect(GROUPS.length).toBeGreaterThan(0);
    GROUPS.forEach(group => {
      expect(group.label).not.toBe('');
      expect(group.blocks.length).toBeGreaterThan(0);
    });
  });

  it('gives every block a key, a label and a build function', () => {
    allBlocks.forEach(item => {
      expect(item.key).not.toBe('');
      expect(item.label).not.toBe('');
      expect(typeof item.build).toBe('function');
    });
  });

  it('has unique keys across all groups', () => {
    const keys = allBlocks.map(item => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('builds non-empty markup for every block on an empty page', () => {
    const doc = pageWith('');
    allBlocks.forEach(item => {
      expect(item.build(doc, doc.body), item.key).not.toBe('');
    });
  });

  it('builds markup that parses to one root element, apart from the text block', () => {
    const doc = pageWith('');
    allBlocks
      .filter(item => item.key !== 'text')
      .forEach(item => {
        const holder = doc.createElement('template');
        holder.innerHTML = item.build(doc, doc.body);
        expect(holder.content.children.length, item.key).toBe(1);
        expect(holder.content.childNodes.length, item.key).toBe(1);
      });
  });

  it('requires the widget runtime exactly for the custom-element blocks', () => {
    allBlocks.forEach(item => {
      if (item.key.startsWith('magic-')) {
        expect(item.requires?.scripts, item.key).toEqual(['/assets/magic-widgets.js']);
        expect(item.requires?.stylesheets, item.key).toEqual(['/assets/magic-widgets.css']);
        item.build(pageWith(''), document.body);
      } else {
        expect(item.requires, item.key).toBeUndefined();
      }
    });
  });

  it('builds the widget with its own tag as the root', () => {
    const doc = pageWith('');
    ['magic-data-grid', 'magic-data-create', 'magic-login-form', 'magic-require-login'].forEach(
      key => {
        expect(
          blockByKey(key)
            .build(doc, doc.body)
            .startsWith('<' + key),
        ).toBe(true);
      },
    );
  });
});

describe('plain blocks', () => {
  const doc = pageWith('');

  it('inserts the text block as bare text', () => {
    expect(blockByKey('text').build(doc, doc.body)).toBe('Some text');
  });

  it('builds headings with their level in the label', () => {
    expect(blockByKey('h3').label).toBe('H3');
    expect(blockByKey('h3').build(doc, doc.body)).toBe('<h3>Heading</h3>');
  });

  it('builds void elements without a closing tag', () => {
    expect(blockByKey('br').build(doc, doc.body)).toBe('<br>');
    expect(blockByKey('hr').build(doc, doc.body)).toBe('<hr>');
  });

  it('builds fields with their type and an optional placeholder', () => {
    expect(blockByKey('input-email').build(doc, doc.body)).toBe(
      '<input type="email" placeholder="name@example.com">',
    );
    expect(blockByKey('input-password').build(doc, doc.body)).toBe('<input type="password">');
  });

  it('builds skeletons for elements that are useless empty', () => {
    expect(blockByKey('ul').build(doc, doc.body).match(/<li>/g)).toHaveLength(3);
    expect(blockByKey('ol').build(doc, doc.body)).toContain('Third item');
    expect(blockByKey('select').build(doc, doc.body)).toContain('<option>Second</option>');
    expect(blockByKey('table').build(doc, doc.body)).toContain('<thead>');
    expect(blockByKey('details').build(doc, doc.body)).toContain('<summary>');
  });

  it('builds an image with a data-URI placeholder and an empty alt', () => {
    const html = blockByKey('img').build(doc, doc.body);
    expect(html).toContain('src="data:image/svg+xml;utf8,');
    expect(html).toContain('alt=""');
  });
});

describe('house style', () => {
  it('borrows the class of the same tag among the neighbours first', () => {
    const doc = pageWith(
      '<div id="a"><button class="nav">x</button></div>' +
        '<button class="cta">1</button><button class="cta">2</button>',
    );
    const context = doc.querySelector('#a')!;
    expect(blockByKey('button').build(doc, context)).toBe('<button class="nav">Button</button>');
  });

  it('falls back to a class most of the page agrees on', () => {
    const doc = pageWith(
      '<button class="cta">1</button><button class="cta">2</button><button class="other">3</button>' +
        '<div id="empty"></div>',
    );
    expect(blockByKey('button').build(doc, doc.querySelector('#empty')!)).toBe(
      '<button class="cta">Button</button>',
    );
  });

  it('does not guess when no class is a majority page-wide', () => {
    const doc = pageWith(
      '<button class="a">1</button><button class="b">2</button><div id="empty"></div>',
    );
    expect(blockByKey('button').build(doc, doc.querySelector('#empty')!)).toBe(
      '<button>Button</button>',
    );
  });

  it('adds no class when the page has none of that tag or only unclassed ones', () => {
    const doc = pageWith('<p>one</p><p class="  ">two</p>');
    expect(blockByKey('p').build(doc, doc.body)).toBe('<p>Some text to edit.</p>');
  });

  it('gives list items inside a list block the neighbours class', () => {
    const doc = pageWith('<ul><li class="item">x</li></ul><div id="empty"></div>');
    const html = blockByKey('ul').build(doc, doc.querySelector('#empty')!);
    expect(html).toContain('<li class="item">First item</li>');
  });
});

describe('customBlock', () => {
  it('builds an empty element of the typed tag', () => {
    const item = customBlock('my-widget')!;
    expect(item.key).toBe('custom:my-widget');
    expect(item.label).toBe('<my-widget>');
    const doc = pageWith('');
    expect(item.build(doc, doc.body)).toBe('<my-widget></my-widget>');
  });

  it('trims, lower-cases and strips characters a tag cannot have', () => {
    expect(customBlock('  DIV ')!.key).toBe('custom:div');
    expect(customBlock('<b>old</b>')!.key).toBe('custom:boldb');
    expect(customBlock('x y_z!')!.key).toBe('custom:xyz');
  });

  it('is null when nothing usable is left', () => {
    expect(customBlock('')).toBeNull();
    expect(customBlock('   ')).toBeNull();
    expect(customBlock('!!! ___')).toBeNull();
  });

  it('borrows the house class like any other block', () => {
    const doc = pageWith('<my-card class="card"></my-card>');
    expect(customBlock('my-card')!.build(doc, doc.body)).toBe('<my-card class="card"></my-card>');
  });
});

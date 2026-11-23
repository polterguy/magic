/*
 * Unit tests for the parts of the node helpers that need no browser:
 * walking positions in a tree and rewriting a run of text. Node
 * environment, so the tree is made of plain objects.
 */

import { describe, expect, it } from 'vitest';

import { nodeAt, pathTo, writeText } from '../nodes';

interface FakeNode {
  name: string;
  parentNode: FakeNode | null;
  childNodes: FakeNode[];
}

function tree(name: string, ...children: FakeNode[]): FakeNode {
  const node: FakeNode = { name, parentNode: null, childNodes: children };
  children.forEach(child => (child.parentNode = node));
  return node;
}

const leaf = tree('leaf');
const middle = tree('middle', tree('first'), leaf);
const root = tree('root', tree('zero'), middle);
const asNode = (node: FakeNode) => node as unknown as Node;

describe('pathTo', () => {
  it('walks child indices from the root down to the node', () => {
    expect(pathTo(asNode(leaf), asNode(root))).toEqual([1, 1]);
    expect(pathTo(asNode(middle), asNode(root))).toEqual([1]);
  });

  it('is empty for the root itself', () => {
    expect(pathTo(asNode(root), asNode(root))).toEqual([]);
  });

  it('is null for a node outside the root', () => {
    expect(pathTo(asNode(tree('stray')), asNode(root))).toBeNull();
    expect(pathTo(asNode(root), asNode(middle))).toBeNull();
  });
});

describe('nodeAt', () => {
  it('finds the node at a path', () => {
    expect(nodeAt(asNode(root), [1, 1])).toBe(leaf);
  });

  it('stops at the deepest step that still exists', () => {
    expect(nodeAt(asNode(root), [1, 5])).toBe(middle);
    expect(nodeAt(asNode(root), [1, 1, 0])).toBe(leaf);
  });

  it('is null when not even the first step exists, or the path is empty', () => {
    expect(nodeAt(asNode(root), [7])).toBeNull();
    expect(nodeAt(asNode(root), [])).toBeNull();
  });
});

describe('writeText', () => {
  const text = (data: string) => ({ data }) as unknown as Text;

  it('replaces the words and keeps the whitespace around them', () => {
    const node = text('\n  Hello world  ');
    writeText(node, 'Goodbye');
    expect(node.data).toBe('\n  Goodbye  ');
  });

  it('can empty the words out', () => {
    const node = text('Hello');
    writeText(node, '');
    expect(node.data).toBe('');
  });

  it('restores the whitespace on both sides when an emptied run is retyped', () => {
    const node = text('\n  Hi ');
    writeText(node, '');
    expect(node.data).toBe('\n   ');
    writeText(node, 'x');
    expect(node.data).toBe('\n  x ');
  });

  it('never grows the whitespace over repeated clears and retypes', () => {
    const node = text('  Hi  ');
    for (let round = 0; round < 3; round++) {
      writeText(node, '');
      expect(node.data).toBe('    ');
      writeText(node, 'x');
      expect(node.data).toBe('  x  ');
    }
  });

  it('treats a whitespace-only run it never wrote as all leading whitespace', () => {
    const node = text('   ');
    writeText(node, 'x');
    expect(node.data).toBe('   x');
  });
});

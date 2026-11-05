/*
 * The Hyperlambda tokenizer's less travelled paths: string literals as names and values, multi
 * line strings that close mid line, comments with indentation, the error cases, names that only
 * look special, the vocabulary read from localStorage, and the parser spec itself.
 */
import { StringStream } from '@codemirror/language';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { hyperlambdaLanguage, hyperlambdaParser } from '../hyperlambda';

type State = NonNullable<ReturnType<NonNullable<typeof hyperlambdaParser.startState>>>;

interface Token {
  text: string;
  style: string | null;
}

function tokenizeLine(line: string, state: State): Token[] {
  const stream = new StringStream(line, 4, 3);
  const tokens: Token[] = [];
  while (!stream.eol()) {
    const start = stream.pos;
    stream.start = start;
    const style = hyperlambdaParser.token(stream, state);
    if (stream.pos === start) {
      stream.next();
    }
    tokens.push({ text: line.slice(start, stream.pos), style });
  }
  return tokens;
}

function tokenizeDoc(doc: string): Token[][] {
  const state = hyperlambdaParser.startState!(4);
  return doc.split('\n').map(line => tokenizeLine(line, state));
}

// The styles of every token on every line, which is what most cases are about.
function styled(doc: string) {
  return tokenizeDoc(doc).map(line => line.map(token => token.style));
}

let stored: string | null;

beforeEach(() => {
  stored = null;
  globalThis._vocabulary = [];
  vi.stubGlobal('localStorage', { getItem: () => stored });
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete globalThis._vocabulary;
});

describe('single line string literals', () => {
  it('styles a string used as a name', () => {
    expect(tokenizeDoc('"my name"')[0]).toEqual([{ text: '"my name"', style: 'string' }]);
  });

  it('allows an escaped quote inside the string', () => {
    expect(tokenizeDoc('"a\\"b"')[0]).toEqual([{ text: '"a\\"b"', style: 'string' }]);
  });

  it('lets a string name carry a value', () => {
    expect(tokenizeDoc('"key":int:5')[0].map(token => token.style)).toEqual([
      'string',
      'def',
      'def',
      'property',
    ]);
  });

  it('flags text after the closing quote that is not a value', () => {
    const doc = tokenizeDoc('"a" b\nnext');
    expect(doc[0][0].style).toBe('error');
    // The rest of the document stays red.
    expect(doc[1][0].style).toBe('error');
  });

  it('allows spaces between the closing quote and the value', () => {
    expect(tokenizeDoc('"a" :b')[0][0].style).toBe('string');
  });

  it('flags a string that never closes', () => {
    expect(styled('"abc\nnext')).toEqual([['error'], ['error']]);
  });

  it('flags a string name that is indented too far', () => {
    expect(styled('foo\n      "bar"')[1][0]).toBe('error');
  });

  it('styles a string used as a value and expects a name afterwards', () => {
    const doc = tokenizeDoc('foo:"bar"\nbaz');
    expect(doc[0].map(token => token.style)).toEqual([null, 'def', 'string']);
    expect(doc[1][0].style).toBeNull();
  });

  it('flags a value string followed by garbage', () => {
    expect(tokenizeDoc('foo:"bar" x')[0].at(-1)?.style).toBe('error');
  });
});

describe('multi line strings', () => {
  it('closes on the same line and carries a value after it', () => {
    const tokens = tokenizeDoc('@"name":int:5')[0];
    expect(tokens.map(token => token.style)).toEqual(['string', 'def', 'def', 'property']);
  });

  it('closes on the same line with nothing after it', () => {
    const doc = tokenizeDoc('@"name"\nnext');
    expect(doc[0]).toEqual([{ text: '@"name"', style: 'string' }]);
    expect(doc[1][0].style).toBeNull();
  });

  it('treats a doubled quote as escaped and keeps the string open', () => {
    const doc = tokenizeDoc('@"say ""hi""\nmore"');
    expect(doc[0][0].style).toBe('string');
    expect(doc[1]).toEqual([{ text: 'more"', style: 'string' }]);
  });

  it('flags garbage after a multi line string used as a name', () => {
    expect(tokenizeDoc('@"name" x')[0].at(-1)?.style).toBe('error');
  });

  it('as a value, ends the line and returns to names', () => {
    const doc = tokenizeDoc('foo:@"one\ntwo"\nbar');
    expect(doc[0].map(token => token.style)).toEqual([null, 'def', 'string']);
    expect(doc[1]).toEqual([{ text: 'two"', style: 'string' }]);
    expect(doc[2][0].style).toBeNull();
  });

  it('flags garbage after a multi line string used as a value', () => {
    expect(tokenizeDoc('foo:@"one" x')[0].at(-1)?.style).toBe('error');
  });

  it('restores indentation after a multi line string', () => {
    const doc = tokenizeDoc('foo\n   @"a\nb"\n   bar');
    expect(doc[3][0].style).toBeNull();
  });

  it('flags a multi line string name that is indented too far', () => {
    expect(styled('foo\n      @"a"')[1][0]).toBe('error');
  });
});

describe('names that only look special', () => {
  it('treats a name starting with @ but not @" as an ordinary name', () => {
    expect(tokenizeDoc('@foo')[0]).toEqual([{ text: '@foo', style: null }]);
  });

  it('keeps reading an @ name up to its value', () => {
    expect(tokenizeDoc('@foo:bar')[0].map(token => token.style)).toEqual([null, 'def', 'property']);
  });

  it('treats a name starting with / but not a comment as an ordinary name', () => {
    expect(tokenizeDoc('/path')[0].map(token => token.style)).toEqual([null]);
  });

  it('follows an ordinary / name with a normal next line', () => {
    expect(styled('/path\nnext')[1]).toEqual([null]);
  });

  it('styles a node without a name as a type, then its value', () => {
    expect(tokenizeDoc(':int:5')[0]).toEqual([
      { text: ':', style: 'def' },
      { text: 'int:', style: 'def' },
      { text: '5', style: 'property' },
    ]);
  });

  it('flags a node without a name that is indented too far', () => {
    expect(styled('foo\n      :x')[1][0]).toBe('error');
  });

  it('does not style a blank line as an error', () => {
    expect(styled('foo\n   \nbar')[2]).toEqual([null]);
  });
});

describe('values', () => {
  it('styles an untyped value as a value', () => {
    expect(tokenizeDoc('foo:bar')[0].map(token => token.style)).toEqual([null, 'def', 'property']);
  });

  it('does not take a type from a value that ends in a colon', () => {
    expect(tokenizeDoc('foo:int:')[0].at(-1)).toEqual({ text: 'int:', style: 'property' });
  });

  it('styles a value starting with @ but not @" as a value', () => {
    const doc = tokenizeDoc('foo:@bar\nnext');
    expect(doc[0].at(-1)).toEqual({ text: '@bar', style: 'property' });
    expect(doc[1][0].style).toBeNull();
  });

  it('styles a doubled colon as a type and goes back to names at the end of the line', () => {
    const doc = tokenizeDoc('foo::\nnext');
    expect(doc[0].at(-1)).toEqual({ text: ':', style: 'def' });
    expect(doc[1][0].style).toBeNull();
  });

  it('styles an expression with nothing after the type as a value', () => {
    const doc = tokenizeDoc('foo:x:\nnext');
    expect(doc[0].at(-1)?.style).toBe('property');
    expect(doc[1][0].style).toBeNull();
  });

  it('reads an expression to the end of the line, then expects a name', () => {
    const doc = tokenizeDoc('foo:x:/..[0,1]/*\nnext');
    expect(doc[0].at(-1)).toEqual({ text: '/..[0,1]/*', style: 'number' });
    expect(doc[1][0].style).toBeNull();
  });

  it('does not treat a longer type name ending in x as an expression', () => {
    expect(tokenizeDoc('foo:max:5')[0].at(-1)).toEqual({ text: '5', style: 'property' });
  });

  it('does not let one expression turn the next value into one', () => {
    expect(tokenizeDoc('a:x:/b\nc:int:5')[1].at(-1)?.style).toBe('property');
  });
});

describe('comments', () => {
  it('keeps indentation steps working after a single line comment', () => {
    const doc = tokenizeDoc('foo\n   // note\n   bar');
    expect(doc[1]).toEqual([{ text: '   // note', style: 'comment' }]);
    expect(doc[2][0].style).toBeNull();
  });

  it('ends a one line block comment immediately', () => {
    const doc = tokenizeDoc('/* hi */\nfoo');
    expect(doc[0]).toEqual([{ text: '/* hi */', style: 'comment' }]);
    expect(doc[1][0].style).toBeNull();
  });

  it('restores the indentation of the comment when it closes', () => {
    const doc = tokenizeDoc('foo\n   /* a\n   b */\n   bar');
    expect(doc[1][0].style).toBe('comment');
    expect(doc[2][0].style).toBe('comment');
    expect(doc[3][0].style).toBeNull();
  });
});

describe('indentation', () => {
  it('flags a first node that is indented', () => {
    expect(styled('   foo')[0][0]).toBe('error');
  });

  it('accepts stepping back out to any shallower level', () => {
    const doc = tokenizeDoc('a\n   b\n      c\n   d\ne');
    expect(doc.every(line => line[0].style === null)).toBe(true);
  });

  it('reports the indentation of the last accepted line', () => {
    const state = hyperlambdaParser.startState!(4);
    tokenizeLine('a', state);
    tokenizeLine('   b', state);
    expect(hyperlambdaParser.indent!(state, '', {} as never)).toBe(3);
  });
});

describe('error state and unknown state', () => {
  it('keeps the whole line red once errored', () => {
    const doc = tokenizeDoc('foo\n  bar baz\nqux:1');
    expect(doc[1][0].style).toBe('error');
    expect(doc[2]).toEqual([{ text: 'qux:1', style: 'error' }]);
  });

  it('yields no style for a mode it does not know', () => {
    const state = hyperlambdaParser.startState!(4);
    (state as unknown as { mode: string }).mode = 'bogus';
    expect(tokenizeLine('abc', state)[0].style).toBeNull();
  });
});

describe('the vocabulary', () => {
  beforeEach(() => {
    delete globalThis._vocabulary;
  });

  function firstStyle(line: string) {
    return tokenizeLine(line, hyperlambdaParser.startState!(4))[0].style;
  }

  it('leaves names unstyled when nothing was loaded or stored', () => {
    stored = null;
    expect(firstStyle('if')).toBeNull();
    stored = '';
    expect(firstStyle('if')).toBeNull();
  });

  it('reads the vocabulary from localStorage once and keeps it', () => {
    stored = JSON.stringify(['if', 'log.info']);
    expect(firstStyle('if')).toBe('keyword');
    expect(globalThis._vocabulary).toEqual(['if', 'log.info']);
    stored = null;
    expect(firstStyle('log.info')).toBe('variable-2');
  });

  it('still colours lambda segments when the vocabulary does not know the name', () => {
    globalThis._vocabulary = ['if'];
    expect(firstStyle('.arguments')).toBe('variable-3');
    expect(firstStyle('whatever')).toBeNull();
  });

  it('does not style a name that is only a colon-less value-typed node name', () => {
    globalThis._vocabulary = ['if'];
    expect(tokenizeLine('if:x', hyperlambdaParser.startState!(4))[0].style).toBe('keyword');
  });
});

describe('the parser spec', () => {
  it('names the language and declares its comment tokens', () => {
    expect(hyperlambdaParser.name).toBe('hyperlambda');
    expect(hyperlambdaParser.languageData?.commentTokens).toEqual({
      line: '//',
      block: { open: '/*', close: '*/' },
    });
  });

  it('starts every document in name mode with no indentation', () => {
    expect(hyperlambdaParser.startState!(4)).toEqual({
      mode: 'name',
      indent: 0,
      previousIndent: 0,
      oldIndent: 0,
      noContent: true,
      is_ex: false,
    });
  });

  it('maps every style the tokenizer returns onto a highlight tag', () => {
    const table = hyperlambdaParser.tokenTable ?? {};
    for (const style of [
      'comment',
      'string',
      'property',
      'keyword',
      'variable',
      'variable-2',
      'def',
      'number',
      'error',
      'variable-3',
    ]) {
      expect(table[style], style).toBeDefined();
    }
  });

  it('defines a language from the parser', () => {
    expect(hyperlambdaLanguage.name).toBe('hyperlambda');
  });
});

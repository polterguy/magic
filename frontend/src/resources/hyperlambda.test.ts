/*
 * Unit tests for the Hyperlambda tokenizer and completion source — the parts
 * of the CodeMirror integration that need no DOM. The tokenizer is driven
 * through StringStream directly, threading the parser state across lines the
 * way StreamLanguage does inside the editor.
 *
 * Run with `npm run test`.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { StringStream } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';
import { hyperlambdaCompletions, hyperlambdaParser } from './hyperlambda';

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
    // StreamLanguage sets this before every token call; the expression
    // detection in the value tokenizer reads it.
    stream.start = start;
    const style = hyperlambdaParser.token!(stream, state);
    // A tokenizer bug must not wedge the test in an infinite loop.
    if (stream.pos === start) {
      stream.next();
    }
    tokens.push({ text: line.slice(start, stream.pos), style });
  }
  return tokens;
}

// Tokenizes a whole document, carrying the parser state across lines.
function tokenizeDoc(doc: string): Token[][] {
  const state = hyperlambdaParser.startState!(4);
  return doc.split('\n').map(line => tokenizeLine(line, state));
}

// First token of a single-line document, for the simple cases.
function styleOf(line: string, vocabulary: string[] = []): string | null {
  (window as any)._vocabulary = vocabulary;
  return tokenizeLine(line, hyperlambdaParser.startState!(4))[0]?.style ?? null;
}

beforeAll(() => {
  (globalThis as any).window = { _vocabulary: [], _slots: [] };
  (globalThis as any).localStorage = { getItem: () => null };
});

describe('hyperlambda tokenizer', () => {

  it('styles slots from the vocabulary as keywords', () => {
    expect(styleOf('if', ['if', 'while'])).toBe('keyword');
  });

  it('styles dotted slots as active events', () => {
    expect(styleOf('log.error', ['log.error'])).toBe('variable-2');
  });

  it('styles .-prefixed names as lambda segments', () => {
    expect(styleOf('.lambda')).toBe('variable-3');
  });

  it('leaves unknown names unstyled', () => {
    expect(styleOf('my-node')).toBeNull();
  });

  it('tokenizes a typed value as name, type and value', () => {
    // The type token swallows its trailing colon — same as the CM5 mode did.
    expect(tokenizeDoc('foo:int:5')[0]).toEqual([
      { text: 'foo', style: null },
      { text: ':', style: 'def' },
      { text: 'int:', style: 'def' },
      { text: '5', style: 'property' },
    ]);
  });

  it('tokenizes string values', () => {
    expect(tokenizeDoc('foo:"bar"')[0]).toEqual([
      { text: 'foo', style: null },
      { text: ':', style: 'def' },
      { text: '"bar"', style: 'string' },
    ]);
  });

  it('tokenizes :x: values as expressions', () => {
    // The type token swallows its trailing colon — same as the CM5 mode did.
    expect(tokenizeDoc('foo:x:/../_data')[0]).toEqual([
      { text: 'foo', style: null },
      { text: ':', style: 'def' },
      { text: 'x:', style: 'def' },
      { text: '/../_data', style: 'number' },
    ]);
  });

  it('tokenizes single line comments', () => {
    expect(tokenizeDoc('// hello')[0]).toEqual([{ text: '// hello', style: 'comment' }]);
  });

  it('tokenizes multi line comments across lines', () => {
    const doc = tokenizeDoc('/* one\ntwo */\nif');
    expect(doc[0]).toEqual([{ text: '/* one', style: 'comment' }]);
    expect(doc[1]).toEqual([{ text: 'two */', style: 'comment' }]);
  });

  it('tokenizes multi line strings across lines', () => {
    const doc = tokenizeDoc('@"\ncontent\n"');
    expect(doc[0]).toEqual([{ text: '@"', style: 'string' }]);
    expect(doc[1]).toEqual([{ text: 'content', style: 'string' }]);
    expect(doc[2]).toEqual([{ text: '"', style: 'string' }]);
  });

  it('flags an indentation jump over 3 as an error', () => {
    const doc = tokenizeDoc('foo\n      bar');
    expect(doc[1][0].style).toBe('error');
  });

  it('flags indentation that is not a multiple of 3 as an error', () => {
    const doc = tokenizeDoc('foo\n  bar');
    expect(doc[1][0].style).toBe('error');
  });

  it('never recovers once a line errored', () => {
    const doc = tokenizeDoc('foo\n      bar\nbaz');
    expect(doc[1][0].style).toBe('error');
    expect(doc[2][0].style).toBe('error');
  });

  it('accepts one additional level of indentation', () => {
    const doc = tokenizeDoc('foo\n   bar');
    expect(doc[1][0].style).toBeNull();
  });
});

describe('hyperlambdaCompletions', () => {

  function complete(doc: string, explicit = true) {
    const state = EditorState.create({ doc });
    const context = new CompletionContext(state, doc.length, explicit);
    return hyperlambdaCompletions(context);
  }

  beforeAll(() => {
    (window as any)._vocabulary = ['if', 'while', 'log.error'];
    (window as any)._slots = ['foo-bar'];
  });

  it('offers vocabulary entries containing the typed text', () => {
    const result = complete('if');
    expect(result?.options.map(option => option.label)).toEqual(['if']);
    // Replaces from the start of the (unindented) line.
    expect(result?.from).toBe(0);
  });

  it('matches by containment, not just prefix', () => {
    const result = complete('o');
    expect(result?.options.map(option => option.label))
      .toEqual(['log.error', 'execute:foo-bar']);
  });

  it('starts after the indentation on indented lines', () => {
    const result = complete('   if');
    expect(result?.from).toBe(3);
  });

  it('offers everything on an explicitly opened empty line', () => {
    const result = complete('', true);
    expect(result?.options.map(option => option.label))
      .toEqual(['if', 'while', 'log.error', 'execute:foo-bar']);
  });

  it('stays closed on an empty line that was not explicitly opened', () => {
    expect(complete('', false)).toBeNull();
  });

  it('answers null when the vocabulary has not loaded', () => {
    delete (window as any)._vocabulary;
    expect(complete('if')).toBeNull();
  });
});

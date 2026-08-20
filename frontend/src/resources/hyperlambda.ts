/*
 * Hyperlambda language support for CodeMirror 6.
 *
 * The tokenizer is the one that ran as a CodeMirror 5 mode for years (and in
 * the Angular dashboard before that), ported to the StreamParser interface
 * that @codemirror/language's StreamLanguage understands. Two adjustments only:
 *
 *  - The mode instance's helper methods (this.tokenizeNameMode & friends)
 *    became module-scope functions, since legacy-modes does not bind `this`
 *    when invoking token(). State that hung off the mode instance (is_ex)
 *    moved into the parser state, which is per-document anyway.
 *  - The CM5 "hint" helper and the vendored show-hint addon are gone. The
 *    completion source below replaces them; the popup itself is CM6's own
 *    @codemirror/autocomplete.
 */

import { StreamLanguage } from '@codemirror/language';
import type { StreamParser, StringStream } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import type { CompletionContext, CompletionResult, Completion } from '@codemirror/autocomplete';

/*
 * The style names the tokenizer returns. legacy-modes maps them through
 * tokenTable onto highlight tags, and the editor's HighlightStyle in
 * CodeEditor.tsx maps those tags onto the same cm-* class names the CM5
 * ainiro theme used - so ainiro.css keeps colouring tokens unchanged.
 */
const styles = {
  // Comments, both single and multi line.
  comment: 'comment',
  // String literals, both single and multi line.
  string: 'string',
  // Node values that are neither expressions nor string literals.
  value: 'property',
  // Slot invocations without a dot, such as [while] and [if].
  keyword: 'keyword',
  // Names starting with an underscore.
  variable: 'variable',
  // Active Event invocations - node names containing a dot.
  activeevent: 'variable-2',
  // Type declarations between name and value, e.g. the "int" in "foo:int:54".
  type: 'def',
  // Lambda expressions, e.g. "/../[0,5]/_data?value".
  expression: 'number',
  // Syntactic errors; the rest of the document stays in error state.
  error: 'error',
  // Lambda segments - node names starting with ".".
  lambda: 'variable-3',
} as const;

type StyleName = typeof styles[keyof typeof styles];

interface HyperlambdaState {
  mode: 'name' | 'value' | 'mcomment' | 'mstring-name' | 'mstring-value' | 'error';
  indent: number;
  previousIndent: number;
  oldIndent: number;
  // Only true until the document's first content, so the first node cannot
  // be indented.
  noContent: boolean;
  // True while a value typed as :x: (a lambda expression) is being parsed.
  is_ex: boolean;
}

function startState(): HyperlambdaState {
  return {
    mode: 'name',
    indent: 0,
    previousIndent: 0,
    oldIndent: 0,
    noContent: true,
    is_ex: false,
  };
}

/*
 * Checks for indentation bugs in Hyperlambda.
 */
function checkIndentation(state: HyperlambdaState, pos: number): boolean {

  /*
   * Verifying that indentation is modulo 3, since everything else is a
   * syntactic error for sure.
   */
  if (pos % 3 !== 0) {
    state.mode = 'error';
    return true;
  }

  /*
   * Verifying that indentation is no more than at the most "one additional
   * indentation" (3 spaces) more than previous value of indentation, or if
   * first name starts with three spaces (which is a bug).
   */
  if (pos - state.previousIndent > 3 || (pos === 3 && state.noContent === true)) {
    state.mode = 'error';
    return true;
  }

  /*
   * Indentation is within acceptable range, updating state of indentation to
   * next walkthrough.
   */
  state.indent = pos;
  state.previousIndent = pos;
  return false;
}

/*
 * Invoked when parser is parsing a single line string entity, either as
 * "name" or as "value".
 */
function parseSingleLineStringLiteral(stream: StringStream, state: HyperlambdaState): StyleName {
  let cr = stream.next();
  let prev = '';
  while (true) {
    if (cr === '"' && prev !== '\\') {
      stream.eatSpace();
      if (stream.peek() != null && stream.peek() !== ':') {
        state.mode = 'error';
        stream.skipToEnd();
        return styles.error;
      }
      break;
    }
    if (cr == null) {
      state.mode = 'error';
      return styles.error;
    }
    prev = cr;
    cr = stream.next();
  }
  return styles.string;
}

/*
 * Invoked when parser is parsing an expression as a "value" entity.
 */
function parseLambdaExpression(stream: StringStream): StyleName {
  stream.skipToEnd();
  return styles.expression;
}

/*
 * Invoked when parser is parsing a single line comment.
 */
function parseSingleLineComment(stream: StringStream): StyleName {
  stream.skipToEnd();
  return styles.comment;
}

/*
 * Invoked when parser is parsing a multi line comment.
 */
function tokenizeMultiCommentMode(stream: StringStream, state: HyperlambdaState): StyleName {

  /*
   * No needs to be "fancy" here, simply skip til "end of line", and then
   * parse content, to see if we passed "end of multi line comment" or not.
   * This is done since a multiline comment in Hyperlambda is NOT, I repeat
   * *NOT* allowed to have ANY content after it is closed, to avoid creating
   * the weirdest indentation nightmare you could imagine ...!!
   */
  stream.skipToEnd();
  const cur = stream.current();
  if (cur.indexOf('*/', cur.length - 2) !== -1) {

    // End of comment, hence name must follow.
    state.indent = state.oldIndent;
    state.mode = 'name';
  } else if (cur.indexOf('*/') !== -1) {

    /*
     * Somehow coder managed to stuff something *AFTER* multi line comment, on
     * same line, which is illegal in Hyperlambda (see over). Returning
     * "error" which stops tokenizing the rest of the document, leaving
     * everything from here, until the end of the document in "error state".
     */
    state.mode = 'error';
    return styles.error;
  } // else, comment spans more lines. We still haven't seen the end of it yet.
  return styles.comment;
}

/*
 * Invoked when parser is parsing a multi line string name entity.
 */
function tokenizeMultilineStringMode(stream: StringStream, state: HyperlambdaState, more: boolean): StyleName {

  /*
   * The "hard" way of parsing a multi line string, since it might be followed
   * by a "value" entity, on the same line as where it ends.
   */
  let cr = stream.next();

  // Whether or not we've seen the end of multi line string literal.
  let seenTheEnd = false;

  /*
   * Looping until we see only ONE '"'. This is because two '"' after each
   * other ('""' that is), means the '"' is escaped, and the string literal is
   * still open.
   */
  while (cr != null) {

    // Checking for easy "end of multi line string" condition, meaning one
    // '"' character, WITHOUT another '"' following it.
    if (cr === '"' && stream.peek() !== '"') {

      // End of multi line string literal, breaking while.
      seenTheEnd = true;
      break;
    } else if (cr === '"' /* Implicitly another '"' is following here in stream */) {

      /*
       * "Hard case", needs to loop until we do not see another '"', and then
       * count the number of '"' we saw afterwards.
       */
      let val = cr;
      while (cr === '"') {
        cr = stream.peek();
        if (cr === '"') {
          val += cr;
          stream.next(); // Avoids removing character out of stream, unless it's another '"'
        }
      }

      // If our number of '"' are odd, we are at end of multi line string literal.
      if (val.length % 2 === 1) {
        seenTheEnd = true;
        break;
      }
    } else {
      cr = stream.next();
    }
  }

  // Checking if we've seen the end of multi line string literal.
  if (seenTheEnd) {

    // Resetting indent again.
    state.indent = state.oldIndent;

    // Checking if there's a value or a type declaration behind multi line string name.
    cr = stream.peek();
    if (!more && cr != null) {

      // "Garbage data" found after closing of multi line string literal as value.
      state.mode = 'error';
      return styles.error;
    }
    if (cr == null) {

      // No value for this guy!
      state.mode = 'name';
    } else if (cr === ':') {

      // Value follows.
      state.mode = 'value';
    } else {

      // "Garbage data" found after closing of multi line string literal.
      state.mode = 'error';
      return styles.error;
    }
  }
  return styles.string;
}

/*
 * Invoked to check if parser has found a "keyword", an "active event"
 * invocation, a "variable", etc, at which point the style of the element is
 * overridden from its default.
 */
function getNodeNameType(word: string | null): StyleName | null {

  /*
   * Checking if there are any autocomplete keywords, and if not, returning
   * early.
   */
  const win = window as any;
  if (win._vocabulary === undefined || win._vocabulary === null) {
    const vocabulary = localStorage.getItem('vocabulary');
    if (vocabulary === null || vocabulary === undefined || vocabulary === '') {
      return null;
    }
    win._vocabulary = JSON.parse(vocabulary);
  }

  /*
   * Default handling, simply checks if current name is either a "variable"
   * (starts with "_") or an Active Event invocation (contains ".").
   */
  if (win._vocabulary.indexOf(word) !== -1) {

    /*
     * The name was found in our Active Events JSON declaration, and is either
     * a "keyword" or an Active Event. Which type it is, depends upon if it
     * contains a "." or not.
     */
    if (word!.indexOf('.') === -1) {
      return styles.keyword;
    } else {
      return styles.activeevent;
    }
  } else if (word && word[0] === '.') {

    /*
     * The name of the node starts with a period ".", and hence is a lambda
     * segment (data segment).
     */
    return styles.lambda;
  }
  return null;
}

/*
 * Invoked when parser is parsing a "name" entity.
 */
function tokenizeNameMode(stream: StringStream, state: HyperlambdaState): StyleName | null {

  /*
   * Figuring out indentation by seeking forward into stream, as long as we
   * have space " ", storing the number of spaces we find, since no node can
   * have more than its previous nodes number of spaces + 3 spaces of its own,
   * maximum.
   */
  let pos = 0;
  while (stream.peek() === ' ') {
    pos += 1;
    stream.next();
  }

  /*
   * Figuring out which type of token this is, by checking first character,
   * without removing it from stream.
   */
  let retVal: StyleName | null = null;
  let cr = stream.peek();
  switch (cr) {

    case '"':

      /*
       * This is a single line string literal (hopefully, unless there's a bug
       * in it), checking for indentation bugs first.
       */
      state.noContent = false;
      stream.next();
      if (checkIndentation(state, pos) === true) {
        return styles.error;
      }

      // Then parsing string literal.
      return parseSingleLineStringLiteral(stream, state);

    case '@':

      /*
       * This is (possibly) a multi line string literal (hopefully, unless
       * there's a bug in it). First checking for indentation bugs.
       */
      if (checkIndentation(state, pos) === true) {
        return styles.error;
      }

      /*
       * Then fetching next character, to check for sure, whether or not this
       * is a multi line string literal.
       */
      state.noContent = false;
      stream.next();
      cr = (cr ?? '') + (stream.next() ?? '');
      if (cr === '@"') {
        state.mode = 'mstring-name';
        state.oldIndent = state.indent;
        state.indent = 0;
        return tokenizeMultilineStringMode(stream, state, true);
      }

      /*
       * NOT a multi line string literal, just happens to be a name starting
       * with "@", "fallthrough" to logic after switch.
       */
      break;

    case ':':

      /*
       * This is a node with an "empty" name, first checking indentation for
       * bugs, WITHOUT removing ":" from stream.
       */
      if (checkIndentation(state, pos) === true) {
        return styles.error;
      }

      // Switching to "value" mode, and returning "type".
      state.noContent = false;
      state.mode = 'value';

      // Returning "type", since next in stream is ":".
      return styles.type;

    case '/':

      /*
       * Possibly a comment, either multi line comment, or single line
       * comment, but first checking next character before we determine if it
       * is a comment or not.
       */
      stream.next();
      if (stream.peek() === '/') {

        // Single line comment.
        state.indent = pos;
        return parseSingleLineComment(stream);
      } else if (stream.peek() === '*') {

        // Multi line comment.
        state.oldIndent = pos;
        state.indent = pos + 1;
        state.mode = 'mcomment';
        return tokenizeMultiCommentMode(stream, state);
      }

      /*
       * NOT any type of comment, just happens to be a name starting with "/",
       * "fallthrough" to logic after switch.
       */
      break;
  }

  /*
   * Not a string literal, neither multi line, nor single line. Neither is it
   * any type of comment, and it is not a node without name. Figuring out name
   * of node, by reading until we see either "end of line" or ":". But first
   * checking for indentation bugs, but only if line does not exclusively
   * contain spaces, at which point "cr" should be null.
   */
  stream.next();
  if (cr != null) {
    if (checkIndentation(state, pos) === true) {
      return styles.error;
    }
  }

  // Finding node's name, by looping until we see either "end of line" or ":".
  let word = cr;
  while (true) {
    cr = stream.peek();
    if (cr == null) {

      // End of line, next node is name, hence no needs to update state.
      stream.next();
      break;
    } else if (cr === ':') {
      break;
    } else {
      stream.next();
    }
    word += cr;
  }

  /*
   * Word is now the name of our node, checking how our while loop ended,
   * which can be either "end of line", or "switch to value mode".
   */
  if (cr === ':') {

    /*
     * Stream did not end with "end of line", hence next token will have to be
     * some sort of value. Changing state of tokenizer to reflect that fact.
     */
    state.mode = 'value';
    retVal = styles.type;
  } // else, also next node is possibly name or comment node ...! Hence, not changing state of tokenizer!!

  /*
   * Checking if node had a name, and if so, handle it in another function, to
   * determine what "type" of name it was, which can be "Active Event type of
   * name", "keyword", "widget type", etc. This process has consequences for
   * indentation, and might increase indentation.
   */
  state.noContent = false;
  if (word != null && word.length > 0) {
    retVal = getNodeNameType(word);
  }
  return retVal;
}

/*
 * Invoked when parser is parsing a "value" entity.
 */
function tokenizeValueMode(stream: StringStream, state: HyperlambdaState): StyleName | null {

  // Checking if this is an expression.
  if (state.is_ex === true) {

    /*
     * After expression is parsed, next token must be a name, hence updating
     * state, before parsing until end of expression.
     */
    state.mode = 'name';
    state.is_ex = false;
    return parseLambdaExpression(stream);
  }

  // Getting next token out of stream.
  let cr = stream.next();

  // Defaulting state to "value".
  let retVal: StyleName | null = styles.value;

  // Figuring out what type of value token this is.
  switch (cr) {

    case '"':

      // Single line string literal.
      state.mode = 'name';
      return parseSingleLineStringLiteral(stream, state);

    case '@':

      // Possibly a multi line string literal, but we don't quite know yet!
      cr = stream.peek();
      if (cr === '"') {

        // Multi line string literal.
        stream.next();
        state.mode = 'mstring-value';
        state.oldIndent = state.indent;
        state.indent = 0;
        retVal = tokenizeMultilineStringMode(stream, state, false);
      } else {

        /*
         * Just so happens to be a node who's value starts with "@", looping
         * until "end of line", and returning value (default).
         */
        state.mode = 'name';
        while (stream.next() != null) {
          // do nothing
        }
      }
      break;

    case ':':

      /*
       * Possible "type carry over" from value tokenizer logic, we don't know
       * quite yet.
       */
      retVal = styles.type;
      if (stream.peek() == null) {
        state.mode = 'name';
      }
      break;

    default:

      /*
       * Not any type of string literal, possibly either a type declaration,
       * or a value. Need further examining before we know for sure. Looping
       * until we see either a ":" or "end of line".
       */
      while (true) {

        // Fetching next character out of stream.
        cr = stream.next();
        if (cr == null) {

          // We're at "end of line", hence next mode is "name".
          state.mode = 'name';
          break;

        } else if (cr === ':') {

          /*
           * Checking for type declaration, without value, which might occur
           * in e.g. expressions.
           */
          if (stream.peek() == null) {
            state.mode = 'name';
            break;
          }

          /*
           * End of "type declaration" for value of node, now checking if this
           * particular type is a lambda expression or not. Expressions have
           * special treatment.
           */
          if (stream.string.substring(stream.start, stream.pos - 1) === 'x') {
            state.is_ex = true;
          } // else, some arbitrary type, such as "bool", "int", etc ...

          /*
           * Return value for style of currently tokenized content is anyways
           * a "type" declaration, regardless of whether or not it was an
           * expression ...
           */
          retVal = styles.type;
          break;
        }
      }
      break;
  }
  return retVal;
}

/*
 * Tokenizer main function. state.mode decides which rule-set applies at the
 * current position in the document.
 */
function token(stream: StringStream, state: HyperlambdaState): string | null {
  switch (state.mode) {
    case 'name':
      return tokenizeNameMode(stream, state);
    case 'value':
      return tokenizeValueMode(stream, state);
    case 'mcomment':
      return tokenizeMultiCommentMode(stream, state);
    case 'mstring-name':
      return tokenizeMultilineStringMode(stream, state, true);
    case 'mstring-value':
      return tokenizeMultilineStringMode(stream, state, false);
    case 'error':

      /*
       * No need to continue parsing, rest of document is erroneous, and there
       * are no ways we can recover anyway. Yielding "error" for the rest of
       * the document, and skipping the rest of tokenizing process.
       */
      stream.skipToEnd();
      return styles.error;
  }
  return null;
}

/*
 * Autocomplete for Hyperlambda keywords, replacing the CM5 "hint" helper.
 * Offers slots from window._vocabulary, and [execute:...] completions for the
 * dynamic slots in window._slots — both fetched by CodeEditor before the
 * editor is created.
 *
 * Semantics kept from the old helper: the whole trimmed line is the filter,
 * and a slot matches when it CONTAINS the filter, not only when it starts
 * with it — typing "thr" finds [execution.throttle].
 *
 * Exported for the unit tests — the editor reaches it through the language's
 * languageData.
 */
export function hyperlambdaCompletions(context: CompletionContext): CompletionResult | null {
  const vocabulary = (window as any)._vocabulary as string[] | undefined;
  if (!vocabulary) {
    return null;
  }
  const line = context.state.doc.lineAt(context.pos);
  const curWord = line.text.trim();
  if (curWord === '' && !context.explicit) {
    return null;
  }
  const from = line.from + (line.text.length - line.text.trimStart().length);
  const options: Completion[] = vocabulary
    .filter(word => word.indexOf(curWord) !== -1)
    .map(word => ({ label: word, type: 'keyword' }));
  const slots = ((window as any)._slots as string[] | undefined) ?? [];
  for (const slot of slots) {
    if (slot.indexOf(curWord) !== -1) {
      options.push({ label: 'execute:' + slot, type: 'function' });
    }
  }
  // filter: false — the list is already filtered above, and without validFor
  // every keystroke re-queries the source, keeping the old behaviour of
  // re-matching on each change.
  return { from, options, filter: false };
}

/*
 * The parser spec, exported so the unit tests can drive the tokenizer line
 * by line; the editor consumes the StreamLanguage built from it below.
 * Style names map through tokenTable onto highlight tags, and CodeEditor's
 * HighlightStyle maps the same tags back onto the cm-* class names
 * ainiro.css styles.
 */
export const hyperlambdaParser: StreamParser<HyperlambdaState> = {
  name: 'hyperlambda',
  startState,
  token,
  indent: (state) => state.indent,
  languageData: {
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
    autocomplete: hyperlambdaCompletions,
  },
  tokenTable: {
    comment: tags.comment,
    string: tags.string,
    property: tags.propertyName,
    keyword: tags.keyword,
    variable: tags.variableName,
    'variable-2': tags.special(tags.variableName),
    def: tags.typeName,
    number: tags.number,
    error: tags.invalid,
    'variable-3': tags.labelName,
  },
};

export const hyperlambdaLanguage = StreamLanguage.define(hyperlambdaParser);

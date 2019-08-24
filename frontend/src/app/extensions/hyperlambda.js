
/*
 * CodeMirror module for editing Hyperlambda files.
 * Will take care of most cases of indentation correctly, automatically,
 * and also show keywords, expressions, type declarations, and Active 
 * Event invocations with a special coloring that makes it easier to read code.
 *
 * File is a CodeMirror plugin
 */

(function(mod) {
    if (typeof exports == "object" && typeof module == "object") {
      mod(require("../../../node_modules/codemirror/lib/codemirror"));
    }
  })(function(CodeMirror) {
  "use strict";
  
  
  /*
   * CodeMirror plugin declaration for Hyperlambda code type
   */
  CodeMirror.defineMode("hyperlambda", function() {
    return {
  
      /*
       * Defines the different CSS class names for the different types of entities in Hyperlambda.
       * Notice, some of the Hyperlambda types doesn't really exist in other programming languages,
       * vice versa, hence it's not always "intuitive" which CSS class a Hyperlambda entity is using.
       *
       * Hyperlambda uses only these classes from a traditional CodeMirror theme;
       *
       *  - comment      ==> Used for comments and multiline comments
       *  - string       ==> Used for strings and multiline strings
       *  - keyword      ==> Used for p5.lambda keywords, such as [while] and [if]
       *  - variable     ==> Used for "variables", meaning a node having a name starting with "_"
       *  - variable-2   ==> Used for Active Event invocations, meaning a node having a name containing "."
       *  - def          ==> Used for type declarations of a node's value
       *  - number       ==> Used for p5.lambda expressions
       *  - property     ==> Used for a node's value, unless it's an expression or a string literal value
       *  - error        ==> Used for syntactic Hyperlambda errors. Normally this means that the entire rest of the document goes into "error mode"
       *  - variable-3   ==> Used for lambda segments, nodes starting with ".".
       *
       * The following CodeMirror theme classes are NOT used by the Hyperlambda CodeMirror plugin
       *  - link
       */
      styles: {
  
        /*
         * Single line comment, starts with "//"
         */
        comment:'comment',
  
        /*
         * String literal, e.g. "foo"
         */
        string:'string',
  
        /*
         * Value of node, except when it is either an expression, string or multiline string,
         * at which case any of the previously mentioned (see above) types have presedence
         */
        value:'property',
  
        /*
         * Keyword, e.g. [while], [if] etc
         */
        keyword:'keyword',
  
        /*
         * Variable declaration, e.g. "_foo".
         * Defined as starting with an underscore ("_")
         */
        variable:'variable',
  
        /*
         * Active Event invocation, e.g "sys42.foo-bar".
         * Defined as having a period (".") in it somewhere, in addition
         * to being the name of a node
         */
        activeevent:'variable-2',
  
        /*
         * Hyperlambda value type declaration, found in between name of node and value, e.g.
         * "foo:int:54" - "int" is here type declaration
         */
        type:'def',
  
        /*
         * p5.lambda expression content, e.g. "/../[0,5]/_data?value"
         */
        expression:'number',
  
        /*
         * Displayed when there is a syntacic error in Hyperlambda, e.g. a space too much or little
         * in front of name, or a string literal is not closed, etc.
         */
        error: 'error',
  
        /*
         * Lambda blocks (node starting with ".").
         */
        lambda:'variable-3'
    },
  
  
  
      /*
       * Invoked by CodeMirror to see how we should indent current line of code.
       * "state.indent" is an internally kept variable, that tracks the current indentation,
       * according to the name of the node given.
       */
      indent: function (state, textAfter) {
        return state.indent;
      },
  
  
  
      /*
       * Initial state of parser, invoked by CodeMirror as it is starting to parse
       * the given Hyperlambda. Setting mode to "name" and indent to "0", to make sure
       * we start out with name being default state, and no indentation occurring
       */
      startState: function() {
        return {
          mode:'name',
          indent:0,
          previousIndent:0,
          noContent:true // Only true if this is first "content" of Hyperlambda, which makes sure first node starts with "no indentation"
        };
      },
  
  
  
      /*
       * Tokenizer main function, invoked by CodeMirror.
       * Given "state.mode" is which state the tokenizer is within, and defines
       * the rule-set to use when parsing from current position in document.
       */
      token: function(stream, state) {
  
        /*
         * Checking current state of tokenizer, and invoking the 
         * correct tokenizer logic accordingly.
         * Not all modes have specialized tokenizer, for instance, single line string mode,
         * don't need its own tokenizer mode, since it's a "special case" of "value mode"
         */
        switch (state.mode) {
          case 'name':
  
            /*
             * Hyperlambda "name" mode
             */
            return this.tokenizeNameMode (stream, state);
          case 'value':
  
            /*
             * Hyperlambda "value" mode
             */
            return this.tokenizeValueMode (stream, state);
          case 'mcomment':
  
            /*
             * Hyperlambda multiline comment mode
             */
            return this.tokenizeMultiCommentMode (stream, state);
          case 'mstring-name':
  
            /*
             * Hyperlambda multiline string mode
             */
            return this.tokenizeMultilineStringMode (stream, state, true);
          case 'mstring-value':
  
            /*
             * Hyperlambda multiline string mode
             */
            return this.tokenizeMultilineStringMode (stream, state, false);
          case 'error':
  
            /*
             * No need to continue parsing, rest of document is erronous, and there
             * are no ways we can recover anyway. Yielding "error" for the rest of the document,
             * and skipping the rest of tokenizing process
             */
            stream.skipToEnd();
            return this.styles.error;
        }
      },
  
  
  
      /*
       * The next functions are "tokenizer functions", referred to from above
       * "token" function, and takes a "token stream" and tokenizer's current "state"
       * as input, and modifies the stream by increasing its pointer forward into its
       * content, and changes the state according to what type of token it found.
       *
       * After the functions have done that, it returns a (possibly new) state back to caller,
       * that helps CodeMirror figure out which CSS class(es) to render current token with,
       * and keeping track of where it currently is in its parsing process
       */
  
  
  
      /*
       * Invoked when parser is parsing a "name" entity
       */
      tokenizeNameMode: function (stream, state) {
  
        /*
         * Figuring out indentation by seeking forward into stream, as long as we have space " ",
         * storing the number of spaces we find, since no node can have more than its previous nodes number
         * of spaces + 3 spaces of its own, maximum
         */
        var pos = 0;
        while (stream.peek() == ' ') {
          pos += 1;
          stream.next();
        }
  
        /*
         * Figuring out which type of token this is, by checking first character, without removing it from stream
         */
        var retVal = null;
        var cr = stream.peek();
        switch (cr) {

          case '"':
  
            /*
             * This is a single line string literal (hopefully, unless there's a bug in it),
             * checking for indentation bugs first
             */
            state.noContent = false;
            stream.next();
            if (this.checkIndentation (state, pos) === true) {
              return this.styles.error;
            }
  
            /*
             * Then parsing string literal
             */
            return this.parseSingleLineStringLiteral (stream, state);

          case '@':
  
            /*
             * This is (possibly) a multi line string literal (hopefully, unless there's a bug in it)
             * First checking for indentation bugs
             */
            if (this.checkIndentation (state, pos) === true) {
              return this.styles.error;
            }
  
            /*
             * Then fetching next character, to check for sure, whether or not this is a multi line string literal
             */
            state.noContent = false;
            stream.next();
            cr += stream.next();
            if (cr == '@"') {
              state.mode = 'mstring-name';
              state.oldIndent = state.indent;
              state.indent = 0;
              return this.tokenizeMultilineStringMode (stream, state, true);
            }
  
            /*
             * NOT a multi line string literal, just happens to be a name starting with "@",
             * "fallthrough" to logic after switch
             */
            break;

          case ':':
  
            /*
             * This is a node with an "empty" name, first checking indentation for bugs,
             * WITHOUT removing ":" from stream
             */
            if (this.checkIndentation (state, pos) === true) {
              return this.styles.error;
            }
  
            /*
             * Switching to "value" mode, and returning "type"
             */
            state.noContent = false;
            state.mode = 'value';
  
            /*
             * Returning "type", since next in stream is ":"
             */
            return this.styles.type;
          case '/':
  
            /*
             * Possibly a comment, either multi line comment, or single line comment, but first
             * checking next character before we determine if it is a comment or not
             */
            stream.next();
            if (stream.peek() == '/') {
  
              /*
               * Single line comment
               */
              state.indent = pos;
              return this.parseSingleLineComment(stream, state);
            } else if (stream.peek() == '*') {
  
              /*
               * Multi line comment
               */
              state.oldIndent = pos;
              state.indent = pos + 1;
              state.mode = 'mcomment';
              return this.tokenizeMultiCommentMode(stream, state);
            }
  
            /*
             * NOT any type of comment, just happens to be a name starting with "/",
             * "fallthrough" to logic after switch
             */
            break;
        }
  
        /*
         * Not a string literal, neither multi line, nor single line. Neither is it any type of comment,
         * and it is not a node without name. Figuring out name of node, by reading until we see either
         * "end of line" or ":".
         * But first checking for indentation bugs, but only if line does not exclusively contain spaces, at which
         * point "cr" should be null
         */
        stream.next();
        if (cr != null) {
          if (this.checkIndentation (state, pos) === true) {
            return this.styles.error;
          }
        }
  
        /*
         * Finding node's name, by looping until we see either "end of line" or ":"
         */
        var word = cr;
        while (true) {
          cr = stream.peek();
          if (cr == null) {
  
            /*
             * End of line, next node is name, hence no needs to update state
             */
            stream.next();
            break;
          } else if (cr == ':') {
            break;
          } else {
            stream.next();
          }
          word += cr;
        }
  
        /*
         * Word is now the name of our node, checking how our while loop ended, which
         * can be either "end of line", or "switch to value mode"
         */
        if (cr == ':') {
  
          /*
           * Stream did not end with "end of line", hence next token will have to be some sort of value.
           * Changing state of tokenizer to reflect that fact
           */
          state.mode = 'value';
          retVal = this.styles.type;
        } // else, also next node is possibly name or comment node ...! Hence, not changing state of tokenizer!!
  
        /*
         * Checking if node had a name, and if so, handle it in another function, to determine what
         * "type" of name it was, which can be "Active Event type of name", "keyword", "widget type", etc.
         * This process has consequences for indentation, and might increase indentation 
         */
        state.noContent = false;
        if (word != null && word.length > 0) {
          retVal = this.getNodeNameType (word, state);
        }
        return retVal;
      },
  
  
  
      /*
       * Invoked when parser is parsing a "value" entity
       */
      tokenizeValueMode: function (stream, state) {
  
        /*
         * Checking if this is an expression
         */
        if (this.is_ex === true) {
  
          /*
           * After expression is parsed, next token must be a name, hence updating state, before parsing until end of expression
           */
          state.mode = 'name';
          this.is_ex = false;
          return this.parseLambdaExpression (stream, state);
        }
  
        /*
         * Getting next token out of stream
         */
        var cr = stream.next();
  
        /*
         * Defaulting state to "value"
         */
        var retVal = this.styles.value;
  
        /*
         * Figuring out what type of value token this is
         */
        switch (cr) {

          case '"':
  
            /*
             * Single line string literal
             */
            state.mode = 'name';
            return this.parseSingleLineStringLiteral (stream, state);

          case '@':
  
            /*
             * Possibly a multi line string literal, but we don't quite know yet!
             */
            cr = stream.peek();
            if (cr == '"') {
  
              /*
               * Multi line string literal
               */
              stream.next();
              state.mode = 'mstring-value';
              state.oldIndent = state.indent;
              state.indent = 0;
              retVal = this.tokenizeMultilineStringMode (stream, state, false);
            } else {
  
              /*
               * Just so happens to be a node who's value starts with "@",
               * looping until "end of line", and returning value (default)
               */
              state.mode = 'name';
              while (stream.next() != null) {
                // do nothing
              }
            }
            break;

          case ':':
  
            /*
             * Possible "type carry over" from value tokenizer logic, we don't know quite yet
             */
            retVal = this.styles.type;
            if (stream.peek() == null) {
              state.mode = 'name';
            }
            break;

          default:
  
            /*
             * Not any type of string literal, possibly either a type declaration, or a value
             * Need further examining before we know for sure.
             * Looping until we see either a ":" or "end of line"
             */
            while (true) {
  
              /*
               * Fetching next character out of stream
               */
              cr = stream.next();
              if (cr == null) {
  
                /*
                 * We're at "end of line", hence next mode is "name"
                 */
                state.mode = 'name';
                break;

              } else if (cr == ':') {
  
                /*
                 * Checking for type declaration, without value, which might occur in e.g. expressions
                 */
                if (stream.peek() == null) {
                  state.mode = 'name';
                  break;
                }
  
                /*
                 * End of "type declaration" for value of node, now checking if this particular
                 * type is a p5.lambda expression or not. Expressions have special treatment
                 */
                if (stream.string.substring(stream.start, stream.pos - 1) == 'x') {
                  this.is_ex = true;
                } // else, some arbitrary type, such as "bool", "int", etc ...
  
                /*
                 * Return value for style of currently tokenized content is anyways a "type" declaration,
                 * regardless of whether or not it was an expression ...
                 */
                retVal = this.styles.type;
                break;
              }
            }
            break;
        }
        return retVal;
      },
  
  
  
      /*
       * Invoked when parser is parsing multi line comment
       */
      tokenizeMultiCommentMode: function (stream, state) {
  
        /*
         * No needs to be "fancy" here, simply skip til "end of line", and then parse content, to see
         * if we passed "end of multi line comment" or not ...
         * This is done since a multiline comment (or a normal comment for that matter), in Hyperlambda,
         * is NOT, I repeat *NOT* allowed to have ANY content after it is closed, to avoid creating
         * the weirdest intentation nightmare you could imagine ...!!
         */
        stream.skipToEnd();
        var cur = stream.current();
        if (cur.indexOf('*/', cur.length - 2) != -1) {
  
          /*
           * End of comment, hence name must follow
           */
          state.indent = state.oldIndent;
          state.mode = 'name';
        } else if (cur.indexOf('*/') != -1) {
  
          /*
           * Somehow coder managed to stuff something *AFTER* multi line comment, on same line,
           * which is illegal in Hyperlambda (see over)
           * Returning "error" which stops tokenizing the rest of the document, leaving everything from here,
           * until the end of the document in "error state"
           */
          state.mode = 'error';
          return this.styles.error;
        } // else, comment spans more lines. We still haven't seen the end of it yet. Hence, not changing state of tokenizer
        return this.styles.comment;
      },
  
  
  
      /*
       * Invoked when parser is parsing a multi line string name entity
       */
      tokenizeMultilineStringMode: function (stream, state, more) {
  
        /*
         * The "hard" way of parsing a multi line string, since it might be followed by a "value" entity,
         * on the same line as where it ends
         */
        var cr = stream.next();
  
        /*
         * Used to keep track of whether or not we've seen the end of multi line string literal
         */
        var seenTheEnd = false;
  
        /*
         * Looping until we see only ONE '"'.
         * This is because two '"' after each other ('""' that is), means the '"' is escaped,
         * and the string literal is still open
         */
        while (cr != null) {
  
          /*
           * Checking for easy "end of multi line string" condition, meaning one '"' character, 
           * WITHOUT another '"' following it
           */
          if (cr == '"' && stream.peek() != '"') {
  
            /*
             * End of multi line string literal, breaking while
             */
            seenTheEnd = true;
            break;
          } else if (cr == '"' /* Implicitly another '"' is following here in stream */) {
  
            /*
             * "Hard case", needs to loop until we do not see another '"', and then count
             * the number of '"' we saw afterwards
             */
            var val = cr;
            while (cr == '"') {
              cr = stream.peek();
              if (cr == '"') {
                val += cr;
                stream.next(); // Avoids removing character out of stream, unless it's another '"'
              }
            }
  
            /*
             * If our number of '"' are even, we are at end of multi line string literal
             */
            if (val.length % 2 == 1) {
  
              /*
               * End of multi line string literal.
               * Breaking outer while loop
               */
              seenTheEnd = true;
              break;
            }
          } else {
            cr = stream.next();
          }
        }
  
        /*
         * Checking if we've seen the end of multi line string literal
         */
        if (seenTheEnd) {
  
          /*
           * Resetting indent again
           */
          state.indent = state.oldIndent;
  
          /*
           * Checking if there's a value or a type declaration behind multi line string name
           */
          cr = stream.peek();
          if (!more && cr != null) {
  
            /*
             * "Garbage data" found after closing of multi line string literal as value
             */
            state.mode = 'error';
            return this.styles.error;
          }
          if (cr == null) {
  
            /*
             * No value for this guy!
             */
            state.mode = 'name';
          } else if (cr == ':') {
  
            /*
             * Value follows
             */
            state.mode = 'value';
          } else {
  
            /*
             * "Garbage data" found after closing of multi line string literal
             */
            state.mode = 'error';
            return this.styles.error;
          }
        }
        return this.styles.string;
      },
  
  
  
  
      /*
       * The next functions are internally used helper functions, used during
       * tokenizing process somehow
       */
  
  
  
      /*
       * Invoked when parser is parsing a single line string entity, either as "name" or as "value"
       */
      parseSingleLineStringLiteral: function (stream, state) {
        var cr = stream.next();
        var prev = '';
        while (true) {
          if (cr == '"' && prev != '\\') {
            stream.eatSpace();
            if (stream.peek() != null && stream.peek() != ':') {
              state.mode = 'error';
              stream.skipToEnd();
              return this.styles.error;
            }
            break;
          }
          if (cr == null) {
            state.mode = 'error';
            return this.styles.error;
          }
          prev = cr;
          cr = stream.next();
        }
        return this.styles.string;
      },
  
  
  
      /*
       * Invoked when parser is parsing an expression as a "value" entity
       */
      parseLambdaExpression: function (stream, state) {
  
        // TODO: implement support for multiline expressions here ...
        stream.skipToEnd();
        return this.styles.expression;
      },
  
  
  
      /*
       * Invoked when parser is parsing a single line comment
       */
      parseSingleLineComment: function (stream, state) {
        stream.skipToEnd();
        return this.styles.comment;
      },
  
  
  
  
      /*
       * Checks for indentation bugs in Hyperlambda
       */
      checkIndentation: function (state, pos) {
  
        /*
         * Verifying that indentation is modulo 3, since everything else is a syntactic error for sure
         */
        if (pos % 3 != 0) {
          state.mode = 'error';
          return true;
        }
  
        /*
         * Verifying that indentation is no more than at the most "one additional indentation" (3 spaces) more than
         * previous value of indentation, or if first name starts with two spaces (which is a bug)
         */
        if (pos - state.previousIndent > 3 || (pos == 3 && state.noContent === true)) {
          state.mode = 'error';
          return true;
        }
  
        /*
         * Indentation is within acceptable range, updating state of indentation to next walkthrough,
         * but only if we're not given an empty string
         */
        state.indent = pos;
        state.previousIndent = pos;
        return false;
      },
  
  
  
  
      /*
       * Invoked to check to see if parser has found a "keyword", an "active event" invocation,
       * a "variable", etc, at which point the style of the element is overridden from its default
       */
      getNodeNameType: function (word, state) {
  
          /*
           * Default handling, simply checks if current name is either a
           * "variable" (starts with "_") or an Active Event invocation (contains ".")
           */
          if (CodeMirror._hyperlambdaKeywords != null && CodeMirror._hyperlambdaKeywords.indexOf(word) != -1) {
  
              /*
               * The name was found in our Active Events JSON declaration, and is either a "keyword" or an Active Event.
               * Which type it is, depends upon if it contains a "." or not.
               */
              if (word.indexOf('.') == -1) {
                  return this.styles.keyword;
              } else {
                  return this.styles.activeevent;
              }
          } else if (word[0] == '_') {
  
              /*
               * The name of the node starts with an underscore "_", and hence is a "variable" (data segment)
               */
              return this.styles.variable;
          } else if (word[0] == '.') {
  
              /*
               * The name of the node starts with an underscore "_", and hence is a "variable" (data segment)
               */
              return this.styles.lambda;
          }
      }
    };
  });
  
  /*
   * Helper that defines MIME type of Hyperlambda content.
   * Not entirely sure where we'd need this, but possibly some plugins
   * created, that downloads code from JavaScript ...?
   */
  CodeMirror.defineMIME("application/x-hyperlambda", "hyperlambda");
  
  
  
  /*
   * Helper for showing autocomplete for Hyperlambda keywords
   */
  CodeMirror.registerHelper("hint", "hyperlambda", function(cm, options) {
  
    /*
     * Checking if there are any autocomplete keywords, and if not, returning early
     */
    if (CodeMirror._hyperlambdaKeywords == null) {
      return;
    }
  
    /*
     * Finding current line in CodeMirror editor, such that we can use its content
     * as the basis for figuring out which keywords to show in autocomplete popup.
     * "curWord" should contain trimmed text from current line after this
     */
    var cur = cm.getCursor();
    var end = cur.ch;
    var list = [];
    var curLine = cm.getLine(cur.line);
    var curWord = curLine.trim();
    var start = end - curWord.length;
  
    /*
     * Then finding each word that matches from our Hyperlambda keywords list
     */
    for (var idx = 0; idx < CodeMirror._hyperlambdaKeywords.length; idx++) {
      if (CodeMirror._hyperlambdaKeywords[idx].indexOf (curWord) != -1) {
  
        /*
         * This keyword contains the text from current line in editor, hence
         * adding keyword back to caller
         */
        list.push(CodeMirror._hyperlambdaKeywords[idx]);
      }
    }
    return {list: list, from: CodeMirror.Pos(cur.line, start), to: CodeMirror.Pos(cur.line, end)};
  });
  });
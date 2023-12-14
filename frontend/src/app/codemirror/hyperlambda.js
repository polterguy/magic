
/*
 * CodeMirror module for editing Hyperlambda files.
 * Will take care of most cases of indentation correctly, automatically,
 * and also show keywords, expressions, type declarations, and Active
 * Event invocations with a special coloring that makes it easier to read code.
 *
 * File is a CodeMirror plugin
 */

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") {
    mod(require("../../../node_modules/codemirror/lib/codemirror"));
  }
})(function (CodeMirror) {
  "use strict";


  /*
   * CodeMirror plugin declaration for Hyperlambda code type
   */
  CodeMirror.defineMode("hyperlambda", function () {
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
       *  - variable     ==> Used for "variables", meaning a node having a name starting with "."
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
        comment: 'comment',

        /*
         * String literal, e.g. "foo"
         */
        string: 'string',

        /*
         * Value of node, except when it is either an expression, string or multiline string,
         * at which case any of the previously mentioned (see above) types have presedence
         */
        value: 'property',

        /*
         * Keyword, e.g. [while], [if] etc
         */
        keyword: 'keyword',

        /*
         * Variable declaration, e.g. "_foo".
         * Defined as starting with an underscore ("_")
         */
        variable: 'variable',

        /*
         * Active Event invocation, e.g "sys42.foo-bar".
         * Defined as having a period (".") in it somewhere, in addition
         * to being the name of a node
         */
        activeevent: 'variable-2',

        /*
         * Hyperlambda value type declaration, found in between name of node and value, e.g.
         * "foo:int:54" - "int" is here type declaration
         */
        type: 'def',

        /*
         * p5.lambda expression content, e.g. "/../[0,5]/_data?value"
         */
        expression: 'number',

        /*
         * Displayed when there is a syntacic error in Hyperlambda, e.g. a space too much or little
         * in front of name, or a string literal is not closed, etc.
         */
        error: 'error',

        /*
         * Lambda blocks (node starting with ".").
         */
        lambda: 'variable-3'
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
      startState: function () {
        return {
          mode: 'name',
          indent: 0,
          previousIndent: 0,
          noContent: true // Only true if this is first "content" of Hyperlambda, which makes sure first node starts with "no indentation"
        };
      },



      /*
       * Tokenizer main function, invoked by CodeMirror.
       * Given "state.mode" is which state the tokenizer is within, and defines
       * the rule-set to use when parsing from current position in document.
       */
      token: function (stream, state) {

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
            return this.tokenizeNameMode(stream, state);
          case 'value':

            /*
             * Hyperlambda "value" mode
             */
            return this.tokenizeValueMode(stream, state);
          case 'mcomment':

            /*
             * Hyperlambda multiline comment mode
             */
            return this.tokenizeMultiCommentMode(stream, state);
          case 'mstring-name':

            /*
             * Hyperlambda multiline string mode
             */
            return this.tokenizeMultilineStringMode(stream, state, true);
          case 'mstring-value':

            /*
             * Hyperlambda multiline string mode
             */
            return this.tokenizeMultilineStringMode(stream, state, false);
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
            if (this.checkIndentation(state, pos) === true) {
              return this.styles.error;
            }

            /*
             * Then parsing string literal
             */
            return this.parseSingleLineStringLiteral(stream, state);

          case '@':

            /*
             * This is (possibly) a multi line string literal (hopefully, unless there's a bug in it)
             * First checking for indentation bugs
             */
            if (this.checkIndentation(state, pos) === true) {
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
              return this.tokenizeMultilineStringMode(stream, state, true);
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
            if (this.checkIndentation(state, pos) === true) {
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
          if (this.checkIndentation(state, pos) === true) {
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
          retVal = this.getNodeNameType(word, state);
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
          return this.parseLambdaExpression(stream, state);
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
            return this.parseSingleLineStringLiteral(stream, state);

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
              retVal = this.tokenizeMultilineStringMode(stream, state, false);
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
        * Checking if there are any autocomplete keywords, and if not, returning early
        */
        if (window._vocabulary === undefined || window._vocabulary === null) {
          var vocabulary = localStorage.getItem('vocabulary');
          if (vocabulary === null || vocabulary === undefined || vocabulary === '') {
            return;
          }
          window._vocabulary = JSON.parse(vocabulary);
        }

        /*
         * Default handling, simply checks if current name is either a
         * "variable" (starts with "_") or an Active Event invocation (contains ".")
         */
        if (window._vocabulary !== null && window._vocabulary !== undefined && window._vocabulary.indexOf(word) != -1) {

          /*
           * The name was found in our Active Events JSON declaration, and is either a "keyword" or an Active Event.
           * Which type it is, depends upon if it contains a "." or not.
           */
          if (word.indexOf('.') == -1) {
            return this.styles.keyword;
          } else {
            return this.styles.activeevent;
          }
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
  CodeMirror.registerHelper("hint", "hyperlambda", function (cm, options) {

    /*
     * Checking if there are any autocomplete keywords, and if not, returning early
     */
    if (!!window._vocabulary === undefined) {
      return [];
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
    for (var idx = 0; idx < window._vocabulary.length; idx++) {
      if (window._vocabulary[idx].indexOf(curWord) != -1) {

        /*
         * This keyword contains the text from current line in editor, hence
         * adding keyword back to caller
         */
        list.push(window._vocabulary[idx]);
      }
    }
    for (var idx = 0; idx < window._slots.length; idx++) {
      if (window._slots[idx].indexOf(curWord) != -1) {

        /*
         * This keyword contains the text from current line in editor, hence
         * adding keyword back to caller
         */
        list.push('execute:' + window._slots[idx]);
      }
    }
    return { list: list, from: CodeMirror.Pos(cur.line, start), to: CodeMirror.Pos(cur.line, end) };
  });



  var HINT_ELEMENT_CLASS = "CodeMirror-hint";
  var ACTIVE_HINT_ELEMENT_CLASS = "CodeMirror-hint-active";

  // This is the old interface, kept around for now to stay
  // backwards-compatible.
  CodeMirror.showHint = function (cm, getHints, options) {
    if (!getHints) return cm.showHint(options);
    if (options && options.async) getHints.async = true;
    var newOpts = { hint: getHints };
    if (options) for (var prop in options) newOpts[prop] = options[prop];
    return cm.showHint(newOpts);
  };

  CodeMirror.defineExtension("showHint", function (options) {
    options = parseOptions(this, this.getCursor("start"), options);
    var selections = this.listSelections()
    if (selections.length > 1) return;
    // By default, don't allow completion when something is selected.
    // A hint function can have a `supportsSelection` property to
    // indicate that it can handle selections.
    if (this.somethingSelected()) {
      if (!options.hint.supportsSelection) return;
      // Don't try with cross-line selections
      for (var i = 0; i < selections.length; i++)
        if (selections[i].head.line != selections[i].anchor.line) return;
    }

    if (this.state.completionActive) this.state.completionActive.close();
    var completion = this.state.completionActive = new Completion(this, options);
    if (!completion.options.hint) return;

    CodeMirror.signal(this, "startCompletion", this);
    completion.update(true);
  });

  CodeMirror.defineExtension("closeHint", function () {
    if (this.state.completionActive) this.state.completionActive.close()
  })

  function Completion(cm, options) {
    this.cm = cm;
    this.options = options;
    this.widget = null;
    this.debounce = 0;
    this.tick = 0;
    this.startPos = this.cm.getCursor("start");
    this.startLen = this.cm.getLine(this.startPos.line).length - this.cm.getSelection().length;

    var self = this;
    cm.on("cursorActivity", this.activityFunc = function () { self.cursorActivity(); });
  }

  var requestAnimationFrame = window.requestAnimationFrame || function (fn) {
    return setTimeout(fn, 1000 / 60);
  };
  var cancelAnimationFrame = window.cancelAnimationFrame || clearTimeout;

  Completion.prototype = {
    close: function () {
      if (!this.active()) return;
      this.cm.state.completionActive = null;
      this.tick = null;
      this.cm.off("cursorActivity", this.activityFunc);

      if (this.widget && this.data) CodeMirror.signal(this.data, "close");
      if (this.widget) this.widget.close();
      CodeMirror.signal(this.cm, "endCompletion", this.cm);
    },

    active: function () {
      return this.cm.state.completionActive == this;
    },

    pick: function (data, i) {
      var completion = data.list[i];
      if (completion.hint) completion.hint(this.cm, data, completion);
      else this.cm.replaceRange(getText(completion), completion.from || data.from,
        completion.to || data.to, "complete");
      CodeMirror.signal(data, "pick", completion);
      this.close();
    },

    cursorActivity: function () {
      if (this.debounce) {
        cancelAnimationFrame(this.debounce);
        this.debounce = 0;
      }

      var pos = this.cm.getCursor(), line = this.cm.getLine(pos.line);
      if (pos.line != this.startPos.line || line.length - pos.ch != this.startLen - this.startPos.ch ||
        pos.ch < this.startPos.ch || this.cm.somethingSelected() ||
        (!pos.ch || this.options.closeCharacters.test(line.charAt(pos.ch - 1)))) {
        this.close();
      } else {
        var self = this;
        this.debounce = requestAnimationFrame(function () { self.update(); });
        if (this.widget) this.widget.disable();
      }
    },

    update: function (first) {
      if (this.tick == null) return
      var self = this, myTick = ++this.tick
      fetchHints(this.options.hint, this.cm, this.options, function (data) {
        if (self.tick == myTick) self.finishUpdate(data, first)
      })
    },

    finishUpdate: function (data, first) {
      if (this.data) CodeMirror.signal(this.data, "update");

      var picked = (this.widget && this.widget.picked) || (first && this.options.completeSingle);
      if (this.widget) this.widget.close();

      this.data = data;

      if (data && data.list.length) {
        if (picked && data.list.length == 1) {
          this.pick(data, 0);
        } else {
          this.widget = new Widget(this, data);
          CodeMirror.signal(data, "shown");
        }
      }
    }
  };

  function parseOptions(cm, pos, options) {
    var editor = cm.options.hintOptions;
    var out = {};
    for (let prop in defaultOptions) {
      out[prop] = defaultOptions[prop];
    }
    if (editor) {
      for (let prop in editor) {
        if (editor[prop] !== undefined) out[prop] = editor[prop];
      }
    }
    if (options) {
      for (let prop in options) {
        if (options[prop] !== undefined) out[prop] = options[prop];
      }
    }
    if (out.hint.resolve) {
      out.hint = out.hint.resolve(cm, pos);
    }
    return out;
  }

  function getText(completion) {
    if (typeof completion == "string") return completion;
    else return completion.text;
  }

  function buildKeyMap(completion, handle) {
    var baseMap = {
      Up: function () { handle.moveFocus(-1); },
      Down: function () { handle.moveFocus(1); },
      PageUp: function () { handle.moveFocus(-handle.menuSize() + 1, true); },
      PageDown: function () { handle.moveFocus(handle.menuSize() - 1, true); },
      Home: function () { handle.setFocus(0); },
      End: function () { handle.setFocus(handle.length - 1); },
      Enter: handle.pick,
      Tab: handle.pick,
      Esc: handle.close
    };

    var mac = /Mac/.test(navigator.platform);

    if (mac) {
      baseMap["Ctrl-P"] = function () { handle.moveFocus(-1); };
      baseMap["Ctrl-N"] = function () { handle.moveFocus(1); };
    }

    var custom = completion.options.customKeys;
    var ourMap = custom ? {} : baseMap;
    function addBinding(key3, val) {
      var bound;
      if (typeof val != "string")
        bound = function (cm) { return val(cm, handle); };
      // This mechanism is deprecated
      else if (baseMap.hasOwnProperty(val))
        bound = baseMap[val];
      else
        bound = val;
      ourMap[key3] = bound;
    }
    if (custom) {
      for (var key in custom) {
        if (custom.hasOwnProperty(key)) {
          addBinding(key, custom[key]);
        }
      }
    }
    var extra = completion.options.extraKeys;
    if (extra) {
      for (var key2 in extra) if (extra.hasOwnProperty(key)) {
        addBinding(key2, extra[key2]);
      }
    }
    return ourMap;
  }

  function getHintElement(hintsElement, el) {
    while (el && el != hintsElement) {
      if (el.nodeName.toUpperCase() === "LI" && el.parentNode == hintsElement) return el;
      el = el.parentNode;
    }
  }

  function Widget(completion, data) {
    this.completion = completion;
    this.data = data;
    this.picked = false;
    var widget = this, cm = completion.cm;
    var ownerDocument = cm.getInputField().ownerDocument;
    var parentWindow = ownerDocument.defaultView || ownerDocument.parentWindow;

    var hints = this.hints = ownerDocument.createElement("ul");
    var theme = completion.cm.options.theme;
    hints.className = "CodeMirror-hints " + theme;
    this.selectedHint = data.selectedHint || 0;

    var completions = data.list;
    for (var i = 0; i < completions.length; ++i) {
      var elt = hints.appendChild(ownerDocument.createElement("li")), cur = completions[i];
      var className = HINT_ELEMENT_CLASS + (i != this.selectedHint ? "" : " " + ACTIVE_HINT_ELEMENT_CLASS);
      if (cur.className != null) className = cur.className + " " + className;
      elt.className = className;
      if (cur.render) cur.render(elt, data, cur);
      else elt.appendChild(ownerDocument.createTextNode(cur.displayText || getText(cur)));
      elt.hintId = i;
    }

    var container = completion.options.container || ownerDocument.body;
    var pos = cm.cursorCoords(completion.options.alignWithWord ? data.from : null);
    var left = pos.left, top = pos.bottom, below = true;
    var offsetLeft = 0, offsetTop = 0;
    if (container !== ownerDocument.body) {
      // We offset the cursor position because left and top are relative to the offsetParent's top left corner.
      var isContainerPositioned = ['absolute', 'relative', 'fixed'].indexOf(parentWindow.getComputedStyle(container).position) !== -1;
      var offsetParent = isContainerPositioned ? container : container.offsetParent;
      var offsetParentPosition = offsetParent.getBoundingClientRect();
      var bodyPosition = ownerDocument.body.getBoundingClientRect();
      offsetLeft = (offsetParentPosition.left - bodyPosition.left - offsetParent.scrollLeft);
      offsetTop = (offsetParentPosition.top - bodyPosition.top - offsetParent.scrollTop);
    }
    hints.style.left = (left - offsetLeft) + "px";
    hints.style.top = (top - offsetTop) + "px";

    // If we're at the edge of the screen, then we want the menu to appear on the left of the cursor.
    var winW = parentWindow.innerWidth || Math.max(ownerDocument.body.offsetWidth, ownerDocument.documentElement.offsetWidth);
    var winH = parentWindow.innerHeight || Math.max(ownerDocument.body.offsetHeight, ownerDocument.documentElement.offsetHeight);
    container.appendChild(hints);
    var box = hints.getBoundingClientRect(), overlapY = box.bottom - winH;
    var scrolls = hints.scrollHeight > hints.clientHeight + 1
    var startScroll = cm.getScrollInfo();

    if (overlapY > 0) {
      var height = box.bottom - box.top, curTop = pos.top - (pos.bottom - box.top);
      if (curTop - height > 0) { // Fits above cursor
        hints.style.top = (top = pos.top - height - offsetTop) + "px";
        below = false;
      } else if (height > winH) {
        hints.style.height = (winH - 5) + "px";
        hints.style.top = (top = pos.bottom - box.top - offsetTop) + "px";
        var cursor = cm.getCursor();
        if (data.from.ch != cursor.ch) {
          pos = cm.cursorCoords(cursor);
          hints.style.left = (left = pos.left - offsetLeft) + "px";
          box = hints.getBoundingClientRect();
        }
      }
    }
    var overlapX = box.right - winW;
    if (overlapX > 0) {
      if (box.right - box.left > winW) {
        hints.style.width = (winW - 5) + "px";
        overlapX -= (box.right - box.left) - winW;
      }
      hints.style.left = (left = pos.left - overlapX - offsetLeft) + "px";
    }
    if (scrolls) {
      for (var node = hints.firstChild; node; node = node.nextSibling) {
        node.style.paddingRight = cm.display.nativeBarWidth + "px"
      }
    }

    cm.addKeyMap(this.keyMap = buildKeyMap(completion, {
      moveFocus: function (n, avoidWrap) { widget.changeActive(widget.selectedHint + n, avoidWrap); },
      setFocus: function (n) { widget.changeActive(n); },
      menuSize: function () { return widget.screenAmount(); },
      length: completions.length,
      close: function () { completion.close(); },
      pick: function () { widget.pick(); },
      data: data
    }));

    if (completion.options.closeOnUnfocus) {
      var closingOnBlur;
      cm.on("blur", this.onBlur = function () { closingOnBlur = setTimeout(function () { completion.close(); }, 100); });
      cm.on("focus", this.onFocus = function () { clearTimeout(closingOnBlur); });
    }

    cm.on("scroll", this.onScroll = function () {
      var curScroll = cm.getScrollInfo(), editor = cm.getWrapperElement().getBoundingClientRect();
      var newTop = top + startScroll.top - curScroll.top;
      var point = newTop - (parentWindow.pageYOffset || (ownerDocument.documentElement || ownerDocument.body).scrollTop);
      if (!below) point += hints.offsetHeight;
      if (point <= editor.top || point >= editor.bottom) return completion.close();
      hints.style.top = newTop + "px";
      hints.style.left = (left + startScroll.left - curScroll.left) + "px";
    });

    CodeMirror.on(hints, "dblclick", function (e) {
      var t = getHintElement(hints, e.target || e.srcElement);
      if (t && t.hintId != null) { widget.changeActive(t.hintId); widget.pick(); }
    });

    CodeMirror.on(hints, "click", function (e) {
      var t = getHintElement(hints, e.target || e.srcElement);
      if (t && t.hintId != null) {
        widget.changeActive(t.hintId);
        if (completion.options.completeOnSingleClick) widget.pick();
      }
    });

    CodeMirror.on(hints, "mousedown", function () {
      setTimeout(function () { cm.focus(); }, 20);
    });

    CodeMirror.signal(data, "select", completions[this.selectedHint], hints.childNodes[this.selectedHint]);
    return true;
  }

  Widget.prototype = {
    close: function () {
      if (this.completion.widget != this) return;
      this.completion.widget = null;
      this.hints.parentNode.removeChild(this.hints);
      this.completion.cm.removeKeyMap(this.keyMap);

      var cm = this.completion.cm;
      if (this.completion.options.closeOnUnfocus) {
        cm.off("blur", this.onBlur);
        cm.off("focus", this.onFocus);
      }
      cm.off("scroll", this.onScroll);
    },

    disable: function () {
      this.completion.cm.removeKeyMap(this.keyMap);
      var widget = this;
      this.keyMap = { Enter: function () { widget.picked = true; } };
      this.completion.cm.addKeyMap(this.keyMap);
    },

    pick: function () {
      this.completion.pick(this.data, this.selectedHint);
    },

    changeActive: function (i, avoidWrap) {
      if (i >= this.data.list.length)
        i = avoidWrap ? this.data.list.length - 1 : 0;
      else if (i < 0)
        i = avoidWrap ? 0 : this.data.list.length - 1;
      if (this.selectedHint == i) return;
      var node = this.hints.childNodes[this.selectedHint];
      if (node) node.className = node.className.replace(" " + ACTIVE_HINT_ELEMENT_CLASS, "");
      node = this.hints.childNodes[this.selectedHint = i];
      node.className += " " + ACTIVE_HINT_ELEMENT_CLASS;
      if (node.offsetTop < this.hints.scrollTop)
        this.hints.scrollTop = node.offsetTop - 3;
      else if (node.offsetTop + node.offsetHeight > this.hints.scrollTop + this.hints.clientHeight)
        this.hints.scrollTop = node.offsetTop + node.offsetHeight - this.hints.clientHeight + 3;
      CodeMirror.signal(this.data, "select", this.data.list[this.selectedHint], node);
    },

    screenAmount: function () {
      return Math.floor(this.hints.clientHeight / this.hints.firstChild.offsetHeight) || 1;
    }
  };

  function applicableHelpers(cm, helpers) {
    if (!cm.somethingSelected()) return helpers
    var result = []
    for (var i = 0; i < helpers.length; i++)
      if (helpers[i].supportsSelection) result.push(helpers[i])
    return result
  }

  function fetchHints(hint, cm, options, callback) {
    if (hint.async) {
      hint(cm, callback, options)
    } else {
      var result = hint(cm, options)
      if (result && result.then) result.then(callback)
      else callback(result)
    }
  }

  function resolveAutoHints(cm, pos) {
    var helpers = cm.getHelpers(pos, "hint"), words
    if (helpers.length) {
      var resolved = function (cm2, callback, options) {
        var app = applicableHelpers(cm, helpers);
        function run(i) {
          if (i == app.length) return callback(null)
          fetchHints(app[i], cm2, options, function (result) {
            if (result && result.list.length > 0) callback(result)
            else run(i + 1)
          })
        }
        run(0)
      }
      resolved.async = true
      resolved.supportsSelection = true
      return resolved
    } else if (words = cm.getHelper(cm.getCursor(), "hintWords")) {
      return function (cm2) { return CodeMirror.hint.fromList(cm2, { words: words }) }
    } else if (CodeMirror.hint.anyword) {
      return function (cm2, options) { return CodeMirror.hint.anyword(cm2, options) }
    } else {
      return function () { }
    }
  }

  CodeMirror.registerHelper("hint", "auto", {
    resolve: resolveAutoHints
  });

  CodeMirror.registerHelper("hint", "fromList", function (cm, options) {
    var cur = cm.getCursor(), token = cm.getTokenAt(cur)
    var term, from = CodeMirror.Pos(cur.line, token.start), to = cur
    if (token.start < cur.ch && /\w/.test(token.string.charAt(cur.ch - token.start - 1))) {
      term = token.string.substr(0, cur.ch - token.start)
    } else {
      term = ""
      from = cur
    }
    var found = [];
    for (var i = 0; i < options.words.length; i++) {
      var word = options.words[i];
      if (word.slice(0, term.length) == term)
        found.push(word);
    }

    if (found.length) return { list: found, from: from, to: to };
  });

  CodeMirror.commands.autocomplete = CodeMirror.showHint;

  var defaultOptions = {
    hint: CodeMirror.hint.auto,
    completeSingle: true,
    alignWithWord: true,
    closeCharacters: /[\s()\[\]{};:>,]/,
    closeOnUnfocus: true,
    completeOnSingleClick: true,
    container: null,
    customKeys: null,
    extraKeys: null
  };

  CodeMirror.defineOption("hintOptions", null);

});

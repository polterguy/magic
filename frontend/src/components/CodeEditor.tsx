/*
 * CodeMirror 6 wrapper. Supports the custom Hyperlambda mode ported from
 * the Angular dashboard, plus SQL, JavaScript, JSON, HTML, CSS and Markdown
 * out of the box.
 */

import { useEffect, useRef, useState } from 'react';
import { Annotation, Compartment, EditorState, Prec, StateEffect, StateField, Transaction } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import {
  Decoration,
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  tooltips,
} from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentLess, indentMore } from '@codemirror/commands';
import {
  HighlightStyle,
  LanguageSupport,
  bracketMatching,
  indentUnit,
  syntaxHighlighting,
} from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { autocompletion, startCompletion } from '@codemirror/autocomplete';
import { closeSearchPanel, openSearchPanel, search, searchKeymap } from '@codemirror/search';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { markdown } from '@codemirror/lang-markdown';
import { sql } from '@codemirror/lang-sql';
import { hyperlambdaLanguage } from '../resources/hyperlambda.js';
import '../resources/ainiro.css';
import { http, apiBaseUrl } from '../lib/api.js';
import { SHORTCUTS } from '../lib/shortcuts';

/*
 * The hyperlambda mode colors slot invocations from window._vocabulary,
 * so the vocabulary must be loaded before an editor is created.
 *
 * Cached per backend rather than once: two cloudlets run different plugins,
 * so they know different slots, and keeping the first one's vocabulary would
 * mis-colour the second one's code.
 */
let vocabularyPromise: Promise<void> | null = null;
let vocabularyFrom: string | null = null;

/*
 * Slot name → description, powering hover-docs in Hyperlambda editors.
 * Fetched alongside the vocabulary but deliberately NOT part of its promise:
 * an older backend without the endpoint just means no hover-docs, never a
 * broken editor.
 */
let slotDocs: Record<string, string | null> = {};

function ensureVocabulary() {
  if (vocabularyFrom !== apiBaseUrl()) {
    vocabularyPromise = null;
    slotDocs = {};
    delete (window as any)._vocabulary;
    delete (window as any)._slots;
  }
  if ((window as any)._vocabulary) {
    return Promise.resolve();
  }
  vocabularyFrom = apiBaseUrl();
  http.get<Record<string, string | null>>('/magic/system/evaluator/vocabulary-verbose')
    .then(docs => { slotDocs = docs ?? {}; })
    .catch(() => { slotDocs = {}; });
  vocabularyPromise ??= Promise.all([
    http.get<string[]>('/magic/system/evaluator/vocabulary'),
    http.get<string[]>('/magic/system/evaluator/slots'),
  ]).then(([vocabulary, slots]) => {
    (window as any)._vocabulary = vocabulary;
    // The completion source reads _slots to offer [execute:...] completions
    // for dynamic slots.
    (window as any)._slots = slots;
  }).catch(err => {
    // A failed fetch must not stay cached, or highlighting silently stays
    // broken until reload — clearing lets the next editor mount try again.
    vocabularyPromise = null;
    vocabularyFrom = null;
    throw err;
  });
  return vocabularyPromise;
}

/*
 * The hover-doc tooltip — one shared element for every editor on the page,
 * shown when the pointer rests on a token the vocabulary knows.
 */
let slotDocTip: HTMLDivElement | null = null;

function showSlotDoc(anchor: HTMLElement, name: string, description: string) {
  if (!slotDocTip) {
    slotDocTip = document.createElement('div');
    slotDocTip.className = 'slot-doc';
    document.body.appendChild(slotDocTip);
  }
  slotDocTip.replaceChildren();
  const title = document.createElement('div');
  title.className = 'slot-doc-name';
  title.textContent = '[' + name + ']';
  const body = document.createElement('div');
  body.textContent = description;
  slotDocTip.append(title, body);
  const rect = anchor.getBoundingClientRect();
  slotDocTip.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 340)) + 'px';
  slotDocTip.style.top = (rect.bottom + 6) + 'px';
  slotDocTip.style.display = 'block';
}

function hideSlotDoc() {
  if (slotDocTip) {
    slotDocTip.style.display = 'none';
  }
}

/*
 * Wires hover-docs onto an editor: resting the pointer on a slot invocation
 * shows what the slot does, using the descriptions the backend declares.
 * Slot tokens render as cm-keyword (dotless names) or cm-variable-2 (dotted) —
 * the HighlightStyle below puts those class names on the highlight spans.
 */
function attachSlotDocs(dom: HTMLElement) {
  dom.addEventListener('mouseover', event => {
    const target = event.target as HTMLElement;
    if (!target.classList ||
        (!target.classList.contains('cm-keyword') && !target.classList.contains('cm-variable-2'))) {
      hideSlotDoc();
      return;
    }
    const name = (target.textContent ?? '').trim();
    const description = slotDocs[name];
    if (description) {
      showSlotDoc(target, name, description);
    } else {
      hideSlotDoc();
    }
  });
  dom.addEventListener('mouseleave', hideSlotDoc);
}

/*
 * The ainiro theme's token colours live in ainiro.css, keyed on the cm-*
 * class names the CodeMirror 5 theme used. Mapping CM6's highlight tags onto
 * those same class names keeps every token colour — and the light theme's
 * variable flip — working unchanged.
 */
const ainiroHighlight = HighlightStyle.define([
  { tag: tags.comment, class: 'cm-comment' },
  { tag: tags.string, class: 'cm-string' },
  { tag: tags.keyword, class: 'cm-keyword' },
  { tag: tags.number, class: 'cm-number' },
  { tag: [tags.atom, tags.bool, tags.null, tags.escape], class: 'cm-atom' },
  { tag: tags.propertyName, class: 'cm-property' },
  { tag: tags.attributeName, class: 'cm-attribute' },
  { tag: tags.attributeValue, class: 'cm-string' },
  { tag: tags.tagName, class: 'cm-tag' },
  { tag: tags.link, class: 'cm-link' },
  { tag: tags.bracket, class: 'cm-bracket' },
  { tag: tags.variableName, class: 'cm-variable' },
  // Hyperlambda's dotted slot invocations (log.error, data.connect) — gold.
  { tag: tags.special(tags.variableName), class: 'cm-variable-2' },
  // Type declarations (:int:, :bool:) — string green, as in the CM5 theme.
  { tag: tags.typeName, class: 'cm-def' },
  // Hyperlambda's .lambda segments.
  { tag: tags.labelName, class: 'cm-variable-3' },
  { tag: tags.invalid, class: 'cm-error' },
]);

/*
 * Marks transactions that sync the value prop into the document, so the
 * change listener below doesn't echo them back out as user edits — the CM5
 * wrapper filtered on change.origin === 'setValue' for the same reason.
 */
const externalChange = Annotation.define<boolean>();

/*
 * The highlightLine feature (Rewind's current/failed statement marker): a
 * line decoration set through this effect, replacing CM5's addLineClass.
 */
const setLineHighlight = StateEffect.define<{ line: number; className: string } | null>();

const lineHighlightField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, transaction) {
    decorations = decorations.map(transaction.changes);
    for (const effect of transaction.effects) {
      if (effect.is(setLineHighlight)) {
        decorations = Decoration.none;
        const spec = effect.value;
        if (spec && spec.line >= 0 && spec.line < transaction.state.doc.lines) {
          decorations = Decoration.set([
            Decoration.line({ attributes: { class: spec.className } })
              .range(transaction.state.doc.line(spec.line + 1).from),
          ]);
        }
      }
    }
    return decorations;
  },
  provide: field => EditorView.decorations.from(field),
});

// The language backing each mode name modeForFile hands out.
function languageFor(mode: string, hintTables?: Record<string, string[]>): Extension {
  switch (mode) {
    case 'hyperlambda':
      return new LanguageSupport(hyperlambdaLanguage);
    case 'text/x-sql':
      // The schema option replaces CM5's hintOptions.tables — table → columns.
      return sql({ schema: hintTables ?? {} });
    case 'javascript':
      return javascript();
    case 'application/json':
      return json();
    case 'htmlmixed':
      return html();
    case 'css':
      return css();
    case 'markdown':
      return markdown();
    default:
      return [];
  }
}

// Markdown is prose, and prose wraps.
function wrapsByDefault(mode: string) {
  return mode === 'markdown';
}

// The current selection's text, replacing CM5's getSelection().
export function editorSelection(view: EditorView | null): string {
  if (!view) {
    return '';
  }
  const range = view.state.selection.main;
  return view.state.sliceDoc(range.from, range.to);
}

function toggleFullscreen(view: EditorView) {
  view.dom.classList.toggle('cm-fullscreen');
}

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  mode: string;
  readOnly?: boolean;
  height?: string;
  // Off for read-only views where the gutter is noise rather than navigation.
  lineNumbers?: boolean;
  /*
   * Zero based line to mark as the current one, and scroll to. Used by Rewind to
   * show which statement a recorded step was executing.
   */
  highlightLine?: number;
  // Class applied to the highlighted line, letting a caller mark a failure differently.
  highlightClass?: string;
  onSave?: () => void;
  onExecute?: () => void;
  /*
   * F1 — asks the support chatbot about the selection. Only wired up for
   * Hyperlambda, so it is the caller that decides whether it applies.
   */
  onHelp?: (selection: string) => void;
  /*
   * Wraps long lines instead of scrolling sideways. Defaults to on for
   * markdown and off for everything else: prose has no meaningful line
   * breaks, so scrolling sideways to read a paragraph is nonsense, while
   * code reads better unwrapped.
   */
  lineWrapping?: boolean;
  // Table → columns map feeding SQL autocomplete.
  hintTables?: Record<string, string[]>;
  // Gives the parent access to the EditorView (selection etc.).
  onInstance?: (instance: EditorView) => void;
  // Fired as the selection appears and empties — drives "act on selection" buttons.
  onSelectionChange?: (hasSelection: boolean) => void;
  // Old-dashboard Alt-key actions: newFile, newFolder, renameFile,
  // deleteFile, deleteFolder, close.
  onAction?: (action: string) => void;
}

export default function CodeEditor(props: CodeEditorProps) {

  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const compartments = useRef<{
    language: Compartment;
    readOnly: Compartment;
    lineNumbers: Compartment;
    wrapping: Compartment;
  } | null>(null);
  /*
   * The editor is built after the vocabulary loads, so effects depending on it
   * run before it exists. This lets them re-run once it does.
   */
  const [ready, setReady] = useState(false);
  const callbacks = useRef(props);
  callbacks.current = props;

  useEffect(() => {
    let cancelled = false;
    ensureVocabulary()
      .catch(error => console.error('Could not load Hyperlambda vocabulary:', error))
      .then(() => {
        if (cancelled || !host.current) {
          return;
        }
        createEditor(host.current);
        setReady(true);
      });

    /*
     * The keymap is built from the shared shortcut registry, so every
     * binding is documented in the shortcuts overlay by construction. This
     * table resolves the registry's action ids into what CodeMirror runs —
     * a CM6 command or a callback.
     *
     * Notes that shaped some of these: search opens CM6's panel, which keeps
     * matches highlighted while it is up (Enter cycles, Escape closes). Tab
     * indents the SELECTION as a block — indentUnit is 3, so a level is
     * Hyperlambda's three spaces — and just types the spaces without one.
     */
    const handlers: Record<string, (view: EditorView) => boolean> = {
      autocomplete: view => startCompletion(view),
      findPersistent: view => openSearchPanel(view),
      fullscreen: view => {
        toggleFullscreen(view);
        return true;
      },
      exitFullscreen: view => {
        if (view.dom.classList.contains('cm-fullscreen')) {
          view.dom.classList.remove('cm-fullscreen');
          return true;
        }
        return closeSearchPanel(view);
      },
      indent: view => {
        if (view.state.selection.main.empty) {
          view.dispatch(view.state.replaceSelection('   '));
          return true;
        }
        return indentMore(view);
      },
      outdent: view => indentLess(view),
      save: () => {
        callbacks.current.onSave?.();
        return true;
      },
      execute: () => {
        callbacks.current.onExecute?.();
        return true;
      },
      help: view => {
        callbacks.current.onHelp?.(editorSelection(view));
        return true;
      },
      newFile: () => {
        callbacks.current.onAction?.('newFile');
        return true;
      },
      newFolder: () => {
        callbacks.current.onAction?.('newFolder');
        return true;
      },
      renameFile: () => {
        callbacks.current.onAction?.('renameFile');
        return true;
      },
      deleteFile: () => {
        callbacks.current.onAction?.('deleteFile');
        return true;
      },
      deleteFolder: () => {
        callbacks.current.onAction?.('deleteFolder');
        return true;
      },
      close: () => {
        callbacks.current.onAction?.('close');
        return true;
      },
      nextTab: () => {
        callbacks.current.onAction?.('nextTab');
        return true;
      },
      previousTab: () => {
        callbacks.current.onAction?.('previousTab');
        return true;
      },
    };
    // The registry already uses CM6 key names (lowercase letters, 'Escape',
    // 'Mod-' for the Cmd/Ctrl combo), so bindings are taken verbatim.
    const bindings: { key: string; run: (view: EditorView) => boolean }[] = [];
    for (const shortcut of SHORTCUTS) {
      if (!shortcut.action || !shortcut.keys) {
        continue;
      }
      for (const key of shortcut.keys) {
        bindings.push({ key, run: handlers[shortcut.action] });
      }
    }

    function createEditor(parent: HTMLElement) {
      const language = new Compartment();
      const readOnly = new Compartment();
      const numbers = new Compartment();
      const wrapping = new Compartment();
      compartments.current = { language, readOnly, lineNumbers: numbers, wrapping };

      const current = callbacks.current;
      const view = new EditorView({
        parent,
        state: EditorState.create({
          doc: current.value,
          extensions: [
            /*
             * macOS types a special character for Option+letter ('ç' for
             * Option+C, 'Dead' for Option+N), and CM6 deliberately skips its
             * keyCode fallback for Option combos on mac - so Alt-letter
             * bindings would silently never fire. Recover the letter from the
             * layout-independent event.code and re-dispatch it; the synthetic
             * event carries the plain letter, so it falls through to the
             * keymap below without re-triggering this handler. Prec.high makes
             * sure this runs before the keymap sees the mangled original.
             */
            Prec.high(EditorView.domEventHandlers({
              keydown(event, view) {
                if (event.altKey && !event.ctrlKey && !event.metaKey &&
                    /^Key[A-Z]$/.test(event.code ?? '')) {
                  const letter = event.code!.slice(3).toLowerCase();
                  if (event.key !== letter) {
                    view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
                      key: letter,
                      code: event.code,
                      altKey: true,
                      shiftKey: event.shiftKey,
                      bubbles: true,
                      cancelable: true,
                    }));
                    event.preventDefault();
                    return true;
                  }
                }
                return false;
              },
            })),
            // Our bindings first — they win over the default keymap.
            keymap.of(bindings),
            history(),
            drawSelection(),
            highlightActiveLine(),
            highlightActiveLineGutter(),
            bracketMatching(),
            // Panel on top, where CM5's search dialog used to appear.
            search({ top: true }),
            // Explicit Ctrl-Space only — the CM5 setup never popped up on typing.
            autocompletion({ activateOnTyping: false }),
            // Body-parented, like CM5's hint popup: editors live inside
            // overflow-hidden dialogs, which would clip an editor-parented popup.
            tooltips({ parent: document.body }),
            // The ainiro scope class the theme rules in ainiro.css live under.
            EditorView.editorAttributes.of({ class: 'cm-s-ainiro' }),
            syntaxHighlighting(ainiroHighlight),
            EditorState.tabSize.of(3),
            indentUnit.of('   '),
            numbers.of((current.lineNumbers ?? true) ? lineNumbers() : []),
            readOnly.of(EditorState.readOnly.of(current.readOnly ?? false)),
            wrapping.of(
              (current.lineWrapping ?? wrapsByDefault(current.mode))
                ? EditorView.lineWrapping
                : []),
            language.of(languageFor(current.mode, current.hintTables)),
            lineHighlightField,
            EditorView.updateListener.of(update => {
              if (update.docChanged &&
                  !update.transactions.some(tr => tr.annotation(externalChange))) {
                callbacks.current.onChange?.(update.state.doc.toString());
              }
              if (update.selectionSet || update.docChanged) {
                callbacks.current.onSelectionChange?.(!update.state.selection.main.empty);
              }
            }),
            // searchKeymap is NOT part of search() — without it, Escape only
            // closes the panel while the panel itself has focus.
            keymap.of([...searchKeymap, ...defaultKeymap, ...historyKeymap]),
          ],
        }),
      });
      // What CM5's setSize('100%', height) did — the .code-editor host is
      // sized by CSS, the editor fills it (or obeys the explicit height).
      view.dom.style.height = current.height ?? '100%';
      if (current.mode === 'hyperlambda') {
        attachSlotDocs(view.dom);
      }
      editor.current = view;
      current.onInstance?.(view);
      current.onSelectionChange?.(!view.state.selection.main.empty);
    }

    return () => {
      cancelled = true;
      hideSlotDoc();
      editor.current?.destroy();
      editor.current = null;
      compartments.current = null;
    };
  }, []);

  useEffect(() => {
    const view = editor.current;
    if (!view) {
      return;
    }
    const current = view.state.doc.toString();
    if (props.value !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: props.value },
        annotations: [externalChange.of(true), Transaction.addToHistory.of(false)],
      });
    }
  }, [props.value]);

  useEffect(() => {
    const view = editor.current;
    if (!view) {
      return;
    }
    const line = props.highlightLine;
    if (line === undefined || line < 0 || line >= view.state.doc.lines) {
      view.dispatch({ effects: setLineHighlight.of(null) });
      return;
    }
    view.dispatch({
      effects: [
        setLineHighlight.of({ line, className: props.highlightClass ?? 'cm-current-step' }),
        EditorView.scrollIntoView(view.state.doc.line(line + 1).from, { yMargin: 120 }),
      ],
    });
  }, [props.highlightLine, props.highlightClass, props.value, ready]);

  useEffect(() => {
    const view = editor.current;
    if (view && compartments.current) {
      view.dispatch({
        effects: compartments.current.readOnly.reconfigure(
          EditorState.readOnly.of(props.readOnly ?? false)),
      });
    }
  }, [props.readOnly]);

  useEffect(() => {
    const view = editor.current;
    if (view && compartments.current) {
      view.dispatch({
        effects: compartments.current.wrapping.reconfigure(
          (props.lineWrapping ?? wrapsByDefault(props.mode))
            ? EditorView.lineWrapping
            : []),
      });
    }
  }, [props.mode, props.lineWrapping]);

  useEffect(() => {
    const view = editor.current;
    if (view && compartments.current) {
      view.dispatch({
        effects: compartments.current.language.reconfigure(
          languageFor(props.mode, props.hintTables)),
      });
    }
  }, [props.mode, props.hintTables]);

  useEffect(() => {
    if (editor.current) {
      editor.current.dom.style.height = props.height ?? '100%';
    }
  }, [props.height]);

  return <div className="code-editor" ref={host} />;
}

/*
 * Returns the CodeMirror mode to use for the given filename.
 */
export function modeForFile(filename: string): string {
  const extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
  switch (extension) {
    case 'hl': return 'hyperlambda';
    case 'sql': return 'text/x-sql';
    case 'js': case 'ts': return 'javascript';
    case 'json': return 'application/json';
    case 'html': case 'htm': return 'htmlmixed';
    case 'css': case 'scss': return 'css';
    case 'md': return 'markdown';
    default: return 'text/plain';
  }
}

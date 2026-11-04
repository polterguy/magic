/*
 * Moving between the Design, Code and Live views, and between the files the
 * code view can hold.
 */

import { loadFile } from '../../../lib/api';
import { showError } from '../../../lib/errors';
import { showToast } from '../../../lib/toast';
import type { useDialog } from '../../../lib/useDialog';
import { joinCss, splitCss } from '../css';
import { canonicalUrl } from '../designerFiles';
import { prepareDocument, serializeDocument } from '../html';
import type { CodeDraft } from './useCodeDraft';
import type { DesignerUi } from './useDesignerUi';
import type { DocumentState } from './useDocumentState';
import type { StylesheetState } from './useStylesheetState';
import { HISTORY, Snapshot, UndoHistory } from './useUndoHistory';

export function useCodeView(o: {
  origin: string;
  choice: ReturnType<typeof useDialog>['choice'];
  save: () => Promise<boolean>;
  ui: Pick<DesignerUi, 'view' | 'setView'>;
  documentState: DocumentState;
  codeDraft: CodeDraft;
  stylesheet: StylesheetState;
  undoHistory: Pick<UndoHistory, 'setHistory' | 'revisionRef' | 'revisionsRef'>;
}) {
  const { origin, choice, save } = o;
  const { view, setView } = o.ui;
  const { docRef, path, dirty, setBusy, setSrcDoc, setSelected, setHovered, setDirty } =
    o.documentState;
  const { code, codeOriginal, setCodeOriginal, codeTarget, setCodeTarget, codeSetRef, applyCode } =
    o.codeDraft;
  const { cssPath, cssHead, setCssHead, cssTail, setCssTail, overrides, setOverrides } =
    o.stylesheet;
  const { setHistory, revisionRef, revisionsRef } = o.undoHistory;

  /*
   * Puts a different file in the code view.
   *
   * Refused while anything is unsaved, and deliberately so. The editor holds
   * one file's text at a time, and a stylesheet read off disk does not contain
   * the style panel's pending edits — so switching with either outstanding
   * would mean silently choosing which version of the truth to keep. Saving
   * first makes the two agree, and then there is nothing to choose.
   */
  async function switchCodeTarget(file: string) {
    if (file === codeTarget) {
      return;
    }
    if (code !== codeOriginal) {
      showToast('Save your changes before switching file', true);
      return;
    }
    const current = docRef.current;
    if (!current) {
      return;
    }
    setBusy(true);
    try {
      /*
       * Two of these files are not read from disk, because disk is not where
       * they currently live. The page is the document in the canvas, and the
       * stylesheet the Style panel writes into is whatever that panel has
       * made of it — opening either from disk would show an older version and
       * then save it back over the newer one.
       *
       * Any other stylesheet, and every script, is exactly its file.
       */
      let text: string;
      if (file === path) {
        text = serializeDocument(current);
      } else if (file === cssPath) {
        text = joinCss(cssHead, overrides, cssTail);
      } else {
        text = await loadFile(file);
      }
      setCodeTarget(file);
      applyCode(text);
      setCodeOriginal(text);
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  /*
   * Moves the file between the two ways of editing it.
   *
   * Leaving the code view is what applies what was typed there — but only when
   * the editor was holding the PAGE. A stylesheet's text is not markup, and
   * feeding it to the parser would produce a document made of nothing.
   */
  async function switchView(next: string) {
    // Asked before anything else happens, because the answer may be to stay
    // put, and the transitions below have side effects worth not having.
    if (!(await confirmLeavingForLive(next))) {
      return;
    }
    const current = docRef.current;
    applyCodeEdits(current, next);
    enterCodeView(current, next);
    setView(next);
  }

  // Whether to go on, which is only in question when walking into Live with unsaved work.
  async function confirmLeavingForLive(next: string): Promise<boolean> {
    /*
     * Live is the only view that does not show the document being edited: it
     * loads the page from its real URL, which is the file as it stands on
     * disk. Walking into it with unsaved work means looking at an older page
     * and drawing conclusions from it, so the choice is made here rather than
     * discovered later.
     *
     * Asked before anything else happens, because the answer may be to stay
     * put, and the transitions below have side effects worth not having.
     */
    if (next === 'live' && dirty) {
      const answer = await choice({
        title: 'Unsaved changes',
        message:
          'Live loads ' +
          canonicalUrl(path) +
          ' from the server, so it shows the ' +
          'page as it was last saved. The changes you have made here will not be in it.',
        buttons: [
          { label: 'Save, then open Live', value: 'save', kind: 'primary' },
          { label: 'Open Live anyway', value: 'live', kind: 'secondary' },
          { label: 'Keep editing', value: 'stay', kind: 'secondary' },
        ],
      });
      // Dismissing the dialog is not a decision to go anywhere.
      if (answer === null || answer === 'stay') {
        return false;
      }
      if (answer === 'save' && !(await save())) {
        return false;
      }
    }
    return true;
  }

  // Leaving the code view applies what was typed there, to the stylesheet or to the page.
  function applyCodeEdits(current: Document | null | undefined, next: string) {
    /*
     * Leaving the code view with hand-edited CSS feeds it back the other way,
     * so the Style panel is looking at the same stylesheet you were just
     * typing into rather than at what was on disk when the page opened.
     *
     * The text is then replaced by what the split produces, because the two
     * have to agree: the browser's CSS engine normalises the block on the way
     * in, and leaving the editor holding the un-normalised version would make
     * the next trip back look like a conflict when nothing has conflicted.
     * Only the fenced block changes shape — everything above and below it is
     * carried as raw text and comes back exactly as typed.
     *
     * Not recorded in the undo history, and deliberately so: head and tail
     * are not part of a snapshot, so a half-undo would leave the block and
     * the author's CSS describing different moments. Saving behaves the same
     * way for the same reason.
     */
    if (
      view === 'code' &&
      next !== 'code' &&
      cssPath &&
      codeTarget === cssPath &&
      code !== codeOriginal
    ) {
      const split = splitCss(code);
      setCssHead(split.head);
      setCssTail(split.tail);
      setOverrides(split.overrides);
      applyCode(joinCss(split.head, split.overrides, split.tail));
    }
    if (view === 'code' && codeTarget === path && code !== codeOriginal) {
      if (current) {
        const before: Snapshot = {
          html: current.documentElement.innerHTML,
          overrides,
          revision: revisionRef.current,
        };
        setHistory(stack => [...stack.slice(-(HISTORY - 1)), before]);
      }
      // Typing in the code view changed the file, so this is a new revision.
      revisionRef.current = ++revisionsRef.current;
      setSrcDoc(prepareDocument(code, origin + canonicalUrl(path)));
      setSelected(null);
      setHovered(null);
      setDirty(true);
    }
  }

  // Entering the code view loads what it is going to edit.
  function enterCodeView(current: Document | null | undefined, next: string) {
    /*
     * Entering the code view loads the page — unless a stylesheet was already
     * open, in which case that draft is left exactly where it was rather than
     * being thrown away by a trip to the canvas and back.
     */
    if (next === 'code' && current && (codeTarget === '' || codeTarget === path)) {
      const text = serializeDocument(current);
      setCodeTarget(path);
      applyCode(text);
      setCodeOriginal(text);
    } else if (next === 'code' && cssPath && codeTarget === cssPath) {
      /*
       * The stylesheet is already open, and the Style panel may have written
       * rules since it was loaded. What the editor holds would then be the
       * file WITHOUT them — and saving from here writes what the editor
       * holds, so those rules would disappear without anybody being told.
       *
       * So the text is brought up to date: the code view shows the file as it
       * would be written, which is what it claims to show everywhere else.
       * Only when the editor also has hand edits is there a real conflict,
       * and that is the one case worth interrupting for, because saving then
       * genuinely has to choose between two versions.
       */
      const joined = joinCss(cssHead, overrides, cssTail);
      if (code === codeSetRef.current) {
        /*
         * Nothing has been typed since the app last filled the editor, so
         * whatever differs is the Style panel's doing and the text can simply
         * catch up. Only text the user wrote themselves is worth protecting.
         */
        applyCode(joined);
        if (code === codeOriginal) {
          setCodeOriginal(joined);
        }
      } else if (joined !== code) {
        showToast(
          'The Style panel has changes this editor does not. Saving here writes what ' +
            'you see and drops them — save from the design view first to keep both.',
          true,
        );
      }
    }
  }

  return { switchCodeTarget, switchView };
}

/*
 * Writing the open page back to disk, along with whichever of its own files
 * changed with it.
 */

import { saveFile } from '../../../lib/api';
import { showError } from '../../../lib/errors';
import { showToast } from '../../../lib/toast';
import { bumpAsset, syncSharedAssetVersions } from '../assets';
import { joinCss, splitCss } from '../css';
import { serializeDocument } from '../html';
import type { CodeDraft } from './useCodeDraft';
import type { DocumentState } from './useDocumentState';
import type { StylesheetState } from './useStylesheetState';
import type { UndoHistory } from './useUndoHistory';

export function useSave(o: {
  view: string;
  documentState: DocumentState;
  codeDraft: CodeDraft;
  stylesheet: StylesheetState;
  undoHistory: Pick<UndoHistory, 'revisionRef' | 'savedRevisionRef'>;
}) {
  const { view } = o;
  const { docRef, path, setSaving, setDirty } = o.documentState;
  const { code, codeTarget, setCodeOriginal, applyCode } = o.codeDraft;
  const {
    cssPath,
    cssOriginal,
    setCssOriginal,
    cssHead,
    setCssHead,
    cssTail,
    setCssTail,
    overrides,
    setOverrides,
  } = o.stylesheet;
  const { revisionRef, savedRevisionRef } = o.undoHistory;

  // Returns whether the file reached disk, for callers waiting on it.
  async function save(): Promise<boolean> {
    const current = docRef.current;
    if (!current || !path) {
      return false;
    }
    setSaving(true);
    try {
      /*
       * A linked file open in the code view — a stylesheet or a script — IS
       * that file, whole. It is written as typed, and the page is written
       * with it because every local link on it just had its version bumped,
       * which is the only reason anyone's browser will fetch any of the new
       * copies. When the file happens to be the one the Style panel writes
       * into, the panel re-reads the result so the two agree again straight
       * away.
       */
      if (view === 'code' && codeTarget !== '' && codeTarget !== path) {
        syncSharedAssetVersions(current);
        bumpAsset(current, codeTarget);
        await saveFile(path, serializeDocument(current));
        await saveFile(codeTarget, code);
        setCodeOriginal(code);
        if (codeTarget === cssPath) {
          const split = splitCss(code);
          setCssOriginal(code);
          setCssHead(split.head);
          setCssTail(split.tail);
          setOverrides(split.overrides);
        }
        savedRevisionRef.current = revisionRef.current;
        setDirty(false);
        showToast('Saved ' + codeTarget);
        return true;
      }
      const css = joinCss(cssHead, overrides, cssTail);
      const cssChanged = !!cssPath && css !== cssOriginal;
      /*
       * Done before the page is serialised, so the bumped link goes out in
       * the same save. In the code view the text on screen is the file and
       * the user owns it, so nothing is rewritten underneath them there — and
       * bumping here would be invisible anyway, since that branch below saves
       * the typed text rather than this document's serialised form.
       */
      if (view !== 'code') {
        syncSharedAssetVersions(current);
        if (cssChanged) {
          bumpAsset(current, cssPath);
        }
      }
      /*
       * In the code view what is on screen IS the file, so it is written
       * through as typed rather than re-formatted from the document — nobody
       * wants their own hand formatting rearranged the moment they save it.
       */
      await saveFile(path, view === 'code' ? code : serializeDocument(current));
      if (cssChanged) {
        await saveFile(cssPath, css);
        setCssOriginal(css);
        // The code view may be holding this same file — move its draft onto
        // what was just written, or it would offer to save the old text back.
        if (codeTarget === cssPath) {
          applyCode(css);
          setCodeOriginal(css);
        }
      }
      savedRevisionRef.current = revisionRef.current;
      setDirty(false);
      showToast('Saved ' + path);
      return true;
    } catch (err) {
      showError(err);
      return false;
    } finally {
      setSaving(false);
    }
  }

  return save;
}

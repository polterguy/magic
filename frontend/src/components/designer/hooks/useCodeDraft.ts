/*
 * The text the code view holds, which file it is, and what it was when it
 * was handed over.
 */

import { useRef, useState } from 'react';
import { useEditToken } from '../../../lib/editor';

export function useCodeDraft() {
  // The file as text, while the code view has it, and as it was handed over —
  // the difference between them is whether the code view changed anything.
  const [code, setCode] = useState('');
  /*
   * Bumped only when `code` is deliberately replaced by AI generation — never
   * by applyCode's programmatic reloads below — so the generated replacement
   * becomes one undo step without making a silent reload undoable.
   */
  const [codeEditId, bumpCodeEditId] = useEditToken();
  const [codeOriginal, setCodeOriginal] = useState('');
  // Which file the code view holds. The page itself unless a stylesheet was picked.
  const [codeTarget, setCodeTarget] = useState('');
  /*
   * The last text the app itself put in the editor. Anything else means the
   * user has typed since, which is the difference between "this can be
   * refreshed" and "these are two versions that have to be reconciled".
   */
  const codeSetRef = useRef('');

  function applyCode(value: string) {
    codeSetRef.current = value;
    setCode(value);
  }

  return {
    code,
    setCode,
    codeEditId,
    bumpCodeEditId,
    codeOriginal,
    setCodeOriginal,
    codeTarget,
    setCodeTarget,
    codeSetRef,
    applyCode,
  };
}

export type CodeDraft = ReturnType<typeof useCodeDraft>;

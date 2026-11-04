/*
 * The page being designed: which file it is, the document the canvas holds
 * for it, what is selected and hovered there, and whether it has been saved.
 */

import { useRef, useState } from 'react';

export function useDocumentState() {
  const [path, setPath] = useState('');
  const [srcDoc, setSrcDoc] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  // A Chat Ops turn rewrote files while there were unsaved changes here.
  const [stale, setStale] = useState(false);

  /*
   * The canvas document is the editing model, and it is not React state — so
   * every mutation bumps this, and everything reading the document renders
   * again. Measurements taken from live layout are re-taken at the same time.
   */
  const [version, setVersion] = useState(0);
  /*
   * The selection is a NODE, not an element: a run of text is selected,
   * edited, moved and deleted exactly like anything else on the page.
   */
  const [selected, setSelected] = useState<Node | null>(null);
  const [hovered, setHovered] = useState<Node | null>(null);
  /*
   * Bumped only when the hover came from the tree, which is what tells the
   * canvas to bring that node on screen. A hover from the canvas itself must
   * not scroll anything — the pointer is already on the thing.
   */
  const [revealHovered, setRevealHovered] = useState(0);
  // Bumped by a double click in the tree — take me to the selection.
  const [revealSelected, setRevealSelected] = useState(0);

  /*
   * Set when the open page renders nothing at all on its own. A compiled
   * single-page application is the usual reason: its whole interface is
   * built by the script the canvas refuses to run, so the file itself is an
   * empty mount point and there is genuinely nothing on it to design.
   */
  const [shell, setShell] = useState(false);

  const docRef = useRef<Document | null>(null);
  /*
   * The canvas document, for rendering. docRef holds the same document for
   * handlers; this copy is what tells React a new one has loaded.
   */
  const [doc, setDoc] = useState<Document | null>(null);

  return {
    path,
    setPath,
    srcDoc,
    setSrcDoc,
    busy,
    setBusy,
    saving,
    setSaving,
    dirty,
    setDirty,
    stale,
    setStale,
    version,
    setVersion,
    selected,
    setSelected,
    hovered,
    setHovered,
    revealHovered,
    setRevealHovered,
    revealSelected,
    setRevealSelected,
    shell,
    setShell,
    docRef,
    doc,
    setDoc,
  };
}

export type DocumentState = ReturnType<typeof useDocumentState>;

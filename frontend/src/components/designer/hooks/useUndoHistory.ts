/*
 * Undo and redo, and the revision counter that tells the Save button whether
 * there is anything left to write.
 */

import { useEffect, useRef, useState } from 'react';

import type { Overrides } from '../css';
import { nodeAt, pathTo } from '../nodes';
import type { DocumentState } from './useDocumentState';
import type { StylesheetState } from './useStylesheetState';

// How many steps back the undo history goes.
export const HISTORY = 50;

/*
 * One snapshot of everything an undo has to put back, and which revision of
 * the page it is.
 *
 * The revision is what makes the Save button honest. Every change mints a new
 * one and saving remembers it, so stepping back to the revision that was last
 * written means there is nothing to write — the file on disk already says
 * this. Comparing the document to the file instead would mean serialising it
 * on every keystroke to answer a question a counter answers exactly.
 */
export interface Snapshot {
  html: string;
  overrides: Overrides;
  revision: number;
}

export function useUndoHistory(
  documentState: DocumentState,
  stylesheet: Pick<StylesheetState, 'overrides' | 'setOverrides'>,
) {
  const { docRef, selected, setSelected, setHovered, setDirty, setVersion } = documentState;
  const { overrides, setOverrides } = stylesheet;

  const [history, setHistory] = useState<Snapshot[]>([]);
  /*
   * What undo took away. Editing again abandons it, which is the ordinary
   * rule everywhere: the moment you change something after stepping back,
   * the branch you stepped out of stops being reachable.
   */
  const [future, setFuture] = useState<Snapshot[]>([]);
  // Which revision the document holds, and which one reached the disk.
  const revisionRef = useRef(0);
  const savedRevisionRef = useRef(0);
  const revisionsRef = useRef(0);

  /*
   * Consecutive edits of the same thing — dragging a slider, typing into a
   * field — share one undo step. Cleared whenever the selection moves, so the
   * next element starts a step of its own.
   */
  const coalesceRef = useRef<string | null>(null);

  useEffect(() => {
    coalesceRef.current = null;
  }, [selected]);

  /* -- Mutation ----------------------------------------------------------- */

  function mutate(change: () => void, coalesce?: string) {
    const current = docRef.current;
    if (!current) {
      return;
    }
    if (!coalesce || coalesce !== coalesceRef.current) {
      /*
       * Read now, not inside the updater. React may call an updater later,
       * during the render it schedules — and by then change() has run and the
       * document holds the very state this snapshot exists to undo. Capturing
       * the string here pins it to the moment before anything moved.
       */
      const before: Snapshot = {
        html: current.documentElement.innerHTML,
        overrides,
        revision: revisionRef.current,
      };
      setHistory(stack => [...stack.slice(-(HISTORY - 1)), before]);
    }
    revisionRef.current = ++revisionsRef.current;
    coalesceRef.current = coalesce ?? null;
    setFuture([]);
    change();
    setDirty(true);
    setVersion(value => value + 1);
  }

  function undo() {
    const current = docRef.current;
    const snapshot = history[history.length - 1];
    if (!current || !snapshot) {
      return;
    }
    /*
     * Everything in the canvas is replaced, so every element reference held
     * out here — the selection, the hover — now points at a node that is no
     * longer in the document.
     */
    // Captured before restore() replaces it, for the reason given in mutate().
    const undone: Snapshot = {
      html: current.documentElement.innerHTML,
      overrides,
      revision: revisionRef.current,
    };
    setFuture(stack => [...stack, undone]);
    restore(snapshot);
    setHistory(stack => stack.slice(0, -1));
  }

  /*
   * The mirror of undo. What is about to be put back goes onto the history
   * stack on the way past, so the two stay each other's opposite however many
   * times you step in either direction.
   */
  function redo() {
    const current = docRef.current;
    const snapshot = future[future.length - 1];
    if (!current || !snapshot) {
      return;
    }
    const redone: Snapshot = {
      html: current.documentElement.innerHTML,
      overrides,
      revision: revisionRef.current,
    };
    setHistory(stack => [...stack.slice(-(HISTORY - 1)), redone]);
    restore(snapshot);
    setFuture(stack => stack.slice(0, -1));
  }

  /*
   * Putting a snapshot back into the canvas, shared by both directions.
   *
   * The selection is carried across by position rather than by reference,
   * because every node in the document is about to be rebuilt. Losing it on
   * each step made stepping back and forth cost a re-selection every time,
   * which is most of what undo is for.
   *
   * The hover is not carried across. It belongs to the pointer, and the
   * pointer has not moved.
   */
  function restore(snapshot: Snapshot) {
    const current = docRef.current!;
    const where = selected ? pathTo(selected, current.documentElement) : null;
    current.documentElement.innerHTML = snapshot.html;
    setOverrides(snapshot.overrides);
    setSelected(where ? nodeAt(current.documentElement, where) : null);
    setHovered(null);
    coalesceRef.current = null;
    revisionRef.current = snapshot.revision;
    /*
     * Stepping back to what was last saved leaves nothing to save. Undoing
     * past that point, or forward again, makes it dirty once more.
     */
    setDirty(snapshot.revision !== savedRevisionRef.current);
    setVersion(value => value + 1);
  }

  return {
    history,
    setHistory,
    future,
    setFuture,
    revisionRef,
    savedRevisionRef,
    revisionsRef,
    mutate,
    undo,
    redo,
  };
}

export type UndoHistory = ReturnType<typeof useUndoHistory>;

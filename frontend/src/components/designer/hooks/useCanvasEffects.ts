/*
 * What the canvas document is kept in step with outside of any one edit: the
 * designer's own stylesheet block, hidden elements forced into view, empty
 * containers given room to drop into — and which elements are hidden.
 */

import { useEffect, useMemo } from 'react';
import { canContainChildren } from '../html';
import { designableChildren } from '../nodes';
import { ownStylesheet, overrideCss } from '../css';
import type { DocumentState } from './useDocumentState';
import type { StylesheetState } from './useStylesheetState';

export function useCanvasEffects(o: {
  reveal: boolean;
  documentState: Pick<DocumentState, 'docRef' | 'doc' | 'srcDoc' | 'version' | 'setVersion'>;
  stylesheet: Pick<StylesheetState, 'overrides' | 'cssPath' | 'cssHead' | 'cssTail'>;
}) {
  const { reveal } = o;
  const { docRef, doc, srcDoc, version, setVersion } = o.documentState;
  const { overrides, cssPath, cssHead, cssTail } = o.stylesheet;
  /*
   * docRef and setVersion are in the dependency lists below only because they
   * arrive here as arguments, where the linter cannot tell they are a ref and
   * a state setter. Neither ever changes identity, so they never make an
   * effect run that would not have run with them left out.
   */

  /* -- Effects ------------------------------------------------------------ */

  // Style-rule edits show up in the canvas through the sheet the designer owns.
  useEffect(() => {
    docRef.current
      ?.querySelector('style[data-magic-overrides]')
      ?.replaceChildren(overrideCss(overrides));
  }, [overrides, version, docRef]);

  /*
   * And the sheet the designer owns is the only place the block lives, so that
   * taking a rule out of it takes it off the page. Re-run whenever the
   * author's half changes too, because editing the file as text is a way of
   * changing both halves at once.
   */
  useEffect(() => {
    if (docRef.current && cssPath) {
      ownStylesheet(docRef.current, cssPath, cssHead, cssTail);
    }
  }, [cssPath, cssHead, cssTail, version, docRef]);

  /*
   * Forces every element the page hides to render, so it can be designed.
   * Which elements those are is asked of the browser rather than guessed from
   * class names — a page may hide things any way it likes.
   */
  useEffect(() => {
    const current = docRef.current;
    const view = current?.defaultView;
    if (!current || !view) {
      return;
    }
    current
      .querySelectorAll('[data-magic-force]')
      .forEach(element => delete (element as HTMLElement).dataset.magicForce);
    if (reveal) {
      current.body.querySelectorAll('*').forEach(element => {
        if (view.getComputedStyle(element).display === 'none') {
          (element as HTMLElement).dataset.magicForce = '';
        }
      });
    }
    setVersion(value => value + 1);
    // Not on version: this effect changes the document, and would re-run itself.
  }, [reveal, srcDoc, docRef, setVersion]);

  /*
   * Gives every empty container a minimum footprint, so it can be dropped
   * into. A <div> with nothing inside it and no padding of its own renders at
   * zero height by default — not merely hard to aim at, but genuinely absent
   * from the page: a point-based hit test has no pixel of it to land on. This
   * runs on every change, unlike the reveal effect above, and only ever
   * toggles an attribute CSS already reacts to, so it does not need a version
   * bump of its own to show up and cannot loop by triggering one.
   */
  useEffect(() => {
    const current = docRef.current;
    if (!current) {
      return;
    }
    current
      .querySelectorAll('[data-magic-empty]')
      .forEach(element => delete (element as HTMLElement).dataset.magicEmpty);
    current.body.querySelectorAll('*').forEach(element => {
      if (canContainChildren(element) && designableChildren(element).length === 0) {
        (element as HTMLElement).dataset.magicEmpty = '';
      }
    });
  }, [version, srcDoc, docRef]);

  const hidden = useMemo(() => {
    const found = new Set<Element>();
    const view = doc?.defaultView;
    if (!doc || !view) {
      return found;
    }
    doc.body.querySelectorAll('*').forEach(element => {
      if (
        (element as HTMLElement).dataset.magicForce !== undefined ||
        view.getComputedStyle(element).display === 'none'
      ) {
        found.add(element);
      }
    });
    return found;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version stands for edits to the live DOM, which the memo cannot otherwise see
  }, [doc, version]);

  return hidden;
}

/*
 * The Style panel's edits: which rules the selected element can be styled
 * through, and writing to the element itself or to one of those rules.
 */

import { useMemo } from 'react';
import { showToast } from '../../../lib/toast';
import { INLINE } from '../Styles';
import { selectorsFor } from '../css';
import { elementOf } from '../nodes';
import type { DocumentState } from './useDocumentState';
import type { StylesheetState } from './useStylesheetState';
import type { UndoHistory } from './useUndoHistory';

export function useStyleEdits(o: {
  documentState: Pick<DocumentState, 'docRef' | 'selected' | 'setSelected' | 'version'>;
  stylesheet: Pick<
    StylesheetState,
    'cssPath' | 'cssHead' | 'overrides' | 'setOverrides' | 'target' | 'setTarget'
  >;
  mutate: UndoHistory['mutate'];
}) {
  const { mutate } = o;
  const { docRef, selected, setSelected, version } = o.documentState;
  const { cssPath, cssHead, overrides, setOverrides, target, setTarget } = o.stylesheet;

  // The page's own selectors this element is styled by, offered as edit targets.
  // Text has no styles of its own, so the style panel works on the element
  // around it — which is what anyone picking a colour with a sentence
  // selected actually means.
  const styleTarget = elementOf(selected);
  /*
   * On [version] as well as the element and the stylesheet, because which
   * selectors match is decided by element.matches() — live DOM state that a
   * memo cannot see. Adding a class changes neither the element's identity nor
   * the stylesheet text, so without this the list stays as it was and the
   * class you just added is missing from it.
   */
  const selectors = useMemo(
    /*
     * Only when there is a stylesheet to put them in. A rule for a selector
     * has nowhere to go without one, and save() would drop it silently — so
     * a page that links no local stylesheet offers this element only.
     */
    () => (styleTarget && cssPath ? selectorsFor(styleTarget, cssHead, overrides) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version stands for live DOM state (element.matches()), see above
    [styleTarget, cssPath, cssHead, overrides, version],
  );

  // A selector that styled the last element rarely styles the next one.
  if (target !== INLINE && !selectors.includes(target)) {
    setTarget(INLINE);
  }

  /*
   * Drops a rule from the block entirely.
   *
   * Clearing its properties one at a time leaves the selector behind holding
   * nothing, which then has to be written out and read back as an empty rule
   * forever. This takes the whole entry away.
   */
  function removeRule(selector: string) {
    mutate(() =>
      setOverrides(current => {
        const next = { ...current };
        delete next[selector];
        return next;
      }),
    );
    if (target === selector) {
      setTarget(INLINE);
    }
  }

  /*
   * Opening a rule from the list.
   *
   * Setting the target alone is not enough: the panel keeps the target only
   * while the selection actually matches it, since every value it shows is
   * read off the selected element. So this moves the selection to something
   * the rule applies to first, and the rule then opens with real values in
   * it. A rule matching nothing left on the page can still be deleted — it
   * just cannot be edited, because there is nothing to show it against.
   */
  function editRule(selector: string) {
    const current = docRef.current;
    if (!current) {
      return;
    }
    let element: Element | null = null;
    try {
      element = current.body.querySelector(selector);
    } catch {
      element = null;
    }
    if (!element) {
      showToast('Nothing on this page matches ' + selector + ' any more', true);
      return;
    }
    setSelected(element);
    setTarget(selector);
  }

  function setStyle(property: string, value: string) {
    const element = styleTarget;
    if (!element) {
      return;
    }
    if (target === INLINE) {
      mutate(() => {
        const style = (element as HTMLElement).style;
        if (value === '') {
          style.removeProperty(property);
        } else {
          style.setProperty(property, value);
        }
      }, 'style:' + property);
      return;
    }
    mutate(
      () =>
        setOverrides(current => {
          const declarations = { ...current[target] };
          if (value === '') {
            delete declarations[property];
          } else {
            declarations[property] = value;
          }
          return { ...current, [target]: declarations };
        }),
      'rule:' + target + ':' + property,
    );
  }

  return { styleTarget, selectors, removeRule, editRule, setStyle };
}

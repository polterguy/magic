/*
 * The Web Designer's own interface state — which view and width the middle
 * pane has, which tab the right rail shows, which rails are folded, and which
 * dialog or drag is in progress. None of it is the page being designed.
 */

import { useLayoutEffect, useRef, useState } from 'react';

import { VIEWPORTS } from '../layout';
import type { MediaKind } from '../mediaKinds';
import type { Home } from '../metaTags';
import type { Block } from '../palette';

export function useDesignerUi() {
  const [reveal, setReveal] = useState(false);
  /*
   * What the middle pane is showing. Design edits the file through the
   * canvas; Code edits the same file as text; Live runs it for real.
   */
  const [view, setView] = useState('design');
  // Which picker is open, if any — images, video or audio.
  /*
   * The open picker, and what it is picking for. Without a [home] it is the
   * selected element; with one it is a field in the head, which takes an
   * absolute address rather than a path because somebody else's server
   * fetches it.
   */
  const [choosingMedia, setChoosingMedia] = useState<{ kind: MediaKind; home?: Home } | null>(null);
  const [viewport, setViewport] = useState('desktop');
  // The palette block being dragged in. Its markup is not built until it
  // lands, because what it should look like depends on where it lands.
  const [pending, setPending] = useState<Block | null>(null);
  const [tab, setTab] = useState('element');
  /*
   * Rails that have been folded away to give the canvas the room.
   *
   * Remembered across sessions, the same way the navigation's own collapse is:
   * somebody who works with the page filling the screen wants it filling the
   * screen tomorrow too, and re-folding two rails on every visit is the kind
   * of small tax that makes a preference not worth having.
   */
  const [railsShut, setRailsShut] = useState<Record<'left' | 'right', boolean>>(() => ({
    left: localStorage.getItem('magic2.designer.leftShut') === 'true',
    right: localStorage.getItem('magic2.designer.rightShut') === 'true',
  }));

  function toggleRail(side: 'left' | 'right') {
    const shut = !railsShut[side];
    localStorage.setItem('magic2.designer.' + side + 'Shut', String(shut));
    setRailsShut(current => ({ ...current, [side]: shut }));
  }
  // Narrows the block list, and the custom tag typed beside it.
  const [blockFilter, setBlockFilter] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [creating, setCreating] = useState(false);

  // For onReady, which fires long after the render that set the view.
  const viewRef = useRef(view);
  // Kept current after every commit, before any effect or listener can read it.
  useLayoutEffect(() => {
    viewRef.current = view;
  });

  const width = VIEWPORTS.find(entry => entry.id === viewport)?.width ?? null;

  return {
    reveal,
    setReveal,
    view,
    setView,
    viewRef,
    choosingMedia,
    setChoosingMedia,
    viewport,
    setViewport,
    width,
    pending,
    setPending,
    tab,
    setTab,
    railsShut,
    toggleRail,
    blockFilter,
    setBlockFilter,
    customTag,
    setCustomTag,
    creating,
    setCreating,
  };
}

export type DesignerUi = ReturnType<typeof useDesignerUi>;

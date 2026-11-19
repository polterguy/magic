/*
 * A right-aligned row of actions that never wraps and never jumps.
 *
 * When the actions don't all fit, the leftmost ones that aren't pinned move into a "more" menu
 * that takes their place at the start of the row, rather than the row wrapping onto a second line or squeezing its
 * neighbours. Which actions fit depends only on the room available and on which actions
 * exist. It never depends on their state: a button going disabled, busy or enabled keeps its
 * width (see BusyLabel), so Save lighting up can't move a thing.
 *
 * Every action is also rendered in an invisible measuring row, so each button's natural width
 * is known even while it sits in the menu, and the decision can be made in one layout pass.
 */

import { ReactNode, useCallback, useLayoutEffect, useRef, useState } from 'react';

import BusyLabel from './BusyLabel';
import { MenuIcon } from './Icons';
import Menu, { type MenuItem } from './Menu';
import { overflowCount } from './toolbarOverflow';

export interface ToolbarAction {
  id: string;
  label: string;
  icon: ReactNode;
  title?: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  // The label while busy, which the button reserves room for at all times.
  busyLabel?: string;
  // The filled, primary button rather than a secondary one.
  primary?: boolean;
  // Never moves into the menu.
  pinned?: boolean;
}

// An action's button. The ruler's copy has no title, so it is never found or announced.
function ActionButton(props: Readonly<{ action: ToolbarAction; ruler?: boolean }>) {
  const { action } = props;
  return (
    <button
      type="button"
      className={action.primary ? 'btn btn-small' : 'btn btn-secondary btn-small'}
      title={props.ruler ? undefined : (action.title ?? action.label)}
      disabled={action.disabled || action.busy}
      onClick={action.onClick}
    >
      {action.icon}
      {action.busyLabel ? (
        <BusyLabel busy={!!action.busy} label={action.label} busyLabel={action.busyLabel} />
      ) : (
        action.label
      )}
    </button>
  );
}

export default function Toolbar(
  props: Readonly<{
    actions: ToolbarAction[];
    // The title of the "more" menu's trigger.
    moreTitle?: string;
  }>,
) {
  const { actions } = props;
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(0);

  /*
   * Only which actions exist, and which are pinned, can change the outcome, so that's all
   * re-measuring is keyed on.
   */
  const shape = actions.map(action => (action.pinned ? '!' : '') + action.id).join('|');

  const measure = useCallback(() => {
    const row = rowRef.current;
    const ruler = measureRef.current;
    if (!row || !ruler) {
      return;
    }
    const widths = Array.from(ruler.children, child => (child as HTMLElement).offsetWidth);
    const triggerWidth = widths.pop() ?? 0;
    const pinned = shape.split('|').map(key => key.startsWith('!'));
    setHidden(overflowCount(pinned, widths, triggerWidth, row.clientWidth));
  }, [shape]);

  useLayoutEffect(() => {
    measure();
    const row = rowRef.current;
    if (!row) {
      return;
    }
    const observer = new ResizeObserver(() => measure());
    observer.observe(row);
    return () => observer.disconnect();
  }, [measure]);

  const unpinned = actions.filter(action => !action.pinned);
  const overflowed = new Set(unpinned.slice(0, hidden).map(action => action.id));
  const items: MenuItem[] = actions
    .filter(action => overflowed.has(action.id))
    .map(action => ({
      label: action.busy && action.busyLabel ? action.busyLabel : action.label,
      icon: action.icon,
      hint: action.title,
      disabled: action.disabled || action.busy,
      onClick: action.onClick,
    }));
  const moreTitle = props.moreTitle ?? 'More actions';

  return (
    <div className="overflow-toolbar" ref={rowRef}>
      <div className="overflow-toolbar-measure" ref={measureRef} aria-hidden="true" inert>
        {actions.map(action => (
          <ActionButton key={action.id} action={action} ruler />
        ))}
        <button type="button" className="btn btn-secondary btn-small">
          <MenuIcon />
        </button>
      </div>
      {items.length > 0 && <Menu title={moreTitle} items={items} />}
      {actions
        .filter(action => !overflowed.has(action.id))
        .map(action => (
          <ActionButton key={action.id} action={action} />
        ))}
    </div>
  );
}

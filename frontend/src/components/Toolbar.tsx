/*
 * A right-aligned row of actions and dropdown menus that never wraps and never jumps.
 *
 * An entry is either an action, rendered as a button, or a group, rendered as a menu trigger
 * ("File ▾") that drops down the group's actions. Grouping keeps the bar short while keeping
 * related actions together.
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
import { ChevronIcon, MenuIcon } from './Icons';
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

// A dropdown of related actions, behind a trigger showing its icon and label.
export interface ToolbarGroup {
  id: string;
  label: string;
  icon: ReactNode;
  title?: string;
  items: ToolbarAction[];
  // Never moves into the "more" menu.
  pinned?: boolean;
}

export type ToolbarEntry = ToolbarAction | ToolbarGroup;

const isGroup = (entry: ToolbarEntry): entry is ToolbarGroup => 'items' in entry;

// An action as an item in a menu.
function menuItem(action: ToolbarAction): MenuItem {
  return {
    label: action.busy && action.busyLabel ? action.busyLabel : action.label,
    icon: action.icon,
    hint: action.title,
    disabled: action.disabled || action.busy,
    onClick: action.onClick,
  };
}

/*
 * A group's trigger. While one of its actions is busy the trigger says so ("Generating…"), with
 * its width reserved for that at all times, like any busy button. It is disabled only when none
 * of its actions can be taken.
 */
function GroupTrigger(props: Readonly<{ group: ToolbarGroup; ruler?: boolean }>) {
  const { group } = props;
  const busyItem = group.items.find(item => item.busyLabel);
  const content = (
    <>
      {group.icon}
      {busyItem?.busyLabel ? (
        <BusyLabel busy={!!busyItem.busy} label={group.label} busyLabel={busyItem.busyLabel} />
      ) : (
        group.label
      )}
      <span className="toolbar-caret" aria-hidden="true">
        <ChevronIcon open />
      </span>
    </>
  );
  if (props.ruler) {
    return (
      <button type="button" className="btn btn-secondary btn-small">
        {content}
      </button>
    );
  }
  return (
    <Menu
      title={group.title ?? group.label}
      items={group.items.map(menuItem)}
      disabled={group.items.every(item => item.disabled || item.busy)}
      align="start"
    >
      {content}
    </Menu>
  );
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
    actions: ToolbarEntry[];
    // The title of the "more" menu's trigger.
    moreTitle?: string;
  }>,
) {
  const { actions } = props;
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(0);

  /*
   * Only which entries exist, and which are pinned, can change the outcome, so that's all
   * re-measuring is keyed on.
   */
  const shape = actions
    .map(
      entry =>
        (entry.pinned ? '!' : '') +
        entry.id +
        // A group's trigger is as wide as its label or its busy label, whichever is wider.
        (isGroup(entry) ? ':' + (entry.items.find(item => item.busyLabel)?.busyLabel ?? '') : ''),
    )
    .join('|');

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
  // An overflowed group keeps its name, as a heading above its actions.
  const items: MenuItem[] = actions
    .filter(entry => overflowed.has(entry.id))
    .flatMap(entry =>
      isGroup(entry) ? [{ heading: entry.label }, ...entry.items.map(menuItem)] : [menuItem(entry)],
    );
  const moreTitle = props.moreTitle ?? 'More actions';

  return (
    <div className="overflow-toolbar" ref={rowRef}>
      <div className="overflow-toolbar-measure" ref={measureRef} aria-hidden="true" inert>
        {actions.map(entry =>
          isGroup(entry) ? (
            <GroupTrigger key={entry.id} group={entry} ruler />
          ) : (
            <ActionButton key={entry.id} action={entry} ruler />
          ),
        )}
        <button type="button" className="btn btn-secondary btn-small">
          <MenuIcon />
        </button>
      </div>
      {items.length > 0 && <Menu title={moreTitle} items={items} />}
      {actions
        .filter(entry => !overflowed.has(entry.id))
        .map(entry =>
          isGroup(entry) ? (
            <GroupTrigger key={entry.id} group={entry} />
          ) : (
            <ActionButton key={entry.id} action={entry} />
          ),
        )}
    </div>
  );
}

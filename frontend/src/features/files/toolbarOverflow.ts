/*
 * The arithmetic behind the overflow Toolbar (Toolbar.tsx): how many actions go into its menu.
 */

// The gap between buttons, matching .overflow-toolbar in styles.css.
const GAP = 10;

/*
 * How many of the leftmost unpinned actions go into the menu, given each action's width, the
 * menu trigger's width and the room available.
 */
export function overflowCount(
  pinned: readonly boolean[],
  widths: readonly number[],
  triggerWidth: number,
  available: number,
) {
  const rowWidth = (visible: number[]) =>
    visible.reduce((sum, width) => sum + width, 0) + GAP * Math.max(0, visible.length - 1);
  if (rowWidth([...widths]) <= available) {
    return 0;
  }
  const unpinned = pinned.flatMap((isPinned, index) => (isPinned ? [] : [index]));
  let hidden = 0;
  while (hidden < unpinned.length) {
    hidden++;
    const gone = new Set(unpinned.slice(0, hidden));
    const visible = widths.filter((_, index) => !gone.has(index));
    if (rowWidth([...visible, triggerWidth]) <= available) {
      break;
    }
  }
  return hidden;
}

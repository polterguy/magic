/*
 * A button label that swaps to a busy form ("Run" → "Running…") without changing the button's
 * width. The label for the other state is kept as an invisible ::after in the same grid cell, so
 * the label is always as wide as the wider of the two. Otherwise, in a right-aligned toolbar, a
 * button that grows when it goes busy pushes every control beside it sideways and back again.
 * The reserved label is CSS-generated content, so screen readers and tests see only the visible
 * label.
 */
export default function BusyLabel(
  props: Readonly<{
    busy: boolean;
    label: string;
    busyLabel: string;
  }>,
) {
  const { busy, label, busyLabel } = props;
  return (
    <span className="busy-label" data-alt={busy ? label : busyLabel}>
      <span>{busy ? busyLabel : label}</span>
    </span>
  );
}

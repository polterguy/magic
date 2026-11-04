/*
 * The fixed choices of the Web Designer's layout: the views the middle pane
 * can show, the widths the canvas can be, and the class names of the rails.
 */

export const VIEWS: { id: string; label: string; hint: string }[] = [
  { id: 'design', label: 'Design', hint: 'Edit the page by pointing at it' },
  { id: 'code', label: 'Code', hint: 'Edit the same file as HTML' },
  {
    id: 'live',
    label: 'Live',
    hint: 'Run the page for real, scripts and all — look, do not touch',
  },
];

export const VIEWPORTS: { id: string; label: string; width: number | null }[] = [
  { id: 'desktop', label: 'Desktop', width: null },
  { id: 'tablet', label: 'Tablet', width: 768 },
  { id: 'phone', label: 'Phone', width: 390 },
];

// The class names of a rail, which are the side it is on, and whether it is folded.
export function railClass(side: 'left' | 'right', railsShut: Record<'left' | 'right', boolean>) {
  return 'designer-rail' + (side === 'right' ? ' right' : '') + (railsShut[side] ? ' shut' : '');
}

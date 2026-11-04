import type { Dispatch, SetStateAction } from 'react';

/*
 * The draggable, keyboard-resizable divider between the file tree and the
 * editor.
 */
export default function Splitter(
  props: Readonly<{
    treeWidth: number;
    setTreeWidth: Dispatch<SetStateAction<number>>;
  }>,
) {
  const { treeWidth, setTreeWidth } = props;
  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a focusable separator is the ARIA splitter pattern (a widget), which jsx-a11y does not model */}
      <div
        className="splitter"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize the file tree"
        aria-valuemin={220}
        aria-valuemax={640}
        aria-valuenow={treeWidth}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- focusable so the arrow keys can resize it, per the ARIA splitter pattern
        tabIndex={0}
        onKeyDown={event => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            const step = event.key === 'ArrowRight' ? 16 : -16;
            setTreeWidth(width => Math.max(220, Math.min(640, width + step)));
          }
        }}
        onMouseDown={event => {
          event.preventDefault();
          const startX = event.clientX;
          const startWidth = treeWidth;
          const move = (ev: MouseEvent) =>
            setTreeWidth(Math.max(220, Math.min(640, startWidth + ev.clientX - startX)));
          const up = () => {
            globalThis.removeEventListener('mousemove', move);
            globalThis.removeEventListener('mouseup', up);
          };
          globalThis.addEventListener('mousemove', move);
          globalThis.addEventListener('mouseup', up);
        }}
      />
    </>
  );
}

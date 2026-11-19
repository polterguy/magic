// @vitest-environment jsdom
/*
 * Overflow Toolbar: the fitting arithmetic, and the rendered row — every action on the bar when
 * there is room, the leftmost unpinned ones in the "more" menu when there isn't, the pinned
 * action staying put, and a change of state never moving anything.
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Toolbar, { type ToolbarAction } from '../Toolbar';
import { overflowCount } from '../toolbarOverflow';

describe('overflowCount', () => {
  const pinned = [false, false, false, true];
  const widths = [100, 100, 100, 100];

  it('hides nothing when everything fits', () => {
    expect(overflowCount(pinned, widths, 30, 430)).toBe(0);
  });

  it('hides the leftmost unpinned actions until the rest and the trigger fit', () => {
    // 100 + 100 + 100 + trigger 30, with three gaps of 10 = 360.
    expect(overflowCount(pinned, widths, 30, 360)).toBe(1);
    expect(overflowCount(pinned, widths, 30, 359)).toBe(2);
  });

  it('never hides a pinned action, however narrow', () => {
    expect(overflowCount(pinned, widths, 30, 0)).toBe(3);
  });
});

// Every button is 100px wide, the trigger included, and the row is as wide as `rowWidth`.
let rowWidth = 1000;
let resize: () => void = () => {};

beforeEach(() => {
  rowWidth = 1000;
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(100);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.classList.contains('overflow-toolbar') ? rowWidth : 0;
  });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function actions(save: Partial<ToolbarAction> = {}): ToolbarAction[] {
  return [
    { id: 'copy', label: 'Copy path', icon: null, onClick: vi.fn() },
    { id: 'download', label: 'Download', icon: null, onClick: vi.fn() },
    { id: 'execute', label: 'Execute', icon: null, onClick: vi.fn() },
    {
      id: 'save',
      label: 'Save',
      busyLabel: 'Saving…',
      icon: null,
      pinned: true,
      primary: true,
      onClick: vi.fn(),
      ...save,
    },
  ];
}

const visibleLabels = () => screen.getAllByRole('button').map(button => button.textContent);

describe('Toolbar', () => {
  it('shows every action, and no menu, when they all fit', () => {
    render(<Toolbar actions={actions()} />);
    expect(visibleLabels()).toEqual(['Copy path', 'Download', 'Execute', 'Save']);
    expect(screen.queryByTitle('More actions')).toBeNull();
  });

  it('moves the leftmost actions into the menu, keeping the pinned one, when narrow', async () => {
    rowWidth = 330; // Room for three buttons with their gaps: the trigger and two actions.
    const list = actions();
    render(<Toolbar actions={list} />);
    expect(screen.queryByRole('button', { name: 'Copy path' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Download' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Execute' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

    await userEvent.click(screen.getByTitle('More actions'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Download' }));
    expect(list[1].onClick).toHaveBeenCalledTimes(1);
  });

  it('re-fits when the row is resized', () => {
    render(<Toolbar actions={actions()} />);
    expect(screen.getByRole('button', { name: 'Copy path' })).toBeInTheDocument();
    rowWidth = 330;
    act(() => resize());
    expect(screen.queryByRole('button', { name: 'Copy path' })).toBeNull();
  });

  it('keeps the same actions on the bar whatever state Save is in', () => {
    rowWidth = 330;
    const { rerender } = render(<Toolbar actions={actions({ disabled: true })} />);
    const before = visibleLabels();
    rerender(<Toolbar actions={actions({ disabled: false })} />);
    rerender(<Toolbar actions={actions({ busy: true })} />);
    expect(screen.getAllByRole('button')).toHaveLength(before.length);
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  });
});

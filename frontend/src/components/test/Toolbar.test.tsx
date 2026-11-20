// @vitest-environment jsdom
/*
 * Overflow Toolbar: the fitting arithmetic, and the rendered row — every action on the bar when
 * there is room, the leftmost unpinned ones in the "more" menu when there isn't, the pinned
 * action staying put, and a change of state never moving anything. Groups render as dropdown
 * menus, and fold into the "more" menu under their own heading.
 */
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Toolbar, { type ToolbarAction, type ToolbarEntry } from '../Toolbar';
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

function grouped(generate: Partial<ToolbarAction> = {}): ToolbarEntry[] {
  return [
    {
      id: 'file',
      label: 'File',
      icon: null,
      items: [
        { id: 'copy', label: 'Copy path', icon: null, onClick: vi.fn() },
        { id: 'download', label: 'Download file', icon: null, onClick: vi.fn() },
      ],
    },
    {
      id: 'hyperlambda',
      label: 'Hyperlambda',
      icon: null,
      items: [
        { id: 'execute', label: 'Execute', icon: null, onClick: vi.fn() },
        {
          id: 'generate',
          label: 'Generate',
          busyLabel: 'Generating…',
          icon: null,
          onClick: vi.fn(),
          ...generate,
        },
      ],
    },
    { id: 'save', label: 'Save', icon: null, pinned: true, primary: true, onClick: vi.fn() },
  ];
}

describe('Toolbar groups', () => {
  it('shows a group as a menu trigger that drops down its actions', async () => {
    const entries = grouped();
    render(<Toolbar actions={entries} />);
    expect(visibleLabels()).toEqual(['File', 'Hyperlambda', 'Save']);
    expect(screen.queryByRole('menuitem')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'File' }));
    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual([
      'Copy path',
      'Download file',
    ]);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Download file' }));
    const file = entries[0] as Extract<ToolbarEntry, { items: unknown }>;
    expect(file.items[1].onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menuitem')).toBeNull();
  });

  it('does not run a disabled action in a group', async () => {
    const entries = grouped({ disabled: true });
    render(<Toolbar actions={entries} />);
    await userEvent.click(screen.getByRole('button', { name: 'Hyperlambda' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Generate' }));
    const hyperlambda = entries[1] as Extract<ToolbarEntry, { items: unknown }>;
    expect(hyperlambda.items[1].onClick).not.toHaveBeenCalled();
  });

  it('shows a busy action on its group trigger, which stays usable for the rest', () => {
    render(<Toolbar actions={grouped({ busy: true })} />);
    expect(screen.getByRole('button', { name: 'Generating…' })).toBeEnabled();
  });

  it('disables a group trigger when none of its actions can be taken', () => {
    const entries: ToolbarEntry[] = [
      {
        id: 'group',
        label: 'Group',
        icon: null,
        items: [{ id: 'a', label: 'A', icon: null, disabled: true, onClick: vi.fn() }],
      },
    ];
    render(<Toolbar actions={entries} />);
    expect(screen.getByRole('button', { name: 'Group' })).toBeDisabled();
  });

  it('folds overflowed groups into the more menu, each under its heading', async () => {
    rowWidth = 300; // Too narrow for all three entries, so both groups fold and Save stays.
    render(<Toolbar actions={grouped()} />);
    expect(visibleLabels()).toEqual(['', 'Save']);

    await userEvent.click(screen.getByTitle('More actions'));
    expect(within(screen.getByRole('menu')).getByText('File')).toHaveClass('designer-menu-heading');
    expect(within(screen.getByRole('menu')).getByText('Hyperlambda')).toHaveClass(
      'designer-menu-heading',
    );
    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual([
      'Copy path',
      'Download file',
      'Execute',
      'Generate',
    ]);
  });
});

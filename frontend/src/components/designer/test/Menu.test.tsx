// @vitest-environment jsdom
/*
 * Designer overflow Menu: opening and closing (click, Escape, outside click), item
 * rendering (headings, ticks, disabled, hints), choosing by click, toggles staying
 * open, and keyboard navigation from the trigger (arrows with wrap-around, Home/End,
 * Enter/Space, skipping headings and disabled items).
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import Menu, { type MenuItem } from '../Menu';

function renderMenu(items?: MenuItem[]) {
  const actions = { rename: vi.fn(), hidden: vi.fn(), delete: vi.fn(), noop: vi.fn() };
  const defaults: MenuItem[] = [
    { heading: 'Page' },
    { label: 'Rename', hint: 'Rename the page', onClick: actions.rename },
    { label: 'Show hidden', checked: false, onClick: actions.hidden },
    { label: 'Locked', disabled: true, onClick: actions.noop },
    { heading: 'Danger' },
    { label: 'Delete', onClick: actions.delete },
  ];
  render(<Menu items={items ?? defaults} title="More actions" />);
  return { ...actions, trigger: screen.getByRole('button', { name: 'More actions' }) };
}

const activeOf = (trigger: HTMLElement) => trigger.getAttribute('aria-activedescendant');

describe('Menu opening and closing', () => {
  it('is closed until the trigger is clicked, then toggles', async () => {
    const { trigger } = renderMenu();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(trigger);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on Escape and on an outside click, but not on a click inside', async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await userEvent.click(trigger);
    await userEvent.click(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByText('Page'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});

describe('Menu items', () => {
  it('renders headings, items, hints, ticks and disabled state', async () => {
    const { trigger } = renderMenu([
      { heading: 'View' },
      { label: 'Grid', checked: true, onClick: vi.fn() },
      { label: 'Ruler', checked: false, hint: 'Show the ruler', onClick: vi.fn() },
      { label: 'Locked', disabled: true, onClick: vi.fn() },
    ]);
    await userEvent.click(trigger);
    expect(screen.getByText('View')).toHaveClass('designer-menu-heading');
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    expect(screen.getByRole('menuitem', { name: /Grid/ })).toHaveClass('selected');
    expect(screen.getByRole('menuitem', { name: /Grid/ })).toHaveTextContent('✓');
    expect(screen.getByRole('menuitem', { name: /Ruler/ })).not.toHaveClass('selected');
    expect(screen.getByRole('menuitem', { name: /Ruler/ })).toHaveAttribute(
      'title',
      'Show the ruler',
    );
    expect(screen.getByRole('menuitem', { name: /Locked/ })).toHaveClass('disabled');
  });

  it('runs a clicked action and closes', async () => {
    const { trigger, rename } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));
    expect(rename).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('keeps the menu open after a toggle', async () => {
    const { trigger, hidden } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('menuitem', { name: /Show hidden/ }));
    expect(hidden).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('ignores a click on a disabled item', async () => {
    const { trigger, noop } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Locked' }));
    expect(noop).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('highlights the item under the pointer, but not a disabled one', async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.hover(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveClass('active');
    await userEvent.hover(screen.getByRole('menuitem', { name: 'Locked' }));
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveClass('active');
    expect(screen.getByRole('menuitem', { name: 'Locked' })).not.toHaveClass('active');
  });
});

describe('Menu keyboard', () => {
  it('opens on ArrowDown at the first selectable item, skipping headings', async () => {
    const { trigger } = renderMenu();
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveClass('active');
    expect(activeOf(trigger)).toBe(screen.getByRole('menuitem', { name: 'Rename' }).id);
  });

  it('opens on ArrowUp at the last selectable item', async () => {
    const { trigger } = renderMenu();
    trigger.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveClass('active');
  });

  it('moves down skipping disabled items and headings, and wraps', async () => {
    const { trigger } = renderMenu();
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: /Show hidden/ })).toHaveClass('active');
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveClass('active');
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveClass('active');
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveClass('active');
  });

  it('jumps to the ends with Home and End', async () => {
    const { trigger } = renderMenu();
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}{End}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveClass('active');
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveClass('active');
  });

  it('chooses the active item with Enter and with Space', async () => {
    const { trigger, rename, hidden } = renderMenu();
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(rename).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await userEvent.keyboard('{ArrowDown}{ArrowDown} ');
    expect(hidden).toHaveBeenCalledTimes(1);
    // A toggle leaves it open.
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('clears the active item when the trigger closes the menu', async () => {
    const { trigger } = renderMenu();
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(activeOf(trigger)).not.toBeNull();
    await userEvent.click(trigger);
    expect(activeOf(trigger)).toBeNull();
  });

  it('has no active item when nothing is selectable', async () => {
    const { trigger } = renderMenu([{ heading: 'Empty' }, { label: 'Off', disabled: true }]);
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(activeOf(trigger)).toBeNull();
  });
});

describe('Menu options', () => {
  const items: MenuItem[] = [
    { label: 'Upload', icon: <svg data-testid="upload-icon" />, onClick: vi.fn() },
    { label: 'Show hidden', checked: true, onClick: vi.fn() },
  ];

  it('shows the overflow icon on the trigger unless given content', () => {
    const { rerender } = render(<Menu items={items} title="More actions" />);
    expect(screen.getByTitle('More actions')).not.toHaveTextContent('Attach');
    rerender(
      <Menu items={items} title="More actions">
        Attach
      </Menu>,
    );
    expect(screen.getByTitle('More actions')).toHaveTextContent('Attach');
  });

  it('shows an item icon in place of the tick column', async () => {
    render(<Menu items={items} title="More actions" />);
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
    const upload = screen.getByRole('menuitem', { name: 'Upload' });
    expect(upload.querySelector('.select-icon')).toContainElement(
      screen.getByTestId('upload-icon'),
    );
    expect(upload.querySelector('.select-check')).toBeNull();
    expect(
      screen.getByRole('menuitem', { name: /Show hidden/ }).querySelector('.select-check'),
    ).not.toBeNull();
  });

  it('opens below and right-aligned by default, and above and left-aligned on request', async () => {
    const { unmount } = render(<Menu items={items} title="More actions" />);
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
    expect(screen.getByRole('menu').style.top).toBe('4px');
    expect(screen.getByRole('menu').style.right).not.toBe('');
    expect(screen.getByRole('menu').style.bottom).toBe('');
    unmount();

    render(<Menu items={items} title="More actions" placement="top" align="start" />);
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
    const menu = screen.getByRole('menu');
    expect(menu.style.bottom).toBe(window.innerHeight + 4 + 'px');
    expect(menu.style.left).toBe('0px');
    expect(menu.style.top).toBe('');
    expect(menu.style.right).toBe('');
  });

  it('cannot be opened while disabled', async () => {
    render(<Menu items={items} title="More actions" disabled />);
    const trigger = screen.getByRole('button', { name: 'More actions' });
    expect(trigger).toBeDisabled();
    await userEvent.click(trigger);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

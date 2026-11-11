// @vitest-environment jsdom
/*
 * The shortcuts overview: every group of the registry as a card, the live filter that narrows
 * the rows and highlights why they matched, the empty state, and the close button.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SHORTCUTS } from '../../lib/shortcuts';
import ShortcutsDialog from '../ShortcutsDialog';

describe('ShortcutsDialog', () => {
  it('renders every shortcut, grouped into one card per group', () => {
    render(<ShortcutsDialog onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
    for (const title of ['Everywhere', 'Code editors', 'Hyper IDE file actions', 'Web Designer']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('listitem')).toHaveLength(SHORTCUTS.length);
  });

  it('focuses the filter, and narrows and highlights the rows as you type', async () => {
    render(<ShortcutsDialog onClose={vi.fn()} />);
    const filter = screen.getByRole('textbox', { name: 'Filter shortcuts' });
    expect(filter).toHaveFocus();
    await userEvent.type(filter, 'fullscreen');
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getAllByText('fullscreen', { selector: 'mark' })).toHaveLength(2);
    expect(screen.queryByRole('heading', { name: 'Web Designer' })).not.toBeInTheDocument();
  });

  it('keeps a whole group when the filter matches its title', async () => {
    render(<ShortcutsDialog onClose={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Filter shortcuts' }), 'web designer');
    const card = screen.getByRole('heading', { name: 'Web Designer' }).closest('section');
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getAllByRole('listitem')).toHaveLength(
      SHORTCUTS.filter(shortcut => shortcut.group === 'Web Designer').length,
    );
  });

  it('says so when nothing matches', async () => {
    render(<ShortcutsDialog onClose={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Filter shortcuts' }), 'zzzz');
    expect(screen.getByText(/No shortcut matches/)).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('closes from the close button', async () => {
    const onClose = vi.fn();
    render(<ShortcutsDialog onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});

// @vitest-environment jsdom
/*
 * The shortcuts overview: every group of the registry as a card — the built-in ones and those a
 * feature brings — the live filter that narrows the rows and highlights why they matched, the
 * empty state, and the close button. Runs against a stand-in feature registered here.
 */
import { type FeatureManifest, features, registerFeatures } from '@shared/shell/features';
import { allShortcuts } from '@shared/shell/shortcuts';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import ShortcutsDialog from '../components/ShortcutsDialog';

const Icon = () => <svg />;
const CANVAS: FeatureManifest = {
  id: 'canvas',
  shortcuts: {
    group: { id: 'Canvas', title: 'Canvas tool', note: 'On the canvas.', Icon },
    entries: [
      { group: 'Canvas', display: 'Delete', description: 'Remove the selected shape' },
      { group: 'Canvas', display: 'Esc', description: 'Deselect' },
      // A feature can also add to a built-in group.
      { group: 'Global', display: 'Ctrl + .', description: 'Toggle the canvas helper' },
    ],
  },
};

let realFeatures: readonly FeatureManifest[] = [];
beforeAll(() => {
  realFeatures = features();
  registerFeatures([CANVAS]);
});
afterAll(() => registerFeatures([...realFeatures]));

describe('ShortcutsDialog', () => {
  it('renders every shortcut, grouped into one card per group', () => {
    render(<ShortcutsDialog onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
    for (const title of ['Everywhere', 'Code editors', 'Canvas tool']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('listitem')).toHaveLength(allShortcuts().length);
    const everywhere = screen.getByRole('heading', { name: 'Everywhere' }).closest('section')!;
    expect(within(everywhere).getByText('Toggle the canvas helper')).toBeInTheDocument();
  });

  it('focuses the filter, and narrows and highlights the rows as you type', async () => {
    render(<ShortcutsDialog onClose={vi.fn()} />);
    const filter = screen.getByRole('textbox', { name: 'Filter shortcuts' });
    expect(filter).toHaveFocus();
    await userEvent.type(filter, 'fullscreen');
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getAllByText('fullscreen', { selector: 'mark' })).toHaveLength(2);
    expect(screen.queryByRole('heading', { name: 'Canvas tool' })).not.toBeInTheDocument();
  });

  it('keeps a whole group when the filter matches its title', async () => {
    render(<ShortcutsDialog onClose={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Filter shortcuts' }), 'canvas tool');
    const card = screen.getByRole('heading', { name: 'Canvas tool' }).closest('section');
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getAllByRole('listitem')).toHaveLength(2);
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
    await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalled();
  });
});

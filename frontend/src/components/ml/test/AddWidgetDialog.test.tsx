// @vitest-environment jsdom
/*
 * AddWidgetDialog: lists the HTML widgets that can be attached to a model, filterable by name or
 * description. Add writes a training snippet whose meta names the widget file and whose prompt is
 * a placeholder to be edited. Covers loading, empty and failing lists, and failing adds.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import AddWidgetDialog from '../AddWidgetDialog';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

const WIDGETS = [
  { name: 'Calendar', description: 'Shows a month', file: '/widgets/calendar.html' },
  { name: 'Chart', description: 'Draws bars', file: '/widgets/chart.html' },
  { name: 'Plain', description: '', file: '/widgets/plain.html' },
];

let toasts: Toast[];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  vi.mocked(api.availableWidgets).mockResolvedValue(WIDGETS);
  vi.mocked(api.mlSnippetCreate).mockResolvedValue(undefined as never);
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

function renderDialog() {
  const onClose = vi.fn();
  const onAdded = vi.fn();
  render(<AddWidgetDialog type="support" onClose={onClose} onAdded={onAdded} />);
  return { onClose, onAdded };
}

describe('AddWidgetDialog', () => {
  it('lists the widgets, with a description only where there is one', async () => {
    renderDialog();
    expect(screen.getByText('Add widget to support')).toBeInTheDocument();
    expect(screen.queryByText('Calendar')).not.toBeInTheDocument();

    expect(await screen.findByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Shows a month')).toBeInTheDocument();
    expect(screen.getByText('Plain')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Add' })).toHaveLength(3);
  });

  it('filters on name or description, case-insensitively', async () => {
    renderDialog();
    await screen.findByText('Calendar');
    const filter = screen.getByPlaceholderText('Filter widgets…');

    await userEvent.type(filter, 'CHAR');
    expect(screen.getByText('Chart')).toBeInTheDocument();
    expect(screen.queryByText('Calendar')).not.toBeInTheDocument();

    await userEvent.clear(filter);
    await userEvent.type(filter, 'month');
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.queryByText('Chart')).not.toBeInTheDocument();

    await userEvent.clear(filter);
    await userEvent.type(filter, 'zzz');
    expect(screen.getByText('No widgets available.')).toBeInTheDocument();
  });

  it('says so when there are no widgets, also for a null answer', async () => {
    vi.mocked(api.availableWidgets).mockResolvedValue(null as never);
    renderDialog();
    expect(await screen.findByText('No widgets available.')).toBeInTheDocument();
  });

  it('shows a failing list in a dismissible banner', async () => {
    vi.mocked(api.availableWidgets).mockRejectedValue(new Error('list failed'));
    renderDialog();
    expect(await screen.findByText('list failed')).toBeInTheDocument();
    await userEvent.click(screen.getByTitle('Dismiss'));
    expect(screen.queryByText('list failed')).not.toBeInTheDocument();
  });

  it('adds a widget as a snippet with a placeholder prompt naming its file', async () => {
    const { onAdded } = renderDialog();
    await screen.findByText('Calendar');
    await userEvent.click(screen.getAllByRole('button', { name: 'Add' })[0]);

    await waitFor(() => expect(onAdded).toHaveBeenCalled());
    expect(api.mlSnippetCreate).toHaveBeenCalledWith({
      prompt: 'WRITE YOUR PROMPT HERE',
      completion: 'HTML widget at /widgets/calendar.html.',
      type: 'support',
      meta: 'WIDGET ==> /widgets/calendar.html',
    });
    expect(toasts.some(toast => toast.text.startsWith('Widget added to support'))).toBe(true);
  });

  it('toasts a failing add and leaves the dialog usable', async () => {
    vi.mocked(api.mlSnippetCreate).mockRejectedValue(new Error('cannot write'));
    const { onAdded } = renderDialog();
    await screen.findByText('Calendar');
    await userEvent.click(screen.getAllByRole('button', { name: 'Add' })[0]);

    await waitFor(() =>
      expect(toasts.some(toast => toast.text === 'cannot write' && toast.isError)).toBe(true),
    );
    expect(onAdded).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Add' })[0]).toBeEnabled());
  });

  it('disables every Add while one is in flight and ignores a second click', async () => {
    let finish: () => void = () => {
      // replaced as soon as the add starts
    };
    vi.mocked(api.mlSnippetCreate).mockReturnValue(
      new Promise<never>(done => {
        finish = () => done(undefined as never);
      }),
    );
    renderDialog();
    await screen.findByText('Calendar');
    const buttons = screen.getAllByRole('button', { name: 'Add' });
    await userEvent.click(buttons[0]);
    await waitFor(() => expect(buttons[1]).toBeDisabled());
    await userEvent.click(buttons[1]);
    expect(api.mlSnippetCreate).toHaveBeenCalledTimes(1);

    finish();
    await waitFor(() => expect(buttons[1]).toBeEnabled());
  });

  it('closes with the Close button', async () => {
    const { onClose } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});

// @vitest-environment jsdom
/*
 * HistoryTab: the requests made towards a model. Shows the first model until another is picked,
 * pages the list, expands a row to show its completion (mouse and keyboard), renders stored
 * conversation text as text rather than markup, and reports load failures.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import HistoryTab from '../HistoryTab';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

let toasts: Toast[];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  vi.mocked(api.mlRequests).mockResolvedValue([]);
  vi.mocked(api.mlRequestsCount).mockResolvedValue({ count: 0 });
});

afterEach(() => {
  setToastListener(null);
  vi.resetAllMocks();
});

const TYPES = [{ type: 'support' }, { type: 'sales' }];

function request(id: number, prompt: string, completion = 'answer ' + id): api.MlRequest {
  return {
    id,
    created: '2026-03-05T09:07:00Z',
    type: 'support',
    prompt,
    completion,
    finish_reason: 'stop',
  };
}

function renderTab(types: api.MlType[] = TYPES) {
  return render(<HistoryTab types={types} />);
}

describe('HistoryTab loading', () => {
  it('loads the first page of the first model', async () => {
    vi.mocked(api.mlRequests).mockResolvedValue([request(1, 'hello there')]);
    vi.mocked(api.mlRequestsCount).mockResolvedValue({ count: 1 });
    renderTab();

    expect(await screen.findByText('hello there')).toBeInTheDocument();
    expect(api.mlRequests).toHaveBeenCalledWith('support', 0, 15);
    expect(api.mlRequestsCount).toHaveBeenCalledWith('support');
    expect(screen.getByRole('button', { name: 'support' })).toBeInTheDocument();
  });

  it('shows a placeholder until the first response lands, then the empty message', async () => {
    renderTab();
    expect(screen.queryByText('No requests yet.')).not.toBeInTheDocument();
    expect(await screen.findByText('No requests yet.')).toBeInTheDocument();
  });

  it('treats a missing row list as empty', async () => {
    vi.mocked(api.mlRequests).mockResolvedValue(undefined as unknown as api.MlRequest[]);
    renderTab();
    expect(await screen.findByText('No requests yet.')).toBeInTheDocument();
  });

  it('asks the backend for nothing when there are no models', async () => {
    renderTab([]);
    expect(await screen.findByText('No requests yet.')).toBeInTheDocument();
    expect(api.mlRequests).not.toHaveBeenCalled();
    expect(api.mlRequestsCount).not.toHaveBeenCalled();
  });

  it('shows a toast when loading fails', async () => {
    vi.mocked(api.mlRequests).mockRejectedValue(new Error('backend down'));
    renderTab();
    await waitFor(() =>
      expect(toasts.at(-1)).toMatchObject({ text: 'backend down', isError: true }),
    );
  });

  it('reloads for another model when it is picked', async () => {
    vi.mocked(api.mlRequests).mockImplementation(type =>
      Promise.resolve([
        request(type === 'sales' ? 2 : 1, type === 'sales' ? 'sales question' : 'support question'),
      ]),
    );
    renderTab();
    expect(await screen.findByText('support question')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'support' }));
    await userEvent.click(screen.getByRole('option', { name: 'sales' }));

    expect(await screen.findByText('sales question')).toBeInTheDocument();
    expect(api.mlRequests).toHaveBeenLastCalledWith('sales', 0, 15);
    expect(screen.queryByText('support question')).not.toBeInTheDocument();
  });
});

describe('HistoryTab paging', () => {
  it('shows no pagination for a single page', async () => {
    vi.mocked(api.mlRequests).mockResolvedValue([request(1, 'one')]);
    vi.mocked(api.mlRequestsCount).mockResolvedValue({ count: 15 });
    renderTab();
    await screen.findByText('one');
    expect(screen.queryByRole('button', { name: /Next/ })).not.toBeInTheDocument();
  });

  it('moves between pages, fetching at the right offset', async () => {
    vi.mocked(api.mlRequests).mockImplementation((_type, offset) =>
      Promise.resolve([request(offset + 1, 'page starting at ' + offset)]),
    );
    vi.mocked(api.mlRequestsCount).mockResolvedValue({ count: 40 });
    renderTab();
    expect(await screen.findByText('page starting at 0')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '‹ Prev' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Next ›' }));
    expect(await screen.findByText('page starting at 15')).toBeInTheDocument();
    expect(api.mlRequests).toHaveBeenLastCalledWith('support', 15, 15);

    await userEvent.click(screen.getByRole('button', { name: '‹ Prev' }));
    expect(await screen.findByText('page starting at 0')).toBeInTheDocument();
  });

  it('starts over on the first page when another model is picked', async () => {
    vi.mocked(api.mlRequests).mockImplementation((type, offset) =>
      Promise.resolve([request(offset + 1, type + ' at ' + offset)]),
    );
    vi.mocked(api.mlRequestsCount).mockResolvedValue({ count: 40 });
    renderTab();
    await screen.findByText('support at 0');
    await userEvent.click(screen.getByRole('button', { name: 'Next ›' }));
    await screen.findByText('support at 15');

    await userEvent.click(screen.getByRole('button', { name: 'support' }));
    await userEvent.click(screen.getByRole('option', { name: 'sales' }));
    expect(await screen.findByText('sales at 0')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });
});

describe('HistoryTab rows', () => {
  beforeEach(() => {
    vi.mocked(api.mlRequests).mockResolvedValue([
      request(1, 'first prompt', 'first completion'),
      request(2, 'second prompt', 'second completion'),
    ]);
    vi.mocked(api.mlRequestsCount).mockResolvedValue({ count: 2 });
  });

  async function rowFor(prompt: string) {
    return (await screen.findByText(prompt)).closest('tr') as HTMLElement;
  }

  it('shows when and what was asked, with the completion hidden', async () => {
    renderTab();
    const row = await rowFor('first prompt');
    expect(
      within(row).getByText(new Date('2026-03-05T09:07:00Z').toLocaleString()),
    ).toBeInTheDocument();
    expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('first completion')).not.toBeInTheDocument();
  });

  it('expands a row on click and collapses it on a second click', async () => {
    renderTab();
    const row = await rowFor('first prompt');
    await userEvent.click(row);
    expect(screen.getByText('first completion')).toBeInTheDocument();
    expect(row).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(row);
    expect(screen.queryByText('first completion')).not.toBeInTheDocument();
  });

  it('shows one completion at a time', async () => {
    renderTab();
    await userEvent.click(await rowFor('first prompt'));
    await userEvent.click(await rowFor('second prompt'));
    expect(screen.queryByText('first completion')).not.toBeInTheDocument();
    expect(screen.getByText('second completion')).toBeInTheDocument();
  });

  it('expands with Enter or Space on the focused row', async () => {
    renderTab();
    const row = await rowFor('first prompt');
    row.focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText('first completion')).toBeInTheDocument();
    await userEvent.keyboard(' ');
    expect(screen.queryByText('first completion')).not.toBeInTheDocument();
  });

  it('ignores other keys, and keys pressed inside a cell of the row', async () => {
    renderTab();
    const row = await rowFor('first prompt');
    row.focus();
    await userEvent.keyboard('a');
    expect(screen.queryByText('first completion')).not.toBeInTheDocument();

    fireEvent.keyDown(screen.getByText('first prompt'), { key: 'Enter' });
    expect(screen.queryByText('first completion')).not.toBeInTheDocument();
  });

  it('renders stored markup as text, never as live HTML', async () => {
    vi.mocked(api.mlRequests).mockResolvedValue([
      request(1, '<b>bold</b> prompt', '<img src=x onerror=alert(1)>'),
    ]);
    vi.mocked(api.mlRequestsCount).mockResolvedValue({ count: 1 });
    renderTab();
    await userEvent.click(await rowFor('<b>bold</b> prompt'));
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

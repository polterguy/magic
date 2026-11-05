// @vitest-environment jsdom
/*
 * TrainingTab: loading and listing snippets for the picked model, filtering (debounced),
 * vector search columns and greying, sorting and paging requests, delete / delete-filtered
 * / export flows, the scrape flow over a socket channel, and opening the stubbed
 * edit / function / widget / spice dialogs.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MlSnippet, MlType } from '../../../lib/api';
import * as api from '../../../lib/api';
import { downloadBlob } from '../../../lib/download';
import { setToastListener, type Toast } from '../../../lib/toast';
import { DialogProvider } from '../../Dialogs';
import TrainingTab from '../TrainingTab';

vi.mock('../../../lib/api', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../lib/api')>()),
  gibberish: vi.fn(),
  importPage: vi.fn(),
  mlSnippetDelete: vi.fn(),
  mlSnippets: vi.fn(),
  mlSnippetsCount: vi.fn(),
  mlSnippetsDeleteAll: vi.fn(),
  mlSnippetsExportRaw: vi.fn(),
}));

vi.mock('../../../lib/download', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../lib/download')>()),
  downloadBlob: vi.fn(),
}));

vi.mock('../EditSnippetDialog', () => ({
  default: (
    props: Readonly<{
      type: string;
      existing: MlSnippet | null;
      onClose: () => void;
      onSaved: () => void;
    }>,
  ) => (
    <div>
      <span>
        Snippet editor {props.type} {props.existing?.prompt ?? 'new'}
      </span>
      <button onClick={props.onSaved}>Save snippet</button>
      <button onClick={props.onClose}>Close snippet</button>
    </div>
  ),
}));
vi.mock('../AddFunctionDialog', () => ({
  default: (props: Readonly<{ type: string; onClose: () => void; onInstalled: () => void }>) => (
    <div>
      <span>Function picker {props.type}</span>
      <button onClick={props.onInstalled}>Install function</button>
    </div>
  ),
}));
vi.mock('../AddWidgetDialog', () => ({
  default: (props: Readonly<{ type: string; onClose: () => void; onAdded: () => void }>) => (
    <div>
      <span>Widget picker {props.type}</span>
      <button onClick={props.onAdded}>Add widget</button>
    </div>
  ),
}));
vi.mock('../SpiceDialog', () => ({
  default: (
    props: Readonly<{
      type: string;
      onClose: () => void;
      onScrape: (o: { url: string; images: boolean }) => void;
    }>,
  ) => (
    <div>
      <span>Spice {props.type}</span>
      <button onClick={() => props.onScrape({ url: 'https://a.test/page', images: true })}>
        Scrape it
      </button>
    </div>
  ),
}));
vi.mock('../../SocketFeedback', () => ({
  default: (
    props: Readonly<{ title: string; channel: string; onReady: () => void; onClose: () => void }>,
  ) => (
    <div>
      <span>
        {props.title} via {props.channel}
      </span>
      <button onClick={props.onReady}>Socket ready</button>
      <button onClick={props.onClose}>Close socket</button>
    </div>
  ),
}));

const TYPES: MlType[] = [
  { type: 'support', threshold: 0.3 },
  { type: 'sales', threshold: 0.5 },
];

const SNIPPETS = [
  {
    id: 1,
    type: 'support',
    prompt: 'How do I reset?',
    completion: 'c',
    tokens: 11,
    embedding_vss: 1,
  },
  { id: 2, type: 'support', prompt: 'Pricing?', completion: 'c', tokens: 22 },
];

let toasts: Toast[];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  vi.mocked(api.mlSnippets).mockResolvedValue(SNIPPETS);
  vi.mocked(api.mlSnippetsCount).mockResolvedValue({ count: 2 });
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

function renderTab(props: Partial<React.ComponentProps<typeof TrainingTab>> = {}) {
  return render(
    <DialogProvider>
      <TrainingTab types={TYPES} {...props} />
    </DialogProvider>,
  );
}

async function loaded() {
  await screen.findByText('How do I reset?');
}

describe('TrainingTab listing', () => {
  it('loads the first model by default and lists its snippets', async () => {
    renderTab();
    await loaded();
    expect(api.mlSnippets).toHaveBeenCalledWith(
      'support',
      '',
      0,
      12,
      { column: null, direction: 'asc' },
      false,
    );
    expect(api.mlSnippetsCount).toHaveBeenCalledWith('support', '', false);
    expect(screen.getByText('2 snippets')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Embedded' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Not embedded' })).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
  });

  it('starts on the model the palette asked for', async () => {
    renderTab({ initialType: 'sales' });
    await loaded();
    expect(api.mlSnippets).toHaveBeenCalledWith('sales', '', 0, 12, expect.anything(), false);
  });

  it('shows an empty state', async () => {
    vi.mocked(api.mlSnippets).mockResolvedValue([]);
    vi.mocked(api.mlSnippetsCount).mockResolvedValue({ count: 0 });
    renderTab();
    expect(await screen.findByText('No training snippets.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete all' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
  });

  it('asks for nothing when there are no models', async () => {
    renderTab({ types: [] });
    expect(await screen.findByText('No training snippets.')).toBeInTheDocument();
    expect(api.mlSnippets).not.toHaveBeenCalled();
  });

  it('reloads for another model picked in the dropdown', async () => {
    renderTab();
    await loaded();
    await userEvent.click(screen.getByRole('button', { name: 'support' }));
    await userEvent.click(screen.getByRole('option', { name: 'sales' }));
    await waitFor(() =>
      expect(api.mlSnippets).toHaveBeenLastCalledWith('sales', '', 0, 12, expect.anything(), false),
    );
  });

  it('filters by the typed text after the debounce, and relabels the buttons', async () => {
    renderTab();
    await loaded();
    await userEvent.type(screen.getByPlaceholderText('Filter prompts…'), 'price');
    await waitFor(() =>
      expect(api.mlSnippets).toHaveBeenLastCalledWith(
        'support',
        'price',
        0,
        12,
        expect.anything(),
        false,
      ),
    );
    expect(screen.getByRole('button', { name: 'Delete filtered' })).toBeInTheDocument();
  });

  it('sorts by prompt when the column header is clicked', async () => {
    renderTab();
    await loaded();
    await userEvent.click(screen.getByRole('columnheader', { name: /Prompt/ }));
    await waitFor(() =>
      expect(api.mlSnippets).toHaveBeenLastCalledWith(
        'support',
        '',
        0,
        12,
        { column: 'prompt', direction: 'asc' },
        false,
      ),
    );
  });

  it('pages through snippets', async () => {
    vi.mocked(api.mlSnippetsCount).mockResolvedValue({ count: 30 });
    renderTab();
    await loaded();
    await userEvent.click(screen.getByRole('button', { name: /Next/ }));
    await waitFor(() =>
      expect(api.mlSnippets).toHaveBeenLastCalledWith(
        'support',
        '',
        12,
        12,
        expect.anything(),
        false,
      ),
    );
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });
});

describe('TrainingTab vector search', () => {
  const VSS = [
    { id: 1, type: 'support', prompt: 'Near one', completion: 'c', distance: 0.1 },
    { id: 2, type: 'support', prompt: 'Far one', completion: 'c', distance: 0.9 },
    { id: 3, type: 'support', prompt: 'No distance', completion: 'c' },
  ];

  it('shows distances and greys out snippets beyond the model threshold', async () => {
    vi.mocked(api.mlSnippets).mockResolvedValue(VSS);
    renderTab();
    await screen.findByText('Near one');
    await userEvent.click(screen.getByRole('checkbox', { name: /Vector search/ }));
    // Without a filter vector search is not in force.
    expect(screen.queryByText('Distance')).not.toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('Search meaning…'), 'help');
    expect(await screen.findByText('Distance')).toBeInTheDocument();
    await waitFor(() =>
      expect(api.mlSnippets).toHaveBeenLastCalledWith(
        'support',
        'help',
        0,
        12,
        expect.anything(),
        true,
      ),
    );
    expect(screen.getByText('0.100').closest('tr')).toHaveClass('vss-relevant');
    expect(screen.getByText('0.900').closest('tr')).toHaveClass('vss-irrelevant');
    expect(screen.getByText('0.900').closest('tr')).toHaveAttribute(
      'title',
      expect.stringContaining('Too distant'),
    );
    expect(screen.getByText('No distance').closest('tr')).toHaveClass('vss-relevant');
    expect(screen.getByRole('button', { name: 'Delete filtered' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
  });
});

describe('TrainingTab deleting and exporting', () => {
  it('deletes one snippet after confirmation and reloads', async () => {
    vi.mocked(api.mlSnippetDelete).mockResolvedValue(undefined as never);
    renderTab();
    await loaded();
    await userEvent.click(within(screen.getByText('Pricing?').closest('tr')!).getByText('Delete'));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Pricing?');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(api.mlSnippetDelete).toHaveBeenCalledWith(2));
    await waitFor(() => expect(api.mlSnippets).toHaveBeenCalledTimes(2));
  });

  it('keeps the snippet when the delete is cancelled', async () => {
    renderTab();
    await loaded();
    await userEvent.click(
      within(screen.getByText('Pricing?').closest('tr')!).getByRole('button', { name: 'Delete' }),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(api.mlSnippetDelete).not.toHaveBeenCalled();
  });

  it('toasts a failed delete', async () => {
    vi.mocked(api.mlSnippetDelete).mockRejectedValue(new Error('nope'));
    renderTab();
    await loaded();
    await userEvent.click(
      within(screen.getByText('Pricing?').closest('tr')!).getByRole('button', { name: 'Delete' }),
    );
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );
    await waitFor(() => expect(toasts).toContainEqual(expect.objectContaining({ text: 'nope' })));
  });

  it('deletes every snippet matching the filter once the count is typed back', async () => {
    vi.mocked(api.mlSnippetsDeleteAll).mockResolvedValue(undefined as never);
    renderTab();
    await loaded();
    await userEvent.click(screen.getByRole('button', { name: 'Delete all' }));
    await userEvent.type(screen.getByLabelText('Number of snippets'), '2{Enter}');
    await waitFor(() => expect(api.mlSnippetsDeleteAll).toHaveBeenCalledWith('support', ''));
    await waitFor(() => expect(toasts.map(t => t.text)).toContain('2 snippet(s) deleted'));
  });

  it('deletes nothing when the wrong number is typed', async () => {
    renderTab();
    await loaded();
    await userEvent.click(screen.getByRole('button', { name: 'Delete all' }));
    await userEvent.type(screen.getByLabelText('Number of snippets'), '9{Enter}');
    await waitFor(() =>
      expect(toasts.map(t => t.text)).toContain('Number did not match — nothing deleted'),
    );
    expect(api.mlSnippetsDeleteAll).not.toHaveBeenCalled();
  });

  it('exports with the server-suggested filename', async () => {
    const blob = new Blob(['a,b']);
    vi.mocked(api.mlSnippetsExportRaw).mockResolvedValue({
      blob,
      contentType: 'text/csv',
      disposition: 'attachment; filename="support-export.csv"',
      headers: {},
      status: 200,
      elapsed: 1,
    });
    renderTab();
    await loaded();
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    await waitFor(() => expect(downloadBlob).toHaveBeenCalledWith(blob, 'support-export.csv'));
    expect(api.mlSnippetsExportRaw).toHaveBeenCalledWith('support', '');
  });

  it('falls back to <type>.csv and toasts a failed export', async () => {
    const blob = new Blob(['a']);
    vi.mocked(api.mlSnippetsExportRaw).mockResolvedValueOnce({
      blob,
      contentType: 'text/csv',
      disposition: '',
      headers: {},
      status: 200,
      elapsed: 1,
    });
    renderTab();
    await loaded();
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    await waitFor(() => expect(downloadBlob).toHaveBeenCalledWith(blob, 'support.csv'));
    vi.mocked(api.mlSnippetsExportRaw).mockRejectedValueOnce(new Error('export broke'));
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    await waitFor(() =>
      expect(toasts).toContainEqual(expect.objectContaining({ text: 'export broke' })),
    );
  });
});

describe('TrainingTab dialogs', () => {
  it('edits an existing snippet and reloads when saved', async () => {
    renderTab();
    await loaded();
    await userEvent.click(
      within(screen.getByText('Pricing?').closest('tr')!).getByRole('button', { name: 'Edit' }),
    );
    expect(screen.getByText('Snippet editor support Pricing?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save snippet' }));
    expect(screen.queryByText(/Snippet editor/)).not.toBeInTheDocument();
    await waitFor(() => expect(api.mlSnippets).toHaveBeenCalledTimes(2));
  });

  it('opens an empty editor for a new snippet and closes it', async () => {
    renderTab();
    await loaded();
    await userEvent.click(screen.getByRole('button', { name: '+ New snippet' }));
    expect(screen.getByText('Snippet editor support new')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close snippet' }));
    expect(screen.queryByText(/Snippet editor/)).not.toBeInTheDocument();
  });

  it('opens the function and widget pickers and reloads after they add something', async () => {
    renderTab();
    await loaded();
    await userEvent.click(screen.getByRole('button', { name: '+ AI function' }));
    expect(screen.getByText('Function picker support')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Install function' }));
    expect(screen.queryByText(/Function picker/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '+ Widget' }));
    expect(screen.getByText('Widget picker support')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add widget' }));
    expect(screen.queryByText(/Widget picker/)).not.toBeInTheDocument();
    await waitFor(() => expect(api.mlSnippets).toHaveBeenCalledTimes(3));
  });
});

describe('TrainingTab scraping', () => {
  it('scrapes over a socket channel, imports the page when ready and reloads on close', async () => {
    vi.mocked(api.gibberish).mockResolvedValue({ result: 'chan-9' });
    vi.mocked(api.importPage).mockResolvedValue(undefined as never);
    renderTab();
    await loaded();
    await userEvent.click(screen.getByRole('button', { name: '+ Spice' }));
    await userEvent.click(screen.getByRole('button', { name: 'Scrape it' }));
    expect(await screen.findByText('Scraping https://a.test/page via chan-9')).toBeInTheDocument();
    expect(screen.queryByText('Spice support')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Socket ready' }));
    expect(api.importPage).toHaveBeenCalledWith({
      url: 'https://a.test/page',
      images: true,
      type: 'support',
      channel: 'chan-9',
    });
    await userEvent.click(screen.getByRole('button', { name: 'Close socket' }));
    expect(screen.queryByText(/Scraping/)).not.toBeInTheDocument();
    await waitFor(() => expect(api.mlSnippets).toHaveBeenCalledTimes(2));
  });

  it('toasts when the channel cannot be created', async () => {
    vi.mocked(api.gibberish).mockRejectedValue(new Error('no socket'));
    renderTab();
    await loaded();
    await userEvent.click(screen.getByRole('button', { name: '+ Spice' }));
    await userEvent.click(screen.getByRole('button', { name: 'Scrape it' }));
    await waitFor(() =>
      expect(toasts).toContainEqual(expect.objectContaining({ text: 'no socket' })),
    );
    expect(screen.queryByText(/Scraping/)).not.toBeInTheDocument();
  });
});

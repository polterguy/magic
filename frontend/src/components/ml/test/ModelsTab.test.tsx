// @vitest-environment jsdom
/*
 * ModelsTab: the model table (tokens, embeddings flag), the typed-name delete flow,
 * the vectorise flow (count, re-vectorise confirmation, empty model, socket feedback
 * and its ready callback), opening the Edit / Import / Embed dialogs, and jumping to
 * a model asked for by the command palette. Child dialogs are stubbed.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MlType } from '../../../lib/api';
import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { DialogProvider } from '../../Dialogs';
import ModelsTab from '../ModelsTab';

vi.mock('../../../lib/api', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../lib/api')>()),
  deleteVectors: vi.fn(),
  gibberish: vi.fn(),
  mlSnippetsCount: vi.fn(),
  mlTypeDelete: vi.fn(),
  mlUnvectorisedCount: vi.fn(),
  vectoriseType: vi.fn(),
}));

vi.mock('../EditModelDialog', () => ({
  default: (
    props: Readonly<{ existing: MlType | null; onClose: () => void; onSaved: () => void }>,
  ) => (
    <div>
      <span>Editing {props.existing?.type ?? 'a new model'}</span>
      <button onClick={props.onSaved}>Save stub</button>
      <button onClick={props.onClose}>Close stub</button>
    </div>
  ),
}));
vi.mock('../ImportDialog', () => ({
  default: (props: Readonly<{ type: string; onClose: () => void }>) => (
    <div>
      <span>Importing into {props.type}</span>
      <button onClick={props.onClose}>Close import</button>
    </div>
  ),
}));
vi.mock('../EmbedDialog', () => ({
  default: (props: Readonly<{ type: string; onClose: () => void }>) => (
    <div>
      <span>Embedding {props.type}</span>
      <button onClick={props.onClose}>Close embed</button>
    </div>
  ),
}));
vi.mock('../../SocketFeedback', () => ({
  default: (
    props: Readonly<{
      title: string;
      channel: string;
      progress: { total: number };
      onReady: () => void;
      onClose: () => void;
    }>,
  ) => (
    <div>
      <span>
        {props.title} on {props.channel} ({props.progress.total})
      </span>
      <button onClick={props.onReady}>Socket ready</button>
      <button onClick={props.onClose}>Close socket</button>
    </div>
  ),
}));

const TYPES: MlType[] = [
  { type: 'support', model: 'gpt-5', use_embeddings: 1, system_message_token_count: 1234 },
  { type: 'sales', model: 'gpt-4.1', use_embeddings: 0 },
];

let toasts: Toast[];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

function renderTab(props: Partial<React.ComponentProps<typeof ModelsTab>> = {}) {
  const onChanged = vi.fn();
  render(
    <DialogProvider>
      <ModelsTab types={TYPES} onChanged={onChanged} {...props} />
    </DialogProvider>,
  );
  return { onChanged };
}

const rowOf = (type: string) => screen.getByText(type).closest('tr') as HTMLElement;

describe('ModelsTab table', () => {
  it('lists the models with their count, model name, tokens and embeddings', () => {
    renderTab();
    expect(screen.getByText('2 models')).toBeInTheDocument();
    const support = within(rowOf('support'));
    expect(support.getByText('gpt-5')).toBeInTheDocument();
    expect(support.getByText((1234).toLocaleString())).toBeInTheDocument();
    expect(support.getByRole('img', { name: 'Embeddings on' })).toBeInTheDocument();
    const sales = within(rowOf('sales'));
    expect(sales.getByText('—')).toBeInTheDocument();
    expect(sales.getByRole('img', { name: 'Embeddings off' })).toBeInTheDocument();
  });
});

describe('ModelsTab dialogs', () => {
  it('opens the editor for a new model and refreshes once it is saved', async () => {
    const { onChanged } = renderTab();
    await userEvent.click(screen.getByRole('button', { name: '+ New model' }));
    expect(screen.getByText('Editing a new model')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save stub' }));
    expect(onChanged).toHaveBeenCalled();
    expect(screen.queryByText('Editing a new model')).not.toBeInTheDocument();
  });

  it('opens the editor for an existing model and closes it without refreshing', async () => {
    const { onChanged } = renderTab();
    await userEvent.click(within(rowOf('sales')).getByRole('button', { name: 'Edit' }));
    expect(screen.getByText('Editing sales')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close stub' }));
    expect(screen.queryByText('Editing sales')).not.toBeInTheDocument();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('opens and closes the import and embed dialogs', async () => {
    renderTab();
    await userEvent.click(within(rowOf('sales')).getByRole('button', { name: 'Import' }));
    expect(screen.getByText('Importing into sales')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close import' }));
    expect(screen.queryByText('Importing into sales')).not.toBeInTheDocument();
    await userEvent.click(within(rowOf('support')).getByRole('button', { name: 'Embed' }));
    expect(screen.getByText('Embedding support')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close embed' }));
    expect(screen.queryByText('Embedding support')).not.toBeInTheDocument();
  });
});

describe('ModelsTab delete', () => {
  it('deletes after the model name is typed back', async () => {
    vi.mocked(api.mlTypeDelete).mockResolvedValue(undefined as never);
    const { onChanged } = renderTab();
    await userEvent.click(within(rowOf('sales')).getByRole('button', { name: 'Delete' }));
    await userEvent.type(screen.getByLabelText('Model name'), 'sales{Enter}');
    await waitFor(() => expect(api.mlTypeDelete).toHaveBeenCalledWith('sales'));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(toasts.map(t => t.text)).toContain('Model sales deleted');
  });

  it('deletes nothing when the typed name is wrong', async () => {
    renderTab();
    await userEvent.click(within(rowOf('sales')).getByRole('button', { name: 'Delete' }));
    await userEvent.type(screen.getByLabelText('Model name'), 'oops{Enter}');
    await waitFor(() => expect(toasts.some(t => t.isError)).toBe(true));
    expect(api.mlTypeDelete).not.toHaveBeenCalled();
  });

  it('reports a failed delete as an error toast without refreshing', async () => {
    vi.mocked(api.mlTypeDelete).mockRejectedValue(new Error('locked'));
    const { onChanged } = renderTab();
    await userEvent.click(within(rowOf('sales')).getByRole('button', { name: 'Delete' }));
    await userEvent.type(screen.getByLabelText('Model name'), 'sales{Enter}');
    await waitFor(() => expect(toasts).toContainEqual(expect.objectContaining({ text: 'locked' })));
    expect(onChanged).not.toHaveBeenCalled();
  });
});

describe('ModelsTab vectorise', () => {
  it('opens the socket feedback with the unvectorised count and starts on ready', async () => {
    vi.mocked(api.mlUnvectorisedCount).mockResolvedValue({ count: 7 });
    vi.mocked(api.gibberish).mockResolvedValue({ result: 'chan-1' });
    vi.mocked(api.vectoriseType).mockResolvedValue(undefined as never);
    renderTab();
    await userEvent.click(within(rowOf('support')).getByRole('button', { name: 'Vectorise' }));
    expect(await screen.findByText('Vectorising support on chan-1 (7)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Socket ready' }));
    expect(api.vectoriseType).toHaveBeenCalledWith('support', 'chan-1');
    await userEvent.click(screen.getByRole('button', { name: 'Close socket' }));
    expect(screen.queryByText(/Vectorising support/)).not.toBeInTheDocument();
  });

  it('toasts when the vectoriser start fails', async () => {
    vi.mocked(api.mlUnvectorisedCount).mockResolvedValue({ count: 1 });
    vi.mocked(api.gibberish).mockResolvedValue({ result: 'c' });
    vi.mocked(api.vectoriseType).mockRejectedValue(new Error('no key'));
    renderTab();
    await userEvent.click(within(rowOf('support')).getByRole('button', { name: 'Vectorise' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Socket ready' }));
    await waitFor(() => expect(toasts).toContainEqual(expect.objectContaining({ text: 'no key' })));
  });

  it('refuses to vectorise a model without snippets', async () => {
    vi.mocked(api.mlUnvectorisedCount).mockResolvedValue({ count: 0 });
    vi.mocked(api.mlSnippetsCount).mockResolvedValue({ count: 0 });
    renderTab();
    await userEvent.click(within(rowOf('support')).getByRole('button', { name: 'Vectorise' }));
    await waitFor(() =>
      expect(toasts.map(t => t.text)).toContain('No training snippets in support to vectorise'),
    );
    expect(api.gibberish).not.toHaveBeenCalled();
  });

  it('asks before throwing away existing vectors, then re-vectorises them all', async () => {
    vi.mocked(api.mlUnvectorisedCount).mockResolvedValue({ count: 0 });
    vi.mocked(api.mlSnippetsCount).mockResolvedValue({ count: 12 });
    vi.mocked(api.deleteVectors).mockResolvedValue(undefined as never);
    vi.mocked(api.gibberish).mockResolvedValue({ result: 'chan-2' });
    renderTab();
    await userEvent.click(within(rowOf('support')).getByRole('button', { name: 'Vectorise' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('deletes all 12 existing vectors');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete vectors and re-vectorise' }),
    );
    expect(await screen.findByText('Vectorising support on chan-2 (12)')).toBeInTheDocument();
    expect(api.deleteVectors).toHaveBeenCalledWith('support');
  });

  it('leaves the vectors alone when the re-vectorise confirmation is declined', async () => {
    vi.mocked(api.mlUnvectorisedCount).mockResolvedValue({ count: 0 });
    vi.mocked(api.mlSnippetsCount).mockResolvedValue({ count: 3 });
    renderTab();
    await userEvent.click(within(rowOf('support')).getByRole('button', { name: 'Vectorise' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(api.deleteVectors).not.toHaveBeenCalled();
    expect(api.gibberish).not.toHaveBeenCalled();
  });

  it('shows an error toast when counting fails', async () => {
    vi.mocked(api.mlUnvectorisedCount).mockRejectedValue(new Error('db down'));
    renderTab();
    await userEvent.click(within(rowOf('support')).getByRole('button', { name: 'Vectorise' }));
    await waitFor(() =>
      expect(toasts).toContainEqual(expect.objectContaining({ text: 'db down' })),
    );
  });
});

describe('ModelsTab palette jump', () => {
  it('opens the model the palette asked for once the types arrive', () => {
    renderTab({ editOnOpen: 'sales' });
    expect(screen.getByText('Editing sales')).toBeInTheDocument();
  });

  it('does not reopen the model after it is closed', async () => {
    renderTab({ editOnOpen: 'sales' });
    await userEvent.click(screen.getByRole('button', { name: 'Close stub' }));
    expect(screen.queryByText('Editing sales')).not.toBeInTheDocument();
  });

  it('toasts when no model has that name', async () => {
    renderTab({ editOnOpen: 'ghost' });
    await waitFor(() => expect(toasts.map(t => t.text)).toContain('No model named ghost'));
    expect(screen.queryByText(/Editing/)).not.toBeInTheDocument();
  });

  it('waits for the types before acting', () => {
    renderTab({ types: [], editOnOpen: 'sales' });
    expect(screen.queryByText(/Editing/)).not.toBeInTheDocument();
    expect(toasts).toHaveLength(0);
  });
});

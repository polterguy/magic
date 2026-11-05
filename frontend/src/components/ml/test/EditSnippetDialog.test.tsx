// @vitest-environment jsdom
/*
 * EditSnippetDialog: creating and editing a training snippet (prompt gating, which toast follows
 * which save path, re-vectorising a snippet that had an embedding) and the AI bar that rewrites the
 * snippet from a JSON answer, tolerating fences, partial answers and plain prose.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import EditSnippetDialog from '../EditSnippetDialog';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

vi.mock('../../CodeEditor', async () => ({
  default: (await import('../../../test/CodeEditorStub')).default,
}));

let toasts: Toast[];

const EXISTING: api.MlSnippet = {
  id: 7,
  prompt: 'How do I reset?',
  completion: 'Press the button.',
  type: 'support',
  meta: 'crawled from a page',
};

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  vi.mocked(api.openaiIsConfigured).mockResolvedValue({ result: true });
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

function renderDialog(existing: api.MlSnippet | null = null) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(
    <EditSnippetDialog type="support" existing={existing} onClose={onClose} onSaved={onSaved} />,
  );
  return { onClose, onSaved };
}

const editor = () => screen.getByLabelText('code editor markdown');

async function ask(instruction: string) {
  await userEvent.type(
    await screen.findByPlaceholderText('Where the Machine Creates the Code ...'),
    instruction,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
}

describe('EditSnippetDialog creating', () => {
  it('needs a prompt before it can be saved', async () => {
    renderDialog();
    expect(screen.getByText('New snippet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Prompt'), 'Q');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('creates a snippet for the type', async () => {
    const { onSaved } = renderDialog();
    await userEvent.type(screen.getByLabelText('Prompt'), 'How?');
    await userEvent.type(editor(), 'Like this.');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.mlSnippetCreate).toHaveBeenCalledWith({
      prompt: 'How?',
      completion: 'Like this.',
      type: 'support',
      meta: null,
      uri: null,
    });
    expect(api.mlSnippetUpdate).not.toHaveBeenCalled();
    expect(toasts.at(-1)).toMatchObject({ text: 'Snippet saved', isError: false });
  });

  it('saves on Enter in the prompt, but not while it is empty', async () => {
    const { onSaved } = renderDialog();
    await userEvent.type(screen.getByLabelText('Prompt'), '{Enter}');
    expect(api.mlSnippetCreate).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText('Prompt'), 'Hi{Enter}');
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('shows the error and does not report saved when creating fails', async () => {
    vi.mocked(api.mlSnippetCreate).mockRejectedValueOnce(new Error('too long'));
    const { onSaved } = renderDialog();
    await userEvent.type(screen.getByLabelText('Prompt'), 'Hi');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'too long', isError: true }));
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('closes on Cancel', async () => {
    const { onClose } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('EditSnippetDialog editing', () => {
  it('shows the snippet and its origin, and updates it without vectorising an unembedded one', async () => {
    const { onSaved } = renderDialog(EXISTING);
    expect(screen.getByText('Edit snippet')).toBeInTheDocument();
    expect(screen.getByText('crawled from a page')).toBeInTheDocument();
    expect(screen.getByLabelText('Prompt')).toHaveValue('How do I reset?');
    expect(editor()).toHaveValue('Press the button.');

    await userEvent.type(editor(), ' Twice.');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.mlSnippetUpdate).toHaveBeenCalledWith({
      id: 7,
      prompt: 'How do I reset?',
      completion: 'Press the button. Twice.',
      type: 'support',
    });
    expect(api.vectoriseSnippet).not.toHaveBeenCalled();
    expect(toasts.at(-1)).toMatchObject({ text: 'Snippet saved' });
  });

  it('re-vectorises a snippet that had an embedding', async () => {
    const { onSaved } = renderDialog({ ...EXISTING, embedding_vss: 'abc' });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.vectoriseSnippet).toHaveBeenCalledWith(7);
    expect(toasts.at(-1)).toMatchObject({
      text: 'Snippet saved and re-vectorised',
      isError: false,
    });
  });

  it('reports a failed re-vectorise separately, since the save itself succeeded', async () => {
    vi.mocked(api.vectoriseSnippet).mockRejectedValueOnce(new Error('quota'));
    const { onSaved } = renderDialog({ ...EXISTING, embedding_vss: 'abc' });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(toasts.at(-1)).toMatchObject({ isError: true });
    expect(toasts.at(-1)?.text).toContain('Snippet saved, but re-vectorising it failed');
    expect(toasts.at(-1)?.text).toContain('quota');
  });

  it('shows the error when the update fails', async () => {
    vi.mocked(api.mlSnippetUpdate).mockRejectedValueOnce(new Error('conflict'));
    const { onSaved } = renderDialog(EXISTING);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'conflict', isError: true }));
    expect(onSaved).not.toHaveBeenCalled();
    expect(api.vectoriseSnippet).not.toHaveBeenCalled();
  });
});

describe('EditSnippetDialog AI bar', () => {
  it('sends the instruction with the current snippet and applies the returned JSON', async () => {
    vi.mocked(api.aiQuery).mockResolvedValue({
      result: '{"prompt":"New prompt","completion":"New completion"}',
    });
    renderDialog(EXISTING);
    await ask('shorten it');

    await waitFor(() => expect(screen.getByLabelText('Prompt')).toHaveValue('New prompt'));
    expect(editor()).toHaveValue('New completion');
    const [instruction, fileType, context, session] = vi.mocked(api.aiQuery).mock.calls[0];
    expect(instruction).toBe('shorten it');
    expect(fileType).toBe('support');
    expect(session).toBe('ml-snippet-transform.support');
    expect(context).toContain('Prompt: How do I reset?');
    expect(context).toContain('Completion:\nPress the button.');
  });

  it('tolerates fences and prose around the JSON', async () => {
    vi.mocked(api.aiQuery).mockResolvedValue({
      result: 'Sure!\n```json\n{"completion":"Only this"}\n```',
    });
    renderDialog(EXISTING);
    await ask('change');
    await waitFor(() => expect(editor()).toHaveValue('Only this'));
    expect(screen.getByLabelText('Prompt')).toHaveValue('How do I reset?');
  });

  it('keeps the whole answer as the completion when it is not JSON', async () => {
    vi.mocked(api.aiQuery).mockResolvedValue({ result: 'Just some prose' });
    renderDialog(EXISTING);
    await ask('change');
    await waitFor(() => expect(editor()).toHaveValue('Just some prose'));
    expect(screen.getByLabelText('Prompt')).toHaveValue('How do I reset?');
  });

  it('keeps the whole answer when the JSON has neither field', async () => {
    vi.mocked(api.aiQuery).mockResolvedValue({ result: '{"other":1}' });
    renderDialog(EXISTING);
    await ask('change');
    await waitFor(() => expect(editor()).toHaveValue('{"other":1}'));
  });

  it('only replaces the prompt when that is all the JSON carries', async () => {
    vi.mocked(api.aiQuery).mockResolvedValue({ result: '{"prompt":"P only"}' });
    renderDialog(EXISTING);
    await ask('change');
    await waitFor(() => expect(screen.getByLabelText('Prompt')).toHaveValue('P only'));
    expect(editor()).toHaveValue('Press the button.');
  });

  it('shows the error when the AI call fails', async () => {
    vi.mocked(api.aiQuery).mockRejectedValueOnce(new Error('model down'));
    renderDialog(EXISTING);
    await ask('change');
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'model down', isError: true }));
    expect(editor()).toHaveValue('Press the button.');
  });

  it('is absent when the backend has no AI configured', async () => {
    vi.mocked(api.openaiIsConfigured).mockResolvedValue({ result: false });
    renderDialog(EXISTING);
    await waitFor(() => expect(api.openaiIsConfigured).toHaveBeenCalled());
    expect(
      screen.queryByPlaceholderText('Where the Machine Creates the Code ...'),
    ).not.toBeInTheDocument();
  });
});

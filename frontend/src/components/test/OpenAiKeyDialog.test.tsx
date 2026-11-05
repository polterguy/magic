// @vitest-environment jsdom
/*
 * OpenAiKeyDialog: takes the OpenAI API key and the default model. The key and model are
 * prefilled from the backend, a short key is refused before any request, the default model is
 * only rewritten when it changed, and failures surface in a dismissible banner.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import OpenAiKeyDialog from '../OpenAiKeyDialog';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);

const KEY = 'sk-0123456789abcdefghij';

beforeEach(() => {
  vi.mocked(api.openaiModels).mockResolvedValue([
    { id: 'gpt-4o', chat: true, input_price: 2, output_price: 8 },
    { id: 'gpt-mini', chat: true },
    { id: 'whisper', chat: false },
  ]);
  vi.mocked(api.openaiGetKey).mockResolvedValue({ result: '' });
  vi.mocked(api.mlTypes).mockResolvedValue([]);
  vi.mocked(api.openaiSetKey).mockResolvedValue(undefined as never);
  vi.mocked(api.mlTypeUpdate).mockResolvedValue(undefined as never);
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderDialog() {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(<OpenAiKeyDialog onClose={onClose} onSaved={onSaved} />);
  return { onClose, onSaved };
}

function keyField() {
  return screen.getByLabelText<HTMLInputElement>(/OpenAI API key/);
}

// The model dropdown's trigger is the only button that carries aria-expanded.
function modelTrigger() {
  return screen.getByRole('button', { expanded: false });
}

async function pickModel(option: string | RegExp) {
  await userEvent.click(modelTrigger());
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

describe('OpenAiKeyDialog', () => {
  it('prefills the configured key and the model the default type runs', async () => {
    vi.mocked(api.openaiGetKey).mockResolvedValue({ result: KEY });
    vi.mocked(api.mlTypes).mockResolvedValue([
      { type: 'support', model: 'gpt-mini' },
      { type: 'default', model: 'gpt-4o' },
    ] as api.MlType[]);
    renderDialog();

    await waitFor(() => expect(keyField()).toHaveValue(KEY));
    await waitFor(() => expect(modelTrigger()).toHaveTextContent(/^gpt-4o/));
  });

  it('lists the chat models with their price and leaves out the others', async () => {
    renderDialog();
    await waitFor(() => expect(api.openaiModels).toHaveBeenCalled());
    await userEvent.click(modelTrigger());
    expect(
      await screen.findByRole('option', { name: /gpt-4o.*\$2\.00 in \/ \$8\.00 out/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'gpt-mini' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'whisper' })).not.toBeInTheDocument();
  });

  it('copes with a backend that answers with nothing', async () => {
    vi.mocked(api.openaiModels).mockResolvedValue(undefined as never);
    vi.mocked(api.openaiGetKey).mockResolvedValue({} as never);
    vi.mocked(api.mlTypes).mockResolvedValue(undefined as never);
    renderDialog();
    await waitFor(() => expect(api.mlTypes).toHaveBeenCalled());
    expect(keyField()).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Save key' })).toBeDisabled();
  });

  it('ignores a default type without a model and failing prefill requests', async () => {
    vi.mocked(api.openaiModels).mockRejectedValue(new Error('down'));
    vi.mocked(api.openaiGetKey).mockRejectedValue(new Error('down'));
    vi.mocked(api.mlTypes).mockRejectedValue(new Error('down'));
    renderDialog();
    await waitFor(() => expect(api.mlTypes).toHaveBeenCalled());
    expect(screen.queryByText('down')).not.toBeInTheDocument();

    await userEvent.type(keyField(), KEY);
    await userEvent.click(screen.getByRole('button', { name: 'Save key' }));
    // Nothing is known about the current model, so the preselected one is written
    await waitFor(() =>
      expect(api.mlTypeUpdate).toHaveBeenCalledWith({ type: 'default', model: 'gpt-6.1-terra' }),
    );
  });

  it('keeps a default type that names no model from selecting anything', async () => {
    vi.mocked(api.mlTypes).mockResolvedValue([{ type: 'default' }] as api.MlType[]);
    const { onSaved } = renderDialog();
    await waitFor(() => expect(api.mlTypes).toHaveBeenCalled());
    await userEvent.type(keyField(), KEY);
    await userEvent.click(screen.getByRole('button', { name: 'Save key' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.mlTypeUpdate).toHaveBeenCalledWith({ type: 'default', model: 'gpt-6.1-terra' });
  });

  it('refuses a key that is too short without calling the backend', async () => {
    const { onSaved } = renderDialog();
    await userEvent.type(keyField(), 'sk-short');
    await userEvent.click(screen.getByRole('button', { name: 'Save key' }));

    expect(screen.getByText('That does not look like a valid API key')).toBeInTheDocument();
    expect(api.openaiSetKey).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTitle('Dismiss'));
    expect(screen.queryByText('That does not look like a valid API key')).not.toBeInTheDocument();
  });

  it('saves only the key when the model is the one already in use', async () => {
    vi.mocked(api.mlTypes).mockResolvedValue([
      { type: 'default', model: 'gpt-4o' },
    ] as api.MlType[]);
    const { onSaved } = renderDialog();
    await waitFor(() => expect(modelTrigger()).toHaveTextContent(/^gpt-4o/));
    await userEvent.type(keyField(), KEY);
    await userEvent.click(screen.getByRole('button', { name: 'Save key' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.openaiSetKey).toHaveBeenCalledWith(KEY);
    expect(api.mlTypeUpdate).not.toHaveBeenCalled();
  });

  it('also switches the default model when another one is picked', async () => {
    vi.mocked(api.mlTypes).mockResolvedValue([
      { type: 'default', model: 'gpt-4o' },
    ] as api.MlType[]);
    const { onSaved } = renderDialog();
    await waitFor(() => expect(modelTrigger()).toHaveTextContent(/^gpt-4o/));
    await pickModel('gpt-mini');
    await userEvent.type(keyField(), KEY + '{Enter}');

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.openaiSetKey).toHaveBeenCalledWith(KEY);
    expect(api.mlTypeUpdate).toHaveBeenCalledWith({ type: 'default', model: 'gpt-mini' });
  });

  it('shows a failing save in the banner and re-enables the button', async () => {
    vi.mocked(api.openaiSetKey).mockRejectedValue(new Error('key rejected'));
    const { onSaved } = renderDialog();
    await userEvent.type(keyField(), KEY);
    await userEvent.click(screen.getByRole('button', { name: 'Save key' }));

    expect(await screen.findByText('key rejected')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Save key' })).toBeEnabled();
  });

  it('disables the button and says so while saving', async () => {
    let finish: () => void = () => {
      // replaced as soon as the save starts
    };
    vi.mocked(api.openaiSetKey).mockReturnValue(
      new Promise<never>(done => {
        finish = () => done(undefined as never);
      }),
    );
    renderDialog();
    await userEvent.type(keyField(), KEY);
    await userEvent.click(screen.getByRole('button', { name: 'Save key' }));

    expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled();
    finish();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save key' })).toBeEnabled());
  });

  it('closes on Cancel without saving', async () => {
    const { onClose } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
    expect(api.openaiSetKey).not.toHaveBeenCalled();
  });
});

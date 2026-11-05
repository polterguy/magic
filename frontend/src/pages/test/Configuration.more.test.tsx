// @vitest-environment jsdom
/*
 * Configuration page, the parts Configuration.test.tsx leaves out: every settings dialog patching
 * the configuration and saving it (or being cancelled), the editor's save shortcut, the backup
 * file chooser, and what the user sees when loading, saving, downloading or restoring fails.
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { downloadBlob } from '../../lib/download';
import { setToastListener, type Toast } from '../../lib/toast';
import { renderPage } from '../../test/renderPage';
import Configuration from '../Configuration';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);
vi.mock('../../lib/download', () => ({ downloadBlob: vi.fn() }));

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

// A plain textarea like the shared stub, plus a button standing in for the save shortcut.
vi.mock('../../components/CodeEditor', () => ({
  default: (props: Readonly<EditorProps>) => (
    <>
      <textarea
        aria-label="configuration editor"
        value={props.value}
        onChange={event => props.onChange(event.target.value)}
      />
      <button onClick={props.onSave}>editor save shortcut</button>
    </>
  ),
}));

const CONFIG = { magic: { smtp: { host: 'smtp.test' } } };

let toasts: Toast[];

beforeEach(() => {
  vi.clearAllMocks();
  toasts = [];
  setToastListener(toast => toasts.push(toast));
  vi.mocked(api.loadConfig).mockResolvedValue(CONFIG);
  vi.mocked(api.saveConfig).mockResolvedValue({} as never);
  vi.mocked(api.http.get).mockResolvedValue(['magic.openid.providers.google']);
});

afterEach(() => {
  setToastListener(null);
  vi.restoreAllMocks();
});

async function renderLoaded() {
  const view = renderPage(<Configuration />);
  const editor = await screen.findByLabelText('configuration editor');
  await waitFor(() => expect(editor).not.toHaveValue(''));
  return { ...view, editor };
}

async function openMenuItem(name: string) {
  await userEvent.click(screen.getByTitle('Settings dialogs and backup'));
  await userEvent.click(screen.getByRole('menuitem', { name }));
}

function dialog() {
  return within(screen.getByRole('dialog'));
}

function savedConfig() {
  return vi.mocked(api.saveConfig).mock.calls.at(-1)![0] as {
    magic: Record<string, Record<string, unknown>>;
  };
}

describe('Configuration loading and saving', () => {
  it('shows why the configuration could not be loaded and cannot be saved empty', async () => {
    vi.mocked(api.loadConfig).mockRejectedValue(new Error('config unreadable'));
    renderPage(<Configuration />);

    await waitFor(() =>
      expect(toasts.at(-1)).toMatchObject({ text: 'config unreadable', isError: true }),
    );
    expect(screen.getByLabelText('configuration editor')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('saves from the editor shortcut', async () => {
    const { editor } = await renderLoaded();
    fireEvent.change(editor, { target: { value: '{"magic":{"a":1}}' } });

    await userEvent.click(screen.getByRole('button', { name: 'editor save shortcut' }));

    await waitFor(() => expect(toasts.at(-1)?.text).toBe('Configuration saved'));
    expect(api.saveConfig).toHaveBeenCalledWith({ magic: { a: 1 } });
  });

  it('shows why a save failed and lets the user try again', async () => {
    vi.mocked(api.saveConfig).mockRejectedValueOnce(new Error('disk full'));
    const { editor } = await renderLoaded();

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'disk full', isError: true }));
    expect(editor).toHaveValue(JSON.stringify(CONFIG, null, 2));
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('rewrites the editor with the formatted JSON after a save', async () => {
    const { editor } = await renderLoaded();
    fireEvent.change(editor, { target: { value: '{"magic":{"a":1}}' } });

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(editor).toHaveValue(JSON.stringify({ magic: { a: 1 } }, null, 2)));
  });
});

describe('Configuration backups', () => {
  it('shows why a backup could not be downloaded', async () => {
    vi.mocked(api.downloadFileRaw).mockRejectedValue(new Error('no such file'));
    await renderLoaded();

    await openMenuItem('Download backup');

    await waitFor(() =>
      expect(toasts.at(-1)).toMatchObject({ text: 'no such file', isError: true }),
    );
    expect(downloadBlob).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('opens the file chooser for the upload menu item', async () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {
      // jsdom has no file chooser to open
    });
    await renderLoaded();

    await openMenuItem('Upload backup');

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('ignores a file chooser that was closed without a file', async () => {
    const { container } = await renderLoaded();

    fireEvent.change(container.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [] },
    });

    expect(api.uploadFile).not.toHaveBeenCalled();
    expect(toasts).toEqual([]);
  });

  it('reloads the configuration after restoring a backup', async () => {
    const { container } = await renderLoaded();
    vi.mocked(api.loadConfig).mockResolvedValue({ magic: { restored: true } });

    fireEvent.change(container.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [new File(['{}'], 'appsettings.json')] },
    });

    await waitFor(() =>
      expect(screen.getByLabelText('configuration editor')).toHaveValue(
        JSON.stringify({ magic: { restored: true } }, null, 2),
      ),
    );
  });

  it('shows why a backup could not be restored', async () => {
    vi.mocked(api.uploadFile).mockRejectedValue(new Error('upload refused'));
    const { container } = await renderLoaded();

    fireEvent.change(container.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [new File(['{}'], 'appsettings.json')] },
    });

    await waitFor(() =>
      expect(toasts.at(-1)).toMatchObject({ text: 'upload refused', isError: true }),
    );
    expect(api.loadConfig).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });
});

describe('Configuration settings dialogs', () => {
  it('saves the SMTP host the dialog was given', async () => {
    await renderLoaded();

    await openMenuItem('SMTP');
    const host = dialog().getByLabelText(/^Host/);
    await userEvent.clear(host);
    await userEvent.type(host, 'mail.test');
    await userEvent.click(dialog().getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(api.saveConfig).toHaveBeenCalled());
    expect(savedConfig().magic.smtp.host).toBe('mail.test');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('saves the reCAPTCHA keys', async () => {
    await renderLoaded();

    await openMenuItem('reCAPTCHA');
    await userEvent.type(dialog().getByLabelText(/^Site key/), 'site-1');
    await userEvent.type(dialog().getByLabelText(/^Secret key/), 'secret-1');
    await userEvent.click(dialog().getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(api.saveConfig).toHaveBeenCalled());
    expect(savedConfig().magic.auth).toEqual({ recaptcha: { key: 'site-1', secret: 'secret-1' } });
    expect(savedConfig().magic.smtp.host).toBe('smtp.test');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('saves the GitHub credentials', async () => {
    await renderLoaded();

    await openMenuItem('Git');
    await userEvent.type(dialog().getByLabelText(/^Username/), 'octocat');
    await userEvent.type(dialog().getByLabelText(/^Token/), 'ghp_token');
    await userEvent.click(dialog().getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(api.saveConfig).toHaveBeenCalled());
    expect(savedConfig().magic.git).toEqual({
      github: { username: 'octocat', token: 'ghp_token', host: 'github.com' },
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('saves the OpenID client id of the provider the backend offers', async () => {
    await renderLoaded();

    await openMenuItem('OpenID');
    await userEvent.type(await dialog().findByLabelText(/^Client ID/), 'client-123');
    await userEvent.click(dialog().getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(api.saveConfig).toHaveBeenCalled());
    expect(savedConfig().magic.oidc).toEqual({ google: { 'client-id': 'client-123' } });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it.each(['SMTP', 'reCAPTCHA', 'OpenID', 'Git', 'OpenAI'])(
    'closes the %s dialog without saving',
    async name => {
      await renderLoaded();

      await openMenuItem(name);
      await userEvent.click(dialog().getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(api.saveConfig).not.toHaveBeenCalled();
    },
  );

  it('stores the OpenAI key through its own endpoint and reloads the editor', async () => {
    vi.mocked(api.openaiModels).mockResolvedValue([{ id: 'gpt-6.1-terra', chat: true }]);
    vi.mocked(api.openaiGetKey).mockResolvedValue({ result: '' });
    vi.mocked(api.mlTypes).mockResolvedValue([]);
    vi.mocked(api.openaiSetKey).mockResolvedValue({} as never);
    vi.mocked(api.mlTypeUpdate).mockResolvedValue({} as never);
    await renderLoaded();
    vi.mocked(api.loadConfig).mockResolvedValue({ magic: { openai: { key: 'k' } } });

    await openMenuItem('OpenAI');
    await userEvent.type(dialog().getByLabelText(/^OpenAI API key/), 'sk-' + 'a'.repeat(30));
    await userEvent.click(dialog().getByRole('button', { name: 'Save key' }));

    await waitFor(() => expect(toasts.at(-1)?.text).toBe('OpenAI API key saved'));
    expect(api.openaiSetKey).toHaveBeenCalledWith('sk-' + 'a'.repeat(30));
    expect(api.saveConfig).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() =>
      expect(screen.getByLabelText('configuration editor')).toHaveValue(
        JSON.stringify({ magic: { openai: { key: 'k' } } }, null, 2),
      ),
    );
  });
});

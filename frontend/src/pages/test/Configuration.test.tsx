// @vitest-environment jsdom
/*
 * Configuration page: loads appsettings.json into the editor, saves it back as parsed JSON,
 * refuses invalid JSON, opens the settings dialogs from the menu, and downloads or restores a
 * backup (only a file named appsettings.json).
 */
import { fireEvent, screen, waitFor } from '@testing-library/react';
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
vi.mock('../../components/CodeEditor', async () => ({
  default: (await import('../../test/CodeEditorStub')).default,
}));
vi.mock('../../lib/download', () => ({ downloadBlob: vi.fn() }));

const CONFIG = { magic: { smtp: { host: 'smtp.test' } } };

let toasts: Toast[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  toasts = [];
  setToastListener(toast => toasts.push(toast));
  vi.mocked(api.loadConfig).mockResolvedValue(CONFIG);
  vi.mocked(api.saveConfig).mockResolvedValue({} as never);
});

afterEach(() => {
  setToastListener(null);
});

async function openMenuItem(name: string) {
  await userEvent.click(screen.getByTitle('Settings dialogs and backup'));
  await userEvent.click(screen.getByRole('menuitem', { name }));
}

describe('Configuration', () => {
  it('loads the configuration into the editor', async () => {
    renderPage(<Configuration />);

    expect(screen.getByRole('heading', { name: 'Configuration' })).toBeInTheDocument();
    const editor = await screen.findByLabelText('code editor application/json');
    await waitFor(() => expect(editor).toHaveValue(JSON.stringify(CONFIG, null, 2)));
  });

  it('saves the edited JSON', async () => {
    renderPage(<Configuration />);
    const editor = await screen.findByLabelText('code editor application/json');
    await waitFor(() => expect(editor).not.toHaveValue(''));

    fireEvent.change(editor, { target: { value: '{"magic":{"smtp":{"host":"mail.test"}}}' } });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(toasts.at(-1)?.text).toBe('Configuration saved'));
    expect(api.saveConfig).toHaveBeenCalledWith({ magic: { smtp: { host: 'mail.test' } } });
  });

  it('does not save invalid JSON', async () => {
    renderPage(<Configuration />);
    const editor = await screen.findByLabelText('code editor application/json');
    await waitFor(() => expect(editor).not.toHaveValue(''));

    fireEvent.change(editor, { target: { value: '{ nope' } });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(toasts.at(-1)?.text).toMatch(/^Invalid JSON/));
    expect(toasts.at(-1)?.isError).toBe(true);
    expect(api.saveConfig).not.toHaveBeenCalled();
  });

  it('opens the SMTP dialog from the menu', async () => {
    renderPage(<Configuration />);
    await screen.findByLabelText('code editor application/json');

    await openMenuItem('SMTP');

    expect(screen.getByRole('heading', { name: 'SMTP settings' })).toBeInTheDocument();
  });

  it('downloads a backup of appsettings.json', async () => {
    const blob = new Blob(['{}']);
    vi.mocked(api.downloadFileRaw).mockResolvedValue({ blob } as never);
    renderPage(<Configuration />);
    await screen.findByLabelText('code editor application/json');

    await openMenuItem('Download backup');

    await waitFor(() => expect(downloadBlob).toHaveBeenCalledWith(blob, 'appsettings.json'));
    expect(api.downloadFileRaw).toHaveBeenCalledWith('/config/appsettings.json');
  });

  it('refuses to restore a file with the wrong name', async () => {
    const { container } = renderPage(<Configuration />);
    await screen.findByLabelText('code editor application/json');

    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(['{}'], 'other.json', { type: 'application/json' })] },
    });

    await waitFor(() =>
      expect(toasts.at(-1)?.text).toBe('The file has to be named appsettings.json'),
    );
    expect(api.uploadFile).not.toHaveBeenCalled();
  });

  it('restores a backup named appsettings.json', async () => {
    const { container } = renderPage(<Configuration />);
    await screen.findByLabelText('code editor application/json');

    const file = new File(['{}'], 'appsettings.json', { type: 'application/json' });
    fireEvent.change(container.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [file] },
    });

    await waitFor(() => expect(api.uploadFile).toHaveBeenCalledWith('/config/', file));
    await waitFor(() =>
      expect(toasts.at(-1)?.text).toBe('Configuration restored from appsettings.json'),
    );
  });
});

// @vitest-environment jsdom
/*
 * UrlsDialog: edits magic.backend.url and magic.frontend.urls in the configuration JSON text. They
 * start from the stored values, or the backend and dashboard in use, are saved as an address and a
 * comma separated list of origins, and saving is refused for bad URLs and for a list that would
 * lock this dashboard out.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { servedByBackend } from '../../../lib/backend';
import { AuthContext } from '../../../lib/useAuth';
import { fakeAuth } from '../../../test/renderPage';
import { DialogProvider } from '../../Dialogs';
import UrlsDialog from '../UrlsDialog';

vi.mock('../../../lib/backend', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../lib/backend')>()),
  servedByBackend: vi.fn(),
}));

// What jsdom reports as the dashboard's own origin.
const DASHBOARD = globalThis.location.origin;

beforeEach(() => {
  vi.mocked(servedByBackend).mockReturnValue(false);
});

function renderDialog(config: string) {
  const onClose = vi.fn();
  const onSave = vi.fn();
  render(
    <AuthContext.Provider value={fakeAuth()}>
      <DialogProvider>
        <UrlsDialog config={config} onClose={onClose} onSave={onSave} />
      </DialogProvider>
    </AuthContext.Provider>,
  );
  return { onClose, onSave };
}

function saved(onSave: ReturnType<typeof vi.fn>) {
  return JSON.parse(onSave.mock.calls[0][0] as string) as { magic: Record<string, unknown> };
}

const backendField = () => screen.getByLabelText(/^Backend URL/);
const frontendsField = () => screen.getByLabelText(/^Frontend URLs/);

describe('UrlsDialog', () => {
  it('starts with the backend and dashboard in use when nothing is configured', () => {
    renderDialog('{}');
    expect(backendField()).toHaveValue('https://cloudlet.test');
    expect(frontendsField()).toHaveValue(DASHBOARD);
  });

  it('starts with the stored values, one frontend per line', () => {
    renderDialog(
      JSON.stringify({
        magic: {
          backend: { url: 'https://api.test' },
          frontend: { urls: 'https://a.test, https://b.test' },
        },
      }),
    );
    expect(backendField()).toHaveValue('https://api.test');
    expect(frontendsField()).toHaveValue('https://a.test\nhttps://b.test');
  });

  it('saves the backend and the frontend origins, keeping the rest of the configuration', async () => {
    const { onSave } = renderDialog(
      JSON.stringify({ magic: { smtp: { host: 'smtp.test' }, backend: { other: 1 } } }),
    );
    await userEvent.clear(backendField());
    await userEvent.type(backendField(), 'https://api.test/');
    await userEvent.clear(frontendsField());
    await userEvent.type(frontendsField(), `${DASHBOARD}/app{Enter}https://b.test/`);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(saved(onSave).magic).toEqual({
      smtp: { host: 'smtp.test' },
      backend: { other: 1, url: 'https://api.test' },
      frontend: { urls: `${DASHBOARD},https://b.test` },
    });
  });

  it('removes the settings when both are emptied', async () => {
    const { onSave } = renderDialog(
      JSON.stringify({
        magic: { backend: { url: 'https://api.test' }, frontend: { urls: 'https://a.test' } },
      }),
    );
    await userEvent.clear(backendField());
    await userEvent.clear(frontendsField());
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(saved(onSave).magic).toEqual({});
  });

  it('refuses a backend URL that is not http(s) and saves nothing', async () => {
    const { onSave } = renderDialog('{}');
    await userEvent.clear(backendField());
    await userEvent.type(backendField(), 'api.test');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      screen.getByText(/The backend URL must be an http or https address/),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('names the frontend entries that are not URLs', async () => {
    const { onSave } = renderDialog('{}');
    await userEvent.clear(frontendsField());
    await userEvent.type(frontendsField(), `${DASHBOARD}{Enter}nope`);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('These are not http or https URLs: nope')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('refuses a list without this dashboard, which would lock it out', async () => {
    const { onSave } = renderDialog('{}');
    await userEvent.clear(frontendsField());
    await userEvent.type(frontendsField(), 'https://other.test');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText(/it is not in the list/)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('allows a list without the dashboard when the backend serves it itself', async () => {
    vi.mocked(servedByBackend).mockReturnValue(true);
    const { onSave } = renderDialog('{}');
    await userEvent.clear(frontendsField());
    await userEvent.type(frontendsField(), 'https://other.test');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(saved(onSave).magic.frontend).toEqual({ urls: 'https://other.test' });
  });

  it('saves nothing for invalid JSON', async () => {
    const { onSave } = renderDialog('{ nope');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('closes with Cancel', async () => {
    const { onClose } = renderDialog('{}');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});

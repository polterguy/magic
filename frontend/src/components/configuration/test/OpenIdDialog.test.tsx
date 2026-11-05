// @vitest-environment jsdom
/*
 * OpenIdDialog: patches magic.oidc in the configuration text. The provider list comes from the
 * evaluator's slot list; edits accumulate across providers and one Save writes them all, blank
 * values removing their keys. Covers loading, the empty list, a failing slot request, provider
 * specific fields, the console link, the redirect URI copy and Save/Cancel.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import OpenIdDialog from '../OpenIdDialog';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

const SLOTS = [
  'magic.openid.providers.microsoft',
  'magic.openid.providers.google',
  'magic.openid.providers.okta',
  'magic.openid.providers.custom',
  'magic.something.else',
];

const CONFIG = JSON.stringify({
  magic: { oidc: { google: { 'client-id': 'g-123' } }, other: 1 },
});

let toasts: Toast[];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  vi.mocked(api.http.get).mockResolvedValue(SLOTS);
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function renderDialog(config = CONFIG) {
  const onClose = vi.fn();
  const onSave = vi.fn();
  render(<OpenIdDialog config={config} onClose={onClose} onSave={onSave} />);
  return { onClose, onSave };
}

async function pick(current: string, option: string) {
  await userEvent.click(await screen.findByText(current, { selector: '.select-value' }));
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

function savedConfig(onSave: ReturnType<typeof vi.fn>) {
  return JSON.parse(onSave.mock.calls[0][0] as string) as {
    magic: { oidc?: Record<string, Record<string, string>>; other?: number };
  };
}

describe('OpenIdDialog', () => {
  it('shows a spinner and a disabled Save until the slot list answers', async () => {
    let resolve: (slots: string[]) => void = () => {
      // replaced as soon as the request is made
    };
    vi.mocked(api.http.get).mockReturnValue(
      new Promise<string[]>(done => {
        resolve = done;
      }),
    );
    renderDialog();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.queryByText('Provider')).not.toBeInTheDocument();

    resolve(SLOTS);
    expect(await screen.findByText('Provider')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(api.http.get).toHaveBeenCalledWith('/magic/system/evaluator/slots');
  });

  it('lists the providers from the slots, sorted, marking the configured ones', async () => {
    renderDialog();
    // custom sorts first, so it is the one selected
    await screen.findByText('custom', { selector: '.select-value' });
    await userEvent.click(screen.getByText('custom', { selector: '.select-value' }));
    const names = (await screen.findAllByRole('option')).map(option =>
      option.textContent?.replace('✓', ''),
    );
    expect(names).toEqual(['custom', 'google — configured', 'microsoft', 'okta']);
  });

  it('explains that no providers exist and keeps Save disabled', async () => {
    vi.mocked(api.http.get).mockResolvedValue(['magic.something.else']);
    renderDialog();
    expect(await screen.findByText(/No OpenID providers are registered/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('treats a null slot list as no providers', async () => {
    vi.mocked(api.http.get).mockResolvedValue(null);
    renderDialog();
    expect(await screen.findByText(/No OpenID providers are registered/)).toBeInTheDocument();
  });

  it('toasts a failing slot request and shows the empty state', async () => {
    vi.mocked(api.http.get).mockRejectedValue(new Error('slots down'));
    renderDialog();
    expect(await screen.findByText(/No OpenID providers are registered/)).toBeInTheDocument();
    expect(toasts.some(toast => toast.text === 'slots down' && toast.isError)).toBe(true);
  });

  it('prefills the client ID of an existing provider and links its console', async () => {
    renderDialog();
    await pick('custom', 'google — configured');
    expect(screen.getByLabelText('Client ID')).toHaveValue('g-123');
    const link = screen.getByRole('link', { name: 'the Google Cloud console' });
    expect(link).toHaveAttribute('href', 'https://console.cloud.google.com/apis/credentials');
  });

  it('offers a client ID only, and no console link, for an unknown provider', async () => {
    renderDialog();
    await screen.findByText('custom', { selector: '.select-value' });
    expect(screen.getByLabelText('Client ID')).toHaveValue('');
    expect(screen.getByLabelText('Client ID')).toHaveAttribute(
      'placeholder',
      'Empty — sign-in with this provider is off',
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/secret/i)).not.toBeInTheDocument();
  });

  it('shows the extra fields a provider needs, with their placeholders', async () => {
    renderDialog();
    await pick('custom', 'okta');
    expect(screen.getByLabelText('Issuer URL')).toHaveAttribute(
      'placeholder',
      'https://dev-123456.okta.com/oauth2/default',
    );
    const secret = screen.getByLabelText('Client secret (optional)');
    expect(secret).toHaveClass('secret');
    // Only the first field carries the "sign-in is off" hint when it has no placeholder of its own
    expect(secret).not.toHaveAttribute('placeholder');
  });

  it('writes the edits of several providers with one Save, dropping cleared keys', async () => {
    const { onSave } = renderDialog();
    await pick('custom', 'microsoft');
    await userEvent.type(screen.getByLabelText('Client ID'), '  ms-1  ');
    await userEvent.type(screen.getByLabelText('Directory (tenant) ID'), 'tenant-9');
    await pick('microsoft — configured', 'google — configured');
    await userEvent.clear(screen.getByLabelText('Client ID'));

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    const saved = savedConfig(onSave);
    expect(saved.magic.oidc).toEqual({ microsoft: { 'client-id': 'ms-1', tenant: 'tenant-9' } });
    expect(saved.magic.other).toBe(1);
  });

  it('saves with Enter inside a field', async () => {
    const { onSave } = renderDialog();
    await userEvent.type(await screen.findByLabelText('Client ID'), 'c-1{Enter}');
    expect(savedConfig(onSave).magic.oidc?.custom).toEqual({ 'client-id': 'c-1' });
  });

  it('does not save when the configuration is not a JSON object', async () => {
    const { onSave } = renderDialog('not json');
    await screen.findByText('Provider');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('closes on Cancel without saving', async () => {
    const { onClose, onSave } = renderDialog();
    await screen.findByText('Provider');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('copies the redirect URI to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    renderDialog();
    const uri = globalThis.location.origin + '/authentication/oidc-callback';
    expect(screen.getByText(uri)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(uri));
    await waitFor(() =>
      expect(
        toasts.some(toast => toast.text === 'The redirect URI can be found on your clipboard'),
      ).toBe(true),
    );
  });
});

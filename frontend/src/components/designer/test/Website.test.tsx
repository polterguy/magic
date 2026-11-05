// @vitest-environment jsdom
/*
 * Website tab: loading /etc/www/.config through the API (loading, error and populated
 * states, extension stripping), the SPA toggle, the 404 field and its suggestions,
 * adding / editing / removing redirects with the one-unfinished-row rule, the dirty
 * state of Save, and what is sent on save (.html re-added, blank rows dropped).
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import Website from '../Website';

vi.mock('../../../lib/api', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../lib/api')>()),
  listFilesRecursively: vi.fn(),
  loadWebsiteConfig: vi.fn(),
  saveWebsiteConfig: vi.fn(),
}));

let toasts: Toast[];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  vi.mocked(api.loadWebsiteConfig).mockResolvedValue({
    spa_enabled: false,
    not_found: '/etc/www/.components/404.html',
    redirects: [{ from: '/old', to: '/new' }],
  });
  vi.mocked(api.listFilesRecursively).mockResolvedValue([
    '/etc/www/b.html',
    '/etc/www/.components/404.html',
    '/etc/www/.well-known/secret.html',
    '/etc/www/a.htm',
    '/etc/www/style.css',
  ]);
  vi.mocked(api.saveWebsiteConfig).mockResolvedValue({ saved: true });
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

async function renderWebsite(urls: string[] = ['/', '/pricing']) {
  const view = render(<Website urls={urls} />);
  await screen.findByText('Custom 404 page');
  return view;
}

const notFound = () => screen.getByPlaceholderText('/etc/www/.components/404');
const save = () => screen.getByRole('button', { name: /Save|Saving/ });

describe('Website loading', () => {
  it('shows Loading… first, then the loaded configuration without the .html extension', async () => {
    render(<Website urls={[]} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    await screen.findByText('Custom 404 page');
    expect(notFound()).toHaveValue('/etc/www/.components/404');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByDisplayValue('/old')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/new')).toBeInTheDocument();
    expect(api.listFilesRecursively).toHaveBeenCalledWith('/etc/www', false);
  });

  it('shows an error when the configuration cannot be loaded', async () => {
    vi.mocked(api.loadWebsiteConfig).mockRejectedValue(new Error('forbidden'));
    render(<Website urls={[]} />);
    expect(
      await screen.findByText('Could not load the website configuration.'),
    ).toBeInTheDocument();
  });

  it('treats null redirects as none', async () => {
    vi.mocked(api.loadWebsiteConfig).mockResolvedValue({
      spa_enabled: true,
      not_found: '',
      redirects: null,
    });
    await renderWebsite();
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.queryByTitle('Remove this redirect')).not.toBeInTheDocument();
  });

  it('suggests every html file except under .well-known, sorted, without extension', async () => {
    await renderWebsite();
    await waitFor(() =>
      expect(document.querySelectorAll('#website-not-found-options option')).toHaveLength(3),
    );
    const values = Array.from(document.querySelectorAll('#website-not-found-options option')).map(
      o => o.getAttribute('value'),
    );
    expect(values).toEqual(['/etc/www/.components/404', '/etc/www/a', '/etc/www/b']);
  });

  it('still works when the file listing fails', async () => {
    vi.mocked(api.listFilesRecursively).mockRejectedValue(new Error('nope'));
    await renderWebsite();
    expect(document.querySelectorAll('#website-not-found-options option')).toHaveLength(0);
  });

  it('offers the site pages as redirect targets', async () => {
    await renderWebsite(['/', '/pricing']);
    const values = Array.from(document.querySelectorAll('#website-redirect-to-options option')).map(
      o => o.getAttribute('value'),
    );
    expect(values).toEqual(['/', '/pricing']);
  });
});

describe('Website editing', () => {
  it('keeps Save disabled until something changes, and again once changed back', async () => {
    await renderWebsite();
    expect(save()).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox'));
    expect(save()).toBeEnabled();
    await userEvent.click(screen.getByRole('checkbox'));
    expect(save()).toBeDisabled();
  });

  it('strips a pasted .html from the 404 field', async () => {
    await renderWebsite();
    await userEvent.clear(notFound());
    await userEvent.paste('/etc/www/missing.html');
    expect(notFound()).toHaveValue('/etc/www/missing');
  });

  it('strips an extension from an own-page redirect target but not an external one', async () => {
    await renderWebsite();
    const to = screen.getByDisplayValue('/new');
    await userEvent.clear(to);
    await userEvent.paste('/pricing.html');
    expect(to).toHaveValue('/pricing');
    await userEvent.clear(to);
    await userEvent.paste('https://other.test/page.html');
    expect(to).toHaveValue('https://other.test/page.html');
  });

  it('adds a redirect row, but only after the previous one is finished', async () => {
    await renderWebsite();
    const add = screen.getByRole('button', { name: 'Add a redirect' });
    await userEvent.click(add);
    expect(screen.getAllByTitle('Remove this redirect')).toHaveLength(2);
    expect(add).toBeDisabled();
    expect(add).toHaveAttribute(
      'title',
      expect.stringContaining('Finish the redirect above first'),
    );
    const [from, to] = screen.getAllByPlaceholderText(/\/old-page|\/new-page/).slice(-2);
    await userEvent.type(from, '/a');
    expect(add).toBeDisabled();
    await userEvent.type(to, '/b');
    expect(add).toBeEnabled();
  });

  it('removes a redirect', async () => {
    await renderWebsite();
    await userEvent.click(screen.getByTitle('Remove this redirect'));
    expect(screen.queryByDisplayValue('/old')).not.toBeInTheDocument();
    expect(save()).toBeEnabled();
  });
});

describe('Website saving', () => {
  it('sends the edited configuration with .html put back on the 404 path', async () => {
    await renderWebsite();
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.clear(notFound());
    await userEvent.type(notFound(), ' /etc/www/oops ');
    await userEvent.click(save());
    await waitFor(() =>
      expect(api.saveWebsiteConfig).toHaveBeenCalledWith({
        spa_enabled: true,
        not_found: '/etc/www/oops.html',
        redirects: [{ from: '/old', to: '/new' }],
      }),
    );
    await waitFor(() =>
      expect(toasts.map(t => t.text)).toContain('Saved the website configuration'),
    );
    expect(notFound()).toHaveValue('/etc/www/oops');
    expect(save()).toBeDisabled();
  });

  it('sends an empty 404 as empty, and drops unfinished redirect rows', async () => {
    await renderWebsite();
    await userEvent.clear(notFound());
    await userEvent.click(screen.getByRole('button', { name: 'Add a redirect' }));
    await userEvent.click(save());
    await waitFor(() =>
      expect(api.saveWebsiteConfig).toHaveBeenCalledWith({
        spa_enabled: false,
        not_found: '',
        redirects: [{ from: '/old', to: '/new' }],
      }),
    );
    await waitFor(() => expect(screen.getAllByTitle('Remove this redirect')).toHaveLength(1));
  });

  it('shows the error and stays dirty when saving fails', async () => {
    vi.mocked(api.saveWebsiteConfig).mockRejectedValue(new Error('read-only'));
    await renderWebsite();
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(save());
    await waitFor(() =>
      expect(toasts).toContainEqual(expect.objectContaining({ text: 'read-only', isError: true })),
    );
    expect(save()).toBeEnabled();
    expect(within(document.body).getByRole('checkbox')).toBeChecked();
  });
});

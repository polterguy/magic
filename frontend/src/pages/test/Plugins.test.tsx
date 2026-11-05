// @vitest-environment jsdom
/*
 * Plugins page: lists the plugins from the repository with the installed ones marked for
 * reinstall, filters them, shows the details of one, and installs after the confirmations the
 * kind of plugin calls for.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { renderPage } from '../../test/renderPage';
import Plugins from '../Plugins';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);

const MCP = { name: 'mcp', type: 'module', description: 'Exposes **endpoints** as tools. More.' };
const SITE = { name: 'landing', type: 'frontend', description: 'A landing page.' };
const SHOP = { name: 'shop', type: 'module', description: 'A small webshop.' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.availablePlugins).mockResolvedValue([MCP, SITE, SHOP]);
  vi.mocked(api.installedPlugins).mockResolvedValue([{ name: 'mcp', module_name: 'mcp' }] as never);
  vi.mocked(api.installPlugin).mockResolvedValue({} as never);
});

function cardOf(name: string) {
  return screen.getByText(name, { selector: 'strong' }).closest('.card') as HTMLElement;
}

describe('Plugins', () => {
  it('lists the plugins and marks the installed one for reinstall', async () => {
    renderPage(<Plugins />);

    expect(await screen.findByText('landing')).toBeInTheDocument();
    expect(screen.getByText('3 shown')).toBeInTheDocument();
    expect(within(cardOf('shop')).getByRole('button', { name: 'Install' })).toBeInTheDocument();
    await waitFor(() =>
      expect(within(cardOf('mcp')).getByRole('button', { name: 'Reinstall' })).toBeInTheDocument(),
    );
    // Only the first sentence of the markdown description, without its markup.
    expect(within(cardOf('mcp')).getByText('Exposes endpoints as tools.')).toBeInTheDocument();
  });

  it('filters by the typed text', async () => {
    renderPage(<Plugins />);
    await screen.findByText('landing');

    await userEvent.type(screen.getByPlaceholderText('Search plugins…'), 'webshop');

    expect(screen.getByText('1 shown')).toBeInTheDocument();
    expect(screen.queryByText('landing')).not.toBeInTheDocument();
  });

  it('shows the details of a plugin', async () => {
    renderPage(<Plugins />);
    await screen.findByText('landing');

    await userEvent.click(within(cardOf('shop')).getByRole('button', { name: 'Details' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'shop' })).toBeInTheDocument();
    expect(within(dialog).getByText('A small webshop.')).toBeInTheDocument();
  });

  it('installs a new module straight away', async () => {
    renderPage(<Plugins />);
    await screen.findByText('landing');

    await userEvent.click(within(cardOf('shop')).getByRole('button', { name: 'Install' }));

    await waitFor(() => expect(api.installPlugin).toHaveBeenCalledWith(SHOP));
  });

  it('confirms before a frontend overwrites /etc/www', async () => {
    renderPage(<Plugins />);
    await screen.findByText('landing');

    await userEvent.click(within(cardOf('landing')).getByRole('button', { name: 'Install' }));
    expect(screen.getByText(/overwrites all existing frontend files/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Yes, install' }));

    await waitFor(() => expect(api.installPlugin).toHaveBeenCalledWith(SITE));
  });

  it('does not reinstall when the confirmation is declined', async () => {
    renderPage(<Plugins />);
    await screen.findByText('landing');
    await waitFor(() =>
      expect(within(cardOf('mcp')).getByRole('button', { name: 'Reinstall' })).toBeInTheDocument(),
    );

    await userEvent.click(within(cardOf('mcp')).getByRole('button', { name: 'Reinstall' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(api.installPlugin).not.toHaveBeenCalled();
  });

  it('refuses a ZIP that cannot be a module', async () => {
    const { container } = renderPage(<Plugins />);
    await screen.findByText('landing');

    await userEvent.upload(
      container.querySelector<HTMLInputElement>('input[type="file"]')!,
      new File(['x'], 'Bad Name.zip', { type: 'application/zip' }),
    );

    expect(api.installModule).not.toHaveBeenCalled();
  });

  it('installs a module from a ZIP file', async () => {
    const { container } = renderPage(<Plugins />);
    await screen.findByText('landing');
    const file = new File(['x'], 'my-module.zip', { type: 'application/zip' });

    await userEvent.upload(container.querySelector<HTMLInputElement>('input[type="file"]')!, file);

    await waitFor(() => expect(api.installModule).toHaveBeenCalledWith(file));
  });
});

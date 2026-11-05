// @vitest-environment jsdom
/*
 * Dashboard page: shows the connection, the KPI counts, the agent-plugin and OpenAI cards that
 * depend on what is installed, and installs the missing agent plugins from the repository.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { renderPage, TEST_BACKEND } from '../../test/renderPage';
import Dashboard from '../Dashboard';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);
vi.mock('../../components/CodeEditor', async () => ({
  default: (await import('../../test/CodeEditorStub')).default,
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  // Seen already, so the guided tour does not cover the page.
  localStorage.setItem('magic2.tourSeen.' + TEST_BACKEND.url, '1');
  vi.mocked(api.countEndpoints).mockResolvedValue({ count: 120 });
  vi.mocked(api.countPublicEndpoints).mockResolvedValue({ count: 3 });
  vi.mocked(api.countUsers).mockResolvedValue({ count: 7 });
  vi.mocked(api.countTasks).mockResolvedValue({ count: 2 });
  vi.mocked(api.countLog).mockResolvedValue({ count: 456 });
  vi.mocked(api.listFolders).mockResolvedValue(['/modules/mcp/', '/modules/oauth/']);
  vi.mocked(api.listFiles).mockResolvedValue(['/etc/www/index.html']);
  vi.mocked(api.listTasks).mockResolvedValue([{ id: 'nightly-cleanup' }]);
  vi.mocked(api.openaiIsConfigured).mockResolvedValue({ result: true });
  vi.mocked(api.availablePlugins).mockResolvedValue([
    { name: 'mcp', type: 'module' },
    { name: 'oauth', type: 'module' },
  ] as never);
  vi.mocked(api.installPlugin).mockResolvedValue({} as never);
});

describe('Dashboard', () => {
  it('shows the connection and the counts', async () => {
    renderPage(<Dashboard />);

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Connected to https://cloudlet.test as root')).toBeInTheDocument();
    expect(screen.getByText('v1.2.3')).toBeInTheDocument();
    expect(await screen.findByText('456')).toBeInTheDocument();
    const endpoints = screen
      .getAllByRole('link')
      .find(a => a.getAttribute('href') === '/endpoints')!;
    expect(within(endpoints).getByText('120')).toBeInTheDocument();
    const users = screen
      .getAllByRole('link')
      .find(
        a =>
          a.getAttribute('href') === '/user-roles-management' &&
          a.textContent?.includes('Users') &&
          a.classList.contains('kpi-link'),
      )!;
    expect(within(users).getByText('7')).toBeInTheDocument();
  });

  it('lists the first tasks for running', async () => {
    renderPage(<Dashboard />);

    expect(await screen.findByText('nightly-cleanup')).toBeInTheDocument();
  });

  it('presents the cloudlet as an agent when the plugins are installed', async () => {
    renderPage(<Dashboard />);

    expect(await screen.findByText('This cloudlet is an AI agent')).toBeInTheDocument();
    expect(screen.getByText('https://cloudlet.test/magic/modules/mcp/mcp')).toBeInTheDocument();
  });

  it('offers the OpenAI key card when no key is configured', async () => {
    vi.mocked(api.openaiIsConfigured).mockResolvedValue({ result: false });
    renderPage(<Dashboard />);

    expect(await screen.findByText('Add your OpenAI API key')).toBeInTheDocument();
  });

  it('installs the agent plugins that are missing', async () => {
    vi.mocked(api.listFolders).mockResolvedValue(['/modules/mcp/']);
    renderPage(<Dashboard />);

    await userEvent.click(await screen.findByRole('button', { name: 'Install oauth' }));

    await waitFor(() =>
      expect(api.installPlugin).toHaveBeenCalledWith({ name: 'oauth', type: 'module' }),
    );
    expect(await screen.findByText('This cloudlet is an AI agent')).toBeInTheDocument();
  });

  it('asks for a password after arriving through a magic link', async () => {
    sessionStorage.setItem('magic2.magic-link-arrival', '1');
    renderPage(<Dashboard />);

    expect(await screen.findByRole('heading', { name: /password/i })).toBeInTheDocument();
  });
});

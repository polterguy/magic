// @vitest-environment jsdom
/*
 * WebDesigner page: lists the pages under /etc/www/ in the picker, opens the first (or the
 * remembered) page, switches page, and shows the empty state when there are none. The canvas
 * itself (an iframe that jsdom cannot render) and the code editor are replaced by stubs, so this
 * covers the page's wiring rather than direct manipulation of the DOM inside the canvas.
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { renderPage, TEST_BACKEND } from '../../test/renderPage';
import WebDesigner from '../WebDesigner';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);
vi.mock('../../components/CodeEditor', async () => ({
  default: (await import('../../test/CodeEditorStub')).default,
}));
vi.mock('../../components/designer/CanvasArea', () => ({
  default: () => <div data-testid="canvas" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(api.listFilesRecursively).mockResolvedValue([
    '/etc/www/about.html',
    '/etc/www/index.html',
    '/etc/www/.hidden/secret.html',
    '/etc/www/styles.css',
  ]);
  vi.mocked(api.loadFile).mockResolvedValue('<html><body><h1>Hi</h1></body></html>');
});

describe('WebDesigner', () => {
  it('lists the served pages by their address and opens the first', async () => {
    renderPage(<WebDesigner />);

    expect(screen.getByRole('heading', { name: 'Web Designer' })).toBeInTheDocument();
    const picker = await screen.findByTitle('The page being designed');
    await waitFor(() => expect(picker).toHaveValue('/etc/www/index.html'));
    expect(Array.from((picker as HTMLSelectElement).options).map(o => o.textContent)).toEqual([
      '/',
      '/about',
    ]);
    expect(api.loadFile).toHaveBeenCalledWith('/etc/www/index.html');
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  it('reopens the page remembered for this backend', async () => {
    localStorage.setItem('magic2.designer.page.' + TEST_BACKEND.url, '/etc/www/about.html');
    renderPage(<WebDesigner />);

    await waitFor(() => expect(api.loadFile).toHaveBeenCalledWith('/etc/www/about.html'));
  });

  it('opens another page from the picker', async () => {
    renderPage(<WebDesigner />);
    const picker = await screen.findByTitle('The page being designed');
    await waitFor(() => expect(picker).toHaveValue('/etc/www/index.html'));

    await userEvent.selectOptions(picker, '/etc/www/about.html');

    await waitFor(() => expect(api.loadFile).toHaveBeenLastCalledWith('/etc/www/about.html'));
  });

  it('keeps Save disabled until something has changed', async () => {
    renderPage(<WebDesigner />);
    await waitFor(() => expect(api.loadFile).toHaveBeenCalled());

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('says so when the cloudlet has no pages', async () => {
    vi.mocked(api.listFilesRecursively).mockResolvedValue([]);
    renderPage(<WebDesigner />);

    expect(await screen.findByText('No pages in /etc/www/')).toBeInTheDocument();
    expect(api.loadFile).not.toHaveBeenCalled();
  });
});

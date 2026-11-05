// @vitest-environment jsdom
/*
 * Files page (Hyper IDE): shows the file tree from the backend, opens a file into the editor,
 * saves an edit, filters the tree, and restores the tabs remembered for the backend. The code
 * editor is replaced by a textarea stub, since CodeMirror needs layout jsdom does not have.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { setToastListener, type Toast } from '../../lib/toast';
import { renderPage, TEST_BACKEND } from '../../test/renderPage';
import Files from '../Files';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);
vi.mock('../../components/CodeEditor', async () => ({
  default: (await import('../../test/CodeEditorStub')).default,
}));

let toasts: Toast[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  toasts = [];
  setToastListener(toast => toasts.push(toast));
  vi.mocked(api.listFoldersRecursively).mockResolvedValue(['/modules/', '/modules/shop/']);
  vi.mocked(api.listFilesRecursively).mockResolvedValue([
    '/modules/shop/products.get.hl',
    '/readme.md',
  ]);
  vi.mocked(api.loadFile).mockImplementation(path =>
    Promise.resolve(path.endsWith('.md') ? '# Read me' : 'log.info:hello'),
  );
  vi.mocked(api.saveFile).mockResolvedValue({} as never);
});

afterEach(() => {
  setToastListener(null);
});

describe('Files', () => {
  it('shows the file tree', async () => {
    renderPage(<Files />);

    expect(await screen.findByText('readme.md')).toBeInTheDocument();
    expect(screen.getByText('modules')).toBeInTheDocument();
    expect(api.listFilesRecursively).toHaveBeenCalledWith('/', false);
  });

  it('opens a file into the editor', async () => {
    renderPage(<Files />);

    await userEvent.click(await screen.findByText('readme.md'));

    expect(await screen.findByDisplayValue('# Read me')).toBeInTheDocument();
    expect(api.loadFile).toHaveBeenCalledWith('/readme.md');
  });

  it('saves an edited file', async () => {
    renderPage(<Files />);
    await userEvent.click(await screen.findByText('readme.md'));
    const editor = await screen.findByDisplayValue('# Read me');

    fireEvent.change(editor, { target: { value: '# Changed' } });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(api.saveFile).toHaveBeenCalledWith('/readme.md', '# Changed'));
    await waitFor(() => expect(toasts.at(-1)?.text).toBe('Saved /readme.md'));
  });

  it('narrows the tree to what the filter matches', async () => {
    renderPage(<Files />);
    await screen.findByText('readme.md');

    await userEvent.type(screen.getByPlaceholderText('Filter files…'), 'products');

    await waitFor(() => expect(screen.queryByText('readme.md')).not.toBeInTheDocument());
    expect(screen.getByText('products.get.hl')).toBeInTheDocument();
  });

  it('reloads the tree with system files when the toggle is ticked', async () => {
    renderPage(<Files />);
    await screen.findByText('readme.md');

    await userEvent.click(screen.getByLabelText('System files'));

    await waitFor(() => expect(api.listFilesRecursively).toHaveBeenLastCalledWith('/', true));
  });

  it('restores the tabs remembered for this backend', async () => {
    localStorage.setItem(
      'magic2.ide.workspace.' + TEST_BACKEND.url,
      JSON.stringify({ open: ['/readme.md'], selected: '/readme.md' }),
    );
    renderPage(<Files />);

    expect(await screen.findByDisplayValue('# Read me')).toBeInTheDocument();
  });
});

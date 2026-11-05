// @vitest-environment jsdom
/*
 * Playground page: runs the Hyperlambda in the editor and shows the result (unwrapping the
 * {"result": ...} shape, or showing JSON as returned), loads a snippet into the editor, and saves
 * the editor as a named snippet. The code editors are replaced by textarea stubs.
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { renderPage } from '../../test/renderPage';
import Playground from '../Playground';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);
vi.mock('../../components/CodeEditor', async () => ({
  default: (await import('../../test/CodeEditorStub')).default,
}));

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  vi.mocked(api.listFiles).mockResolvedValue(['/etc/snippets/hello.hl', '/etc/snippets/notes.txt']);
  vi.mocked(api.openaiIsConfigured).mockResolvedValue({ result: false });
  vi.mocked(api.loadFile).mockResolvedValue('log.info:hello');
  vi.mocked(api.saveFile).mockResolvedValue({} as never);
});

describe('Playground', () => {
  it('starts with the default snippet in the input editor', () => {
    renderPage(<Playground />);

    expect(screen.getByRole('heading', { name: 'Playground' })).toBeInTheDocument();
    const [input] = screen.getAllByLabelText('code editor hyperlambda');
    expect((input as HTMLTextAreaElement).value).toContain('data.connect:magic');
  });

  it('runs the code and unwraps a returned lambda', async () => {
    vi.mocked(api.evaluate).mockResolvedValue('{"result":"log.info:done\\n"}');
    renderPage(<Playground />);

    await userEvent.click(screen.getByRole('button', { name: '▷ Run' }));

    await waitFor(() =>
      expect(screen.getAllByLabelText('code editor hyperlambda')[1]).toHaveValue('log.info:done\n'),
    );
    expect(vi.mocked(api.evaluate).mock.calls[0][0]).toContain('data.connect:magic');
  });

  it('shows anything else the code returned as JSON', async () => {
    vi.mocked(api.evaluate).mockResolvedValue('[{"id":1}]');
    renderPage(<Playground />);

    await userEvent.click(screen.getByRole('button', { name: '▷ Run' }));

    expect(await screen.findByLabelText('code editor application/json')).toHaveValue('[{"id":1}]');
  });

  it('loads a snippet into the editor', async () => {
    // Nothing unsaved, so no confirmation stands in the way.
    sessionStorage.setItem('magic2.playground.code', JSON.stringify('x'));
    sessionStorage.setItem('magic2.playground.saved', JSON.stringify('x'));
    renderPage(<Playground />);

    await userEvent.click(screen.getByRole('button', { name: /Load snippet/ }));
    await userEvent.click(await screen.findByRole('option', { name: 'hello.hl' }));

    await waitFor(() => expect(api.loadFile).toHaveBeenCalledWith('/etc/snippets/hello.hl'));
    await waitFor(() =>
      expect(screen.getAllByLabelText('code editor hyperlambda')[0]).toHaveValue('log.info:hello'),
    );
  });

  it('saves the editor as a named snippet', async () => {
    renderPage(<Playground />);

    await userEvent.click(screen.getByRole('button', { name: 'Save snippet' }));
    await userEvent.type(screen.getByLabelText('Snippet name'), 'mine');
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() =>
      expect(api.saveFile).toHaveBeenCalledWith(
        '/etc/snippets/mine.hl',
        expect.stringContaining('data.connect:magic'),
      ),
    );
  });
});

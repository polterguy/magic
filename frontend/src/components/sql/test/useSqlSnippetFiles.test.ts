// @vitest-environment jsdom
/*
 * useSqlSnippetFiles: lists, loads and saves snippet files, asks before discarding unsaved
 * work, and imports a .sql file into the buffer.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { showToast } from '../../../lib/toast';
import { useSqlSnippetFiles } from '../hooks/useSqlSnippetFiles';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

vi.mock('../../../lib/toast', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  showToast: vi.fn(),
}));

const dialog = vi.hoisted(() => ({ confirm: vi.fn(), prompt: vi.fn() }));

vi.mock('../../../lib/useDialog', () => ({ useDialog: () => dialog }));

const setSql = vi.fn();
const setSavedSql = vi.fn();
const bumpSqlEditId = vi.fn();
const setWaiting = vi.fn();

const A = '/etc/sqlite/templates/a.sql';

function setup(sql = 'same', savedSql = 'same') {
  return renderHook(() =>
    useSqlSnippetFiles({
      type: 'sqlite',
      sql,
      savedSql,
      setSql,
      setSavedSql,
      bumpSqlEditId,
      setWaiting,
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  dialog.confirm.mockResolvedValue(true);
  dialog.prompt.mockResolvedValue('mine');
  vi.mocked(api.listFiles).mockResolvedValue([A, '/etc/sqlite/templates/readme.txt']);
  vi.mocked(api.loadFile).mockResolvedValue('select 1');
  vi.mocked(api.saveFile).mockResolvedValue(undefined as never);
});

describe('useSqlSnippetFiles', () => {
  it('lists the .sql snippets of the database type', async () => {
    const { result } = setup();

    await waitFor(() => expect(result.current.snippets).toEqual([A]));
    expect(api.listFiles).toHaveBeenCalledWith('/etc/sqlite/templates/');
  });

  it('ignores an empty choice', async () => {
    const { result } = setup();

    await act(() => result.current.openSnippet(''));

    expect(api.loadFile).not.toHaveBeenCalled();
  });

  it('loads a snippet straight into the buffer when nothing is unsaved', async () => {
    const { result } = setup();

    await act(() => result.current.openSnippet(A));

    expect(dialog.confirm).not.toHaveBeenCalled();
    expect(setSql).toHaveBeenCalledWith('select 1');
    expect(setSavedSql).toHaveBeenCalledWith('select 1');
    expect(bumpSqlEditId).toHaveBeenCalled();
    expect(result.current.selectedSnippet).toBe(A);
    expect(setWaiting.mock.calls).toEqual([[true], [false]]);
  });

  it('asks before replacing unsaved work and stops when declined', async () => {
    dialog.confirm.mockResolvedValue(false);
    const { result } = setup('edited', 'saved');

    await act(() => result.current.openSnippet(A));

    expect(dialog.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Discard unsaved changes?',
        message: 'Your SQL has unsaved changes. Loading a.sql replaces them.',
      }),
    );
    expect(api.loadFile).not.toHaveBeenCalled();
    expect(setSql).not.toHaveBeenCalled();
    expect(result.current.selectedSnippet).toBe('');
  });

  it('loads over unsaved work once the discard is confirmed', async () => {
    const { result } = setup('edited', 'saved');

    await act(() => result.current.openSnippet(A));

    expect(setSql).toHaveBeenCalledWith('select 1');
  });

  it('reports a snippet that cannot be loaded', async () => {
    vi.mocked(api.loadFile).mockRejectedValue(new Error('gone'));
    const { result } = setup();

    await act(() => result.current.openSnippet(A));

    expect(showToast).toHaveBeenCalledWith('gone', true, undefined);
    expect(setSql).not.toHaveBeenCalled();
    expect(setWaiting.mock.calls).toEqual([[true], [false]]);
  });

  it('suggests the loaded snippet name and saves under the typed one', async () => {
    const { result } = setup('select 9', 'select 1');
    await waitFor(() => expect(result.current.snippets).toEqual([A]));
    await act(() => result.current.openSnippet(A));
    dialog.confirm.mockClear();

    await act(() => result.current.saveSnippet());

    expect(dialog.prompt).toHaveBeenCalledWith({
      title: 'Save SQL snippet',
      label: 'Snippet name',
      initial: 'a',
    });
    expect(api.saveFile).toHaveBeenCalledWith('/etc/sqlite/templates/mine.sql', 'select 9');
    expect(setSavedSql).toHaveBeenLastCalledWith('select 9');
    expect(result.current.selectedSnippet).toBe('/etc/sqlite/templates/mine.sql');
    expect(showToast).toHaveBeenCalledWith('Saved /etc/sqlite/templates/mine.sql');
  });

  it('adds a new snippet to the list in name order', async () => {
    dialog.prompt.mockResolvedValue('0first');
    const { result } = setup();
    await waitFor(() => expect(result.current.snippets).toEqual([A]));

    await act(() => result.current.saveSnippet());

    expect(result.current.snippets).toEqual(['/etc/sqlite/templates/0first.sql', A]);
  });

  it('does not list a snippet twice when overwriting it', async () => {
    dialog.prompt.mockResolvedValue('a');
    const { result } = setup();
    await waitFor(() => expect(result.current.snippets).toEqual([A]));

    await act(() => result.current.saveSnippet());

    expect(result.current.snippets).toEqual([A]);
  });

  it('saves nothing when the name prompt is cancelled', async () => {
    dialog.prompt.mockResolvedValue(null);
    const { result } = setup();

    await act(() => result.current.saveSnippet());

    expect(api.saveFile).not.toHaveBeenCalled();
    expect(setWaiting).not.toHaveBeenCalled();
  });

  it('reports a failed save and keeps the unsaved marker', async () => {
    vi.mocked(api.saveFile).mockRejectedValue(new Error('read only'));
    const { result } = setup('select 9', 'select 1');

    await act(() => result.current.saveSnippet());

    expect(showToast).toHaveBeenCalledWith('read only', true, undefined);
    expect(setSavedSql).not.toHaveBeenCalled();
    expect(setWaiting.mock.calls).toEqual([[true], [false]]);
  });

  it('imports a .sql file into the buffer', async () => {
    const { result } = setup();

    act(() => result.current.importSqlFile(new File(['select 5'], 'q.sql')));

    await waitFor(() => expect(setSql).toHaveBeenCalledWith('select 5'));
    expect(bumpSqlEditId).toHaveBeenCalled();
  });
});

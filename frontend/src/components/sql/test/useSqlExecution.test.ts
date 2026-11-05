// @vitest-environment jsdom
/*
 * useSqlExecution: runs the buffer, or only the selected fragment, records it in the history
 * and holds the result sets of the last run.
 */
import type { EditorView } from '@codemirror/view';
import { act, renderHook } from '@testing-library/react';
import type { RefObject } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { showToast } from '../../../lib/toast';
import { useSqlExecution } from '../hooks/useSqlExecution';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

vi.mock('../../../lib/toast', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  showToast: vi.fn(),
}));

const pushHistory = vi.fn();

// An editor holding "select 1; select 2" with the characters from..to selected.
function editorWith(from: number, to: number) {
  const doc = 'select 1; select 2';
  return {
    current: {
      state: {
        selection: { main: { from, to } },
        sliceDoc: (a: number, b: number) => doc.slice(a, b),
      },
    },
  } as unknown as RefObject<EditorView | null>;
}

function setup(sql: string, editorRef: RefObject<EditorView | null>, type = 'sqlite') {
  return renderHook(() =>
    useSqlExecution({
      type,
      connectionString: 'generic',
      database: 'shop',
      sql,
      editorRef,
      pushHistory,
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.executeSql).mockResolvedValue([[{ a: 1 }, { a: 2 }]] as never);
});

describe('useSqlExecution', () => {
  it('refuses to run an empty buffer', async () => {
    const { result } = setup('  ', { current: null });

    await act(() => result.current.execute());

    expect(showToast).toHaveBeenCalledWith('Write some SQL first', true);
    expect(api.executeSql).not.toHaveBeenCalled();
    expect(pushHistory).not.toHaveBeenCalled();
  });

  it('runs the whole buffer in safe mode and reports the record count', async () => {
    const { result } = setup('select 1', { current: null });

    await act(() => result.current.execute());

    expect(pushHistory).toHaveBeenCalledWith('select 1');
    expect(api.executeSql).toHaveBeenCalledWith(
      'sqlite',
      '[generic|shop]',
      'select 1',
      true,
      false,
    );
    expect(result.current.result).toEqual([[{ a: 1 }, { a: 2 }]]);
    expect(showToast).toHaveBeenCalledWith('2 records returned');
    expect(result.current.busy).toBe(false);
  });

  it('runs only the selected fragment when there is a selection', async () => {
    const { result } = setup('select 1; select 2', editorWith(10, 18));

    await act(() => result.current.execute());

    expect(pushHistory).toHaveBeenCalledWith('select 2');
    expect(vi.mocked(api.executeSql).mock.calls[0][2]).toBe('select 2');
  });

  it('passes the safe mode switch along', async () => {
    const { result } = setup('delete from t', { current: null });
    act(() => result.current.setSafeMode(false));

    await act(() => result.current.execute());

    expect(vi.mocked(api.executeSql).mock.calls[0][3]).toBe(false);
  });

  it('runs a GO-separated script as a batch on mssql only', async () => {
    const script = 'select 1\nGO\nselect 2';
    const mssql = setup(script, { current: null }, 'mssql');
    await act(() => mssql.result.current.execute());
    expect(vi.mocked(api.executeSql).mock.calls[0][4]).toBe(true);

    vi.mocked(api.executeSql).mockClear();
    const sqlite = setup(script, { current: null }, 'sqlite');
    await act(() => sqlite.result.current.execute());
    expect(vi.mocked(api.executeSql).mock.calls[0][4]).toBe(false);
  });

  it('says so when a statement returns no result at all', async () => {
    vi.mocked(api.executeSql).mockResolvedValue(null as never);
    const { result } = setup('create table t(a int)', { current: null });

    await act(() => result.current.execute());

    expect(result.current.result).toEqual([]);
    expect(showToast).toHaveBeenCalledWith('SQL executed successfully, no result');
  });

  it('warns when safe mode capped the result at 200 records', async () => {
    vi.mocked(api.executeSql).mockResolvedValue([Array.from({ length: 200 }, () => ({}))] as never);
    const { result } = setup('select * from t', { current: null });

    await act(() => result.current.execute());

    expect(showToast).toHaveBeenCalledWith(
      'First 200 records returned. Turn off safe mode to return all records.',
    );
  });

  it('clears the previous result and shows the error when the run fails', async () => {
    const { result } = setup('select 1', { current: null });
    await act(() => result.current.execute());
    expect(result.current.result).not.toBeNull();

    vi.mocked(api.executeSql).mockRejectedValue(new Error('syntax error'));
    await act(() => result.current.execute());

    expect(showToast).toHaveBeenCalledWith('syntax error', true, undefined);
    expect(result.current.result).toBeNull();
    expect(result.current.busy).toBe(false);
    // The failed statement is still in the history.
    expect(pushHistory).toHaveBeenCalledTimes(2);
  });
});

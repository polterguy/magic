// @vitest-environment jsdom
/*
 * useSearchTab: loads the types and roles, works out how the endpoint will really search, and
 * generates the search endpoint.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { showToast } from '../../../lib/toast';
import { useSearchTab } from '../hooks/useSearchTab';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

vi.mock('../../../lib/toast', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  showToast: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.mlTypes).mockResolvedValue([
    { type: 'docs', retrieval: 'keywords' },
    { type: 'faq' },
  ] as never);
  vi.mocked(api.listRoles).mockResolvedValue([{ name: 'root' }] as never);
  vi.mocked(api.generateSearchEndpoint).mockResolvedValue({
    hyperlambda: 'hl',
    file: '/modules/m/search.get.hl',
  } as never);
});

describe('useSearchTab', () => {
  it('loads the types and the roles', async () => {
    const { result } = renderHook(() => useSearchTab());

    await waitFor(() => expect(result.current.types).toHaveLength(2));
    expect(result.current.roles).toEqual(['root']);
  });

  it('tells the user when the types cannot be loaded', async () => {
    vi.mocked(api.mlTypes).mockRejectedValue(new Error('down'));
    renderHook(() => useSearchTab());

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith('Could not load machine learning types', true),
    );
  });

  it('treats a missing type list as empty', async () => {
    vi.mocked(api.mlTypes).mockResolvedValue(undefined as never);
    vi.mocked(api.listRoles).mockResolvedValue(undefined as never);
    const { result } = renderHook(() => useSearchTab());

    await waitFor(() => expect(api.mlTypes).toHaveBeenCalled());
    expect(result.current.types).toEqual([]);
    expect(result.current.roles).toEqual([]);
  });

  it('works out the effective retrieval from the override, the type and the default', async () => {
    const { result } = renderHook(() => useSearchTab());
    await waitFor(() => expect(result.current.types).toHaveLength(2));

    expect(result.current.effective).toBe('embeddings');

    act(() => result.current.setType('docs'));
    expect(result.current.effective).toBe('keywords');

    act(() => result.current.setType('faq'));
    expect(result.current.effective).toBe('embeddings');

    act(() => result.current.setRetrieval('hybrid'));
    expect(result.current.effective).toBe('hybrid');
  });

  it('sends the numbers parsed, with fallbacks for blank ones', async () => {
    const { result } = renderHook(() => useSearchTab());
    act(() => {
      result.current.setModuleName('mod');
      result.current.setType('docs');
      result.current.setAuth(['root']);
      result.current.setLimit('');
      result.current.setThreshold('  0.5 ');
      result.current.setUri(' u ');
      result.current.setMeta(' m ');
      result.current.setRateLimit('abc');
      result.current.setRateWindow('');
      result.current.setCacheSeconds('30');
    });

    await act(() => result.current.generate());

    expect(api.generateSearchEndpoint).toHaveBeenCalledWith({
      moduleName: 'mod',
      endpointName: 'search',
      verb: 'get',
      type: 'docs',
      retrieval: '',
      threshold: 0.5,
      limit: 5,
      uri: 'u',
      meta: 'm',
      result: 'references',
      authorization: 'root',
      rateLimit: 0,
      rateWindow: 60,
      cacheSeconds: 30,
      overwrite: false,
    });
  });

  it('leaves the threshold out when blank and shows the generated endpoint', async () => {
    const { result } = renderHook(() => useSearchTab());
    act(() => result.current.setModuleName('mod'));

    await act(() => result.current.generate());

    expect(vi.mocked(api.generateSearchEndpoint).mock.calls[0][0].threshold).toBeUndefined();
    expect(result.current.preview).toBe('hl');
    expect(result.current.generated).toEqual({
      path: 'magic/modules/mod/search',
      file: '/modules/m/search.get.hl',
      verb: 'get',
    });
    expect(showToast).toHaveBeenCalledWith('Endpoint magic/modules/mod/search created');
    expect(result.current.busy).toBe(false);
  });

  it('reports a failed generation as an error toast', async () => {
    vi.mocked(api.generateSearchEndpoint).mockRejectedValue(new Error('nope'));
    const { result } = renderHook(() => useSearchTab());

    await act(() => result.current.generate());

    expect(showToast).toHaveBeenCalledWith('nope', true, undefined);
    expect(result.current.generated).toBeNull();
    expect(result.current.busy).toBe(false);
  });
});

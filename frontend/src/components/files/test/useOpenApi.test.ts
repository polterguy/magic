// @vitest-environment jsdom
/*
 * useOpenApi: fetches the specification for a target, formats it as indented JSON, and holds
 * the waiter on while the request is in flight.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { useOpenApi } from '../hooks/useOpenApi';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

const toasts: Toast[] = [];

beforeEach(() => {
  toasts.length = 0;
  setToastListener(toast => toasts.push(toast));
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

describe('useOpenApi', () => {
  it('stores the pretty-printed spec with its target', async () => {
    vi.mocked(api.getOpenApiSpec).mockResolvedValue({ openapi: '3.0.0' });
    const setWaiting = vi.fn();
    const { result } = renderHook(() => useOpenApi(setWaiting));
    expect(result.current.openApiSpec).toBeNull();

    await act(() => result.current.showOpenApi('/modules/app/'));

    expect(api.getOpenApiSpec).toHaveBeenCalledWith('/modules/app/');
    expect(result.current.openApiSpec).toEqual({
      json: JSON.stringify({ openapi: '3.0.0' }, null, 2),
      target: '/modules/app/',
    });
    expect(setWaiting.mock.calls).toEqual([[true], [false]]);
  });

  it('can be dismissed by clearing the spec', async () => {
    vi.mocked(api.getOpenApiSpec).mockResolvedValue({});
    const { result } = renderHook(() => useOpenApi(vi.fn()));
    await act(() => result.current.showOpenApi('/x.get.hl'));
    act(() => result.current.setOpenApiSpec(null));
    expect(result.current.openApiSpec).toBeNull();
  });

  it('reports a failure and still releases the waiter', async () => {
    vi.mocked(api.getOpenApiSpec).mockRejectedValue(new Error('no spec'));
    const setWaiting = vi.fn();
    const { result } = renderHook(() => useOpenApi(setWaiting));

    await act(() => result.current.showOpenApi('/x.get.hl'));

    expect(result.current.openApiSpec).toBeNull();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ text: 'no spec', isError: true });
    expect(setWaiting).toHaveBeenLastCalledWith(false);
  });
});

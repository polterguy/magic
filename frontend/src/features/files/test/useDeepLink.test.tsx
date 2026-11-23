// @vitest-environment jsdom
/*
 * useDeepLink: "?open=" opens the file once, clears the parameter, and expands the folders
 * above the file.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { type ReactNode, useState } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { useDeepLink } from '../hooks/useDeepLink';

function setup(url: string) {
  const openFile = vi.fn().mockResolvedValue(undefined);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
  );
  const hook = renderHook(
    () => {
      const [expanded, setExpanded] = useState<Set<string>>(new Set(['/etc/']));
      useDeepLink(openFile, setExpanded);
      return { expanded, search: useLocation().search };
    },
    { wrapper },
  );
  return { openFile, ...hook };
}

describe('useDeepLink', () => {
  it('does nothing without an open parameter', () => {
    const { openFile, result } = setup('/files');
    expect(openFile).not.toHaveBeenCalled();
    expect([...result.current.expanded]).toEqual(['/etc/']);
  });

  it('opens the linked file, clears the parameter and expands its ancestors', async () => {
    const { openFile, result } = setup('/files?open=/modules/app/x.get.hl');
    await waitFor(() => expect(openFile).toHaveBeenCalledWith('/modules/app/x.get.hl'));
    await waitFor(() => expect(result.current.search).toBe(''));
    expect(openFile).toHaveBeenCalledTimes(1);
    expect(result.current.expanded).toEqual(new Set(['/etc/', '/modules/', '/modules/app/']));
  });

  it('keeps the folders that were already expanded', async () => {
    const { result } = setup('/files?open=/etc/www/index.html');
    await waitFor(() => expect(result.current.search).toBe(''));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.expanded).toEqual(new Set(['/etc/', '/etc/www/']));
  });
});

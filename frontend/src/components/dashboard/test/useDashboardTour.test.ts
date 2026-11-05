// @vitest-environment jsdom
/*
 * useDashboardTour: the tour offers itself once per backend when the flags it depends on have
 * resolved, only a completed tour is remembered, and the command palette can re-run it.
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { canRunDashboardTour, runDashboardTour } from '../../../lib/shellActions';
import { useDashboardTour } from '../hooks/useDashboardTour';

const BACKEND = 'https://cloud.test';
const KEY = 'magic2.tourSeen.' + BACKEND;

beforeEach(() => {
  localStorage.clear();
});

type Args = Parameters<typeof useDashboardTour>;
const ready: Args = [BACKEND, false, true, true];

describe('automatic offer', () => {
  it('starts the dashboard tour when everything is resolved and it was never seen', () => {
    const { result } = renderHook(() => useDashboardTour(...ready));
    expect(result.current.tour).toBe('dashboard');
  });

  it.each([
    ['there is no backend', [undefined, false, true, true]],
    ['the set-password dialog is up', [BACKEND, true, true, true]],
    ['the OpenAI flag is still unknown', [BACKEND, false, null, true]],
    ['the root-served flag is still unknown', [BACKEND, false, true, null]],
  ] as [string, Args][])('waits while %s', (_, args) => {
    const { result } = renderHook(() => useDashboardTour(...args));
    expect(result.current.tour).toBeNull();
  });

  it('starts once the flags resolve', () => {
    const { result, rerender } = renderHook((args: Args) => useDashboardTour(...args), {
      initialProps: [BACKEND, false, null, null] as Args,
    });
    expect(result.current.tour).toBeNull();
    rerender(ready);
    expect(result.current.tour).toBe('dashboard');
  });

  it('does not start for a backend whose tour was already completed', () => {
    localStorage.setItem(KEY, '1');
    const { result } = renderHook(() => useDashboardTour(...ready));
    expect(result.current.tour).toBeNull();
  });

  it('is offered per backend', () => {
    localStorage.setItem(KEY, '1');
    const { result } = renderHook(() => useDashboardTour('https://other.test', false, true, true));
    expect(result.current.tour).toBe('dashboard');
  });

  it('does not restart under the reader when the flags change mid-tour', () => {
    const { result, rerender } = renderHook((args: Args) => useDashboardTour(...args), {
      initialProps: ready,
    });
    act(() => result.current.closeTour(false));
    rerender([BACKEND, false, false, true]);
    expect(result.current.tour).toBeNull();
  });
});

describe('closing', () => {
  it('remembers a tour that was seen through', () => {
    const { result } = renderHook(() => useDashboardTour(...ready));
    act(() => result.current.closeTour(true));
    expect(result.current.tour).toBeNull();
    expect(localStorage.getItem(KEY)).toBe('1');
  });

  it('does not remember a tour that was escaped', () => {
    const { result } = renderHook(() => useDashboardTour(...ready));
    act(() => result.current.closeTour(false));
    expect(result.current.tour).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});

describe('re-running', () => {
  it('registers a runner the command palette can call, and removes it on unmount', () => {
    localStorage.setItem(KEY, '1');
    const { result, unmount } = renderHook(() => useDashboardTour(...ready));
    expect(canRunDashboardTour()).toBe(true);
    expect(result.current.tour).toBeNull();
    act(() => runDashboardTour());
    expect(result.current.tour).toBe('dashboard');
    unmount();
    expect(canRunDashboardTour()).toBe(false);
  });

  it('can switch to the chatbot tour', () => {
    const { result } = renderHook(() => useDashboardTour(...ready));
    act(() => result.current.setTour('chatbot'));
    expect(result.current.tour).toBe('chatbot');
  });
});

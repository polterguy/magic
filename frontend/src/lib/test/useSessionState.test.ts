// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useSessionState } from '../useSessionState';

afterEach(() => {
  sessionStorage.clear();
});

describe('useSessionState', () => {
  it('starts from the initial value and mirrors it into sessionStorage', () => {
    const { result } = renderHook(() => useSessionState('draft', { text: 'hi' }));
    expect(result.current[0]).toEqual({ text: 'hi' });
    expect(sessionStorage.getItem('draft')).toBe('{"text":"hi"}');
  });

  it('restores a stored value over the initial one', () => {
    sessionStorage.setItem('draft', '["a","b"]');
    const { result } = renderHook(() => useSessionState<string[]>('draft', []));
    expect(result.current[0]).toEqual(['a', 'b']);
  });

  it('falls back to the initial value when the stored one is not JSON', () => {
    sessionStorage.setItem('draft', '{broken');
    const { result } = renderHook(() => useSessionState('draft', 'fresh'));
    expect(result.current[0]).toBe('fresh');
    expect(sessionStorage.getItem('draft')).toBe('"fresh"');
  });

  it('writes updates through, including functional ones', () => {
    const { result } = renderHook(() => useSessionState('count', 1));
    act(() => result.current[1](5));
    expect(sessionStorage.getItem('count')).toBe('5');
    act(() => result.current[1](n => n + 1));
    expect(result.current[0]).toBe(6);
    expect(sessionStorage.getItem('count')).toBe('6');
  });

  it('survives an unmount and remount', () => {
    const first = renderHook(() => useSessionState('sql', ''));
    act(() => first.result.current[1]('select 1'));
    first.unmount();
    const second = renderHook(() => useSessionState('sql', ''));
    expect(second.result.current[0]).toBe('select 1');
  });

  it('keeps separate keys apart', () => {
    const a = renderHook(() => useSessionState('a', 'x'));
    renderHook(() => useSessionState('b', 'y'));
    act(() => a.result.current[1]('changed'));
    expect(sessionStorage.getItem('a')).toBe('"changed"');
    expect(sessionStorage.getItem('b')).toBe('"y"');
  });
});

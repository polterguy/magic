import { afterEach, describe, expect, it, vi } from 'vitest';

import { copyToClipboard, setToastListener, showToast, type Toast } from '../toast';

afterEach(() => {
  setToastListener(null);
  vi.unstubAllGlobals();
});

describe('showToast', () => {
  it('hands each toast to the listener with a fresh id', () => {
    const toasts: Toast[] = [];
    setToastListener(toast => toasts.push(toast));
    showToast('Saved');
    showToast('Failed', true, 9);
    expect(toasts).toEqual([
      { id: expect.any(Number) as number, text: 'Saved', isError: false, logId: undefined },
      { id: expect.any(Number) as number, text: 'Failed', isError: true, logId: 9 },
    ]);
    expect(toasts[1].id).toBeGreaterThan(toasts[0].id);
  });

  it('is a no-op without a listener', () => {
    expect(() => showToast('Nobody listens')).not.toThrow();
  });

  it('stops reaching a listener once it is cleared', () => {
    const listener = vi.fn();
    setToastListener(listener);
    setToastListener(null);
    showToast('Gone');
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('copyToClipboard', () => {
  it('writes the text and confirms with a toast', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const listener = vi.fn();
    setToastListener(listener);
    await copyToClipboard('secret', 'Token');
    expect(writeText).toHaveBeenCalledWith('secret');
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Token can be found on your clipboard', isError: false }),
    );
  });

  it('defaults the noun to Text', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: () => Promise.resolve() } });
    const listener = vi.fn();
    setToastListener(listener);
    await copyToClipboard('x');
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Text can be found on your clipboard' }),
    );
  });

  it('shows an error toast when the clipboard refuses', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: () => Promise.reject(new Error('denied')) },
    });
    const listener = vi.fn();
    setToastListener(listener);
    await copyToClipboard('x');
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Your browser would not let us access the clipboard',
        isError: true,
      }),
    );
  });
});

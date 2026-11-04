// @vitest-environment jsdom
import { renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { DialogProvider } from '../../components/Dialogs';
import { getNavGuard, setNavGuard, useUnsavedGuard } from '../navGuard';

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <DialogProvider>{children}</DialogProvider>;
}

function renderGuard(dirty: boolean) {
  return renderHook(({ dirty }) => useUnsavedGuard(dirty, 'You have unsaved edits'), {
    wrapper,
    initialProps: { dirty },
  });
}

function fireBeforeUnload() {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

afterEach(() => {
  setNavGuard(null);
});

describe('setNavGuard', () => {
  it('stores and clears the guard', () => {
    const guard = () => Promise.resolve(true);
    setNavGuard(guard);
    expect(getNavGuard()).toBe(guard);
    setNavGuard(null);
    expect(getNavGuard()).toBeNull();
  });
});

describe('useUnsavedGuard', () => {
  it('installs no guard while clean', () => {
    renderGuard(false);
    expect(getNavGuard()).toBeNull();
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });

  it('asks to discard while dirty, resolving with the answer', async () => {
    renderGuard(true);
    const guard = getNavGuard();
    expect(guard).not.toBeNull();

    let answer = guard!();
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Discard unsaved changes?');
    expect(dialog).toHaveTextContent('You have unsaved edits');
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
    await expect(answer).resolves.toBe(true);

    answer = guard!();
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await expect(answer).resolves.toBe(false);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('blocks browser unload while dirty', () => {
    renderGuard(true);
    expect(fireBeforeUnload().defaultPrevented).toBe(true);
  });

  it('removes the guard and unload block once clean again', () => {
    const { rerender } = renderGuard(true);
    rerender({ dirty: false });
    expect(getNavGuard()).toBeNull();
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });

  it('removes the guard and unload block on unmount', () => {
    const { unmount } = renderGuard(true);
    unmount();
    expect(getNavGuard()).toBeNull();
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });
});

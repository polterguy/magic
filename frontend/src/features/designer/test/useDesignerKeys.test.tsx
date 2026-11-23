// @vitest-environment jsdom
/*
 * The designer's keyboard: delete and escape, the ctrl/cmd shortcuts (copy, cut, paste, undo,
 * redo, lower case s to save), and never stealing a key from a field being typed into.
 */
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDesignerKeys } from '../hooks/useDesignerKeys';

function setup() {
  const handlers = {
    setSelected: vi.fn(),
    remove: vi.fn(),
    copy: vi.fn(),
    cut: vi.fn(),
    paste: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    save: vi.fn().mockResolvedValue(true),
  };
  const rig = renderHook(() => useDesignerKeys(handlers));
  return { handlers, rig };
}

// Dispatched on the element, bubbling up to the window listener the way a real key does.
function press(init: KeyboardEventInit, from: Element = document.body) {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  from.dispatchEvent(event);
  return event;
}

let field: HTMLElement;

beforeEach(() => {
  field = document.createElement('div');
  document.body.append(field);
});

afterEach(() => {
  field.remove();
});

describe('useDesignerKeys plain keys', () => {
  it('Delete and Backspace remove the selection and are consumed', () => {
    const { handlers } = setup();
    expect(press({ key: 'Delete' }).defaultPrevented).toBe(true);
    press({ key: 'Backspace' });
    expect(handlers.remove).toHaveBeenCalledTimes(2);
  });

  it('Escape clears the selection', () => {
    const { handlers } = setup();
    press({ key: 'Escape' });
    expect(handlers.setSelected).toHaveBeenCalledWith(null);
  });

  it('ignores unrelated keys', () => {
    const { handlers } = setup();
    press({ key: 'a' });
    press({ key: 'c' });
    expect(handlers.copy).not.toHaveBeenCalled();
    expect(handlers.remove).not.toHaveBeenCalled();
  });
});

describe('useDesignerKeys shortcuts', () => {
  it.each([
    ['c', 'copy'],
    ['x', 'cut'],
    ['v', 'paste'],
    ['z', 'undo'],
  ] as const)('ctrl+%s calls %s', (key, name) => {
    const { handlers } = setup();
    const event = press({ key, ctrlKey: true });
    expect(handlers[name]).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('cmd works like ctrl', () => {
    const { handlers } = setup();
    press({ key: 'c', metaKey: true });
    expect(handlers.copy).toHaveBeenCalledTimes(1);
  });

  it('shift+z is redo, not undo', () => {
    const { handlers } = setup();
    press({ key: 'Z', ctrlKey: true, shiftKey: true });
    expect(handlers.redo).toHaveBeenCalledTimes(1);
    expect(handlers.undo).not.toHaveBeenCalled();
  });

  it('ctrl+s saves, but only the lower case key', () => {
    const { handlers } = setup();
    const lower = press({ key: 's', ctrlKey: true });
    expect(handlers.save).toHaveBeenCalledTimes(1);
    expect(lower.defaultPrevented).toBe(true);
    press({ key: 'S', ctrlKey: true });
    expect(handlers.save).toHaveBeenCalledTimes(1);
  });

  it('ignores a shortcut letter it has no use for', () => {
    const { handlers } = setup();
    const event = press({ key: 'q', ctrlKey: true });
    expect(event.defaultPrevented).toBe(false);
    expect(Object.values(handlers).some(handler => handler.mock.calls.length > 0)).toBe(false);
  });
});

describe('useDesignerKeys typing', () => {
  it.each(['input', 'textarea', 'select'])('never steals a key from a %s', tag => {
    const { handlers } = setup();
    const element = document.createElement(tag);
    field.append(element);
    const event = press({ key: 'Delete' }, element);
    press({ key: 'c', ctrlKey: true }, element);
    expect(event.defaultPrevented).toBe(false);
    expect(handlers.remove).not.toHaveBeenCalled();
    expect(handlers.copy).not.toHaveBeenCalled();
  });

  it('never steals a key from an editable element', () => {
    const { handlers } = setup();
    Object.defineProperty(field, 'isContentEditable', { value: true });
    press({ key: 'Backspace' }, field);
    expect(handlers.remove).not.toHaveBeenCalled();
  });
});

describe('useDesignerKeys listener', () => {
  it('stops listening when unmounted', () => {
    const { handlers, rig } = setup();
    rig.unmount();
    press({ key: 'Delete' });
    expect(handlers.remove).not.toHaveBeenCalled();
  });

  it('returns the handler so it can be called directly', () => {
    const { handlers, rig } = setup();
    rig.result.current(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(handlers.setSelected).toHaveBeenCalledWith(null);
  });
});

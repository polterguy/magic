import { afterEach, describe, expect, it, vi } from 'vitest';
import { SHORTCUTS, type Shortcut } from '../shortcuts';

// isMac is decided once, when the module loads — so each platform gets a fresh import.
async function loadOn(platform: string) {
  vi.stubGlobal('navigator', { platform });
  vi.resetModules();
  return import('../shortcuts');
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('shortcutDisplay', () => {
  const save: Shortcut = {
    group: 'Editor',
    display: 'Ctrl + S',
    mac: 'Cmd + S',
    description: 'Save',
  };
  const tab: Shortcut = { group: 'Editor', display: 'Tab', description: 'Indent' };

  it.each(['MacIntel', 'iPhone', 'iPad'])('shows the mac combo on %s', async platform => {
    const { isMac, shortcutDisplay } = await loadOn(platform);
    expect(isMac).toBe(true);
    expect(shortcutDisplay(save)).toBe('Cmd + S');
    expect(shortcutDisplay(tab)).toBe('Tab');
  });

  it.each(['Win32', 'Linux x86_64'])('shows the plain combo on %s', async platform => {
    const { isMac, shortcutDisplay } = await loadOn(platform);
    expect(isMac).toBe(false);
    expect(shortcutDisplay(save)).toBe('Ctrl + S');
  });
});

describe('SHORTCUTS', () => {
  it('is unique per group and display, which the overlay keys its rows by', () => {
    const ids = SHORTCUTS.map(s => s.group + s.display);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('binds every editor key to one action only', () => {
    const keys = SHORTCUTS.flatMap(s => s.keys ?? []);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('gives every action a unique id', () => {
    const actions = SHORTCUTS.flatMap(s => (s.action ? [s.action] : []));
    expect(new Set(actions).size).toBe(actions.length);
  });

  it('pairs keys with an action, since the editor skips one without the other', () => {
    for (const shortcut of SHORTCUTS) {
      expect(Boolean(shortcut.keys?.length), shortcut.description).toBe(Boolean(shortcut.action));
    }
  });

  it('spells keys the CodeMirror way, with lowercase single letters', () => {
    for (const key of SHORTCUTS.flatMap(s => s.keys ?? [])) {
      expect(key).not.toMatch(/(^|-)[A-Z]$/);
    }
  });
});

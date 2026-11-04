import { afterEach, describe, expect, it, vi } from 'vitest';

import { type Shortcut, SHORTCUTS } from '../shortcuts';

// isMac is decided once, when the module loads — so each platform gets a fresh import.
async function loadOn(navigator: { userAgent: string; userAgentData?: { platform: string } }) {
  vi.stubGlobal('navigator', navigator);
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

  const mac =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15';
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
  const ipad = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
  const windows = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0';
  const linux = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0';

  it.each([
    ['a Mac user agent', { userAgent: mac }],
    ['an iPhone user agent', { userAgent: iphone }],
    ['an iPad user agent', { userAgent: ipad }],
    ['the macOS client hint', { userAgent: windows, userAgentData: { platform: 'macOS' } }],
  ])('shows the mac combo on %s', async (_, navigator) => {
    const { isMac, shortcutDisplay } = await loadOn(navigator);
    expect(isMac).toBe(true);
    expect(shortcutDisplay(save)).toBe('Cmd + S');
    expect(shortcutDisplay(tab)).toBe('Tab');
  });

  it.each([
    ['a Windows user agent', { userAgent: windows }],
    ['a Linux user agent', { userAgent: linux }],
    ['the Windows client hint', { userAgent: mac, userAgentData: { platform: 'Windows' } }],
  ])('shows the plain combo on %s', async (_, navigator) => {
    const { isMac, shortcutDisplay } = await loadOn(navigator);
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

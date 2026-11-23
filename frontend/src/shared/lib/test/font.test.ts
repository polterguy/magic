// @vitest-environment jsdom
/*
 * The UI font setting: read from localStorage with a silent fallback to the default, and applied
 * as the --app-font variable on <html>.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { applyFont, DEFAULT_FONT, FONTS, getFont, initFont } from '../font';

const appFont = () => document.documentElement.style.getPropertyValue('--app-font');
const family = (id: string) => FONTS.find(font => font.id === id)!.family;

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  document.documentElement.style.removeProperty('--app-font');
});

describe('font', () => {
  it('defaults to the current monospace font when nothing is saved', () => {
    expect(getFont()).toBe(DEFAULT_FONT);
    initFont();
    expect(appFont()).toBe('var(--font-mono)');
  });

  it('applying a font sets the CSS variable and saves it', () => {
    applyFont('inter');
    expect(appFont()).toBe(family('inter'));
    expect(localStorage.getItem('magic2.font')).toBe('inter');
    expect(getFont()).toBe('inter');
  });

  it('applies the saved font on start', () => {
    localStorage.setItem('magic2.font', 'ibm-plex-sans');
    initFont();
    expect(appFont()).toBe(family('ibm-plex-sans'));
  });

  it('falls back to the default for an unknown saved value', () => {
    localStorage.setItem('magic2.font', 'comic-sans');
    expect(getFont()).toBe(DEFAULT_FONT);
    initFont();
    expect(appFont()).toBe('var(--font-mono)');
  });

  it('survives storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getFont()).toBe(DEFAULT_FONT);
    applyFont('roboto');
    expect(appFont()).toBe(family('roboto'));
  });
});

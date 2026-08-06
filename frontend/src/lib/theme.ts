/*
 * Light/dark theme switch. Dark is the default (no data-theme attribute);
 * light mode is styles.css's html[data-theme="light"] override block.
 * Applied in main.tsx before the first render, so the page never flashes
 * the wrong theme.
 */

const THEME_KEY = 'magic2.theme';

export type Theme = 'dark' | 'light';

export function getTheme(): Theme {
  return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
}

export function initTheme() {
  document.documentElement.dataset.theme = getTheme();
}

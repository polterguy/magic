/*
 * Light/dark theme switch. Light is the default; it is styles.css's
 * html[data-theme="light"] override block, while the bare :root variables are
 * the dark palette. Applied in main.tsx before the first render, and index.html
 * carries data-theme="light" so the first paint is already light rather than
 * flashing the dark base while the module script loads.
 */

const THEME_KEY = 'magic2.theme';

export type Theme = 'dark' | 'light';

export function getTheme(): Theme {
  return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
}

export function initTheme() {
  document.documentElement.dataset.theme = getTheme();
}

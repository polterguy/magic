/*
 * The dashboard's UI font, chosen on the Profile page. It mirrors theme.ts: kept in localStorage,
 * applied in main.tsx before the first render, and written onto <html> when it changes. The choice
 * lands in the --app-font CSS variable, which body and the UI controls read. Code views keep
 * --font-mono whatever is picked. The web fonts are self-hosted through @fontsource (imported in
 * main.tsx), so a self-hosted cloudlet does not depend on a font CDN.
 */

const FONT_KEY = 'magic2.font';

/*
 * The fonts on offer, in the order the picker lists them. Default is the app's own monospace, so
 * nobody's dashboard changes until they pick something else. Each stack names the self-hosted
 * variable font first, then an installed copy, then the system UI font.
 */
export const FONTS = [
  { id: 'default', label: 'Default (monospace)', family: 'var(--font-mono)' },
  { id: 'inter', label: 'Inter', family: "'Inter Variable', Inter, system-ui, sans-serif" },
  { id: 'roboto', label: 'Roboto', family: "'Roboto Variable', Roboto, system-ui, sans-serif" },
  {
    id: 'ibm-plex-sans',
    label: 'IBM Plex Sans',
    family: "'IBM Plex Sans Variable', 'IBM Plex Sans', system-ui, sans-serif",
  },
  {
    id: 'system',
    label: 'System',
    family: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
] as const;

export type FontId = (typeof FONTS)[number]['id'];

export const DEFAULT_FONT: FontId = 'default';

function findFont(id: string | null) {
  return FONTS.find(font => font.id === id);
}

// The saved font, or the default when nothing is saved, the value is unknown, or storage is blocked.
export function getFont(): FontId {
  try {
    return findFont(localStorage.getItem(FONT_KEY))?.id ?? DEFAULT_FONT;
  } catch {
    return DEFAULT_FONT;
  }
}

function setFontVariable(id: FontId) {
  const family = (findFont(id) ?? FONTS[0]).family;
  document.documentElement.style.setProperty('--app-font', family);
}

export function applyFont(id: FontId) {
  try {
    localStorage.setItem(FONT_KEY, id);
  } catch {
    // Storage is blocked or full. The font still applies for this session.
  }
  setFontVariable(id);
}

export function initFont() {
  setFontVariable(getFont());
}

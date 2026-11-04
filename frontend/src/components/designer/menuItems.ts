/*
 * The items of the Web Designer's "more" menu, built from its current state.
 */

import { canonicalUrl, companionFile, WEB_ROOT } from './designerFiles';
import { VIEWPORTS } from './layout';
import type { MenuItem } from './Menu';

// What the menu is built from.
export interface DesignerMenuOptions {
  viewport: string;
  setViewport: (id: string) => void;
  setCreating: (creating: boolean) => void;
  origin: string;
  path: string;
  busy: boolean;
  scripts: string[];
  sheets: string[];
  openPage: (file: string) => void;
  addCompanionFile: (kind: 'js' | 'css') => void;
  reveal: boolean;
  setReveal: (reveal: boolean) => void;
  view: string;
}

// The items of the menu holding the viewport, the page and the canvas.
export function designerMenuItems(o: DesignerMenuOptions): MenuItem[] {
  const {
    viewport,
    setViewport,
    setCreating,
    origin,
    path,
    busy,
    scripts,
    sheets,
    openPage,
    addCompanionFile,
    reveal,
    setReveal,
    view,
  } = o;
  return [
    { heading: 'Width' },
    ...VIEWPORTS.map(entry => ({
      label: entry.label + (entry.width ? '  ' + entry.width + 'px' : ''),
      checked: entry.id === viewport,
      onClick: () => setViewport(entry.id),
    })),
    { heading: 'Page' },
    {
      label: 'New page…',
      hint: 'Create another page under /etc/www/ and open it',
      onClick: () => setCreating(true),
    },
    {
      label: 'Open in a new tab',
      hint: 'The page as a visitor gets it, served from ' + origin,
      disabled: !path,
      /*
       * The saved page, not the canvas — it is a real request to the
       * cloudlet, so unsaved work is not in it.
       */
      onClick: () => window.open(origin + canonicalUrl(path), '_blank', 'noopener'),
    },
    {
      label: 'Reload from the server',
      hint: 'Throw away what is here and read the file again',
      disabled: !path || busy,
      onClick: () => openPage(path),
    },
    {
      label: 'Add a script file',
      hint: path
        ? 'Creates ' + companionFile(path, 'js').slice(WEB_ROOT.length) + ' and links it'
        : 'Creates a script file for this page and links it',
      /*
       * Disabled only once THIS page's own same-named script exists —
       * never because some other script (not least the shared
       * /assets/magic-widgets.js every App block links) is already
       * there. [scripts] no longer includes that shared file at all
       * (see SHARED_ASSET_FILES), so this only ever matches a true
       * same-filename collision.
       */
      disabled: !path || busy || scripts.includes(companionFile(path, 'js')),
      onClick: () => addCompanionFile('js'),
    },
    {
      label: 'Add a stylesheet',
      hint: path
        ? 'Creates ' + companionFile(path, 'css').slice(WEB_ROOT.length) + ' and links it'
        : 'Creates a stylesheet for this page and links it',
      disabled: !path || busy || sheets.includes(companionFile(path, 'css')),
      onClick: () => addCompanionFile('css'),
    },
    { heading: 'Canvas' },
    {
      label: 'Show hidden elements',
      hint: 'Force everything the page hides to render, so it can be designed',
      checked: reveal,
      disabled: view !== 'design',
      onClick: () => setReveal(!reveal),
    },
  ];
}

/*
 * Unit tests for the Web Designer's "more" menu and its layout constants.
 */

import { describe, expect, it, vi } from 'vitest';

import { railClass, VIEWPORTS, VIEWS } from '../layout';
import { designerMenuItems, DesignerMenuOptions } from '../menuItems';

function options(overrides: Partial<DesignerMenuOptions> = {}): DesignerMenuOptions {
  return {
    viewport: 'desktop',
    setViewport: vi.fn(),
    setCreating: vi.fn(),
    origin: 'https://site.test',
    path: '/etc/www/docs/index.html',
    busy: false,
    scripts: [],
    sheets: [],
    openPage: vi.fn(),
    addCompanionFile: vi.fn(),
    reveal: false,
    setReveal: vi.fn(),
    view: 'design',
    ...overrides,
  };
}

// The item with the given label.
function item(o: DesignerMenuOptions, label: string) {
  return designerMenuItems(o).find(entry => entry.label === label)!;
}

describe('designerMenuItems', () => {
  it('lists the widths, the page actions and the canvas toggle under headings', () => {
    expect(designerMenuItems(options()).map(entry => entry.heading ?? entry.label)).toEqual([
      'Width',
      'Desktop',
      'Tablet  768px',
      'Phone  390px',
      'Page',
      'New page…',
      'Open in a new tab',
      'Reload from the server',
      'Add a script file',
      'Add a stylesheet',
      'Canvas',
      'Show hidden elements',
    ]);
  });

  it('ticks the current width and switches to another', () => {
    const o = options({ viewport: 'tablet' });
    expect(item(o, 'Tablet  768px').checked).toBe(true);
    expect(item(o, 'Desktop').checked).toBe(false);
    item(o, 'Phone  390px').onClick!();
    expect(o.setViewport).toHaveBeenCalledWith('phone');
  });

  it('opens the saved page at its canonical URL in a new tab', () => {
    const open = vi.fn();
    vi.stubGlobal('window', { open });
    item(options(), 'Open in a new tab').onClick!();
    expect(open).toHaveBeenCalledWith('https://site.test/docs', '_blank', 'noopener');
    vi.unstubAllGlobals();
  });

  it('reloads and creates through the callbacks it was given', () => {
    const o = options();
    item(o, 'Reload from the server').onClick!();
    expect(o.openPage).toHaveBeenCalledWith('/etc/www/docs/index.html');
    item(o, 'New page…').onClick!();
    expect(o.setCreating).toHaveBeenCalledWith(true);
    item(o, 'Add a stylesheet').onClick!();
    expect(o.addCompanionFile).toHaveBeenCalledWith('css');
  });

  it('names the companion files it would create', () => {
    const o = options();
    expect(item(o, 'Add a script file').hint).toBe('Creates /docs/index.js and links it');
    expect(item(o, 'Add a stylesheet').hint).toBe('Creates /docs/index.css and links it');
  });

  it('disables the page actions while no page is open', () => {
    const o = options({ path: '' });
    expect(item(o, 'Open in a new tab').disabled).toBe(true);
    expect(item(o, 'Reload from the server').disabled).toBe(true);
    expect(item(o, 'Add a script file').disabled).toBe(true);
    expect(item(o, 'Add a script file').hint).toBe(
      'Creates a script file for this page and links it',
    );
    expect(item(o, 'New page…').disabled).toBeUndefined();
  });

  it('disables reload and the companion files while busy', () => {
    const o = options({ busy: true });
    expect(item(o, 'Reload from the server').disabled).toBe(true);
    expect(item(o, 'Add a stylesheet').disabled).toBe(true);
    expect(item(o, 'Open in a new tab').disabled).toBe(false);
  });

  it('disables a companion only once the page has its own file by that name', () => {
    const other = options({ scripts: ['/etc/www/assets/magic-widgets.js'] });
    expect(item(other, 'Add a script file').disabled).toBe(false);
    const own = options({
      scripts: ['/etc/www/docs/index.js'],
      sheets: ['/etc/www/docs/index.css'],
    });
    expect(item(own, 'Add a script file').disabled).toBe(true);
    expect(item(own, 'Add a stylesheet').disabled).toBe(true);
  });

  it('toggles hidden elements, only in the design view', () => {
    const o = options({ reveal: true });
    const toggle = item(o, 'Show hidden elements');
    expect(toggle.checked).toBe(true);
    expect(toggle.disabled).toBe(false);
    toggle.onClick!();
    expect(o.setReveal).toHaveBeenCalledWith(false);
    expect(item(options({ view: 'code' }), 'Show hidden elements').disabled).toBe(true);
  });
});

describe('layout', () => {
  it('offers the three views and the three widths', () => {
    expect(VIEWS.map(view => view.id)).toEqual(['design', 'code', 'live']);
    expect(VIEWPORTS.map(viewport => viewport.width)).toEqual([null, 768, 390]);
  });

  it('names a rail by its side and whether it is folded', () => {
    expect(railClass('left', { left: false, right: true })).toBe('designer-rail');
    expect(railClass('left', { left: true, right: false })).toBe('designer-rail shut');
    expect(railClass('right', { left: false, right: false })).toBe('designer-rail right');
    expect(railClass('right', { left: false, right: true })).toBe('designer-rail right shut');
  });
});

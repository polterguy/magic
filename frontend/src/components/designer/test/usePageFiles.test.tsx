// @vitest-environment jsdom
/*
 * The pages on the cloudlet and the files behind the open one: the page list and remembered
 * page on mount, opening (with the discard prompt and full state reset), reading the linked
 * stylesheets and scripts once the canvas has loaded, creating pages with their folders and
 * companion files, and retrofitting a script or stylesheet onto the open page.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { useCodeDraft } from '../hooks/useCodeDraft';
import { useDocumentState } from '../hooks/useDocumentState';
import { usePageFiles } from '../hooks/usePageFiles';
import { useStylesheetState } from '../hooks/useStylesheetState';
import { useUndoHistory } from '../hooks/useUndoHistory';
import { INLINE } from '../Styles';

vi.mock('../../../lib/api', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../lib/api')>()),
  createFolder: vi.fn(),
  listFilesRecursively: vi.fn(),
  loadFile: vi.fn(),
  saveFile: vi.fn(),
}));

const ORIGIN = 'https://cloud.example';
const PAGE_KEY = 'designer-page';
const INDEX = '/etc/www/index.html';

let toasts: Toast[];
let disk: Partial<Record<string, string>>;

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  localStorage.clear();
  disk = {};
  vi.mocked(api.listFilesRecursively).mockResolvedValue([]);
  vi.mocked(api.loadFile).mockImplementation(file => {
    const text = disk[file];
    return text === undefined
      ? Promise.reject(new Error('missing ' + file))
      : Promise.resolve(text);
  });
  vi.mocked(api.saveFile).mockImplementation((file, text) => {
    disk[file] = text;
    return Promise.resolve(undefined as never);
  });
  vi.mocked(api.createFolder).mockResolvedValue(undefined as never);
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

function setup(view = 'design') {
  const confirm = vi.fn().mockResolvedValue(true);
  const setCreating = vi.fn();
  const viewRef = { current: view };
  const rig = renderHook(() => {
    const documentState = useDocumentState();
    const codeDraft = useCodeDraft();
    const stylesheet = useStylesheetState();
    const undoHistory = useUndoHistory(documentState, stylesheet);
    const files = usePageFiles({
      cloudlet: { origin: ORIGIN, pageKey: PAGE_KEY },
      confirm,
      documentState,
      ui: { viewRef, setCreating },
      codeDraft,
      stylesheet,
      undoHistory,
    });
    return { documentState, codeDraft, stylesheet, undoHistory, files };
  });
  return { rig, confirm, setCreating, viewRef };
}

const html = (head: string, body = '<p>Hi</p>') =>
  new DOMParser().parseFromString(
    '<!doctype html><html><head><base href="' +
      ORIGIN +
      '/"> ' +
      head +
      '</head><body>' +
      body +
      '</body></html>',
    'text/html',
  );

describe('usePageFiles mount', () => {
  it('lists the pages and opens the first one', async () => {
    disk[INDEX] = '<p>Home</p>';
    vi.mocked(api.listFilesRecursively).mockResolvedValue([
      '/etc/www/pricing.html',
      INDEX,
      '/etc/www/style.css',
    ]);
    const { rig } = setup();
    await waitFor(() => expect(rig.result.current.documentState.path).toBe(INDEX));
    expect(rig.result.current.files.pages).toEqual([INDEX, '/etc/www/pricing.html']);
    expect(localStorage.getItem(PAGE_KEY)).toBe(INDEX);
  });

  it('opens the page remembered from last time when it still exists', async () => {
    disk[INDEX] = '<p>Home</p>';
    disk['/etc/www/pricing.html'] = '<p>Price</p>';
    localStorage.setItem(PAGE_KEY, '/etc/www/pricing.html');
    vi.mocked(api.listFilesRecursively).mockResolvedValue([INDEX, '/etc/www/pricing.html']);
    const { rig } = setup();
    await waitFor(() =>
      expect(rig.result.current.documentState.path).toBe('/etc/www/pricing.html'),
    );
  });

  it('falls back to the first page when the remembered one is gone', async () => {
    disk[INDEX] = '<p>Home</p>';
    localStorage.setItem(PAGE_KEY, '/etc/www/deleted.html');
    vi.mocked(api.listFilesRecursively).mockResolvedValue([INDEX]);
    const { rig } = setup();
    await waitFor(() => expect(rig.result.current.documentState.path).toBe(INDEX));
  });

  it('opens nothing on a cloudlet with no pages', async () => {
    const { rig } = setup();
    await waitFor(() => expect(api.listFilesRecursively).toHaveBeenCalled());
    expect(rig.result.current.files.pages).toEqual([]);
    expect(rig.result.current.documentState.path).toBe('');
    expect(api.loadFile).not.toHaveBeenCalled();
  });

  it('shows an error when the page list cannot be read', async () => {
    vi.mocked(api.listFilesRecursively).mockRejectedValue(new Error('offline'));
    setup();
    await waitFor(() => expect(toasts).toEqual([expect.objectContaining({ text: 'offline' })]));
  });

  it('loadPages refreshes and returns the list', async () => {
    const { rig } = setup();
    await waitFor(() => expect(api.listFilesRecursively).toHaveBeenCalled());
    vi.mocked(api.listFilesRecursively).mockResolvedValue([INDEX]);
    let result: string[] = [];
    await act(async () => {
      result = await rig.result.current.files.loadPages();
    });
    expect(result).toEqual([INDEX]);
    expect(rig.result.current.files.pages).toEqual([INDEX]);
  });
});

describe('usePageFiles openPage', () => {
  it('loads the file against its served address and resets everything about the old page', async () => {
    disk[INDEX] = '<p>Home</p>';
    const { rig } = setup();
    act(() => {
      rig.result.current.documentState.setDirty(true);
      rig.result.current.documentState.setStale(true);
      rig.result.current.documentState.setShell(true);
      rig.result.current.stylesheet.setCssPath('/etc/www/old.css');
      rig.result.current.stylesheet.setOverrides({ p: { color: 'red' } });
      rig.result.current.stylesheet.setTarget('.x');
      rig.result.current.stylesheet.setSheets(['/etc/www/old.css']);
      rig.result.current.codeDraft.setCodeTarget('/etc/www/old.css');
    });
    await act(async () => {
      await rig.result.current.files.openPage(INDEX, true);
    });
    const state = rig.result.current;
    expect(state.documentState.path).toBe(INDEX);
    expect(state.documentState.srcDoc).toContain('<base href="https://cloud.example/"');
    expect(state.documentState.srcDoc).toContain('<p>Home</p>');
    expect(state.documentState.dirty).toBe(false);
    expect(state.documentState.stale).toBe(false);
    expect(state.documentState.shell).toBe(false);
    expect(state.documentState.selected).toBeNull();
    expect(state.stylesheet.cssPath).toBeNull();
    expect(state.stylesheet.overrides).toEqual({});
    expect(state.stylesheet.target).toBe(INLINE);
    expect(state.stylesheet.sheets).toEqual([]);
    expect(state.codeDraft.codeTarget).toBe('');
    expect(state.undoHistory.revisionRef.current).toBe(0);
    expect(state.documentState.busy).toBe(false);
    expect(localStorage.getItem(PAGE_KEY)).toBe(INDEX);
  });

  it('asks before discarding unsaved changes and stays put when refused', async () => {
    disk[INDEX] = '<p>Home</p>';
    const { rig, confirm } = setup();
    confirm.mockResolvedValue(false);
    act(() => rig.result.current.documentState.setDirty(true));
    await act(async () => {
      await rig.result.current.files.openPage(INDEX);
    });
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ danger: true }));
    expect(api.loadFile).not.toHaveBeenCalled();
    expect(rig.result.current.documentState.path).toBe('');
  });

  it('opens after the discard is confirmed, and never asks when forced or clean', async () => {
    disk[INDEX] = '<p>Home</p>';
    const { rig, confirm } = setup();
    act(() => rig.result.current.documentState.setDirty(true));
    await act(async () => {
      await rig.result.current.files.openPage(INDEX);
    });
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(rig.result.current.documentState.path).toBe(INDEX);
    await act(async () => {
      await rig.result.current.files.openPage(INDEX);
    });
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it('shows the error and keeps the old page when the file cannot be read', async () => {
    const { rig } = setup();
    await act(async () => {
      await rig.result.current.files.openPage('/etc/www/nope.html', true);
    });
    expect(toasts).toEqual([
      expect.objectContaining({ text: 'missing /etc/www/nope.html', isError: true }),
    ]);
    expect(rig.result.current.documentState.path).toBe('');
    expect(rig.result.current.documentState.busy).toBe(false);
  });
});

describe('usePageFiles onReady', () => {
  it('holds the document and reads the first stylesheet that exists', async () => {
    disk['/etc/www/site.css'] = 'p { margin: 0; }';
    const { rig } = setup();
    const loaded = html(
      '<link rel="stylesheet" href="/gone.css"><link rel="stylesheet" href="/site.css">',
    );
    await act(async () => {
      await rig.result.current.files.onReady(loaded);
    });
    const { documentState, stylesheet } = rig.result.current;
    expect(documentState.docRef.current).toBe(loaded);
    expect(documentState.doc).toBe(loaded);
    expect(documentState.version).toBe(1);
    expect(stylesheet.cssPath).toBe('/etc/www/site.css');
    expect(stylesheet.cssHead).toContain('p { margin: 0; }');
    expect(stylesheet.sheets).toEqual(['/etc/www/site.css']);
    expect(stylesheet.cssMissing).toEqual([]);
    expect(toasts).toHaveLength(0);
  });

  it('lists the stylesheets that could not be read when none could', async () => {
    const { rig } = setup();
    await act(async () => {
      await rig.result.current.files.onReady(html('<link rel="stylesheet" href="/gone.css">'));
    });
    expect(rig.result.current.stylesheet.cssPath).toBeNull();
    expect(rig.result.current.stylesheet.cssMissing).toEqual(['/etc/www/gone.css']);
  });

  it('ignores stylesheets and scripts that live elsewhere, or are the shared widget runtime', async () => {
    disk['/etc/www/assets/magic-widgets.css'] = '.w{}';
    disk['/etc/www/assets/magic-widgets.js'] = 'void 0';
    disk['/etc/www/app.js'] = 'void 0';
    const { rig } = setup();
    await act(async () => {
      await rig.result.current.files.onReady(
        html(
          '<link rel="stylesheet" href="https://cdn.example/x.css">' +
            '<link rel="stylesheet" href="/assets/magic-widgets.css">' +
            '<script src="/assets/magic-widgets.js"></script>' +
            '<script src="/app.js"></script><script src="/missing.js"></script>',
        ),
      );
    });
    expect(rig.result.current.stylesheet.cssPath).toBeNull();
    expect(rig.result.current.stylesheet.sheets).toEqual([]);
    expect(rig.result.current.stylesheet.scripts).toEqual(['/etc/www/app.js']);
  });

  it('flags a page that renders nothing on its own as a shell', async () => {
    const { rig } = setup();
    await act(async () => {
      await rig.result.current.files.onReady(html('', '<div id="root"></div>'));
    });
    expect(rig.result.current.documentState.shell).toBe(true);
    await act(async () => {
      await rig.result.current.files.onReady(html('', '<div id="root"><img src="a.png"></div>'));
    });
    expect(rig.result.current.documentState.shell).toBe(false);
    await act(async () => {
      await rig.result.current.files.onReady(html('', '<div>words</div>'));
    });
    expect(rig.result.current.documentState.shell).toBe(false);
  });

  it('refreshes the code view text when the canvas reloads underneath it', async () => {
    const { rig } = setup('code');
    await act(async () => {
      await rig.result.current.files.onReady(html('', '<p>fresh</p>'));
    });
    expect(rig.result.current.codeDraft.code).toContain('<p>fresh</p>');
  });

  it('leaves the code text alone outside the code view', async () => {
    const { rig } = setup('design');
    await act(async () => {
      await rig.result.current.files.onReady(html(''));
    });
    expect(rig.result.current.codeDraft.code).toBe('');
  });
});

describe('usePageFiles createPage', () => {
  it('creates each folder in order, writes a blank page and its companions, then opens it', async () => {
    const { rig, setCreating } = setup();
    await act(async () => {
      await rig.result.current.files.createPage('/etc/www/docs/guides/intro.html', null, {
        css: true,
        js: true,
      });
    });
    expect(setCreating).toHaveBeenCalledWith(false);
    expect(vi.mocked(api.createFolder).mock.calls.map(call => call[0])).toEqual([
      '/etc/www/docs/',
      '/etc/www/docs/guides/',
    ]);
    expect(disk['/etc/www/docs/guides/intro.html']).toContain('<title>');
    expect(disk['/etc/www/docs/guides/intro.html']).toContain('href="/docs/guides/intro.css"');
    expect(disk['/etc/www/docs/guides/intro.css']).toBe('');
    expect(disk['/etc/www/docs/guides/intro.js']).toBe('');
    expect(rig.result.current.documentState.path).toBe('/etc/www/docs/guides/intro.html');
    expect(toasts.map(toast => toast.text)).toEqual(['Created /etc/www/docs/guides/intro.html']);
    expect(rig.result.current.documentState.busy).toBe(false);
  });

  it('copies another page when asked and writes no companions that were not requested', async () => {
    disk['/etc/www/src.html'] = '<p>Source</p>';
    const { rig } = setup();
    await act(async () => {
      await rig.result.current.files.createPage('/etc/www/copy.html', '/etc/www/src.html', {
        css: false,
        js: false,
      });
    });
    expect(disk['/etc/www/copy.html']).toBe('<p>Source</p>');
    expect(Object.keys(disk).sort((a, b) => a.localeCompare(b))).toEqual([
      '/etc/www/copy.html',
      '/etc/www/src.html',
    ]);
    expect(api.createFolder).not.toHaveBeenCalled();
  });

  it('carries on when a folder already exists or a companion cannot be written', async () => {
    vi.mocked(api.createFolder).mockRejectedValue(new Error('exists'));
    const real = vi.mocked(api.saveFile).getMockImplementation()!;
    vi.mocked(api.saveFile).mockImplementation((file, text) =>
      file.endsWith('.css') ? Promise.reject(new Error('no css')) : real(file, text),
    );
    const { rig } = setup();
    await act(async () => {
      await rig.result.current.files.createPage('/etc/www/a/page.html', null, {
        css: true,
        js: false,
      });
    });
    expect(disk['/etc/www/a/page.html']).toBeDefined();
    expect(rig.result.current.documentState.path).toBe('/etc/www/a/page.html');
    expect(toasts.map(toast => toast.text)).toEqual(['Created /etc/www/a/page.html']);
  });

  it('reports a failure to write the page itself', async () => {
    vi.mocked(api.saveFile).mockRejectedValue(new Error('read only'));
    const { rig } = setup();
    await act(async () => {
      await rig.result.current.files.createPage('/etc/www/x.html', null, { css: false, js: false });
    });
    expect(toasts).toEqual([expect.objectContaining({ text: 'read only', isError: true })]);
    expect(rig.result.current.documentState.path).toBe('');
    expect(rig.result.current.documentState.busy).toBe(false);
  });
});

describe('usePageFiles addCompanionFile', () => {
  async function openIndex() {
    disk[INDEX] = '<p>Home</p>';
    const view = setup();
    await act(async () => {
      await view.rig.result.current.files.openPage(INDEX, true);
    });
    const loaded = html('<link rel="stylesheet" href="/other.css">');
    view.rig.result.current.documentState.docRef.current = loaded;
    return { ...view, loaded };
  }

  it('does nothing without an open page', async () => {
    const { rig } = setup();
    await act(async () => {
      await rig.result.current.files.addCompanionFile('js');
    });
    expect(api.saveFile).not.toHaveBeenCalled();
  });

  it('writes an empty script, links it and lists it', async () => {
    const { rig, loaded } = await openIndex();
    await act(async () => {
      await rig.result.current.files.addCompanionFile('js');
    });
    expect(disk['/etc/www/index.js']).toBe('');
    expect(loaded.querySelector('script[src="/index.js"]')).not.toBeNull();
    expect(rig.result.current.stylesheet.scripts).toEqual(['/etc/www/index.js']);
    expect(rig.result.current.documentState.dirty).toBe(true);
    expect(toasts.at(-1)!.text).toBe('Created /etc/www/index.js');
  });

  it('writes an empty stylesheet, links it and makes it the one the Style panel writes into', async () => {
    const { rig, loaded } = await openIndex();
    act(() => rig.result.current.stylesheet.setCssMissing(['/etc/www/gone.css']));
    await act(async () => {
      await rig.result.current.files.addCompanionFile('css');
    });
    expect(disk['/etc/www/index.css']).toBe('');
    expect(loaded.querySelector('link[href="/index.css"]')).not.toBeNull();
    const { stylesheet } = rig.result.current;
    expect(stylesheet.sheets).toEqual(['/etc/www/index.css']);
    expect(stylesheet.cssPath).toBe('/etc/www/index.css');
    expect(stylesheet.cssMissing).toEqual([]);
    expect(stylesheet.overrides).toEqual({});
  });

  it('reports a failure to write the file and links nothing', async () => {
    const { rig, loaded } = await openIndex();
    vi.mocked(api.saveFile).mockRejectedValue(new Error('denied'));
    await act(async () => {
      await rig.result.current.files.addCompanionFile('js');
    });
    expect(toasts.at(-1)).toEqual(expect.objectContaining({ text: 'denied', isError: true }));
    expect(loaded.querySelector('script[src="/index.js"]')).toBeNull();
    expect(rig.result.current.documentState.busy).toBe(false);
  });
});

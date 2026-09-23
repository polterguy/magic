/*
 * Web Designer — the visual half of building a frontend on a cloudlet.
 *
 * It designs the HTML, CSS and JavaScript files served out of /etc/www/, and
 * it does that and nothing else. There is no AI anywhere in this page on
 * purpose: natural language belongs to Chat Ops, which is already an agent
 * with tools for writing files. This page is the hands, Chat Ops is the voice,
 * and the only wire between them is a reload — when a Chat Ops turn finishes
 * having done something, the canvas picks the file up again.
 *
 * What makes the direct manipulation honest is in ./html.ts: the page is
 * rendered with its own scripts unable to run, so the DOM inside the canvas is
 * exactly what the file on disk says. Every element you can click has a home
 * in the source, and saving is a serialization rather than a reconciliation.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Tabs from '../components/Tabs';
import SearchInput from '../components/SearchInput';
import CodeEditor, { modeForFile } from '../components/CodeEditor';
import AiPrompt from '../components/AiPrompt';
import { useDialog } from '../components/Dialogs';
import { useAuth } from '../lib/AuthContext';
import { useUnsavedGuard } from '../lib/navGuard';
import { onChatOpsDone } from '../lib/chatOps';
import { showToast } from '../lib/toast';
import { aiContextForFile, createFolder, listFilesRecursively, loadFile, saveFile } from '../lib/api';
import { SaveIcon, UndoIcon } from '../components/Icons';
import Canvas from './designer/Canvas';
import Menu from './designer/Menu';
import NewPage, { blankPage, fileForUrl } from './designer/NewPage';
import Inspector from './designer/Inspector';
import Layers from './designer/Layers';
import Styles, { INLINE } from './designer/Styles';
import { Block, GROUPS, customBlock } from './designer/palette';
import { DropSpot } from './designer/dropTarget';
import { prepareDocument, serializeDocument } from './designer/html';
import { designableChildren, elementOf, isText, writeText } from './designer/nodes';
import { canContainChildren } from './designer/html';
import { Overrides, joinCss, matchingSelectors, overrideCss, splitCss, stylesheetPaths } from './designer/css';

const WEB_ROOT = '/etc/www';

// How many steps back the undo history goes.
const HISTORY = 50;

const VIEWS: { id: string; label: string; hint: string }[] = [
  { id: 'design', label: 'Design', hint: 'Edit the page by pointing at it' },
  { id: 'code', label: 'Code', hint: 'Edit the same file as HTML' },
  { id: 'live', label: 'Live', hint: 'Run the page for real, scripts and all — look, do not touch' },
];

const VIEWPORTS: { id: string; label: string; width: number | null }[] = [
  { id: 'desktop', label: 'Desktop', width: null },
  { id: 'tablet', label: 'Tablet', width: 768 },
  { id: 'phone', label: 'Phone', width: 390 },
];

// One snapshot of everything an undo has to put back.
interface Snapshot {
  html: string;
  overrides: Overrides;
}

/*
 * The URL a file is served at. Pages here are reachable only at their
 * canonical, extension-less address — every other spelling 301s to it — so the
 * live preview has to ask for exactly this or it spends a redirect finding out.
 */
function canonicalUrl(file: string) {
  const relative = file.substring(WEB_ROOT.length);
  if (relative.endsWith('/index.html')) {
    const parent = relative.substring(0, relative.length - '/index.html'.length);
    return parent === '' ? '/' : parent;
  }
  return relative.replace(/\.html?$/i, '');
}

/*
 * Hidden folders are never served, so a page inside one could not be looked at
 * even if it could be edited.
 */
function isServed(file: string) {
  return !file.substring(WEB_ROOT.length).split('/').some(part => part.startsWith('.'));
}

export default function WebDesigner() {

  const { backend } = useAuth();
  const { confirm } = useDialog();

  const [pages, setPages] = useState<string[]>([]);
  const [path, setPath] = useState('');
  const [srcDoc, setSrcDoc] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  // A Chat Ops turn rewrote files while there were unsaved changes here.
  const [stale, setStale] = useState(false);

  /*
   * The canvas document is the editing model, and it is not React state — so
   * every mutation bumps this, and everything reading the document renders
   * again. Measurements taken from live layout are re-taken at the same time.
   */
  const [version, setVersion] = useState(0);
  /*
   * The selection is a NODE, not an element: a run of text is selected,
   * edited, moved and deleted exactly like anything else on the page.
   */
  const [selected, setSelected] = useState<Node | null>(null);
  const [hovered, setHovered] = useState<Node | null>(null);
  /*
   * Bumped only when the hover came from the tree, which is what tells the
   * canvas to bring that node on screen. A hover from the canvas itself must
   * not scroll anything — the pointer is already on the thing.
   */
  const [revealHovered, setRevealHovered] = useState(0);
  // Bumped by a double click in the tree — take me to the selection.
  const [revealSelected, setRevealSelected] = useState(0);
  const [reveal, setReveal] = useState(false);
  /*
   * What the middle pane is showing. Design edits the file through the
   * canvas; Code edits the same file as text; Live runs it for real.
   */
  const [view, setView] = useState('design');
  // The file as text, while the code view has it, and as it was handed over —
  // the difference between them is whether the code view changed anything.
  const [code, setCode] = useState('');
  const [codeOriginal, setCodeOriginal] = useState('');
  // Which file the code view holds. The page itself unless a stylesheet was picked.
  const [codeTarget, setCodeTarget] = useState('');
  // Every local stylesheet this page links that is actually on disk.
  const [sheets, setSheets] = useState<string[]>([]);
  const [viewport, setViewport] = useState('desktop');
  // The palette block being dragged in. Its markup is not built until it
  // lands, because what it should look like depends on where it lands.
  const [pending, setPending] = useState<Block | null>(null);
  const [tab, setTab] = useState('element');
  // Narrows the block list, and the custom tag typed beside it.
  const [blockFilter, setBlockFilter] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [creating, setCreating] = useState(false);
  const [history, setHistory] = useState<Snapshot[]>([]);

  // The stylesheet the open page is styled by, as it was read and as it stands.
  const [cssPath, setCssPath] = useState<string | null>(null);
  const [cssOriginal, setCssOriginal] = useState('');
  const [cssHead, setCssHead] = useState('');
  // The author's own CSS below the designer's fence, carried back untouched.
  const [cssTail, setCssTail] = useState('');
  const [overrides, setOverrides] = useState<Overrides>({});
  const [target, setTarget] = useState(INLINE);
  // Stylesheets the page links that are not on this cloudlet.
  const [cssMissing, setCssMissing] = useState<string[]>([]);
  /*
   * Set when the open page renders nothing at all on its own. A compiled
   * single-page application is the usual reason: its whole interface is
   * built by the script the canvas refuses to run, so the file itself is an
   * empty mount point and there is genuinely nothing on it to design.
   */
  const [shell, setShell] = useState(false);

  const docRef = useRef<Document | null>(null);
  // For onReady, which fires long after the render that set the view.
  const viewRef = useRef(view);
  viewRef.current = view;
  /*
   * Consecutive edits of the same thing — dragging a slider, typing into a
   * field — share one undo step. Cleared whenever the selection moves, so the
   * next element starts a step of its own.
   */
  const coalesceRef = useRef<string | null>(null);
  // For the Chat Ops listener, which is registered once and outlives renders.
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const pathRef = useRef(path);
  pathRef.current = path;

  const origin = backend ? new URL(backend.url).origin : '';
  // Per backend — every cloudlet has its own pages.
  const pageKey = 'magic2.designer.page.' + (backend?.url ?? '');
  const doc = docRef.current;
  const width = VIEWPORTS.find(entry => entry.id === viewport)?.width ?? null;

  useUnsavedGuard(dirty, 'Your design changes have not been saved.');

  useEffect(() => {
    coalesceRef.current = null;
  }, [selected]);

  /* -- Loading ------------------------------------------------------------ */

  async function loadPages() {
    const files = await listFilesRecursively(WEB_ROOT, false) ?? [];
    // Sorted by the URL they are served at, which is how the picker lists them.
    const html = files
      .filter(file => /\.html?$/i.test(file) && isServed(file))
      .sort((left, right) => canonicalUrl(left).localeCompare(canonicalUrl(right)));
    setPages(html);
    return html;
  }

  async function openPage(file: string, force = false) {
    if (!force && dirty && !(await confirm({
      title: 'Discard unsaved changes?',
      message: 'The design changes to ' + path + ' have not been saved.',
      confirmText: 'Discard',
      danger: true,
    }))) {
      return;
    }
    setBusy(true);
    try {
      const source = await loadFile(file);
      setPath(file);
      localStorage.setItem(pageKey, file);
      /*
       * The base is the URL this page is actually served at, not the site
       * root. Anything relative in the page — a fragment, a sibling link, a
       * relative asset — then resolves exactly the way it resolves for a
       * visitor, which is the whole point of showing the real file.
       */
      setSrcDoc(prepareDocument(source, origin + canonicalUrl(file)));
      setSelected(null);
      setHovered(null);
      setHistory([]);
      setDirty(false);
      setStale(false);
      setTarget(INLINE);
      setShell(false);
      setCodeTarget('');
      setSheets([]);
      setCssPath(null);
      setCssOriginal('');
      setCssHead('');
      setCssTail('');
      setOverrides({});
      setCssMissing([]);
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadPages()
      .then(html => {
        if (html.length === 0) {
          return;
        }
        /*
         * Back to whichever page was open last, rather than to whichever page
         * happens to sort first — which on a cloudlet serving a built app at
         * the root is its empty mount point, the one page with nothing to
         * design on it.
         */
        const remembered = localStorage.getItem(pageKey);
        openPage(remembered && html.includes(remembered) ? remembered : html[0], true);
      })
      .catch((err: any) => showToast(err.message, true));
    // Mount only — the page list is refreshed by hand and after a Chat Ops turn.
  }, []);

  /*
   * A Chat Ops turn has finished doing something on the server. With nothing
   * unsaved here the canvas simply picks the file up again; with unsaved work
   * it says so and waits, because the alternative is silently throwing away
   * what the user just did.
   */
  useEffect(() => onChatOpsDone(() => {
    if (dirtyRef.current) {
      setStale(true);
      showToast('Chat Ops changed files on the server — reload when you are ready');
      return;
    }
    if (pathRef.current) {
      openPage(pathRef.current, true);
    }
    loadPages().catch(() => {});
  }), []);

  /*
   * The canvas frame has a document. Its stylesheet is read through the file
   * API rather than out of the frame's own CSSOM: the cloudlet is usually on
   * another host, which makes the loaded sheet opaque, and this is the same
   * text that has to be written back anyway.
   *
   * The page's stylesheets are tried in the order it links them, and the first
   * one actually on disk becomes the one rule edits are written to. A sheet
   * that is not there is not a failure to report: a page copied onto a cloudlet
   * without its assets renders unstyled for every visitor, and showing that
   * faithfully is the canvas doing its job. The style panel says so plainly
   * instead, which is where it means something.
   */
  async function onReady(loaded: Document) {
    docRef.current = loaded;
    setVersion(current => current + 1);
    // Reloading the page underneath the code view has to refresh its text too.
    if (viewRef.current === 'code') {
      setCode(serializeDocument(loaded));
    }
    /*
     * Whether anything at all renders without scripts. Asked of the document
     * rather than guessed from the markup: no text anywhere, and none of the
     * elements that show something without needing text.
     */
    setShell(loaded.body.textContent?.trim() === '' &&
      loaded.body.querySelectorAll('img, svg, video, canvas, input, textarea, iframe').length === 0);
    // Resolved against the document's own base, so this cannot disagree with
    // how the browser just resolved the very same hrefs.
    const linked = stylesheetPaths(loaded, loaded.baseURI);
    const readable: string[] = [];
    const absent: string[] = [];
    for (const sheet of linked) {
      try {
        const text = await loadFile(sheet);
        readable.push(sheet);
        // The first one that is really there is the one rule edits go into.
        if (readable.length === 1) {
          const split = splitCss(text);
          setCssPath(sheet);
          setCssOriginal(text);
          setCssHead(split.head);
          setCssTail(split.tail);
          setOverrides(split.overrides);
        }
      } catch {
        absent.push(sheet);
      }
    }
    setSheets(readable);
    setCssMissing(readable.length === 0 ? absent : []);
  }

  /*
   * Puts a different file in the code view.
   *
   * Refused while anything is unsaved, and deliberately so. The editor holds
   * one file's text at a time, and a stylesheet read off disk does not contain
   * the style panel's pending edits — so switching with either outstanding
   * would mean silently choosing which version of the truth to keep. Saving
   * first makes the two agree, and then there is nothing to choose.
   */
  async function switchCodeTarget(file: string) {
    if (file === codeTarget) {
      return;
    }
    if (code !== codeOriginal) {
      showToast('Save your changes before switching file', true);
      return;
    }
    if (file !== path && file === cssPath && joinCss(cssHead, overrides, cssTail) !== cssOriginal) {
      showToast('Save first — the Style panel has changes that are not in ' + file + ' yet', true);
      return;
    }
    const current = docRef.current;
    if (!current) {
      return;
    }
    setBusy(true);
    try {
      const text = file === path ? serializeDocument(current) : await loadFile(file);
      setCodeTarget(file);
      setCode(text);
      setCodeOriginal(text);
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  /*
   * Moves the file between the two ways of editing it.
   *
   * Leaving the code view is what applies what was typed there — but only when
   * the editor was holding the PAGE. A stylesheet's text is not markup, and
   * feeding it to the parser would produce a document made of nothing.
   */
  function switchView(next: string) {
    const current = docRef.current;
    if (view === 'code' && codeTarget === path && code !== codeOriginal) {
      if (current) {
        setHistory(stack => [
          ...stack.slice(-(HISTORY - 1)),
          { html: current.documentElement.innerHTML, overrides },
        ]);
      }
      setSrcDoc(prepareDocument(code, origin + canonicalUrl(path)));
      setSelected(null);
      setHovered(null);
      setDirty(true);
    }
    /*
     * Entering the code view loads the page — unless a stylesheet was already
     * open, in which case that draft is left exactly where it was rather than
     * being thrown away by a trip to the canvas and back.
     */
    if (next === 'code' && current && (codeTarget === '' || codeTarget === path)) {
      const text = serializeDocument(current);
      setCodeTarget(path);
      setCode(text);
      setCodeOriginal(text);
    }
    setView(next);
  }

  /*
   * Writes a new page and opens it.
   *
   * Folders are never invented for you — "/pricing" is pricing.html and
   * nothing else — but a URL with steps in it still needs those steps to
   * exist, and a file write into a folder that is not there fails with an
   * error that says nothing useful. So each step is created first, in order.
   */
  async function createPage(file: string, copyFrom: string | null) {
    setCreating(false);
    setBusy(true);
    try {
      const folders = file.substring(WEB_ROOT.length + 1).split('/').slice(0, -1);
      let sofar = WEB_ROOT;
      for (const folder of folders) {
        sofar += '/' + folder;
        // Already there is the normal case and not a problem.
        await createFolder(sofar + '/').catch(() => undefined);
      }
      const source = copyFrom
        ? await loadFile(copyFrom)
        : blankPage(file.substring(WEB_ROOT.length).replace(/\.html$/, ''));
      await saveFile(file, source);
      await loadPages();
      await openPage(file, true);
      showToast('Created ' + file);
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  /* -- Mutation ----------------------------------------------------------- */

  function mutate(change: () => void, coalesce?: string) {
    const current = docRef.current;
    if (!current) {
      return;
    }
    if (!coalesce || coalesce !== coalesceRef.current) {
      setHistory(stack => [
        ...stack.slice(-(HISTORY - 1)),
        { html: current.documentElement.innerHTML, overrides },
      ]);
    }
    coalesceRef.current = coalesce ?? null;
    change();
    setDirty(true);
    setVersion(value => value + 1);
  }

  function undo() {
    const current = docRef.current;
    const snapshot = history[history.length - 1];
    if (!current || !snapshot) {
      return;
    }
    /*
     * Everything in the canvas is replaced, so every element reference held
     * out here — the selection, the hover — now points at a node that is no
     * longer in the document.
     */
    current.documentElement.innerHTML = snapshot.html;
    setOverrides(snapshot.overrides);
    setHistory(stack => stack.slice(0, -1));
    setSelected(null);
    setHovered(null);
    coalesceRef.current = null;
    setDirty(true);
    setVersion(value => value + 1);
  }

  function setText(text: string) {
    const node = selected;
    if (node && isText(node)) {
      mutate(() => writeText(node, text), 'text');
    }
  }

  function setAttribute(name: string, value: string) {
    const element = elementOf(selected);
    if (!element) {
      return;
    }
    mutate(() => {
      // An empty id is never meaningful, and writing id="" to the file is noise.
      if (name === 'id' && value === '') {
        element.removeAttribute('id');
      } else {
        element.setAttribute(name, value);
      }
    }, 'attribute:' + name);
  }

  function removeAttribute(name: string) {
    const element = elementOf(selected);
    if (element) {
      mutate(() => element.removeAttribute(name));
    }
  }

  function setClasses(classes: string[]) {
    const element = elementOf(selected);
    if (!element) {
      return;
    }
    mutate(() => {
      if (classes.length === 0) {
        element.removeAttribute('class');
      } else {
        element.setAttribute('class', classes.join(' '));
      }
    });
  }

  /*
   * Gives an element a run of text to hold.
   *
   * Emptying the words out of a paragraph leaves the paragraph — deleting it
   * would be deciding, on the user's behalf, that an element with no text is
   * an element they no longer want, and that is wrong often enough to be
   * dangerous: half the containers on a generated page are empty on purpose,
   * waiting for their script to fill them. So the element stays, and this is
   * how words go back into it.
   */
  function addText() {
    const element = elementOf(selected);
    if (!element) {
      return;
    }
    mutate(() => {
      // Reuse the emptied run if there is one rather than stacking another.
      const existing = Array.from(element.childNodes).find(isText);
      if (existing) {
        existing.data = 'Some text';
        setSelected(existing);
      } else {
        const node = element.ownerDocument.createTextNode('Some text');
        element.append(node);
        setSelected(node);
      }
    });
  }

  function duplicate() {
    const node = selected;
    if (!node) {
      return;
    }
    mutate(() => {
      const copy = node.cloneNode(true);
      if (!isText(copy)) {
        const element = copy as Element;
      /*
       * An id identifies one element. A copy that keeps it leaves two elements
       * answering to the same name, which breaks the page's own CSS and
       * scripts in ways that only show up later.
       */
        element.removeAttribute('id');
        element.querySelectorAll('[id]').forEach(child => child.removeAttribute('id'));
      }
      (node as ChildNode).after(copy);
      setSelected(copy);
    });
  }

  function remove() {
    const node = selected;
    if (!node || node === doc?.body) {
      return;
    }
    mutate(() => {
      const parent = node.parentElement;
      (node as ChildNode).remove();
      setSelected(parent);
      setHovered(null);
    });
  }

  /*
   * Among its designable siblings rather than its element siblings, so a run
   * of text counts as something to move past.
   */
  function nudge(direction: -1 | 1) {
    const node = selected;
    const parent = node?.parentNode;
    if (!node || !parent) {
      return;
    }
    const siblings = designableChildren(parent);
    const sibling = siblings[siblings.indexOf(node) + direction];
    if (!sibling) {
      return;
    }
    mutate(() => {
      if (direction < 0) {
        (sibling as ChildNode).before(node);
      } else {
        (sibling as ChildNode).after(node);
      }
    });
  }

  function move(node: Node, spot: DropSpot) {
    mutate(() => spot.parent.insertBefore(node, spot.before));
  }

  function insert(block: Block, spot: DropSpot) {
    const current = docRef.current;
    if (!current) {
      return;
    }
    const html = block.build(current, spot.parent);
    /*
     * A template parses markup without running or loading anything in it, and
     * without the parser relocating stray table or list elements the way it
     * would inside a real body.
     */
    const holder = current.createElement('template');
    holder.innerHTML = html;
    const node = holder.content.firstChild;
    if (!node) {
      return;
    }
    mutate(() => {
      spot.parent.insertBefore(node, spot.before);
      setSelected(node);
    });
  }

  /*
   * Puts what the Machine returned in place of the selected element.
   *
   * Everything it returns is used, not just the first node: asked to turn one
   * paragraph into three, it answers with three, and taking only the first
   * would silently drop two of them.
   *
   * <body> and <html> are refused. Replacing either with whatever comes back
   * would leave a document that is no longer a document, and "redesign the
   * whole page" is a job for Chat Ops, which can see the file and the
   * stylesheet together.
   */
  function rewriteSelected(html: string) {
    const element = styleTarget;
    const current = docRef.current;
    if (!element || !current) {
      return;
    }
    const tag = element.tagName.toLowerCase();
    if (tag === 'body' || tag === 'html') {
      showToast('Select something inside the page — the page itself is Chat Ops\u2019 job', true);
      return;
    }
    const holder = current.createElement('template');
    holder.innerHTML = html;
    const nodes = Array.from(holder.content.childNodes);
    if (nodes.length === 0) {
      showToast('The Machine returned nothing to put there', true);
      return;
    }
    mutate(() => {
      element.replaceWith(...nodes);
      setSelected(nodes[0]);
    });
  }

  function setStyle(property: string, value: string) {
    const element = styleTarget;
    if (!element) {
      return;
    }
    if (target === INLINE) {
      mutate(() => {
        const style = (element as HTMLElement).style;
        if (value === '') {
          style.removeProperty(property);
        } else {
          style.setProperty(property, value);
        }
      }, 'style:' + property);
      return;
    }
    mutate(() => setOverrides(current => {
      const declarations = { ...(current[target] ?? {}) };
      if (value === '') {
        delete declarations[property];
      } else {
        declarations[property] = value;
      }
      return { ...current, [target]: declarations };
    }), 'rule:' + target + ':' + property);
  }

  /* -- Effects ------------------------------------------------------------ */

  // Style-rule edits show up in the canvas through the sheet the designer owns.
  useEffect(() => {
    docRef.current
      ?.querySelector('style[data-magic-overrides]')
      ?.replaceChildren(overrideCss(overrides));
  }, [overrides, version]);

  /*
   * Forces every element the page hides to render, so it can be designed.
   * Which elements those are is asked of the browser rather than guessed from
   * class names — a page may hide things any way it likes.
   */
  useEffect(() => {
    const current = docRef.current;
    const view = current?.defaultView;
    if (!current || !view) {
      return;
    }
    current.querySelectorAll('[data-magic-force]')
      .forEach(element => element.removeAttribute('data-magic-force'));
    if (reveal) {
      current.body.querySelectorAll('*').forEach(element => {
        if (view.getComputedStyle(element).display === 'none') {
          element.setAttribute('data-magic-force', '');
        }
      });
    }
    setVersion(value => value + 1);
    // Not on version: this effect changes the document, and would re-run itself.
  }, [reveal, srcDoc]);

  const hidden = useMemo(() => {
    const found = new Set<Element>();
    const view = doc?.defaultView;
    if (!doc || !view) {
      return found;
    }
    doc.body.querySelectorAll('*').forEach(element => {
      if (element.hasAttribute('data-magic-force') ||
          view.getComputedStyle(element).display === 'none') {
        found.add(element);
      }
    });
    return found;
  }, [doc, version]);

  // The page's own selectors this element is styled by, offered as edit targets.
  // Text has no styles of its own, so the style panel works on the element
  // around it — which is what anyone picking a colour with a sentence
  // selected actually means.
  const styleTarget = elementOf(selected);
  /*
   * On [version] as well as the element and the stylesheet, because which
   * selectors match is decided by element.matches() — live DOM state that a
   * memo cannot see. Adding a class changes neither the element's identity nor
   * the stylesheet text, so without this the list stays as it was and the
   * class you just added is missing from it.
   */
  const selectors = useMemo(
    () => (styleTarget && cssHead ? matchingSelectors(cssHead, styleTarget) : []),
    [styleTarget, cssHead, version]);

  // A selector that styled the last element rarely styles the next one.
  useEffect(() => {
    setTarget(current => (current === INLINE || selectors.includes(current) ? current : INLINE));
  }, [selectors]);

  /* -- Saving ------------------------------------------------------------- */

  /*
   * Bumps the cache-busting "v" on the link to the stylesheet being written.
   *
   * Without this a style edit reaches nobody. The cloudlet serves CSS with a
   * one-year cache, so any browser that has already loaded the page keeps the
   * copy it has — which is exactly why an edit shows in the canvas, where the
   * designer injects it live, and not in Live, not in a new tab, and not for a
   * visitor. The page asks for a different URL, so the browser has to fetch it.
   */
  function bumpStylesheet(current: Document, sheet: string) {
    const link = Array.from(current.querySelectorAll('link[rel~="stylesheet"][href]'))
      .find(candidate => {
        const href = candidate.getAttribute('href') ?? '';
        return '/etc/www' + new URL(href, current.baseURI).pathname === sheet;
      });
    if (!link) {
      return;
    }
    const url = new URL(link.getAttribute('href')!, current.baseURI);
    const version = Number(url.searchParams.get('v'));
    url.searchParams.set('v', String(Number.isFinite(version) && version > 0 ? version + 1 : 1));
    link.setAttribute('href', url.pathname + url.search);
  }


  async function save() {
    const current = docRef.current;
    if (!current || !path) {
      return;
    }
    setSaving(true);
    try {
      /*
       * A stylesheet open in the code view IS that file, whole — not the
       * designer's block within it. It is written as typed, the page is
       * written too because its link had to be bumped for anyone to see the
       * change, and the style panel re-reads the result so the two agree
       * again straight away.
       */
      if (view === 'code' && codeTarget !== '' && codeTarget !== path) {
        bumpStylesheet(current, codeTarget);
        await saveFile(path, serializeDocument(current));
        await saveFile(codeTarget, code);
        setCodeOriginal(code);
        if (codeTarget === cssPath) {
          const split = splitCss(code);
          setCssOriginal(code);
          setCssHead(split.head);
          setCssTail(split.tail);
          setOverrides(split.overrides);
        }
        setDirty(false);
        showToast('Saved ' + codeTarget);
        return;
      }
      const css = joinCss(cssHead, overrides, cssTail);
      const cssChanged = !!cssPath && css !== cssOriginal;
      /*
       * Done before the page is serialised, so the bumped link goes out in the
       * same save. In the code view the text on screen is the file and the
       * user owns it, so nothing is rewritten underneath them there.
       */
      if (cssChanged && view !== 'code') {
        bumpStylesheet(current, cssPath!);
      }
      /*
       * In the code view what is on screen IS the file, so it is written
       * through as typed rather than re-formatted from the document — nobody
       * wants their own hand formatting rearranged the moment they save it.
       */
      await saveFile(path, view === 'code' ? code : serializeDocument(current));
      if (cssChanged) {
        await saveFile(cssPath!, css);
        setCssOriginal(css);
        // The code view may be holding this same file — move its draft onto
        // what was just written, or it would offer to save the old text back.
        if (codeTarget === cssPath) {
          setCode(css);
          setCodeOriginal(css);
        }
      }
      setDirty(false);
      showToast('Saved ' + path);
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setSaving(false);
    }
  }

  /* -- Keyboard ----------------------------------------------------------- */

  function onKey(event: KeyboardEvent) {
    const from = event.target as HTMLElement | null;
    const tag = from?.tagName?.toLowerCase();
    // Never steal a key from something the user is typing into.
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || from?.isContentEditable) {
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      remove();
    } else if (event.key === 'Escape') {
      setSelected(null);
    } else if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
      event.preventDefault();
      undo();
    } else if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      save();
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* -- Rendering ---------------------------------------------------------- */

  return (
    <>
      <div className="page-header ide-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="page-title ide-title">
          <h1>Web Designer</h1>
          {!path && <p>Design the pages your cloudlet serves</p>}
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        {stale && (
          <span className="badge badge-put" title="Chat Ops wrote files while you had unsaved changes">
            Changed on server
          </span>
        )}
        <select
          className="designer-page-select"
          value={path}
          title="The page being designed"
          onChange={event => openPage(event.target.value)}>
          {pages.length === 0 && <option value="">No pages in /etc/www/</option>}
          {pages.map(file => (
            <option key={file} value={file}>{canonicalUrl(file)}</option>
          ))}
        </select>
        <div className="tabs designer-viewports">
          {VIEWS.map(entry => (
            <button
              key={entry.id}
              type="button"
              className={'tab' + (entry.id === view ? ' active' : '')}
              title={entry.hint}
              onClick={() => switchView(entry.id)}>
              {entry.label}
            </button>
          ))}
        </div>
        <button
          className="btn btn-secondary btn-small"
          title="Undo the last change"
          onClick={undo}
          disabled={history.length === 0}>
          <UndoIcon />
          Undo
        </button>
        <Menu
          title="Viewport, preview and the rest"
          items={[
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
            { heading: 'Canvas' },
            {
              label: 'Show hidden elements',
              hint: 'Force everything the page hides to render, so it can be designed',
              checked: reveal,
              disabled: view !== 'design',
              onClick: () => setReveal(!reveal),
            },
          ]} />
        <button className="btn btn-small" onClick={save} disabled={!dirty || saving}>
          <SaveIcon />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {creating && (
        <NewPage
          taken={pages.map(canonicalUrl)}
          pages={pages.map(file => ({ file, url: canonicalUrl(file) }))}
          onCancel={() => setCreating(false)}
          onCreate={createPage} />
      )}

      <div className="designer-layout">
        {/*
          * Inert unless the canvas is the thing being edited. In the code view
          * the FILE is what you are changing, and a property edited over here
          * would be written into the document and then thrown away the moment
          * the code text was applied on the way out. In the live view nothing
          * here corresponds to what is on screen at all.
          *
          * Set through a ref because React 18 has no typing for [inert], which
          * is the one attribute that makes a subtree neither clickable nor
          * focusable — a pointer-events rule alone would still let the keyboard
          * tab straight into it.
          */}
        <div
          className="designer-rail"
          ref={node => node?.toggleAttribute('inert', view !== 'design')}>
          <div className="designer-section">
            <h3>Blocks</h3>
            <p className="designer-note">
              Drag onto the page. Each one arrives wearing the classes this page
              already puts on that kind of element.
            </p>
            <SearchInput
              placeholder="Filter blocks…"
              value={blockFilter}
              onChange={setBlockFilter}
              style={{ width: '100%' }} />
            {(() => {
              const pill = (block: Block) => (
                <button
                  key={block.key}
                  className="designer-block"
                  disabled={view !== 'design' || !doc}
                  title={'Drag a ' + block.label.toLowerCase() + ' onto the page'}
                  onMouseDown={event => {
                    event.preventDefault();
                    setPending(block);
                  }}>
                  {block.label}
                </button>
              );
              const needle = blockFilter.trim().toLowerCase();
              /*
               * Filtering flattens the groups. Once you are searching, which
               * drawer a tag lives in is exactly what you did not want to
               * think about.
               */
              if (needle !== '') {
                const hits = GROUPS.flatMap(group => group.blocks)
                  .filter(block => block.label.toLowerCase().includes(needle) ||
                    block.key.includes(needle));
                return (
                  <div className="designer-palette">
                    {hits.map(pill)}
                    {hits.length === 0 && (
                      <span className="designer-muted">
                        Nothing by that name — try the custom tag below.
                      </span>
                    )}
                  </div>
                );
              }
              /*
               * Closed to start with. Seven open drawers push the tree off the
               * bottom of the rail, and the tree is looked at constantly while
               * the blocks are reached for occasionally — so the filter above
               * is the fast path, and opening a drawer is one click.
               */
              return GROUPS.map(group => (
                <details key={group.label} className="designer-group">
                  <summary>{group.label}</summary>
                  <div className="designer-palette">{group.blocks.map(pill)}</div>
                </details>
              ));
            })()}
            <div className="designer-field">
              <span>Any other tag</span>
              <input
                type="text"
                placeholder="figcaption, my-widget…"
                value={customTag}
                onChange={event => setCustomTag(event.target.value)} />
              {customBlock(customTag) && (
                <div className="designer-palette">
                  {[customBlock(customTag)!].map(block => (
                    <button
                      key={block.key}
                      className="designer-block"
                      disabled={view !== 'design' || !doc}
                      title={'Drag a ' + block.label + ' onto the page'}
                      onMouseDown={event => {
                        event.preventDefault();
                        setPending(block);
                      }}>
                      {block.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="designer-section grow">
            <h3>Tree</h3>
            <Layers
              root={doc?.body ?? null}
              selected={selected}
              hidden={hidden}
              onSelect={setSelected}
              onHover={node => {
                setHovered(node);
                if (node) {
                  setRevealHovered(count => count + 1);
                }
              }}
              onReveal={node => {
                setSelected(node);
                setRevealSelected(count => count + 1);
              }} />
          </div>
        </div>

        <div className="designer-middle">
        {view === 'code' && (
          <div className="designer-code">
            <div className="designer-code-bar">
              <span>Editing</span>
              <select
                value={codeTarget || path}
                title="The file in the editor"
                onChange={event => switchCodeTarget(event.target.value)}>
                <option value={path}>{path.substring(WEB_ROOT.length)}</option>
                {sheets.map(sheet => (
                  <option key={sheet} value={sheet}>{sheet.substring(WEB_ROOT.length)}</option>
                ))}
              </select>
              {codeTarget !== '' && codeTarget !== path && (
                <span className="designer-muted">the whole file, not just the designer's block</span>
              )}
            </div>
            <CodeEditor
              key={codeTarget || path}
              value={code}
              onChange={value => {
                setCode(value);
                setDirty(true);
              }}
              mode={modeForFile(codeTarget || path)}
              onSave={save} />
          </div>
        )}
        {view === 'live' && (
          <div className="designer-canvas">
            <iframe
              className="designer-frame"
              title="Live preview"
              src={origin + canonicalUrl(path)}
              style={width ? { width } : undefined} />
          </div>
        )}
        <Canvas
            srcDoc={srcDoc}
            width={width}
            selected={selected}
            hovered={hovered}
            version={version}
            inserting={pending !== null}
            revealHovered={revealHovered}
            revealSelected={revealSelected}
            note={shell
              ? 'This page draws nothing by itself — its interface is built by ' +
                'JavaScript, which the canvas does not run. That is what makes ' +
                'everything else here safe to edit, and it means a compiled app ' +
                'like this one has nothing on it to design. Its markup is still ' +
                'yours to edit in Hyper IDE.'
              : null}
            onReady={onReady}
            onHover={setHovered}
            onSelect={setSelected}
            onMove={move}
            onInsert={spot => {
              if (pending) {
                insert(pending, spot);
              }
            }}
            onPendingDone={() => setPending(null)}
            onEditText={(node, text) => mutate(() => writeText(node, text))}
            onKey={onKey}
            hidden={view !== 'design'} />

        {/*
          * One prompt bar for the middle column, pointed at whatever is being
          * edited: the file in the code view, the selected element in the
          * design view. Not shown over Live, which is a real page on another
          * origin and not ours to rewrite.
          */}
        {view === 'code' && (
          <AiPrompt
            key={'code:' + (codeTarget || path)}
            fileType={(codeTarget || path).endsWith('.css') ? 'css' : 'html'}
            getContext={() => aiContextForFile(codeTarget || path, code)}
            getOldCode={() => code}
            session={codeTarget || path}
            onResult={value => {
              setCode(value);
              setDirty(true);
            }}
            onError={message => showToast(message, true)}
            style={{ flexShrink: 0 }} />
        )}
        {view === 'design' && (styleTarget ? (
          <AiPrompt
            key="design"
            fileType="html"
            getContext={() => aiContextForFile(path, styleTarget.outerHTML)}
            getOldCode={() => styleTarget.outerHTML}
            session={path + ' element'}
            onResult={rewriteSelected}
            onError={message => showToast(message, true)}
            style={{ flexShrink: 0 }} />
        ) : (
          <p className="designer-note" style={{ flexShrink: 0, padding: '0 2px' }}>
            Select something on the canvas, and the Machine will change that.
          </p>
        ))}
        </div>

        <div
          className="designer-rail right"
          ref={node => node?.toggleAttribute('inert', view !== 'design')}>
          <Tabs
            tabs={[{ id: 'element', label: 'Element' }, { id: 'style', label: 'Style' }]}
            active={tab}
            onChange={setTab} />
          {tab === 'element' ? (
            <Inspector
              node={selected}
              doc={doc}
              onSetText={setText}
              onSetAttribute={setAttribute}
              onRemoveAttribute={removeAttribute}
              onSetClasses={setClasses}
              onSelect={setSelected}
              onDuplicate={duplicate}
              onDelete={remove}
              onMove={nudge}
              onAddText={addText}
              canAddText={!!elementOf(selected) && !isText(selected!) &&
                canContainChildren(elementOf(selected)!) &&
                designableChildren(elementOf(selected)!).length === 0} />
          ) : (
            <Styles
              element={styleTarget}
              onText={!!selected && isText(selected)}
              frameWindow={doc?.defaultView ?? null}
              selectors={selectors}
              target={target}
              overrides={overrides}
              stylesheet={cssPath}
              missing={cssMissing}
              onTarget={setTarget}
              onSet={setStyle} />
          )}
        </div>
      </div>
    </>
  );
}

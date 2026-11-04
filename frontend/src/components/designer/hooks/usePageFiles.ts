/*
 * The pages on the cloudlet and the files behind the one open here: listing
 * them, opening one, reading the stylesheets and scripts it links once the
 * canvas has it, and creating new pages and companion files.
 */

import { useEffect, useEffectEvent, useState } from 'react';

import { createFolder, loadFile, saveFile } from '../../../lib/api';
import { showError } from '../../../lib/errors';
import { showToast } from '../../../lib/toast';
import type { useDialog } from '../../../lib/useDialog';
import { ensureRequiredAssets } from '../assets';
import { joinCss, scriptPaths, splitCss, stylesheetPaths } from '../css';
import {
  canonicalUrl,
  companionFile,
  listPages,
  SHARED_ASSET_FILES,
  WEB_ROOT,
} from '../designerFiles';
import { prepareDocument, serializeDocument } from '../html';
import { blankPage } from '../pageUrls';
import { INLINE } from '../Styles';
import type { Cloudlet } from './useCloudlet';
import type { CodeDraft } from './useCodeDraft';
import type { DesignerUi } from './useDesignerUi';
import type { DocumentState } from './useDocumentState';
import type { StylesheetState } from './useStylesheetState';
import type { UndoHistory } from './useUndoHistory';

export function usePageFiles(o: {
  cloudlet: Pick<Cloudlet, 'origin' | 'pageKey'>;
  confirm: ReturnType<typeof useDialog>['confirm'];
  documentState: DocumentState;
  ui: Pick<DesignerUi, 'viewRef' | 'setCreating'>;
  codeDraft: Pick<CodeDraft, 'applyCode' | 'setCodeTarget'>;
  stylesheet: StylesheetState;
  undoHistory: UndoHistory;
}) {
  const { origin, pageKey } = o.cloudlet;
  const { confirm } = o;
  const {
    path,
    setPath,
    setSrcDoc,
    setBusy,
    dirty,
    setDirty,
    setStale,
    setVersion,
    setSelected,
    setHovered,
    setShell,
    docRef,
    setDoc,
  } = o.documentState;
  const { viewRef, setCreating } = o.ui;
  const { applyCode, setCodeTarget } = o.codeDraft;
  const {
    setSheets,
    setScripts,
    setCssPath,
    setCssOriginal,
    setCssHead,
    setCssTail,
    setOverrides,
    setTarget,
    setCssMissing,
  } = o.stylesheet;
  const { setHistory, setFuture, revisionRef, savedRevisionRef, revisionsRef, mutate } =
    o.undoHistory;

  const [pages, setPages] = useState<string[]>([]);

  /* -- Loading ------------------------------------------------------------ */

  async function loadPages() {
    const html = await listPages();
    setPages(html);
    return html;
  }

  async function openPage(file: string, force = false) {
    if (
      !force &&
      dirty &&
      !(await confirm({
        title: 'Discard unsaved changes?',
        message: 'The design changes to ' + path + ' have not been saved.',
        confirmText: 'Discard',
        danger: true,
      }))
    ) {
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
      setFuture([]);
      revisionRef.current = 0;
      savedRevisionRef.current = 0;
      revisionsRef.current = 0;
      savedRevisionRef.current = revisionRef.current;
      setDirty(false);
      setStale(false);
      setTarget(INLINE);
      setShell(false);
      setCodeTarget('');
      setSheets([]);
      setScripts([]);
      setCssPath(null);
      setCssOriginal('');
      setCssHead('');
      setCssTail('');
      setOverrides({});
      setCssMissing([]);
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  const openRememberedPage = useEffectEvent((html: string[]) => {
    /*
     * Back to whichever page was open last, rather than to whichever page
     * happens to sort first — which on a cloudlet serving a built app at
     * the root is its empty mount point, the one page with nothing to
     * design on it.
     */
    const remembered = localStorage.getItem(pageKey);
    void openPage(remembered && html.includes(remembered) ? remembered : html[0], true);
  });
  useEffect(() => {
    listPages()
      .then(html => {
        setPages(html);
        if (html.length > 0) {
          openRememberedPage(html);
        }
      })
      .catch((err: unknown) => showError(err));
    // Mount only — the page list is refreshed by hand and after a Chat Ops turn.
  }, []);

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
    setDoc(loaded);
    setVersion(current => current + 1);
    // Reloading the page underneath the code view has to refresh its text too.
    if (viewRef.current === 'code') {
      applyCode(serializeDocument(loaded));
    }
    /*
     * Whether anything at all renders without scripts. Asked of the document
     * rather than guessed from the markup: no text anywhere, and none of the
     * elements that show something without needing text.
     */
    setShell(
      loaded.body.textContent?.trim() === '' &&
        loaded.body.querySelectorAll('img, svg, video, canvas, input, textarea, iframe').length ===
          0,
    );
    // Resolved against the document's own base, so this cannot disagree with
    // how the browser just resolved the very same hrefs. The shared widget
    // runtime is excluded here, not just filtered out of the dropdown later —
    // it must never become [cssPath], the file the Style panel writes into.
    const linked = stylesheetPaths(loaded, loaded.baseURI).filter(
      file => !SHARED_ASSET_FILES.has(file),
    );
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
          /*
           * The baseline is what this file would be written as, NOT the text
           * it was read as. The block is parsed by the browser's own CSS
           * engine, which normalises what it reads — a colour written
           * #57c77e comes back as rgb(87, 199, 126) — so comparing a
           * re-emitted block against the original text reports a change on
           * every page that has one, before anybody has touched anything.
           *
           * Comparing like with like makes "has this changed" mean what it
           * says. The cost is that the first real save also normalises the
           * block, which is a region that announces it gets rewritten.
           */
          setCssOriginal(joinCss(split.head, split.overrides, split.tail));
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

    /*
     * Scripts are listed to be read as much as edited, so only the ones
     * actually on this cloudlet are offered — the rest cannot be fetched
     * through the file API whatever their tag says.
     */
    const running: string[] = [];
    for (const script of scriptPaths(loaded, loaded.baseURI)) {
      if (SHARED_ASSET_FILES.has(script)) {
        continue;
      }
      try {
        await loadFile(script);
        running.push(script);
      } catch {
        // Linked but not here. A visitor gets nothing from it either.
      }
    }
    setScripts(running);
  }

  /*
   * Writes a new page and opens it.
   *
   * Folders are never invented for you — "/pricing" is pricing.html and
   * nothing else — but a URL with steps in it still needs those steps to
   * exist, and a file write into a folder that is not there fails with an
   * error that says nothing useful. So each step is created first, in order.
   */
  async function createPage(
    file: string,
    copyFrom: string | null,
    companions: { css: boolean; js: boolean },
  ) {
    setCreating(false);
    setBusy(true);
    try {
      const folders = file
        .slice(WEB_ROOT.length + 1)
        .split('/')
        .slice(0, -1);
      let sofar = WEB_ROOT;
      for (const folder of folders) {
        sofar += '/' + folder;
        // Already there is the normal case and not a problem.
        await createFolder(sofar + '/').catch(() => undefined);
      }
      const url = file.slice(WEB_ROOT.length).replace(/\.html$/, '');
      const source = copyFrom ? await loadFile(copyFrom) : blankPage(url, companions);
      await saveFile(file, source);
      /*
       * Written after the page itself, and not fatal if either fails after
       * that — the page it was meant to accompany already exists, and a
       * stylesheet or script missing its file is no worse than one never
       * asked for, just a broken link worth noticing in the Style panel's
       * own "could not be read" notice rather than losing the page over it.
       */
      if (companions.css) {
        await saveFile(WEB_ROOT + url + '.css', '').catch(() => undefined);
      }
      if (companions.js) {
        await saveFile(WEB_ROOT + url + '.js', '').catch(() => undefined);
      }
      await loadPages();
      await openPage(file, true);
      showToast('Created ' + file);
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  /*
   * The retrofit for a page that did not get a script or stylesheet of its
   * own when it was created — the only way, otherwise, for one of those
   * pages to ever reach the App blocks, since the thing that would normally
   * supply the script is the very drop the missing script is disabling.
   */
  async function addCompanionFile(kind: 'js' | 'css') {
    const current = docRef.current;
    if (!current || !path) {
      return;
    }
    const file = companionFile(path, kind);
    const href = file.slice(WEB_ROOT.length);
    setBusy(true);
    try {
      await saveFile(file, '');
      mutate(() =>
        ensureRequiredAssets(
          current,
          kind === 'js' ? { scripts: [href] } : { stylesheets: [href] },
        ),
      );
      if (kind === 'js') {
        setScripts(list => [...list, file]);
      } else {
        /*
         * The menu item is enabled whenever this page has no stylesheet of
         * its OWN by this exact name yet — it may still link something else
         * entirely (another real sheet, or nothing). Either way the brand
         * new file becomes the one the Style panel writes into from here on:
         * without setting these too, the file exists and is linked, but the
         * panel would keep editing whatever it was pointed at before (or
         * keep offering only inline editing, if nothing), never the file
         * this action exists to create.
         */
        setSheets(list => [...list, file]);
        const split = splitCss('');
        setCssPath(file);
        setCssOriginal(joinCss(split.head, split.overrides, split.tail));
        setCssHead(split.head);
        setCssTail(split.tail);
        setOverrides(split.overrides);
        // Stale otherwise if the page's problem was an unreadable link rather than none at all.
        setCssMissing([]);
      }
      showToast('Created ' + file);
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  return { pages, loadPages, openPage, onReady, createPage, addCompanionFile };
}

export type PageFiles = ReturnType<typeof usePageFiles>;

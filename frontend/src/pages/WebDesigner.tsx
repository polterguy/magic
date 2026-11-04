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

import CanvasArea from '../components/designer/CanvasArea';
import DesignerDialogs from '../components/designer/DesignerDialogs';
import DesignerToolbar from '../components/designer/DesignerToolbar';
import { useCanvasEffects } from '../components/designer/hooks/useCanvasEffects';
import { useChatOpsReload } from '../components/designer/hooks/useChatOpsReload';
import { useCloudlet } from '../components/designer/hooks/useCloudlet';
import { useCodeDraft } from '../components/designer/hooks/useCodeDraft';
import { useCodeView } from '../components/designer/hooks/useCodeView';
import { useDesignerKeys } from '../components/designer/hooks/useDesignerKeys';
import { useDesignerUi } from '../components/designer/hooks/useDesignerUi';
import { useDocumentState } from '../components/designer/hooks/useDocumentState';
import { useElementEdits } from '../components/designer/hooks/useElementEdits';
import { usePageFiles } from '../components/designer/hooks/usePageFiles';
import { useSave } from '../components/designer/hooks/useSave';
import { useStyleEdits } from '../components/designer/hooks/useStyleEdits';
import { useStylesheetState } from '../components/designer/hooks/useStylesheetState';
import { useTreeEdits } from '../components/designer/hooks/useTreeEdits';
import { useUndoHistory } from '../components/designer/hooks/useUndoHistory';
import LeftRail from '../components/designer/LeftRail';
import RailToggle from '../components/designer/RailToggle';
import RightRail from '../components/designer/RightRail';
import { useUnsavedGuard } from '../lib/navGuard';
import { useDialog } from '../lib/useDialog';

/*
 * The page only wires its parts together. Each concern lives in a hook under
 * components/designer/hooks/, and is called here in the order the original
 * single component declared it, so the effects still run in that order:
 * the unsaved-changes guard, the undo coalescing reset, the first page load,
 * the Chat Ops listener, the canvas effects, and the keyboard last.
 */
export default function WebDesigner() {
  const { choice, confirm } = useDialog();
  const cloudlet = useCloudlet();
  const documentState = useDocumentState();
  const codeDraft = useCodeDraft();
  const ui = useDesignerUi();
  const stylesheet = useStylesheetState();
  const { path, dirty, selected, setSelected, doc } = documentState;
  const { origin } = cloudlet;
  const { view } = ui;

  useUnsavedGuard(dirty, 'Your design changes have not been saved.');

  const undoHistory = useUndoHistory(documentState, stylesheet);
  const { history, future, mutate, undo, redo } = undoHistory;

  const pageFiles = usePageFiles({
    cloudlet,
    confirm,
    documentState,
    ui,
    codeDraft,
    stylesheet,
    undoHistory,
  });
  const { pages, loadPages, openPage, onReady, createPage, addCompanionFile } = pageFiles;

  useChatOpsReload({ dirty, path, setStale: documentState.setStale, openPage, loadPages });

  const save = useSave({ view, documentState, codeDraft, stylesheet, undoHistory });
  const { switchCodeTarget, switchView } = useCodeView({
    origin,
    choice,
    save,
    ui,
    documentState,
    codeDraft,
    stylesheet,
    undoHistory,
  });

  const styleEdits = useStyleEdits({ documentState, stylesheet, mutate });
  const { styleTarget } = styleEdits;
  const elementEdits = useElementEdits({ origin, styleTarget, ui, documentState, mutate });
  const treeEdits = useTreeEdits({ clipKey: cloudlet.clipKey, documentState, mutate });

  const hidden = useCanvasEffects({ reveal: ui.reveal, documentState, stylesheet });

  const onKey = useDesignerKeys({
    setSelected,
    remove: treeEdits.remove,
    copy: treeEdits.copy,
    cut: treeEdits.cut,
    paste: treeEdits.paste,
    undo,
    redo,
    save,
  });

  /* -- Rendering ---------------------------------------------------------- */

  return (
    <>
      <DesignerToolbar
        path={path}
        pages={pages}
        stale={documentState.stale}
        view={view}
        onOpenPage={file => openPage(file)}
        onSwitchView={next => switchView(next)}
        onUndo={undo}
        canUndo={history.length !== 0}
        onRedo={redo}
        canRedo={future.length !== 0}
        menu={{
          viewport: ui.viewport,
          setViewport: ui.setViewport,
          setCreating: ui.setCreating,
          origin,
          path,
          busy: documentState.busy,
          scripts: stylesheet.scripts,
          sheets: stylesheet.sheets,
          openPage: file => void openPage(file),
          addCompanionFile: kind => void addCompanionFile(kind),
          reveal: ui.reveal,
          setReveal: ui.setReveal,
          view,
        }}
        onSave={save}
        dirty={dirty}
        saving={documentState.saving}
      />

      <DesignerDialogs
        choosingMedia={ui.choosingMedia}
        origin={origin}
        selected={selected}
        onPick={elementEdits.pickMedia}
        onCancelMedia={() => ui.setChoosingMedia(null)}
        creating={ui.creating}
        pages={pages}
        onCancelCreate={() => ui.setCreating(false)}
        onCreate={createPage}
      />

      <div className="designer-layout">
        <LeftRail
          railsShut={ui.railsShut}
          view={view}
          blockFilter={ui.blockFilter}
          onBlockFilter={ui.setBlockFilter}
          customTag={ui.customTag}
          onCustomTag={ui.setCustomTag}
          doc={doc}
          onPending={ui.setPending}
          selected={selected}
          hidden={hidden}
          setSelected={setSelected}
          setHovered={documentState.setHovered}
          setRevealHovered={documentState.setRevealHovered}
          setRevealSelected={documentState.setRevealSelected}
        />

        {/*
         * The handle sits between the rail and the canvas rather than inside
         * either, so it is reachable whether the rail is open or folded — a
         * button living in the thing it hides can only ever hide it.
         */}
        <RailToggle
          side="left"
          shut={ui.railsShut.left}
          showTitle="Show blocks and tree"
          hideTitle="Hide blocks and tree"
          onToggle={() => ui.toggleRail('left')}
        />

        <CanvasArea
          ui={ui}
          cloudlet={cloudlet}
          documentState={documentState}
          codeDraft={codeDraft}
          stylesheet={stylesheet}
          styleTarget={styleTarget}
          mutate={mutate}
          onReady={onReady}
          move={treeEdits.move}
          insert={elementEdits.insert}
          rewriteSelected={elementEdits.rewriteSelected}
          onKey={onKey}
          switchCodeTarget={switchCodeTarget}
          save={save}
        />

        <RailToggle
          side="right"
          shut={ui.railsShut.right}
          showTitle="Show properties"
          hideTitle="Hide properties"
          onToggle={() => ui.toggleRail('right')}
        />

        <RightRail
          railsShut={ui.railsShut}
          view={view}
          tab={ui.tab}
          setTab={ui.setTab}
          doc={doc}
          origin={origin}
          pages={pages}
          selected={selected}
          setSelected={setSelected}
          setRevealSelected={documentState.setRevealSelected}
          setChoosingMedia={ui.setChoosingMedia}
          target={stylesheet.target}
          setTarget={stylesheet.setTarget}
          overrides={stylesheet.overrides}
          cssPath={stylesheet.cssPath}
          cssMissing={stylesheet.cssMissing}
          elementEdits={elementEdits}
          treeEdits={treeEdits}
          styleEdits={styleEdits}
        />
      </div>
    </>
  );
}

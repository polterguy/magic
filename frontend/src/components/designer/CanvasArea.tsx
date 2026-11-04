import { aiContextForFile } from '../../lib/api';
import { showToast } from '../../lib/toast';
import AiPrompt from '../AiPrompt';
import Canvas from './Canvas';
import CodePane from './CodePane';
import type { DropSpot } from './dropTarget';
import type { Cloudlet } from './hooks/useCloudlet';
import type { CodeDraft } from './hooks/useCodeDraft';
import type { DesignerUi } from './hooks/useDesignerUi';
import type { DocumentState } from './hooks/useDocumentState';
import type { StylesheetState } from './hooks/useStylesheetState';
import type { UndoHistory } from './hooks/useUndoHistory';
import LivePane from './LivePane';
import { writeText } from './nodes';
import { reportDropped } from './slotWarning';
import { INLINE } from './Styles';

// The middle column: the canvas, the code view or the live view, and the prompt bar under them.
export default function CanvasArea(
  props: Readonly<{
    ui: Pick<DesignerUi, 'view' | 'width' | 'pending' | 'setPending' | 'tab' | 'setCreating'>;
    cloudlet: Pick<
      Cloudlet,
      'origin' | 'sameOrigin' | 'liveWarned' | 'warnedKey' | 'setLiveWarned'
    >;
    documentState: Pick<
      DocumentState,
      | 'path'
      | 'srcDoc'
      | 'selected'
      | 'setSelected'
      | 'hovered'
      | 'setHovered'
      | 'version'
      | 'revealHovered'
      | 'revealSelected'
      | 'shell'
      | 'setDirty'
    >;
    codeDraft: Pick<CodeDraft, 'code' | 'setCode' | 'codeTarget' | 'codeEditId' | 'bumpCodeEditId'>;
    stylesheet: Pick<StylesheetState, 'sheets' | 'scripts' | 'cssPath' | 'target'>;
    styleTarget: Element | null;
    mutate: UndoHistory['mutate'];
    onReady: (loaded: Document) => Promise<void>;
    move: (node: Node, spot: DropSpot) => void;
    insert: (block: NonNullable<DesignerUi['pending']>, spot: DropSpot) => void;
    rewriteSelected: (html: string) => void;
    onKey: (event: KeyboardEvent) => void;
    switchCodeTarget: (file: string) => Promise<void>;
    save: () => Promise<boolean>;
  }>,
) {
  const { view, width, pending, setPending, tab, setCreating } = props.ui;
  const { origin, sameOrigin, liveWarned, warnedKey, setLiveWarned } = props.cloudlet;
  const {
    path,
    srcDoc,
    selected,
    setSelected,
    hovered,
    setHovered,
    version,
    revealHovered,
    revealSelected,
    shell,
    setDirty,
  } = props.documentState;
  const { code, setCode, codeTarget, codeEditId, bumpCodeEditId } = props.codeDraft;
  const { sheets, scripts, cssPath, target } = props.stylesheet;
  const { styleTarget, mutate, onReady, move, insert, rewriteSelected, onKey, save } = props;
  return (
    <div className="designer-middle">
      {/*
       * An empty srcDoc still parses as a tiny, valid, totally blank HTML
       * document — which is indistinguishable from a real page whose body
       * is a compiled app's empty mount point, the one case this canvas
       * already has a message for. Without this, "no page is open" and
       * "a page is open and it happens to render nothing" looked
       * identical, and only one of those is actually true here.
       */}
      {!path && (
        <div className="designer-empty" style={{ margin: 'auto', textAlign: 'center' }}>
          <p>This cloudlet serves no pages yet.</p>
          <button className="btn" onClick={() => setCreating(true)}>
            Create the first one…
          </button>
        </div>
      )}
      {path && view === 'code' && (
        <CodePane
          path={path}
          codeTarget={codeTarget}
          sheets={sheets}
          scripts={scripts}
          cssPath={cssPath}
          code={code}
          codeEditId={codeEditId}
          setCode={setCode}
          setDirty={setDirty}
          switchCodeTarget={props.switchCodeTarget}
          save={save}
        />
      )}
      {path && view === 'live' && (
        <LivePane
          path={path}
          origin={origin}
          width={width}
          sameOrigin={sameOrigin}
          liveWarned={liveWarned}
          warnedKey={warnedKey}
          setLiveWarned={setLiveWarned}
        />
      )}
      {path && (
        <Canvas
          srcDoc={srcDoc}
          width={width}
          selected={selected}
          hovered={hovered}
          version={version}
          inserting={pending !== null}
          revealHovered={revealHovered}
          revealSelected={revealSelected}
          note={
            shell
              ? 'This page draws nothing by itself — its interface is built by ' +
                'JavaScript, which the canvas does not run. That is what makes ' +
                'everything else here safe to edit, and it means a compiled app ' +
                'like this one has nothing on it to design. Its markup is still ' +
                'yours to edit in Hyper IDE.'
              : null
          }
          onReady={onReady}
          /*
           * Only while the Style tab is showing a stylesheet selector.
           * Outlining matches when nobody is choosing one would be noise
           * over the page rather than an answer to a question.
           */
          highlight={tab === 'style' && target !== INLINE ? target : ''}
          onHover={setHovered}
          onSelect={setSelected}
          onMove={move}
          onInsert={spot => {
            if (pending) {
              insert(pending, spot);
            }
          }}
          onPendingDone={() => setPending(null)}
          onEditText={(node, text) => {
            reportDropped(node.data, text);
            mutate(() => writeText(node, text));
          }}
          onKey={onKey}
          hidden={view !== 'design'}
        />
      )}

      {/*
       * One prompt bar for the middle column, pointed at whatever is being
       * edited: the file in the code view, the selected element in the
       * design view. Not shown over Live, which is a real page on another
       * origin and not ours to rewrite.
       */}
      {path && view === 'code' && (
        <AiPrompt
          key={'code:' + (codeTarget || path)}
          fileType={(codeTarget || path).endsWith('.css') ? 'css' : 'html'}
          getContext={() => aiContextForFile(codeTarget || path, code)}
          getOldCode={() => code}
          session={codeTarget || path}
          onResult={value => {
            setCode(value);
            bumpCodeEditId();
            setDirty(true);
          }}
          onError={message => showToast(message, true)}
          style={{ flexShrink: 0 }}
        />
      )}
      {path &&
        view === 'design' &&
        (styleTarget ? (
          <AiPrompt
            key="design"
            fileType="html"
            getContext={() => aiContextForFile(path, styleTarget.outerHTML)}
            getOldCode={() => styleTarget.outerHTML}
            session={path + ' element'}
            onResult={rewriteSelected}
            onError={message => showToast(message, true)}
            style={{ flexShrink: 0 }}
          />
        ) : (
          <p className="designer-note" style={{ flexShrink: 0, padding: '0 2px' }}>
            Select something on the canvas, and the Machine will change that.
          </p>
        ))}
    </div>
  );
}

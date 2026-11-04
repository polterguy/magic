import type { Dispatch, SetStateAction } from 'react';
import Tabs from '../Tabs';
import Inspector from './Inspector';
import Meta from './Meta';
import Quality from './Quality';
import Styles from './Styles';
import Website from './Website';
import { canContainChildren } from './html';
import { canonicalUrl } from './designerFiles';
import { railClass } from './layout';
import type { Home } from './metaTags';
import type { MediaKind } from './mediaKinds';
import { designableChildren, elementOf, isText } from './nodes';
import type { Overrides } from './css';
import type { useElementEdits } from './hooks/useElementEdits';
import type { useStyleEdits } from './hooks/useStyleEdits';
import type { useTreeEdits } from './hooks/useTreeEdits';

// The right rail: the tabs of properties for the selection, the page and the site.
export default function RightRail(
  props: Readonly<{
    railsShut: Record<'left' | 'right', boolean>;
    view: string;
    tab: string;
    setTab: (tab: string) => void;
    doc: Document | null;
    origin: string;
    pages: string[];
    selected: Node | null;
    setSelected: (node: Node | null) => void;
    setRevealSelected: Dispatch<SetStateAction<number>>;
    setChoosingMedia: (choosing: { kind: MediaKind; home?: Home }) => void;
    target: string;
    setTarget: (target: string) => void;
    overrides: Overrides;
    cssPath: string | null;
    cssMissing: string[];
    elementEdits: ReturnType<typeof useElementEdits>;
    treeEdits: ReturnType<typeof useTreeEdits>;
    styleEdits: ReturnType<typeof useStyleEdits>;
  }>,
) {
  const {
    view,
    tab,
    setTab,
    doc,
    origin,
    pages,
    selected,
    setSelected,
    setRevealSelected,
    setChoosingMedia,
    target,
    setTarget,
    overrides,
    cssPath,
    cssMissing,
  } = props;
  const {
    setText,
    setAttribute,
    removeAttribute,
    setClasses,
    addText,
    wrap,
    unwrap,
    changeTag,
    setMeta,
  } = props.elementEdits;
  const { duplicate, remove, nudge } = props.treeEdits;
  const { styleTarget, selectors, setStyle, editRule, removeRule } = props.styleEdits;

  // What the right rail shows, according to its selected tab.
  function rightPanel() {
    switch (tab) {
      case 'element':
        return (
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
            canAddText={
              !!elementOf(selected) &&
              !isText(selected!) &&
              canContainChildren(elementOf(selected)!) &&
              designableChildren(elementOf(selected)!).length === 0
            }
            origin={origin}
            onChooseMedia={kind => setChoosingMedia({ kind })}
            onWrap={wrap}
            onUnwrap={unwrap}
            onChangeTag={changeTag}
            urls={pages.map(canonicalUrl)}
          />
        );
      case 'meta':
        return (
          <Meta
            doc={doc}
            origin={origin}
            urls={pages.map(canonicalUrl)}
            onSet={setMeta}
            onChooseImage={home => setChoosingMedia({ kind: 'image', home })}
          />
        );
      case 'quality':
        return (
          <Quality
            doc={doc}
            urls={pages.map(canonicalUrl)}
            /*
             * Selecting is not enough when the finding is four screens
             * down: the canvas is brought to it as well, the same way a
             * double click in the tree does. Only while the design view is
             * showing, since there is nothing to scroll otherwise.
             */
            onSelect={node => {
              setSelected(node);
              if (view === 'design') {
                setRevealSelected(value => value + 1);
              }
            }}
          />
        );
      case 'website':
        return <Website urls={pages.map(canonicalUrl)} />;
      default:
        return (
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
            onSet={setStyle}
            onEditRule={editRule}
            onRemoveRule={removeRule}
          />
        );
    }
  }

  return (
    <div
      className={railClass('right', props.railsShut)}
      ref={node => {
        node?.toggleAttribute('inert', view !== 'design');
      }}
    >
      <Tabs
        tabs={[
          { id: 'element', label: 'Element' },
          { id: 'style', label: 'Style' },
          { id: 'meta', label: 'Page' },
          { id: 'quality', label: 'Quality' },
          { id: 'website', label: 'Website' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {rightPanel()}
    </div>
  );
}

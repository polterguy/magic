import type { Dispatch, SetStateAction } from 'react';
import BlockPalette from './BlockPalette';
import Layers from './Layers';
import { railClass } from './layout';
import type { Block } from './palette';

// The left rail: the blocks to drag onto the page, and the tree of what is on it.
export default function LeftRail(
  props: Readonly<{
    railsShut: Record<'left' | 'right', boolean>;
    view: string;
    blockFilter: string;
    onBlockFilter: (filter: string) => void;
    customTag: string;
    onCustomTag: (tag: string) => void;
    doc: Document | null;
    onPending: (block: Block) => void;
    selected: Node | null;
    hidden: Set<Element>;
    setSelected: (node: Node | null) => void;
    setHovered: (node: Node | null) => void;
    setRevealHovered: Dispatch<SetStateAction<number>>;
    setRevealSelected: Dispatch<SetStateAction<number>>;
  }>,
) {
  const { view, doc, selected, setSelected, setHovered, setRevealHovered, setRevealSelected } =
    props;
  return (
    <>
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
        className={railClass('left', props.railsShut)}
        ref={node => {
          node?.toggleAttribute('inert', view !== 'design');
        }}
      >
        <div className="designer-section">
          <h3>Blocks</h3>
          <p className="designer-note">
            Drag onto the page. Each one arrives wearing the classes this page already puts on that
            kind of element.
          </p>
          <BlockPalette
            filter={props.blockFilter}
            onFilter={props.onBlockFilter}
            customTag={props.customTag}
            onCustomTag={props.onCustomTag}
            disabled={view !== 'design' || !doc}
            onPending={props.onPending}
          />
        </div>
        <div className="designer-section grow">
          <h3>Tree</h3>
          <Layers
            root={doc?.body ?? null}
            selected={selected}
            hidden={props.hidden}
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
            }}
          />
        </div>
      </div>
    </>
  );
}

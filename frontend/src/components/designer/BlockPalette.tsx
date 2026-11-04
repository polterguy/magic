import SearchInput from '../SearchInput';
import { Block, customBlock, GROUPS } from './palette';

// The blocks that can be dragged onto the page, filtered or by drawer, and any other tag.
export default function BlockPalette(
  props: Readonly<{
    filter: string;
    onFilter: (filter: string) => void;
    customTag: string;
    onCustomTag: (tag: string) => void;
    disabled: boolean;
    onPending: (block: Block) => void;
  }>,
) {
  return (
    <>
      <SearchInput
        placeholder="Filter blocks…"
        value={props.filter}
        onChange={props.onFilter}
        style={{ width: '100%' }}
      />
      {(() => {
        /*
         * A block whose runtime depends on a script used to be withheld
         * until the page already had one, any one — a stand-in for "has
         * this page opted into JavaScript at all". That stopped making
         * sense once ensureWidgetAssets() could create the specific
         * file a block actually needs: dropping an App block already
         * guarantees it ends up with exactly what it requires, so there
         * was nothing left for the gate to protect against, only a page
         * that could not use a widget without first being given an
         * empty, otherwise unused script file just to unlock it.
         */
        const pill = (block: Block) => (
          <button
            key={block.key}
            className="designer-block"
            disabled={props.disabled}
            title={'Drag a ' + block.label.toLowerCase() + ' onto the page'}
            onMouseDown={event => {
              event.preventDefault();
              props.onPending(block);
            }}
          >
            {block.label}
          </button>
        );
        const needle = props.filter.trim().toLowerCase();
        /*
         * Filtering flattens the groups. Once you are searching, which
         * drawer a tag lives in is exactly what you did not want to
         * think about.
         */
        if (needle !== '') {
          const hits = GROUPS.flatMap(group => group.blocks).filter(
            block => block.label.toLowerCase().includes(needle) || block.key.includes(needle),
          );
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
          value={props.customTag}
          onChange={event => props.onCustomTag(event.target.value)}
        />
        {customBlock(props.customTag) && (
          <div className="designer-palette">
            {[customBlock(props.customTag)!].map(block => (
              <button
                key={block.key}
                className="designer-block"
                disabled={props.disabled}
                title={'Drag a ' + block.label + ' onto the page'}
                onMouseDown={event => {
                  event.preventDefault();
                  props.onPending(block);
                }}
              >
                {block.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/*
 * The Inspector wired like the designer wires it: every edit callback is a spy and, when
 * `live` is set, also lands on the node and re-renders the panel.
 */
import { useReducer } from 'react';

import Inspector from '../Inspector';
import type { Options, Spies } from './inspectorHarness';

// replaceData, not an assignment to data, so the edited words are not written as a node's data in one step.
function setData(text: Text, value: string) {
  text.replaceData(0, text.length, value);
}

export default function InspectorPanel(
  props: Readonly<{ node: Node | null; doc: Document | null; s: Spies; o: Options }>,
) {
  // Only there to render again once an edit has landed on the node.
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const { node, doc, s, o } = props;
  const live = o.live ?? false;
  const element = node as Element;
  return (
    <Inspector
      node={node}
      doc={doc}
      origin={o.origin ?? 'https://cloudlet.test'}
      urls={o.urls ?? []}
      canAddText={o.canAddText ?? false}
      onSetText={text => {
        s.onSetText(text);
        if (live) {
          setData(node as Text, text);
          bump();
        }
      }}
      onSetAttribute={(name, value) => {
        s.onSetAttribute(name, value);
        if (live) {
          element.setAttribute(name, value);
          bump();
        }
      }}
      onRemoveAttribute={name => {
        s.onRemoveAttribute(name);
        if (live) {
          element.removeAttribute(name);
          bump();
        }
      }}
      onSetClasses={classes => {
        s.onSetClasses(classes);
        if (live) {
          element.setAttribute('class', classes.join(' '));
          bump();
        }
      }}
      onSelect={s.onSelect}
      onDuplicate={s.onDuplicate}
      onDelete={s.onDelete}
      onMove={s.onMove}
      onAddText={s.onAddText}
      onChooseMedia={s.onChooseMedia}
      onWrap={s.onWrap}
      onUnwrap={s.onUnwrap}
      onChangeTag={s.onChangeTag}
    />
  );
}

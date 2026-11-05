/*
 * The Inspector wired like the designer wires it: every edit callback is a spy and, when
 * `live` is set, also lands on the node and re-renders the panel.
 */
import { useState } from 'react';

import Inspector from '../Inspector';
import type { Options, Spies } from './inspectorHarness';

function setData(text: Text, value: string) {
  text.data = value;
}

export default function InspectorPanel(
  props: Readonly<{ node: Node | null; doc: Document | null; s: Spies; o: Options }>,
) {
  const [, bump] = useState(0);
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
          bump(n => n + 1);
        }
      }}
      onSetAttribute={(name, value) => {
        s.onSetAttribute(name, value);
        if (live) {
          element.setAttribute(name, value);
          bump(n => n + 1);
        }
      }}
      onRemoveAttribute={name => {
        s.onRemoveAttribute(name);
        if (live) {
          element.removeAttribute(name);
          bump(n => n + 1);
        }
      }}
      onSetClasses={classes => {
        s.onSetClasses(classes);
        if (live) {
          element.setAttribute('class', classes.join(' '));
          bump(n => n + 1);
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

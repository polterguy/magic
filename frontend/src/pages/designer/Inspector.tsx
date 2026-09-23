/*
 * What the selected node is.
 *
 * A run of text has words and nothing else — no classes, no attributes, no
 * styles of its own. An element has all of those and no words, because its
 * words are its children. Two shapes, one panel, and neither pretends to be
 * the other.
 *
 * Classes get first-class treatment rather than being one more row in the
 * attribute list, because on these pages a class IS the design. Adding
 * "primary" to a button is how a button is restyled here, so the classes the
 * page already uses are offered as suggestions.
 */

import { useState } from 'react';
import { CopyIcon, TrashIcon } from '../../components/Icons';
import { isText, labelOf } from './nodes';

// Attributes with a control of their own, or that belong to the designer.
const OWN = ['class', 'id', 'style', 'contenteditable'];

function allClasses(doc: Document) {
  const found = new Set<string>();
  doc.body.querySelectorAll('[class]').forEach(element => {
    element.getAttribute('class')?.trim().split(/\s+/).forEach(name => {
      if (name) {
        found.add(name);
      }
    });
  });
  return Array.from(found).sort();
}

function classesOf(element: Element) {
  return (element.getAttribute('class') ?? '').trim().split(/\s+/).filter(Boolean);
}

export default function Inspector(props: {
  node: Node | null;
  doc: Document | null;
  onSetText: (text: string) => void;
  onSetAttribute: (name: string, value: string) => void;
  onRemoveAttribute: (name: string) => void;
  onSetClasses: (classes: string[]) => void;
  onSelect: (node: Node) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  // Offered when an element holds nothing at all, so words can go back in.
  onAddText: () => void;
  canAddText: boolean;
}) {

  const [newClass, setNewClass] = useState('');
  const [newAttribute, setNewAttribute] = useState('');
  /*
   * What is being typed into the text box, while it is being typed.
   *
   * The box cannot simply show the node's text, because that text is trimmed
   * for display — and a trimmed value re-rendered on every keystroke eats the
   * space you just typed, so a second word could only be added by typing it
   * and then going back for the space. While the box has focus it shows what
   * was typed; when it loses focus it reads the node again, so an edit made
   * anywhere else still shows up here.
   */
  const [typing, setTyping] = useState<{ owner: Node; value: string } | null>(null);

  const node = props.node;
  if (!node || !props.doc) {
    return (
      <p className="designer-empty">
        Select something on the canvas, or in the tree, to edit it.
      </p>
    );
  }

  /*
   * The ancestors, minus the span the canvas wraps a run in while it is being
   * typed into. That wrapper is scaffolding and lasts only as long as the
   * edit; listing it as an ancestor invites exactly the question of whether
   * something appeared in the markup.
   */
  const chain: Node[] = [];
  for (let parent = node.parentNode; parent && parent.nodeName !== '#document';
       parent = parent.parentNode) {
    if (!(parent as Element).hasAttribute?.('data-magic-editing')) {
      chain.unshift(parent);
    }
  }

  const actions = (
    <div className="designer-actions">
      <button
        className="btn btn-secondary btn-small"
        title="Move up among its siblings"
        onClick={() => props.onMove(-1)}>
        Up
      </button>
      <button
        className="btn btn-secondary btn-small"
        title="Move down among its siblings"
        onClick={() => props.onMove(1)}>
        Down
      </button>
      <button
        className="btn btn-secondary btn-small"
        title="Insert a copy right after this one"
        onClick={props.onDuplicate}>
        <CopyIcon />
        Duplicate
      </button>
      <button
        className="btn btn-danger btn-small"
        title="Remove this and everything in it"
        onClick={props.onDelete}>
        <TrashIcon />
        Delete
      </button>
      {props.canAddText && (
        <button
          className="btn btn-secondary btn-small"
          title="Give this element some words to hold"
          onClick={props.onAddText}>
          Add #text
        </button>
      )}
    </div>
  );

  const crumbs = (
    <div className="designer-crumbs">
      {chain.map((parent, index) => (
        <button
          key={index}
          className="designer-crumb"
          title={'Select this ' + labelOf(parent)}
          onClick={() => props.onSelect(parent)}>
          {labelOf(parent)}
        </button>
      ))}
      <span className="designer-crumb current">{labelOf(node)}</span>
    </div>
  );

  /*
   * The identity and attributes of an element — shown for an element that was
   * selected directly, and equally for the element around a selected run of
   * text. Reaching them should not cost a trip up the breadcrumb just because
   * the thing you clicked was the words rather than the box around them.
   *
   * The ACTIONS deliberately do not follow the same rule. They stay on the
   * selection, because Up, Duplicate and above all Delete retargeting quietly
   * is how an entire heading gets deleted by someone who meant to delete a
   * word. Styles may resolve upward because nothing there can destroy
   * anything; this cannot.
   */
  function elementFields(element: Element) {
    const classes = classesOf(element);
    const attributes = Array.from(element.attributes)
      .filter(attribute => !OWN.includes(attribute.name) &&
        !attribute.name.startsWith('data-magic-'));

    function addClass(name: string) {
      const trimmed = name.trim().replace(/^\./, '');
      if (trimmed === '' || classes.includes(trimmed)) {
        return;
      }
      props.onSetClasses([...classes, trimmed]);
      setNewClass('');
    }

    return (
      <>
        <label className="designer-field">
          <span>Id</span>
          <input
            type="text"
            value={element.id}
            placeholder="None"
            onChange={event => props.onSetAttribute('id', event.target.value)} />
        </label>

        <div className="designer-field">
          <span>Classes</span>
          <div className="designer-chips">
            {classes.map(name => (
              <button
                key={name}
                className="designer-chip"
                title={'Remove ' + name}
                onClick={() => props.onSetClasses(classes.filter(other => other !== name))}>
                {name}
                <em>&times;</em>
              </button>
            ))}
            {classes.length === 0 && <span className="designer-muted">No classes</span>}
          </div>
          <input
            type="text"
            list="designer-classes"
            placeholder="Add a class…"
            value={newClass}
            onChange={event => setNewClass(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addClass(newClass);
              }
            }}
            onBlur={() => addClass(newClass)} />
          <datalist id="designer-classes">
            {allClasses(props.doc!).map(name => <option key={name} value={name} />)}
          </datalist>
        </div>

        <div className="designer-field">
          <span>Attributes</span>
          {attributes.map(attribute => (
            <div className="designer-attribute" key={attribute.name}>
              <label title={attribute.name}>{attribute.name}</label>
              <input
                type="text"
                value={attribute.value}
                onChange={event => props.onSetAttribute(attribute.name, event.target.value)} />
              <button
                className="icon-btn"
                title={'Remove ' + attribute.name}
                onClick={() => props.onRemoveAttribute(attribute.name)}>
                <TrashIcon />
              </button>
            </div>
          ))}
          {attributes.length === 0 && <span className="designer-muted">No attributes</span>}
          <input
            type="text"
            placeholder="Add an attribute…"
            value={newAttribute}
            onChange={event => setNewAttribute(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && newAttribute.trim() !== '') {
                event.preventDefault();
                props.onSetAttribute(newAttribute.trim(), '');
                setNewAttribute('');
              }
            }} />
        </div>
      </>
    );
  }

  /* -- A run of text ------------------------------------------------------ */

  if (isText(node)) {
    const parent = node.parentElement;
    return (
      <div className="designer-fields">
        {crumbs}
        {actions}
        <label className="designer-field">
          {/* Named as the DOM names it, so it reads as a different kind of
              thing from the element fields rather than as one more property. */}
          <span>#text</span>
          <textarea
            rows={4}
            value={typing?.owner === node ? typing.value : node.data.trim()}
            placeholder="Empty"
            onChange={event => {
              setTyping({ owner: node, value: event.target.value });
              props.onSetText(event.target.value);
            }}
            onBlur={() => setTyping(null)} />
        </label>
        {parent && (
          <>
            <div className="designer-owner">
              <span>Inside</span>
              <button
                className="designer-crumb"
                title="Select it, so the buttons above act on it"
                onClick={() => props.onSelect(parent)}>
                {labelOf(parent)}
              </button>
            </div>
            {elementFields(parent)}
          </>
        )}
      </div>
    );
  }

  /* -- An element --------------------------------------------------------- */

  return (
    <div className="designer-fields">
      {crumbs}
      {actions}
      {elementFields(node as Element)}
    </div>
  );
}

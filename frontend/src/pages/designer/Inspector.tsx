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
import { KIND_FOR_TAG } from './Media';

// Attributes with a control of their own, or that belong to the designer.
const OWN = ['class', 'id', 'style', 'contenteditable'];

/*
 * What an element can become. Deliberately not every tag there is — these are
 * the ones people actually swap between, and a list you can read beats a list
 * that is complete.
 */
const TAGS = [
  'div', 'section', 'article', 'header', 'footer', 'nav', 'aside', 'main', 'figure',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'pre',
  'a', 'span', 'strong', 'em', 'code', 'small', 'label', 'button',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'tr', 'td', 'th',
];

/*
 * Whether a browser will read this as a tag rather than as text. Letters to
 * begin with, then letters, digits or hyphens — which is also what lets a
 * custom element like my-widget through, since the page may well contain one.
 */
function isTagName(tag: string) {
  return /^[a-z][a-z0-9-]*$/.test(tag);
}

// Tags that hold the document together. Turning something into one of these
// produces markup the parser will rearrange, so they are not offered.
const STRUCTURAL = ['html', 'head', 'body'];

/*
 * Attribute names worth suggesting, by the tag they belong to, with the ones
 * that apply anywhere after them. Typing is still allowed — this is a list of
 * suggestions, not a list of permissions, because the whole point of the field
 * is that the designer does not decide what your markup may contain.
 */
const ANY_TAG = ['title', 'hidden', 'lang', 'dir', 'tabindex', 'role', 'aria-label'];

const PER_TAG: Record<string, string[]> = {
  a: ['href', 'target', 'rel', 'download', 'hreflang'],
  img: ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'srcset', 'sizes'],
  video: ['src', 'poster', 'controls', 'autoplay', 'loop', 'muted', 'preload', 'playsinline', 'width', 'height'],
  audio: ['src', 'controls', 'autoplay', 'loop', 'muted', 'preload'],
  source: ['src', 'type', 'srcset', 'media'],
  input: ['type', 'name', 'value', 'placeholder', 'required', 'disabled', 'readonly', 'checked', 'min', 'max', 'step', 'pattern', 'autocomplete'],
  textarea: ['name', 'rows', 'cols', 'placeholder', 'required', 'disabled', 'maxlength'],
  select: ['name', 'required', 'disabled', 'multiple', 'size'],
  option: ['value', 'selected', 'disabled'],
  button: ['type', 'name', 'value', 'disabled', 'form'],
  form: ['action', 'method', 'enctype', 'target', 'novalidate'],
  label: ['for'],
  td: ['colspan', 'rowspan', 'headers'],
  th: ['colspan', 'rowspan', 'scope', 'abbr'],
  ol: ['start', 'reversed', 'type'],
  iframe: ['src', 'title', 'width', 'height', 'loading', 'allow', 'sandbox'],
  details: ['open'],
  time: ['datetime'],
  meta: ['name', 'content', 'property', 'charset'],
  link: ['rel', 'href', 'type', 'media'],
  script: ['src', 'type', 'defer', 'async'],
};

// Attributes an element could still be given, in the order worth offering them.
function suggestedAttributes(element: Element) {
  const tag = element.tagName.toLowerCase();
  const already = Array.from(element.attributes).map(attribute => attribute.name);
  return [...(PER_TAG[tag] ?? []), ...ANY_TAG]
    .filter(name => !already.includes(name) && !OWN.includes(name));
}

// Attributes that hold a URL into this same site, so the pages can be offered.
const LINKS = ['href', 'action', 'formaction'];

const mediaLabel = { image: 'Image', video: 'Video', audio: 'Audio' } as const;
const mediaArticle = { image: 'an image', video: 'a video', audio: 'an audio file' } as const;

/*
 * The classes to offer, with the ones that belong here first.
 *
 * Which classes suit which elements is not in the stylesheet — a rule is
 * written `.btn`, not `a.btn`, so the CSS cannot say what a class is for. The
 * document can: whatever tags already wear a class is a plain statement of
 * what it is used on, and on a real page that is close to unambiguous.
 *
 * Ordered, never filtered. A class this tag has not worn yet is still a class
 * you might reasonably want — .btn belongs on a <button> even on a page whose
 * buttons all happen to be anchors — so the relevant ones come first and the
 * rest come after, rather than disappearing.
 */
function classSuggestions(doc: Document, element: Element) {
  const worn = new Map<string, Set<string>>();
  doc.body.querySelectorAll('[class]').forEach(other => {
    const tag = other.tagName.toLowerCase();
    other.getAttribute('class')?.trim().split(/\s+/).forEach(name => {
      if (name) {
        worn.set(name, (worn.get(name) ?? new Set()).add(tag));
      }
    });
  });
  const here = element.tagName.toLowerCase();
  const names = Array.from(worn.keys()).sort();
  return [
    ...names.filter(name => worn.get(name)!.has(here)),
    ...names.filter(name => !worn.get(name)!.has(here)),
  ];
}

/*
 * What to show in the preview for a given src.
 *
 * A data URI and a remote URL already say where they live. A root-absolute
 * path is relative to the cloudlet, so it needs the origin in front of it to
 * load inside the dashboard. Anything else is relative to the page, which the
 * dashboard cannot resolve on the page's behalf, so it is left alone and
 * simply fails to load — visibly, which is the honest outcome.
 */
function sourceFor(src: string, origin: string) {
  return src.startsWith('/') ? origin + src : src;
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
  // Absolute origin of the cloudlet, so a preview loads from where the page will.
  origin: string;
  onChooseMedia: (kind: 'image' | 'video' | 'audio') => void;
  onWrap: () => void;
  onUnwrap: () => void;
  onChangeTag: (tag: string) => void;
  // Every page this site serves, for the attributes that link to one.
  urls: string[];
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
  /*
   * The tag being typed, and whether the last attempt to leave the field was
   * refused. Committing on every keystroke would rebuild the element once per
   * character — "section" would pass through "s", "se", "sec" — so the change
   * waits for Enter or for the field to lose focus.
   */
  const [tagDraft, setTagDraft] = useState<{ owner: Element; value: string } | null>(null);
  const [badTag, setBadTag] = useState(false);

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
        className="btn btn-secondary btn-small"
        title="Put a new element around this one"
        onClick={props.onWrap}>
        Wrap
      </button>
      {!isText(node) && (
        <button
          className="btn btn-secondary btn-small"
          title="Remove this element and keep what is inside it"
          onClick={props.onUnwrap}>
          Unwrap
        </button>
      )}
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
    const mediaKind = KIND_FOR_TAG[element.tagName.toLowerCase()];
    const src = element.getAttribute('src');
    const source = src ? sourceFor(src, props.origin) : null;
    const attributes = Array.from(element.attributes)
      .filter(attribute => !OWN.includes(attribute.name) &&
        !attribute.name.startsWith('data-magic-'));

    /*
     * Applied when the field is left, not while it is being typed into. A
     * name the parser would not accept keeps what was typed and marks the
     * field, because silently putting the old tag back is how you lose a
     * typo you were halfway through fixing.
     */
    function commitTag(target: Element) {
      if (!tagDraft || tagDraft.owner !== target) {
        return;
      }
      const tag = tagDraft.value.trim().toLowerCase();
      if (tag === target.tagName.toLowerCase()) {
        setTagDraft(null);
        setBadTag(false);
        return;
      }
      if (!isTagName(tag) || STRUCTURAL.includes(tag)) {
        setBadTag(true);
        return;
      }
      setTagDraft(null);
      setBadTag(false);
      props.onChangeTag(tag);
    }

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
          <span>Tag</span>
          {/*
            * Changing this keeps the attributes and the children — only the
            * tag is different afterwards. The list is a set of suggestions
            * rather than the permitted set: anything the parser will accept
            * can be typed, custom elements included.
            */}
          <input
            type="text"
            list="designer-tags"
            className={badTag ? 'invalid' : undefined}
            value={tagDraft?.owner === element
              ? tagDraft.value
              : element.tagName.toLowerCase()}
            onChange={event => {
              setTagDraft({ owner: element, value: event.target.value });
              setBadTag(false);
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitTag(element);
              }
            }}
            onBlur={() => commitTag(element)} />
          <datalist id="designer-tags">
            {TAGS.map(tag => <option key={tag} value={tag} />)}
          </datalist>
        </label>

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
            {classSuggestions(props.doc!, element).map(name => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        {mediaKind && (
          <div className="designer-field">
            <span>{mediaLabel[mediaKind]}</span>
            {/*
              * The preview is the element's own source resolved against the
              * cloudlet, so a path that is wrong here is wrong on the page
              * too — which is the fastest way to notice it.
              */}
            <button
              className="designer-image-preview"
              title={'Choose ' + mediaArticle[mediaKind]}
              onClick={() => props.onChooseMedia(mediaKind)}>
              {source === null
                ? <span className="designer-muted">Nothing chosen</span>
                : mediaKind === 'image'
                  ? <img src={source} alt="" />
                  : mediaKind === 'video'
                    ? <video src={source} preload="metadata" muted playsInline />
                    : <audio src={source} controls />}
            </button>
            <button className="btn btn-secondary" onClick={() => props.onChooseMedia(mediaKind)}>
              Choose {mediaArticle[mediaKind]}…
            </button>
          </div>
        )}

        <div className="designer-field">
          <span>Attributes</span>
          {attributes.map(attribute => (
            <div className="designer-attribute" key={attribute.name}>
              <label title={attribute.name}>{attribute.name}</label>
              <input
                type="text"
                list={LINKS.includes(attribute.name) ? 'designer-urls' : undefined}
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
            list="designer-attributes"
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
          <datalist id="designer-attributes">
            {suggestedAttributes(element).map(name => <option key={name} value={name} />)}
          </datalist>
          <datalist id="designer-urls">
            {props.urls.map(url => <option key={url} value={url} />)}
          </datalist>
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

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

import { useEffect, useState } from 'react';
import { SERVER_FILLED, hasSlot } from './html';
import { CopyIcon, TrashIcon } from '../../components/Icons';
import { isText, labelOf } from './nodes';
import { KIND_FOR_TAG } from './Media';
import { DataSource, dataGridSources, loadEndpoints } from './dataSources';

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

interface GridColumn {
  name: string;
  label: string;
  type?: string;
  // Only ever true while "Allow inline editing" is on for this grid.
  editable?: boolean;
}

// The column list a <magic-data-grid> carries in its own data-columns attribute.
function gridColumns(value: string | null): GridColumn[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is GridColumn => !!entry && typeof entry.name === 'string')
      : [];
  } catch {
    return [];
  }
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
  /*
   * The one attribute whose server-filled value has been deliberately
   * unlocked. One at a time, because unlocking is a decision about the value
   * in front of you rather than a mode the panel is in.
   */
  const [unlocked, setUnlocked] = useState<string | null>(null);
  /*
   * The tables a Data Grid can bind to, fetched the first time one is
   * actually selected rather than up front — most selections are never a
   * data grid, and the full endpoints list is not a small thing to ask the
   * server for on every click. Declared here, ahead of the early return
   * below, because a Hook cannot be called from inside a condition.
   */
  const [sources, setSources] = useState<DataSource[] | null>(null);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesError, setSourcesError] = useState(false);

  useEffect(() => {
    const element = props.node && !isText(props.node) ? props.node as Element : null;
    const tag = element?.tagName.toLowerCase();
    if (!element || (tag !== 'magic-data-grid' && tag !== 'magic-data-create') ||
        sources || sourcesLoading) {
      return;
    }
    setSourcesLoading(true);
    setSourcesError(false);
    loadEndpoints()
      .then(list => setSources(dataGridSources(list)))
      .catch(() => setSourcesError(true))
      .finally(() => setSourcesLoading(false));
  }, [props.node]);

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

        {element.tagName.toLowerCase() === 'magic-data-grid' && (() => {
          const currentColumns = gridColumns(element.getAttribute('data-columns'));
          const currentSource = sources?.find(
            source => source.readUrl === element.getAttribute('data-read-url')) ?? null;
          const deleteOn = !!element.getAttribute('data-delete-url');
          const editOn = !!element.getAttribute('data-update-url');
          const filterOn = !!element.getAttribute('data-filterable');

          // Present as soon as either capability needs it, gone once neither does.
          function syncPrimaryKey(deleteWill: boolean, editWill: boolean) {
            if ((deleteWill || editWill) && currentSource) {
              props.onSetAttribute('data-primary-key', JSON.stringify(currentSource.primaryKey));
            } else {
              props.onRemoveAttribute('data-primary-key');
            }
          }

          function writeColumns(names: string[], editable: boolean) {
            if (!currentSource) {
              return;
            }
            const ordered = currentSource.columns
              .filter(column => names.includes(column.name))
              .map(column => ({
                name: column.name,
                label: currentColumns.find(entry => entry.name === column.name)?.label ?? column.name,
                // The widget needs the Hyperlambda type too, to pick an input
                // kind for inline editing and to send the right JSON shape —
                // a number typed into a text box is still a string otherwise.
                type: column.type,
                editable: editable && currentSource.editableColumns.includes(column.name),
              }));
            props.onSetAttribute('data-columns', JSON.stringify(ordered));
          }

          function pickSource(source: DataSource | null) {
            if (!source) {
              return;
            }
            props.onSetAttribute('data-read-url', source.readUrl);
            if (source.countUrl) {
              props.onSetAttribute('data-count-url', source.countUrl);
            } else {
              props.onRemoveAttribute('data-count-url');
            }
            // Delete and inline editing start OFF on a freshly picked table,
            // even when this one happens to support both — a destructive and
            // a data-changing capability are each worth turning on on
            // purpose, not inheriting from whatever the table allows.
            props.onRemoveAttribute('data-delete-url');
            props.onRemoveAttribute('data-update-url');
            props.onRemoveAttribute('data-primary-key');
            props.onRemoveAttribute('data-filterable');
            /*
             * A freshly picked table starts with every column checked except
             * its own primary key — an ID column is rarely what a visitor
             * wants to see, and it is still right there in the checklist,
             * one click from being turned back on, same as any other column.
             */
            props.onSetAttribute('data-columns', JSON.stringify(
              source.columns
                .filter(column => !source.primaryKey.includes(column.name))
                .map(column => ({ name: column.name, label: column.name, type: column.type }))));
          }

          function toggleColumn(column: { name: string }, checked: boolean) {
            if (!currentSource) {
              return;
            }
            const names = checked
              ? [...currentColumns.map(entry => entry.name), column.name]
              : currentColumns.map(entry => entry.name).filter(name => name !== column.name);
            // Written back in the table's own column order, not click order.
            writeColumns(names, editOn);
          }

          function toggleDelete(checked: boolean) {
            if (!currentSource?.deleteUrl) {
              return;
            }
            if (checked) {
              props.onSetAttribute('data-delete-url', currentSource.deleteUrl);
            } else {
              props.onRemoveAttribute('data-delete-url');
            }
            syncPrimaryKey(checked, editOn);
          }

          function toggleEdit(checked: boolean) {
            if (!currentSource?.updateUrl) {
              return;
            }
            if (checked) {
              props.onSetAttribute('data-update-url', currentSource.updateUrl);
            } else {
              props.onRemoveAttribute('data-update-url');
            }
            // Re-stamps every currently checked column's [editable] flag to match.
            writeColumns(currentColumns.map(entry => entry.name), checked);
            syncPrimaryKey(deleteOn, checked);
          }

          /*
           * Every crud-read endpoint crudify generates accepts a filtering
           * argument per column — Table.Column.eq for any type, and also
           * Table.Column.like (a fuzzy, wildcarded match) for a string one —
           * see Album.get.hl for a real example. This is a fixed, unconditional
           * part of what crudify writes, not a capability some tables have and
           * others don't, so unlike delete/edit this is never disabled: a
           * boolean the widget runtime itself turns into the right query
           * parameter per column, straight off each column's own [type].
           */
          function toggleFilters(checked: boolean) {
            if (checked) {
              props.onSetAttribute('data-filterable', 'true');
            } else {
              props.onRemoveAttribute('data-filterable');
            }
          }

          return (
            <div className="designer-field">
              <span>Table</span>
              {sourcesLoading && <span className="designer-muted">Loading tables…</span>}
              {sourcesError && (
                <span className="designer-muted">Could not load the list of tables.</span>
              )}
              {sources && (
                <select
                  value={currentSource?.readUrl ?? ''}
                  onChange={event =>
                    pickSource(sources.find(source => source.readUrl === event.target.value) ?? null)}>
                  <option value="">
                    {sources.length === 0 ? 'No crudified table has a read endpoint yet' : 'Choose a table…'}
                  </option>
                  {sources.map(source => (
                    <option key={source.readUrl} value={source.readUrl}>{source.label}</option>
                  ))}
                </select>
              )}
              {currentSource && (
                <>
                  <span>Columns</span>
                  <div className="designer-chips">
                    {currentSource.columns.map(column => (
                      <label
                        key={column.name}
                        className="checkbox-row"
                        title={column.lookup?.length ? 'References ' + column.lookup[0].table : undefined}>
                        <input
                          type="checkbox"
                          checked={currentColumns.some(entry => entry.name === column.name)}
                          onChange={event => toggleColumn(column, event.target.checked)} />
                        {column.name}{column.lookup?.length ? ' →' : ''}
                      </label>
                    ))}
                  </div>

                  {/*
                    * Disabled rather than hidden when the table has no
                    * crud-delete / crud-update of its own — seeing the option
                    * exist, and seeing why it cannot be ticked, says more than
                    * the option just not being there would.
                    */}
                  <label
                    className="checkbox-row"
                    title={currentSource.deleteUrl
                      ? undefined
                      : 'This table has no crud-delete endpoint to delete rows through'}>
                    <input
                      type="checkbox"
                      checked={deleteOn}
                      disabled={!currentSource.deleteUrl}
                      onChange={event => toggleDelete(event.target.checked)} />
                    Allow delete
                  </label>
                  <label
                    className="checkbox-row"
                    title={currentSource.updateUrl
                      ? undefined
                      : 'This table has no crud-update endpoint with editable columns to edit through'}>
                    <input
                      type="checkbox"
                      checked={editOn}
                      disabled={!currentSource.updateUrl}
                      onChange={event => toggleEdit(event.target.checked)} />
                    Allow inline editing
                  </label>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={filterOn}
                      onChange={event => toggleFilters(event.target.checked)} />
                    Allow filtering
                  </label>
                </>
              )}
            </div>
          );
        })()}

        {element.tagName.toLowerCase() === 'magic-data-create' && (() => {
          /*
           * Picks off the same [sources] the Data Grid uses, by [createUrl]
           * instead of [readUrl] — a table is only offered here when crudify
           * actually generated a crud-create endpoint for it, the one thing
           * that makes it "relevant" to this widget.
           */
          const creatable = sources?.filter(source => source.createUrl) ?? null;
          const currentSource = creatable?.find(
            source => source.createUrl === element.getAttribute('data-create-url')) ?? null;
          const currentFields = gridColumns(element.getAttribute('data-columns'));

          /*
           * Every field checked by default — crud-create's own input is
           * already exactly what a new row needs, nothing more — but
           * unchecked is still offered, same as a Data Grid column: the
           * field simply never appears, and the request sends whatever is
           * still checked. A column a NOT NULL constraint actually requires
           * will fail server-side if left unchecked; this picker only
           * decides what shows, same as it already does for the grid.
           */
          function pickCreateSource(source: DataSource | null) {
            if (!source?.createUrl) {
              return;
            }
            props.onSetAttribute('data-create-url', source.createUrl);
            props.onSetAttribute('data-columns', JSON.stringify(
              source.createColumns.map(column => (
                { name: column.name, label: column.name, type: column.type }))));
          }

          function toggleField(column: { name: string }, checked: boolean) {
            if (!currentSource) {
              return;
            }
            const names = checked
              ? [...currentFields.map(entry => entry.name), column.name]
              : currentFields.map(entry => entry.name).filter(name => name !== column.name);
            // Written back in crud-create's own field order, not click order.
            const ordered = currentSource.createColumns
              .filter(column => names.includes(column.name))
              .map(column => ({
                name: column.name,
                label: currentFields.find(entry => entry.name === column.name)?.label ?? column.name,
                type: column.type,
              }));
            props.onSetAttribute('data-columns', JSON.stringify(ordered));
          }

          return (
            <div className="designer-field">
              <span>Table</span>
              {sourcesLoading && <span className="designer-muted">Loading tables…</span>}
              {sourcesError && (
                <span className="designer-muted">Could not load the list of tables.</span>
              )}
              {creatable && (
                <select
                  value={currentSource?.createUrl ?? ''}
                  onChange={event =>
                    pickCreateSource(creatable.find(source => source.createUrl === event.target.value) ?? null)}>
                  <option value="">
                    {creatable.length === 0 ? 'No crudified table has a create endpoint yet' : 'Choose a table…'}
                  </option>
                  {creatable.map(source => (
                    <option key={source.createUrl} value={source.createUrl!}>{source.label}</option>
                  ))}
                </select>
              )}
              {currentSource && (
                <>
                  <span>Fields</span>
                  <div className="designer-chips">
                    {currentSource.createColumns.map(column => (
                      <label
                        key={column.name}
                        className="checkbox-row"
                        title={column.lookup?.length ? 'References ' + column.lookup[0].table : undefined}>
                        <input
                          type="checkbox"
                          checked={currentFields.some(entry => entry.name === column.name)}
                          onChange={event => toggleField(column, event.target.checked)} />
                        {column.name}{column.lookup?.length ? ' →' : ''}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })()}

        <div className="designer-field">
          <span>Attributes</span>
          {attributes.map(attribute => (
            <div
              className={'designer-attribute' +
                (hasSlot(attribute.value) ? ' designer-server-filled' : '')}
              key={attribute.name}>
              <label title={attribute.name}>{attribute.name}</label>
              <input
                type="text"
                list={LINKS.includes(attribute.name) ? 'designer-urls' : undefined}
                readOnly={hasSlot(attribute.value) && unlocked !== attribute.name}
                title={hasSlot(attribute.value) ? SERVER_FILLED : undefined}
                value={attribute.value}
                onChange={event => props.onSetAttribute(attribute.name, event.target.value)} />
              {hasSlot(attribute.value) && unlocked !== attribute.name ? (
                <button
                  className="icon-btn designer-unlock"
                  title={SERVER_FILLED + ' Click to edit it anyway.'}
                  onClick={() => setUnlocked(attribute.name)}>
                  Edit anyway
                </button>
              ) : (
                <button
                  className="icon-btn"
                  title={'Remove ' + attribute.name}
                  onClick={() => props.onRemoveAttribute(attribute.name)}>
                  <TrashIcon />
                </button>
              )}
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

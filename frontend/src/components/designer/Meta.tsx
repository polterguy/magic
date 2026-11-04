/*
 * The half of the page nobody can point at.
 *
 * The canvas shows the body, so everything that decides how the page is
 * titled in a tab, described in a search result and unfurled in a chat window
 * lives somewhere the designer could not reach. It is also the half that gets
 * forgotten, because a page copied from another one arrives wearing the other
 * one's title and its social image.
 *
 * Reading and writing goes straight at the document in the canvas, like every
 * other edit here, so the head is covered by the same undo and the same save.
 */

import { useState } from 'react';
import { SERVER_FILLED, hasSlot } from './html';
import { readMeta, type Home } from './metaTags';

export interface MetaField {
  label: string;
  home: Home;
  control: 'text' | 'textarea' | 'image';
  hint?: string;
  options?: string[];
  // Offers the addresses of this site's own pages as you type.
  links?: boolean;
}

const GROUPS: { title: string; note?: string; fields: MetaField[] }[] = [
  {
    title: 'Page',
    fields: [
      {
        label: 'Title',
        home: { at: 'title' },
        control: 'text',
        hint: 'Shown in the browser tab and as the headline in search results.',
      },
      {
        label: 'Description',
        home: { at: 'name', key: 'description' },
        control: 'textarea',
        hint: 'The paragraph under the headline in search results.',
      },
      {
        label: 'Canonical',
        home: { at: 'canonical' },
        control: 'text',
        links: true,
        hint: 'The address this page should be indexed under, when more than one reaches it.',
      },
      {
        label: 'Language',
        home: { at: 'lang' },
        control: 'text',
        options: ['en', 'en-GB', 'en-US', 'nb', 'de', 'fr', 'es', 'it', 'nl', 'sv', 'da'],
      },
      /*
       * The suggestions stop short of user-scalable=no and maximum-scale=1,
       * which are the two every copied snippet carries and the two that take
       * pinch zoom away from anybody who needs it. They can still be typed —
       * this is a text field, not a menu — they are just not put in front of
       * someone who is reaching for the ordinary answer.
       */
      {
        label: 'Viewport',
        home: { at: 'name', key: 'viewport' },
        control: 'text',
        hint:
          'How a phone lays the page out. Without it a phone assumes a desktop ' +
          'width and shrinks the result, which is what makes an otherwise fine page ' +
          'arrive as unreadable small print.',
        options: [
          'width=device-width, initial-scale=1',
          'width=device-width, initial-scale=1, viewport-fit=cover',
          'width=1024',
        ],
      },
    ],
  },
  {
    title: 'Sharing',
    note:
      'What a link to this page looks like when it is pasted into a chat, ' +
      'a post or a message. Anything left empty falls back to the page fields above.',
    fields: [
      { label: 'Title', home: { at: 'property', key: 'og:title' }, control: 'text' },
      {
        label: 'Description',
        home: { at: 'property', key: 'og:description' },
        control: 'textarea',
      },
      {
        label: 'Image',
        home: { at: 'property', key: 'og:image' },
        control: 'image',
        hint:
          'Wide and at least 1200 pixels across. An absolute address, because it is ' +
          'fetched by somebody else’s server.',
      },
      { label: 'Address', home: { at: 'property', key: 'og:url' }, control: 'text', links: true },
      {
        label: 'Type',
        home: { at: 'property', key: 'og:type' },
        control: 'text',
        options: ['website', 'article', 'profile', 'video.other'],
      },
      {
        label: 'Card',
        home: { at: 'name', key: 'twitter:card' },
        control: 'text',
        options: ['summary_large_image', 'summary'],
      },
      { label: 'Card image', home: { at: 'name', key: 'twitter:image' }, control: 'image' },
    ],
  },
];

function listFor(field: { options?: unknown; links?: unknown }, id: string) {
  if (field.options) {
    return id + '-options';
  }
  return field.links ? 'designer-page-urls' : undefined;
}

export default function Meta(
  props: Readonly<{
    doc: Document | null;
    // Absolute origin of the cloudlet, so a preview loads from where the page will.
    origin: string;
    urls: string[];
    onSet: (home: Home, value: string) => void;
    onChooseImage: (home: Home) => void;
  }>,
) {
  /*
   * The one field whose server-filled value has been deliberately unlocked.
   * A page's canonical URL and its og:url are routinely filled in by the
   * code-behind file, and both of them are shown here as ordinary text boxes
   * with the value already in them — which is the easiest place in the whole
   * tool to replace one with a fixed string by accident.
   */
  const [unlocked, setUnlocked] = useState<string | null>(null);

  const doc = props.doc;
  if (!doc) {
    return <p className="designer-empty">No page open.</p>;
  }

  function field(field: MetaField, index: number) {
    const value = readMeta(doc!, field.home);
    const id = 'meta-' + index;

    if (field.control === 'image') {
      return (
        <div className="designer-field" key={id}>
          <span>{field.label}</span>
          <button
            className="designer-image-preview"
            title="Choose an image"
            onClick={() => props.onChooseImage(field.home)}
          >
            {value === '' ? (
              <span className="designer-muted">Nothing chosen</span>
            ) : (
              <img src={value} alt="" />
            )}
          </button>
          <input
            type="text"
            value={value}
            placeholder="None"
            onChange={event => props.onSet(field.home, event.target.value)}
          />
          <button className="btn btn-secondary" onClick={() => props.onChooseImage(field.home)}>
            Choose image…
          </button>
          {field.hint && <p className="designer-note">{field.hint}</p>}
        </div>
      );
    }

    const filled = hasSlot(value);
    const locked = filled && unlocked !== id;

    return (
      <label className={'designer-field' + (filled ? ' designer-server-filled' : '')} key={id}>
        <span>{field.label}</span>
        {field.control === 'textarea' ? (
          <textarea
            rows={3}
            readOnly={locked}
            value={value}
            placeholder="None"
            onChange={event => props.onSet(field.home, event.target.value)}
          />
        ) : (
          <input
            type="text"
            list={listFor(field, id)}
            readOnly={locked}
            value={value}
            placeholder="None"
            onChange={event => props.onSet(field.home, event.target.value)}
          />
        )}
        {filled && (
          <p className="designer-note">
            {SERVER_FILLED}
            {locked && (
              <button
                className="btn btn-secondary btn-small designer-unlock"
                onClick={event => {
                  event.preventDefault();
                  setUnlocked(id);
                }}
              >
                Edit anyway
              </button>
            )}
          </p>
        )}
        {field.options && (
          <datalist id={id + '-options'}>
            {field.options.map(option => (
              <option key={option} value={option} />
            ))}
          </datalist>
        )}
        {field.hint && <p className="designer-note">{field.hint}</p>}
      </label>
    );
  }

  return (
    <div className="designer-fields">
      {/* Absolute, because these are read by other people's servers. */}
      <datalist id="designer-page-urls">
        {props.urls.map(url => (
          <option key={url} value={props.origin + url} />
        ))}
      </datalist>
      {GROUPS.map((group, groupIndex) => (
        <div key={group.title}>
          <div className="designer-meta-group">{group.title}</div>
          {group.note && <p className="designer-note">{group.note}</p>}
          {group.fields.map((one, index) => field(one, groupIndex * 100 + index))}
        </div>
      ))}
    </div>
  );
}

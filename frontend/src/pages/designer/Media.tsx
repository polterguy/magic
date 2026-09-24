/*
 * Picking a file that is already on the cloudlet, for the elements that point
 * at one: images, video and audio.
 *
 * Typing a path into the src field means knowing the path, which means having
 * been in the file manager first. Everything the page could point at is
 * already sitting under the web root, so this puts it on screen instead.
 *
 * One dialog serves all three. What changes between them is the list of
 * extensions, how a tile previews the file, and whether the file has a size
 * worth writing onto the element — nothing else, so nothing else is
 * duplicated.
 *
 * Previews load from the cloudlet's public web root rather than through the
 * file API, because that is how the page will load them too: a file that does
 * not play here would not have played on the page either, which makes this a
 * preview of the real thing rather than a picture of one.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../../components/Dialogs';
import { listFilesRecursively, uploadFile } from '../../lib/api';

const WEB_ROOT = '/etc/www';

export type MediaKind = 'image' | 'video' | 'audio';

/*
 * What each kind is made of. The extension lists are what a browser will
 * actually render — ogg appears under both video and audio because the
 * container carries either, and which one a given file holds is not knowable
 * from its name.
 */
const KINDS: Record<MediaKind, {
  title: string;
  noun: string;
  extensions: string[];
  // Whether the element should carry the file's own width and height.
  sized: boolean;
}> = {
  image: {
    title: 'Choose an image',
    noun: 'image',
    extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'ico', 'bmp'],
    sized: true,
  },
  video: {
    title: 'Choose a video',
    noun: 'video',
    extensions: ['mp4', 'webm', 'ogv', 'ogg', 'mov', 'm4v'],
    sized: true,
  },
  audio: {
    title: 'Choose an audio file',
    noun: 'audio file',
    extensions: ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus'],
    sized: false,
  },
};

// The element each kind belongs to, so a selection can ask for its own picker.
export const KIND_FOR_TAG: Record<string, MediaKind> = {
  img: 'image',
  video: 'video',
  audio: 'audio',
};

function extensionOf(file: string) {
  return file.substring(file.lastIndexOf('.') + 1).toLowerCase();
}

/*
 * The path the page should carry, which is not the path the file has.
 *
 * Always root-absolute. A relative source resolves against the page's own
 * URL, so the same markup means different things on /about and on
 * /docs/intro — and canonical URLs here have no trailing slash, which moves
 * the base a second time. Root-absolute is the one form that means the same
 * thing from every page on the site.
 */
export function webPath(file: string) {
  return file.substring(WEB_ROOT.length);
}

export interface Picked {
  src: string;
  width: number;
  height: number;
}

export default function Media(props: {
  kind: MediaKind;
  // Absolute origin of the cloudlet, so previews load from where the page will.
  origin: string;
  // What the element points at now, so the current file can be marked.
  current: string;
  onPick: (picked: Picked) => void;
  onCancel: () => void;
}) {

  const kind = KINDS[props.kind];
  const [files, setFiles] = useState<string[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  /*
   * Natural sizes, filled in as the previews load. The element gets width and
   * height on the way out so the page reserves the right box before the file
   * arrives, and the browser has already told us both by then.
   */
  const [sizes, setSizes] = useState<Record<string, [number, number]>>({});
  // Where an upload lands. Only folders that already hold this kind are offered.
  const [folder, setFolder] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function reload() {
    return listFilesRecursively(WEB_ROOT + '/', false)
      .then(all => setFiles(all.filter(file => kind.extensions.includes(extensionOf(file)))))
      .catch(err => setError(err.message));
  }

  useEffect(() => {
    reload();
    // The folder the element's current file sits in is the likeliest home for
    // its replacement, so uploads default there rather than to the web root.
    const at = props.current.lastIndexOf('/');
    setFolder(at > 0 ? props.current.substring(0, at) : '');
  }, [props.kind]);

  /*
   * Uploading keeps the dialog open and simply re-lists. The new file has to
   * be on screen to be chosen, and choosing it is a separate decision from
   * putting it there — auto-picking would also mean picking before the
   * browser has measured it, which is where width and height come from.
   */
  async function upload(chosen: FileList) {
    setUploading(true);
    setError('');
    try {
      const names: string[] = [];
      for (const file of Array.from(chosen)) {
        await uploadFile(WEB_ROOT + folder + '/', file);
        names.push(file.name);
      }
      await reload();
      // Narrowed to what just arrived, so it is the thing you are looking at.
      setFilter(names.length === 1 ? names[0] : '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  /*
   * Grouped by the folder they sit in, because that is how they were
   * organised by whoever put them there, and a flat grid of two hundred
   * tiles is a worse version of the same information.
   */
  const groups = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const matching = (files ?? [])
      .filter(file => needle === '' || file.toLowerCase().includes(needle));
    const byFolder = new Map<string, string[]>();
    matching.forEach(file => {
      const at = webPath(file.substring(0, file.lastIndexOf('/'))) || '/';
      byFolder.set(at, [...(byFolder.get(at) ?? []), file]);
    });
    return Array.from(byFolder.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [files, filter]);

  // Every folder that already holds one of these, plus the web root itself.
  const folders = useMemo(() => {
    const all = new Set<string>(['']);
    (files ?? []).forEach(file => all.add(webPath(file.substring(0, file.lastIndexOf('/')))));
    return Array.from(all).sort();
  }, [files]);

  const total = files?.length ?? 0;
  const shown = groups.reduce((count, group) => count + group[1].length, 0);

  function pick(file: string) {
    const size = sizes[file];
    props.onPick({
      src: webPath(file),
      width: kind.sized && size ? size[0] : 0,
      height: kind.sized && size ? size[1] : 0,
    });
  }

  // Measured once the browser knows, from whichever element is previewing it.
  function measured(file: string, width: number, height: number) {
    if (width > 0 && height > 0) {
      setSizes(known => ({ ...known, [file]: [width, height] }));
    }
  }

  function preview(file: string, path: string) {
    if (props.kind === 'image') {
      return (
        <img
          src={props.origin + path}
          alt=""
          loading="lazy"
          onLoad={event => measured(file, event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)} />
      );
    }
    if (props.kind === 'video') {
      /*
       * Metadata only. That is enough for the dimensions and for a first
       * frame, and it means opening this dialog does not pull down every
       * video on the cloudlet.
       */
      return (
        <video
          src={props.origin + path}
          preload="metadata"
          muted
          playsInline
          onLoadedMetadata={event => measured(file, event.currentTarget.videoWidth, event.currentTarget.videoHeight)} />
      );
    }
    // Audio has nothing to look at, so the tile says what it is instead.
    return (
      <span className="designer-media-audio" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M9 18V5l10-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="16" cy="16" r="3" />
        </svg>
      </span>
    );
  }

  return (
    <Modal width={860} onClose={props.onCancel}>
      <h2 style={{ marginTop: 0 }}>{kind.title}</h2>
      <input
        type="text"
        autoFocus
        className="designer-image-filter"
        placeholder="Filter by name or folder…"
        value={filter}
        onChange={event => setFilter(event.target.value)} />

      {error !== '' && <p className="designer-note error">{error}</p>}
      {files === null && error === '' && <p className="designer-note">Loading…</p>}
      {files !== null && total === 0 && (
        <p className="designer-note">
          There is no {kind.noun} under <code>{WEB_ROOT}</code> yet. Upload one below and it
          will show up here.
        </p>
      )}
      {files !== null && total > 0 && shown === 0 && (
        <p className="designer-note">Nothing matches “{filter}”.</p>
      )}

      <div className="designer-images">
        {groups.map(([at, inFolder]) => (
          <div key={at}>
            <div className="designer-images-folder">{at}</div>
            <div className="designer-images-grid">
              {inFolder.map(file => {
                const path = webPath(file);
                const size = sizes[file];
                return (
                  <button
                    key={file}
                    className={'designer-image' + (path === props.current ? ' current' : '')}
                    title={path}
                    onClick={() => pick(file)}>
                    {preview(file, path)}
                    <span className="designer-image-name">{path.substring(path.lastIndexOf('/') + 1)}</span>
                    <span className="designer-image-size">
                      {size ? size[0] + ' × ' + size[1] : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="modal-actions">
        <span className="designer-muted" style={{ marginRight: 'auto' }}>
          {files === null ? '' : shown === total ? total + ' files' : shown + ' of ' + total}
        </span>
        <input
          ref={fileRef}
          type="file"
          accept={props.kind + '/*'}
          multiple
          hidden
          onChange={event => {
            if (event.target.files && event.target.files.length > 0) {
              upload(event.target.files);
            }
            // So the same file can be chosen twice in a row.
            event.target.value = '';
          }} />
        <select
          value={folder}
          title="Where an upload goes"
          disabled={uploading}
          onChange={event => setFolder(event.target.value)}>
          {folders.map(name => (
            <option key={name} value={name}>{name === '' ? '/' : name}</option>
          ))}
        </select>
        <button
          className="btn btn-secondary"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}>
          {uploading ? 'Uploading…' : 'Upload…'}
        </button>
        <button className="btn btn-secondary" onClick={props.onCancel}>Cancel</button>
      </div>
    </Modal>
  );
}

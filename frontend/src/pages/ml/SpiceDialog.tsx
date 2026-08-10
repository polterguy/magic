/*
 * "Spice" — scrapes one single page into the model, as opposed to crawling
 * a whole site from the import dialog.
 */

import { useState } from 'react';
import { Modal } from '../../components/Dialogs';

export default function SpiceDialog(props: {
  type: string;
  onClose: () => void;
  onScrape: (options: {
    url: string; threshold: number; images: boolean; lists: boolean; code: boolean;
  }) => void;
}) {

  const [url, setUrl] = useState('');
  const [threshold, setThreshold] = useState('50');
  const [images, setImages] = useState(true);
  const [lists, setLists] = useState(true);
  const [code, setCode] = useState(true);

  return (
    <Modal
      width={560}
      onClose={props.onClose}
      onSubmit={() => {
        if (url) props.onScrape({ url, threshold: Number(threshold), images, lists, code });
      }}>
      <h2>Spice {props.type}</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Scrapes a single web page into this model, without crawling the rest of
        the site.
      </p>
      <div className="form-grid">
        <label>Page URL
          <input
            type="text"
            autoFocus
            placeholder="https://example.com/some-page"
            value={url}
            onChange={e => setUrl(e.target.value)} />
        </label>
        <label>Text threshold
          <input
            type="number"
            min={25}
            title="Minimum character count for content to become a training snippet"
            value={threshold}
            onChange={e => setThreshold(e.target.value)}
            style={{ width: 140 }} />
        </label>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={images} onChange={e => setImages(e.target.checked)} />
            Import images
          </label>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={lists} onChange={e => setLists(e.target.checked)} />
            Import lists
          </label>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={code} onChange={e => setCode(e.target.checked)} />
            Import code segments
          </label>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button
          className="btn"
          disabled={!url}
          onClick={() => props.onScrape({
            url,
            threshold: Number(threshold),
            images,
            lists,
            code,
          })}>
          Scrape page
        </button>
      </div>
    </Modal>
  );
}

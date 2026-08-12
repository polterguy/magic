/*
 * "Spice" — scrapes one single page into the model, as opposed to crawling
 * a whole site from the import dialog.
 */

import { useState } from 'react';
import { Modal } from '../../components/Dialogs';

export default function SpiceDialog(props: {
  type: string;
  onClose: () => void;
  onScrape: (options: { url: string; images: boolean }) => void;
}) {

  const [url, setUrl] = useState('');
  const [images, setImages] = useState(true);

  return (
    <Modal
      width={560}
      onClose={props.onClose}
      onSubmit={() => {
        if (url) props.onScrape({ url, images });
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
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={images} onChange={e => setImages(e.target.checked)} />
          Import images
        </label>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button
          className="btn"
          disabled={!url}
          onClick={() => props.onScrape({ url, images })}>
          Scrape page
        </button>
      </div>
    </Modal>
  );
}

/*
 * "Spice" — scrapes one single page into the model, as opposed to crawling
 * a whole site from the import dialog.
 */

import { useState } from 'react';

import { Modal } from '../Dialogs';
import OptionPill from '../OptionPill';

export default function SpiceDialog(
  props: Readonly<{
    type: string;
    onClose: () => void;
    onScrape: (options: { url: string; images: boolean }) => void;
  }>,
) {
  const [url, setUrl] = useState('');
  const [images, setImages] = useState(true);

  return (
    <Modal
      size="md"
      onClose={props.onClose}
      onSubmit={() => {
        if (url) props.onScrape({ url, images });
      }}
      title={'Spice ' + props.type}
      subtitle="Scrapes a single web page into this model, without crawling the rest of the site."
      actions={
        <>
          <button className="btn btn-secondary" onClick={props.onClose}>
            Cancel
          </button>
          <button className="btn" disabled={!url} onClick={() => props.onScrape({ url, images })}>
            Scrape page
          </button>
        </>
      }
    >
      {/* A plain column, not a form-grid, holds the pill: form-grid restyles every label in it. */}
      <div className="modal-section">
        <div className="form-grid">
          <label>
            Page URL{' '}
            <input
              type="text"
              data-initial-focus
              placeholder="https://example.com/some-page"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          </label>
        </div>
        <div className="pill-row">
          <OptionPill label="Import images" checked={images} onChange={setImages} />
        </div>
      </div>
    </Modal>
  );
}

/*
 * Shows an image the user attached at the size of the screen, and at its own size on a click.
 * Escape, the backdrop and the close button all dismiss it.
 */

import { useState } from 'react';

import { Modal } from './Dialogs';

export default function ImageLightbox(
  props: Readonly<{ url: string; name: string; detail: string; onClose: () => void }>,
) {
  // Fitted to the screen until clicked, then scrollable at the image's own size.
  const [actualSize, setActualSize] = useState(false);
  return (
    <Modal bare onClose={props.onClose}>
      <div className="lightbox">
        <button type="button" className="lightbox-close" title="Close" onClick={props.onClose}>
          ×
        </button>
        <div className={actualSize ? 'lightbox-stage actual' : 'lightbox-stage'}>
          <button
            type="button"
            className="lightbox-image"
            data-initial-focus
            title={actualSize ? 'Fit to screen' : 'Show at actual size'}
            onClick={() => setActualSize(current => !current)}
          >
            <img src={props.url} alt={props.name} />
          </button>
        </div>
        <div className="lightbox-caption">
          {props.name} · {props.detail}
        </div>
      </div>
    </Modal>
  );
}

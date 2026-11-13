import { useState } from 'react';

import { applyFont, FONTS, getFont } from '../../lib/font';

/*
 * The Profile page's font setting. One radio tile per font, each drawn in its own font so the
 * choice previews itself. A pick applies at once and is kept in this browser; there is nothing to
 * save to the backend, so there is no Save button.
 */
export default function FontPicker() {
  const [font, setFont] = useState(getFont);

  return (
    <div className="card settings-card profile-font">
      <div className="settings-card-head">
        <h2 id="font-picker-title">Font</h2>
        <p className="muted">
          The font used across the dashboard, in this browser. Code editors stay monospace.
        </p>
      </div>
      <div
        className="font-options settings-card-body"
        role="radiogroup"
        aria-labelledby="font-picker-title"
      >
        {FONTS.map(option => (
          <label
            key={option.id}
            className={'font-option' + (option.id === font ? ' selected' : '')}
            style={{ fontFamily: option.family }}
          >
            <input
              type="radio"
              name="app-font"
              value={option.id}
              checked={option.id === font}
              onChange={() => {
                applyFont(option.id);
                setFont(option.id);
              }}
            />
            <span className="font-option-sample" aria-hidden="true">
              Aa
            </span>
            <span className="font-option-label">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

import { Ref } from 'react';
import { ChevronIcon } from '../Icons';

/*
 * The backend URL input, with a dropdown of the backends signed in to before.
 * The open state and its outside-click handling stay with the login page.
 */
export default function BackendUrlField({
  ref,
  ...props
}: Readonly<{
  url: string;
  onUrl: (url: string) => void;
  previousUrls: string[];
  pickerOpen: boolean;
  onPickerOpen: (open: boolean) => void;
  // The dropdown's container, which the page's outside-click handler checks against.
  ref: Ref<HTMLDivElement>;
}>) {
  return (
    <label>
      Backend URL
      {/*
       * A plain input with its own dropdown rather than a datalist —
       * a datalist filters its options by whatever is already typed,
       * so picking a different backend meant clearing the field first.
       */}
      <div className="combo" ref={ref}>
        <input
          type="text"
          value={props.url}
          onChange={e => props.onUrl(e.target.value)}
          placeholder="http://localhost:5000"
          required
        />
        {props.previousUrls.length > 0 && (
          <button
            type="button"
            className={'combo-toggle' + (props.pickerOpen ? ' open' : '')}
            title="Backends you have signed in to"
            onClick={() => props.onPickerOpen(!props.pickerOpen)}
          >
            <ChevronIcon />
          </button>
        )}
        {props.pickerOpen && (
          <div className="combo-list">
            {props.previousUrls.map(candidate => (
              <button
                type="button"
                key={candidate}
                className={'combo-option' + (candidate === props.url ? ' active' : '')}
                onClick={() => {
                  props.onUrl(candidate);
                  props.onPickerOpen(false);
                }}
              >
                {candidate}
              </button>
            ))}
          </div>
        )}
      </div>
    </label>
  );
}

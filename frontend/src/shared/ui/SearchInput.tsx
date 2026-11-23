/*
 * Text input for filtering a list, with a clear button that appears once
 * there's something to clear.
 */

import { CSSProperties } from 'react';

export default function SearchInput(
  props: Readonly<{
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    style?: CSSProperties;
    // Accessible name, for a field without a visible label.
    label?: string;
    // Takes focus when the surrounding Modal opens.
    initialFocus?: boolean;
  }>,
) {
  return (
    <span className="search-input" style={props.style}>
      <input
        type="text"
        aria-label={props.label}
        data-initial-focus={props.initialFocus || undefined}
        placeholder={props.placeholder}
        autoComplete="off"
        value={props.value}
        onChange={event => props.onChange(event.target.value)}
      />
      {props.value !== '' && (
        <button type="button" title="Clear search" onClick={() => props.onChange('')}>
          ×
        </button>
      )}
    </span>
  );
}

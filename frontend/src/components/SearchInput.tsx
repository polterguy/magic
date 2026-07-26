/*
 * Text input for filtering a list, with a clear button that appears once
 * there's something to clear.
 */

import { CSSProperties } from 'react';

export default function SearchInput(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: CSSProperties;
}) {
  return (
    <span className="search-input" style={props.style}>
      <input
        type="text"
        placeholder={props.placeholder}
        autoComplete="off"
        value={props.value}
        onChange={event => props.onChange(event.target.value)} />
      {props.value !== '' && (
        <button type="button" title="Clear search" onClick={() => props.onChange('')}>
          ×
        </button>
      )}
    </span>
  );
}

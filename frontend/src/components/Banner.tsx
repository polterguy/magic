/*
 * Inline feedback banner — error or success — dismissible with an × in
 * its top/right corner.
 */

import { CSSProperties, ReactNode } from 'react';

export default function Banner(props: {
  isError?: boolean;
  onClose: () => void;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      className={((props.isError ?? true) ? 'error-box' : 'success-box') + ' closable'}
      style={props.style}>
      <span style={{ flex: 1 }}>{props.children}</span>
      <button className="banner-close" title="Dismiss" onClick={props.onClose}>×</button>
    </div>
  );
}

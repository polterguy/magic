/*
 * The files a page links, and the stylesheet the Style panel writes into —
 * as it was read, as it stands, and which rule is being edited.
 */

import { useState } from 'react';
import { Overrides } from '../css';
import { INLINE } from '../Styles';

export function useStylesheetState() {
  // Every local stylesheet this page links that is actually on disk.
  const [sheets, setSheets] = useState<string[]>([]);
  // Every local script this page runs, readable in the code view beside it.
  const [scripts, setScripts] = useState<string[]>([]);

  // The stylesheet the open page is styled by, as it was read and as it stands.
  const [cssPath, setCssPath] = useState<string | null>(null);
  const [cssOriginal, setCssOriginal] = useState('');
  const [cssHead, setCssHead] = useState('');
  // The author's own CSS below the designer's fence, carried back untouched.
  const [cssTail, setCssTail] = useState('');
  const [overrides, setOverrides] = useState<Overrides>({});
  const [target, setTarget] = useState(INLINE);
  // Stylesheets the page links that are not on this cloudlet.
  const [cssMissing, setCssMissing] = useState<string[]>([]);

  return {
    sheets,
    setSheets,
    scripts,
    setScripts,
    cssPath,
    setCssPath,
    cssOriginal,
    setCssOriginal,
    cssHead,
    setCssHead,
    cssTail,
    setCssTail,
    overrides,
    setOverrides,
    target,
    setTarget,
    cssMissing,
    setCssMissing,
  };
}

export type StylesheetState = ReturnType<typeof useStylesheetState>;

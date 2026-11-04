/*
 * Client-side downloads — turning a Blob already in memory into a saved
 * file, and picking filenames out of Content-Disposition headers.
 */

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/*
 * Returns the filename of a Content-Disposition header, or null.
 */
export function dispositionFilename(disposition: string): string | null {
  const match = /filename\*?=(?:"([^"]+)"|([^;]+))/.exec(disposition);
  if (!match) {
    return null;
  }
  return (match[1] ?? match[2]).trim().replace(/^UTF-8''/, '');
}

// What a CSV cell is expected to hold; anything else goes through String() as is.
type CsvCell = string | number | boolean | null | undefined;

/*
 * Builds a CSV from the rows already in memory and downloads it. Columns
 * default to the first row's keys.
 */
export function exportCsv(rows: Record<string, unknown>[], filename: string, columns?: string[]) {
  if (rows.length === 0) {
    return;
  }
  const names = columns ?? Object.keys(rows[0]);
  const escape = (value: CsvCell) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  };
  const csv = [names.join(',')]
    .concat(rows.map(row => names.map(name => escape(row[name] as CsvCell)).join(',')))
    .join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv' }), filename);
}

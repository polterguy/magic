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
 * Returns the filename of a Content-Disposition header, or null. The RFC 5987
 * filename*=UTF-8''r%C3%A9sum%C3%A9.pdf form wins over a plain filename= when a
 * header carries both, as RFC 6266 asks, and is percent-decoded.
 */
export function dispositionFilename(disposition: string): string | null {
  const extended = /filename\*=([^;]+)/.exec(disposition);
  if (extended) {
    return decodeExtendedValue(extended[1].trim());
  }
  const plain = /filename=(?:"([^"]+)"|([^;]+))/.exec(disposition);
  if (!plain) {
    return null;
  }
  return (plain[1] ?? plain[2]).trim();
}

// charset'language'percent-encoded-value; a value that won't decode is returned as it came.
function decodeExtendedValue(value: string): string {
  const quote = value.indexOf("'");
  const second = quote === -1 ? -1 : value.indexOf("'", quote + 1);
  const encoded = second === -1 ? value : value.slice(second + 1);
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
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
    return /[",\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
  };
  const csv = [names.join(',')]
    .concat(rows.map(row => names.map(name => escape(row[name] as CsvCell)).join(',')))
    .join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv' }), filename);
}

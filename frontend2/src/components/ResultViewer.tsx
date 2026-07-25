/*
 * Displays the result of executing Hyperlambda or invoking an endpoint,
 * dispatching on the response's Content-Type the way a browser would:
 * highlighted source for text types (with a rendered preview toggle for
 * HTML), an image for image types, and a download button for binaries.
 */

import { useEffect, useMemo, useState } from 'react';
import CodeEditor from './CodeEditor';

export interface RawResult {
  blob: Blob;
  contentType: string;
  disposition: string;
  status: number;
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

function editorMode(contentType: string) {
  if (contentType.includes('json')) {
    return 'application/json';
  }
  if (contentType.includes('xml')) {
    return 'application/xml';
  }
  if (contentType.includes('html')) {
    return 'htmlmixed';
  }
  if (contentType.includes('markdown')) {
    return 'markdown';
  }
  if (contentType.includes('hyperlambda')) {
    return 'hyperlambda';
  }
  return 'text/plain';
}

function isText(contentType: string) {
  return contentType.startsWith('text/') ||
    contentType.includes('json') ||
    contentType.includes('xml') ||
    contentType.includes('hyperlambda') ||
    contentType.includes('javascript');
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ResultViewer({ result }: { result: RawResult }) {

  const [text, setText] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const contentType = result.contentType.split(';')[0].trim().toLowerCase();
  const attachment = result.disposition.includes('attachment');
  const textual = !attachment && isText(contentType);
  const image = !attachment && contentType.startsWith('image/');

  useEffect(() => {
    setPreview(false);
    if (!textual) {
      setText(null);
      return;
    }
    let cancelled = false;
    result.blob.text().then(value => {
      if (cancelled) {
        return;
      }
      if (contentType.includes('json')) {
        try {
          value = JSON.stringify(JSON.parse(value), null, 2);
        } catch {
          // Malformed JSON — show raw.
        }
      }
      setText(value === '' ? 'OK — no result' : value);
    });
    return () => { cancelled = true; };
  }, [result, textual, contentType]);

  const imageUrl = useMemo(
    () => image ? URL.createObjectURL(result.blob) : null,
    [image, result]);

  useEffect(() => () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
  }, [imageUrl]);

  if (attachment || (!textual && !image)) {
    const filename = dispositionFilename(result.disposition) ?? 'result.bin';
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ marginTop: 0 }}>
          The response is a file — <span className="mono">{filename}</span>
          <span className="muted">
            {' — ' + contentType + ', ' + formatSize(result.blob.size)}
          </span>
        </p>
        <button className="btn" onClick={() => downloadBlob(result.blob, filename)}>
          Download
        </button>
      </div>
    );
  }

  if (image && imageUrl) {
    return (
      <div style={{ textAlign: 'center', overflow: 'auto', maxHeight: '55vh' }}>
        <img src={imageUrl} alt="Result" style={{ maxWidth: '100%' }} />
      </div>
    );
  }

  const isHtml = contentType.includes('html');
  return (
    <div style={{ height: '55vh', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {isHtml && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={'btn btn-small ' + (preview ? 'btn-secondary' : '')}
            onClick={() => setPreview(false)}>
            Source
          </button>
          <button
            className={'btn btn-small ' + (preview ? '' : 'btn-secondary')}
            onClick={() => setPreview(true)}>
            Preview
          </button>
        </div>
      )}
      {isHtml && preview ? (
        <iframe
          sandbox=""
          srcDoc={text ?? ''}
          title="Result preview"
          style={{
            flex: 1,
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: '#fff',
          }} />
      ) : (
        text !== null && <CodeEditor value={text} mode={editorMode(contentType)} readOnly />
      )}
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) {
    return bytes + ' bytes';
  }
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  }
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

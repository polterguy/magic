/*
 * The endpoint invoker: argument form, payload editor, file pickers and the
 * Invoke button. Shared by the Endpoints page, which lists every endpoint,
 * and Hyper IDE, which invokes the endpoint file currently open.
 */

import Banner from './Banner';
import { useEffect, useState } from 'react';
import CodeEditor from './CodeEditor';
import { ChevronIcon } from './Icons';
import { RawResult } from './ResultViewer';
import { Endpoint, invokeEndpoint } from '../lib/api';

export interface InvokeResult extends RawResult {
  elapsed: number;
}

/*
 * Builds a sample JSON payload from the endpoint's argument meta, the way
 * the old dashboard does: int-ish → 42, decimal-ish → 5.5, bool → true,
 * date → now, everything else → "foo".
 */
const WILDCARD = '__wildcard__';

function samplePayload(endpoint: Endpoint) {
  const payload: Record<string, any> = {};
  for (const argument of endpoint.input ?? []) {
    switch (argument.type) {
      case 'int': case 'long': case 'uint': case 'ulong': case 'short': case 'ushort':
        payload[argument.name] = 42;
        break;
      case 'decimal': case 'float': case 'double':
        payload[argument.name] = 5.5;
        break;
      case 'bool':
        payload[argument.name] = true;
        break;
      case 'date':
        payload[argument.name] = new Date().toISOString();
        break;
      case '*':
        /*
         * Wildcard arguments are sub-objects or lists whose shape can't be
         * derived declaratively — emitted as a naked * so the JSON is
         * deliberately invalid, forcing the user to decorate or remove them
         * before invoking.
         */
        payload[argument.name] = WILDCARD;
        break;
      default:
        payload[argument.name] = 'foo';
    }
  }
  return JSON.stringify(payload, null, 2).replace(/"__wildcard__"/g, '*');
}

function ArgumentField(props: {
  argument: { name: string; type?: string };
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
      <span>
        {props.argument.name}
        <span className="muted" style={{ fontWeight: 400 }}> — {props.argument.type}</span>
      </span>
      <input
        type="text"
        value={props.value}
        onChange={e => props.onChange(e.target.value)} />
    </label>
  );
}

export default function InvokePanel(props: {
  endpoint: Endpoint;
  onResult: (result: InvokeResult) => void;
  onOpenApi: () => void;
}) {

  const { endpoint } = props;
  const verb = endpoint.verb.toLowerCase();
  const usesQuery = verb === 'get' || verb === 'delete';
  const isMultipart = endpoint.consumes?.includes('multipart/form-data') ?? false;
  const consumesJson = !endpoint.consumes || endpoint.consumes.includes('json');
  const [args, setArgs] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [payload, setPayload] = useState(() => samplePayload(endpoint));
  const [busy, setBusy] = useState(false);
  const [invokeError, setInvokeError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [fullDescription, setFullDescription] = useState(false);

  /*
   * Wildcard (*) arguments are context-dependent — sub-objects, lists of
   * values, files — and can't be rendered declaratively, so they're dropped
   * from the generated form. The one exception is the multipart [file]
   * argument, which becomes a file picker.
   */
  const inputs = endpoint.input ?? [];
  const declared = inputs.filter(argument => argument.type !== '*');
  const fileArgs = inputs.filter(argument => argument.type === '*' && argument.name === 'file');

  /*
   * Dotted arguments (ml_requests.id.eq etc.) are generated column filters —
   * kept behind an expander so the common arguments stay scannable.
   */
  const standardArgs = declared.filter(argument => !argument.name.includes('.'));
  const filterArgs = declared.filter(argument => argument.name.includes('.'));
  const formFields = declared;

  const description = endpoint.description ?? '';
  const period = description.indexOf('. ');
  const shortDescription = period === -1 ? description : description.substring(0, period + 1);

  // Socket endpoints and binary payloads can't be invoked from here.
  const canInvoke = verb !== 'socket' &&
    (usesQuery || isMultipart || consumesJson ||
      endpoint.consumes?.includes('hyperlambda') || endpoint.consumes?.startsWith('text/'));

  async function invoke() {
    setBusy(true);
    setInvokeError('');
    try {
      let url = endpoint.path;
      let body: string | FormData | undefined = undefined;
      if (usesQuery) {
        const parts: string[] = [];
        for (const argument of inputs) {
          const value = args[argument.name];
          if (value === undefined || value === '') {
            continue;
          }
          const encoded = argument.type === 'date'
            ? new Date(value).toISOString()
            : value;
          parts.push(encodeURIComponent(argument.name) + '=' + encodeURIComponent(encoded));
        }
        if (parts.length > 0) {
          url += '?' + parts.join('&');
        }
      } else if (isMultipart) {
        const form = new FormData();
        for (const argument of formFields) {
          const value = args[argument.name];
          if (value !== undefined && value !== '') {
            form.append(argument.name, value);
          }
        }
        for (const argument of fileArgs) {
          // Several files under the same part name — Magic's convention for
          // endpoints accepting multiple files through one [file] argument.
          for (const file of files[argument.name] ?? []) {
            form.append(argument.name, file, file.name);
          }
        }
        body = form;
      } else {
        // Wildcard (*) placeholders make the sample payload deliberately
        // invalid — catch it here and push the burden back to the user.
        if (consumesJson) {
          try {
            JSON.parse(payload);
          } catch {
            setInvokeError(
              'The payload is not valid JSON — replace the * wildcard arguments ' +
              'with real values (objects, lists or scalars), or remove them.');
            return;
          }
        }
        body = payload;
      }
      const response = await invokeEndpoint(
        endpoint.verb, url, body, endpoint.consumes ?? 'application/json');
      props.onResult(response);
    } catch (err: any) {
      setInvokeError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const argGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 10,
    marginBottom: 12,
  } as const;

  return (
    <div>
      {description && (
        <p style={{ marginTop: 0 }}>
          {fullDescription ? description : shortDescription}
          {period !== -1 && (
            <button
              className="btn btn-secondary btn-small"
              style={{ marginLeft: 8 }}
              onClick={() => setFullDescription(!fullDescription)}>
              {fullDescription ? 'less' : 'more'}
            </button>
          )}
        </p>
      )}
      <div className="muted" style={{ marginBottom: 10 }}>
        Consumes: {endpoint.consumes ?? 'n/a'} — Produces: {endpoint.produces ?? 'n/a'}
      </div>
      {invokeError && <Banner onClose={() => setInvokeError('')} style={{ marginBottom: 10 }}>{invokeError}</Banner>}
      {usesQuery && standardArgs.length > 0 && (
        <div style={argGrid}>
          {standardArgs.map(argument => (
            <ArgumentField
              key={argument.name}
              argument={argument}
              value={args[argument.name] ?? ''}
              onChange={value => setArgs({ ...args, [argument.name]: value })} />
          ))}
        </div>
      )}
      {usesQuery && filterArgs.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => setShowFilters(!showFilters)}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span className="tree-chevron"><ChevronIcon open={showFilters} /></span>
              Filter arguments ({filterArgs.length})
            </span>
          </button>
          {showFilters && (
            <div style={{ ...argGrid, marginTop: 10, marginBottom: 0 }}>
              {filterArgs.map(argument => (
                <ArgumentField
                  key={argument.name}
                  argument={argument}
                  value={args[argument.name] ?? ''}
                  onChange={value => setArgs({ ...args, [argument.name]: value })} />
              ))}
            </div>
          )}
        </div>
      )}
      {isMultipart && !usesQuery && (
        <>
          {formFields.length > 0 && (
            <div style={argGrid}>
              {formFields.map(argument => (
                <ArgumentField
                  key={argument.name}
                  argument={argument}
                  value={args[argument.name] ?? ''}
                  onChange={value => setArgs({ ...args, [argument.name]: value })} />
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 12 }}>
            {fileArgs.map(argument => {
              // Magic peculiarity: a multipart argument named "file" accepts
              // MULTIPLE files, all transmitted as parts named "file".
              const selected = files[argument.name] ?? [];
              return (
                <div
                  key={argument.name}
                  style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
                  <span>
                    {argument.name}
                    <span className="muted" style={{ fontWeight: 400 }}> — one or more files</span>
                  </span>
                  {/*
                    * The native file input can't be styled, so it's hidden
                    * inside a label — clicking the label opens the picker
                    * just the same, and the label can look like any button.
                    */}
                  <label className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
                    Choose files…
                    <input
                      type="file"
                      multiple
                      style={{ display: 'none' }}
                      onChange={e => {
                        // The "file" argument accumulates across pickings.
                        const picked = Array.from(e.target.files ?? []);
                        setFiles({ ...files, [argument.name]: [...selected, ...picked] });
                        e.target.value = '';
                      }} />
                  </label>
                  {selected.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      // Or a text-only chip stretches to an image chip's height.
                      alignItems: 'flex-start',
                      gap: 4,
                    }}>
                      {selected.map((file, index) => (
                        <FileChip
                          key={index}
                          file={file}
                          onRemove={() => setFiles({
                            ...files,
                            [argument.name]: selected.filter((_, i) => i !== index),
                          })} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      {!usesQuery && !isMultipart && (
        <div style={{ height: 200, display: 'flex', flexDirection: 'column', marginBottom: 12 }}>
          <CodeEditor
            value={payload}
            onChange={setPayload}
            mode={consumesJson ? 'application/json' : 'hyperlambda'} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {canInvoke ? (
          <button className="btn" onClick={invoke} disabled={busy}>
            {busy ? 'Invoking…' : '▷ Invoke'}
          </button>
        ) : (
          <span className="muted">This endpoint cannot be invoked from here.</span>
        )}
        {verb !== 'socket' && (
          <button
            className="btn btn-secondary"
            title="OpenAPI specification for this endpoint"
            onClick={props.onOpenApi}>
            OpenAPI
          </button>
        )}
      </div>
    </div>
  );
}

/*
 * One picked file. Images get a thumbnail rendered straight onto the form,
 * so what's about to be uploaded is visible without opening anything.
 */
function FileChip({ file, onRemove }: { file: File; onRemove: () => void }) {

  const [thumbnail, setThumbnail] = useState<string | null>(null);

  /*
   * The object URL is created and revoked inside one effect, so the two are
   * always paired. Creating it during render instead leaves the cleanup
   * revoking a URL the next render still points at — which under StrictMode's
   * mount/unmount/remount means the image is revoked before it ever loads.
   */
  useEffect(() => {
    if (!file.type.startsWith('image/')) {
      setThumbnail(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setThumbnail(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    /*
     * With a thumbnail the chip turns into a small card — same background,
     * so the name and its image read as one item rather than two.
     */
    <span
      className="chip"
      style={thumbnail
        ? { flexDirection: 'column', alignItems: 'stretch', borderRadius: 12, padding: 8, gap: 6 }
        : undefined}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {file.name}
        <span className="muted" style={{ fontWeight: 400 }}>
          {Math.ceil(file.size / 1024)} KB
        </span>
        <button title="Remove" onClick={onRemove}>×</button>
      </span>
      {thumbnail && (
        <img
          src={thumbnail}
          alt=""
          style={{
            width: 150,
            height: 150,
            objectFit: 'cover',
            borderRadius: 8,
            display: 'block',
            background: 'var(--surface)',
          }} />
      )}
    </span>
  );
}

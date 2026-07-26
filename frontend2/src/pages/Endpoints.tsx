import SearchInput from '../components/SearchInput';
import Banner from '../components/Banner';
import { Fragment, useEffect, useMemo, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import { Modal } from '../components/Dialogs';
import OpenApiDialog from '../components/OpenApiDialog';
import ResultViewer, { RawResult } from '../components/ResultViewer';
import { BracesIcon, ChevronIcon } from '../components/Icons';
import { Endpoint, getOpenApiSpec, invokeEndpoint, listEndpoints } from '../lib/api';

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

/*
 * The module an endpoint belongs to — magic/system/<module>/… is a system
 * module, magic/modules/<module>/… and magic/<module>/… are user modules.
 */
function moduleOf(endpoint: Endpoint): { name: string; system: boolean } {
  const parts = endpoint.path.split('/');
  if (parts[1] === 'system') {
    return { name: parts[2] ?? 'system', system: true };
  }
  if (parts[1] === 'modules') {
    return { name: parts[2] ?? 'modules', system: false };
  }
  return { name: parts[1] ?? endpoint.path, system: false };
}

interface InvokeResult extends RawResult {
  elapsed: number;
}

interface ModuleGroup {
  key: string;
  name: string;
  system: boolean;
  folder: string;
  endpoints: Endpoint[];
}

export default function Endpoints() {

  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [filter, setFilter] = useState('');
  const [showSystem, setShowSystem] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<InvokeResult | null>(null);
  const [openApiSpec, setOpenApiSpec] = useState<{ json: string; target: string } | null>(null);

  useEffect(() => {
    listEndpoints()
      .then(setEndpoints)
      .catch(err => setError(err.message));
  }, []);

  const query = filter.trim().toLowerCase();

  const groups = useMemo(() => {
    const map = new Map<string, ModuleGroup>();
    for (const endpoint of endpoints) {
      const module = moduleOf(endpoint);
      if (module.system && !showSystem) {
        continue;
      }
      if (query &&
          !endpoint.path.toLowerCase().includes(query) &&
          !endpoint.verb.toLowerCase().includes(query) &&
          !module.name.toLowerCase().includes(query)) {
        continue;
      }
      const key = (module.system ? 'system:' : 'user:') + module.name;
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: module.name,
          system: module.system,
          folder: (module.system ? '/system/' : '/modules/') + module.name + '/',
          endpoints: [],
        });
      }
      map.get(key)!.endpoints.push(endpoint);
    }
    const list = [...map.values()];
    for (const group of list) {
      group.endpoints.sort((left, right) =>
        left.path.localeCompare(right.path) || left.verb.localeCompare(right.verb));
    }
    // User modules first, system modules last, alphabetical within each.
    return list.sort((left, right) =>
      Number(left.system) - Number(right.system) || left.name.localeCompare(right.name));
  }, [endpoints, query, showSystem]);

  const shown = groups.reduce((total, group) => total + group.endpoints.length, 0);
  const isOpen = (key: string) => query ? true : expandedModules.has(key);

  function toggleModule(key: string) {
    const next = new Set(expandedModules);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setExpandedModules(next);
  }

  // Shows the spec for a module folder or a single endpoint's .hl file.
  async function showOpenApi(target: string) {
    try {
      const spec = await getOpenApiSpec(target);
      setOpenApiSpec({ json: JSON.stringify(spec, null, 2), target });
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <h1>Endpoints</h1>
          <p>
            {shown} of {endpoints.length} endpoints · {groups.length} modules
          </p>
        </div>
        <span style={{ flex: 1 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={showSystem}
            onChange={e => setShowSystem(e.target.checked)} />
          Show system endpoints
        </label>
        <SearchInput
          placeholder="Filter endpoints…"
          value={filter}
          onChange={setFilter}
          style={{ width: 300 }} />
      </div>
      {error && <Banner onClose={() => setError('')} style={{ marginBottom: 12 }}>{error}</Banner>}
      <div>
      {groups.map(group => (
        <div
          className="card"
          key={group.key}
          style={{ padding: 0, overflow: 'hidden', marginBottom: 10 }}>
          <div
            className={'module-header' + (group.system ? ' system' : '')}
            onClick={() => toggleModule(group.key)}>
            <span className="tree-chevron">
              <ChevronIcon open={isOpen(group.key)} />
            </span>
            <strong>{group.name}</strong>
            {group.system && <span className="badge badge-debug">system</span>}
            <span className="muted">
              {group.endpoints.length} endpoint{group.endpoints.length === 1 ? '' : 's'}
            </span>
            <span style={{ flex: 1 }} />
            <button
              className="icon-btn"
              title={'OpenAPI specification for ' + group.folder}
              onClick={e => { e.stopPropagation(); showOpenApi(group.folder); }}>
              <BracesIcon />
            </button>
          </div>
          {isOpen(group.key) && (
            <table>
              <tbody>
                {group.endpoints.map(endpoint => {
                  const key = endpoint.verb + ' ' + endpoint.path;
                  return (
                    <Fragment key={key}>
                      <tr className="clickable" onClick={() => setExpanded(expanded === key ? null : key)}>
                        <td style={{ width: 90 }}>
                          <span className={'badge badge-' + endpoint.verb.toLowerCase()}>
                            {endpoint.verb}
                          </span>
                        </td>
                        <td className="mono">{endpoint.path}</td>
                        <td style={{ textAlign: 'right' }}>
                          {(endpoint.auth ?? []).map(role =>
                            <span className="chip" key={role}>{role}</span>)}
                        </td>
                      </tr>
                      {expanded === key && (
                        <tr>
                          <td colSpan={3} style={{ background: 'var(--accent-soft)', padding: 12 }}>
                            <div className="card" style={{ padding: 16 }}>
                              <InvokePanel
                                endpoint={endpoint}
                                onResult={setResult}
                                onOpenApi={() => showOpenApi(
                                  '/' + endpoint.path.substring('magic/'.length) +
                                  '.' + endpoint.verb.toLowerCase() + '.hl')} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ))}
      </div>
      {result !== null && (
        <Modal width={860} onClose={() => setResult(null)}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Response
            <span className={'badge ' + (result.status < 400 ? 'badge-get' : 'badge-error')}>
              {result.status}
            </span>
            <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>
              {result.elapsed} ms
            </span>
          </h2>
          <ResponseHeaders headers={result.headers} />
          <ResultViewer result={result} height="42vh" />
          <div className="modal-actions">
            <button className="btn" onClick={() => setResult(null)}>Close</button>
          </div>
        </Modal>
      )}
      {openApiSpec !== null && (
        <OpenApiDialog
          json={openApiSpec.json}
          target={openApiSpec.target}
          onClose={() => setOpenApiSpec(null)} />
      )}
    </>
  );
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

function InvokePanel(props: {
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
 * The response headers the server sent. Collapsed to a single line by
 * default, since the body is what's usually wanted — but CORS, caching and
 * content-type problems are only diagnosable from here.
 */
function ResponseHeaders({ headers }: { headers?: Record<string, string> }) {

  const [open, setOpen] = useState(false);

  const names = Object.keys(headers ?? {}).sort();
  if (names.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        className="btn btn-small btn-secondary"
        onClick={() => setOpen(!open)}>
        {open ? 'Hide' : 'Show'} response headers ({names.length})
      </button>
      {open && (
        <div
          className="mono"
          style={{
            marginTop: 8,
            maxHeight: '20vh',
            overflow: 'auto',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '8px 12px',
            fontSize: 12,
          }}>
          {names.map(name => (
            <div key={name} style={{ display: 'flex', gap: 8, padding: '2px 0' }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0 }}>{name}:</span>
              <span style={{ overflowWrap: 'anywhere' }}>{headers![name]}</span>
            </div>
          ))}
        </div>
      )}
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

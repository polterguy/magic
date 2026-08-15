/*
 * Imports a third-party OpenAPI specification as endpoints in this cloudlet — the Endpoint
 * Generator's third tab, alongside generating from a database and from hand-written SQL. All three
 * produce the same thing: endpoints in a module.
 *
 * Two steps on purpose: read the specification first, then pick from it. Specifications routinely
 * declare hundreds of operations, and importing all of them would bury the cloudlet's own endpoints
 * and flood every connected AI agent's tool list — so choosing is the point, not a convenience.
 */

import { Fragment, useEffect, useState } from 'react';
import Select from './Select';
import SearchInput from './SearchInput';
import AiWaiter from './AiWaiter';
import RoleChips from './RoleChips';
import { ChevronIcon } from './Icons';
import SocketFeedback from './SocketFeedback';
import { Modal } from './Dialogs';
import {
  OpenApiOperation,
  OpenApiSpec,
  gibberish,
  importOpenApi,
  listRoles,
  loadConfig,
  parseOpenApi,
  saveConfig,
} from '../lib/api';
import { showToast } from '../lib/toast';

// Schemes we can generate. OAuth2 needs a token exchange, which this does not do.
const SCHEMES = [
  { id: 'none', label: 'No authentication' },
  { id: 'bearer', label: 'Bearer token' },
  { id: 'header', label: 'API key in a header' },
  { id: 'query', label: 'API key in a query parameter' },
  { id: 'basic', label: 'Basic (pre-encoded)' },
];

export default function ImportApiTab() {

  const [url, setUrl] = useState('');
  const [spec, setSpec] = useState<OpenApiSpec | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('');
  const [chosen, setChosen] = useState<Record<string, boolean>>({});

  const [moduleName, setModuleName] = useState('');
  // Re-importing a module is normal, so replacing is offered - but never silently.
  const [overwrite, setOverwrite] = useState(false);
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [baseUrl, setBaseUrl] = useState('');
  const [scheme, setScheme] = useState('none');
  const [authName, setAuthName] = useState('');
  const [configKey, setConfigKey] = useState('');
  // Same role picker the Endpoint Generator uses, rather than a free-text list to mistype.
  const [auth, setAuth] = useState<string[]>(['root']);
  const [authOpen, setAuthOpen] = useState(false);
  // Set once the terminal dialog is up, which is what starts the import.
  const [running, setRunning] = useState<{ channel: string; count: number } | null>(null);
  const [credential, setCredential] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    listRoles()
      .then(list => setRoles((list ?? []).map(role => role.name)))
      .catch(() => {});
  }, []);

  async function read() {
    if (!url.trim()) {
      showToast('Give me the URL of an OpenAPI specification', true);
      return;
    }
    setBusy(true);
    try {
      const result = await parseOpenApi(url.trim());
      setSpec(result);

      /*
       * Specifications often declare their server as a path rather than an absolute URL, so it is
       * resolved against wherever the specification itself was fetched from.
       */
      const declared = (result.servers ?? [])[0] ?? '';
      const absolute = declared.startsWith('http')
        ? declared
        : new URL(declared || '/', url.trim()).href;
      setBaseUrl(absolute.replace(/\/+$/, ''));

      const guess = (result.title ?? 'imported-api')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setModuleName(guess);
      setConfigKey('magic:integrations:' + guess + ':key');

      // Pre-selecting the scheme the specification itself declares, when there is exactly one.
      const schemes = result['security-schemes'] ?? [];
      if (schemes.length === 1) {
        const only = schemes[0];
        if (only.type === 'apiKey' && only.in === 'query') {
          setScheme('query');
          setAuthName(only['header-name'] ?? '');
        } else if (only.type === 'apiKey') {
          setScheme('header');
          setAuthName(only['header-name'] ?? '');
        } else if (only.type === 'http' && only.scheme === 'basic') {
          setScheme('basic');
        } else if (only.type === 'http') {
          setScheme('bearer');
        }
      }
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setBusy(false);
    }
  }

  async function run() {
    const operations = Object.keys(chosen).filter(id => chosen[id]);
    if (operations.length === 0) {
      showToast('Pick at least one operation to import', true);
      return;
    }
    if (!moduleName.trim()) {
      showToast('Give the module a name', true);
      return;
    }
    setBusy(true);
    try {
      /*
       * Importing hundreds of operations takes a while, and the endpoints appear one at a time —
       * so the work is reported into the shared terminal dialog as it happens, rather than the
       * page sitting still and then printing a wall of filenames.
       */
      const channel = (await gibberish()).result;
      setRunning({ channel, count: operations.length });
    } catch (err: any) {
      showToast(err.message, true, err.logId);
      setBusy(false);
    }
  }

  // Started by the dialog once its socket is listening.
  function beginImport(channel: string) {
    const operations = Object.keys(chosen).filter(id => chosen[id]);
    importOpenApi({
      url: url.trim(),
      moduleName: moduleName.trim(),
      baseUrl: baseUrl.trim(),
      operations,
      authScheme: scheme,
      authName: authName.trim(),
      configKey: configKey.trim(),
      auth: auth.join(','),
      overwrite,
      channel,
    })
      .catch(err => showToast(err.message, true, err.logId))
      .finally(() => setBusy(false));
  }

  /*
   * Writes the credential into the cloudlet's configuration under the key the generated endpoints
   * read. Done here rather than in the importer, so the secret travels through the configuration
   * endpoint that already exists for exactly this, and never through the import call.
   *
   * The key is a colon-separated path into the configuration JSON, so each segment becomes an
   * object along the way, and any existing value at that path is replaced.
   */
  async function storeCredential() {
    const value = credential ?? '';
    if (!value.trim()) {
      showToast('Give me the credential to store', true);
      return;
    }
    if (!configKey.trim()) {
      showToast('Give me the configuration key to store it under', true);
      return;
    }
    setSavingKey(true);
    try {
      const config = await loadConfig();
      const segments = configKey.trim().split(':').filter(Boolean);
      let node: any = config;
      segments.slice(0, -1).forEach(segment => {
        if (typeof node[segment] !== 'object' || node[segment] === null) {
          node[segment] = {};
        }
        node = node[segment];
      });
      node[segments[segments.length - 1]] = value;
      await saveConfig(config);
      showToast('Credential stored in your configuration');
      setCredential(null);
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setSavingKey(false);
    }
  }

  const operations = spec?.operations ?? [];
  const shown = operations.filter(op =>
    !filter ||
    op.id.toLowerCase().includes(filter.toLowerCase()) ||
    (op.summary ?? '').toLowerCase().includes(filter.toLowerCase()) ||
    (op.tag ?? '').toLowerCase().includes(filter.toLowerCase()));

  /*
   * Grouped by the specification's own tags, which is how its authors organised it — but plenty of
   * specifications (Stripe among them) tag nothing at all, which would put every operation under a
   * single heading. Those fall back to the first meaningful path segment, skipping a version prefix.
   */
  function heading(op: OpenApiOperation) {
    if (op.tag) {
      return op.tag;
    }
    const segments = op.path.split('/').filter(Boolean).filter(s => !/^v\d+$/i.test(s));
    return segments[0] ?? 'Other';
  }
  const groups: Record<string, OpenApiOperation[]> = {};
  shown.forEach(op => {
    const tag = heading(op);
    (groups[tag] = groups[tag] ?? []).push(op);
  });

  const count = Object.values(chosen).filter(Boolean).length;
  const allShownSelected = shown.length > 0 && shown.every(op => chosen[op.id]);

  function setMany(ops: OpenApiOperation[], selected: boolean) {
    const next = { ...chosen };
    ops.forEach(op => {
      if (selected) {
        next[op.id] = true;
      } else {
        delete next[op.id];
      }
    });
    setChosen(next);
  }

  return (
    <div className="card">
      <p className="muted" style={{ marginTop: 0 }}>
        Wraps a third-party API's operations as endpoints in your cloudlet. The generated endpoints
        read their credential from your configuration at invocation time, so it is never written
        into the files, and they become MCP tools like any other endpoint.
      </p>

      {/* Wrapped in a form-grid so the caption gets the same styling as every other field's. */}
      <div className="form-grid" style={{ marginTop: 20 }}>
        <label>OpenAPI specification URL
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              style={{ flex: 1, minWidth: 0 }}
              placeholder="https://api.example.com/openapi.json"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); read(); } }} />
            <button className="btn" onClick={read} disabled={busy}>
              {busy && !running ? 'Reading…' : 'Read'}
            </button>
          </div>
        </label>
      </div>

      {spec && (
        <>
          <div className="muted" style={{ margin: '12px 0' }}>
            {spec.title} {spec.version} · {operations.length} operations
          </div>

          <div className="form-grid columns">
            <label>Module name
              <input type="text" value={moduleName} onChange={e => setModuleName(e.target.value)} />
            </label>
            <label>Base URL
              <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} />
            </label>
            <label>Upstream authentication
              <Select value={scheme} onChange={setScheme}>
                {SCHEMES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </Select>
            </label>
            {/* Nothing to configure without a credential, so the whole field goes — keeping its
                cell, which is what stops the list below from moving. */}
            <label style={{ visibility: scheme === 'none' ? 'hidden' : 'visible' }}>
              Configuration key
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  style={{ flex: 1, minWidth: 0 }}
                  value={configKey}
                  onChange={e => setConfigKey(e.target.value)} />
                <button className="btn btn-secondary" onClick={() => setCredential('')}>
                  Set
                </button>
              </div>
            </label>
            {/*
              * The name only means anything for the two API-key schemes, so it is hidden for the
              * rest — but it keeps its cell rather than unmounting, since removing it reflowed
              * everything below every time the scheme changed.
              */}
            <label
              style={{
                visibility: scheme === 'header' || scheme === 'query' ? 'visible' : 'hidden',
              }}>
              {scheme === 'query' ? 'Query parameter name' : 'Header name'}
              <input
                type="text"
                value={authName}
                onChange={e => setAuthName(e.target.value)} />
            </label>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                Roles allowed to invoke
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span>
                  {auth.length > 0
                    ? auth.join(', ')
                    : <em className="muted">public — no roles</em>}
                </span>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setAuthOpen(!authOpen)}>
                  {authOpen ? 'Done' : 'Edit'}
                </button>
              </div>
            </div>
          </div>

          <label className="checkbox-row" style={{ marginTop: 12 }}>
            <input
              type="checkbox"
              checked={overwrite}
              onChange={e => setOverwrite(e.target.checked)} />
            Overwrite existing files
          </label>

          {authOpen && (
            <div style={{ marginTop: 8 }}>
              <RoleChips
                roles={roles}
                selected={auth}
                onToggle={(role, selected) => setAuth(selected
                  ? [...auth, role]
                  : auth.filter(candidate => candidate !== role))} />
            </div>
          )}

          <div className="toolbar" style={{ marginTop: 12 }}>
            <SearchInput placeholder="Filter operations…" value={filter} onChange={setFilter} />
          </div>

          <div
            className="card gen-table-card"
            style={{ padding: 0, overflow: 'auto', maxHeight: 420 }}>
            <table className="compact-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={allShownSelected}
                      onChange={() => setMany(shown, !allShownSelected)} />
                  </th>
                  <th>Operation</th>
                  <th style={{ width: 130 }}>
                    {count} of {shown.length} selected
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groups).sort().map(tag => {
                  const ops = groups[tag];
                  const allInGroup = ops.every(op => chosen[op.id]);
                  return (
                    <Fragment key={tag}>
                      <tr
                        className="clickable"
                        title="Click to show operations"
                        onClick={() => setExpandedTags(previous => {
                          const next = new Set(previous);
                          next.has(tag) ? next.delete(tag) : next.add(tag);
                          return next;
                        })}>
                        <td>
                          <input
                            type="checkbox"
                            checked={allInGroup}
                            onChange={() => setMany(ops, !allInGroup)}
                            onClick={e => e.stopPropagation()} />
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span className="tree-chevron">
                              <ChevronIcon open={expandedTags.has(tag)} />
                            </span>
                            <strong>{tag}</strong>
                          </span>
                        </td>
                        <td>
                          {ops.length} operation{ops.length === 1 ? '' : 's'}
                        </td>
                      </tr>
                      {expandedTags.has(tag) && (
                        <tr>
                          {/*
                            * Matching the CRUD table's detail row: 80px of left padding lines the
                            * operations up under the tag name above.
                            */}
                          <td colSpan={3} style={{ padding: '4px 14px 12px 80px' }}>
                            {ops.map(op => (
                              <label
                                key={op.id}
                                className="checkbox-row"
                                title={op.summary ?? op.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '3px 0',
                                  fontSize: 13,
                                }}>
                                <input
                                  type="checkbox"
                                  checked={!!chosen[op.id]}
                                  onChange={e => setMany([op], e.target.checked)} />
                                <span className="mono" style={{ minWidth: 56, flexShrink: 0 }}>
                                  {op.verb.toUpperCase()}
                                </span>
                                <span className="mono" style={{ flexShrink: 0 }}>{op.path}</span>
                                {op.summary && (
                                  <span
                                    className="muted"
                                    style={{
                                      minWidth: 0,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}>
                                    — {op.summary}
                                  </span>
                                )}
                              </label>
                            ))}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={3} className="muted" style={{ textAlign: 'center', padding: 16 }}>
                      No operations match your filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="form-row" style={{ marginTop: 16 }}>
        <button className="btn" onClick={run} disabled={busy || !spec || count === 0}>
          {busy && running ? 'Importing…' : count ? 'Import ' + count : 'Import'}
        </button>
      </div>
      {busy && !running && <AiWaiter />}
      {running && (
        <SocketFeedback
          title={'Importing ' + running.count + ' operation' + (running.count === 1 ? '' : 's')}
          channel={running.channel}
          onReady={() => beginImport(running.channel)}
          isComplete={message => message.message.startsWith('Done!')}
          progress={{
            noun: 'endpoint',
            total: running.count,
            counts: message => message.message.startsWith('Generated '),
          }}
          onClose={() => setRunning(null)} />
      )}
      {credential !== null && (
        <Modal
          width={520}
          onClose={() => setCredential(null)}
          onSubmit={storeCredential}>
          <h2>Store credential</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Saved into your cloudlet's configuration under{' '}
            <span className="mono">{configKey}</span>, which is where the generated endpoints read
            it from as they are invoked. It is never written into the generated files.
          </p>
          <div className="form-grid" style={{ marginTop: 16 }}>
            <label>Credential
              <input
                type="password"
                autoFocus
                autoComplete="off"
                value={credential}
                onChange={e => setCredential(e.target.value)} />
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setCredential(null)}>
              Cancel
            </button>
            <button className="btn" onClick={storeCredential} disabled={savingKey}>
              {savingKey ? 'Storing…' : 'Store'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

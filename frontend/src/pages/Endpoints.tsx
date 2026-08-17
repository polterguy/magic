import { showToast } from '../lib/toast';
import SearchInput from '../components/SearchInput';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Modal } from '../components/Dialogs';
import AiWaiter from '../components/AiWaiter';
import OpenApiDialog from '../components/OpenApiDialog';
import InvokePanel, { InvokeResult } from '../components/InvokePanel';
import ResponseDialog from '../components/ResponseDialog';
import DebugDialog from '../components/DebugDialog';
import { BracesIcon, ChevronIcon } from '../components/Icons';
import {
  DebugRecording,
  Endpoint,
  debugHyperlambda,
  getOpenApiSpec,
  listEndpoints,
  loadFile,
} from '../lib/api';


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


/*
 * The Hyperlambda file backing an endpoint — "magic/modules/foo/bar" invoked
 * as GET is "/modules/foo/bar.get.hl" on disk.
 */
function sourceFile(endpoint: Endpoint) {
  return '/' + endpoint.path.substring('magic/'.length)
    + '.' + endpoint.verb.toLowerCase() + '.hl';
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
  const [result, setResult] = useState<InvokeResult | null>(null);
  const [openApiSpec, setOpenApiSpec] = useState<{ json: string; target: string } | null>(null);
  const [recording, setRecording] = useState<{ file: string; steps: DebugRecording } | null>(null);
  const [loading, setLoading] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    listEndpoints()
      .then(setEndpoints)
      .catch(err => showToast(err.message, true, err.logId))
      .finally(() => setLoading(false));
  }, []);

  /*
   * ?filter= deep links — the Generator's done panel lands here filtered to
   * the module it just created. Consumed once into the filter box, so the
   * URL doesn't go stale when the user types their own filter.
   */
  // The row key to bring into view when it appears — consumed by its ref.
  const scrollTarget = useRef<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const target = searchParams.get('filter');
    if (target !== null) {
      setFilter(target);
      // A deep link into a system endpoint must also reveal system endpoints,
      // or the filter matches an empty list.
      if (target.startsWith('magic/system/')) {
        setShowSystem(true);
      }
      /*
       * The command palette names the exact verb too — that row opens its
       * invoke panel by itself and scrolls into view once rendered.
       */
      const verb = searchParams.get('expand');
      if (verb !== null) {
        const key = verb + ' ' + target;
        setExpanded(key);
        scrollTarget.current = key;
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
    setWaiting(true);
    try {
      const spec = await getOpenApiSpec(target);
      setOpenApiSpec({ json: JSON.stringify(spec, null, 2), target });
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  /*
   * Unlike Hyper IDE, which already has the file open in its editor, here the
   * source has to be fetched before it can be recorded — the debugger takes
   * Hyperlambda, not an endpoint URL.
   */
  async function runDebug(endpoint: Endpoint, args: Record<string, any>) {
    const file = sourceFile(endpoint);
    setWaiting(true);
    try {
      setRecording({ file, steps: await debugHyperlambda(await loadFile(file), args) });
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="page-title">
          <h1>Endpoints</h1>
          <p>
            {shown} of {endpoints.length} endpoints · {groups.length} modules
          </p>
        </div>
        <div className="page-tools">
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
      </div>
      {loading && (
        <div className="spinner-panel">
          <div className="spinner" />
          <span className="muted">Loading endpoints…</span>
        </div>
      )}
      <div>
      {groups.map(group => (
        <div
          className="card"
          key={group.key}
          style={{ padding: 0, overflow: 'hidden', marginBottom: 10 }}>
          <div
            className={'module-header' + (group.system ? ' system' : '')}
            tabIndex={0}
            role="button"
            aria-expanded={isOpen(group.key)}
            onClick={() => toggleModule(group.key)}
            onKeyDown={event => {
              if (event.target === event.currentTarget &&
                  (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                toggleModule(group.key);
              }
            }}>
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
                      <tr
                        className="clickable"
                        tabIndex={0}
                        ref={element => {
                          // One-shot: the palette's deep link lands here.
                          if (element && scrollTarget.current === key) {
                            scrollTarget.current = null;
                            element.scrollIntoView({ block: 'center' });
                          }
                        }}
                        onClick={() => setExpanded(expanded === key ? null : key)}
                        onKeyDown={event => {
                          if (event.target === event.currentTarget &&
                              (event.key === 'Enter' || event.key === ' ')) {
                            event.preventDefault();
                            setExpanded(expanded === key ? null : key);
                          }
                        }}>
                        <td className="verb-cell" style={{ width: 90 }}>
                          <span className={'badge badge-' + endpoint.verb.toLowerCase()}>
                            {endpoint.verb}
                          </span>
                        </td>
                        <td className="mono" data-label="Path">{endpoint.path}</td>
                        <td style={{ textAlign: 'right' }} data-label="Auth">
                          <span className="role-chips">
                            {(endpoint.auth ?? []).map(role =>
                              <span className="chip" key={role}>{role}</span>)}
                          </span>
                        </td>
                      </tr>
                      {expanded === key && (
                        <tr>
                          <td colSpan={3} style={{ background: 'var(--accent-soft)', padding: 12 }}>
                            <div className="card" style={{ padding: 16 }}>
                              <InvokePanel
                                endpoint={endpoint}
                                onResult={setResult}
                                onDebug={args => runDebug(endpoint, args)}
                                onEdit={() => navigate(
                                  '/hyper-ide?open=' + encodeURIComponent(sourceFile(endpoint)))}
                                onOpenApi={() => showOpenApi(sourceFile(endpoint))} />
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
        <ResponseDialog result={result} httpInvocation onClose={() => setResult(null)} />
      )}
      {recording !== null && (
        <DebugDialog
          filename={recording.file}
          recording={recording.steps}
          onClose={() => setRecording(null)} />
      )}
      {openApiSpec !== null && (
        <OpenApiDialog
          json={openApiSpec.json}
          target={openApiSpec.target}
          onClose={() => setOpenApiSpec(null)} />
      )}
      {waiting && <AiWaiter />}
    </>
  );
}

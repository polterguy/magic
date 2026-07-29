import { showToast } from '../lib/toast';
import SearchInput from '../components/SearchInput';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Modal } from '../components/Dialogs';
import OpenApiDialog from '../components/OpenApiDialog';
import InvokePanel, { InvokeResult } from '../components/InvokePanel';
import ResponseDialog from '../components/ResponseDialog';
import { BracesIcon, ChevronIcon } from '../components/Icons';
import { Endpoint, getOpenApiSpec, listEndpoints } from '../lib/api';


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

  useEffect(() => {
    listEndpoints()
      .then(setEndpoints)
      .catch(err => showToast(err.message, true));
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
      showToast(err.message, true);
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
        <ResponseDialog result={result} httpInvocation onClose={() => setResult(null)} />
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





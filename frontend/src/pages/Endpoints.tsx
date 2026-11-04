import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import AiWaiter from '../components/AiWaiter';
import DebugDialog from '../components/DebugDialog';
import { groupEndpoints, sourceFile } from '../components/endpoints/helpers';
import ModuleCard from '../components/endpoints/ModuleCard';
import type { InvokeResult } from '../components/InvokePanel';
import OpenApiDialog from '../components/OpenApiDialog';
import ResponseDialog from '../components/ResponseDialog';
import SearchInput from '../components/SearchInput';
import { ModuleListSkeleton } from '../components/Skeleton';
import {
  debugHyperlambda,
  DebugRecording,
  Endpoint,
  getOpenApiSpec,
  listEndpoints,
  loadFile,
} from '../lib/api';
import { showError } from '../lib/errors';

export default function Endpoints() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [filter, setFilter] = useState('');
  const [showSystem, setShowSystem] = useState(false);
  const [publicOnly, setPublicOnly] = useState(false);
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
      .catch((err: unknown) => showError(err))
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
  const linkFilter = searchParams.get('filter');
  const linkPublicOnly = searchParams.get('publicOnly') === '1';
  const linkVerb = searchParams.get('expand');
  const link = searchParams.toString();
  const [consumedLink, setConsumedLink] = useState('');
  if (consumedLink !== link) {
    setConsumedLink(link);
    if (linkPublicOnly) {
      setPublicOnly(true);
    }
    if (linkFilter !== null) {
      setFilter(linkFilter);
      // A deep link into a system endpoint must also reveal system endpoints,
      // or the filter matches an empty list.
      if (linkFilter.startsWith('magic/system/')) {
        setShowSystem(true);
      }
      /*
       * The command palette names the exact verb too — that row opens its
       * invoke panel by itself and scrolls into view once rendered.
       */
      if (linkVerb !== null) {
        setExpanded(linkVerb + ' ' + linkFilter);
      }
    }
  }
  useEffect(() => {
    if (linkFilter !== null && linkVerb !== null) {
      scrollTarget.current = linkVerb + ' ' + linkFilter;
    }
    if (linkFilter !== null || linkPublicOnly) {
      setSearchParams({}, { replace: true });
    }
  }, [linkFilter, linkVerb, linkPublicOnly, setSearchParams]);

  const query = filter.trim().toLowerCase();

  const groups = useMemo(
    () => groupEndpoints(endpoints, query, showSystem, publicOnly),
    [endpoints, query, showSystem, publicOnly],
  );

  const shown = groups.reduce((total, group) => total + group.endpoints.length, 0);
  const isOpen = (key: string) => (query ? true : expandedModules.has(key));

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
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  /*
   * Unlike Hyper IDE, which already has the file open in its editor, here the
   * source has to be fetched before it can be recorded — the debugger takes
   * Hyperlambda, not an endpoint URL.
   */
  async function runDebug(endpoint: Endpoint, args: Record<string, unknown>) {
    const file = sourceFile(endpoint);
    setWaiting(true);
    try {
      setRecording({ file, steps: await debugHyperlambda(await loadFile(file), args) });
    } catch (err) {
      showError(err);
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
              onChange={e => setShowSystem(e.target.checked)}
            />{' '}
            Show system endpoints
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={publicOnly}
              onChange={e => setPublicOnly(e.target.checked)}
            />{' '}
            Public only
          </label>
          <SearchInput
            placeholder="Filter endpoints…"
            value={filter}
            onChange={setFilter}
            style={{ width: 300 }}
          />
        </div>
      </div>
      {loading && <ModuleListSkeleton />}
      <div>
        {!loading &&
          groups.map(group => (
            <ModuleCard
              key={group.key}
              group={group}
              open={isOpen(group.key)}
              onToggle={() => toggleModule(group.key)}
              expanded={expanded}
              setExpanded={setExpanded}
              scrollTarget={scrollTarget}
              onResult={setResult}
              onDebug={runDebug}
              onEdit={endpoint =>
                navigate('/hyper-ide?open=' + encodeURIComponent(sourceFile(endpoint)))
              }
              onOpenApi={showOpenApi}
            />
          ))}
      </div>
      {result !== null && (
        <ResponseDialog result={result} httpInvocation onClose={() => setResult(null)} />
      )}
      {recording !== null && (
        <DebugDialog
          filename={recording.file}
          recording={recording.steps}
          onClose={() => setRecording(null)}
        />
      )}
      {openApiSpec !== null && (
        <OpenApiDialog
          json={openApiSpec.json}
          target={openApiSpec.target}
          onClose={() => setOpenApiSpec(null)}
        />
      )}
      {waiting && <AiWaiter />}
    </>
  );
}

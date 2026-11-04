import { useEffect, useState } from 'react';
import { showToast } from '../../../lib/toast';
import { showError } from '../../../lib/errors';
import { MlType, generateSearchEndpoint, listRoles, mlTypes } from '../../../lib/api';
import { GeneratedInfo } from '../types';

// SearchTab's state: the endpoint, the type it searches and how, who may call it, and generating it.
export function useSearchTab() {
  const [moduleName, setModuleName] = useState('');
  const [endpointName, setEndpointName] = useState('search');
  const [verb, setVerb] = useState('get');
  const [types, setTypes] = useState<MlType[]>([]);
  const [type, setType] = useState('');
  // Empty searches the way the type itself is set to.
  const [retrieval, setRetrieval] = useState('');
  const [result, setResult] = useState('references');
  const [limit, setLimit] = useState('5');
  const [threshold, setThreshold] = useState('');
  const [uri, setUri] = useState('');
  const [meta, setMeta] = useState('');
  // Who may call the endpoint at all - empty means public.
  const [roles, setRoles] = useState<string[]>([]);
  const [auth, setAuth] = useState<string[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [rateLimit, setRateLimit] = useState('20');
  const [rateWindow, setRateWindow] = useState('60');
  const [cacheSeconds, setCacheSeconds] = useState('0');
  const [overwrite, setOverwrite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState('');
  // The endpoint that was just generated, so it can be opened straight from here.
  const [generated, setGenerated] = useState<GeneratedInfo | null>(null);

  useEffect(() => {
    mlTypes()
      .then(list => setTypes(list ?? []))
      .catch(() => showToast('Could not load machine learning types', true));
    listRoles()
      .then(list => setRoles((list ?? []).map(role => role.name)))
      .catch(() => {});
  }, []);

  // How the endpoint will really search, which decides whether each call costs an embedding.
  const effective = retrieval || types.find(t => t.type === type)?.retrieval || 'embeddings';

  async function generate() {
    setBusy(true);
    try {
      const response = await generateSearchEndpoint({
        moduleName,
        endpointName,
        verb,
        type,
        retrieval,
        threshold: threshold.trim() ? Number(threshold) : undefined,
        limit: Number(limit) || 5,
        uri: uri.trim(),
        meta: meta.trim(),
        result,
        authorization: auth.join(','),
        rateLimit: Number(rateLimit) || 0,
        rateWindow: Number(rateWindow) || 60,
        cacheSeconds: Number(cacheSeconds) || 0,
        overwrite,
      });
      const path = 'magic/modules/' + moduleName + '/' + endpointName;
      setPreview(response.hyperlambda);
      setGenerated({ path, file: response.file, verb });
      showToast('Endpoint ' + path + ' created');
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  return {
    moduleName,
    setModuleName,
    endpointName,
    setEndpointName,
    verb,
    setVerb,
    types,
    type,
    setType,
    retrieval,
    setRetrieval,
    result,
    setResult,
    limit,
    setLimit,
    threshold,
    setThreshold,
    uri,
    setUri,
    meta,
    setMeta,
    roles,
    auth,
    setAuth,
    authOpen,
    setAuthOpen,
    rateLimit,
    setRateLimit,
    rateWindow,
    setRateWindow,
    cacheSeconds,
    setCacheSeconds,
    overwrite,
    setOverwrite,
    busy,
    preview,
    generated,
    effective,
    generate,
  };
}

// Everything the tab's sections read and change.
export type SearchTabState = ReturnType<typeof useSearchTab>;

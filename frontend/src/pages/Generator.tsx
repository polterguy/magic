import { useState } from 'react';

import CrudTab from '../components/generator/CrudTab';
import SandboxTab from '../components/generator/SandboxTab';
import SearchTab from '../components/generator/SearchTab';
import SqlEndpointTab from '../components/generator/SqlEndpointTab';
import ImportApiTab from '../components/ImportApiTab';
import Tabs from '../components/Tabs';

export default function Generator() {
  /*
   * ?tab= — which generator to open on, so the Dashboard can link straight to
   * any one of the three rather than always landing on CRUD.
   */
  const [tab, setTab] = useState(
    () => new URLSearchParams(globalThis.location.search).get('tab') ?? 'crud',
  );
  /*
   * ?guided=1 — the Dashboard's "API from your data" flow: the same CRUD
   * generator wearing a step header, with every table preselected and a
   * done panel instead of a toast. Kept in the URL so a refresh stays in
   * the guided flow.
   *
   * The guided flow is a mode of the CRUD tab, not a separate page, so the
   * tabs stay on screen throughout — somebody who arrives here to wrap a
   * database and then realises they want to import an API, or wrap their own
   * SQL, can simply switch, rather than being stuck in a flow with no visible
   * way out. Switching away leaves the wizard chrome behind with the tab it
   * belongs to.
   */
  const [guided] = useState(
    () => new URLSearchParams(globalThis.location.search).get('guided') === '1',
  );
  const guiding = guided && tab === 'crud';
  return (
    <>
      <div className="page-header">
        <h1>{guiding ? 'API Wizard' : 'Endpoint Generator'}</h1>
        <p>
          {guiding
            ? 'Turn a database into secured REST endpoints'
            : 'Generate a CRUD backend from a database, publish your own SQL as an ' +
              'endpoint, expose a sandboxed Hyperlambda endpoint, search a machine ' +
              'learning type, or wrap a third-party API from its OpenAPI specification'}
        </p>
      </div>
      <Tabs
        tabs={[
          { id: 'crud', label: 'CRUD backend' },
          { id: 'sql', label: 'SQL endpoint' },
          { id: 'sandbox', label: 'Sandbox API' },
          { id: 'search', label: 'Search endpoint' },
          { id: 'import', label: 'Import API' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'crud' && <CrudTab guided={guiding} />}
      {tab === 'sql' && <SqlEndpointTab />}
      {tab === 'sandbox' && <SandboxTab />}
      {tab === 'search' && <SearchTab />}
      {tab === 'import' && <ImportApiTab />}
    </>
  );
}

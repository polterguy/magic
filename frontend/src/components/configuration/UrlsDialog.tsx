import { useState } from 'react';

import { servedByBackend } from '../../lib/backend';
import { useAuth } from '../../lib/useAuth';
import Banner from '../Banner';
import { Modal } from '../Dialogs';
import { asObject, configSection, parseObject, settingText } from './json';
import { allowsDashboard, parseFrontendUrls, toBackendUrl, trimTrailingSlashes } from './urls';

/*
 * Patches magic.backend.url and magic.frontend.urls in the configuration. The backend has one
 * address, the frontends are any number of dashboards. Both start out as the ones in use right
 * now, and saving is refused when it would leave this dashboard off the list, since the backend
 * would then stop answering it and the setting could not be changed back from here.
 */
export default function UrlsDialog(
  props: Readonly<{
    config: string;
    onClose: () => void;
    onSave: (config: string) => void;
  }>,
) {
  const { backend } = useAuth();
  const dashboard = globalThis.location.origin;
  const backendSection = configSection(props.config, 'magic', 'backend');
  const frontendSection = configSection(props.config, 'magic', 'frontend');

  const [backendUrl, setBackendUrl] = useState(
    settingText(backendSection.url, trimTrailingSlashes(backend?.url ?? '')),
  );
  const [frontendUrls, setFrontendUrls] = useState(
    settingText(frontendSection.urls, dashboard)
      .split(',')
      .map(part => part.trim())
      .filter(part => part !== '')
      .join('\n'),
  );
  const [error, setError] = useState('');

  function save() {
    const parsed = parseObject(props.config);
    if (!parsed) {
      return;
    }
    const backendValue = backendUrl.trim() === '' ? '' : toBackendUrl(backendUrl);
    if (backendValue === null) {
      setError('The backend URL must be an http or https address, such as https://api.example.com');
      return;
    }
    const { origins, invalid } = parseFrontendUrls(frontendUrls);
    if (invalid.length > 0) {
      setError('These are not http or https URLs: ' + invalid.join(', '));
      return;
    }
    if (!allowsDashboard(origins, dashboard, servedByBackend())) {
      setError(
        'The dashboard you are using is at ' +
          dashboard +
          ', and it is not in the list. The backend would stop answering it, and you could not ' +
          'change this back from here. Add it, or empty the list.',
      );
      return;
    }

    const magic = asObject(parsed.magic);
    parsed.magic = magic;
    patch(magic, 'backend', 'url', backendValue);
    patch(magic, 'frontend', 'urls', origins.join(','));
    props.onSave(JSON.stringify(parsed, null, 2));
  }

  return (
    <Modal width={560} onClose={props.onClose}>
      <h2>Backend and frontend URLs</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Used for the links in emails, such as password resets and invitations, and for deciding
        which dashboards may call this backend.
      </p>
      {error && (
        <Banner onClose={() => setError('')} style={{ marginBottom: 10 }}>
          {error}
        </Banner>
      )}
      <label className="modal-label">
        Backend URL{' '}
        <input
          type="text"
          autoComplete="off"
          placeholder="https://api.example.com"
          value={backendUrl}
          onChange={e => setBackendUrl(e.target.value)}
        />
      </label>
      <label className="modal-label">
        Frontend URLs{' '}
        <textarea
          rows={4}
          autoComplete="off"
          placeholder="https://dashboard.example.com"
          value={frontendUrls}
          onChange={e => setFrontendUrls(e.target.value)}
        />
      </label>
      <p className="muted" style={{ marginTop: 0, fontSize: 'var(--text-sm)' }}>
        One per line. The first one is the dashboard that links in emails point to. The dashboard
        you are using is {dashboard}. With no frontend URLs any website may call this backend, and
        no emails with links can be sent.
      </p>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>
          Cancel
        </button>
        <button className="btn" onClick={save}>
          Save
        </button>
      </div>
    </Modal>
  );
}

// Sets section[key] to value, or removes it when empty, and removes a section left with nothing.
function patch(magic: ReturnType<typeof asObject>, section: string, key: string, value: string) {
  const target = asObject(magic[section]);
  if (value === '') {
    delete target[key];
  } else {
    target[key] = value;
  }
  if (Object.keys(target).length === 0) {
    delete magic[section];
  } else {
    magic[section] = target;
  }
}

import { useEffect, useState } from 'react';

import { http } from '../../lib/api';
import { showError } from '../../lib/errors';
import { copyToClipboard } from '../../lib/toast';
import { Modal } from '../Dialogs';
import Select from '../Select';
import { configSection } from './json';
import {
  applyOidcValues,
  initialOidcValues,
  OIDC_CALLBACK_PATH,
  OIDC_CONSOLES,
  OIDC_FIELDS,
  OidcField,
  oidcProvidersFromSlots,
  OidcValues,
} from './oidc';

/*
 * Patches magic.oidc in the configuration — the client IDs OpenID sign-in
 * runs on. See OIDC_SLOT_PREFIX in ./oidc for where the provider list comes from.
 */
export default function OpenIdDialog(
  props: Readonly<{
    config: string;
    onClose: () => void;
    onSave: (config: string) => void;
  }>,
) {
  const existing = configSection(props.config, 'magic', 'oidc');

  // Null until the slot list answers, so loading and "none" look different.
  const [providers, setProviders] = useState<string[] | null>(null);
  const [provider, setProvider] = useState('');
  /*
   * Every provider's settings, keyed provider → config key → value — edits
   * accumulate across providers, and one Save writes all of them.
   */
  const [initial] = useState<OidcValues>(() => initialOidcValues(existing));
  const [values, setValues] = useState<OidcValues>(initial);

  // The selected provider's fields — client ID first, then whatever else it needs.
  const fields: OidcField[] = [
    { key: 'client-id', label: 'Client ID' },
    ...(OIDC_FIELDS[provider] ?? []),
  ];

  function setValue(key: string, value: string) {
    setValues({
      ...values,
      [provider]: { ...values[provider], [key]: value },
    });
  }

  useEffect(() => {
    http
      .get<string[]>('/magic/system/evaluator/slots')
      .then(slots => {
        const found = oidcProvidersFromSlots(slots);
        setProviders(found);
        setProvider(found[0] ?? '');
      })
      .catch((err: unknown) => {
        showError(err);
        setProviders([]);
      });
  }, []);

  const callbackUrl = globalThis.location.origin + OIDC_CALLBACK_PATH;

  function save() {
    const next = applyOidcValues(props.config, values, initial);
    if (next === null) {
      return;
    }
    props.onSave(next);
  }

  return (
    <Modal width={560} onClose={props.onClose} onSubmit={save}>
      <h2>OpenID sign-in</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Providers users can sign in to the dashboard with. A provider is on when it has a client ID,
        and its sign-in button disappears when the field is cleared. Register this redirect URI with
        the provider:
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span className="mono" style={{ fontSize: 13, overflowWrap: 'anywhere' }}>
          {callbackUrl}
        </span>
        <button
          className="btn btn-secondary btn-small"
          onClick={() => copyToClipboard(callbackUrl, 'The redirect URI')}
        >
          Copy
        </button>
      </div>
      {providers === null && (
        <div className="spinner-panel">
          <div className="spinner" />
        </div>
      )}
      {providers !== null && providers.length === 0 && (
        <div className="info-box">
          No OpenID providers are registered. The backend supports any provider for which a slot
          named <span className="mono">magic.openid.providers.&lt;name&gt;</span> exists — see the
          Google slot under <span className="mono">/system/auth/magic.startup/</span> for the
          pattern.
        </div>
      )}
      {providers !== null && providers.length > 0 && (
        <>
          <label className="modal-label">
            Provider
            <Select value={provider} onChange={setProvider}>
              {providers.map(name => (
                <option key={name} value={name}>
                  {name + (values[name]?.['client-id']?.trim() ? ' — configured' : '')}
                </option>
              ))}
            </Select>
          </label>
          {fields.map((field, index) => (
            <label className="modal-label" key={provider + '.' + field.key}>
              {field.label}
              <input
                type="text"
                className={field.secret ? 'secret' : undefined}
                autoComplete="off"
                placeholder={
                  field.placeholder ??
                  (index === 0 ? 'Empty — sign-in with this provider is off' : undefined)
                }
                value={values[provider]?.[field.key] ?? ''}
                onChange={e => setValue(field.key, e.target.value)}
              />
            </label>
          ))}
          {OIDC_CONSOLES[provider] && (
            <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
              Create an OAuth client (web application type) in{' '}
              <a href={OIDC_CONSOLES[provider].url} target="_blank" rel="noreferrer">
                {OIDC_CONSOLES[provider].name}
              </a>
              {', with the redirect URI above registered as an authorised redirect URI.'}
            </p>
          )}
        </>
      )}
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>
          Cancel
        </button>
        <button
          className="btn"
          disabled={providers === null || providers.length === 0}
          onClick={save}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}

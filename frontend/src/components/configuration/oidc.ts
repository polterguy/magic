import { asObject, fieldText, JsonObject, parseObject } from './json';

/*
 * The path OIDC providers send the id_token back to — must match what Login
 * registers with the provider, character for character.
 */
export const OIDC_CALLBACK_PATH = '/authentication/oidc-callback';

/*
 * Patches magic.oidc in the configuration — the client IDs OpenID sign-in
 * runs on.
 *
 * The dropdown is NOT hard-coded: the backend supports any provider for
 * which a slot named [magic.openid.providers.<name>] exists (Google ships
 * with the system), and those are dynamic slots, so the evaluator's slot
 * list tells us every provider the backend COULD use — configured or not.
 * Each provider slot hard-codes its own issuer, URL and scopes, leaving the
 * client ID as the one thing to configure; clearing it turns the provider's
 * sign-in button off.
 */
export const OIDC_SLOT_PREFIX = 'magic.openid.providers.';

// Where to create a client ID, for the providers we know the console URL of.
export const OIDC_CONSOLES: Record<string, { url: string; name: string }> = {
  google: {
    url: 'https://console.cloud.google.com/apis/credentials',
    name: 'the Google Cloud console',
  },
  microsoft: {
    url: 'https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
    name: 'the Microsoft Entra admin center',
  },
  github: { url: 'https://github.com/settings/developers', name: 'GitHub developer settings' },
  linkedin: {
    url: 'https://www.linkedin.com/developers/apps',
    name: 'the LinkedIn developer portal',
  },
  slack: { url: 'https://api.slack.com/apps', name: 'the Slack API dashboard' },
};

/*
 * The configuration each provider needs beyond its client ID. Every value
 * lives under magic.oidc.<provider>.<key> — the provider's startup slot is
 * the authority on what it reads. Providers absent here (google) take a
 * client ID only.
 */
export interface OidcField {
  key: string;
  label: string;
  secret?: boolean;
  placeholder?: string;
}

export const OIDC_FIELDS: Record<string, OidcField[]> = {
  microsoft: [
    { key: 'tenant', label: 'Directory (tenant) ID' },
    { key: 'client-secret', label: 'Client secret', secret: true },
  ],
  okta: [
    {
      key: 'issuer',
      label: 'Issuer URL',
      placeholder: 'https://dev-123456.okta.com/oauth2/default',
    },
    { key: 'client-secret', label: 'Client secret (optional)', secret: true },
  ],
  auth0: [
    {
      key: 'issuer',
      label: 'Issuer URL — exactly as Auth0 reports it, trailing slash included',
      placeholder: 'https://your-tenant.eu.auth0.com/',
    },
    { key: 'client-secret', label: 'Client secret (optional)', secret: true },
  ],
  keycloak: [
    {
      key: 'issuer',
      label: 'Realm issuer URL',
      placeholder: 'https://keycloak.example.com/realms/master',
    },
    { key: 'client-secret', label: 'Client secret (optional)', secret: true },
  ],
  linkedin: [{ key: 'client-secret', label: 'Client secret', secret: true }],
  slack: [{ key: 'client-secret', label: 'Client secret', secret: true }],
  github: [{ key: 'client-secret', label: 'Client secret', secret: true }],
};

// Every provider's settings, keyed provider → config key → value.
export type OidcValues = Record<string, Record<string, string>>;

// The dialog's starting values: what magic.oidc already holds, as text for the inputs.
export function initialOidcValues(existing: JsonObject): OidcValues {
  return Object.fromEntries(
    Object.keys(existing).map(name => [
      name,
      Object.fromEntries(
        Object.entries(asObject(existing[name])).map(([key, value]) => [key, fieldText(value)]),
      ),
    ]),
  );
}

// The provider names among the evaluator's slots, sorted.
export function oidcProvidersFromSlots(slots: string[] | null | undefined): string[] {
  return (slots ?? [])
    .filter(name => name.startsWith(OIDC_SLOT_PREFIX))
    .map(name => name.substring(OIDC_SLOT_PREFIX.length))
    .sort((a, b) => a.localeCompare(b));
}

/*
 * The editor's text with values written into magic.oidc — blank values remove
 * their key, a provider left with no keys is removed, and so is magic.oidc
 * when no provider is left. Null when the text isn't a JSON object.
 */
export function applyOidcValues(config: string, values: OidcValues): string | null {
  const parsed = parseObject(config);
  if (!parsed) {
    return null;
  }
  const magic = asObject(parsed.magic);
  parsed.magic = magic;
  const oidc = { ...asObject(magic.oidc) };
  for (const [name, settings] of Object.entries(values)) {
    const entry = { ...asObject(oidc[name]) };
    for (const [key, value] of Object.entries(settings)) {
      if (value.trim()) {
        entry[key] = value.trim();
      } else {
        delete entry[key];
      }
    }
    if (Object.keys(entry).length === 0) {
      delete oidc[name];
    } else {
      oidc[name] = entry;
    }
  }
  if (Object.keys(oidc).length === 0) {
    delete magic.oidc;
  } else {
    magic.oidc = oidc;
  }
  return JSON.stringify(parsed, null, 2);
}

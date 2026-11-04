import { OidcProvider } from '../../lib/api';

// The "Continue with …" buttons, one per OpenID provider the backend has configured.
export default function ProviderButtons(
  props: Readonly<{
    providers: OidcProvider[];
    busy: boolean;
    onSignIn: (provider: OidcProvider) => void;
  }>,
) {
  return (
    <>
      <div className="login-divider">
        <span>or</span>
      </div>
      {props.providers.map(provider => (
        <button
          key={provider.issuer}
          type="button"
          className="btn btn-secondary"
          disabled={props.busy}
          onClick={() => props.onSignIn(provider)}
        >
          Continue with {provider.name}
        </button>
      ))}
    </>
  );
}

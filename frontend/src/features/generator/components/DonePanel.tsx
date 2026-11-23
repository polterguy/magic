import { featureHref } from '@core/features';
import { Link } from 'react-router-dom';

import WizardSteps from './WizardSteps';

// The guided flow's final step, saying what was generated and where it lives.
export default function DonePanel(
  props: Readonly<{
    done: { generated: number; loc: number; module: string };
    auth: string[];
    onMore: () => void;
  }>,
) {
  const { done, auth } = props;
  const endpointsHref = featureHref('endpoints', '?filter=' + encodeURIComponent(done.module));
  const usersHref = featureHref('users');
  return (
    <>
      <WizardSteps step={3} />
      <div className="card" style={{ maxWidth: 640 }}>
        <h2 style={{ marginTop: 0 }}>Your API is live</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {done.generated} endpoints ({done.loc} lines of Hyperlambda) were generated under{' '}
          <span className="mono">/magic/{done.module}/</span>, secured for{' '}
          {auth.length > 0 ? (
            <strong>{auth.join(', ')}</strong>
          ) : (
            <em>everyone — no roles required</em>
          )}
          .
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {endpointsHref !== null && (
            <Link className="btn" to={endpointsHref}>
              Try your endpoints
            </Link>
          )}
          {usersHref !== null && (
            <Link className="btn btn-secondary" to={usersHref}>
              Manage users and roles
            </Link>
          )}
          <button className="btn btn-secondary" onClick={props.onMore}>
            Generate more
          </button>
        </div>
      </div>
    </>
  );
}

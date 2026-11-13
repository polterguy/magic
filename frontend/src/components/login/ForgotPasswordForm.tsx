import type { SubmitEvent } from 'react';

import Banner from '../Banner';
import BusyLabel from '../BusyLabel';

// A stable callback ref, so the field is focused once on mount rather than every render.
const focusOnMount = (element: HTMLInputElement | null) => element?.focus();

/*
 * The "login using magic link" screen: asks for a username, which for users
 * invited by email is their email address, and shows what the backend
 * answered once the link is sent.
 */
export default function ForgotPasswordForm(
  props: Readonly<{
    error: string;
    onDismissError: () => void;
    busy: boolean;
    forgotUser: string;
    onForgotUser: (value: string) => void;
    forgotSent: string;
    onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
    onBack: () => void;
  }>,
) {
  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={props.onSubmit}>
        <h1>magic</h1>
        <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
          {props.forgotSent ? 'Check your inbox' : "We'll email you a link that signs you in"}
        </p>
        {props.error && <Banner onClose={props.onDismissError}>{props.error}</Banner>}
        {props.forgotSent ? (
          <p style={{ textAlign: 'center', margin: 0 }}>{props.forgotSent}</p>
        ) : (
          <label>
            Username{' '}
            <input
              type="text"
              ref={focusOnMount}
              value={props.forgotUser}
              onChange={e => props.onForgotUser(e.target.value)}
              required
            />
          </label>
        )}
        {!props.forgotSent && (
          <button className="btn" type="submit" disabled={props.busy || !props.forgotUser.trim()}>
            <BusyLabel busy={props.busy} label="Send link" busyLabel="Sending…" />
          </button>
        )}
        <button type="button" className="link-like" onClick={props.onBack}>
          Back to sign in
        </button>
      </form>
    </div>
  );
}

/*
 * A full-screen waiter — a backdrop with bouncing dots, like the old
 * dashboard's openai-prompt waiter. Shown while a slow request is in flight
 * (AI generation, or executing Hyperlambda in the Playground): it covers the
 * screen because the result replaces what's on it, and clicking around while
 * that is pending only invites confusion about what changed.
 */

export default function AiWaiter() {
  return (
    <div className="ai-waiter">
      <div className="ai-waiter-dots">
        <span /><span /><span />
      </div>
    </div>
  );
}

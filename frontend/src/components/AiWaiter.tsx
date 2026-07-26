/*
 * Shown while the AI generates code — a backdrop with bouncing dots, like
 * the old dashboard's openai-prompt waiter. Covers the screen because
 * generation replaces what's in the editor, and clicking around while that
 * is in flight only invites confusion about what changed.
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

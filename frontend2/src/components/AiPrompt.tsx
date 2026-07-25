/*
 * "Where the Machine Creates the Code ..." — the AI prompt bar ported from
 * the old dashboard's openai-prompt component. Sends the prompt to the
 * Hyperlambda generator (hl) or the backend's OpenAI proxy (other file
 * types) and hands the generated snippet to the host page through onResult.
 * Renders nothing when OpenAI isn't configured on the backend.
 */

import { CSSProperties, FormEvent, useEffect, useState } from 'react';
import { aiQuery, openaiIsConfigured } from '../lib/api';

const TOOLTIPS: Record<string, string> = {
  hl: 'Ask the Machine to create some Hyperlambda code for you',
  ts: 'Ask the Machine to create TypeScript code for you',
  js: 'Ask the Machine to create JavaScript code for you',
  html: 'Ask the Machine to create HTML for you',
  htm: 'Ask the Machine to create HTML for you',
  css: 'Ask the Machine to create CSS for you',
  sql: 'Ask the Machine to create SQL for you',
  md: 'Ask the Machine to create Markdown for you',
};

export default function AiPrompt(props: {
  fileType: string;
  // Context for the generation — editor content, schema, etc. May be async
  // (SQL Studio exports the schema DDL on demand).
  getContext?: () => string | Promise<string>;
  session?: string;
  onResult: (snippet: string) => void;
  onError: (message: string) => void;
  style?: CSSProperties;
}) {

  const [configured, setConfigured] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    openaiIsConfigured()
      .then(response => setConfigured(response.result))
      .catch(() => setConfigured(false));
  }, []);

  async function ask(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || busy) {
      return;
    }
    setBusy(true);
    try {
      const context = await props.getContext?.();
      const response = await aiQuery(prompt, props.fileType, context, props.session);
      props.onResult(response.result);
      setPrompt('');
    } catch (err: any) {
      props.onError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return null;
  }

  return (
    <>
      <form
        onSubmit={ask}
        style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, ...props.style }}>
        <input
          type="text"
          placeholder="Where the Machine Creates the Code ..."
          title={TOOLTIPS[props.fileType] ?? 'Ask the Machine to help you out'}
          value={prompt}
          disabled={busy}
          onChange={event => setPrompt(event.target.value)}
          style={{ flex: 1, minWidth: 200 }} />
        <button
          className="btn btn-secondary"
          type="submit"
          title="Ask the AI to generate code"
          disabled={busy || !prompt.trim()}>
          {busy ? 'Asking…' : 'Ask'}
        </button>
      </form>
      {busy && (
        <div className="ai-waiter">
          <div className="ai-waiter-dots">
            <span /><span /><span />
          </div>
        </div>
      )}
    </>
  );
}

/*
 * The dashboard's action cards — each one a single next step for the
 * cloudlet: becoming an AI agent, adding an OpenAI key, generating endpoints,
 * or serving a frontend.
 */

import { Link } from 'react-router-dom';
import { httpUrl } from '../../lib/backend';
import { copyToClipboard } from '../../lib/toast';

export function AgentPluginsCard(
  props: Readonly<{
    missingPlugins: string[];
    installing: boolean;
    onInstall: () => void;
    mcpUrl: string;
  }>,
) {
  const { missingPlugins, mcpUrl } = props;
  return missingPlugins.length > 0 ? (
    <div className="card agent-prompt" data-tour="mcp">
      <div style={{ flex: 1 }}>
        <h2 style={{ margin: '0 0 6px 0' }}>Turn this cloudlet into an AI agent</h2>
        <p className="muted" style={{ margin: 0 }}>
          The <strong>MCP</strong> plugin exposes your endpoints as tools AI agents can invoke, and
          the <strong>OAuth</strong> plugin secures them. You&apos;re missing{' '}
          {missingPlugins.join(' and ')}.
        </p>
      </div>
      <button className="btn btn-large" onClick={props.onInstall} disabled={props.installing}>
        {props.installing ? 'Installing…' : 'Install ' + missingPlugins.join(' + ')}
      </button>
    </div>
  ) : (
    <div className="card agent-prompt" data-tour="mcp">
      <div style={{ flex: 1 }}>
        <h2 style={{ margin: '0 0 6px 0' }}>This cloudlet is an AI agent</h2>
        <p className="muted" style={{ margin: 0 }}>
          MCP and OAuth are installed. Give an AI agent the URL below to let it discover and invoke
          your endpoints as tools.
        </p>
        <div className="mono" style={{ marginTop: 8, overflowWrap: 'anywhere' }}>
          {mcpUrl}
        </div>
      </div>
      <button className="btn btn-large" onClick={() => copyToClipboard(mcpUrl, 'The MCP URL')}>
        Copy MCP URL
      </button>
    </div>
  );
}

export function OpenAiKeyCard(props: Readonly<{ onConfigure: () => void }>) {
  return (
    <div className="card agent-prompt" data-tour="openai-key">
      <div style={{ flex: 1 }}>
        <h2 style={{ margin: '0 0 6px 0' }}>Add your OpenAI API key</h2>
        <p className="muted" style={{ margin: 0 }}>
          Machine Learning needs an OpenAI API key before you can train models, crawl content, or
          run chatbots — retrieval itself can run without one using keyword (BM25) search, but
          answers still come from a model. You can get one{' '}
          <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noreferrer">
            here
          </a>
          .
        </p>
      </div>
      <button className="btn btn-large" onClick={props.onConfigure}>
        OpenAI API key
      </button>
    </div>
  );
}

export function ApiWizardCard() {
  return (
    <div className="card agent-prompt agent-prompt-stacked" data-tour="api-wizard">
      <div>
        <h2 style={{ margin: '0 0 6px 0' }}>API Wizard</h2>
        <p className="muted" style={{ margin: 0 }}>
          Three ways to get endpoints: turn every table in a database into secured REST endpoints,
          publish your own SQL as an endpoint, or wrap somebody else&apos;s API from its OpenAPI
          specification. Whatever you generate is published to your AI agent as MCP tools. No
          database yet? <Link to="/databases">Connect or create one first</Link>.
        </p>
      </div>
      <div className="agent-prompt-actions">
        <Link className="btn btn-large" to="/generator?guided=1">
          CRUD backend
        </Link>
        <Link className="btn btn-secondary btn-large" to="/generator?tab=sql">
          SQL endpoint
        </Link>
        <Link className="btn btn-secondary btn-large" to="/generator?tab=import">
          Import API
        </Link>
      </div>
    </div>
  );
}

export function ExpertSystemCard(
  props: Readonly<{
    rootServed: boolean | null;
    installing: boolean;
    onInstall: () => void;
    backendUrl: string | undefined;
  }>,
) {
  return (
    <>
      {/*
       * Offered whenever the cloudlet's root URL is free, regardless of
       * whether an OpenAI key exists yet. Installing the frontend and
       * configuring a key are separate steps, and gating the offer on the
       * key hid it from exactly the people who have not set anything up.
       */}
      {props.rootServed === false && (
        <div className="card agent-prompt" data-tour="expert-system">
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 6px 0' }}>AI Expert System</h2>
            <p className="muted" style={{ margin: 0 }}>
              A complete chat client for your cloudlet — streaming answers from your own models, AI
              functions that actually do things, logins, and your own branding. Installing it serves
              the app from your cloudlet&apos;s root URL.
            </p>
          </div>
          <button className="btn btn-large" onClick={props.onInstall} disabled={props.installing}>
            {props.installing ? 'Installing…' : 'Install Expert System'}
          </button>
        </div>
      )}
      {props.rootServed === true && (
        <div className="card agent-prompt" data-tour="frontend">
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 6px 0' }}>Your frontend</h2>
            <p className="muted" style={{ margin: 0 }}>
              Your cloudlet is serving an application at its root URL.
            </p>
            <div className="mono" style={{ marginTop: 8, overflowWrap: 'anywhere' }}>
              {props.backendUrl}
            </div>
          </div>
          <a
            className="btn btn-large"
            href={httpUrl(props.backendUrl)}
            target="_blank"
            rel="noreferrer"
          >
            Open
          </a>
        </div>
      )}
    </>
  );
}

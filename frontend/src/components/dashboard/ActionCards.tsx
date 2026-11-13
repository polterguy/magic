/*
 * The dashboard's action cards — each one a single next step for the
 * cloudlet: becoming an AI agent, adding an OpenAI key, generating endpoints,
 * or serving a frontend.
 */

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { httpUrl } from '../../lib/backend';
import { copyToClipboard } from '../../lib/toast';
import BusyLabel from '../BusyLabel';
import { BoltIcon, CopyIcon, GearIcon, LayoutIcon, NeuralIcon, SparklesIcon } from '../Icons';

/*
 * The shared chrome: an icon tile, a title with an optional status badge, the
 * description, and the actions pinned to the bottom — so cards sitting side by
 * side line their buttons up whatever the length of their text.
 */
export function ActionCard(
  props: Readonly<{
    icon: ReactNode;
    title: string;
    status?: { label: string; tone: 'ok' | 'warn' };
    tour?: string;
    hero?: boolean;
    children: ReactNode;
    actions?: ReactNode;
  }>,
) {
  return (
    <section
      className={props.hero ? 'card dash-card dash-card-hero' : 'card dash-card'}
      data-tour={props.tour}
    >
      <div className="dash-card-head">
        <span className="dash-card-icon" aria-hidden="true">
          {props.icon}
        </span>
        <h2>{props.title}</h2>
        {props.status && (
          <span className={'dash-status dash-status-' + props.status.tone}>
            <span className="dash-status-dot" />
            {props.status.label}
          </span>
        )}
      </div>
      <div className="dash-card-body">{props.children}</div>
      {props.actions && <div className="dash-card-actions">{props.actions}</div>}
    </section>
  );
}

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
    <ActionCard
      hero
      tour="mcp"
      icon={<NeuralIcon />}
      title="Turn this cloudlet into an AI agent"
      status={{ label: 'Setup needed', tone: 'warn' }}
      actions={
        <button className="btn" onClick={props.onInstall} disabled={props.installing}>
          <BusyLabel
            busy={props.installing}
            label={'Install ' + missingPlugins.join(' + ')}
            busyLabel="Installing…"
          />
        </button>
      }
    >
      <p>
        The <strong>MCP</strong> plugin exposes your endpoints as tools AI agents can invoke, and
        the <strong>OAuth</strong> plugin secures them. You&apos;re missing{' '}
        {missingPlugins.join(' and ')}.
      </p>
    </ActionCard>
  ) : (
    <ActionCard
      hero
      tour="mcp"
      icon={<NeuralIcon />}
      title="This cloudlet is an AI agent"
      status={{ label: 'Live', tone: 'ok' }}
    >
      <p>
        MCP and OAuth are installed. Give an AI agent the URL below to let it discover and invoke
        your endpoints as tools.
      </p>
      <div className="dash-command">
        <span className="dash-command-prompt" aria-hidden="true">
          $
        </span>
        <span className="mono">{mcpUrl}</span>
        <button
          type="button"
          className="btn btn-small"
          title="Copy the MCP URL"
          onClick={() => copyToClipboard(mcpUrl, 'The MCP URL')}
        >
          <CopyIcon /> Copy MCP URL
        </button>
      </div>
    </ActionCard>
  );
}

export function OpenAiKeyCard(props: Readonly<{ onConfigure: () => void }>) {
  return (
    <ActionCard
      tour="openai-key"
      icon={<GearIcon />}
      title="Add your OpenAI API key"
      status={{ label: 'Required for AI', tone: 'warn' }}
      actions={
        <button className="btn" onClick={props.onConfigure}>
          OpenAI API key
        </button>
      }
    >
      <p>
        Machine Learning needs an OpenAI API key before you can train models, crawl content, or run
        chatbots — retrieval itself can run without one using keyword (BM25) search, but answers
        still come from a model. You can get one{' '}
        <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noreferrer">
          here
        </a>
        {'.'}
      </p>
    </ActionCard>
  );
}

export function ApiWizardCard() {
  return (
    <ActionCard
      tour="api-wizard"
      icon={<BoltIcon />}
      title="API Wizard"
      actions={
        <>
          <Link className="btn" to="/generator?guided=1">
            CRUD backend
          </Link>
          <Link className="btn btn-secondary" to="/generator?tab=sql">
            SQL endpoint
          </Link>
          <Link className="btn btn-secondary" to="/generator?tab=import">
            Import API
          </Link>
        </>
      }
    >
      <p>
        Three ways to get endpoints: turn every table in a database into secured REST endpoints,
        publish your own SQL as an endpoint, or wrap somebody else&apos;s API from its OpenAPI
        specification. Whatever you generate is published to your AI agent as MCP tools. No database
        yet? <Link to="/databases">Connect or create one first</Link>.
      </p>
    </ActionCard>
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
  /*
   * Offered whenever the cloudlet's root URL is free, regardless of whether an
   * OpenAI key exists yet. Installing the frontend and configuring a key are
   * separate steps, and gating the offer on the key hid it from exactly the
   * people who have not set anything up.
   */
  if (props.rootServed === false) {
    return (
      <ActionCard
        tour="expert-system"
        icon={<SparklesIcon />}
        title="AI Expert System"
        actions={
          <button className="btn" onClick={props.onInstall} disabled={props.installing}>
            <BusyLabel
              busy={props.installing}
              label="Install Expert System"
              busyLabel="Installing…"
            />
          </button>
        }
      >
        <p>
          A complete chat client for your cloudlet — streaming answers from your own models, AI
          functions that actually do things, logins, and your own branding. Installing it serves the
          app from your cloudlet&apos;s root URL.
        </p>
      </ActionCard>
    );
  }
  if (props.rootServed === true) {
    return (
      <ActionCard
        tour="frontend"
        icon={<LayoutIcon />}
        title="Your frontend"
        status={{ label: 'Serving', tone: 'ok' }}
        actions={
          <a className="btn" href={httpUrl(props.backendUrl)} target="_blank" rel="noreferrer">
            Open
          </a>
        }
      >
        <p>Your cloudlet is serving an application at its root URL.</p>
        <div className="dash-command">
          <span className="dash-command-prompt" aria-hidden="true">
            $
          </span>
          <span className="mono">{props.backendUrl}</span>
        </div>
      </ActionCard>
    );
  }
  return null;
}

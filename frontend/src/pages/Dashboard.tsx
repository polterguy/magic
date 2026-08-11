import OpenAiKeyDialog from '../components/OpenAiKeyDialog';
import Select from '../components/Select';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { Modal, useDialog } from '../components/Dialogs';
import { SECTIONS } from '../components/sections';
import SocketFeedback from '../components/SocketFeedback';
import {
  availablePlugins,
  backendInfo,
  Task,
  createBot,
  openaiModels,
  modelPriceLabel,
  OpenAiModel,
  openaiSystemMessages,
  countLog,
  countTasks,
  countUsers,
  executeTask,
  getVersion,
  installPlugin,
  listEndpoints,
  listFolders,
  listTasks,
  openaiIsConfigured,
} from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { openSupport } from '../lib/support';
import { RobotIcon } from '../components/Icons';
import { copyToClipboard, showToast } from '../lib/toast';

/*
 * Plugins that turn the cloudlet into an AI-agent endpoint — MCP exposes its
 * endpoints as tools, OAuth secures them.
 */
const AGENT_PLUGINS = ['mcp', 'oauth'];

/*
 * Most MCP clients degrade badly past roughly this many tools — the agent
 * drowns in its own tool list and picks poorly, or refuses to connect at all.
 */
const MCP_ENDPOINT_WARNING = 300;

/*
 * The first handful of tasks, runnable straight from the dashboard. Editing
 * and scheduling stay in the Task Manager — this is only for firing one off.
 */
const TASK_PAGE_SIZE = 6;

function TaskSection(props: {
  // Total task count, so paging knows where the list ends.
  count: number | null;
}) {

  const [tasks, setTasks] = useState<Task[]>([]);
  const [page, setPage] = useState(0);
  const [running, setRunning] = useState<string | null>(null);
  const { confirm } = useDialog();

  useEffect(() => {
    listTasks(page * TASK_PAGE_SIZE, TASK_PAGE_SIZE)
      .then(list => setTasks(list ?? []))
      .catch(() => setTasks([]));
  }, [page]);

  async function execute(task: Task) {
    if (!await confirm({
      title: 'Execute task?',
      message: task.id + ' will run on your server right now.',
      confirmText: 'Execute',
    })) {
      return;
    }
    setRunning(task.id);
    try {
      await executeTask(task.id);
      showToast('Task ' + task.id + ' executed');
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setRunning(null);
    }
  }

  // Hidden only when there genuinely are no tasks, not while paging.
  if (props.count === 0) {
    return null;
  }

  const pageCount = props.count === null
    ? 1
    : Math.max(1, Math.ceil(props.count / TASK_PAGE_SIZE));

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Tasks</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Run one of your tasks now. <Link to="/task-manager">Task Manager</Link> is
        where you write and schedule them.
      </p>
      <div className="guide-grid">
        {tasks.map(task => (
          <div className="guide-card task-card" key={task.id}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="guide-title">{task.id}</span>
              <span className="guide-text line-clamp">
                {task.description || 'No description'}
              </span>
            </span>
            <button
              className="btn btn-secondary btn-small"
              disabled={running === task.id}
              title={'Run ' + task.id + ' on your server now'}
              onClick={() => execute(task)}>
              {running === task.id ? 'Running…' : '▷ Execute'}
            </button>
          </div>
        ))}
      </div>
      {pageCount > 1 && (
        <div className="pagination" style={{ marginTop: 14 }}>
          <Pagination page={page} pageCount={pageCount} onPage={setPage} />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {

  const { backend } = useAuth();
  const [version, setVersion] = useState('…');
  const [endpoints, setEndpoints] = useState<number | null>(null);
  const [users, setUsers] = useState<number | null>(null);
  const [tasks, setTasks] = useState<number | null>(null);
  const [logItems, setLogItems] = useState<number | null>(null);
  const [missingPlugins, setMissingPlugins] = useState<string[]>([]);
  const [installing, setInstalling] = useState(false);
  const [showEndpointWarning, setShowEndpointWarning] = useState(false);
  // Null until we know — the prompt stays hidden while the answer is pending.
  const [openaiConfigured, setOpenaiConfigured] = useState<boolean | null>(null);
  const [configuringOpenai, setConfiguringOpenai] = useState(false);

  // The endpoint an AI agent connects to for tool discovery.
  const mcpUrl = (backend?.url ?? '') + '/magic/modules/mcp/mcp';

  /*
   * A plugin counts as installed when its module folder exists — checking
   * Bazar manifests instead would miss modules built by hand, which carry
   * no manifest.
   */
  const checkPlugins = useCallback(async () => {
    try {
      const folders = await listFolders('/modules/') ?? [];
      setMissingPlugins(
        AGENT_PLUGINS.filter(name => !folders.includes('/modules/' + name + '/')));
    } catch {
      // Without a folder listing we can't tell — say nothing rather than nag.
      setMissingPlugins([]);
    }
  }, []);

  useEffect(() => {
    getVersion().then(r => setVersion(r.version)).catch(e => showToast(e.message, true));
    listEndpoints().then(r => setEndpoints(r.length)).catch(() => {});
    countUsers('').then(r => setUsers(r.count)).catch(() => {});
    countTasks().then(r => setTasks(r.count)).catch(() => {});
    countLog().then(r => setLogItems(r.count)).catch(() => {});
    checkPlugins();
    openaiIsConfigured()
      .then(response => setOpenaiConfigured(response.result))
      .catch(() => setOpenaiConfigured(null));
  }, [checkPlugins]);

  async function installAgentPlugins() {
    setInstalling(true);
        try {
      const available = await availablePlugins() ?? [];
      for (const name of missingPlugins) {
        const app = available.find((candidate: any) => candidate.name === name);
        if (!app) {
          throw new Error(name + ' is not available in the Bazar');
        }
        await installPlugin(app);
      }
      showToast('Installing ' + missingPlugins.join(' and ') + " — you'll be notified when it completes.");
      /*
       * Installation continues on a background thread, so the module folders
       * won't exist yet — flip the card now rather than leaving it asking
       * for something already on its way.
       */
      setMissingPlugins([]);
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setInstalling(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Connected to {backend?.url} as {backend?.username}</p>
      </div>
      <div className="kpi-grid">
        <div className="card">
          <div className="kpi-value">{version}</div>
          <div className="kpi-label">Magic version</div>
        </div>
        <div className="card">
          <div className={endpoints !== null && endpoints > MCP_ENDPOINT_WARNING
            ? 'kpi-value warn'
            : 'kpi-value'}>
            {endpoints ?? '…'}
          </div>
          <div className="kpi-label">Endpoints</div>
          {endpoints !== null && endpoints > MCP_ENDPOINT_WARNING && (
            <button
              className="kpi-warn-btn"
              title="Too many endpoints for MCP clients — click for details"
              onClick={() => setShowEndpointWarning(true)}>
              !
            </button>
          )}
        </div>
        <div className="card">
          <div className="kpi-value">{users ?? '…'}</div>
          <div className="kpi-label">Users</div>
        </div>
        <div className="card">
          <div className="kpi-value">{tasks ?? '…'}</div>
          <div className="kpi-label">Tasks</div>
        </div>
        <div className="card">
          <div className="kpi-value">{logItems ?? '…'}</div>
          <div className="kpi-label">Log items</div>
        </div>
      </div>
      {missingPlugins.length > 0 ? (
        <div className="card agent-prompt">
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 6px 0' }}>Turn this cloudlet into an AI agent</h2>
            <p className="muted" style={{ margin: 0 }}>
              The <strong>MCP</strong> plugin exposes your endpoints as tools AI agents
              can invoke, and the <strong>OAuth</strong> plugin secures them. You're
              missing {missingPlugins.join(' and ')}.
            </p>
          </div>
          <button
            className="btn btn-large"
            onClick={installAgentPlugins}
            disabled={installing}>
            {installing
              ? 'Installing…'
              : 'Install ' + missingPlugins.join(' + ')}
          </button>
        </div>
      ) : (
        <div className="card agent-prompt">
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 6px 0' }}>This cloudlet is an AI agent</h2>
            <p className="muted" style={{ margin: 0 }}>
              MCP and OAuth are installed. Give an AI agent the URL below to let it
              discover and invoke your endpoints as tools.
            </p>
            <div className="mono" style={{ marginTop: 8, overflowWrap: 'anywhere' }}>
              {mcpUrl}
            </div>
          </div>
          <button
            className="btn btn-large"
            onClick={() => copyToClipboard(mcpUrl, 'The MCP URL')}>
            Copy MCP URL
          </button>
        </div>
      )}
      {openaiConfigured === false && (
        <div className="card agent-prompt">
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 6px 0' }}>Add your OpenAI API key</h2>
            <p className="muted" style={{ margin: 0 }}>
              Machine Learning needs an OpenAI API key before you can train models,
              crawl content, or run chatbots. You can get one{' '}
              <a
                href="https://platform.openai.com/account/api-keys"
                target="_blank"
                rel="noreferrer">
                here
              </a>.
            </p>
          </div>
          <button className="btn btn-large" onClick={() => setConfiguringOpenai(true)}>
            OpenAI API key
          </button>
        </div>
      )}
      {openaiConfigured === true && <CreateChatbot />}
      {/*
        * Folded away rather than always open. It restates the navigation for
        * somebody seeing the dashboard for the first time, which is worth a
        * click to reach and not worth scrolling past every day after that.
        */}
      <details className="card guide-details" style={{ marginBottom: 16 }}>
        <summary>
          <span className="guide-summary-title">What everything does</span>
          <span className="muted">Every part of your cloudlet, and where to find it.</span>
        </summary>
        <div className="guide-grid">
          {SECTIONS.filter(section => section.description).map(section => (
            <Link className="guide-card" key={section.to} to={section.to}>
              <span className="guide-icon"><section.Icon /></span>
              <span>
                <span className="guide-title">{section.label}</span>
                <span className="guide-text">{section.description}</span>
              </span>
            </Link>
          ))}
          {/*
            * Last card, and the only one that isn't a route - the support bot
            * is a widget that opens over whatever you are looking at, so this
            * is a button wearing the same clothes as its neighbours.
            */}
          <button className="guide-card" type="button" onClick={openSupport}>
            <span className="guide-icon"><RobotIcon /></span>
            <span>
              <span className="guide-title">Ask Frank</span>
              <span className="guide-text">
                Magic's AI support agent, trained on the Hyperlambda and Magic
                documentation. Ask it how something works and it answers with
                code you can paste.
              </span>
            </span>
          </button>
        </div>
      </details>
      <TaskSection count={tasks} />
      {showEndpointWarning && (
        <Modal width={560} onClose={() => setShowEndpointWarning(false)}>
          <h2>Too many endpoints for MCP</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            This cloudlet has {endpoints} HTTP endpoints. Most MCP clients cannot
            deal effectively with much more than {MCP_ENDPOINT_WARNING} — AI
            agents drown in the tool list, making tool discovery and selection
            slow and unreliable, and some clients refuse to connect at all.
            Consider deleting endpoints you don't need, or restricting how many
            your MCP plugin exposes.
          </p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowEndpointWarning(false)}>
              Close
            </button>
          </div>
        </Modal>
      )}
      {configuringOpenai && (
        <OpenAiKeyDialog
          onClose={() => setConfiguringOpenai(false)}
          onSaved={() => {
            setConfiguringOpenai(false);
            setOpenaiConfigured(true);
            showToast('Your OpenAI API key was saved to your configuration');
          }} />
      )}
    </>
  );
}

/*
 * The chatbot wizard, as one card: point it at a website, pick a model and a
 * persona, and the backend crawls the site and builds a machine learning
 * model from what it finds.
 *
 * The crawl takes minutes and reports progress over a socket channel, so the
 * feedback window opens BEFORE the endpoint is invoked - the socket has to be
 * listening or the first messages are lost. Closing it only stops watching;
 * the crawl carries on regardless.
 */

/*
 * The chat models worth choosing from, newest first. The models endpoint
 * returns everything OpenAI has - embeddings, codex, fine tunes - which is
 * noise here, and these are spelled exactly as models.get.hl knows them, so
 * the backend can look up each one's token limit.
 */
const BOT_MODELS = [
  'gpt-5.6-terra',
  'gpt-5.6-sol',
  'gpt-5.6-luna',
  'gpt-5.5',
  'gpt-5.5-pro',
  'gpt-5.4',
  'gpt-5.4-pro',
  'gpt-5.4-mini',
  'gpt-5-chat-latest',
  'gpt-4.1-2025-04-14',
  'gpt-4.1-mini-2025-04-14',
];

// The balanced, cost-sensible default, matching the "default" model type.
const DEFAULT_BOT_MODEL = 'gpt-5.6-luna';

function CreateChatbot() {

  const [url, setUrl] = useState('');
  const [model, setModel] = useState(DEFAULT_BOT_MODEL);
  // Model id → its pricing, so the dropdown can show cost next to each option.
  const [prices, setPrices] = useState<Record<string, OpenAiModel>>({});
  const [flavors, setFlavors] = useState<any[]>([]);
  const [flavor, setFlavor] = useState('');
  const [max, setMax] = useState('25');
  const [autoDestruct, setAutoDestruct] = useState(true);
  const [crawl, setCrawl] = useState<{ channel: string } | null>(null);

  useEffect(() => {
    openaiSystemMessages()
      .then(list => {
        setFlavors(list ?? []);
        setFlavor((list ?? [])[0]?.name ?? '');
      })
      .catch(() => {});
    openaiModels()
      .then(list => setPrices(Object.fromEntries((list ?? []).map(m => [m.id, m]))))
      .catch(() => {});
  }, []);

  const selected = flavors.find(candidate => candidate.name === flavor);

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h2 style={{ marginTop: 0 }}>Chatbot Wizard</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Crawls the site, turns what it finds into training data, and gives you
        a chatbot you can embed. Takes a few minutes.
      </p>
      <form
        onSubmit={e => {
          e.preventDefault();
          if (url.trim() && !crawl) {
            setCrawl({ channel: 'create-bot-' + Date.now() });
          }
        }}>
        <div className="form-grid columns">
        <label>Website URL
          <input
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={e => setUrl(e.target.value)} />
        </label>
        <label>Model
          <Select value={model} onChange={value => setModel(value)}>
            {BOT_MODELS.map(option => (
              <option key={option} value={option}>{option}{modelPriceLabel(prices[option])}</option>
            ))}
          </Select>
        </label>
        <label>Persona
          <Select value={flavor} onChange={value => setFlavor(value)}>
            {flavors.map(candidate => (
              <option key={candidate.name} value={candidate.name}>{candidate.name}</option>
            ))}
          </Select>
        </label>
        <label>Max pages
          <input
            type="number"
            min="1"
            value={max}
            onChange={e => setMax(e.target.value)} />
        </label>
        </div>
        {/*
          * Below the captioned fields rather than inside them. A checkbox and
          * a button have no caption, so sitting them in that grid meant
          * faking one and forcing the height to match an input.
          */}
        <div className="form-row">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={autoDestruct}
              onChange={e => setAutoDestruct(e.target.checked)} />
            Delete after 7 days
          </label>
          {/* Submits the form, so Enter in any field starts the crawl too. */}
          <button
            className="btn"
            type="submit"
            disabled={!url.trim() || !!crawl}>
            Create chatbot
          </button>
        </div>
      </form>
      {selected?.description && (
        <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
          {selected.description}
        </p>
      )}
      {crawl && (
        <SocketFeedback
          title={'Creating a chatbot from ' + url}
          channel={crawl.channel}
          onReady={() => {
            createBot({
              url: url.trim(),
              model,
              // The persona's template, and the instruction that has OpenAI
              // fill its placeholders from the crawled site.
              flavor: selected?.prefix ?? '',
              instruction: selected?.instruction ?? '',
              max: Number(max) || 25,
              autoDestruct,
              channel: crawl.channel,
            }).catch(err => showToast(err.message, true, err.logId));
          }}
          isComplete={message => message.message.trim() === 'Done!'}
          renderDone={messages => {
            /*
             * The wizard builds a landing page named after the model and
             * announces it: "Creating default landing page for <model> by
             * copying <url>". The page lives at the backend URL + that name.
             * Fall back to the vectorised model name if the wording changes.
             */
            const text = messages.map(m => m.message).join('\n');
            const model = /landing page for (\S+)/.exec(text)?.[1]
              ?? /model '([^']+)'/.exec(text)?.[1];
            if (!model) {
              return null;
            }
            const href = backendInfo().url.replace(/\/+$/, '') + '/' + model;
            return (
              <a
                className="btn btn-secondary"
                href={href}
                target="_blank"
                rel="noopener noreferrer">
                Open chatbot ↗
              </a>
            );
          }}
          onClose={() => setCrawl(null)} />
      )}
    </div>
  );
}

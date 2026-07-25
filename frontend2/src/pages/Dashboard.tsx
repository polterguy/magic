import Banner from '../components/Banner';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal, useDialog } from '../components/Dialogs';
import {
  availablePlugins,
  Task,
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
  openaiSetKey,
} from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { copyToClipboard, showToast } from '../lib/toast';

/*
 * Plugins that turn the cloudlet into an AI-agent endpoint — MCP exposes its
 * endpoints as tools, OAuth secures them.
 */
const AGENT_PLUGINS = ['mcp', 'oauth'];

/*
 * What each part of the dashboard is for, linked so the Welcome card doubles
 * as a way in.
 */
const GUIDE = [
  {
    to: '/generator',
    icon: '⚙',
    title: 'Generator',
    text: 'Generate complete CRUD APIs from your database tables, or wrap a ' +
      'custom SQL statement in an endpoint of its own.',
  },
  {
    to: '/sql-studio',
    icon: '⛁',
    title: 'SQL Studio',
    text: 'Query your databases, and design them — create tables, add columns ' +
      'and foreign keys without writing the DDL yourself.',
  },
  {
    to: '/databases',
    icon: '⛃',
    title: 'Databases',
    text: 'Create new databases, connect to existing ones, and take backups.',
  },
  {
    to: '/hyper-ide',
    icon: '🗀',
    title: 'Hyper IDE',
    text: 'Edit any file on your server, execute Hyperlambda, and turn your ' +
      'endpoints into AI functions.',
  },
  {
    to: '/hyperlambda-playground',
    icon: '▷',
    title: 'Playground',
    text: 'Execute Hyperlambda on your server and see what it returns, ' +
      'without saving anything first.',
  },
  {
    to: '/endpoints',
    icon: '⇄',
    title: 'Endpoints',
    text: 'Browse every endpoint by module, invoke them with real arguments, ' +
      'and grab their OpenAPI specification.',
  },
  {
    to: '/machine-learning',
    icon: '✳',
    title: 'Machine Learning',
    text: 'Train AI models on your own content by crawling a site or uploading ' +
      'files, then embed them as chatbots.',
  },
  {
    to: '/task-manager',
    icon: '🕒',
    title: 'Task Manager',
    text: 'Write Hyperlambda tasks and schedule them to run on a repeating ' +
      'pattern, or once at a fixed date.',
  },
  {
    to: '/user-roles-management',
    icon: '👤',
    title: 'Users & roles',
    text: 'Decide who can reach your backend, and which roles gate which ' +
      'endpoints.',
  },
  {
    to: '/plugins',
    icon: '🧩',
    title: 'Plugins',
    text: 'Install modules and frontends from the Bazar to extend what your ' +
      'cloudlet can do.',
  },
  {
    to: '/configuration',
    icon: '⚙',
    title: 'Configuration',
    text: 'Edit your appsettings.json directly — connection strings, SMTP, ' +
      'authentication and everything else your server runs on.',
  },
  {
    to: '/log',
    icon: '≣',
    title: 'Log',
    text: 'Read what your backend has been doing, and dig into errors when ' +
      'something goes wrong.',
  },
];

/*
 * Takes the OpenAI API key and stores it in the backend's configuration,
 * the way the old dashboard's OpenAI configuration dialog does.
 */
function OpenAiKeyDialog(props: {
  onClose: () => void;
  onSaved: () => void;
}) {

  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    // The old dashboard's sanity check — real keys are far longer than this.
    if (key.length < 20) {
      setError('That does not look like a valid API key');
      return;
    }
    setBusy(true);
    try {
      await openaiSetKey(key);
      props.onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal width={560} onClose={props.onClose}>
      <h2>Configure OpenAI</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Supply your OpenAI API key. You can get one{' '}
        <a
          href="https://platform.openai.com/account/api-keys"
          target="_blank"
          rel="noreferrer">
          here
        </a>.
      </p>
      {error && <Banner onClose={() => setError('')} style={{ marginBottom: 10 }}>{error}</Banner>}
      <label className="modal-label">
        OpenAI API key
        <input
          type="password"
          autoFocus
          autoComplete="off"
          placeholder="sk-…"
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); }} />
      </label>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={busy || !key}>
          {busy ? 'Saving…' : 'Save key'}
        </button>
      </div>
    </Modal>
  );
}

/*
 * The first handful of tasks, runnable straight from the dashboard. Editing
 * and scheduling stay in the Task Manager — this is only for firing one off.
 */
const TASK_PAGE_SIZE = 6;

function TaskSection(props: {
  // Total task count, so paging knows where the list ends.
  count: number | null;
  notify: (text: string, isError: boolean) => void;
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
      props.notify('Task ' + task.id + ' executed', false);
    } catch (err: any) {
      props.notify(err.message, true);
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
          <button
            className="btn btn-secondary btn-small"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}>
            ‹ Prev
          </button>
          <span className="muted">{page + 1} / {pageCount}</span>
          <button
            className="btn btn-secondary btn-small"
            disabled={page >= pageCount - 1}
            onClick={() => setPage(page + 1)}>
            Next ›
          </button>
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
  const [error, setError] = useState('');
  const [missingPlugins, setMissingPlugins] = useState<string[]>([]);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState('');
  // Null until we know — the prompt stays hidden while the answer is pending.
  const [openaiConfigured, setOpenaiConfigured] = useState<boolean | null>(null);
  const [configuringOpenai, setConfiguringOpenai] = useState(false);

  // The endpoint an AI agent connects to for tool discovery.
  const mcpUrl = backend?.url + '/magic/modules/mcp/mcp';

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
    getVersion().then(r => setVersion(r.version)).catch(e => setError(e.message));
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
    setError('');
    try {
      const available = await availablePlugins() ?? [];
      for (const name of missingPlugins) {
        const app = available.find((candidate: any) => candidate.name === name);
        if (!app) {
          throw new Error(name + ' is not available in the Bazar');
        }
        await installPlugin(app);
      }
      setInstalled(missingPlugins.join(' and '));
      /*
       * Installation continues on a background thread, so the module folders
       * won't exist yet — flip the card now rather than leaving it asking
       * for something already on its way.
       */
      setMissingPlugins([]);
    } catch (err: any) {
      setError(err.message);
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
      {error && <Banner onClose={() => setError('')} style={{ marginBottom: 16 }}>{error}</Banner>}
      <div className="kpi-grid">
        <div className="card">
          <div className="kpi-value">{version}</div>
          <div className="kpi-label">Magic version</div>
        </div>
        <div className="card">
          <div className="kpi-value">{endpoints ?? '…'}</div>
          <div className="kpi-label">Endpoints</div>
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
      {installed && (
        <Banner isError={false} onClose={() => setInstalled('')} style={{ marginBottom: 16 }}>
          Installing {installed} — you'll be notified when it completes.
        </Banner>
      )}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Welcome</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Everything your cloudlet can do, and where to do it.
        </p>
        <div className="guide-grid">
          {GUIDE.map(item => (
            <Link className="guide-card" key={item.to} to={item.to}>
              <span className="guide-icon">{item.icon}</span>
              <span>
                <span className="guide-title">{item.title}</span>
                <span className="guide-text">{item.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
      <TaskSection
        count={tasks}
        notify={(text, isError) => isError ? setError(text) : showToast(text)} />
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

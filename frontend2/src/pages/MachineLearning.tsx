import { useCallback, useEffect, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import { Modal, useDialog } from '../components/Dialogs';
import SocketFeedback from '../components/SocketFeedback';
import Tabs from '../components/Tabs';
import {
  availableWorkflows,
  backendInfo,
  getFunctionDeclaration,
  gibberish,
  importUrl,
  listRoles,
  mlRequests,
  mlSnippetCreate,
  mlSnippetDelete,
  mlSnippets,
  mlSnippetsCount,
  mlSnippetUpdate,
  mlTypeCreate,
  mlTypeDelete,
  mlTypes,
  mlTypeUpdate,
  openaiChat,
  openaiIsConfigured,
  openaiModels,
  openaiThemes,
  uploadTrainingFile,
  vectoriseType,
} from '../lib/api';
import { useAuth } from '../lib/AuthContext';

type Tab = 'types' | 'training' | 'history';

export default function MachineLearning() {

  const [tab, setTab] = useState<Tab>('types');
  const [types, setTypes] = useState<any[]>([]);
  const [configured, setConfigured] = useState(true);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const refreshTypes = useCallback(async () => {
    try {
      setTypes(await mlTypes() ?? []);
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }, []);

  useEffect(() => {
    refreshTypes();
    openaiIsConfigured()
      .then(response => setConfigured(response.result))
      .catch(() => {});
  }, [refreshTypes]);

  return (
    <>
      <div className="page-header">
        <h1>Machine Learning</h1>
        <p>Your AI models, training data, and AI functions</p>
      </div>
      <Tabs
        tabs={[
          { id: 'types', label: 'Models' },
          { id: 'training', label: 'Training data' },
          { id: 'history', label: 'History' },
        ]}
        active={tab}
        onChange={id => setTab(id as Tab)} />
      {!configured && (
        <div className="error-box" style={{ marginBottom: 12 }}>
          OpenAI is not configured — add your API key in Configuration before
          training or querying models.
        </div>
      )}
      {feedback && (
        <div
          className={feedback.isError ? 'error-box' : 'success-box'}
          style={{ marginBottom: 12 }}>
          {feedback.text}
        </div>
      )}
      {tab === 'types' &&
        <TypesTab types={types} onChanged={refreshTypes} notify={setFeedback} />}
      {tab === 'training' &&
        <TrainingTab types={types} notify={setFeedback} />}
      {tab === 'history' &&
        <HistoryTab types={types} notify={setFeedback} />}
    </>
  );
}

/*
 * Models tab — the ml_types registry.
 */
function TypesTab(props: {
  types: any[];
  onChanged: () => void;
  notify: (feedback: { text: string; isError: boolean }) => void;
}) {

  const [editing, setEditing] = useState<any | null | 'new'>(null);
  const [vectorising, setVectorising] = useState<{ type: string; channel: string } | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [embedding, setEmbedding] = useState<string | null>(null);
  const { prompt } = useDialog();

  async function remove(type: string) {
    const typed = await prompt({
      title: 'Delete model?',
      message: 'This deletes the model and its training data. Type the model name to confirm.',
      label: 'Model name',
      confirmText: 'Delete',
    });
    if (typed !== type) {
      if (typed !== null) {
        props.notify({ text: 'Name did not match — nothing deleted', isError: true });
      }
      return;
    }
    try {
      await mlTypeDelete(type);
      props.notify({ text: 'Model ' + type + ' deleted', isError: false });
      props.onChanged();
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  async function vectorise(type: string) {
    try {
      const channel = (await gibberish()).result;
      setVectorising({ type, channel });
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  return (
    <>
      <div className="toolbar">
        <span className="muted">{props.types.length} models</span>
        <span className="spacer" />
        <button className="btn" onClick={() => setEditing('new')}>+ New model</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Model</th>
              <th style={{ width: 110 }}>Embeddings</th>
              <th style={{ width: 330 }}></th>
            </tr>
          </thead>
          <tbody>
            {props.types.map(type => (
              <tr key={type.type}>
                <td><strong>{type.type}</strong></td>
                <td className="mono">{type.model}</td>
                <td>{type.use_embeddings ? 'yes' : 'no'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setImporting(type.type)}>
                      Import
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setTesting(type.type)}>
                      Test
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => vectorise(type.type)}>
                      Vectorise
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setEmbedding(type.type)}>
                      Embed
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setEditing(type)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => remove(type.type)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing !== null && (
        <EditTypeDialog
          existing={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); props.onChanged(); }}
          notify={props.notify} />
      )}
      {vectorising && (
        <SocketFeedback
          title={'Vectorising ' + vectorising.type}
          channel={vectorising.channel}
          onReady={() => {
            vectoriseType(vectorising.type, vectorising.channel)
              .catch(err => props.notify({ text: err.message, isError: true }));
          }}
          onClose={() => setVectorising(null)} />
      )}
      {testing && (
        <TestChatDialog type={testing} onClose={() => setTesting(null)} />
      )}
      {importing && (
        <ImportDialog
          type={importing}
          onClose={() => setImporting(null)}
          notify={props.notify} />
      )}
      {embedding && (
        <EmbedDialog type={embedding} onClose={() => setEmbedding(null)} />
      )}
    </>
  );
}

/*
 * Import dialog — crawl a website (progress over the socket), or upload
 * training files.
 */
function ImportDialog(props: {
  type: string;
  onClose: () => void;
  notify: (feedback: { text: string; isError: boolean }) => void;
}) {

  const [tab, setTab] = useState('crawl');
  const [url, setUrl] = useState('');
  const [max, setMax] = useState('25');
  const [summarize, setSummarize] = useState(true);
  const [crawling, setCrawling] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function crawl() {
    if (!url) {
      return;
    }
    try {
      const channel = (await gibberish()).result;
      setCrawling(channel);
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  async function upload(files: File[]) {
    setUploading(true);
    let count = 0;
    try {
      for (const file of files) {
        const response = await uploadTrainingFile(props.type, file);
        count += response.count ?? 0;
      }
      props.notify({ text: count + ' training snippets imported', isError: false });
      props.onClose();
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <Modal width={620} onClose={props.onClose}>
        <h2>Import into {props.type}</h2>
        <Tabs
          tabs={[
            { id: 'crawl', label: 'Crawl website' },
            { id: 'upload', label: 'Upload files' },
          ]}
          active={tab}
          onChange={setTab} />
        {tab === 'crawl' && (
          <div className="form-grid">
            <label>Website URL
              <input
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={e => setUrl(e.target.value)} />
            </label>
            <label>Max pages
              <input type="number" value={max} onChange={e => setMax(e.target.value)} />
            </label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={summarize}
                onChange={e => setSummarize(e.target.checked)} />
              Summarize pages
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
              <button className="btn" onClick={crawl} disabled={!url}>Start crawling</button>
            </div>
          </div>
        )}
        {tab === 'upload' && (
          <div className="form-grid">
            <p className="muted" style={{ margin: 0 }}>
              Upload text, markdown, PDF, or CSV files — each becomes training
              snippets for {props.type}.
            </p>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', alignSelf: 'flex-start' }}>
              {uploading ? 'Uploading…' : 'Select files'}
              <input
                type="file"
                multiple
                accept=".txt,.md,.pdf,.csv"
                style={{ display: 'none' }}
                disabled={uploading}
                onChange={e => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = '';
                  if (files.length > 0) {
                    upload(files);
                  }
                }} />
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={props.onClose}>Close</button>
            </div>
          </div>
        )}
      </Modal>
      {crawling && (
        <SocketFeedback
          title={'Crawling ' + url}
          channel={crawling}
          onReady={() => {
            importUrl({
              url,
              type: props.type,
              delay: 1000,
              max: Number(max),
              threshold: 150,
              summarize,
              insert_url: false,
              images: true,
              lists: true,
              code: true,
              channel: crawling,
            }).catch(err => props.notify({ text: err.message, isError: true }));
          }}
          onClose={() => { setCrawling(null); props.onClose(); }} />
      )}
    </>
  );
}

/*
 * Embed dialog — builds the chatbot include-script for the model.
 */
function EmbedDialog(props: { type: string; onClose: () => void }) {

  const [themes, setThemes] = useState<string[]>([]);
  const [theme, setTheme] = useState('default');
  const [copied, setCopied] = useState(false);
  const backend = backendInfo();

  useEffect(() => {
    openaiThemes()
      .then(list => {
        setThemes(list ?? []);
        if (list?.length && !list.includes('default')) {
          setTheme(list[0]);
        }
      })
      .catch(() => {});
  }, []);

  const script = '<script src="' + backend.url +
    '/magic/system/openai/include-chatbot.js?type=' + encodeURIComponent(props.type) +
    '&theme=' + encodeURIComponent(theme) +
    '" defer></' + 'script>';

  return (
    <Modal width={640} onClose={props.onClose}>
      <h2>Embed {props.type}</h2>
      <div className="form-grid">
        <label>Theme
          <select value={theme} onChange={e => setTheme(e.target.value)}>
            {themes.length === 0 && <option value="default">default</option>}
            {themes.map(candidate => (
              <option key={candidate} value={candidate}>{candidate}</option>
            ))}
          </select>
        </label>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
            Paste this into your website
          </div>
          <pre className="result-json" style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {script}
          </pre>
        </div>
      </div>
      <div className="modal-actions">
        <button
          className="btn btn-secondary"
          onClick={() => {
            navigator.clipboard.writeText(script);
            setCopied(true);
          }}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button className="btn" onClick={props.onClose}>Close</button>
      </div>
    </Modal>
  );
}

/*
 * Create/edit model dialog — sends the full old-dashboard payload, with the
 * old defaults for everything not exposed here.
 */
function EditTypeDialog(props: {
  existing: any | null;
  onClose: () => void;
  onSaved: () => void;
  notify: (feedback: { text: string; isError: boolean }) => void;
}) {

  const existing = props.existing;
  const [models, setModels] = useState<{ id: string }[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [type, setType] = useState(existing?.type ?? '');
  const [model, setModel] = useState(existing?.model ?? '');
  const [temperature, setTemperature] = useState(String(existing?.temperature ?? 0.3));
  const [threshold, setThreshold] = useState(String(existing?.threshold ?? 0.3));
  const [maxTokens, setMaxTokens] = useState(String(existing?.max_tokens ?? 4000));
  const [maxContextTokens, setMaxContextTokens] =
    useState(String(existing?.max_context_tokens ?? 12000));
  const [maxRequestTokens, setMaxRequestTokens] =
    useState(String(existing?.max_request_tokens ?? 1000));
  const [auth, setAuth] = useState<string[]>(existing?.auth ? existing.auth.split(',') : []);
  const [supervised, setSupervised] = useState(existing ? existing.supervised === 1 : true);
  const [useEmbeddings, setUseEmbeddings] =
    useState(existing ? existing.use_embeddings === 1 : true);
  const [cached, setCached] = useState(existing?.cached === 1);
  const [greeting, setGreeting] =
    useState(existing?.greeting ?? 'Hi there, how can I help you?');
  const [systemMessage, setSystemMessage] = useState(existing?.system_message ??
    'You are a helpful assistant, and you will answer the users questions ' +
    'based upon the information found in your context');

  useEffect(() => {
    openaiModels()
      .then(list => setModels(list ?? []))
      .catch(() => {});
    listRoles()
      .then(list => setRoles((list ?? []).map(role => role.name)))
      .catch(() => {});
  }, []);

  async function save() {
    if (type.length < 2) {
      props.notify({ text: 'Give the model a type name', isError: true });
      return;
    }
    // Old-dashboard defaults for the fields this dialog doesn't expose.
    const payload: any = {
      type,
      model,
      max_context_tokens: Number(maxContextTokens),
      max_request_tokens: Number(maxRequestTokens),
      max_tokens: Number(maxTokens),
      temperature: Number(temperature),
      threshold: Number(threshold),
      base_url: existing?.base_url ?? '',
      supervised: supervised ? 1 : 0,
      recaptcha: existing?.recaptcha ?? 0,
      auth: auth.length > 0 ? auth.join(',') : null,
      cached: cached ? 1 : 0,
      prefix: existing?.prefix ?? '',
      system_message: systemMessage,
      conversation_starters: existing?.conversation_starters ?? '',
      greeting,
      contact_us: existing?.contact_us ?? '',
      lead_email: existing?.lead_email ?? '',
      api_key: existing?.api_key ?? null,
      twilio_account_id: existing?.twilio_account_id ?? '',
      twilio_account_sid: existing?.twilio_account_sid ?? '',
      webhook_incoming: existing?.webhook_incoming ?? '',
      webhook_outgoing: existing?.webhook_outgoing ?? '',
      webhook_incoming_url: existing?.webhook_incoming_url ?? '',
      webhook_outgoing_url: existing?.webhook_outgoing_url ?? '',
      initial_questionnaire: existing?.initial_questionnaire ?? null,
      use_embeddings: useEmbeddings ? 1 : 0,
      no_requests: existing?.no_requests ?? 0,
      search_postfix: existing?.search_postfix ?? '',
      max_requests: existing?.max_requests ?? -1,
      max_function_invocations: existing?.max_function_invocations ?? 5,
      max_session_items: existing?.max_session_items ?? 15,
      completion_slot: existing?.completion_slot ?? 'magic.ai.chat',
      vector_model: existing?.vector_model ?? 'text-embedding-ada-002',
    };
    try {
      if (existing) {
        await mlTypeUpdate(payload);
      } else {
        await mlTypeCreate(payload);
      }
      props.notify({ text: 'Model ' + type + ' saved', isError: false });
      props.onSaved();
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  return (
    <Modal width={640} onClose={props.onClose}>
      <h2>{existing ? 'Edit ' + existing.type : 'New model'}</h2>
      <div style={{ maxHeight: '60vh', overflow: 'auto', paddingRight: 6 }}>
        <div className="form-grid">
          {!existing && (
            <label>Type name
              <input type="text" value={type} onChange={e => setType(e.target.value)} />
            </label>
          )}
          <label>Model
            <select value={model} onChange={e => setModel(e.target.value)}>
              <option value="">Select model…</option>
              {models.map(candidate => (
                <option key={candidate.id} value={candidate.id}>{candidate.id}</option>
              ))}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>Temperature
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={e => setTemperature(e.target.value)} />
            </label>
            <label>Threshold
              <input
                type="number"
                step="0.1"
                value={threshold}
                onChange={e => setThreshold(e.target.value)} />
            </label>
            <label>Max tokens
              <input
                type="number"
                value={maxTokens}
                onChange={e => setMaxTokens(e.target.value)} />
            </label>
            <label>Max context tokens
              <input
                type="number"
                value={maxContextTokens}
                onChange={e => setMaxContextTokens(e.target.value)} />
            </label>
            <label>Max request tokens
              <input
                type="number"
                value={maxRequestTokens}
                onChange={e => setMaxRequestTokens(e.target.value)} />
            </label>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
              Authorisation (empty = public)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 90, overflow: 'auto' }}>
              {roles.map(role => (
                <label
                  key={role}
                  className="chip"
                  style={{
                    display: 'inline-flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}>
                  <input
                    type="checkbox"
                    checked={auth.includes(role)}
                    onChange={e => setAuth(e.target.checked
                      ? [...auth, role]
                      : auth.filter(candidate => candidate !== role))} />
                  {role}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={supervised}
                onChange={e => setSupervised(e.target.checked)} />
              Supervised
            </label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={useEmbeddings}
                onChange={e => setUseEmbeddings(e.target.checked)} />
              Use embeddings
            </label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={cached}
                onChange={e => setCached(e.target.checked)} />
              Cached
            </label>
          </div>
          <label>Greeting
            <input type="text" value={greeting} onChange={e => setGreeting(e.target.value)} />
          </label>
          <label>System message
            <textarea
              rows={5}
              value={systemMessage}
              onChange={e => setSystemMessage(e.target.value)} />
          </label>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save}>Save</button>
      </div>
    </Modal>
  );
}

/*
 * Test-chat dialog — prompts the model with stream=false.
 */
function TestChatDialog(props: { type: string; onClose: () => void }) {

  const { backend } = useAuth();
  const [session] = useState(() => Math.random().toString(36).substring(2));
  const [question, setQuestion] = useState('');
  const [exchanges, setExchanges] =
    useState<{ question: string; answer: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function ask() {
    if (!question.trim() || busy) {
      return;
    }
    setBusy(true);
    setError('');
    const asked = question;
    setQuestion('');
    try {
      const response = await openaiChat(asked, props.type, session, backend?.username ?? '');
      setExchanges(current => [...current, {
        question: asked,
        answer: response?.result ?? JSON.stringify(response),
      }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal width={720} onClose={props.onClose}>
      <h2>Test {props.type}</h2>
      {error && <div className="error-box" style={{ marginBottom: 10 }}>{error}</div>}
      <div
        className="result-json"
        style={{ height: '40vh', overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: 13 }}>
        {exchanges.length === 0 && !busy && 'Ask the model something to test it.'}
        {exchanges.map((exchange, index) => (
          <div key={index} style={{ marginBottom: 12 }}>
            <div style={{ color: '#9d8cff' }}>&gt; {exchange.question}</div>
            <div>{exchange.answer}</div>
          </div>
        ))}
        {busy && <div className="muted">Thinking…</div>}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          type="text"
          style={{ flex: 1 }}
          placeholder="Ask the model…"
          value={question}
          autoFocus
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') ask(); }} />
        <button className="btn" onClick={ask} disabled={busy}>Ask</button>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Close</button>
      </div>
    </Modal>
  );
}

/*
 * Training data tab.
 */
function TrainingTab(props: {
  types: any[];
  notify: (feedback: { text: string; isError: boolean }) => void;
}) {

  const PAGE_SIZE = 12;
  const [type, setType] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [editing, setEditing] = useState<any | null | 'new'>(null);
  const [pickingFunction, setPickingFunction] = useState(false);
  const { confirm } = useDialog();

  useEffect(() => {
    if (!type && props.types.length > 0) {
      setType(props.types[0].type);
    }
  }, [props.types, type]);

  const refresh = useCallback(async () => {
    if (!type) {
      return;
    }
    try {
      const [list, total] = await Promise.all([
        mlSnippets(type, filter, page * PAGE_SIZE, PAGE_SIZE),
        mlSnippetsCount(type, filter),
      ]);
      setSnippets(list ?? []);
      setCount(total.count);
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }, [type, filter, page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function remove(snippet: any) {
    if (!await confirm({
      title: 'Delete training snippet?',
      message: snippet.prompt?.substring(0, 100),
      confirmText: 'Delete',
      danger: true,
    })) {
      return;
    }
    try {
      await mlSnippetDelete(snippet.id);
      await refresh();
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  const pageCount = Math.ceil(count / PAGE_SIZE);

  return (
    <>
      <div className="toolbar">
        <select value={type} onChange={e => { setType(e.target.value); setPage(0); }}>
          {props.types.map(candidate => (
            <option key={candidate.type} value={candidate.type}>{candidate.type}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter prompts…"
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(0); }}
          style={{ width: 240 }} />
        <span className="muted">{count} snippets</span>
        <span className="spacer" />
        <button
          className="btn btn-secondary"
          onClick={() => setPickingFunction(true)}>
          + AI function
        </button>
        <button className="btn" onClick={() => setEditing('new')}>+ New snippet</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Prompt</th>
              <th style={{ width: 90 }}>Tokens</th>
              <th style={{ width: 110 }}>Embedded</th>
              <th style={{ width: 150 }}></th>
            </tr>
          </thead>
          <tbody>
            {snippets.map(snippet => (
              <tr key={snippet.id}>
                <td style={{
                  maxWidth: 520,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {snippet.prompt}
                </td>
                <td>{snippet.tokens}</td>
                <td>{snippet.embedding_vss ? 'yes' : 'no'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setEditing(snippet)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => remove(snippet)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pageCount > 1 && (
          <div className="pagination" style={{ padding: 12 }}>
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
      {editing !== null && (
        <EditSnippetDialog
          type={type}
          existing={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
          notify={props.notify} />
      )}
      {pickingFunction && (
        <AddFunctionDialog
          type={type}
          onClose={() => setPickingFunction(false)}
          onInstalled={() => { setPickingFunction(false); refresh(); }}
          notify={props.notify} />
      )}
    </>
  );
}

function EditSnippetDialog(props: {
  type: string;
  existing: any | null;
  onClose: () => void;
  onSaved: () => void;
  notify: (feedback: { text: string; isError: boolean }) => void;
}) {

  const [prompt, setPrompt] = useState(props.existing?.prompt ?? '');
  const [completion, setCompletion] = useState(props.existing?.completion ?? '');

  async function save() {
    try {
      if (props.existing) {
        await mlSnippetUpdate({
          id: props.existing.id,
          prompt,
          completion,
          type: props.type,
        });
      } else {
        await mlSnippetCreate({ prompt, completion, type: props.type, meta: null, uri: null });
      }
      props.notify({ text: 'Snippet saved', isError: false });
      props.onSaved();
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  return (
    <Modal width={820} onClose={props.onClose}>
      <h2>{props.existing ? 'Edit snippet' : 'New snippet'}</h2>
      <div className="form-grid">
        <label>Prompt
          <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} />
        </label>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Completion</div>
          <div style={{ height: '38vh', display: 'flex', flexDirection: 'column' }}>
            <CodeEditor value={completion} onChange={setCompletion} mode="markdown" />
          </div>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={!prompt}>Save</button>
      </div>
    </Modal>
  );
}

/*
 * "Create AI function" — lists installable functions, generates the
 * declaration for one, and saves it as a training snippet.
 */
function AddFunctionDialog(props: {
  type: string;
  onClose: () => void;
  onInstalled: () => void;
  notify: (feedback: { text: string; isError: boolean }) => void;
}) {

  const [workflows, setWorkflows] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    availableWorkflows()
      .then(list => setWorkflows(list ?? []))
      .catch(err => setError(err.message));
  }, []);

  async function install(workflow: any) {
    try {
      let declaration = (await getFunctionDeclaration(workflow.file)).result;
      while (declaration.includes('YOUR_TYPE_NAME_HERE')) {
        declaration = declaration.replace('YOUR_TYPE_NAME_HERE', props.type);
      }
      const lines = declaration.split('\n');
      await mlSnippetCreate({
        prompt: lines[0].trim(),
        completion: lines.slice(1).join('\n').trim(),
        type: props.type,
        meta: 'FUNCTION_INVOCATION ==> ' + workflow.file,
        uri: null,
      });
      props.notify({
        text: 'AI function ' + workflow.name + ' added to ' + props.type,
        isError: false,
      });
      props.onInstalled();
    } catch (err: any) {
      props.notify({ text: err.message, isError: true });
    }
  }

  const visible = workflows.filter(workflow =>
    !filter ||
    workflow.name?.toLowerCase().includes(filter.toLowerCase()) ||
    workflow.description?.toLowerCase().includes(filter.toLowerCase()));

  return (
    <Modal width={720} onClose={props.onClose}>
      <h2>Add AI function to {props.type}</h2>
      {error && <div className="error-box" style={{ marginBottom: 10 }}>{error}</div>}
      <input
        type="text"
        placeholder="Filter functions…"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{ width: '100%', marginBottom: 10 }} />
      <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
        {visible.map(workflow => (
          <div
            key={workflow.file}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 4px',
              borderBottom: '1px solid var(--border)',
            }}>
            <div style={{ flex: 1 }}>
              <div><strong>{workflow.name}</strong></div>
              <div className="muted" style={{ fontSize: 13 }}>{workflow.description}</div>
              <div className="mono muted" style={{ fontSize: 11 }}>{workflow.file}</div>
            </div>
            <button className="btn btn-secondary btn-small" onClick={() => install(workflow)}>
              Install
            </button>
          </div>
        ))}
        {visible.length === 0 && <div className="muted">No functions found.</div>}
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={props.onClose}>Close</button>
      </div>
    </Modal>
  );
}

/*
 * History tab — requests towards your models.
 */
function HistoryTab(props: {
  types: any[];
  notify: (feedback: { text: string; isError: boolean }) => void;
}) {

  const PAGE_SIZE = 15;
  const [type, setType] = useState('');
  const [page, setPage] = useState(0);
  const [requests, setRequests] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!type && props.types.length > 0) {
      setType(props.types[0].type);
    }
  }, [props.types, type]);

  useEffect(() => {
    if (!type) {
      return;
    }
    mlRequests(type, page * PAGE_SIZE, PAGE_SIZE)
      .then(list => setRequests(list ?? []))
      .catch(err => props.notify({ text: err.message, isError: true }));
  }, [type, page]);

  return (
    <>
      <div className="toolbar">
        <select value={type} onChange={e => { setType(e.target.value); setPage(0); }}>
          {props.types.map(candidate => (
            <option key={candidate.type} value={candidate.type}>{candidate.type}</option>
          ))}
        </select>
        <span className="spacer" />
        <button
          className="btn btn-secondary btn-small"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}>
          ‹ Newer
        </button>
        <button
          className="btn btn-secondary btn-small"
          disabled={requests.length < PAGE_SIZE}
          onClick={() => setPage(page + 1)}>
          Older ›
        </button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 170 }}>When</th>
              <th>Prompt</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(request => (
              <RequestRow
                key={request.id}
                request={request}
                expanded={expanded === request.id}
                onToggle={() => setExpanded(expanded === request.id ? null : request.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function RequestRow(props: { request: any; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className="clickable" onClick={props.onToggle}>
        <td className="mono">{new Date(props.request.created).toLocaleString()}</td>
        <td style={{
          maxWidth: 620,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {props.request.prompt}
        </td>
      </tr>
      {props.expanded && (
        <tr>
          <td colSpan={2}>
            <pre className="result-json" style={{ whiteSpace: 'pre-wrap' }}>
              {props.request.completion}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

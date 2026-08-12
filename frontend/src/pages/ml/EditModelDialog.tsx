/*
 * Create/edit model dialog — sends the full old-dashboard payload, with the
 * old defaults for everything not exposed here.
 */

import { useEffect, useState } from 'react';
import CodeEditor from '../../components/CodeEditor';
import CreateSystemMessageDialog from '../../components/CreateSystemMessageDialog';
import { Modal } from '../../components/Dialogs';
import RoleChips from '../../components/RoleChips';
import Select from '../../components/Select';
import Tabs from '../../components/Tabs';
import {
  Questionnaire,
  listQuestionnaires,
  listRoles,
  mlTypeCreate,
  mlTypeUpdate,
  modelPriceLabel,
  openaiCompletionSlots,
  openaiModels,
  openaiSystemMessages,
} from '../../lib/api';
import { showToast } from '../../lib/toast';
import AddFunctionDialog from './AddFunctionDialog';

export default function EditModelDialog(props: {
  existing: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {

  const existing = props.existing;
  const [models, setModels] = useState<{ id: string }[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [type, setType] = useState(existing?.type ?? '');
  const [model, setModel] = useState(existing?.model ?? '');
  const [temperature, setTemperature] = useState(String(existing?.temperature ?? 0.3));
  const [threshold, setThreshold] = useState(String(existing?.threshold ?? 0.3));
  const [maxTokens, setMaxTokens] = useState(String(existing?.max_tokens ?? 4000));
  /*
   * 2000 matches what the Chatbot Wizard creates — the value doubles as the
   * split threshold during crawling (snippets above 80% of it are split by
   * subject), so it decides corpus granularity as much as answer grounding.
   */
  const [maxContextTokens, setMaxContextTokens] =
    useState(String(existing?.max_context_tokens ?? 2000));
  const [maxRequestTokens, setMaxRequestTokens] =
    useState(String(existing?.max_request_tokens ?? 1000));
  const [auth, setAuth] = useState<string[]>(existing?.auth ? existing.auth.split(',') : []);
  const [authOpen, setAuthOpen] = useState(false);
  const [supervised, setSupervised] = useState(existing ? existing.supervised === 1 : true);
  const [useEmbeddings, setUseEmbeddings] =
    useState(existing ? existing.use_embeddings === 1 : true);
  /*
   * How get-context finds snippets: semantic (cosine over embeddings),
   * keyword (BM25 over an FTS index, needing no OpenAI key), or both merged
   * with reciprocal rank fusion.
   */
  const [retrieval, setRetrieval] = useState(existing?.retrieval ?? 'embeddings');
  const [cached, setCached] = useState(existing?.cached === 1);
  const [greeting, setGreeting] =
    useState(existing?.greeting ?? 'Hi there, how can I help you?');
  const [systemMessage, setSystemMessage] = useState(existing?.system_message ??
    'You are a helpful assistant, and you will answer the users questions ' +
    'based upon the information found in your context');
  const [dialogTab, setDialogTab] = useState('general');
  const [busy, setBusy] = useState(false);
  const [flavors, setFlavors] = useState<any[]>([]);
  const [completionSlots, setCompletionSlots] = useState<string[]>([]);
  const [largeEditor, setLargeEditor] = useState(false);
  const [dynamicFlavor, setDynamicFlavor] =
    useState<{ instruction: string; template: string } | null>(null);
  // The instruction as loaded — used to flag unsaved changes in the dialog.
  const [addingFunction, setAddingFunction] = useState(false);
  const [initialSystemMessage] = useState(() => systemMessage);
  const instructionChanged = systemMessage !== initialSystemMessage;
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  // Twilio, webhooks, lead-gen, prefix and search-postfix are legacy —
  // dropped from the UI and no longer sent.
  const [extra, setExtra] = useState<any>({
    base_url: existing?.base_url ?? '',
    conversation_starters: existing?.conversation_starters ?? '',
    api_key: existing?.api_key ?? '',
    no_requests: existing?.no_requests ?? 0,
    max_requests: existing?.max_requests ?? -1,
    max_function_invocations: existing?.max_function_invocations ?? 5,
    max_session_items: existing?.max_session_items ?? 15,
    completion_slot: existing?.completion_slot ?? 'magic.ai.chat',
    session_timeout: existing?.session_timeout ?? 1200,
    /*
     * Empty string is this field's "no questionnaire", mapped back to null on
     * save — the column is a nullable foreign key into questionnaires.
     */
    initial_questionnaire: existing?.initial_questionnaire ?? '',
    vector_model: existing?.vector_model ?? 'text-embedding-ada-002',
    // A null captcha value ("no captcha") is shown as -1, the sentinel the field
    // maps back to null on save — so the three modes round-trip.
    // Magic's own captcha is the default for new models — 0 in this field.
    recaptcha: existing?.recaptcha ?? 0,
  });

  function setField(key: string, value: any) {
    setExtra((current: any) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    openaiModels()
      .then(list => setModels(list ?? []))
      .catch(() => {});
    listRoles()
      .then(list => setRoles((list ?? []).map(role => role.name)))
      .catch(() => {});
    openaiSystemMessages()
      .then(list => setFlavors(list ?? []))
      .catch(() => {});
    openaiCompletionSlots()
      .then(response => setCompletionSlots(
        Array.isArray(response) ? response : response?.llms ?? []))
      .catch(() => {});
    listQuestionnaires()
      .then(list => setQuestionnaires(list ?? []))
      .catch(() => {});
  }, []);

  async function save() {
    if (busy) {
      return;
    }
    if (type.length < 2) {
      showToast('Give the model a type name', true);
      return;
    }
    const payload: any = {
      type,
      model,
      max_context_tokens: Number(maxContextTokens),
      max_request_tokens: Number(maxRequestTokens),
      max_tokens: Number(maxTokens),
      temperature: Number(temperature),
      threshold: Number(threshold),
      supervised: supervised ? 1 : 0,
      auth: auth.length > 0 ? auth.join(',') : null,
      cached: cached ? 1 : 0,
      system_message: systemMessage,
      greeting,
      use_embeddings: useEmbeddings ? 1 : 0,
      retrieval,
      ...extra,
      api_key: extra.api_key?.length > 0 ? extra.api_key : null,
      no_requests: Number(extra.no_requests),
      max_requests: Number(extra.max_requests),
      max_function_invocations: Number(extra.max_function_invocations),
      max_session_items: Number(extra.max_session_items),
      session_timeout: Number(extra.session_timeout),
      // Empty select means "no questionnaire", which the column stores as null.
      initial_questionnaire: extra.initial_questionnaire || null,
      // Stored as-is, negatives included — ml_types.recaptcha is NOT NULL, so
      // a negative number is how "no captcha" is persisted, not null.
      recaptcha: Number(extra.recaptcha),
    };
    setBusy(true);
    try {
      if (existing) {
        await mlTypeUpdate(payload);
      } else {
        await mlTypeCreate(payload);
      }
      showToast('Model ' + type + ' saved');
      props.onSaved();
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal width={640} onClose={props.onClose} onSubmit={save}>
      <h2>{existing ? 'Edit ' + existing.type : 'New model'}</h2>
      <Tabs
        tabs={[
          { id: 'general', label: 'General' },
          { id: 'behaviour', label: 'Behaviour' },
          { id: 'integrations', label: 'Integrations' },
        ]}
        active={dialogTab}
        onChange={setDialogTab} />
      <div style={{ maxHeight: '55vh', overflow: 'auto', paddingRight: 6 }}>
        <div className="form-grid" style={{ display: dialogTab === 'general' ? 'flex' : 'none' }}>
          {!existing && (
            <label>Type name
              <input type="text" value={type} onChange={e => setType(e.target.value)} />
            </label>
          )}
          {/*
            * Model and its instruction share the first row — together they ARE
            * the model, and at the old bottom position the instruction button
            * sat below the fold on common window heights. The greeting follows
            * directly: it's the model's voice, not a tuning knob.
            */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
            {/* minWidth 0, or the model name's intrinsic width keeps the 1fr
                column from shrinking and pushes the button out of the modal. */}
            <label style={{ minWidth: 0 }}>OpenAI model
              {/* The models endpoint flags chat-capable models with [chat]; only
                  those belong here (the rest are embeddings, audio, realtime,
                  etc.), mirroring how Vector model filters on [vector]. The
                  current value is kept selectable even if it isn't flagged. */}
              <Select value={model} onChange={value => setModel(value)}>
                <option value="">Select model…</option>
                {model && !models.some(candidate => candidate.id === model && (candidate as any).chat) && (
                  <option value={model}>{model}</option>
                )}
                {models.filter(candidate => (candidate as any).chat).map(candidate => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.id}{modelPriceLabel(candidate as any)}
                  </option>
                ))}
              </Select>
            </label>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '12px 16px' }}
              onClick={() => setLargeEditor(true)}>
              ✎ System instruction
            </button>
          </div>
          {instructionChanged && (
            <div className="success-box">
              System instruction changed — remember to save your model.
            </div>
          )}
          <label>Greeting
            <input type="text" value={greeting} onChange={e => setGreeting(e.target.value)} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>Temperature
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={e => setTemperature(e.target.value)} />
            </label>
            {/* Threshold is dead weight when embeddings are off — and for pure
                keyword retrieval, which takes BM25 rank order as it comes. In
                mixed mode it doubles as the keyword leg's relative cutoff. */}
            <label style={useEmbeddings && retrieval !== 'bm25' ? undefined : { opacity: 0.45 }}>Threshold
              <input
                type="number"
                step="0.1"
                value={threshold}
                disabled={!useEmbeddings || retrieval === 'bm25'}
                title={!useEmbeddings
                  ? 'Only used when "Use embeddings" is on'
                  : retrieval === 'bm25'
                    ? 'Keyword retrieval has no threshold — BM25 rank order decides'
                    : undefined}
                onChange={e => setThreshold(e.target.value)} />
            </label>
            <label>Max tokens
              <input
                type="number"
                value={maxTokens}
                onChange={e => setMaxTokens(e.target.value)} />
            </label>
            {/* Context tokens bound how much retrieved (embedded) material is
                injected, so it too is irrelevant without embeddings. */}
            <label style={useEmbeddings ? undefined : { opacity: 0.45 }}>Max context tokens
              <input
                type="number"
                value={maxContextTokens}
                disabled={!useEmbeddings}
                title={useEmbeddings ? undefined : 'Only used when "Use embeddings" is on'}
                onChange={e => setMaxContextTokens(e.target.value)} />
            </label>
            <label>Max request tokens
              <input
                type="number"
                value={maxRequestTokens}
                onChange={e => setMaxRequestTokens(e.target.value)} />
            </label>
          </div>
          {/* Collapsed behind a summary, same as the Generator's auth section —
              ten role chips earn their space only while being edited. */}
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Authorisation</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span>
                {auth.length > 0 ? auth.join(', ') : <em className="muted">public — no roles</em>}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setAuthOpen(!authOpen)}>
                {authOpen ? 'Done' : 'Edit'}
              </button>
            </div>
            {authOpen && (
              <div style={{ marginTop: 8 }}>
                <RoleChips
                  roles={roles}
                  selected={auth}
                  onToggle={(role, selected) => setAuth(selected
                    ? [...auth, role]
                    : auth.filter(candidate => candidate !== role))} />
              </div>
            )}
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
        </div>
        <div className="form-grid" style={{ display: dialogTab === 'behaviour' ? 'flex' : 'none' }}>
          <label>Conversation starters (markdown list)
            <textarea
              rows={4}
              value={extra.conversation_starters}
              onChange={e => setField('conversation_starters', e.target.value)} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>Completion slot
              <Select
                value={extra.completion_slot}
                onChange={value => setField('completion_slot', value)}>
                {!completionSlots.includes(extra.completion_slot) && (
                  <option value={extra.completion_slot}>{extra.completion_slot}</option>
                )}
                {completionSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </Select>
            </label>
            <label>Max requests (-1 = unlimited)
              <input
                type="number"
                value={extra.max_requests}
                onChange={e => setField('max_requests', e.target.value)} />
            </label>
            <label>Max function invocations
              <input
                type="number"
                value={extra.max_function_invocations}
                onChange={e => setField('max_function_invocations', e.target.value)} />
            </label>
            <label>Max session items
              <input
                type="number"
                value={extra.max_session_items}
                onChange={e => setField('max_session_items', e.target.value)} />
            </label>
            <label>Session timeout
              <input
                type="number"
                min="0"
                title="Seconds a conversation's history is remembered between questions. Defaults to 1200, twenty minutes."
                value={extra.session_timeout}
                onChange={e => setField('session_timeout', e.target.value)} />
            </label>
            <label>No requests served
              <input
                type="number"
                title="How many requests this model has answered so far"
                value={extra.no_requests}
                onChange={e => setField('no_requests', e.target.value)} />
            </label>
            {/* The single value carries three modes: negative → no captcha,
                0 → Magic's built-in captcha, above 0 → Google reCAPTCHA using
                this as the minimum score. It is persisted exactly as typed —
                ml_types.recaptcha is NOT NULL, so "no captcha" is a negative
                number rather than null. */}
            <label>Captcha
              <input
                type="number"
                step="0.1"
                title="Below 0: no captcha. 0: Magic's built-in captcha. Above 0: Google reCAPTCHA, using this as the minimum score (0-1)."
                value={extra.recaptcha}
                onChange={e => setField('recaptcha', e.target.value)} />
            </label>
          </div>
        </div>
        <div className="form-grid" style={{ display: dialogTab === 'integrations' ? 'flex' : 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* base_url is the site the daily "ainiro-crawl-machine-learning-models"
                task re-crawls to keep the model's training data fresh — not an
                LLM API base. */}
            <label>Auto-crawl URL
              <input
                type="text"
                placeholder="https://example.com"
                title="If set, this site is re-crawled once a day to add new pages to the model"
                value={extra.base_url}
                onChange={e => setField('base_url', e.target.value)} />
            </label>
            <label>API key override
              <input
                type="text"
                className="secret"
                autoComplete="off"
                value={extra.api_key}
                onChange={e => setField('api_key', e.target.value)} />
            </label>
            <label>Initial questionnaire
              <Select
                value={extra.initial_questionnaire}
                onChange={value => setField('initial_questionnaire', value)}>
                <option value="">No questionnaire</option>
                {/* A questionnaire that has since been deleted still shows,
                    so saving doesn't silently drop it. */}
                {extra.initial_questionnaire !== '' &&
                  !questionnaires.some(q => q.name === extra.initial_questionnaire) && (
                  <option value={extra.initial_questionnaire}>
                    {extra.initial_questionnaire}
                  </option>
                )}
                {questionnaires.map(item => (
                  <option key={item.name} value={item.name}>{item.name}</option>
                ))}
              </Select>
            </label>
            {/* How snippets are found for a question. Keyword (BM25) needs no
                OpenAI key at all; Hybrid merges both with rank fusion. "Use
                embeddings" is the master switch for retrieval as such, so
                without it there is nothing here to choose between. */}
            <label style={useEmbeddings ? undefined : { opacity: 0.45 }}>Retrieval
              <Select
                value={retrieval}
                disabled={!useEmbeddings}
                title={useEmbeddings ? undefined : 'Only used when "Use embeddings" is on'}
                onChange={value => setRetrieval(value)}>
                <option value="embeddings">Semantic (embeddings)</option>
                <option value="bm25">Keyword (BM25)</option>
                <option value="mixed">Hybrid (mixed)</option>
              </Select>
            </label>
            {/* Only relevant when embeddings are involved — it's the model
                used to vectorise the training snippets. */}
            <label style={useEmbeddings && retrieval !== 'bm25' ? undefined : { opacity: 0.45 }}>Vector model
              <Select
                value={extra.vector_model}
                disabled={!useEmbeddings || retrieval === 'bm25'}
                onChange={value => setField('vector_model', value)}>
                {!models.some(candidate => candidate.id === extra.vector_model) && (
                  <option value={extra.vector_model}>{extra.vector_model}</option>
                )}
                {models
                  .filter(candidate => (candidate as any).vector)
                  .map(candidate => (
                    <option key={candidate.id} value={candidate.id}>{candidate.id}</option>
                  ))}
              </Select>
            </label>
          </div>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
      {largeEditor && (
        <Modal width={1100} onClose={() => setLargeEditor(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h2 style={{ margin: 0, flex: 1 }}>
              System instruction — {type || 'new model'}
            </h2>
            <Select
              value=""
              onChange={value => {
                const flavor = flavors.find(candidate => candidate.name === value);
                if (!flavor?.prefix) {
                  return;
                }
                // Token-budget overrides apply for every flavor.
                if (flavor.max_context_tokens) {
                  setMaxContextTokens(String(flavor.max_context_tokens));
                }
                if (flavor.max_request_tokens) {
                  setMaxRequestTokens(String(flavor.max_request_tokens));
                }
                if (flavor.max_function_invocations) {
                  setField('max_function_invocations', flavor.max_function_invocations);
                }
                // A DYNAMIC "templated template" (contains [[...]] placeholders)
                // is generated from a URL rather than inserted directly.
                if (flavor.name.includes('DYNAMIC') &&
                    flavor.instruction &&
                    flavor.prefix.includes('[[')) {
                  setDynamicFlavor({
                    instruction: flavor.instruction,
                    template: flavor.prefix,
                  });
                  return;
                }
                // Static template: insert the text, substituting the type name.
                let message = flavor.prefix;
                while (message.includes('YOUR_TYPE_NAME_HERE')) {
                  message = message.replace('YOUR_TYPE_NAME_HERE', type || 'default');
                }
                setSystemMessage(message);
              }}>
              <option value="">Apply a template…</option>
              {flavors.map(flavor => (
                <option key={flavor.name} value={flavor.name}>{flavor.name}</option>
              ))}
            </Select>
          </div>
          <div style={{ height: '65vh', display: 'flex', flexDirection: 'column' }}>
            <CodeEditor
              value={systemMessage}
              onChange={setSystemMessage}
              mode="markdown" />
          </div>
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              title="Append an AI function's declaration to the system instruction"
              onClick={() => setAddingFunction(true)}>
              + AI function
            </button>
            <button className="btn" onClick={() => setLargeEditor(false)}>Done</button>
          </div>
          {addingFunction && (
            <AddFunctionDialog
              type={type}
              onClose={() => setAddingFunction(false)}
              onInstalled={() => setAddingFunction(false)}
              onDeclaration={(prompt, completion) => {
                /*
                 * Appended as a markdown section, the way the old edit-type
                 * dialog appends it — heading from the prompt, declaration
                 * underneath, separated from whatever came before.
                 */
                setSystemMessage((current: string) => {
                  const trimmed = current.trimEnd();
                  return (trimmed.length > 0 ? trimmed + '\n\n' : '') +
                    '## ' + prompt + '\n\n' + fenceInvocation(completion);
                });
                setAddingFunction(false);
                showToast('AI function added to your system instruction');
              }} />
          )}
          {dynamicFlavor && (
            <CreateSystemMessageDialog
              instruction={dynamicFlavor.instruction}
              template={dynamicFlavor.template}
              onGenerated={message => {
                setSystemMessage(message);
                setDynamicFlavor(null);
              }}
              onClose={() => setDynamicFlavor(null)} />
          )}
        </Modal>
      )}
    </Modal>
  );
}


/*
 * Wraps the FUNCTION_INVOCATION block — everything between its two ___
 * markers — in a plaintext fence. A system instruction is markdown, and its
 * own "## Functions" section shows invocations fenced this way, so inserted
 * declarations have to match. Argument descriptions stay outside the fence,
 * since they are prose.
 */
function fenceInvocation(completion: string) {
  const lines = completion.split('\n');
  const opening = lines.indexOf('___');
  if (opening === -1) {
    return completion;
  }
  const closing = lines.indexOf('___', opening + 1);
  if (closing === -1) {
    return completion;
  }
  lines.splice(closing + 1, 0, '```');
  lines.splice(opening, 0, '```plaintext');
  return lines.join('\n');
}

/*
 * Questionnaires — the question sets a model can open a conversation with.
 * Master/detail: pick a questionnaire on the left, edit its questions on the
 * right. A model points at one through its "Initial questionnaire" setting.
 */

import { useCallback, useEffect, useState } from 'react';
import { Modal, useDialog } from '../../components/Dialogs';
import Select from '../../components/Select';
import AiWaiter from '../../components/AiWaiter';
import {
  Question,
  Questionnaire,
  createQuestion,
  createQuestionnaire,
  deleteQuestion,
  deleteQuestionnaire,
  listQuestionnaires,
  listQuestions,
  updateQuestion,
  updateQuestionnaire,
} from '../../lib/api';
import { showToast } from '../../lib/toast';

/*
 * How a questionnaire behaves. "single-shot" asks everything once at the
 * start of a conversation; "recurring" asks again in later conversations.
 */
const QUESTIONNAIRE_TYPES = ['single-shot', 'recurring'];

/*
 * How the chatbot treats an item. A "question" is asked and waits for the
 * user to answer it; a "message" is said and the chatbot moves straight on to
 * the next item without expecting anything back.
 */
const QUESTION_TYPES = ['question', 'message'];

/*
 * The name rule the backend enforces with [validators.regex] — checked here
 * too, so a bad name is caught while typing rather than as a server error.
 */
const NAME_PATTERN = /^[a-z0-9_-]{2,20}$/;

export default function QuestionnairesTab() {

  const [items, setItems] = useState<Questionnaire[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | null>(null);
  const [editing, setEditing] = useState<Question | 'new' | null>(null);
  const [waiting, setWaiting] = useState(false);
  const { confirmTyped, confirm } = useDialog();

  const load = useCallback(async () => {
    try {
      const list = await listQuestionnaires() ?? [];
      setItems(list);
      // Selecting the first one gives the detail pane something to show.
      setSelected(current => current ?? list[0]?.name ?? null);
    } catch (err: any) {
      showToast(err.message, true, err.logId);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadQuestions = useCallback(async (name: string | null) => {
    if (!name) {
      setQuestions(null);
      return;
    }
    try {
      setQuestions(await listQuestions(name) ?? []);
    } catch (err: any) {
      showToast(err.message, true, err.logId);
      setQuestions([]);
    }
  }, []);

  useEffect(() => {
    loadQuestions(selected);
  }, [selected, loadQuestions]);

  async function removeQuestionnaire(name: string) {
    /*
     * Questions are cascade-deleted with their questionnaire, and any model
     * pointing at it loses its opening questions — so this asks for the name.
     */
    if (!await confirmTyped({
      title: 'Delete questionnaire?',
      message: 'This permanently deletes ' + name + ' and every question in ' +
        'it. Type the name to confirm.',
      label: 'Name',
      expected: name,
    })) {
      return;
    }
    setWaiting(true);
    try {
      await deleteQuestionnaire(name);
      showToast(name + ' deleted');
      setSelected(null);
      load();
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  async function removeQuestion(question: Question) {
    if (!await confirm({
      title: 'Delete question?',
      message: question.question,
      confirmText: 'Delete',
      danger: true,
    })) {
      return;
    }
    setWaiting(true);
    try {
      await deleteQuestion(question.question_id);
      loadQuestions(selected);
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  return (
    <>
      <div className="toolbar">
        <span className="muted">
          {items === null ? 'Loading…' : items.length + ' questionnaires'}
        </span>
        <span className="spacer" />
        <button className="btn" onClick={() => setCreating(true)}>
          + New questionnaire
        </button>
      </div>
      {items !== null && items.length === 0 ? (
        <div className="info-box">
          No questionnaires yet. A questionnaire is a set of questions your
          chatbot asks when a conversation starts — create one, add questions,
          then point a model at it from its Initial questionnaire setting.
        </div>
      ) : (
      <div className="editor-split" style={{ flex: 'unset', alignItems: 'flex-start' }}>
        <div className="card" style={{ padding: 0, overflow: 'auto', maxWidth: 400 }}>
          <table className="compact-table">
            <thead>
              <tr>
                <th>Questionnaire</th>
                <th style={{ width: 110, whiteSpace: 'nowrap' }}>Type</th>
                <th style={{ width: 150 }} aria-hidden="true"></th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map(item => (
                <tr
                  key={item.name}
                  className={item.name === selected ? 'row-selected' : ''}
                  onClick={() => setSelected(item.name)}>
                  <td><strong>{item.name}</strong></td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>{item.type}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={event => {
                          // The row itself selects, so the buttons must not.
                          event.stopPropagation();
                          setEditingQuestionnaire(item);
                        }}>
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={event => {
                          event.stopPropagation();
                          removeQuestionnaire(item.name);
                        }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          {selected === null ? (
            <span className="muted">Select a questionnaire to edit its questions.</span>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <h2 style={{ margin: 0, flex: 1 }}>{selected}</h2>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setEditing('new')}>
                  + Add question
                </button>
              </div>
              {questions === null ? (
                <span className="muted">Loading questions…</span>
              ) : questions.length === 0 ? (
                <span className="muted">
                  No questions yet — add the first one your chatbot should ask.
                </span>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th style={{ width: 100 }}>Type</th>
                      <th style={{ width: 120 }}>Name</th>
                      <th style={{ width: 90 }}>Context</th>
                      <th style={{ width: 150 }} aria-hidden="true"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {/*
                      * Rows are not clickable — the buttons do the work, the
                      * way they do on the Training data tab.
                      */}
                    {questions.map(question => (
                      <tr key={question.question_id}>
                        <td>{question.question}</td>
                        <td className="muted">{question.type}</td>
                        <td className="muted">{question.name ?? ''}</td>
                        <td className="muted">{question.context === 1 ? 'yes' : ''}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary btn-small"
                              onClick={() => setEditing(question)}>
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-small"
                              onClick={() => removeQuestion(question)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
      )}
      {(creating || editingQuestionnaire) && (
        <QuestionnaireDialog
          existing={editingQuestionnaire}
          onClose={() => { setCreating(false); setEditingQuestionnaire(null); }}
          onSaved={name => {
            setCreating(false);
            setEditingQuestionnaire(null);
            setSelected(name);
            load();
          }} />
      )}
      {editing && selected && (
        <QuestionDialog
          questionnaire={selected}
          existing={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            loadQuestions(selected);
          }} />
      )}
      {waiting && <AiWaiter />}
    </>
  );
}

function QuestionnaireDialog(props: {
  existing: Questionnaire | null;
  onClose: () => void;
  onSaved: (name: string) => void;
}) {

  const { existing } = props;
  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState(existing?.type ?? QUESTIONNAIRE_TYPES[0]);
  const [action, setAction] = useState(existing?.action ?? '');
  const [busy, setBusy] = useState(false);
  // The name is the primary key, so an existing questionnaire cannot be renamed.
  const valid = existing !== null || NAME_PATTERN.test(name);

  async function save() {
    setBusy(true);
    try {
      const payload = { name, type, action: action || null };
      if (existing) {
        await updateQuestionnaire(payload);
        showToast('Questionnaire ' + name + ' saved');
      } else {
        await createQuestionnaire(payload);
        showToast('Questionnaire ' + name + ' created');
      }
      props.onSaved(name);
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      width={460}
      onClose={props.onClose}
      onSubmit={() => { if (!busy && valid) save(); }}>
      <h2>{existing ? 'Edit ' + existing.name : 'New questionnaire'}</h2>
      <div className="form-grid">
        <label>Name
          <input
            type="text"
            autoFocus={!existing}
            autoComplete="off"
            disabled={existing !== null}
            title={existing ? 'The name identifies the questionnaire and cannot be changed' : undefined}
            value={name}
            onChange={e => setName(e.target.value)} />
          {!existing && (
            <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
              2–20 characters, lowercase letters, digits, underscore or hyphen.
            </span>
          )}
        </label>
        <label>Type
          <Select value={type} onChange={value => setType(value)}>
            {QUESTIONNAIRE_TYPES.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
          <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
            {type === 'single-shot'
              ? 'Asked once, then never again for the same visitor.'
              : 'Asked again in later conversations.'}
          </span>
        </label>
        <label>Action (optional)
          <input
            type="text"
            autoComplete="off"
            title="Slot invoked with the answers once the questionnaire completes, resolved as magic.questionnaires.action.<name>"
            value={action}
            onChange={e => setAction(e.target.value)} />
        </label>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={busy || !valid}>
          {busy ? 'Saving…' : existing ? 'Save' : 'Create'}
        </button>
      </div>
    </Modal>
  );
}

function QuestionDialog(props: {
  questionnaire: string;
  existing: Question | null;
  onClose: () => void;
  onSaved: () => void;
}) {

  const { existing } = props;
  const [question, setQuestion] = useState(existing?.question ?? '');
  const [type, setType] = useState(existing?.type ?? QUESTION_TYPES[0]);
  const [name, setName] = useState(existing?.name ?? '');
  const [context, setContext] = useState(existing?.context === 1);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      if (existing) {
        await updateQuestion({
          question_id: existing.question_id,
          question,
          questionnaire: props.questionnaire,
          type,
          name: name || null,
          context: context ? 1 : 0,
        });
      } else {
        await createQuestion({
          question,
          questionnaire: props.questionnaire,
          type,
          name: name || null,
          context: context ? 1 : 0,
        });
      }
      props.onSaved();
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      width={520}
      onClose={props.onClose}
      onSubmit={() => { if (!busy && question) save(); }}>
      <h2>{existing ? 'Edit question' : 'Add question'}</h2>
      <div className="form-grid">
        <label>Question
          <textarea
            autoFocus
            rows={3}
            value={question}
            onChange={e => setQuestion(e.target.value)} />
        </label>
        <label>Type
          <Select value={type} onChange={value => setType(value)}>
            {QUESTION_TYPES.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
          <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
            {type === 'message'
              ? 'Said to the user, then the chatbot moves straight on.'
              : 'Asked, and the chatbot waits for the user to answer.'}
          </span>
        </label>
        {/* A message has no answer, so there is nothing to name or remember. */}
        <label style={type === 'message' ? { opacity: 0.45 } : undefined}>Name (optional)
          <input
            type="text"
            disabled={type === 'message'}
            title={type === 'message'
              ? 'A message has no answer to store'
              : 'Name the answer is stored under, for referencing it later'}
            value={name}
            onChange={e => setName(e.target.value)} />
        </label>
        {/*
          * Its own column, not a type — the answer is replayed as context at
          * the top of every later conversation this user has with the model.
          */}
        <label
          className="checkbox-row"
          title="Replays this answer as context at the top of every later conversation this user has with the model"
          style={type === 'message' ? { opacity: 0.45 } : undefined}>
          <input
            type="checkbox"
            disabled={type === 'message'}
            checked={context}
            onChange={e => setContext(e.target.checked)} />
          Remember
        </label>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={busy || !question}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

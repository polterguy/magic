/*
 * Questionnaires — the question sets a model can open a conversation with.
 * Master/detail: pick a questionnaire on the left, edit its questions on the
 * right. A model points at one through its "Initial questionnaire" setting.
 */

import { useCallback, useEffect, useState } from 'react';
import { Modal, useDialog } from '../../components/Dialogs';
import Select from '../../components/Select';
import AiWaiter from '../../components/AiWaiter';
import { TrashIcon } from '../../components/Icons';
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
} from '../../lib/api';
import { showToast } from '../../lib/toast';

/*
 * How a questionnaire behaves. "single-shot" asks everything once at the
 * start of a conversation; "recurring" asks again in later conversations.
 */
const QUESTIONNAIRE_TYPES = ['single-shot', 'recurring'];

/*
 * What a question collects. "question" is free text the user answers, while
 * "context" answers are fed back into later prompts as context.
 */
const QUESTION_TYPES = ['question', 'context'];

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
        <div className="card" style={{ padding: 0, overflow: 'auto', maxWidth: 320 }}>
          <table className="compact-table">
            <thead>
              <tr>
                <th>Questionnaire</th>
                <th style={{ width: 90 }}>Type</th>
                <th style={{ width: 40 }} aria-hidden="true"></th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map(item => (
                <tr
                  key={item.name}
                  className={'clickable' + (item.name === selected ? ' row-selected' : '')}
                  onClick={() => setSelected(item.name)}>
                  <td><strong>{item.name}</strong></td>
                  <td className="muted">{item.type}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="icon-btn"
                      title={'Delete ' + item.name}
                      onClick={event => {
                        event.stopPropagation();
                        removeQuestionnaire(item.name);
                      }}>
                      <TrashIcon />
                    </button>
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
                      <th style={{ width: 40 }} aria-hidden="true"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map(question => (
                      <tr
                        key={question.question_id}
                        className="clickable"
                        onClick={() => setEditing(question)}>
                        <td>{question.question}</td>
                        <td className="muted">{question.type}</td>
                        <td className="muted">{question.name ?? ''}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="icon-btn"
                            title="Delete question"
                            onClick={event => {
                              event.stopPropagation();
                              removeQuestion(question);
                            }}>
                            <TrashIcon />
                          </button>
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
      {creating && (
        <NewQuestionnaireDialog
          onClose={() => setCreating(false)}
          onCreated={name => {
            setCreating(false);
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

function NewQuestionnaireDialog(props: {
  onClose: () => void;
  onCreated: (name: string) => void;
}) {

  const [name, setName] = useState('');
  const [type, setType] = useState(QUESTIONNAIRE_TYPES[0]);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await createQuestionnaire({ name, type });
      showToast('Questionnaire ' + name + ' created');
      props.onCreated(name);
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
      onSubmit={() => { if (!busy && NAME_PATTERN.test(name)) save(); }}>
      <h2>New questionnaire</h2>
      <div className="form-grid">
        <label>Name
          <input
            type="text"
            autoFocus
            autoComplete="off"
            value={name}
            onChange={e => setName(e.target.value)} />
          <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
            2–20 characters, lowercase letters, digits, underscore or hyphen.
          </span>
        </label>
        <label>Type
          <Select value={type} onChange={value => setType(value)}>
            {QUESTIONNAIRE_TYPES.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        </label>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={busy || !NAME_PATTERN.test(name)}>
          {busy ? 'Creating…' : 'Create'}
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
        });
      } else {
        await createQuestion({
          question,
          questionnaire: props.questionnaire,
          type,
          name: name || null,
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
        </label>
        <label>Name (optional)
          <input
            type="text"
            title="Name the answer is stored under, for referencing it later"
            value={name}
            onChange={e => setName(e.target.value)} />
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

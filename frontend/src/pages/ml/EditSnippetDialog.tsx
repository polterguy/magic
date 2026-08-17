/*
 * Create/edit training-snippet dialog — prompt as a single line, completion
 * in a markdown editor, with an AI bar that can rewrite the snippet in place.
 */

import { useState } from 'react';
import AiPrompt from '../../components/AiPrompt';
import CodeEditor from '../../components/CodeEditor';
import { Modal } from '../../components/Dialogs';
import { mlSnippetCreate, mlSnippetUpdate, vectoriseSnippet } from '../../lib/api';
import { showToast } from '../../lib/toast';

export default function EditSnippetDialog(props: {
  type: string;
  existing: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {

  const [prompt, setPrompt] = useState(props.existing?.prompt ?? '');
  const [completion, setCompletion] = useState(props.existing?.completion ?? '');
  const [busy, setBusy] = useState(false);

  /*
   * System message forcing the model to hand back a clean {prompt, completion}
   * JSON object, so an instruction like "remove all redundant facts" can rewrite
   * a messy snippet (e.g. one pasted out of a PDF) in place. It replaces the
   * type's own system message via [system_message_override], and the existing
   * snippet is embedded here so the model has the material to transform.
   */
  const transformInstruction = () =>
    'You are a data-cleaning assistant for a machine-learning training set. You are ' +
    'given an existing training snippet and, in the user message, an instruction ' +
    'describing how to transform it. Apply the instruction, then respond with ONLY a ' +
    'raw JSON object containing exactly two string fields:\n' +
    '  "prompt": a single sentence, with no carriage returns, summarising the completion.\n' +
    '  "completion": the transformed content.\n' +
    'Do not wrap the JSON in markdown fences, and add no commentary before or after it.\n\n' +
    '--- EXISTING SNIPPET ---\n' +
    'Prompt: ' + prompt + '\n' +
    'Completion:\n' + completion;

  /*
   * The model is asked for raw JSON, but tolerate fences and stray prose: pull the
   * first {...} block, parse it, and on any failure just drop the whole answer into
   * the completion so nothing the model produced is lost.
   */
  function applyTransform(result: string) {
    const match = result.match(/\{[\s\S]*\}/);
    try {
      const parsed = JSON.parse(match ? match[0] : result);
      if (typeof parsed.prompt === 'string') setPrompt(parsed.prompt);
      if (typeof parsed.completion === 'string') setCompletion(parsed.completion);
      if (typeof parsed.prompt !== 'string' && typeof parsed.completion !== 'string') {
        setCompletion(result);
      }
    } catch {
      setCompletion(result);
    }
  }

  async function save() {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      if (props.existing) {
        await mlSnippetUpdate({
          id: props.existing.id,
          prompt,
          completion,
          type: props.type,
        });

        /*
         * Re-embedding an edited snippet. The update clears the old vector,
         * since it describes the wording being replaced, so doing this here is
         * what puts the snippet straight back into use rather than leaving it
         * waiting for the next bulk vectorise.
         *
         * Reported separately from the save, which has already succeeded by
         * this point — saying "could not save" would be a lie, and saying
         * nothing would leave the snippet quietly out of circulation.
         */
        try {
          await vectoriseSnippet(props.existing.id);
          showToast('Snippet saved');
        } catch (err: any) {
          showToast(
            'Snippet saved, but re-embedding it failed — it will not be matched until you '
              + 'vectorise the model. ' + err.message,
            true,
            err.logId);
        }
      } else {
        await mlSnippetCreate({ prompt, completion, type: props.type, meta: null, uri: null });
        showToast('Snippet saved');
      }
      props.onSaved();
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal width={820} onClose={props.onClose} onSubmit={() => { if (prompt) save(); }}>
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
          {/*
            * Ask the Machine to transform the snippet — the typed instruction is
            * the user message, the current snippet + JSON contract is the system
            * override, and the returned {prompt, completion} is written back in.
            */}
          <AiPrompt
            fileType={props.type}
            getContext={transformInstruction}
            session={'ml-snippet-transform.' + props.type}
            onResult={applyTransform}
            onError={message => showToast(message, true)}
            style={{ marginTop: 8 }} />
        </div>
      </div>
      <div className="modal-actions">
        {props.existing?.meta && (
          <span className="snippet-meta">{props.existing.meta}</span>
        )}
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={!prompt || busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

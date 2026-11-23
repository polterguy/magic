/*
 * Create/edit training-snippet dialog — prompt as a single line, completion
 * in a markdown editor, with an AI bar that can rewrite the snippet in place.
 */

import { type MlSnippet, mlSnippetCreate, mlSnippetUpdate, vectoriseSnippet } from '@core/api';
import { showError } from '@core/errors';
import { showToast } from '@core/toast';
import { useEditToken } from '@shared/lib/editor';
import AiPrompt from '@shared/ui/AiPrompt';
import BusyLabel from '@shared/ui/BusyLabel';
import CodeEditor from '@shared/ui/CodeEditor';
import { Modal } from '@shared/ui/Dialogs';
import { useState } from 'react';

export default function EditSnippetDialog(
  props: Readonly<{
    type: string;
    existing: MlSnippet | null;
    onClose: () => void;
    onSaved: () => void;
  }>,
) {
  const [prompt, setPrompt] = useState<string>(props.existing?.prompt ?? '');
  const [completion, setCompletion] = useState<string>(props.existing?.completion ?? '');
  const [completionEditId, bumpCompletionEditId] = useEditToken();
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
    'Prompt: ' +
    prompt +
    '\n' +
    'Completion:\n' +
    completion;

  /*
   * The model is asked for raw JSON, but tolerate fences and stray prose: pull the
   * first {...} block, parse it, and on any failure just drop the whole answer into
   * the completion so nothing the model produced is lost.
   */
  function applyTransform(result: string) {
    const start = result.indexOf('{');
    const end = result.lastIndexOf('}');
    try {
      const parsed = JSON.parse(
        start >= 0 && end > start ? result.slice(start, end + 1) : result,
      ) as { prompt?: unknown; completion?: unknown };
      if (typeof parsed.prompt === 'string') setPrompt(parsed.prompt);
      if (typeof parsed.completion === 'string') setCompletion(parsed.completion);
      if (typeof parsed.prompt !== 'string' && typeof parsed.completion !== 'string') {
        setCompletion(result);
      }
    } catch {
      setCompletion(result);
    }
    bumpCompletionEditId();
  }

  async function save() {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      if (props.existing) {
        /*
         * Whether this snippet carried an embedding before the edit. The update
         * clears it either way, since a vector describes the wording it was
         * built from — but only a snippet that had one has anything to restore.
         * One left unembedded on purpose stays that way, waiting for the next
         * bulk vectorise exactly as a newly created one does.
         */
        const wasEmbedded = !!props.existing.embedding_vss;

        await mlSnippetUpdate({
          id: props.existing.id,
          prompt,
          completion,
          type: props.type,
        });

        if (wasEmbedded) {
          /*
           * Reported separately from the save, which has already succeeded by
           * this point — saying "could not save" would be a lie, and saying
           * nothing would leave the snippet quietly out of circulation.
           */
          try {
            await vectoriseSnippet(props.existing.id);
            showToast('Snippet saved and re-vectorised');
          } catch (err) {
            showError(
              err,
              'Snippet saved, but re-vectorising it failed — it will not be matched until you ' +
                'vectorise the model. ',
            );
          }
        } else {
          showToast('Snippet saved');
        }
      } else {
        await mlSnippetCreate({ prompt, completion, type: props.type, meta: null, uri: null });
        showToast('Snippet saved');
      }
      props.onSaved();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      size="xl"
      onClose={props.onClose}
      onSubmit={() => {
        if (prompt) void save();
      }}
      title={props.existing ? 'Edit snippet' : 'New snippet'}
      footerStart={
        props.existing?.meta && <span className="snippet-meta">{props.existing.meta}</span>
      }
      actions={
        <>
          <button className="btn btn-secondary" onClick={props.onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save} disabled={!prompt || busy}>
            <BusyLabel busy={busy} label="Save" busyLabel="Saving…" />
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label>
          Prompt <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} />
        </label>
        <div>
          <div className="modal-label" style={{ marginTop: 0, marginBottom: 6 }}>
            Completion
          </div>
          <div style={{ height: '38vh', display: 'flex', flexDirection: 'column' }}>
            <CodeEditor
              value={completion}
              onChange={setCompletion}
              mode="markdown"
              undoableEditId={completionEditId}
            />
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
            style={{ marginTop: 8 }}
          />
        </div>
      </div>
    </Modal>
  );
}

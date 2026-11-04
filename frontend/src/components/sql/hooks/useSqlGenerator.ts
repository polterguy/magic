import { type RefObject, useEffect, useState } from 'react';
import type { EditorView } from '@codemirror/view';
import { showError } from '../../../lib/errors';
import { editorSelection } from '../../../lib/editor';
import { aiQuery, openaiIsConfigured } from '../../../lib/api';

/*
 * The Generate button — turning the selected text into a statement through
 * the OpenAI proxy.
 */
export function useSqlGenerator(
  options: Readonly<{
    editorRef: RefObject<EditorView | null>;
    createAiContext: () => Promise<string>;
    setSql: (sql: string) => void;
    bumpSqlEditId: () => void;
  }>,
) {
  const { editorRef, createAiContext, setSql, bumpSqlEditId } = options;
  // Generating is its own flag, so a CSV import in flight doesn't relabel the
  // Generate button.
  const [generating, setGenerating] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  /*
   * Generating SQL goes through the OpenAI proxy, unlike Hyper IDE's generator,
   * which loads its own instruction — so without a key there is nothing to ask,
   * and the button hides the same way the prompt bar below the editor does.
   */
  const [aiConfigured, setAiConfigured] = useState(false);

  useEffect(() => {
    openaiIsConfigured()
      .then(response => setAiConfigured(response.result))
      .catch(() => setAiConfigured(false));
  }, []);

  /*
   * Whatever is selected is the specification, and nothing else is sent. The
   * answer is a whole statement, so it becomes the whole buffer — replacing only
   * the selection would leave the description sitting around the SQL it asked
   * for. Selecting text therefore means two things in this page: Run treats it
   * as the fragment to execute, Generate as the request to fulfil.
   */
  async function generateFromSelection() {
    const selected = editorSelection(editorRef.current);
    if (!selected.trim()) {
      return;
    }
    setGenerating(true);
    try {
      const response = await aiQuery(selected, 'sql', await createAiContext(), 'sql-studio.editor');
      setSql(response.result);
      bumpSqlEditId();
    } catch (err) {
      showError(err);
    } finally {
      setGenerating(false);
    }
  }

  return { generating, hasSelection, setHasSelection, aiConfigured, generateFromSelection };
}

import { useRef, useState } from 'react';
import type { EditorView } from '@codemirror/view';
import { showToast } from '../../../lib/toast';
import { showError } from '../../../lib/errors';
import { editorSelection } from '../../../lib/editor';
import type { useDialog } from '../../../lib/useDialog';
import {
  aiQuery,
  debugHyperlambda,
  evaluateWithArgs,
  getHyperlambdaArguments,
  listEndpoints,
} from '../../../lib/api';
import type { DebugRecording, Endpoint } from '../../../lib/api';
import type { InvokeResult } from '../../InvokePanel';
import { convertArgument, endpointOf } from '../helpers';
import type { OpenTabs } from './useOpenTabs';

/*
 * Executing, invoking, debugging and generating the open file — and the
 * results, recordings and invoker those produce.
 */
export function useExecution(options: {
  tabs: OpenTabs;
  save: () => Promise<boolean>;
  setWaiting: (waiting: boolean) => void;
  dialog: ReturnType<typeof useDialog>;
}) {
  const { tabs, save, setWaiting } = options;
  const { selectedFile, content, current, updateContent } = tabs;
  const { confirm, form } = options.dialog;
  const [executeResult, setExecuteResult] = useState<InvokeResult | null>(null);
  const [recording, setRecording] = useState<DebugRecording | null>(null);
  // Set when the result came from invoking an endpoint rather than evaluating.
  const [resultWasHttp, setResultWasHttp] = useState(false);
  const [generating, setGenerating] = useState(false);
  // Generating needs something selected to send, so the button follows it.
  const [hasSelection, setHasSelection] = useState(false);
  // The endpoint whose invoker dialog is open, when executing an endpoint file.
  const [invokeTarget, setInvokeTarget] = useState<Endpoint | null>(null);
  const editorRef = useRef<EditorView | null>(null);

  /*
   * Executes the open file. An endpoint file is invoked as the endpoint it
   * is, through real HTTP — that's the only way to reach one that takes
   * files or returns them, since the evaluator's body is JSON. Everything
   * else runs through evaluate-with-args on the editor's current text.
   */
  async function execute() {
    if (!selectedFile.endsWith('.hl')) {
      return;
    }
    const endpoint = endpointOf(selectedFile);
    if (endpoint) {
      await invokeAsEndpoint(endpoint);
      return;
    }
    try {
      // Executing a selection runs just the selected code, like the old IDE.
      const selection = editorSelection(editorRef.current);
      const code = selection !== '' ? selection : content;
      setWaiting(true);
      const argSpec = (await getHyperlambdaArguments(code)) ?? {};
      // Waiter off while the parametrise form awaits the user.
      setWaiting(false);
      const names = Object.keys(argSpec);
      let args: Record<string, unknown> | null = null;
      if (names.length > 0) {
        const values = await form({
          title: 'Parametrise invocation',
          message: selectedFile,
          confirmText: 'Execute',
          fields: names.map(name => ({
            name,
            type: argSpec[name].type,
            mandatory: argSpec[name].mandatory,
          })),
        });
        if (!values) {
          return;
        }
        args = {};
        for (const name of names) {
          const value = values[name];
          if (value === undefined || value === '') {
            continue;
          }
          args[name] = convertArgument(value, argSpec[name].type);
        }
      }
      setResultWasHttp(false);
      setWaiting(true);
      setExecuteResult(await evaluateWithArgs(code, args));
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  /*
   * Records an execution of the open file. The code defaults to the editor's
   * content, so the invoke panel can trigger it knowing only the arguments.
   */
  async function runDebug(args: unknown, code?: string) {
    setWaiting(true);
    try {
      setRecording(await debugHyperlambda(code ?? content, args));
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  /*
   * Whatever is selected is the specification, and nothing else is sent —
   * no surrounding code, no arguments. The generator answers with a whole
   * file, so its answer becomes the whole file: replacing only the selection
   * would leave the old code sitting around it, duplicated.
   */
  async function generateFromSelection() {
    const selection = editorSelection(editorRef.current);
    if (selection.trim() === '') {
      return;
    }
    setGenerating(true);
    try {
      const response = await aiQuery(selection, 'hl');
      updateContent(response.result);
    } catch (err) {
      showError(err);
    } finally {
      setGenerating(false);
    }
  }

  /*
   * Invoking hits the server, which knows only what was last saved — so an
   * unsaved buffer would be silently ignored. Offer to save first rather
   * than testing yesterday's code.
   */
  async function invokeAsEndpoint(endpoint: { path: string; verb: string }) {
    if (current && current.content !== current.saved) {
      const answer = await confirm({
        title: 'Save before invoking?',
        message:
          selectedFile +
          ' has unsaved changes. Invoking runs the file ' +
          'as it is on the server, so unsaved changes are not included.',
        confirmText: 'Save and invoke',
      });
      if (!answer) {
        return;
      }
      setWaiting(true);
      // A failed save means the server still runs yesterday's code — the
      // exact situation this dialog exists to prevent, so stop here.
      if (!(await save())) {
        setWaiting(false);
        return;
      }
    }
    setWaiting(true);
    try {
      const all = await listEndpoints();
      const meta = all.find(
        (candidate: Endpoint) =>
          candidate.path === endpoint.path && candidate.verb.toLowerCase() === endpoint.verb,
      );
      if (!meta) {
        showToast(
          'The server does not list ' +
            endpoint.verb.toUpperCase() +
            ' ' +
            endpoint.path +
            ' as an endpoint',
          true,
        );
        return;
      }
      setInvokeTarget(meta);
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  return {
    executeResult,
    setExecuteResult,
    recording,
    setRecording,
    resultWasHttp,
    setResultWasHttp,
    generating,
    hasSelection,
    setHasSelection,
    invokeTarget,
    setInvokeTarget,
    editorRef,
    execute,
    runDebug,
    generateFromSelection,
  };
}

export type Execution = ReturnType<typeof useExecution>;

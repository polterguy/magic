import { showToast } from '../lib/toast';
import Select from '../components/Select';
import { explainHyperlambda } from '../lib/support';
import { useEffect, useState } from 'react';
import AiPrompt from '../components/AiPrompt';
import AiWaiter from '../components/AiWaiter';
import CodeEditor from '../components/CodeEditor';
import { useDialog } from '../components/Dialogs';
import { aiContextForFile, evaluate, listFiles, loadFile, saveFile } from '../lib/api';
import { useUnsavedGuard } from '../lib/navGuard';

const DEFAULT_CODE = `/*
 * Executes on your server. The result is the lambda itself once it has run,
 * so nothing needs returning.
 *
 * Reads the 5 most recent entries from your log.
 */
data.connect:magic
   data.read
      table:log_entries
      columns
         id
         created
         type
         content
      order:created
      direction:desc
      limit:5
`;

export default function Playground() {

  const [code, setCode] = useState(DEFAULT_CODE);
  // What the editor last loaded or saved — differing content means unsaved changes.
  const [savedCode, setSavedCode] = useState(DEFAULT_CODE);
  const [result, setResult] = useState('');
  const [resultMode, setResultMode] = useState('hyperlambda');
  const [busy, setBusy] = useState(false);
  const [snippets, setSnippets] = useState<string[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState('');
  const { prompt } = useDialog();

  useUnsavedGuard(code !== savedCode, 'Your Hyperlambda has unsaved changes.');

  useEffect(() => {
    listFiles('/etc/snippets/')
      .then(files => setSnippets(files.filter(f => f.endsWith('.hl'))))
      .catch(() => {});
  }, []);

  async function execute() {
    setBusy(true);
        try {
      /*
       * When the executed Hyperlambda returns nothing, the endpoint answers
       * {"result": "<hyperlambda>"} — unwrap and display as Hyperlambda.
       * Anything else is whatever the code returned — display raw.
       */
      const raw = await evaluate(code);
      let display = raw;
      let mode = 'text/plain';
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' &&
            typeof parsed.result === 'string' && Object.keys(parsed).length === 1) {
          display = parsed.result;
          mode = 'hyperlambda';
        } else {
          mode = 'application/json';
        }
      } catch {
        // Not JSON — scalar return, keep the raw text.
      }
      setResult(display);
      setResultMode(mode);
    } catch (err: any) {
      showToast(err.message, true);
      setResult('');
    } finally {
      setBusy(false);
    }
  }

  async function openSnippet(filename: string) {
    setSelectedSnippet(filename);
    if (!filename) {
      return;
    }
    try {
      const text = await loadFile(filename);
      setCode(text);
      setSavedCode(text);
    } catch (err: any) {
      showToast(err.message, true);
    }
  }

  async function save() {
    const suggestion = selectedSnippet
      ? selectedSnippet.substring(selectedSnippet.lastIndexOf('/') + 1).replace(/\.hl$/, '')
      : '';
    const name = await prompt({
      title: 'Save snippet',
      label: 'Snippet name',
      initial: suggestion,
    });
    if (!name) {
      return;
    }
    const filename = '/etc/snippets/' + name + (name.endsWith('.hl') ? '' : '.hl');
    try {
      await saveFile(filename, code);
      setSavedCode(code);
      setSelectedSnippet(filename);
      if (!snippets.includes(filename)) {
        setSnippets([...snippets, filename].sort());
      }
    } catch (err: any) {
      showToast(err.message, true);
    }
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="page-title">
          <h1>Playground</h1>
          <p>Execute Hyperlambda on your server — F5 or the Run button executes</p>
        </div>
        <div className="page-tools">
          <Select value={selectedSnippet} onChange={value => openSnippet(value)}>
            <option value="">Load snippet…</option>
            {snippets.map(snippet => (
              <option key={snippet} value={snippet}>
                {snippet.substring(snippet.lastIndexOf('/') + 1)}
              </option>
            ))}
          </Select>
          <button className="btn btn-secondary" onClick={save}>Save snippet</button>
          <button className="btn" onClick={execute} disabled={busy}>
            {busy ? 'Running…' : '▷ Run'}
          </button>
        </div>
      </div>
      <div className="editor-split">
        <div>
          <div className="editor-pane-title">Input</div>
          <CodeEditor
            value={code}
            onChange={setCode}
            mode="hyperlambda"
            onExecute={execute}
            onHelp={explainHyperlambda} />
        </div>
        <div>
          <div className="editor-pane-title">Result</div>
          <CodeEditor value={result} mode={resultMode} readOnly />
        </div>
      </div>
      {/* Below the split rather than inside it, so both editors stay equally tall. */}
      <AiPrompt
        fileType="hl"
        getContext={() => aiContextForFile('/playground.hl', code)}
        session="hyperlambda-playground.editor"
        onResult={setCode}
        onError={message => showToast(message, true)}
        style={{ marginTop: 8 }} />
      {/* Execution can be slow — cover the screen so the wait reads clearly. */}
      {busy && <AiWaiter />}
    </>
  );
}

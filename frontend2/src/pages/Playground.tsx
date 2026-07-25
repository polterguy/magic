import { useEffect, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import { evaluate, listFiles, loadFile, saveFile } from '../lib/api';

const DEFAULT_CODE = `/*
 * Executes on your server, and returns the result.
 */
.foo:Hello from the playground
return:x:@.foo
`;

export default function Playground() {

  const [code, setCode] = useState(DEFAULT_CODE);
  const [result, setResult] = useState('');
  const [resultMode, setResultMode] = useState('hyperlambda');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [snippets, setSnippets] = useState<string[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState('');

  useEffect(() => {
    listFiles('/etc/snippets/')
      .then(files => setSnippets(files.filter(f => f.endsWith('.hl'))))
      .catch(() => {});
  }, []);

  async function execute() {
    setBusy(true);
    setError('');
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
      setError(err.message);
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
      setCode(await loadFile(filename));
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function save() {
    const suggestion = selectedSnippet
      ? selectedSnippet.substring(selectedSnippet.lastIndexOf('/') + 1).replace(/\.hl$/, '')
      : '';
    const name = window.prompt('Snippet name', suggestion);
    if (!name) {
      return;
    }
    const filename = '/etc/snippets/' + name + (name.endsWith('.hl') ? '' : '.hl');
    try {
      await saveFile(filename, code);
      setSelectedSnippet(filename);
      if (!snippets.includes(filename)) {
        setSnippets([...snippets, filename].sort());
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Hyperlambda playground</h1>
        <p>Execute Hyperlambda on your server — F5 or the Run button executes</p>
      </div>
      <div className="toolbar">
        <button className="btn" onClick={execute} disabled={busy}>
          {busy ? 'Running…' : '▷ Run'}
        </button>
        <button className="btn btn-secondary" onClick={save}>Save snippet</button>
        <select value={selectedSnippet} onChange={e => openSnippet(e.target.value)}>
          <option value="">Load snippet…</option>
          {snippets.map(snippet => (
            <option key={snippet} value={snippet}>
              {snippet.substring(snippet.lastIndexOf('/') + 1)}
            </option>
          ))}
        </select>
        {error && <span className="error-box" style={{ padding: '6px 12px' }}>{error}</span>}
      </div>
      <div className="editor-split">
        <div>
          <div className="editor-pane-title">Input</div>
          <CodeEditor value={code} onChange={setCode} mode="hyperlambda" onExecute={execute} />
        </div>
        <div>
          <div className="editor-pane-title">Result</div>
          <CodeEditor value={result} mode={resultMode} readOnly />
        </div>
      </div>
    </>
  );
}

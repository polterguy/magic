import { modeForFile } from '../../lib/editor';
import CodeEditor from '../CodeEditor';
import { WEB_ROOT } from './designerFiles';

// The code view: which file the editor holds, and the editor itself.
export default function CodePane(
  props: Readonly<{
    path: string;
    codeTarget: string;
    sheets: string[];
    scripts: string[];
    cssPath: string | null;
    code: string;
    codeEditId: number;
    setCode: (code: string) => void;
    setDirty: (dirty: boolean) => void;
    switchCodeTarget: (file: string) => Promise<void>;
    save: () => Promise<boolean>;
  }>,
) {
  const { path, codeTarget, sheets, scripts, cssPath, code, codeEditId, setCode, setDirty } = props;
  return (
    <div className="designer-code">
      <div className="designer-code-bar">
        <span>Editing</span>
        <select
          value={codeTarget || path}
          title="The file in the editor"
          onChange={event => props.switchCodeTarget(event.target.value)}
        >
          <option value={path}>{path.slice(WEB_ROOT.length)}</option>
          {[...sheets, ...scripts].map(file => (
            <option key={file} value={file}>
              {file.slice(WEB_ROOT.length)}
            </option>
          ))}
        </select>
        {codeTarget !== '' && codeTarget === cssPath && (
          <span className="designer-muted">the whole file, not just the designer&apos;s block</span>
        )}
        {codeTarget !== '' && scripts.includes(codeTarget) && (
          <span className="designer-muted">runs in Live view, never on the design canvas</span>
        )}
      </div>
      <CodeEditor
        key={codeTarget || path}
        value={code}
        onChange={value => {
          setCode(value);
          setDirty(true);
        }}
        mode={modeForFile(codeTarget || path)}
        onSave={props.save}
        undoableEditId={codeEditId}
      />
    </div>
  );
}

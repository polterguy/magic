import Select from '../Select';
import { type HistoryEntry, historyLabel } from './history';
import { snippetLabel } from './snippets';

// Above the editor — load and save snippets, recall history, import a .sql file.
export default function SnippetToolbar(
  props: Readonly<{
    snippets: string[];
    selectedSnippet: string;
    onOpenSnippet: (filename: string) => void;
    history: HistoryEntry[];
    onOpenHistory: (index: number) => void;
    onSaveSnippet: () => void;
    onImportSqlFile: (file: File) => void;
  }>,
) {
  const { snippets, selectedSnippet, history } = props;
  return (
    <div className="toolbar">
      <Select value={selectedSnippet} onChange={value => props.onOpenSnippet(value)}>
        <option value="">Load snippet…</option>
        {snippets.map(snippet => (
          <option key={snippet} value={snippet}>
            {snippetLabel(snippet)}
          </option>
        ))}
      </Select>
      {history.length > 0 && (
        <Select value="" onChange={value => props.onOpenHistory(Number(value))}>
          <option value="">History…</option>
          {history.map((entry, index) => (
            <option key={entry.when + index} value={String(index)}>
              {historyLabel(entry)}
            </option>
          ))}
        </Select>
      )}
      <button className="btn btn-secondary btn-small" onClick={props.onSaveSnippet}>
        Save snippet
      </button>
      <label className="btn btn-secondary btn-small" style={{ cursor: 'pointer' }}>
        Import .sql
        <input
          type="file"
          accept=".sql"
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files?.[0]) {
              props.onImportSqlFile(e.target.files[0]);
              e.target.value = '';
            }
          }}
        />
      </label>
    </div>
  );
}

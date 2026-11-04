import { loadFile, saveFile } from '../../../lib/api';
import { showError } from '../../../lib/errors';
import { useSqlSnippets } from '../../../lib/sql';
import { showToast } from '../../../lib/toast';
import { useDialog } from '../../../lib/useDialog';
import { useSessionState } from '../../../lib/useSessionState';
import { snippetFilename, snippetLabel, snippetSuggestion } from '../snippets';

/*
 * Loading and saving snippet files, and importing a .sql file into the buffer.
 */
export function useSqlSnippetFiles(
  options: Readonly<{
    type: string;
    sql: string;
    savedSql: string;
    setSql: (sql: string) => void;
    setSavedSql: (sql: string) => void;
    bumpSqlEditId: () => void;
    setWaiting: (waiting: boolean) => void;
  }>,
) {
  const { type, sql, savedSql, setSql, setSavedSql, bumpSqlEditId, setWaiting } = options;
  const { confirm, prompt } = useDialog();
  const { snippets, setSnippets } = useSqlSnippets(type);
  const [selectedSnippet, setSelectedSnippet] = useSessionState('magic2.sql-studio.snippet', '');

  async function openSnippet(filename: string) {
    if (!filename) {
      return;
    }
    // Loading over unsaved work destroys it — the navigation guard can't see
    // this, so ask the same question it would.
    if (
      sql !== savedSql &&
      !(await confirm({
        title: 'Discard unsaved changes?',
        message:
          'Your SQL has unsaved changes. Loading ' + snippetLabel(filename) + ' replaces them.',
        confirmText: 'Discard',
        danger: true,
      }))
    ) {
      return;
    }
    setSelectedSnippet(filename);
    setWaiting(true);
    try {
      const text = await loadFile(filename);
      setSql(text);
      bumpSqlEditId();
      setSavedSql(text);
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  async function saveSnippet() {
    // Saving over the snippet you loaded is the common case, so its name is
    // suggested — the dialog selects it, so typing replaces it outright.
    const suggestion = snippetSuggestion(selectedSnippet);
    const name = await prompt({
      title: 'Save SQL snippet',
      label: 'Snippet name',
      initial: suggestion,
    });
    if (!name) {
      return;
    }
    const filename = snippetFilename(type, name);
    setWaiting(true);
    try {
      await saveFile(filename, sql);
      setSavedSql(sql);
      setSelectedSnippet(filename);
      showToast('Saved ' + filename);
      if (!snippets.includes(filename)) {
        setSnippets([...snippets, filename].sort((a, b) => a.localeCompare(b)));
      }
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  function importSqlFile(file: File) {
    void file.text().then(text => {
      setSql(text);
      bumpSqlEditId();
    });
  }

  return { snippets, selectedSnippet, openSnippet, saveSnippet, importSqlFile };
}

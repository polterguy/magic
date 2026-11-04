/*
 * Snippet file naming — snippets live under /etc/{type}/templates/ as .sql files.
 */

// The file name without its folder, as the dropdown and dialogs show it.
export function snippetLabel(filename: string) {
  return filename.substring(filename.lastIndexOf('/') + 1);
}

// Saving over the snippet you loaded is the common case, so its name is suggested.
export function snippetSuggestion(selectedSnippet: string) {
  return selectedSnippet
    ? selectedSnippet.substring(selectedSnippet.lastIndexOf('/') + 1).replace(/\.sql$/, '')
    : '';
}

export function snippetFilename(type: string, name: string) {
  return '/etc/' + type + '/templates/' + name + (name.endsWith('.sql') ? '' : '.sql');
}

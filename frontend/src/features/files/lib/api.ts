/*
 * The calls this feature makes to the backend. The transport they go through — base URL, token,
 * errors — is shared/api.
 */
import { http, type MagicResponse, requestRaw } from '@shared/api';

export function listFoldersRecursively(folder: string, sysFiles: boolean) {
  return http.get<string[]>(
    '/magic/system/file-system/list-folders-recursively?folder=' +
      encodeURIComponent(folder) +
      '&sys=' +
      sysFiles,
  );
}

export function renamePath(oldName: string, newName: string) {
  return http.post<MagicResponse>('/magic/system/file-system/rename', { oldName, newName });
}

export function downloadFolderRaw(folder: string) {
  return requestRaw(
    'GET',
    '/magic/system/file-system/download-folder?folder=' + encodeURIComponent(folder),
  );
}

export function evaluateWithArgs(hyperlambda: string, args: unknown) {
  return requestRaw(
    'POST',
    '/magic/system/evaluator/evaluate-with-args',
    JSON.stringify({ hyperlambda, args }),
  );
}

interface HyperlambdaArguments {
  function?: boolean;
  description?: string;
  args?: { name: string; type: string; description?: string }[];
}

/*
 * The leading comment of a Hyperlambda file. An AI function's declaration is
 * just its file path - the model reads the tool's description and arguments
 * from the file itself - so this is only used to give the training-data row
 * a human readable text.
 */
export async function getFileDescription(path: string) {
  const result = await http.post<HyperlambdaArguments>(
    '/magic/system/workflows/get-hyperlambda-arguments',
    { path },
  );
  return result.description ?? '';
}

/*
 * Git.
 */

export function gitStatus(path: string) {
  return http.get<string[]>('/magic/system/git/status?path=' + encodeURIComponent(path));
}

// Unified diff of one repository-relative file against HEAD.
export function gitDiff(path: string, file: string) {
  return http.getText(
    '/magic/system/git/diff?path=' + encodeURIComponent(path) + '&file=' + encodeURIComponent(file),
  );
}

// Discards uncommitted changes — one file restored from HEAD, or the whole
// working tree reset to HEAD with untracked files removed when file is omitted.
export function gitRestore(path: string, file?: string) {
  return http.post<MagicResponse>('/magic/system/git/restore', file ? { path, file } : { path });
}

export function gitBranches(path: string) {
  return http.get<string[]>('/magic/system/git/branches?path=' + encodeURIComponent(path));
}

export function gitCommit(path: string, message: string) {
  return http.post<MagicResponse>('/magic/system/git/commit', { path, message });
}

export function gitPush(path: string, branch?: string) {
  return http.post<MagicResponse>('/magic/system/git/push', branch ? { path, branch } : { path });
}

export function gitPull(path: string, branch?: string) {
  return http.post<MagicResponse>(
    '/magic/system/git/pull',
    branch ? { path, branch, merge: true } : { path, merge: true },
  );
}

export function gitFetch(path: string) {
  return http.post<MagicResponse>('/magic/system/git/fetch', { path });
}

export function gitCheckout(path: string, branch: string, create = false) {
  return http.post<MagicResponse>('/magic/system/git/checkout', { path, branch, create });
}

// Merges a branch into the current one, or aborts a merge that stopped on conflicts.
export function gitMerge(path: string, branch: string) {
  return http.post<MagicResponse>('/magic/system/git/merge', { path, branch });
}

export function gitMergeAbort(path: string) {
  return http.post<MagicResponse>('/magic/system/git/merge', { path, abort: true });
}

// Commits as tab separated lines of side, hash, author, age and subject. With a
// range such as 'HEAD...@{u}' only the commits that differ are listed.
export function gitLog(path: string, range?: string) {
  return http.getText(
    '/magic/system/git/log?path=' +
      encodeURIComponent(path) +
      (range ? '&range=' + encodeURIComponent(range) : ''),
  );
}

export function gitInit(path: string) {
  return http.post<MagicResponse>('/magic/system/git/init', { path });
}

export function gitClone(path: string, url: string) {
  return http.post<MagicResponse>('/magic/system/git/clone', { path, url });
}

export function gitRemoteAdd(path: string, url: string) {
  return http.post<MagicResponse>('/magic/system/git/remote', { path, url });
}

export function gitGithubCreate(name: string, isPrivate: boolean) {
  return http.post<{ url: string }>('/magic/system/git/github-create', {
    name,
    private: isPrivate,
  });
}

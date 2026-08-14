/*
 * Git panel for Hyper IDE — status, branches, commit, push/pull/fetch for one
 * repository root, i.e. a top-level folder under /modules/ or /etc/. A folder
 * that is not a repository yet gets initialize/clone actions instead.
 */

import { useCallback, useEffect, useState } from 'react';
import { Modal, useDialog } from './Dialogs';
import { showToast } from '../lib/toast';
import {
  gitBranches, gitCheckout, gitClone, gitCommit, gitFetch, gitGithubCreate,
  gitInit, gitPull, gitPush, gitRemoteAdd, gitStatus, listFiles, listFolders,
} from '../lib/api';

export default function GitPanel(props: {
  path: string;
  onClose: () => void;
  // Invoked after operations that can change files on disk, so the owner can reload its file tree.
  onChanged: () => void;
}) {

  const { prompt } = useDialog();
  const [mode, setMode] = useState<'loading' | 'repo' | 'norepo'>('loading');
  const [branchLine, setBranchLine] = useState('');
  const [changes, setChanges] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  // Whether the folder has any contents — git refuses cloning into a non-empty folder.
  const [empty, setEmpty] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const lines = await gitStatus(props.path) ?? [];
      setBranchLine(lines.find(line => line.startsWith('## '))?.substring(3) ?? '');
      setChanges(lines.filter(line => !line.startsWith('## ')));
      setBranches(await gitBranches(props.path) ?? []);
      setMode('repo');
    } catch {
      // Status failing means the folder is not a repository (yet).
      const [files, folders] = await Promise.all([
        listFiles(props.path).catch(() => []),
        listFolders(props.path).catch(() => []),
      ]);
      setEmpty((files ?? []).length === 0 && (folders ?? []).length === 0);
      setMode('norepo');
    }
  }, [props.path]);

  useEffect(() => { refresh(); }, [refresh]);

  // While an operation runs the dialog must stay open — Escape, backdrop
  // clicks and the Close button all funnel through here.
  function close() {
    if (!busy) {
      props.onClose();
    }
  }

  // Runs one git operation with busy-state, toast and refresh handled.
  async function run(action: () => Promise<any>, done: string, changesTree = false) {
    setBusy(true);
    try {
      await action();
      showToast(done);
      await refresh();
      if (changesTree) {
        props.onChanged();
      }
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setBusy(false);
    }
  }

  /*
   * The branch status line looks like "main...origin/main [ahead 1]", or
   * "No commits yet on main" for a freshly initialized repository. Before the
   * first commit there's nothing to fetch, pull or push, so those are disabled.
   */
  const unborn = branchLine.startsWith('No commits yet on ');
  /*
   * Push is a no-op when an upstream exists and we're not ahead of it. With
   * NO upstream it stays enabled — the first push is what creates one. Pull
   * deliberately has no mirror rule, since "behind" is only as fresh as the
   * last fetch, while "ahead" is local knowledge and always current.
   */
  const hasUpstream = branchLine.includes('...');
  const nothingToPush = hasUpstream && !branchLine.includes('[ahead');
  const currentBranch = unborn
    ? branchLine.substring('No commits yet on '.length)
    : branchLine.split('...')[0].split(' ')[0];
  const branchOptions = branches.includes(currentBranch) || !currentBranch
    ? branches
    : [currentBranch, ...branches];

  async function newBranch() {
    const name = await prompt({ title: 'New branch', message: props.path, label: 'Branch name' });
    if (!name) {
      return;
    }
    await run(() => gitCheckout(props.path, name, true), 'Created and checked out ' + name, true);
  }

  async function clone() {
    const url = await prompt({ title: 'Clone repository', message: props.path, label: 'HTTPS repository URL' });
    if (!url) {
      return;
    }
    await run(() => gitClone(props.path, url), 'Repository cloned', true);
  }

  async function addRemote() {
    const url = await prompt({ title: 'Add remote', message: props.path, label: 'HTTPS repository URL' });
    if (!url) {
      return;
    }
    await run(() => gitRemoteAdd(props.path, url), 'Remote added');
  }

  // Creates a private GitHub repository, wires it up as origin, and pushes.
  async function publish() {
    const name = await prompt({
      title: 'Publish to GitHub',
      message: 'Creates a private GitHub repository and pushes ' + props.path,
      label: 'Repository name',
      initial: props.path.split('/').filter(Boolean).pop(),
    });
    if (!name) {
      return;
    }
    await run(async () => {
      const created = await gitGithubCreate(name);
      await gitRemoteAdd(props.path, created.url);
      await gitPush(props.path, currentBranch || undefined);
    }, 'Published to ' + name + ' on GitHub');
  }

  return (
    <Modal width={640} onClose={close}>
      <h2>Git — {props.path}</h2>
      {(mode === 'loading' || busy) && (
        <div className="spinner-panel">
          <div className="spinner" />
          {busy && <div>Running Git operation<span className="spinner-dots" /></div>}
        </div>
      )}
      {!busy && mode === 'norepo' && (
        <>
          <p>This folder is not a Git repository.</p>
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              disabled={busy || !empty}
              title={empty
                ? 'Clones a remote repository into this folder'
                : 'Requires an empty folder'}
              onClick={clone}>
              Clone into folder
            </button>
            <button
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => run(() => gitInit(props.path), 'Repository initialized', true)}>
              Initialize repository
            </button>
            <button className="btn" onClick={close}>
              Close
            </button>
          </div>
        </>
      )}
      {!busy && mode === 'repo' && (
        <>
          <p className="mono" title="Branch and tracking status">{branchLine}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <select
              value={currentBranch}
              disabled={busy || unborn}
              onChange={e =>
                run(() => gitCheckout(props.path, e.target.value), 'Checked out ' + e.target.value, true)}>
              {branchOptions.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
            <button className="btn btn-secondary btn-small" disabled={busy} onClick={newBranch}>
              New branch
            </button>
            <span style={{ flex: 1 }} />
            <button
              className="btn btn-secondary btn-small"
              disabled={busy || unborn}
              onClick={() => run(() => gitFetch(props.path), 'Fetched from remote')}>
              Fetch
            </button>
            <button
              className="btn btn-secondary btn-small"
              disabled={busy || unborn}
              onClick={() => run(() => gitPull(props.path, currentBranch || undefined), 'Pulled from remote', true)}>
              Pull
            </button>
            <button
              className="btn btn-secondary btn-small"
              disabled={busy || unborn || nothingToPush}
              title={nothingToPush ? 'Nothing to push' : undefined}
              onClick={() => run(() => gitPush(props.path, currentBranch || undefined), 'Pushed to remote')}>
              Push
            </button>
          </div>
          {changes.length === 0
            ? <p>Working tree clean.</p>
            : (
              <pre className="mono" style={{ maxHeight: 200, overflow: 'auto', margin: '0 0 12px' }}>
                {changes.join('\n')}
              </pre>
            )}
          <textarea
            placeholder="Commit message…"
            value={message}
            rows={2}
            disabled={busy || changes.length === 0}
            style={{ width: '100%' }}
            onChange={e => setMessage(e.target.value)} />
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              disabled={busy || unborn || hasUpstream}
              title={hasUpstream
                ? 'Already has a remote'
                : 'Creates a private GitHub repository and pushes this module to it'}
              onClick={publish}>
              Publish to GitHub…
            </button>
            <button
              className="btn btn-secondary"
              disabled={busy || hasUpstream}
              title={hasUpstream ? 'Already has a remote' : undefined}
              onClick={addRemote}>
              Add remote
            </button>
            <button
              className="btn btn-secondary"
              disabled={busy || !message.trim() || changes.length === 0}
              onClick={() => run(async () => {
                await gitCommit(props.path, message.trim());
                setMessage('');
              }, 'Changes committed')}>
              Commit
            </button>
            <button className="btn" onClick={close}>
              Close
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

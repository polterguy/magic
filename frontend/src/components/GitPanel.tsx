/*
 * Git panel for Hyper IDE — status, branches, commit, push/pull/fetch for one
 * repository root, i.e. a top-level folder under /modules/ or /etc/. A folder
 * that is not a repository yet gets initialize/clone actions instead.
 */

import { useCallback, useEffect, useState } from 'react';
import { Modal, useDialog } from './Dialogs';
import { showToast } from '../lib/toast';
import {
  gitBranches, gitCheckout, gitClone, gitCommit, gitFetch, gitInit,
  gitPull, gitPush, gitRemoteAdd, gitStatus,
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

  const refresh = useCallback(async () => {
    try {
      const lines = await gitStatus(props.path) ?? [];
      setBranchLine(lines.find(line => line.startsWith('## '))?.substring(3) ?? '');
      setChanges(lines.filter(line => !line.startsWith('## ')));
      setBranches(await gitBranches(props.path) ?? []);
      setMode('repo');
    } catch {
      // Status failing means the folder is not a repository (yet).
      setMode('norepo');
    }
  }, [props.path]);

  useEffect(() => { refresh(); }, [refresh]);

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
      showToast(err.message, true);
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

  return (
    <Modal width={640} onClose={props.onClose}>
      <h2>Git — {props.path}</h2>
      {mode === 'loading' && <p>Loading…</p>}
      {mode === 'norepo' && (
        <>
          <p>This folder is not a Git repository.</p>
          <div className="modal-actions">
            <button className="btn btn-secondary" disabled={busy} onClick={clone}>
              Clone into folder
            </button>
            <button
              className="btn"
              disabled={busy}
              onClick={() => run(() => gitInit(props.path), 'Repository initialized', true)}>
              Initialize repository
            </button>
          </div>
        </>
      )}
      {mode === 'repo' && (
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
              disabled={busy || unborn}
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
            style={{ width: '100%' }}
            onChange={e => setMessage(e.target.value)} />
          <div className="modal-actions">
            <button className="btn btn-secondary" disabled={busy} onClick={addRemote}>
              Add remote
            </button>
            <button
              className="btn"
              disabled={busy || !message.trim() || changes.length === 0}
              onClick={() => run(async () => {
                await gitCommit(props.path, message.trim());
                setMessage('');
              }, 'Changes committed')}>
              Commit
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

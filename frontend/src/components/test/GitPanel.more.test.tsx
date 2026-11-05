// @vitest-environment jsdom
/*
 * GitPanel, second part: aborting a merge, history, resets, the busy state, closing, and a folder that
 * is not a repository yet. The API layer is mocked; dialogs and the toast are the real ones.
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import * as api from '../../lib/api';
import { setToastListener, type Toast } from '../../lib/toast';
import { renderPage } from '../../test/renderPage';
import GitPanel from '../GitPanel';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);

const PATH = '/modules/shop/';

let toasts: Toast[];
let onClose: Mock<() => void>;
let onChanged: Mock<() => void>;

function status(...lines: string[]) {
  vi.mocked(api.gitStatus).mockResolvedValue(lines);
}

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  onClose = vi.fn<() => void>();
  onChanged = vi.fn<() => void>();
  status('## main...origin/main', ' M src/a.hl');
  vi.mocked(api.gitBranches).mockResolvedValue(['main', 'dev']);
  vi.mocked(api.gitLog).mockResolvedValue('');
  vi.mocked(api.listFiles).mockResolvedValue([]);
  vi.mocked(api.listFolders).mockResolvedValue([]);
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

async function open(path = PATH) {
  const view = renderPage(<GitPanel path={path} onClose={onClose} onChanged={onChanged} />);
  await waitFor(() => expect(document.querySelector('.spinner')).toBeNull());
  return view;
}

function button(name: string) {
  return screen.getByRole('button', { name });
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<never>(done => {
    resolve = () => done(undefined as never);
  });
  return { promise, resolve };
}

describe('GitPanel merge conflicts', () => {
  beforeEach(() => {
    status('## main', 'UU clash.hl');
  });

  it('aborts the merge after confirmation', async () => {
    await open();
    expect(screen.getByText(/A merge stopped on conflicts/)).toBeInTheDocument();
    await userEvent.click(button('Abort merge'));
    expect(screen.getByText(/Abandon the merge/)).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Abort merge' }).at(-1)!);
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(api.gitMergeAbort).toHaveBeenCalledWith(PATH);
    expect(toasts.at(-1)).toMatchObject({ text: 'Merge aborted' });
  });

  it('leaves the merge alone when the confirmation is declined', async () => {
    await open();
    await userEvent.click(button('Abort merge'));
    await userEvent.click(button('Cancel'));
    expect(api.gitMergeAbort).not.toHaveBeenCalled();
  });
});

describe('GitPanel history', () => {
  it('shows the latest commits and hides them again', async () => {
    vi.mocked(api.gitLog).mockResolvedValue('\tabc123\tAnn\t2 days ago\tFix\tthe thing\n\n');
    await open();
    await userEvent.click(button('History'));
    expect(api.gitLog).toHaveBeenCalledWith(PATH, undefined);
    expect(screen.getByText('Latest commits')).toBeInTheDocument();
    expect(document.querySelector('.git-change-line')).toHaveTextContent(
      'abc123 Fix the thing — Ann, 2 days ago',
    );
    await userEvent.click(button('Hide history'));
    expect(screen.queryByText('Latest commits')).toBeNull();
    expect(button('History')).toBeInTheDocument();
  });

  it('says so when there are no commits', async () => {
    await open();
    await userEvent.click(button('History'));
    expect(await screen.findByText('No commits')).toBeInTheDocument();
  });

  it('lists only what differs from the remote when out of sync', async () => {
    status('## main...origin/main [ahead 1, behind 2]', ' M a.hl');
    vi.mocked(api.gitLog).mockResolvedValue('<\th1\tAnn\tnow\tmine\n>\th2\tBob\tlater\ttheirs');
    await open();
    await userEvent.click(button('History'));
    expect(api.gitLog).toHaveBeenCalledWith(PATH, 'HEAD...@{u}');
    expect(
      screen.getByText('Not in sync with the remote — < only here, > only on the remote'),
    ).toBeInTheDocument();
    expect(screen.getByText('h1 mine — Ann, now')).toBeInTheDocument();
    expect(screen.getByText('h2 theirs — Bob, later')).toBeInTheDocument();
  });

  it('treats a branch behind the remote as out of sync', async () => {
    status('## main...origin/main [behind 1]', ' M a.hl');
    await open();
    await userEvent.click(button('History'));
    expect(api.gitLog).toHaveBeenCalledWith(PATH, 'HEAD...@{u}');
  });

  it('shows the latest commits for a branch in sync with its remote', async () => {
    status('## main...origin/main', ' M a.hl');
    await open();
    await userEvent.click(button('History'));
    expect(api.gitLog).toHaveBeenCalledWith(PATH, undefined);
  });

  it('reports a history that cannot be read', async () => {
    vi.mocked(api.gitLog).mockRejectedValue(new Error('no log'));
    await open();
    await userEvent.click(button('History'));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ isError: true }));
    expect(button('History')).toBeInTheDocument();
  });

  it('forgets an open history when the status is refreshed', async () => {
    await open();
    await userEvent.click(button('History'));
    await screen.findByText('Latest commits');
    await userEvent.click(button('Fetch'));
    await waitFor(() => expect(api.gitStatus).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText('Latest commits')).toBeNull());
  });
});

describe('GitPanel resets', () => {
  it('resets one file after confirmation', async () => {
    await open();
    await userEvent.click(screen.getByTitle('Reset to HEAD'));
    expect(screen.getByText(/Discard all uncommitted changes to src\/a.hl/)).toBeInTheDocument();
    await userEvent.click(button('Reset'));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(api.gitRestore).toHaveBeenCalledWith(PATH, 'src/a.hl');
    expect(toasts.at(-1)).toMatchObject({ text: 'Reset src/a.hl to HEAD' });
  });

  it('keeps the file when the reset is declined', async () => {
    await open();
    await userEvent.click(screen.getByTitle('Reset to HEAD'));
    await userEvent.click(button('Cancel'));
    expect(api.gitRestore).not.toHaveBeenCalled();
  });

  it('resets the whole repository after confirmation', async () => {
    await open();
    await userEvent.click(button('Reset to HEAD…'));
    expect(screen.getByText(/delete all untracked files/)).toBeInTheDocument();
    await userEvent.click(button('Reset everything'));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(api.gitRestore).toHaveBeenCalledWith(PATH);
    expect(toasts.at(-1)).toMatchObject({ text: 'Repository reset to HEAD' });
  });

  it('keeps everything when the full reset is declined', async () => {
    await open();
    await userEvent.click(button('Reset to HEAD…'));
    await userEvent.click(button('Cancel'));
    expect(api.gitRestore).not.toHaveBeenCalled();
  });
});

describe('GitPanel busy state and closing', () => {
  it('closes through the Close button and Escape', async () => {
    await open();
    await userEvent.click(button('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('shows a spinner and ignores closing while an operation runs', async () => {
    const gate = deferred();
    vi.mocked(api.gitFetch).mockReturnValue(gate.promise);
    await open();
    await userEvent.click(button('Fetch'));
    expect(await screen.findByText('Running Git operation')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    gate.resolve();
    await waitFor(() => expect(screen.queryByText('Running Git operation')).toBeNull());
    expect(button('Close')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows only the spinner while the status loads', async () => {
    const gate = deferred();
    vi.mocked(api.gitStatus).mockReturnValue(gate.promise.then(() => ['## main']));
    renderPage(<GitPanel path={PATH} onClose={onClose} onChanged={onChanged} />);
    expect(document.querySelector('.spinner')).not.toBeNull();
    expect(screen.queryByText('Running Git operation')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Fetch' })).toBeNull();
    gate.resolve();
    expect(await screen.findByRole('button', { name: 'Fetch' })).toBeInTheDocument();
  });
});

describe('GitPanel folder that is not a repository', () => {
  beforeEach(() => {
    vi.mocked(api.gitStatus).mockRejectedValue(new Error('not a repository'));
  });

  it('offers to initialize, and enables cloning in an empty folder', async () => {
    await open();
    expect(screen.getByText('This folder is not a Git repository.')).toBeInTheDocument();
    expect(api.listFiles).toHaveBeenCalledWith(PATH);
    expect(api.listFolders).toHaveBeenCalledWith(PATH);
    expect(button('Clone into folder')).toBeEnabled();
    expect(button('Clone into folder')).toHaveAttribute(
      'title',
      'Clones a remote repository into this folder',
    );
  });

  it('disables cloning when the folder has files', async () => {
    vi.mocked(api.listFiles).mockResolvedValue(['/modules/shop/a.hl']);
    await open();
    expect(button('Clone into folder')).toBeDisabled();
    expect(button('Clone into folder')).toHaveAttribute('title', 'Requires an empty folder');
  });

  it('disables cloning when the folder has subfolders', async () => {
    vi.mocked(api.listFolders).mockResolvedValue(['/modules/shop/sub/']);
    await open();
    expect(button('Clone into folder')).toBeDisabled();
  });

  it('treats unreadable or answerless listings as empty', async () => {
    vi.mocked(api.listFiles).mockRejectedValue(new Error('no'));
    vi.mocked(api.listFolders).mockResolvedValue(undefined as unknown as string[]);
    await open();
    expect(button('Clone into folder')).toBeEnabled();
  });

  it('initializes a repository and tells the owner', async () => {
    await open();
    vi.mocked(api.gitStatus).mockResolvedValue(['## No commits yet on main']);
    vi.mocked(api.gitBranches).mockResolvedValue([]);
    await userEvent.click(button('Initialize repository'));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(api.gitInit).toHaveBeenCalledWith(PATH);
    expect(toasts.at(-1)).toMatchObject({ text: 'Repository initialized' });
    expect(await screen.findByRole('button', { name: 'Fetch' })).toBeDisabled();
  });

  it('clones the prompted URL', async () => {
    await open();
    await userEvent.click(button('Clone into folder'));
    await userEvent.type(screen.getByLabelText('HTTPS repository URL'), 'https://git.test/r.git');
    await userEvent.click(button('OK'));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'Repository cloned' }));
    expect(api.gitClone).toHaveBeenCalledWith(PATH, 'https://git.test/r.git');
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('does not clone when the prompt is cancelled', async () => {
    await open();
    await userEvent.click(button('Clone into folder'));
    await userEvent.click(button('Cancel'));
    expect(api.gitClone).not.toHaveBeenCalled();
  });

  it('shows the error of a failed initialization and stays on the same screen', async () => {
    vi.mocked(api.gitInit).mockRejectedValue(new Error('read only'));
    await open();
    await userEvent.click(button('Initialize repository'));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ isError: true }));
    expect(onChanged).not.toHaveBeenCalled();
    expect(button('Initialize repository')).toBeEnabled();
  });

  it('closes', async () => {
    await open();
    await userEvent.click(button('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

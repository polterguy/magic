// @vitest-environment jsdom
/*
 * GitPanel: loading the status of a repository, the branch line and the branch picker, the file list
 * with expandable diffs, commit, fetch, pull and push (and when they are disabled), history, merge,
 * resets, and a folder that is not a repository yet (initialize and clone). The API layer is mocked;
 * dialogs and the toast are the real ones.
 */
import { screen, waitFor, within } from '@testing-library/react';
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
  vi.mocked(api.gitDiff).mockResolvedValue('');
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
  await waitFor(() => expect(screen.queryByText('Running Git operation')).toBeNull());
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

describe('GitPanel status', () => {
  it('shows the branch line and the changed files of a repository', async () => {
    status('## main...origin/main [ahead 1]', ' M src/a.hl', 'A  new.hl', ' D gone.hl');
    await open();
    expect(api.gitStatus).toHaveBeenCalledWith(PATH);
    expect(screen.getByText('Git — ' + PATH)).toBeInTheDocument();
    expect(screen.getByText('main...origin/main [ahead 1]')).toBeInTheDocument();
    expect(screen.getByText('src/a.hl')).toBeInTheDocument();
    expect(screen.getByText('new.hl')).toBeInTheDocument();
    expect(screen.getByText('gone.hl')).toBeInTheDocument();
  });

  it('colours added, deleted and plain status codes differently', async () => {
    status('## main', 'A  new.hl', ' D gone.hl', ' M plain.hl', '?? loose.hl');
    await open();
    expect(screen.getByText('A')).toHaveClass('add');
    expect(screen.getByText('D')).toHaveClass('del');
    expect(screen.getByText('M').className.trim()).toBe('git-status');
    expect(screen.getByText('??')).toHaveClass('add');
  });

  it('reports a clean working tree and keeps the commit controls disabled', async () => {
    status('## main...origin/main');
    await open();
    expect(screen.getByText('Working tree clean.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Commit message…')).toBeDisabled();
    expect(button('Commit')).toBeDisabled();
    expect(button('Reset to HEAD…')).toBeDisabled();
  });

  it('shows the destination of a rename and strips quotes from unusual paths', async () => {
    status('## main', 'R  old.hl -> new.hl', ' M "with space.hl"', '?? "');
    await open();
    expect(screen.getByText('new.hl')).toBeInTheDocument();
    expect(screen.getByText('with space.hl')).toBeInTheDocument();
    expect(screen.getByText('"')).toBeInTheDocument();
  });

  it('copes with a backend that answers nothing', async () => {
    vi.mocked(api.gitStatus).mockResolvedValue(undefined as unknown as string[]);
    vi.mocked(api.gitBranches).mockResolvedValue(undefined as unknown as string[]);
    await open();
    expect(screen.getByText('Working tree clean.')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('lists the branches and selects the current one', async () => {
    await open();
    expect(screen.getByRole('combobox')).toHaveValue('main');
    expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual(['main', 'dev']);
  });

  it('adds the current branch to the picker when the branch list lacks it', async () => {
    status('## feature...origin/feature');
    await open();
    expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual([
      'feature',
      'main',
      'dev',
    ]);
    expect(screen.getByRole('combobox')).toHaveValue('feature');
  });

  it('reads the branch of a status line that has no upstream', async () => {
    status('## solo', ' M a.hl');
    await open();
    expect(screen.getByRole('combobox')).toHaveValue('solo');
  });
});

describe('GitPanel unborn repository', () => {
  beforeEach(() => {
    status('## No commits yet on trunk', '?? a.hl');
    vi.mocked(api.gitBranches).mockResolvedValue([]);
  });

  it('disables everything that needs a commit', async () => {
    await open();
    expect(screen.getByRole('combobox')).toHaveValue('trunk');
    expect(screen.getByRole('combobox')).toBeDisabled();
    for (const name of ['Merge', 'History', 'Fetch', 'Pull', 'Push', 'Publish to GitHub…']) {
      expect(button(name)).toBeDisabled();
    }
    expect(button('Add remote')).toBeEnabled();
    expect(button('New branch')).toBeEnabled();
  });

  it('offers no reset for an untracked file', async () => {
    await open();
    expect(screen.queryByTitle('Reset to HEAD')).toBeNull();
  });
});

describe('GitPanel diffs', () => {
  it('fetches and colours a diff when a file is opened, and does not fetch it twice', async () => {
    vi.mocked(api.gitDiff).mockResolvedValue(
      ['--- a/src/a.hl', '+++ b/src/a.hl', '@@ -1 +1 @@', '-old', '+new', ' same', 'other'].join(
        '\n',
      ),
    );
    await open();
    await userEvent.click(screen.getByText('src/a.hl'));
    expect(api.gitDiff).toHaveBeenCalledWith(PATH, 'src/a.hl');
    const pre = await waitFor(() => {
      const found = document.querySelector('.git-diff');
      expect(found?.querySelectorAll('span').length).toBeGreaterThan(3);
      return found!;
    });
    const classes = (text: string) => within(pre as HTMLElement).getByText(text).className;
    expect(classes('--- a/src/a.hl')).toBe('meta');
    expect(classes('+++ b/src/a.hl')).toBe('meta');
    expect(classes('@@ -1 +1 @@')).toBe('hunk');
    expect(classes('-old')).toBe('del');
    expect(classes('+new')).toBe('add');
    expect(classes('same')).toBe('');
    expect(classes('other')).toBe('meta');

    // Collapse and expand again: the diff is kept, so nothing is fetched anew.
    await userEvent.click(screen.getByText('src/a.hl'));
    expect(document.querySelector('.git-diff')).toBeNull();
    await userEvent.click(screen.getByText('src/a.hl'));
    expect(document.querySelector('.git-diff')).not.toBeNull();
    expect(api.gitDiff).toHaveBeenCalledTimes(1);
  });

  it('says there are no changes for an empty diff', async () => {
    await open();
    await userEvent.click(screen.getByText('src/a.hl'));
    expect(await screen.findByText('No changes')).toBeInTheDocument();
  });

  it('shows a loading note until the diff arrives', async () => {
    const gate = deferred();
    vi.mocked(api.gitDiff).mockReturnValue(gate.promise.then(() => 'late line'));
    await open();
    await userEvent.click(screen.getByText('src/a.hl'));
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    gate.resolve();
    expect(await screen.findByText('late line')).toBeInTheDocument();
    expect(screen.queryByText('Loading…')).toBeNull();
  });

  it('shows the whole content of an untracked file as additions', async () => {
    status('## main', '?? notes.txt');
    vi.mocked(api.loadFile).mockResolvedValue('one\ntwo');
    await open();
    await userEvent.click(screen.getByText('notes.txt'));
    expect(await screen.findByText('+one')).toHaveClass('add');
    expect(screen.getByText('+two')).toBeInTheDocument();
    expect(api.loadFile).toHaveBeenCalledWith(PATH + 'notes.txt');
    expect(api.gitDiff).not.toHaveBeenCalled();
  });

  it('reports a diff that cannot be read', async () => {
    vi.mocked(api.gitDiff).mockRejectedValue(new Error('diff broke'));
    await open();
    await userEvent.click(screen.getByText('src/a.hl'));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ isError: true }));
    expect(toasts.at(-1)!.text).toContain('diff broke');
  });
});

describe('GitPanel commit', () => {
  it('commits the trimmed message, clears it and refreshes', async () => {
    await open();
    expect(button('Commit')).toBeDisabled();
    await userEvent.type(screen.getByPlaceholderText('Commit message…'), '  Fix it  ');
    await userEvent.click(button('Commit'));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'Changes committed' }));
    expect(api.gitCommit).toHaveBeenCalledWith(PATH, 'Fix it');
    expect(api.gitStatus).toHaveBeenCalledTimes(2);
    expect(screen.getByPlaceholderText('Commit message…')).toHaveValue('');
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('keeps Commit disabled for a blank message', async () => {
    await open();
    await userEvent.type(screen.getByPlaceholderText('Commit message…'), '   ');
    expect(button('Commit')).toBeDisabled();
  });

  it('shows the error and keeps the message when the commit fails', async () => {
    vi.mocked(api.gitCommit).mockRejectedValue(new Error('nothing staged'));
    await open();
    await userEvent.type(screen.getByPlaceholderText('Commit message…'), 'msg');
    await userEvent.click(button('Commit'));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ isError: true }));
    expect(toasts.at(-1)!.text).toContain('nothing staged');
    expect(screen.getByPlaceholderText('Commit message…')).toHaveValue('msg');
    expect(api.gitStatus).toHaveBeenCalledTimes(1);
  });
});

describe('GitPanel remote operations', () => {
  it('fetches', async () => {
    await open();
    await userEvent.click(button('Fetch'));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'Fetched from remote' }));
    expect(api.gitFetch).toHaveBeenCalledWith(PATH);
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('pulls the current branch and tells the owner files may have changed', async () => {
    await open();
    await userEvent.click(button('Pull'));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(api.gitPull).toHaveBeenCalledWith(PATH, 'main');
    expect(toasts.at(-1)).toMatchObject({ text: 'Pulled from remote' });
  });

  it('pushes only when there is something ahead of the upstream', async () => {
    await open();
    expect(button('Push')).toBeDisabled();
    expect(button('Push')).toHaveAttribute('title', 'Nothing to push');
  });

  it('pushes the current branch when ahead', async () => {
    status('## main...origin/main [ahead 2]', ' M a.hl');
    await open();
    expect(button('Push')).toBeEnabled();
    await userEvent.click(button('Push'));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'Pushed to remote' }));
    expect(api.gitPush).toHaveBeenCalledWith(PATH, 'main');
  });

  it('keeps Push enabled without an upstream, since the first push creates it', async () => {
    status('## main', ' M a.hl');
    await open();
    expect(button('Push')).toBeEnabled();
    expect(button('Push')).not.toHaveAttribute('title');
    await userEvent.click(button('Push'));
    await waitFor(() => expect(api.gitPush).toHaveBeenCalledWith(PATH, 'main'));
  });

  it('pulls and pushes without a branch name when the status line names none', async () => {
    status(' M a.hl');
    vi.mocked(api.gitBranches).mockResolvedValue([]);
    await open();
    await userEvent.click(button('Pull'));
    await waitFor(() => expect(api.gitPull).toHaveBeenCalledWith(PATH, undefined));
    await userEvent.click(button('Push'));
    await waitFor(() => expect(api.gitPush).toHaveBeenCalledWith(PATH, undefined));
  });

  it('shows the error of a failed pull', async () => {
    vi.mocked(api.gitPull).mockRejectedValue(new Error('conflict'));
    await open();
    await userEvent.click(button('Pull'));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ isError: true }));
    expect(onChanged).not.toHaveBeenCalled();
    expect(button('Pull')).toBeEnabled();
  });

  it('disables Add remote and Publish when an upstream exists', async () => {
    await open();
    expect(button('Add remote')).toBeDisabled();
    expect(button('Add remote')).toHaveAttribute('title', 'Already has a remote');
    expect(button('Publish to GitHub…')).toBeDisabled();
    expect(button('Publish to GitHub…')).toHaveAttribute('title', 'Already has a remote');
  });
});

describe('GitPanel add remote and publish', () => {
  beforeEach(() => {
    status('## main', ' M a.hl');
  });

  it('adds a remote from the prompted URL', async () => {
    await open();
    await userEvent.click(button('Add remote'));
    await userEvent.type(screen.getByLabelText('HTTPS repository URL'), 'https://git.test/x.git');
    await userEvent.click(button('OK'));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'Remote added' }));
    expect(api.gitRemoteAdd).toHaveBeenCalledWith(PATH, 'https://git.test/x.git');
  });

  it('does nothing when the remote prompt is cancelled', async () => {
    await open();
    await userEvent.click(button('Add remote'));
    await userEvent.click(button('Cancel'));
    expect(api.gitRemoteAdd).not.toHaveBeenCalled();
  });

  it('proposes the folder name, private by default, and publishes through GitHub', async () => {
    vi.mocked(api.gitGithubCreate).mockResolvedValue({ url: 'https://github.test/me/shop.git' });
    await open();
    await userEvent.click(button('Publish to GitHub…'));
    const name = screen.getByLabelText<HTMLInputElement>('Repository name', { exact: false });
    expect(name).toHaveValue('shop');
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByText('— only you can see it')).toBeInTheDocument();
    await userEvent.click(button('OK'));
    await waitFor(() =>
      expect(toasts.at(-1)).toMatchObject({ text: 'Published to shop on GitHub' }),
    );
    expect(api.gitGithubCreate).toHaveBeenCalledWith('shop', true);
    expect(api.gitRemoteAdd).toHaveBeenCalledWith(PATH, 'https://github.test/me/shop.git');
    expect(api.gitPush).toHaveBeenCalledWith(PATH, 'main');
    expect(screen.queryByText('Publish to GitHub', { selector: 'h2' })).toBeNull();
  });

  it('publishes a renamed public repository and warns about visibility', async () => {
    vi.mocked(api.gitGithubCreate).mockResolvedValue({ url: 'https://github.test/me/pub.git' });
    await open();
    await userEvent.click(button('Publish to GitHub…'));
    const name = screen.getByLabelText<HTMLInputElement>('Repository name', { exact: false });
    await userEvent.clear(name);
    await userEvent.type(name, ' pub ');
    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByText('— anyone can see everything in this folder')).toBeInTheDocument();
    await userEvent.click(button('OK'));
    await waitFor(() => expect(api.gitGithubCreate).toHaveBeenCalledWith('pub', false));
  });

  it('publishes with Enter in the name field', async () => {
    vi.mocked(api.gitGithubCreate).mockResolvedValue({ url: 'u' });
    await open();
    await userEvent.click(button('Publish to GitHub…'));
    await userEvent.type(screen.getByLabelText('Repository name', { exact: false }), 'x{Enter}');
    await waitFor(() => expect(api.gitGithubCreate).toHaveBeenCalledWith('shopx', true));
  });

  it('refuses a blank name', async () => {
    await open();
    await userEvent.click(button('Publish to GitHub…'));
    const name = screen.getByLabelText('Repository name', { exact: false });
    await userEvent.clear(name);
    expect(button('OK')).toBeDisabled();
    await userEvent.type(name, '{Enter}');
    expect(api.gitGithubCreate).not.toHaveBeenCalled();
  });

  it('cancels publishing', async () => {
    await open();
    await userEvent.click(button('Publish to GitHub…'));
    await userEvent.click(button('Cancel'));
    expect(screen.queryByText('Repository name', { exact: false })).toBeNull();
    expect(api.gitGithubCreate).not.toHaveBeenCalled();
  });

  it('starts with an empty name when the path has no folder', async () => {
    await open('/');
    await userEvent.click(button('Publish to GitHub…'));
    expect(screen.getByLabelText('Repository name', { exact: false })).toHaveValue('');
    expect(button('OK')).toBeDisabled();
  });

  it('reports a failure to create the repository without adding a remote', async () => {
    vi.mocked(api.gitGithubCreate).mockRejectedValue(new Error('name taken'));
    await open();
    await userEvent.click(button('Publish to GitHub…'));
    await userEvent.click(button('OK'));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ isError: true }));
    expect(api.gitRemoteAdd).not.toHaveBeenCalled();
  });
});

describe('GitPanel branches', () => {
  it('checks out the branch chosen in the picker', async () => {
    await open();
    await userEvent.selectOptions(screen.getByRole('combobox'), 'dev');
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(api.gitCheckout).toHaveBeenCalledWith(PATH, 'dev');
    expect(toasts.at(-1)).toMatchObject({ text: 'Checked out dev' });
  });

  it('creates and checks out a new branch', async () => {
    await open();
    await userEvent.click(button('New branch'));
    await userEvent.type(screen.getByLabelText('Branch name'), 'topic');
    await userEvent.click(button('OK'));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(api.gitCheckout).toHaveBeenCalledWith(PATH, 'topic', true);
    expect(toasts.at(-1)).toMatchObject({ text: 'Created and checked out topic' });
  });

  it('does not create a branch when the prompt is left empty', async () => {
    await open();
    await userEvent.click(button('New branch'));
    await userEvent.click(button('OK'));
    expect(api.gitCheckout).not.toHaveBeenCalled();
  });

  it('merges the named branch and lists the other branches in the prompt', async () => {
    await open();
    await userEvent.click(button('Merge'));
    expect(screen.getByText('Merges into main. Branches: dev')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Branch to merge'), 'dev');
    await userEvent.click(button('OK'));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(api.gitMerge).toHaveBeenCalledWith(PATH, 'dev');
    expect(toasts.at(-1)).toMatchObject({ text: 'Merged dev into main' });
  });

  it('does not merge when the prompt is cancelled', async () => {
    await open();
    await userEvent.click(button('Merge'));
    await userEvent.click(button('Cancel'));
    expect(api.gitMerge).not.toHaveBeenCalled();
  });

  it('cannot merge with only one branch', async () => {
    vi.mocked(api.gitBranches).mockResolvedValue(['main']);
    await open();
    expect(button('Merge')).toBeDisabled();
  });

  it('shows no abort button without conflicts', async () => {
    await open();
    expect(screen.queryByText(/A merge stopped on conflicts/)).toBeNull();
  });
});

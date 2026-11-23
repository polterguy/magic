// @vitest-environment jsdom
/*
 * FileTree: nesting from flat folder/file lists, expansion (including the forced
 * expansion while filtering), row selection state, click and keyboard activation,
 * and the per-row action buttons and which of them each kind of path offers.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import FileTree from '../FileTree';

type Props = React.ComponentProps<typeof FileTree>;

const FOLDERS = ['/etc/', '/etc/www/', '/modules/', '/modules/app/', '/system/'];
const FILES = ['/readme.md', '/etc/www/index.html', '/etc/www/.hidden.html', '/modules/app/x.hl'];

function callbacks() {
  return {
    onToggleFolder: vi.fn(),
    onOpenFile: vi.fn(),
    onNewFile: vi.fn(),
    onNewFolder: vi.fn(),
    onGit: vi.fn(),
    onOpenApi: vi.fn(),
    onAiFunctions: vi.fn(),
    onRename: vi.fn(),
    onDeleteFolder: vi.fn(),
    onDeleteFile: vi.fn(),
  };
}

function renderTree(overrides: Partial<Props> = {}) {
  const cbs = callbacks();
  render(
    <FileTree
      folders={FOLDERS}
      visibleFiles={FILES}
      visibleFolders={null}
      query=""
      expanded={new Set(['/etc/', '/etc/www/', '/modules/', '/modules/app/'])}
      activeFolder="/"
      selectedFile=""
      backendUrl="https://cloud.test"
      {...cbs}
      {...overrides}
    />,
  );
  return cbs;
}

const row = (path: string) => screen.getByTitle(path);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FileTree rendering', () => {
  it('nests expanded folders and their files', () => {
    renderTree();
    expect(within(row('/etc/')).getByText('etc')).toBeInTheDocument();
    expect(row('/etc/www/index.html')).toBeInTheDocument();
    expect(row('/modules/app/x.hl')).toBeInTheDocument();
    expect(row('/readme.md')).toBeInTheDocument();
  });

  it('hides the children of collapsed folders', () => {
    renderTree({ expanded: new Set(['/etc/']) });
    expect(row('/etc/www/')).toBeInTheDocument();
    expect(screen.queryByTitle('/etc/www/index.html')).not.toBeInTheDocument();
    expect(screen.queryByTitle('/modules/app/')).not.toBeInTheDocument();
  });

  it('forces every folder open while a query is active', () => {
    renderTree({ expanded: new Set(), query: 'x' });
    expect(row('/modules/app/x.hl')).toBeInTheDocument();
  });

  it('only shows the folders the filter lets through', () => {
    renderTree({ visibleFolders: new Set(['/modules/', '/modules/app/']) });
    expect(screen.queryByTitle('/etc/')).not.toBeInTheDocument();
    expect(row('/modules/')).toBeInTheDocument();
  });

  it('marks the active folder, the selected file and system paths', () => {
    renderTree({ activeFolder: '/modules/', selectedFile: '/readme.md' });
    expect(row('/modules/')).toHaveClass('active-folder');
    expect(row('/modules/')).toHaveAttribute('aria-selected', 'true');
    expect(row('/etc/')).not.toHaveClass('active-folder');
    expect(row('/readme.md')).toHaveClass('selected');
    expect(row('/system/')).toHaveClass('system');
    expect(row('/etc/')).not.toHaveClass('system');
  });
});

describe('FileTree interaction', () => {
  it('toggles a folder on click and opens a file on click', async () => {
    const cbs = renderTree();
    await userEvent.click(row('/etc/'));
    expect(cbs.onToggleFolder).toHaveBeenCalledWith('/etc/');
    await userEvent.click(row('/readme.md'));
    expect(cbs.onOpenFile).toHaveBeenCalledWith('/readme.md');
  });

  it('activates a row with Enter and Space, but only from the row itself', async () => {
    const cbs = renderTree();
    row('/readme.md').focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(cbs.onOpenFile).toHaveBeenCalledTimes(2);
    row('/etc/').focus();
    await userEvent.keyboard('{Enter}');
    expect(cbs.onToggleFolder).toHaveBeenCalledWith('/etc/');
    await userEvent.keyboard('a');
    expect(cbs.onToggleFolder).toHaveBeenCalledTimes(1);
  });

  it('ignores keys pressed on a row action button', async () => {
    const cbs = renderTree();
    const rename = within(row('/readme.md')).getByTitle('Rename');
    rename.focus();
    await userEvent.keyboard('{Enter}');
    expect(cbs.onOpenFile).not.toHaveBeenCalled();
    expect(cbs.onRename).toHaveBeenCalledWith('/readme.md', false);
  });
});

describe('FileTree actions', () => {
  it('runs the folder actions without toggling the folder', async () => {
    const cbs = renderTree();
    const actions = within(row('/modules/'));
    await userEvent.click(actions.getByTitle('New file'));
    await userEvent.click(actions.getByTitle('New folder'));
    await userEvent.click(actions.getByTitle('Git'));
    await userEvent.click(actions.getByTitle('OpenAPI specification'));
    await userEvent.click(actions.getByTitle(/Create AI functions for all/));
    await userEvent.click(actions.getByTitle('Rename'));
    await userEvent.click(actions.getByTitle('Delete'));
    expect(cbs.onNewFile).toHaveBeenCalledWith('/modules/');
    expect(cbs.onNewFolder).toHaveBeenCalledWith('/modules/');
    expect(cbs.onGit).toHaveBeenCalledWith('/modules/');
    expect(cbs.onOpenApi).toHaveBeenCalledWith('/modules/');
    expect(cbs.onAiFunctions).toHaveBeenCalledWith('/modules/');
    expect(cbs.onRename).toHaveBeenCalledWith('/modules/', true);
    expect(cbs.onDeleteFolder).toHaveBeenCalledWith('/modules/');
    expect(cbs.onToggleFolder).not.toHaveBeenCalled();
  });

  it('offers Git only inside /modules/ and /etc/, AI functions only in modules', () => {
    renderTree();
    expect(within(row('/etc/www/')).getByTitle('Git')).toBeInTheDocument();
    expect(within(row('/etc/www/')).queryByTitle(/Create AI functions/)).not.toBeInTheDocument();
    expect(within(row('/system/')).queryByTitle('Git')).not.toBeInTheDocument();
  });

  it('runs the file actions without opening the file', async () => {
    const cbs = renderTree();
    const actions = within(row('/modules/app/x.hl'));
    await userEvent.click(actions.getByTitle('Create AI function for this file…'));
    await userEvent.click(actions.getByTitle('Rename'));
    await userEvent.click(actions.getByTitle('Delete'));
    expect(cbs.onAiFunctions).toHaveBeenCalledWith('/modules/app/x.hl');
    expect(cbs.onRename).toHaveBeenCalledWith('/modules/app/x.hl', false);
    expect(cbs.onDeleteFile).toHaveBeenCalledWith('/modules/app/x.hl');
    expect(cbs.onOpenFile).not.toHaveBeenCalled();
  });

  it('previews a served /etc/www file in a new tab', async () => {
    const open = vi.spyOn(globalThis, 'open').mockReturnValue(null);
    const cbs = renderTree();
    await userEvent.click(
      within(row('/etc/www/index.html')).getByTitle('Open in a browser, as a visitor sees it'),
    );
    expect(open).toHaveBeenCalledWith('https://cloud.test/index.html', '_blank', 'noopener');
    expect(cbs.onOpenFile).not.toHaveBeenCalled();
  });

  it('offers no preview for hidden, Hyperlambda or non-www files', () => {
    renderTree();
    const title = 'Open in a browser, as a visitor sees it';
    expect(within(row('/etc/www/.hidden.html')).queryByTitle(title)).not.toBeInTheDocument();
    expect(within(row('/modules/app/x.hl')).queryByTitle(title)).not.toBeInTheDocument();
    expect(within(row('/readme.md')).queryByTitle(title)).not.toBeInTheDocument();
  });

  it('offers no AI function for a file that is not Hyperlambda', () => {
    renderTree();
    expect(within(row('/readme.md')).queryByTitle(/Create AI function/)).not.toBeInTheDocument();
  });
});

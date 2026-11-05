// @vitest-environment jsdom
/*
 * The command palette: what it lists for an empty query, how it ranks and groups a typed one,
 * keyboard and mouse selection, the dynamic sources (endpoints, files, tasks, models) and how it
 * behaves when one of them fails or the query is remembered between openings.
 */
import '../../test/renderPage';

import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import CommandPalette from '../CommandPalette';
import { SECTIONS } from '../sections';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);

const mocked = vi.mocked(api);

// Each test gets its own backend url, so the palette's per-backend cache never leaks between tests.
let backendCounter = 0;

beforeEach(() => {
  vi.clearAllMocks();
  backendCounter += 1;
  api.configureApi('https://palette' + backendCounter + '.test', null);
  mocked.listEndpoints.mockResolvedValue([
    { path: 'magic/system/log/list', verb: 'get' },
    { path: 'magic/modules/orders/place', verb: 'post' },
  ] as never);
  mocked.listFilesRecursively.mockImplementation((folder: string) =>
    Promise.resolve(
      folder === '/modules/' ? ['/modules/orders/place.post.hl'] : ['/etc/www/index.html'],
    ),
  );
  mocked.listTasks.mockResolvedValue([
    { id: 'nightly-cleanup', description: 'Removes old rows' },
    { id: 'no-description' },
  ] as never);
  mocked.mlTypes.mockResolvedValue([{ type: 'support-bot' }] as never);
});

interface Setup {
  go?: (to: string) => void;
  actions?: { label: string; action: () => void }[];
  onClose?: () => void;
  keepQuery?: boolean;
}

async function openPalette(setup: Setup = {}) {
  const go = setup.go ?? vi.fn();
  const onClose = setup.onClose ?? vi.fn();
  const actions = setup.actions ?? [{ label: 'Toggle light/dark theme', action: vi.fn() }];
  const user = userEvent.setup();
  render(<CommandPalette go={go} actions={actions} onClose={onClose} />);
  const input = screen.getByRole('combobox');
  // The previous test may have left a remembered query behind.
  if (!setup.keepQuery && (input as HTMLInputElement).value) {
    await user.clear(input);
  }
  return { user, input, go, onClose, actions };
}

// Waits until the dynamic sources have been merged in, which a typed query then matches against.
async function typeAndWait(
  user: ReturnType<typeof userEvent.setup>,
  text: string,
  expected: string,
) {
  await waitFor(() => expect(mocked.mlTypes).toHaveBeenCalled());
  await user.type(screen.getByRole('combobox'), text);
  await waitFor(() => expect(document.body.textContent).toContain(expected));
}

describe('empty query', () => {
  it('lists every section and the actions, but none of the dynamic entries', async () => {
    await openPalette();
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(SECTIONS.length + 1);
    expect(screen.getByText('Go to')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Toggle light/dark theme')).toBeInTheDocument();
    expect(screen.queryByText('nightly-cleanup')).not.toBeInTheDocument();
  });

  it('shows each group header once', async () => {
    await openPalette();
    expect(screen.getAllByText('Go to')).toHaveLength(1);
    expect(screen.getAllByText('Actions')).toHaveLength(1);
  });

  it('marks the first row selected and keeps focus on the input', async () => {
    const { input } = await openPalette();
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-activedescendant', 'palette-option-0');
  });
});

describe('searching', () => {
  it('finds a section by a fuzzy subsequence and highlights the matched characters', async () => {
    const { user } = await openPalette();
    await user.type(screen.getByRole('combobox'), 'sqlst');
    const row = await screen.findByRole('option', { name: /SQL Studio/ });
    expect(within(row).getAllByText(/^[SQLst]$/).length).toBeGreaterThan(0);
    expect(row.querySelectorAll('b')).toHaveLength(5);
  });

  it('says so when nothing matches', async () => {
    const { user, input } = await openPalette();
    await user.type(input, 'zzzzqqqq');
    expect(await screen.findByText('Nothing matches')).toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  it('matches an endpoint by its verb and path, whitespace separating the terms', async () => {
    const { user } = await openPalette();
    await typeAndWait(user, 'get log list', 'magic/system/log/list');
    const row = screen.getByRole('option', { name: /magic\/system\/log\/list/ });
    expect(within(row).getByText('GET')).toHaveClass('badge', 'badge-get');
    expect(screen.getByText('Endpoints')).toBeInTheDocument();
  });

  it('shows a file as a dimmed directory with a highlighted filename', async () => {
    const { user } = await openPalette();
    await typeAndWait(user, 'placehl', 'Files');
    const row = screen
      .getAllByRole('option')
      .find(option => option.textContent?.includes('place.post.hl'))!;
    expect(row.querySelector('.palette-file-dir')?.textContent).toBe('/modules/orders/');
    expect(row.querySelector('.palette-file-name')?.textContent).toBe('place.post.hl');
  });

  it('finds a task by id and shows its description as a hint, but nothing for a task without one', async () => {
    const { user } = await openPalette();
    await typeAndWait(user, 'nightly', 'Tasks');
    const row = screen.getByRole('option', { name: /nightly-cleanup/ });
    expect(within(row).getByText('Removes old rows')).toHaveClass('palette-hint');
    await user.clear(screen.getByRole('combobox'));
    await user.type(screen.getByRole('combobox'), 'no-description');
    const plain = await screen.findByRole('option', { name: /no-description/ });
    expect(plain.querySelector('.palette-hint')).toBeNull();
  });

  it('offers two entries per model, under their own headings', async () => {
    const { user } = await openPalette();
    await typeAndWait(user, 'support-bot', 'Training data');
    expect(screen.getByText('Models')).toBeInTheDocument();
    expect(screen.getByText('Edit model')).toBeInTheDocument();
    expect(screen.getByText('Training snippets for this model')).toBeInTheDocument();
  });

  it('regroups rows under a single header per group', async () => {
    const { user } = await openPalette();
    await typeAndWait(user, 'o', 'Go to');
    const headers = Array.from(document.querySelectorAll('.palette-group')).map(h => h.textContent);
    expect(new Set(headers).size).toBe(headers.length);
  });

  it('caps the result list at forty rows', async () => {
    mocked.listFilesRecursively.mockImplementation(() =>
      Promise.resolve(Array.from({ length: 100 }, (_, i) => '/modules/m/file' + i + '.hl')),
    );
    const { user } = await openPalette();
    await waitFor(() => expect(mocked.mlTypes).toHaveBeenCalled());
    await user.type(screen.getByRole('combobox'), 'file');
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(40));
  });
});

describe('running a command', () => {
  it('Enter on a section closes the palette and navigates there', async () => {
    const { user, go, onClose } = await openPalette();
    await user.type(screen.getByRole('combobox'), 'databases');
    await user.keyboard('{Enter}');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(go).toHaveBeenCalledWith('/databases');
  });

  it('Enter on an action runs it', async () => {
    const action = vi.fn();
    const { user, onClose } = await openPalette({ actions: [{ label: 'Do the thing', action }] });
    await user.type(screen.getByRole('combobox'), 'do the thing');
    await user.keyboard('{Enter}');
    expect(action).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking a row runs it', async () => {
    const { user, go } = await openPalette();
    await user.click(screen.getByRole('option', { name: 'Databases' }));
    expect(go).toHaveBeenCalledWith('/databases');
  });

  it('an endpoint navigates to the endpoints page with its filter and verb expanded', async () => {
    const { user, go } = await openPalette();
    await typeAndWait(user, 'orders/place', 'magic/modules/orders/place');
    await user.click(screen.getByRole('option', { name: /POST\s*magic\/modules\/orders\/place/ }));
    expect(go).toHaveBeenCalledWith(
      '/endpoints?filter=magic%2Fmodules%2Forders%2Fplace&expand=post',
    );
  });

  it('a file opens in the Hyper IDE', async () => {
    const { user, go } = await openPalette();
    await typeAndWait(user, 'index.html', 'Files');
    await user.click(
      screen.getAllByRole('option').find(o => o.textContent?.includes('index.html'))!,
    );
    expect(go).toHaveBeenCalledWith('/hyper-ide?open=%2Fetc%2Fwww%2Findex.html');
  });

  it('a task opens its editor with its filter set', async () => {
    const { user, go } = await openPalette();
    await typeAndWait(user, 'nightly', 'Tasks');
    await user.click(screen.getByRole('option', { name: /nightly-cleanup/ }));
    expect(go).toHaveBeenCalledWith('/task-manager?edit=nightly-cleanup&filter=nightly-cleanup');
  });

  it('the two model entries open different tabs', async () => {
    const { user, go } = await openPalette();
    await typeAndWait(user, 'support-bot', 'Training data');
    await user.click(screen.getByRole('option', { name: /Edit model/ }));
    expect(go).toHaveBeenLastCalledWith('/machine-learning?tab=types&edit=support-bot');
    await user.click(screen.getByRole('option', { name: /Training snippets/ }));
    expect(go).toHaveBeenLastCalledWith('/machine-learning?tab=training&type=support-bot');
  });

  it('Enter with nothing matched does nothing', async () => {
    const { user, go, onClose } = await openPalette();
    await user.type(screen.getByRole('combobox'), 'zzzzqqqq');
    await user.keyboard('{Enter}');
    expect(go).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('keyboard and mouse selection', () => {
  it('arrow keys move the selection and stop at both ends', async () => {
    const { user } = await openPalette();
    const options = () => screen.getAllByRole('option');
    await user.keyboard('{ArrowDown}');
    expect(options()[1]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(options()[0]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowDown>40/}');
    expect(options()[options().length - 1]).toHaveAttribute('aria-selected', 'true');
  });

  it('Enter runs the row the arrows selected', async () => {
    const { user, go } = await openPalette();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(go).toHaveBeenCalledWith(SECTIONS[1].to);
  });

  it('hovering a row selects it', async () => {
    const { user } = await openPalette();
    const second = screen.getAllByRole('option')[2];
    await user.hover(second);
    expect(second).toHaveAttribute('aria-selected', 'true');
  });

  it('typing resets the selection to the first match', async () => {
    const { user } = await openPalette();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    await user.type(screen.getByRole('combobox'), 'd');
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('clamps the selection when the results shrink beneath it', async () => {
    const { user } = await openPalette();
    await user.keyboard('{ArrowDown>10/}');
    await user.type(screen.getByRole('combobox'), 'dashboard');
    const options = screen.getAllByRole('option');
    expect(options.some(option => option.getAttribute('aria-selected') === 'true')).toBe(true);
  });

  it('Enter on a focused row runs it', async () => {
    const { user, go } = await openPalette();
    const row = screen.getByRole('option', { name: 'Databases' });
    row.focus();
    await user.keyboard('{Enter}');
    expect(go).toHaveBeenCalledWith('/databases');
  });
});

describe('closing', () => {
  it('Escape closes it', async () => {
    const { user, onClose } = await openPalette();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pressing the backdrop closes it, pressing inside does not', async () => {
    const { user, onClose } = await openPalette();
    await user.click(screen.getByRole('dialog', { name: 'Command palette' }));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(document.querySelector('.palette-backdrop')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('dynamic sources', () => {
  it('a failing source contributes nothing and the others still work', async () => {
    mocked.listEndpoints.mockRejectedValue(new Error('403'));
    mocked.mlTypes.mockRejectedValue(new Error('500'));
    const { user } = await openPalette();
    await typeAndWait(user, 'nightly', 'Tasks');
    expect(screen.queryByText('Endpoints')).not.toBeInTheDocument();
  });

  it('a task list that answers nothing is tolerated', async () => {
    mocked.listTasks.mockResolvedValue(undefined as never);
    mocked.mlTypes.mockResolvedValue(undefined as never);
    const { user } = await openPalette();
    await waitFor(() => expect(mocked.mlTypes).toHaveBeenCalled());
    await user.type(screen.getByRole('combobox'), 'orders');
    expect(await screen.findByText('Endpoints')).toBeInTheDocument();
  });

  it('asks the backend once and reuses the answer on the next opening', async () => {
    const first = await openPalette();
    await waitFor(() => expect(mocked.listEndpoints).toHaveBeenCalledTimes(1));
    await first.user.clear(first.input);
    cleanup();
    const second = await openPalette();
    await second.user.type(screen.getByRole('combobox'), 'nightly');
    expect(await screen.findByText('Tasks')).toBeInTheDocument();
    expect(mocked.listEndpoints).toHaveBeenCalledTimes(1);
  });

  it('asks again for another backend', async () => {
    const first = await openPalette();
    await waitFor(() => expect(mocked.listEndpoints).toHaveBeenCalledTimes(1));
    await first.user.keyboard('x');
    api.configureApi('https://another-backend.test', null);
    cleanup();
    await openPalette();
    await waitFor(() => expect(mocked.listEndpoints).toHaveBeenCalledTimes(2));
  });

  it('logs and survives a loader that throws', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {
      // keep the expected error out of the test output
    });
    mocked.listTasks.mockImplementation(() => {
      throw new Error('sync failure');
    });
    await openPalette();
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith('Could not load commands:', expect.any(Error)),
    );
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    error.mockRestore();
  });
});

describe('remembered query', () => {
  it('reopens with the last query selected, and typing replaces it', async () => {
    const first = await openPalette();
    await first.user.type(first.input, 'databases');
    cleanup();
    const second = await openPalette({ keepQuery: true });
    expect(second.input).toHaveValue('databases');
    const field = second.input as HTMLInputElement;
    expect(field.selectionStart).toBe(0);
    expect(field.selectionEnd).toBe('databases'.length);
    await second.user.keyboard('log');
    expect(field).toHaveValue('log');
  });
});

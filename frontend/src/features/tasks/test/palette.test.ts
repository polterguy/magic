import * as api from '@core/api';
import { describe, expect, it, vi } from 'vitest';

import { paletteEntries } from '../palette';

vi.mock('@core/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

describe('tasks palette source', () => {
  it('opens a task in its editor, filtered to it, with its description as the hint', async () => {
    vi.mocked(api.listTasks).mockResolvedValue([
      { id: 'nightly-cleanup', description: 'Removes old rows' },
      { id: 'no-description' },
    ] as never);
    expect(await paletteEntries('/task-manager')).toEqual([
      {
        group: 'Tasks',
        label: 'nightly-cleanup',
        hint: 'Removes old rows',
        to: '/task-manager?edit=nightly-cleanup&filter=nightly-cleanup',
      },
      {
        group: 'Tasks',
        label: 'no-description',
        hint: undefined,
        to: '/task-manager?edit=no-description&filter=no-description',
      },
    ]);
  });

  it('tolerates a task list that answers nothing', async () => {
    vi.mocked(api.listTasks).mockResolvedValue(undefined as never);
    expect(await paletteEntries('/task-manager')).toEqual([]);
  });
});

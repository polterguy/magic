import * as api from '@core/api';
import { describe, expect, it, vi } from 'vitest';

import { paletteEntries } from '../palette';

vi.mock('@core/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

describe('machine learning palette source', () => {
  it('offers each model twice, opening its editor or its training data', async () => {
    vi.mocked(api.mlTypes).mockResolvedValue([{ type: 'support-bot' }] as never);
    expect(await paletteEntries('/machine-learning')).toEqual([
      {
        group: 'Models',
        label: 'support-bot',
        hint: 'Edit model',
        to: '/machine-learning?tab=types&edit=support-bot',
      },
      {
        group: 'Training data',
        label: 'support-bot',
        hint: 'Training snippets for this model',
        to: '/machine-learning?tab=training&type=support-bot',
      },
    ]);
  });

  it('tolerates a model list that answers nothing', async () => {
    vi.mocked(api.mlTypes).mockResolvedValue(undefined as never);
    expect(await paletteEntries('/machine-learning')).toEqual([]);
  });
});

import * as api from '@shared/api';
import { describe, expect, it, vi } from 'vitest';

import { paletteEntries } from '../lib/palette';

vi.mock('@shared/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

describe('endpoints palette source', () => {
  it('opens the endpoints page filtered to the endpoint, with its verb expanded', async () => {
    vi.mocked(api.listEndpoints).mockResolvedValue([
      { path: 'magic/modules/orders/place', verb: 'post' },
    ] as never);
    expect(await paletteEntries('/endpoints')).toEqual([
      {
        group: 'Endpoints',
        label: 'magic/modules/orders/place',
        verb: 'POST',
        to: '/endpoints?filter=magic%2Fmodules%2Forders%2Fplace&expand=post',
      },
    ]);
  });
});

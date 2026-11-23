import * as api from '@core/api';
import { describe, expect, it, vi } from 'vitest';

import { paletteEntries } from '../lib/palette';

vi.mock('@core/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

describe('files palette source', () => {
  it('opens module and configuration files in the Hyper IDE', async () => {
    vi.mocked(api.listFilesRecursively).mockImplementation((folder: string) =>
      Promise.resolve(
        folder === '/modules/' ? ['/modules/orders/place.post.hl'] : ['/etc/www/index.html'],
      ),
    );
    expect(await paletteEntries('/hyper-ide')).toEqual([
      {
        group: 'Files',
        label: '/modules/orders/place.post.hl',
        to: '/hyper-ide?open=%2Fmodules%2Forders%2Fplace.post.hl',
      },
      {
        group: 'Files',
        label: '/etc/www/index.html',
        to: '/hyper-ide?open=%2Fetc%2Fwww%2Findex.html',
      },
    ]);
  });

  it('keeps the files of one folder when the other fails', async () => {
    vi.mocked(api.listFilesRecursively).mockImplementation((folder: string) =>
      folder === '/modules/' ? Promise.reject(new Error('403')) : Promise.resolve(['/etc/a.json']),
    );
    expect((await paletteEntries('/hyper-ide')).map(entry => entry.label)).toEqual(['/etc/a.json']);
  });
});

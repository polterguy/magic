import { listEndpoints } from '@core/api';
import type { PaletteEntry } from '@core/features';

// Every endpoint, for the command palette.
export async function paletteEntries(path: string): Promise<PaletteEntry[]> {
  const endpoints = await listEndpoints();
  return endpoints.map(endpoint => ({
    group: 'Endpoints',
    label: endpoint.path,
    verb: endpoint.verb.toUpperCase(),
    // The verb travels along, so the Endpoints page can expand and scroll
    // to the exact row rather than just filtering to it.
    to:
      path +
      '?filter=' +
      encodeURIComponent(endpoint.path) +
      '&expand=' +
      encodeURIComponent(endpoint.verb),
  }));
}

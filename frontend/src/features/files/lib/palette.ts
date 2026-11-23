import { listFilesRecursively } from '@core/api';
import type { PaletteEntry } from '@core/features';

// Every module and configuration file, for the command palette. A folder that fails adds nothing.
export async function paletteEntries(path: string): Promise<PaletteEntry[]> {
  const [moduleFiles, etcFiles] = await Promise.all([
    listFilesRecursively('/modules/', false).catch(() => []),
    listFilesRecursively('/etc/', false).catch(() => []),
  ]);
  return [...moduleFiles, ...etcFiles].map(file => ({
    group: 'Files',
    label: file,
    to: path + '?open=' + encodeURIComponent(file),
  }));
}

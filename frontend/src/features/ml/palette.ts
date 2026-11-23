import { mlTypes } from '@core/api';
import type { PaletteEntry } from '@core/features';

/*
 * Two ways in per model, told apart by their group rather than by a decorated label — the name
 * you are searching for stays the thing you read, under a heading that says what happens when
 * you pick it.
 */
export async function paletteEntries(path: string): Promise<PaletteEntry[]> {
  const models = await mlTypes();
  return (models ?? []).flatMap(model => [
    {
      group: 'Models',
      label: model.type,
      hint: 'Edit model',
      to: path + '?tab=types&edit=' + encodeURIComponent(model.type),
    },
    {
      group: 'Training data',
      label: model.type,
      hint: 'Training snippets for this model',
      to: path + '?tab=training&type=' + encodeURIComponent(model.type),
    },
  ]);
}

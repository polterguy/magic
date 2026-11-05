/*
 * Builds the module that stands in for lib/api in page tests. Every network function becomes a
 * vi.fn() resolving to undefined, so a test only states the handful of answers its page reads;
 * the pure helpers, constants and the ApiError class stay real.
 *
 * Use it from a test file as:
 *   vi.mock('../../lib/api', async importOriginal =>
 *     (await import('../../test/apiMock')).mockApi(await importOriginal()));
 */
import { vi } from 'vitest';

// Exports that compute something locally and must keep working.
const PURE = new Set([
  'apiBaseUrl',
  'moduleNameFromZip',
  'userExtra',
  'fileWithTokenUrl',
  'aiContextForFile',
  'unfence',
  'modelPriceLabel',
  'gibberish',
  'chatPrompt',
  'chatDownloadUrl',
  'configureApi',
  'setUnauthorizedHandler',
]);

function isClass(value: unknown) {
  return typeof value === 'function' && /^class\s/.test(Function.prototype.toString.call(value));
}

export function mockApi(original: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(original)) {
    if (name === 'http') {
      result[name] = {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
      };
    } else if (typeof value === 'function' && !PURE.has(name) && !isClass(value)) {
      result[name] = vi.fn().mockResolvedValue(undefined);
    } else {
      result[name] = value;
    }
  }
  return result;
}

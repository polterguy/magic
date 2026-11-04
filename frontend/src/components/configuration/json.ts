import { JsonValue } from '../../lib/api';

/*
 * The settings dialogs read and patch the editor's JSON text. Anything in it
 * may be any JSON value, so these narrow it to what the dialogs expect.
 */
export type JsonObject = { [key: string]: JsonValue };

// The value when it is a JSON object, otherwise an empty one.
export function asObject(value: JsonValue | undefined): JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

// The editor's text as an object, or null when it isn't valid JSON.
export function parseObject(text: string): JsonObject | null {
  try {
    const parsed = JSON.parse(text) as JsonValue;
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// The object found by following path from the root of the editor's text, empty when absent.
export function configSection(text: string, ...path: string[]): JsonObject {
  return path.reduce<JsonObject>((current, key) => asObject(current[key]), parseObject(text) ?? {});
}

// A setting as text for an input, the fallback when it is missing.
export function settingText(value: JsonValue | undefined, fallback = ''): string {
  return value === undefined || value === null ? fallback : fieldText(value);
}

// What a stored setting is shown as in a text field: nothing for none, JSON for a structure.
export function fieldText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (value !== null && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return '';
}

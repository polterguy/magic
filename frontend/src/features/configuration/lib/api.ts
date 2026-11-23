/*
 * The calls this feature makes to the backend. The transport they go through — base URL, token,
 * errors — is core/api.
 */

// Any JSON value, for payloads whose shape is only known at runtime.
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

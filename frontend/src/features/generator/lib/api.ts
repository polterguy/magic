/*
 * The calls this feature makes to the backend. The transport they go through — base URL, token,
 * errors — is shared/api.
 */
import { http, type MagicResponse } from '@shared/api';

/*
 * Names of every dynamically created slot ([slots.create]) in the system —
 * the vocabulary [execute]/[signal] can invoke. Root-only.
 */
export function listDynamicSlots() {
  return http.get<string[]>('/magic/system/evaluator/slots');
}

/*
 * Backend generator — one invocation per verb per table.
 */
export interface OpenApiParameter {
  name: string;
  in: string;
  required: boolean;
  type: string;
}

export interface OpenApiOperation {
  id: string;
  verb: string;
  path: string;
  summary: string | null;
  tag: string | null;
  parameters: OpenApiParameter[] | null;
  'has-body'?: boolean;
}

export interface OpenApiSpec {
  title: string | null;
  version: string | null;
  servers: string[] | null;
  'security-schemes':
    | {
        name: string;
        type: string;
        in: string | null;
        'header-name': string | null;
        scheme: string | null;
      }[]
    | null;
  operations: OpenApiOperation[] | null;
}

// Reads an OpenAPI specification without importing anything from it.
export function parseOpenApi(url: string) {
  return http.post<OpenApiSpec>('/magic/system/openapi/parse', { url });
}

// Generates endpoints wrapping the selected operations.
export function importOpenApi(payload: {
  url: string;
  moduleName: string;
  baseUrl: string;
  operations: string[];
  authScheme: string;
  authName?: string;
  configKey?: string;
  auth?: string;
  overwrite?: boolean;
  // Feedback channel the importer announces each generated endpoint on.
  channel?: string;
}) {
  return http.post<{ created: string[] | null; skipped: string[] | null; loc: number }>(
    '/magic/system/openapi/import',
    payload,
  );
}

export function customSqlEndpoint(payload: {
  databaseType: string;
  database: string;
  authorization: string;
  moduleName: string;
  endpointName: string;
  verb: string;
  sql: string;
  arguments: string;
  overwrite: boolean;
}) {
  return http.post<MagicResponse>('/magic/system/crudifier/custom-sql', payload);
}

/*
 * Generates one sandboxed Hyperlambda endpoint. [policy] is a JSON string carrying
 * the timeout, root-override flag and the per-role access rules; the backend returns
 * the generated Hyperlambda so the caller can preview what was written.
 */
export function generateSandboxEndpoint(payload: {
  moduleName: string;
  endpointName: string;
  verb: string;
  inputMode: string;
  authorization: string;
  policy: string;
  overwrite: boolean;
}) {
  return http.post<{ result: string; file: string; hyperlambda: string }>(
    '/magic/system/crudifier/sandbox-api',
    payload,
  );
}

/*
 * Generates one endpoint searching the training snippets of a single machine learning type by
 * keyword, by meaning or both. Everything but the query is baked into the endpoint; the backend
 * returns the generated Hyperlambda so the caller can preview what was written.
 */
export function generateSearchEndpoint(payload: {
  moduleName: string;
  endpointName: string;
  verb: string;
  type: string;
  retrieval: string;
  threshold?: number;
  limit: number;
  uri: string;
  meta: string;
  result: string;
  authorization: string;
  rateLimit: number;
  rateWindow: number;
  cacheSeconds: number;
  overwrite: boolean;
}) {
  return http.post<{ result: string; file: string; hyperlambda: string }>(
    '/magic/system/crudifier/search-api',
    payload,
  );
}

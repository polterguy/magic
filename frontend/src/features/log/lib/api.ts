/*
 * The calls this feature makes to the backend. The transport they go through — base URL, token,
 * errors — is shared/api.
 */
import { http } from '@shared/api';

/*
 * Log.
 */

export interface LogItem {
  id: number;
  created: string;
  type: string;
  content: string;
  exception?: string;
  // Key/value pairs the log invocation attached through its [meta] argument.
  meta?: Record<string, string>;
}

export function listLog(from: number | null, max: number, query?: string) {
  let url = '/magic/system/log/list?max=' + max;
  if (from) {
    url += '&from=' + from;
  }
  if (query) {
    url += '&query=' + encodeURIComponent(query.includes('%') ? query : query + '%');
  }
  return http.get<LogItem[]>(url);
}

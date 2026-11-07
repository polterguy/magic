/*
 * The two URLs the backend builds links and CORS decisions from: [magic.backend.url], the one
 * address the backend is reached at, and [magic.frontend.urls], the origins of the dashboards
 * allowed to call it, stored as one comma separated string.
 */

// The origin of an http(s) URL, otherwise null. A browser's Origin header has no path.
export function toOrigin(text: string): string | null {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : null;
  } catch {
    return null;
  }
}

// The text without the slashes at its end.
export function trimTrailingSlashes(text: string): string {
  let end = text.length;
  while (end > 0 && text[end - 1] === '/') {
    end--;
  }
  return text.slice(0, end);
}

// The backend URL as typed without trailing slashes, otherwise null when it isn't an http(s) URL.
export function toBackendUrl(text: string): string | null {
  const url = trimTrailingSlashes(text.trim());
  return toOrigin(url) === null ? null : url;
}

/*
 * The frontend URLs typed one per line, or comma separated. Each is reduced to its origin, since
 * that is all CORS compares, and repeats are dropped. The ones that are not URLs are returned
 * as typed, for the error message.
 */
export function parseFrontendUrls(text: string): { origins: string[]; invalid: string[] } {
  const origins: string[] = [];
  const invalid: string[] = [];
  for (const entry of text.split(/[\n,]/).map(part => part.trim())) {
    if (entry === '') {
      continue;
    }
    const origin = toOrigin(entry);
    if (origin === null) {
      invalid.push(entry);
    } else if (!origins.some(existing => existing.toLowerCase() === origin.toLowerCase())) {
      origins.push(origin);
    }
  }
  return { origins, invalid };
}

/*
 * Whether the backend would still answer the dashboard at this origin. With no frontend URLs it
 * answers any origin, and a dashboard served from the backend's own origin is not subject to CORS.
 */
export function allowsDashboard(
  origins: string[],
  dashboard: string,
  servedByBackend: boolean,
): boolean {
  return (
    origins.length === 0 ||
    servedByBackend ||
    origins.some(origin => origin.toLowerCase() === dashboard.toLowerCase())
  );
}

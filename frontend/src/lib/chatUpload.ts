/*
 * How the files attached to a Chat Ops message are treated. Upload saves them on the
 * cloudlet and tells the model where they landed. Analyse exposes them over HTTP for
 * the model to read, which needs a host the model can reach.
 */
export type AttachMode = 'upload' | 'analyse';

// Whether the backend is on this machine, where the model can fetch nothing from.
export function backendIsLocal(backendUrl: string): boolean {
  const host = new URL(backendUrl).hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

// Upload is the only mode that works on a local backend, and Analyse is the one worth having everywhere else.
export function defaultAttachMode(backendUrl: string): AttachMode {
  return backendIsLocal(backendUrl) ? 'upload' : 'analyse';
}

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

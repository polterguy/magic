/*
 * App-wide notifications. The layout owns the stack of toasts on screen —
 * these let any component add to it, so a copy-to-clipboard or a background
 * message from the server both surface the same way.
 */

export interface Toast {
  id: number;
  text: string;
  isError: boolean;
  // Id of the log entry the backend wrote for an API error, when it
  // returned one — lets the toast link straight to the log.
  logId?: number;
}

type Listener = (toast: Toast) => void;

let listener: Listener | null = null;
let nextId = 0;

export function setToastListener(value: Listener | null) {
  listener = value;
}

export function showToast(text: string, isError = false, logId?: number) {
  listener?.({ id: ++nextId, text, isError, logId });
}

/*
 * Copies text to the clipboard and tells the user it happened — a copy gives
 * no visible feedback of its own.
 */
export async function copyToClipboard(text: string, what = 'Text') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(what + ' can be found on your clipboard');
  } catch {
    showToast('Your browser would not let us access the clipboard', true);
  }
}

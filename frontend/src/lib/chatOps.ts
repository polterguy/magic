/*
 * Tells the rest of the dashboard when a Chat Ops turn has finished doing
 * something to the server.
 *
 * Chat Ops is the only way natural language reaches the Web Designer — the
 * designer itself has no AI in it — so the designer has to hear about a
 * finished turn to pick up files the agent rewrote underneath it.
 *
 * Only turns that actually invoked an AI function are announced. A turn that
 * merely answered a question changed nothing on disk, and reloading a canvas
 * for it would throw away the user's place for no reason.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

export function onChatOpsDone(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyChatOpsDone() {
  listeners.forEach(listener => listener());
}

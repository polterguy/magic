/*
 * Turning whatever a rejected promise or a catch block hands us into something a user can read.
 * Catch variables are `unknown`, so this is the one place that looks inside them.
 */

import { ApiError } from './api';
import { showToast } from './toast';

export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof Error) {
    return err.message || fallback;
  }
  if (typeof err === 'string') {
    return err || fallback;
  }
  return fallback;
}

// Shows an error toast, linking to the backend's log entry when the error carries one.
export function showError(err: unknown, prefix = '') {
  showToast(prefix + errorMessage(err), true, err instanceof ApiError ? err.logId : undefined);
}

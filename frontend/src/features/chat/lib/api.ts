/*
 * The calls this feature makes to the backend. The transport they go through — base URL, token,
 * errors — is shared/api.
 */
import { backendInfo, http, type MagicResponse } from '@shared/api';

/*
 * AI chat against the "default" code-generation model. Responses stream over
 * the /sockets hub on a channel named after the chat session, one JSON encoded
 * chunk per push. AI functions execute server-side inside the chat pipeline —
 * the chunks merely report their progress.
 */
export interface ChatChunk {
  message?: string;
  error?: boolean;
  finished?: boolean;
  type?: string;
  filename?: string;
  ticket?: string;
  html?: string;
  floating_message?: string;
  floating_state?: 'success' | 'error';
  function_waiting?: boolean;
  function_result?: string;
  function_error?: string;
  // Ride along with function_result/function_error — the invoked file and its arguments.
  invocation?: string;
  file?: string;
}

/*
 * Files ride along as [file], [file1], [file2] … — at most five, which is
 * what the backend's chat pipeline consumes. With [upload_file_only] the
 * backend saves them and tells the model where they landed; without it, the
 * files are exposed over HTTP and handed to the model for analysis, which
 * needs a publicly reachable host.
 */
export const MAX_CHAT_FILES = 5;

export function chatPrompt(
  session: string,
  prompt: string,
  userId: string,
  files?: File[],
  uploadOnly?: boolean,
) {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('type', 'default');
  formData.append('chat', 'true');
  formData.append('stream', 'true');
  formData.append('references', 'false');
  formData.append('session', session);
  formData.append('user_id', userId);
  if (uploadOnly) {
    formData.append('upload_file_only', 'true');
  }
  files?.slice(0, MAX_CHAT_FILES).forEach((file, index) => {
    formData.append('file' + (index === 0 ? '' : index), file);
  });
  return http.post<{ execution_id?: string }>('/magic/system/openai/chat', formData);
}

export function killExecution(executionId: string) {
  return http.post<MagicResponse>('/magic/system/misc/kill-execution', {
    execution_id: executionId,
  });
}

// Short-lived download link for a file an AI function produced during chat.
export function chatDownloadUrl(ticket: string, file: string) {
  return (
    backendInfo().url +
    '/magic/system/file-system/file-with-token?access_token=' +
    encodeURIComponent(ticket) +
    '&file=' +
    encodeURIComponent(file)
  );
}

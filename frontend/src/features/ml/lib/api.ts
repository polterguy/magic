/*
 * The calls this feature makes to the backend. The transport they go through — base URL, token,
 * errors — is core/api.
 */
import { http, type MagicResponse, type MlSnippet, type MlType, requestRaw } from '@core/api';

// A logged question and answer, a row of ml_requests.
export interface MlRequest {
  id: number;
  created: string;
  type: string;
  prompt: string;
  completion: string;
  finish_reason: string;
  cached?: number | null;
  session?: string | null;
  questionnaire?: number;
  user_id?: string | null;
  context?: number;
  referrer?: string | null;
}

export function mlTypeCreate(type: MlType) {
  return http.post<MagicResponse>('/magic/system/magic/ml_types', type);
}

export function mlTypeDelete(type: string) {
  return http.delete<MagicResponse>(
    '/magic/system/magic/ml_types?type=' + encodeURIComponent(type),
  );
}

/*
 * Questionnaires — the question set a model can open a conversation with,
 * and the questions belonging to one. A model points at a questionnaire
 * through its initial_questionnaire setting.
 */

export interface Questionnaire {
  name: string;
  type: string;
  action?: string | null;
}

export interface Question {
  question_id: number;
  question: string;
  questionnaire: string;
  type: string;
  context: number;
  name?: string | null;
}

export function listQuestionnaires() {
  return http.get<Questionnaire[]>(
    '/magic/system/magic/questionnaires?limit=-1&order=questionnaires.name',
  );
}

export function createQuestionnaire(item: Questionnaire) {
  return http.post<MagicResponse>('/magic/system/magic/questionnaires', item);
}

export function updateQuestionnaire(item: Questionnaire) {
  return http.put<MagicResponse>('/magic/system/magic/questionnaires', item);
}

export function deleteQuestionnaire(name: string) {
  return http.delete<MagicResponse>(
    '/magic/system/magic/questionnaires?name=' + encodeURIComponent(name),
  );
}

export function listQuestions(questionnaire: string) {
  return http.get<Question[]>(
    '/magic/system/magic/questions?limit=-1&order=questions.question_id' +
      '&questions.questionnaire.eq=' +
      encodeURIComponent(questionnaire),
  );
}

export function createQuestion(item: {
  question: string;
  questionnaire: string;
  type: string;
  name?: string | null;
  // 1 replays this answer as context in the user's later conversations.
  context: number;
}) {
  return http.post<MagicResponse>('/magic/system/magic/questions', item);
}

export function updateQuestion(item: {
  question_id: number;
  question: string;
  questionnaire: string;
  type: string;
  name?: string | null;
  context: number;
}) {
  return http.put<MagicResponse>('/magic/system/magic/questions', item);
}

export function deleteQuestion(id: number) {
  return http.delete<MagicResponse>('/magic/system/magic/questions?question_id=' + id);
}

/*
 * Search text matches against prompt, completion or uri — the endpoints nest
 * these three inside an [or], so they widen the search rather than narrowing
 * it, while the type stays ANDed. The uri match is a prefix, since URIs start
 * with their domain.
 */
function snippetSearchQuery(filter: string) {
  if (!filter) {
    return '';
  }
  const like = encodeURIComponent('%' + filter + '%');
  return (
    '&ml_training_snippets.prompt.like=' +
    like +
    '&ml_training_snippets.completion.like=' +
    like +
    '&ml_training_snippets.uri.like=' +
    encodeURIComponent(filter + '%')
  );
}

export function mlSnippets(
  type: string,
  filter: string,
  offset: number,
  limit: number,
  sort?: { column: string | null; direction: 'asc' | 'desc' },
  vectorSearch = false,
) {
  /*
   * Vector search asks the model which snippets are semantically closest to
   * the search text, and answers with a distance per snippet — it takes no
   * ordering or LIKE filters.
   */
  if (vectorSearch) {
    return http.get<MlSnippet[]>(
      '/magic/system/magic/ml_training_snippets-vss' +
        `?limit=${limit}&offset=${offset}` +
        '&type=' +
        encodeURIComponent(type) +
        '&filter=' +
        encodeURIComponent(filter),
    );
  }
  const order = sort?.column
    ? `&order=${encodeURIComponent(sort.column)}&direction=${sort.direction}`
    : '&order=created&direction=desc';
  const query =
    `?limit=${limit}&offset=${offset}` +
    order +
    '&ml_training_snippets.type.eq=' +
    encodeURIComponent(type) +
    snippetSearchQuery(filter);
  return http.get<MlSnippet[]>('/magic/system/magic/ml_training_snippets' + query);
}

export function mlSnippetsCount(type: string, filter: string, vectorSearch = false) {
  // Vector search always considers the whole type, so its count ignores the filter.
  const query =
    '?ml_training_snippets.type.eq=' +
    encodeURIComponent(type) +
    (vectorSearch ? '' : snippetSearchQuery(filter));
  return http.get<{ count: number }>('/magic/system/magic/ml_training_snippets-count' + query);
}

/*
 * How many snippets in the type still lack embeddings — the exact set the
 * vectoriser is about to work through, so it gives us the "of y" to count towards.
 */
export function mlUnvectorisedCount(type: string) {
  return http.get<{ count: number }>(
    '/magic/system/magic/ml_training_snippets-count' +
      '?not_embedded=true&ml_training_snippets.type.eq=' +
      encodeURIComponent(type),
  );
}

/*
 * Deletes every snippet matching the current filter, rather than one at a
 * time — the filter is passed exactly as the listing uses it.
 */
export function mlSnippetsDeleteAll(type: string, filter: string) {
  const query =
    '?ml_training_snippets.type.eq=' + encodeURIComponent(type) + snippetSearchQuery(filter);
  return http.delete<MagicResponse>('/magic/system/magic/ml_training_snippets_all' + query);
}

/*
 * Downloads every snippet matching the filter as CSV — the whole filtered
 * set, not just the page on screen.
 */
export function mlSnippetsExportRaw(type: string, filter: string) {
  const query =
    '?ml_training_snippets.type.eq=' + encodeURIComponent(type) + snippetSearchQuery(filter);
  return requestRaw('GET', '/magic/system/magic/ml_training_snippets_export' + query);
}

export function mlSnippetUpdate(snippet: Partial<MlSnippet> & { id: number }) {
  return http.put<MagicResponse>('/magic/system/magic/ml_training_snippets', snippet);
}

export function mlSnippetDelete(id: number) {
  return http.delete<MagicResponse>('/magic/system/magic/ml_training_snippets?id=' + id);
}

export function mlRequests(type: string, offset: number, limit: number) {
  return http.get<MlRequest[]>(
    `/magic/system/magic/ml_requests?limit=${limit}&offset=${offset}` +
      '&order=created&direction=desc&ml_requests.type.eq=' +
      encodeURIComponent(type),
  );
}

export function mlRequestsCount(type: string) {
  return http.get<{ count: number }>(
    '/magic/system/magic/ml_requests-count?ml_requests.type.eq=' + encodeURIComponent(type),
  );
}

/*
 * Re-embeds a single snippet. The embedding is computed from prompt and
 * completion together, so editing either one leaves the stored vector
 * describing text that no longer exists.
 */
export function vectoriseSnippet(id: number) {
  return http.post<MagicResponse>('/magic/system/openai/vectorise-snippet', { id });
}

export function vectoriseType(type: string, channel: string) {
  return http.post<MagicResponse>('/magic/system/openai/vectorise', {
    type,
    'feedback-channel': channel,
  });
}

/*
 * Resets every embedding in the type back to null. The vectoriser only picks
 * up snippets without embeddings, so this is what makes a re-vectorisation of
 * an already vectorised model actually do something.
 */
export function deleteVectors(type: string) {
  return http.delete<MagicResponse>(
    '/magic/system/openai/vectors?type=' + encodeURIComponent(type),
  );
}

/*
 * Scrapes every URL listed in a CSV file — the file must have a single
 * column containing nothing but URLs. Progress arrives on the feedback
 * channel over the socket, as it does for crawling.
 */
export function uploadUrlList(type: string, file: File, channel: string, vectorize: boolean) {
  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('type', type);
  formData.append('feedback-channel', channel);
  formData.append('vectorize', vectorize ? 'true' : 'false');
  return http.post<MagicResponse>('/magic/system/openai/upload-url-list', formData);
}

/*
 * Scrapes one single page into training snippets — "spicing" a model with
 * one more page rather than crawling a whole site.
 */
export function importPage(args: { url: string; type: string; images: boolean; channel: string }) {
  return http.post<MagicResponse>('/magic/system/openai/import-page', {
    url: args.url,
    type: args.type,
    // The endpoint requires a minimum snippet length; the backend minimum.
    threshold: 25,
    images: args.images,
    'feedback-channel': args.channel,
  });
}

// HTML widgets a model can render as part of an answer.
export function availableWidgets() {
  return http.get<{ name: string; description: string; file: string }[]>(
    '/magic/system/openai/available-widgets?private=false',
  );
}

/*
 * Crawls a website into training snippets — progress arrives on the
 * feedback channel over the socket.
 */
export function importUrl(args: {
  url: string;
  type: string;
  delay: number;
  max: number;
  insert_url: boolean;
  images: boolean;
  channel: string;
  // Tag associated with the generated snippets — the backend defaults it.
  meta?: string;
}) {
  return http.post<MagicResponse>('/magic/system/openai/import-url', {
    url: args.url,
    type: args.type,
    delay: args.delay,
    max: args.max,
    // The endpoint requires a minimum snippet length; the backend minimum.
    threshold: 25,
    insert_url: args.insert_url,
    images: args.images,
    'feedback-channel': args.channel,
    meta: args.meta || null,
  });
}

// Backend prompt that turns raw content into a searchable one-line summary.
const SUMMARISE_PROMPT =
  'Create a short keyword-based single descriptive sentence from the following ' +
  'information intended for doing VSS-based search on it later to retrieve it using RAG';

export interface UploadOptions {
  summarize?: boolean;
  forceAsText?: boolean;
  // Structured files: which fields in the file become prompt/completion.
  promptField?: string;
  completionField?: string;
  // PDF-only options.
  preservePages?: boolean;
  overwrite?: boolean;
  massage?: string;
}

/*
 * Uploads a text/structured/PDF file as training data. Structured formats
 * (csv/xml/yaml/json) parse into lists of objects, and promptField /
 * completionField name which fields substitute as prompt and completion.
 */
export function uploadTrainingFile(type: string, file: File, options: UploadOptions = {}) {
  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('type', type);
  formData.append('prompt', options.promptField || 'prompt');
  formData.append('completion', options.completionField || 'completion');
  if (options.forceAsText) {
    formData.append('forceAsText', 'true');
  }
  const isPdf = file.name.toLowerCase().endsWith('.pdf');
  if (isPdf) {
    if (options.massage) {
      formData.append('massage', options.massage);
    }
    if (options.preservePages) {
      formData.append('preservePages', 'true');
    }
    if (options.overwrite) {
      formData.append('overwrite', 'true');
    }
  }
  if (options.summarize) {
    formData.append('massagePrompt', SUMMARISE_PROMPT);
  }
  return http.post<{ count: number }>('/magic/system/openai/upload-training-data', formData);
}

/*
 * Uploads a CSV whose columns become prompt/completion pairs directly.
 */
export function uploadCsvFile(type: string, file: File) {
  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('type', type);
  return http.post<{ count: number }>('/magic/system/openai/upload-csv', formData);
}

/*
 * Uploads an image, vectorising it as training data.
 */
export function uploadImageFile(type: string, file: File) {
  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('type', type);
  return http.post<{ count: number }>('/magic/system/openai/upload-image', formData);
}

export function openaiThemes() {
  return http.get<string[]>('/magic/system/openai/themes');
}

/*
 * Kicks off dynamic system-message generation: the backend crawls `url`,
 * uses `instruction` to fill the `[[...]]` placeholders in `template`, and
 * streams the result back on the socket `channel`.
 */
export function createSystemMessage(
  instruction: string,
  template: string,
  url: string,
  channel: string,
) {
  return http.post<MagicResponse>('/magic/system/openai/create-system-message', {
    instruction,
    template,
    url,
    channel,
  });
}

export function openaiCompletionSlots() {
  return http.get<{ llms: string[] }>('/magic/system/openai/completion-slots');
}

export function availableWorkflows() {
  return http.get<{ name: string; description: string; file: string }[]>(
    '/magic/system/openai/available-workflows?private=false',
  );
}

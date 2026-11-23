// @vitest-environment jsdom
/*
 * This feature's calls to the backend: what each one sends — verb, URL and body — and what it
 * makes of the answer. fetch is replaced, so nothing here needs a backend.
 */
import { describe, expect, it } from 'vitest';

import {
  BASE,
  type EndpointRow,
  expectEndpointRow,
  FILE,
  form,
  installFetchMock,
  json,
  last,
  respondWith,
} from '../../../test/fetchMock';
import * as featureApi from '../lib/api';

/*
 * One row per function: its name, the arguments it is called with (a space in every string shows
 * that it is URL-encoded), and the verb, URL and JSON body it sends.
 */
const ENDPOINTS: EndpointRow[] = [
  ['mlTypeDelete', ['a b'], 'DELETE', '/magic/system/magic/ml_types?type=a%20b', undefined],
  [
    'listQuestionnaires',
    [],
    'GET',
    '/magic/system/magic/questionnaires?limit=-1&order=questionnaires.name',
    undefined,
  ],
  [
    'deleteQuestionnaire',
    ['a b'],
    'DELETE',
    '/magic/system/magic/questionnaires?name=a%20b',
    undefined,
  ],
  [
    'listQuestions',
    ['a b'],
    'GET',
    '/magic/system/magic/questions?limit=-1&order=questions.question_id&questions.questionnaire.eq=a%20b',
    undefined,
  ],
  ['deleteQuestion', [7], 'DELETE', '/magic/system/magic/questions?question_id=7', undefined],
  [
    'mlUnvectorisedCount',
    ['a b'],
    'GET',
    '/magic/system/magic/ml_training_snippets-count?not_embedded=true&ml_training_snippets.type.eq=a%20b',
    undefined,
  ],
  [
    'mlSnippetsDeleteAll',
    ['a b', 'a b'],
    'DELETE',
    '/magic/system/magic/ml_training_snippets_all?ml_training_snippets.type.eq=a%20b&ml_training_snippets.prompt.like=%25a%20b%25&ml_training_snippets.completion.like=%25a%20b%25&ml_training_snippets.uri.like=a%20b%25',
    undefined,
  ],
  [
    'mlSnippetsExportRaw',
    ['a b', 'a b'],
    'GET',
    '/magic/system/magic/ml_training_snippets_export?ml_training_snippets.type.eq=a%20b&ml_training_snippets.prompt.like=%25a%20b%25&ml_training_snippets.completion.like=%25a%20b%25&ml_training_snippets.uri.like=a%20b%25',
    undefined,
  ],
  ['mlSnippetDelete', [7], 'DELETE', '/magic/system/magic/ml_training_snippets?id=7', undefined],
  [
    'mlRequests',
    ['a b', 7, 7],
    'GET',
    '/magic/system/magic/ml_requests?limit=7&offset=7&order=created&direction=desc&ml_requests.type.eq=a%20b',
    undefined,
  ],
  [
    'mlRequestsCount',
    ['a b'],
    'GET',
    '/magic/system/magic/ml_requests-count?ml_requests.type.eq=a%20b',
    undefined,
  ],
  ['vectoriseSnippet', [7], 'POST', '/magic/system/openai/vectorise-snippet', { id: 7 }],
  [
    'vectoriseType',
    ['a b', 'a b'],
    'POST',
    '/magic/system/openai/vectorise',
    { type: 'a b', 'feedback-channel': 'a b' },
  ],
  ['deleteVectors', ['a b'], 'DELETE', '/magic/system/openai/vectors?type=a%20b', undefined],
  [
    'uploadUrlList',
    ['a b', FILE, 'a b', true],
    'POST',
    '/magic/system/openai/upload-url-list',
    'form',
  ],
  [
    'availableWidgets',
    [],
    'GET',
    '/magic/system/openai/available-widgets?private=false',
    undefined,
  ],
  ['uploadCsvFile', ['a b', FILE], 'POST', '/magic/system/openai/upload-csv', 'form'],
  ['uploadImageFile', ['a b', FILE], 'POST', '/magic/system/openai/upload-image', 'form'],
  ['openaiThemes', [], 'GET', '/magic/system/openai/themes', undefined],
  [
    'createSystemMessage',
    ['a b', 'a b', 'a b', 'a b'],
    'POST',
    '/magic/system/openai/create-system-message',
    { instruction: 'a b', template: 'a b', url: 'a b', channel: 'a b' },
  ],
  ['openaiCompletionSlots', [], 'GET', '/magic/system/openai/completion-slots', undefined],
  [
    'availableWorkflows',
    [],
    'GET',
    '/magic/system/openai/available-workflows?private=false',
    undefined,
  ],
  ['mlTypeCreate', [{ type: 't' }], 'POST', '/magic/system/magic/ml_types', { type: 't' }],
  [
    'createQuestionnaire',
    [{ name: 'q' }],
    'POST',
    '/magic/system/magic/questionnaires',
    { name: 'q' },
  ],
  [
    'updateQuestionnaire',
    [{ name: 'q' }],
    'PUT',
    '/magic/system/magic/questionnaires',
    { name: 'q' },
  ],
  [
    'createQuestion',
    [{ question: 'a', questionnaire: 'q', type: 't', context: 1 }],
    'POST',
    '/magic/system/magic/questions',
    { question: 'a', questionnaire: 'q', type: 't', context: 1 },
  ],
  [
    'updateQuestion',
    [{ question_id: 3, question: 'a', questionnaire: 'q', type: 't', context: 0 }],
    'PUT',
    '/magic/system/magic/questions',
    { question_id: 3, question: 'a', questionnaire: 'q', type: 't', context: 0 },
  ],
  [
    'mlSnippetUpdate',
    [{ id: 4, prompt: 'p' }],
    'PUT',
    '/magic/system/magic/ml_training_snippets',
    { id: 4, prompt: 'p' },
  ],
];

describe('endpoint functions', () => {
  installFetchMock(null, () => json({}));

  it.each(ENDPOINTS)('%s sends the expected request', async (...row) => {
    await expectEndpointRow(featureApi, row);
  });
});

describe('backendInfo and machine learning', () => {
  installFetchMock('tok', () => json({ result: 'success' }));

  it('mlSnippets filters, orders newest first by default', async () => {
    await featureApi.mlSnippets('t y', 'abc', 0, 10);
    const url = last().url;
    expect(url).toContain('/magic/system/magic/ml_training_snippets?limit=10&offset=0');
    expect(url).toContain('&order=created&direction=desc');
    expect(url).toContain('&ml_training_snippets.type.eq=t%20y');
    expect(url).toContain('&ml_training_snippets.prompt.like=%25abc%25');
    expect(url).toContain('&ml_training_snippets.uri.like=abc%25');
  });

  it('mlSnippets honours a column sort and leaves out the like filters without a filter', async () => {
    await featureApi.mlSnippets('t', '', 5, 10, { column: 'uri', direction: 'asc' });
    expect(last().url).toContain('&order=uri&direction=asc');
    expect(last().url).not.toContain('.like=');
  });

  it('mlSnippets with vector search uses the vss endpoint without ordering', async () => {
    await featureApi.mlSnippets('t', 'a b', 0, 10, undefined, true);
    expect(last().url).toBe(
      BASE + '/magic/system/magic/ml_training_snippets-vss?limit=10&offset=0&type=t&filter=a%20b',
    );
  });

  it('mlSnippetsCount applies the filter, except for vector search', async () => {
    respondWith(() => json({ count: 3 }));
    await expect(featureApi.mlSnippetsCount('t', 'abc')).resolves.toEqual({ count: 3 });
    expect(last().url).toContain('.like=%25abc%25');
    await featureApi.mlSnippetsCount('t', 'abc', true);
    expect(last().url).toBe(
      BASE + '/magic/system/magic/ml_training_snippets-count?ml_training_snippets.type.eq=t',
    );
  });
});

describe('chat, import and upload', () => {
  installFetchMock('tok', () => json({ result: 'success' }));

  it('importPage uses the minimum threshold and the feedback channel', async () => {
    await featureApi.importPage({ url: 'https://p', type: 't', images: true, channel: 'ch' });
    expect(last().url).toBe(BASE + '/magic/system/openai/import-page');
    expect(last().body).toEqual({
      url: 'https://p',
      type: 't',
      threshold: 25,
      images: true,
      'feedback-channel': 'ch',
    });
  });

  it('importUrl sends meta as null when not given', async () => {
    await featureApi.importUrl({
      url: 'https://p',
      type: 't',
      delay: 1,
      max: 2,
      insert_url: true,
      images: false,
      channel: 'ch',
    });
    expect(last().body).toMatchObject({ threshold: 25, meta: null, max: 2, insert_url: true });
    await featureApi.importUrl({
      url: 'https://p',
      type: 't',
      delay: 1,
      max: 2,
      insert_url: true,
      images: false,
      channel: 'ch',
      meta: 'tag',
    });
    expect(last().body).toMatchObject({ meta: 'tag' });
  });

  it('uploadTrainingFile sends plain options for a non-PDF file', async () => {
    await featureApi.uploadTrainingFile('t', new File(['x'], 'a.csv'), {
      promptField: 'q',
      forceAsText: true,
      summarize: true,
      preservePages: true,
    });
    const form = last().body as FormData;
    expect(form.get('type')).toBe('t');
    expect(form.get('prompt')).toBe('q');
    expect(form.get('completion')).toBe('completion');
    expect(form.get('forceAsText')).toBe('true');
    expect(form.get('massagePrompt')).toEqual(expect.stringContaining('keyword-based'));
    // PDF-only options are ignored for other file types.
    expect(form.has('preservePages')).toBe(false);
  });

  it('uploadTrainingFile sends the PDF-only options for a PDF', async () => {
    await featureApi.uploadTrainingFile('t', new File(['x'], 'A.PDF'), {
      massage: 'tidy',
      preservePages: true,
      overwrite: true,
    });
    const form = last().body as FormData;
    expect(form.get('massage')).toBe('tidy');
    expect(form.get('preservePages')).toBe('true');
    expect(form.get('overwrite')).toBe('true');
    expect(form.has('massagePrompt')).toBe(false);
  });
});

describe('uploads', () => {
  installFetchMock('tok', () => json({ result: 'ok' }));

  const file = new File(['a,b'], 'data.csv');

  it('uploadUrlList says whether to vectorize', async () => {
    await featureApi.uploadUrlList('t', file, 'ch', false);
    expect(form().get('vectorize')).toBe('false');
    await featureApi.uploadUrlList('t', file, 'ch', true);
    expect(form().get('vectorize')).toBe('true');
  });

  it('uploadTrainingFile falls back to the default prompt and completion fields', async () => {
    await featureApi.uploadTrainingFile('t', file);
    expect(form().get('prompt')).toBe('prompt');
    expect(form().get('completion')).toBe('completion');
    expect(form().has('forceAsText')).toBe(false);
    expect(form().has('massagePrompt')).toBe(false);
  });

  it('uploadTrainingFile passes named fields, text mode and summarising', async () => {
    await featureApi.uploadTrainingFile('t', file, {
      promptField: 'q',
      completionField: 'a',
      forceAsText: true,
      summarize: true,
    });
    expect(form().get('prompt')).toBe('q');
    expect(form().get('completion')).toBe('a');
    expect(form().get('forceAsText')).toBe('true');
    expect(form().get('massagePrompt')).toBeTruthy();
  });

  it('uploadTrainingFile sends the PDF options only for a PDF', async () => {
    const options = { massage: 'tidy', preservePages: true, overwrite: true };
    await featureApi.uploadTrainingFile('t', file, options);
    expect(form().has('massage')).toBe(false);
    expect(form().has('preservePages')).toBe(false);
    expect(form().has('overwrite')).toBe(false);
    await featureApi.uploadTrainingFile('t', new File(['x'], 'Doc.PDF'), options);
    expect(form().get('massage')).toBe('tidy');
    expect(form().get('preservePages')).toBe('true');
    expect(form().get('overwrite')).toBe('true');
    await featureApi.uploadTrainingFile('t', new File(['x'], 'doc.pdf'));
    expect(form().has('massage')).toBe(false);
    expect(form().has('preservePages')).toBe(false);
    expect(form().has('overwrite')).toBe(false);
  });
});

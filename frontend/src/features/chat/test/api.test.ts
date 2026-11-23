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
  installFetchMock,
  json,
  last,
} from '../../../test/fetchMock';
import * as featureApi from '../lib/api';

/*
 * One row per function: its name, the arguments it is called with (a space in every string shows
 * that it is URL-encoded), and the verb, URL and JSON body it sends.
 */
const ENDPOINTS: EndpointRow[] = [
  ['killExecution', ['a b'], 'POST', '/magic/system/misc/kill-execution', { execution_id: 'a b' }],
];

describe('endpoint functions', () => {
  installFetchMock(null, () => json({}));

  it.each(ENDPOINTS)('%s sends the expected request', async (...row) => {
    await expectEndpointRow(featureApi, row);
  });
});

describe('chat, import and upload', () => {
  installFetchMock('tok', () => json({ result: 'success' }));

  it('chatPrompt builds the form with files capped and optional upload-only flag', async () => {
    const files = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
      i => new File(['x'], 'f' + i + '.txt'),
    );
    await featureApi.chatPrompt('sess', 'hello', 'user1', files, true);
    const form = last().body as FormData;
    expect(last().url).toBe(BASE + '/magic/system/openai/chat');
    expect(form.get('prompt')).toBe('hello');
    expect(form.get('session')).toBe('sess');
    expect(form.get('user_id')).toBe('user1');
    expect(form.get('stream')).toBe('true');
    expect(form.get('upload_file_only')).toBe('true');
    expect((form.get('file') as File).name).toBe('f1.txt');
    expect((form.get('file1') as File).name).toBe('f2.txt');
    const fileKeys = [...form.keys()].filter(key => key.startsWith('file'));
    expect(fileKeys.length).toBeLessThan(files.length);
  });

  it('chatPrompt without files or upload-only sends neither', async () => {
    await featureApi.chatPrompt('s', 'p', 'u');
    const form = last().body as FormData;
    expect(form.has('upload_file_only')).toBe(false);
    expect(form.has('file')).toBe(false);
  });

  it('chatDownloadUrl encodes the ticket and file against the backend url', () => {
    expect(featureApi.chatDownloadUrl('a b', '/x y.txt')).toBe(
      BASE + '/magic/system/file-system/file-with-token?access_token=a%20b&file=%2Fx%20y.txt',
    );
  });
});

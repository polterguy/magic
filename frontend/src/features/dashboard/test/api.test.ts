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
  ['countEndpoints', [], 'GET', '/magic/system/endpoints/count', undefined],
  ['countPublicEndpoints', [], 'GET', '/magic/system/endpoints/count-public', undefined],
];

describe('endpoint functions', () => {
  installFetchMock(null, () => json({}));

  it.each(ENDPOINTS)('%s sends the expected request', async (...row) => {
    await expectEndpointRow(featureApi, row);
  });
});

describe('chat, import and upload', () => {
  installFetchMock('tok', () => json({ result: 'success' }));

  it('createBot posts the bot definition with vectorize on and autocrawl off', async () => {
    await featureApi.createBot({
      url: 'https://s',
      model: 'm',
      flavor: 'f',
      instruction: 'i',
      max: 5,
      autoDestruct: true,
      channel: 'ch',
    });
    expect(last().url).toBe(BASE + '/magic/system/openai/create-bot');
    expect(last().body).toMatchObject({
      auto_destruct: true,
      vectorize: true,
      autocrawl: false,
      'feedback-channel': 'ch',
    });
  });
});

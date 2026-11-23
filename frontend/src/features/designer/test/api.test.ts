// @vitest-environment jsdom
/*
 * This feature's calls to the backend: what each one sends — verb, URL and body — and what it
 * makes of the answer. fetch is replaced, so nothing here needs a backend.
 */
import { describe, it } from 'vitest';

import {
  type EndpointRow,
  expectEndpointRow,
  installFetchMock,
  json,
} from '../../../test/fetchMock';
import * as featureApi from '../lib/api';

/*
 * One row per function: its name, the arguments it is called with (a space in every string shows
 * that it is URL-encoded), and the verb, URL and JSON body it sends.
 */
const ENDPOINTS: EndpointRow[] = [
  ['loadWebsiteConfig', [], 'GET', '/magic/system/www/config', undefined],
  ['ensureWidgetAssets', [], 'POST', '/magic/system/www/ensure-widget-assets', {}],
  ['saveWebsiteConfig', [{ a: 1 }], 'PUT', '/magic/system/www/config', { a: 1 }],
];

describe('endpoint functions', () => {
  installFetchMock(null, () => json({}));

  it.each(ENDPOINTS)('%s sends the expected request', async (...row) => {
    await expectEndpointRow(featureApi, row);
  });
});

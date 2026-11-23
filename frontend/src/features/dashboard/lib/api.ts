/*
 * The calls this feature makes to the backend. The transport they go through — base URL, token,
 * errors — is core/api.
 */
import { http, type MagicResponse } from '@core/api';

/*
 * Just how many endpoints there are. The full list is around 100KB, which is
 * a great deal of traffic for somewhere that only shows the number.
 */
export function countEndpoints() {
  return http.get<{ count: number }>('/magic/system/endpoints/count');
}

// How many of those endpoints require no authentication at all, system endpoints excluded.
export function countPublicEndpoints() {
  return http.get<{ count: number }>('/magic/system/endpoints/count-public');
}

/*
 * Crawls a website and builds a chatbot from it — the "chatbot wizard" as one
 * call. Long running: progress is published on [channel] over the socket, and
 * the answer only arrives once the crawl is done.
 *
 * [flavor] is the persona's template, stored as the model's system message.
 * [instruction] is what makes the backend hand that template to OpenAI to be
 * filled in from the crawled site — without it the placeholders stay literal.
 */
export function createBot(args: {
  url: string;
  model: string;
  flavor: string;
  instruction: string;
  max: number;
  autoDestruct: boolean;
  channel: string;
}) {
  return http.post<MagicResponse>('/magic/system/openai/create-bot', {
    url: args.url,
    model: args.model,
    flavor: args.flavor,
    instruction: args.instruction,
    max: args.max,
    auto_destruct: args.autoDestruct,
    vectorize: true,
    autocrawl: false,
    'feedback-channel': args.channel,
  });
}

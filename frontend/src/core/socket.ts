/*
 * SignalR connection towards the active backend's /sockets hub — the one
 * transport configuration every socket consumer in the app shares.
 */

import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

import { backendInfo } from './api';

/*
 * A [channel] joins the socket to that channel when it connects, which is the
 * only way to receive what the backend signals on it without a role, user,
 * group or client filter.
 */
export function createSocket(options?: { reconnect?: boolean; channel?: string }): HubConnection {
  const backend = backendInfo();
  const query = options?.channel ? '?channel=' + encodeURIComponent(options.channel) : '';
  const builder = new HubConnectionBuilder().withUrl(backend.url + '/sockets' + query, {
    accessTokenFactory: () => backend.token ?? '',
    skipNegotiation: true,
    transport: HttpTransportType.WebSockets,
  });
  if (options?.reconnect) {
    builder.withAutomaticReconnect();
  }
  return builder.build();
}

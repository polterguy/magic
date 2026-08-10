/*
 * SignalR connection towards the active backend's /sockets hub — the one
 * transport configuration every socket consumer in the app shares.
 */

import { HttpTransportType, HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { backendInfo } from './api';

export function createSocket(options?: { reconnect?: boolean }): HubConnection {
  const backend = backendInfo();
  const builder = new HubConnectionBuilder()
    .withUrl(backend.url + '/sockets', {
      accessTokenFactory: () => backend.token ?? '',
      skipNegotiation: true,
      transport: HttpTransportType.WebSockets,
    });
  if (options?.reconnect) {
    builder.withAutomaticReconnect();
  }
  return builder.build();
}

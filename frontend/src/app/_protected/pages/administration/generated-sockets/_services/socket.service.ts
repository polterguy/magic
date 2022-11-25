
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { Count } from '../../../../../models/count.model';
import { Message } from '../../../../../models/message.model';
import { Response } from '../../../../../models/response.model';
import { HttpService } from '../../../../../services--/http.service';
import { SocketUser } from '../../generated-endpoints/_models/socket-user.model';

/**
 * Socket service, allowing you to retrieve data about sockets and publish socket messages.
 */
@Injectable({
  providedIn: 'root'
})
export class SocketService {

  /**
   * Creates an instance of your service.
   *
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

  /**
   * Returns a list of all users currently connected to a socket.
   *
   * @param filter Filter to apply for which connections to return to caller
   * @param offset Offset from where to start returning connections
   * @param limit Maximum number of items to return.
   */
  socketUsers(filter: string, offset: number, limit: number) {
    var query = '?offset=' + offset + '&limit=' + limit;
    if (filter) {
      query += '&filter=' + encodeURIComponent(filter);
    }
    return this.httpService.get<SocketUser[]>('/magic/system/sockets/list-users' + query);
  }

  /**
   * Returns the count of all users currently connected to a socket.
   *
   * @param filter Filter to apply for which connections to return to caller
   */
  socketUserCount(filter: string) {
    var query = '';
    if (filter) {
      query += '?filter=' + encodeURIComponent(filter);
    }
    return this.httpService.get<Count>('/magic/system/sockets/count-users' + query);
  }

  /**
   * Returns a list of published messages.
   */
   socketMessages() {
    return this.httpService.get<any>('/magic/system/sockets/published-messages');
  }

  /**
   * Transmits the specified message to the specified client.
   *
   * @param msg What message to send
   * @param client What client (connection) to transmit the message to
   * @param roles What roles to publish message to
   * @param groups What groups to publish message to
   */
  publishMessage(msg: Message, client: string, roles: string, groups: string) {
    client = client === null || client === '' ? null : client;
    roles = roles === null || roles === '' ? null : roles;
    groups = groups === null || groups === '' ? null : groups;
    if ([client, roles, groups].filter(x => x !== null).length > 1) {
      return throwError(() => new Error('You have to choose maximum one of client, roles or groups'));
    }

    // Invoking backend returning observable to caller.
    return this.httpService.post<Response>('/magic/system/sockets/publish', {
      client,
      roles,
      groups,
      name: msg.name,
      message: JSON.parse(msg.content),
    });
  }
}

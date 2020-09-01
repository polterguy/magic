import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

/*
 * Your main HTTP service for invoking CRUD methods in your backend's API.
 *
 * Notice, also contains some "helper methods" such as authenticate, refresh JWT token, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private httpClient: HttpClient) { }

  // Authenticates you towards your backend API.
  authenticate(username: string, password: string) {
    return this.httpClient.get<any>(
      environment.apiUrl +
      'magic/modules/system/auth/authenticate?username=' +
      encodeURI(username) +
      '&password=' +
      encodeURI(password));
  }

  // Will refresh an existing JWT token, if possible.
  refreshTicket() {
    return this.httpClient.get<any>(environment.apiUrl + 'magic/modules/system/auth/refresh-ticket');
  }

  // Will refresh an existing JWT token, if possible.
  changeMyPassword(password: string) {
    return this.httpClient.put<any>(environment.apiUrl + 'magic/modules/system/auth/change-password', {
      password,
    });
  }

  // Logs an info item in the backend server.
  logInfo(content: string) {
    this.httpClient.post<any>(environment.apiUrl + 'magic/modules/system/logging/log', {
      type: 'info',
      content
    }).subscribe(res => {
      console.log('Info item successfully logged');
    }, error => {
      console.error(error.error.message);
    });
  }

  // Logs an info item in the backend server.
  logDebug(content: string) {
    this.httpClient.post<any>(environment.apiUrl + 'magic/modules/system/logging/log', {
      type: 'debug',
      content
    }).subscribe(res => {
      console.log('Debug item successfully logged');
    }, error => {
      console.error(error.error.message);
    });
  }

  // Logs an error item in the backend server.
  logError(content: string) {
    this.httpClient.post<any>(environment.apiUrl + 'magic/modules/system/logging/log', {
      type: 'error',
      content
    }).subscribe(res => {
      console.log('Error item successfully logged');
    }, error => {
      console.error(error.error.message);
    });
  }

  // Logs an info item in the backend server.
  logFatal(content: string) {
    this.httpClient.post<any>(environment.apiUrl + 'magic/modules/system/logging/log', {
      type: 'fatal',
      content
    }).subscribe(res => {
      console.log('Fatal item successfully logged');
    }, error => {
      console.error(error.error.message);
    });
  }
  
  // Creates QUERY arguments from the specified "args" argument given.
  getQueryArgs(args: any) {
    let result = '';
    for(const idx in args) {
      if (Object.prototype.hasOwnProperty.call(args, idx)) {
        const idxFilter = args[idx];
        if (idxFilter !== null && idxFilter !== undefined && idxFilter !== '') {
          if (result === '') {
            result += '?';
          } else {
            result += '&';
          }
          if (idx.endsWith('.like')) {
            result += idx + '=' + encodeURIComponent(idxFilter + '%');
          } else {
            result += idx + '=' + encodeURIComponent(idxFilter);
          }
        }
      }
    }
    return result;
  }

  // HTTP REST methods your backend exposes, and that was used to scaffold Angular frontend app.
[[http-client-service-method-implementations]]
}

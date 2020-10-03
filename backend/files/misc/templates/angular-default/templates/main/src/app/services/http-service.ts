import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ICrdEntity, ICrudEntity } from './interfaces/crud-interfaces'
import { ILog } from './interfaces/log-interface'

/**
 * Your main HTTP service for invoking CRUD methods in your backend.
 * 
 * This class encapsulates the generated HTTP endpoints for your app.
 */
@Injectable({
  providedIn: 'root'
})
export class HttpService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpClient What HTTP client to use for invocations towards your backend
   */
  constructor(private httpClient: HttpClient) { }

  /**
   * Returns the log instance, allowing you to create server-side
   * log entries.
   */
  get log() : ILog {

    return {

      /**
       * Logs a debug entry.
       * 
       * @param content What to log
       */
      debug: (content: string) => {
        this.httpClient.post<any>(environment.apiUrl + 'magic/modules/system/logging/log', {
          type: 'debug',
          content
        }).subscribe((res: any) => {
          console.log('Info item successfully logged');
        }, (error: any) => {
          console.error(error.error.message);
        });
      },

      /**
       * Logs an info entry.
       * 
       * @param content What to log
       */
      info: (content: string) => {
        this.httpClient.post<any>(environment.apiUrl + 'magic/modules/system/logging/log', {
          type: 'info',
          content
        }).subscribe((res: any) => {
          console.log('Info item successfully logged');
        }, (error: any) => {
          console.error(error.error.message);
        });
      },

      /**
       * Logs an error entry.
       * 
       * @param content What to log
       */
      error: (content: string) => {
        this.httpClient.post<any>(environment.apiUrl + 'magic/modules/system/logging/log', {
          type: 'error',
          content
        }).subscribe((res: any) => {
          console.log('Info item successfully logged');
        }, (error: any) => {
          console.error(error.error.message);
        });
      },

      /**
       * Logs a fatal entry.
       * 
       * @param content What to log
       */
      fatal: (content: string) => {
        this.httpClient.post<any>(environment.apiUrl + 'magic/modules/system/logging/log', {
          type: 'fatal',
          content
        }).subscribe((res: any) => {
          console.log('Info item successfully logged');
        }, (error: any) => {
          console.error(error.error.message);
        });
      }
    }
  }

  // HTTP REST methods your backend exposes, and that was used to scaffold Angular frontend app.
[[http-client-service-method-implementations]]

  /*
   * Creates QUERY parameters from the specified "args" argument given.
   *
   * Used by CRUD service methods to create the correct QUERY parameters
   * during invocations towards your backend.
   */
  private getQueryArgs(args: any) {
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
}

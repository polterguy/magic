import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ICrudEntity, ICrdEntity, ICrEntity, IREntity, IRudEntity, IRuEntity, ICruEntity, IRdEntity } from './interfaces/crud-interfaces'
import { ILog } from './interfaces/log-interface'
import { StatusResponse } from './models/status-response';
import { CreateResponse } from './models/create-response';
import { CountResponse } from './models/count-response';
import { UpdateResponse } from './models/update-response';
import { DeleteResponse } from './models/delete-response';

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

      debug: (content: string) => {
        this.httpClient.post<StatusResponse>(
          environment.apiUrl +
          'magic/modules/system/logging/log', {
            type: 'debug',
            content
        }).subscribe((res: StatusResponse) => {
          console.log('Info item successfully logged');
        }, (error: any) => {
          console.error(error.error.message);
        });
      },

      info: (content: string) => {
        this.httpClient.post<StatusResponse>(
          environment.apiUrl +
          'magic/modules/system/logging/log', {
            type: 'info',
            content
        }).subscribe((res: StatusResponse) => {
          console.log('Info item successfully logged');
        }, (error: any) => {
          console.error(error.error.message);
        });
      },

      error: (content: string) => {
        this.httpClient.post<StatusResponse>(
          environment.apiUrl +
          'magic/modules/system/logging/log', {
            type: 'error',
            content
        }).subscribe((res: StatusResponse) => {
          console.log('Info item successfully logged');
        }, (error: any) => {
          console.error(error.error.message);
        });
      },

      fatal: (content: string) => {
        this.httpClient.post<StatusResponse>(
          environment.apiUrl +
          'magic/modules/system/logging/log', {
            type: 'fatal',
            content
        }).subscribe((res: StatusResponse) => {
          console.log('Info item successfully logged');
        }, (error: any) => {
          console.error(error.error.message);
        });
      }
    }
  }

  /*
   * HTTP REST methods your backend exposes.
   * 
   * These parts is exposed such that each table returns an ICrudEntity
   * or an ICrdEntity, depending upon whether or not the endpoint group
   * contains an update method or not.
   */
[[http-client-service-method-implementations]]

  /**
   * Uploads an image to your backend.
   * 
   * NOTICE! This method doesn't work out of the box, and require you
   * to set its module name correctly, in addition to making sure you've
   * got a backend endpoint capable of handling its payload.
   *
   * @param content Base64 encoded image data
   * @param type Type of image, such as 'jpeg', 'png', etc
   */
   public uploadImage(content: string, type: string) {

    // Invoking backend with a form data object containing file.
    // TODO: If you want to handle images, you'll need a backend endpoint, and change the URL below.
    return this.httpClient.put<any>('magic/modules/MODULE_NAME_HERE/upload-image', {
      content,
      type,
    });
  }

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

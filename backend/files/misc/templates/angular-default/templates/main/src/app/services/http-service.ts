import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

 /**
  * Entity method group containing Create, Read and Delete, but not Update.
  * 
  * This interface is implemented on method groups not containing update,
  * which might happen, if a table have no updateable columns, such as
  * link tables, with only primary keys, etc.
  */
 export interface ICrdEntity {

  /**
   * Creates a new entity.
   *
   * @param args Initial values for your entity
   */
  create(args: any) : Observable<any>;

  /**
   * Reads entities from your backend.
   *
   * @param filter Filter condition for items to retrieve
   */
  read(filter: any) : Observable<any>;

  /**
   * Counts entities from your backend.
   *
   * @param filter Filter condition for items to count
   */
  count(filter: any) : Observable<any>;

  /**
   * Deletes one entity from your backend.
   *
   * @param args Filter condition for item to delete, primary key(s) for entity
   */
  delete(args: any) : Observable<any>;
}

/**
 * Entity method group containing all 4 CRUD operations.
 */
export interface ICrudEntity extends ICrdEntity {

  /**
   * Updates one entity in your backend.
   *
   * @param args What item to update, and what values to update it with
   */
  update(args: any) : Observable<any>;
}

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
   * Creates a log entry of type info in your backend's log.
   * 
   * @param content String to store into log
   */
  public logInfo(content: string) {
    this.httpClient.post<any>(environment.apiUrl + 'magic/modules/system/logging/log', {
      type: 'info',
      content
    }).subscribe((res: any) => {
      console.log('Info item successfully logged');
    }, (error: any) => {
      console.error(error.error.message);
    });
  }

  /**
   * Creates a log entry of type debug in your backend's log.
   * 
   * @param content String to store into log
   */
  public logDebug(content: string) {
    this.httpClient.post<any>(environment.apiUrl + 'magic/modules/system/logging/log', {
      type: 'debug',
      content
    }).subscribe((res: any) => {
      console.log('Debug item successfully logged');
    }, (error: any) => {
      console.error(error.error.message);
    });
  }

  /**
   * Creates a log entry of type error in your backend's log.
   * 
   * @param content String to store into log
   */
  public logError(content: string) {
    this.httpClient.post<any>(environment.apiUrl + 'magic/modules/system/logging/log', {
      type: 'error',
      content
    }).subscribe((res: any) => {
      console.log('Error item successfully logged');
    }, (error: any) => {
      console.error(error.error.message);
    });
  }

  /**
   * Creates a log entry of type fatal in your backend's log.
   * 
   * @param content String to store into log
   */
  public logFatal(content: string) {
    this.httpClient.post<any>(environment.apiUrl + 'magic/modules/system/logging/log', {
      type: 'fatal',
      content
    }).subscribe((res: any) => {
      console.log('Fatal item successfully logged');
    }, (error: any) => {
      console.error(error.error.message);
    });
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

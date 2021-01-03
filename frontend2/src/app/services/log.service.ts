
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from './http.service';
import { Count } from '../models/count.model';
import { LogItem } from 'src/app/models/log-item.model';

/**
 * Log service, allows you to Read, Create, Update and Delete log items
 * from your backend.
 */
@Injectable({
  providedIn: 'root'
})
export class LogService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

  /**
   * Returns a list of log items from your backend.
   * 
   * @param filter Query filter deciding which items to return
   * @param offset Number of items to skip
   * @param limit Maximum number of items to return
   */
  public list(
    filter: string,
    offset: number,
    limit: number) {

    // Dynamically building our query according to arguments specificed.
    let query = '';
    if (filter) {
      query += '&query=' + encodeURIComponent(filter);
    }

    // Invoking backend and returning observable to caller.
    return this.httpService.get<LogItem[]>(
      '/magic/modules/system/log/log-items?offset=' +
      offset +
      '&limit=' +
      limit + 
      query);
  }

  /**
   * Retrieves one specific item, and returns to caller.
   * 
   * @param id ID of item to retrieve
   */
  public get(id: number) {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<LogItem>(
      '/magic/modules/system/log/log-item?id=' + id);
  }

  /**
   * Counts the number of log items in your backend.
   * 
   * @param filter Query filter for items to include in count
   */
  public count(filter?: string) {

    // Dynamically building our query according to arguments specificed.
    let query = '';
    if (filter) {
      query += '?query=' + encodeURIComponent(filter);
    }

    // Invoking backend and returning observable to caller.
    return this.httpService.get<Count>(
      '/magic/modules/system/log/count-items' +
      query);
  }

  /**
   * Returns statistics from your backend about the number of
   * log items that exists grouped by type of item.
   * 
   * @param filter Query filter for items to include in statistics
   */
  public statisticsType(filter?: string) {

    // Dynamically building our query according to arguments specificed.
    let query = '';
    if (filter && filter.length > 0) {
      query = '?filter=' + encodeURIComponent(filter);
    }

    // Invoking backend and returning observable to caller.
    return this.httpService.get<any[]>(
      '/magic/modules/system/log/log-statistics' + query);
  }

  /**
   * Returns statistics from your backend about the number of
   * log items that exists grouped by day. Only returns statistics
   * about the 2 last weeks.
   * 
   * @param filter Query filter for items to include in statistics
   */
  public statisticsDays(filter?: string) {

    // Dynamically building our query according to arguments specificed.
    let query = '';
    if (filter && filter.length > 0) {
      query = '?filter=' + encodeURIComponent(filter);
    }

    // Invoking backend and returning observable to caller.
    return this.httpService.get<any[]>(
      '/magic/modules/system/log/log-statistics-days' + query);
  }

  /**
   * Generates a new log entry about lines of code that was generated.
   * 
   * @param loc Number of lines of code that was created
   * @param type Type of component that was created
   * @param name Name of component that was created
   */
  public createLocItem(loc: number, type: string, name: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<any>(
      '/magic/modules/system/log/log-loc', {
        loc,
        type,
        name,
      });
  }

  /**
   * Returns statistics about lines of code that has been generated
   * during system's existence.
   */
  public getLoc() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<any>(
      '/magic/modules/system/log/loc-generated');
  }

  /**
   * Creates a server-side log entry given the specified parameters.
   * 
   * @param type Type of log entry, should be either 'info', 'debug', 'error' or 'fatal'.
   * @param content Actual content of log item
   */
  public createLogEntry(type: string, content: string) {

    // Invoking backend to persist log entry, returning observable to caller.
    return this.httpService.post<Response>('/magic/modules/system/log/log', {
      type,
      content,
    });
  }
}

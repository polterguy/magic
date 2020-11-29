
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Application specific imports.
import { AuthService } from './auth.service';
import { LogItem } from 'src/app/models/log-item';

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
   * @param httpClient HTTP client to use for backend invocations
   * @param authService Authentiction and authorisation service
   */
  constructor(
    private httpClient: HttpClient,
    private authService: AuthService) { }

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
    let query = '';
    if (filter) {
      query += '&query=' + encodeURIComponent(filter);
    }
    return this.httpClient.get<LogItem[]>(
      this.authService.current.url +
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
    return this.httpClient.get<LogItem>(
      this.authService.current.url +
      '/magic/modules/system/log/log-item?id=' + id);
  }

  /**
   * Counts the number of log items in your backend.
   * 
   * @param filter Query filter for items to include in count
   */
  public count(filter?: string) {
    let query = '';
    if (filter) {
      query += '?query=' + encodeURIComponent(filter);
    }
    return this.httpClient.get<any>(
      this.authService.current.url +
      '/magic/modules/system/log/count-items' +
      query);
  }

  /**
   * Returns statistics from your backend about the number of
   * log items that exists grouped by type of item.
   * 
   * @param filter Query filter for items to include in statistics
   */
  public statisticsType(filter: string) {
    let query = '';
    if (filter && filter.length > 0) {
      query = '?filter=' + encodeURIComponent(filter);
    }
    return this.httpClient.get<any[]>(
      this.authService.current.url +
      '/magic/modules/system/log/log-statistics' + query);
  }

  /**
   * Returns statistics from your backend about the number of
   * log items that exists grouped by day. Only returns statistics
   * about the 2 last weeks.
   * 
   * @param filter Query filter for items to include in statistics
   */
  public statisticsDays(filter: string) {
    let query = '';
    if (filter && filter.length > 0) {
      query = '?filter=' + encodeURIComponent(filter);
    }
    return this.httpClient.get<any[]>(
      this.authService.current.url +
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
    return this.httpClient.post<any>(
      this.authService.current.url +
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
    return this.httpClient.get<any>(
      this.authService.current.url +
      '/magic/modules/system/log/loc-generated');
  }
}

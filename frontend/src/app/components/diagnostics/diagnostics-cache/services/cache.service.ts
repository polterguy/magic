
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { Count } from '../../../../models/count.model';
import { CacheItem } from '../models/cache-item.model';
import { Response } from '../../../../models/response.model';
import { HttpService } from '../../../../services/http.service';

/**
 * Cache service allowing the user to modify his or her cache, viewing items, removing
 * items, and purging cache altogether.
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

  /**
   * Returns all cache items from backend matching optional filter.
   * 
   * @param filter Optional query filter deciding which items to return
   */
  public list(filter: any = null) {

    // Dynamically building our query parameters.
    let query = '';
    if (filter !== null) {

      // Applying limit and offset
      query += '?limit=' + filter.limit;
      query += "&offset=" + filter.offset;

      // Applying filter parts, if given.
      if (filter.filter && filter.filter !== '') {
        query += '&filter=' + encodeURIComponent(filter.filter);
      }
    }

    // Invoking backend and returning observable to caller.
    return this.httpService.get<CacheItem[]>(
      '/magic/modules/system/config/list-cache' +
      query);
  }

  /**
   * Returns count of all cache items from backend matching optional filter.
   * 
   * @param filter Optional query filter deciding which items to include when counting
   */
  public count(filter: string = null) {

    // Dynamically building our query parameters.
    let query = '';
    if (filter !== null && filter !== '') {
      query += '?filter=' + encodeURIComponent(filter);
    }

    // Invoking backend and returning observable to caller.
    return this.httpService.get<Count>(
      '/magic/modules/system/config/list-cache-count' +
      query);
  }

  /**
   * Deletes a single cache item.
   * 
   * @param id ID of item to delete
   */
  public delete(id: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.delete<Response>(
      '/magic/modules/system/config/delete-cache-item?id=' +
      encodeURIComponent(id));
  }

  /**
   * Deletes all cache items matching the optional filter condition.
   * 
   * @param filter Optional query filter deciding which items to include when deleting items
   */
  public deleteAll(filter: string = null) {

    // Dynamically building our query parameters.
    let query = '';
    if (filter !== null && filter !== '') {
      query += '?filter=' + encodeURIComponent(filter);
    }

    // Invoking backend and returning observable to caller.
    return this.httpService.delete<Response>(
      '/magic/modules/system/config/empty-cache' +
      query);
  }
}

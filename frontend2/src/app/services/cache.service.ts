
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from './http.service';
import { Response } from '../models/response.model';

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
   * Returns all cache items from backend.
   * Be careful with this method, it does not provide paging, and might return a *lot* of items.
   */
  public list() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<any[]>('/magic/modules/system/config/list-cache');
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
   * Deletes all cache items.
   */
  public deleteAll() {

    // Invoking backend and returning observable to caller.
    return this.httpService.delete<Response>('/magic/modules/system/config/empty-cache');
  }
}

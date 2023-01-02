
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { Count } from 'src/app/models/count.model';

// Application specific imports.
import { HttpService } from 'src/app/_general/services/http.service';
import { CacheItem } from 'src/app/_protected/models/common/cache-item.model';

/**
 * Cache service allowing the user to modify his or her cache, viewing items, removing
 * items, and purging cache altogether.
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {

  constructor(private httpService: HttpService) { }

  list(filter: any = null) {
    let query = '';
    if (filter !== null) {
      query += '?limit=' + filter.limit;
      query += "&offset=" + filter.offset;
      if (filter.filter && filter.filter !== '') {
        query += '&filter=' + encodeURIComponent(filter.filter);
      }
    }
    return this.httpService.get<CacheItem[]>('/magic/system/cache/list' + query);
  }

  count(filter: string = null) {
    let query = '';
    if (filter !== null && filter !== '') {
      query += '?filter=' + encodeURIComponent(filter);
    }
    return this.httpService.get<Count>('/magic/system/cache/count' + query);
  }

  delete(id: string) {
    return this.httpService.delete<Response>('/magic/system/cache/delete?id=' + encodeURIComponent(id));
  }

  clear(filter: string = null) {
    let query = '';
    if (filter !== null && filter !== '') {
      query += '?filter=' + encodeURIComponent(filter);
    }
    return this.httpService.delete<Response>('/magic/system/cache/empty' + query);
  }
}


/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { Count } from 'src/app/models/count.model';

// Application specific imports.
import { HttpService } from 'src/app/_general/services/http.service';
import { CacheItem } from 'src/app/_protected/models/common/cache-item.model';
import { MagicResponse } from '../models/magic-response.model';

/**
 * Cache service allowing the user to modify his or her cache, viewing items, removing
 * items, and purging cache altogether.
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {

  constructor(private httpService: HttpService) { }

  /**
   * Deletes the specified server-side cache item.
   */
  delete(id: string) {

    return this.httpService.delete<MagicResponse>('/magic/system/cache/delete?id=' + encodeURIComponent(id));
  }
}

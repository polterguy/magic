
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { Count } from '../../../../../models/count.model';
import { LogItem } from 'src/app/_protected/pages/settings/log/_models/log-item.model';
import { HttpService } from 'src/app/_general/services/http.service';

/**
 * Log service, allows you to query your backend log, in addition to some other helper methods.
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
   * @param from What item to use as offset for retrieving items
   * @param max Maximum number of items to return
   */
  public list(from: string, max: number) {
    let url = '/magic/system/log/list?max=' + max;
    if (from) {
      url += '&from=' + encodeURIComponent(from);
    }
    return this.httpService.get<LogItem[]>(url);
  }

  /**
   * Retrieves one specific item, and returns to caller.
   *
   * @param id ID of item to retrieve
   */
  public get(id: number) {
    return this.httpService.get<LogItem>('/magic/system/log/get?id=' + id);
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
    return this.httpService.get<Count>('/magic/system/log/count' + query);
  }

  /**
   * Generates a new log entry about lines of code that was generated.
   *
   * @param loc Number of lines of code that was created
   * @param type Type of component that was created
   * @param name Name of component that was created
   */
  public createLocItem(loc: number, type: string, name: string) {
    return this.httpService.post<any>('/magic/system/log/log-loc', {
      loc,
      type,
      name,
    });
  }
}

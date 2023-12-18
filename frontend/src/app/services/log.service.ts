
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { Count } from '../models/count.model';
import { HttpService } from 'src/app/services/http.service';
import { LogItem } from '../components/protected/misc/log/_models/log-item.model';

/**
 * Log service, allows you to query your backend log, in addition to some other helper methods.
 */
@Injectable({
  providedIn: 'root'
})
export class LogService {

  constructor(private httpService: HttpService) { }

  list(from: string, max: number, query: string = null) {

    let url = '/magic/system/log/list?max=' + max;
    if (from) {
      url += '&from=' + encodeURIComponent(from);
    }
    if (query && query.length > 0) {
      if (!query.includes('%')) {
        query += '%';
      }
      url += '&query=' + encodeURIComponent(query);
    }
    return this.httpService.get<LogItem[]>(url);
  }

  get(id: number) {

    return this.httpService.get<LogItem>('/magic/system/log/get?id=' + id);
  }

  count(filter?: string) {

    let query = '';
    if (filter) {
      if (!query.includes('%')) {
        filter += '%';
      }
      query += '?query=' + encodeURIComponent(filter);
    }
    return this.httpService.get<Count>('/magic/system/log/count' + query);
  }

  createLocItem(loc: number, type: string, name: string) {

    return this.httpService.post<any>('/magic/system/log/log-loc', {
      loc,
      type,
      name,
    });
  }
}


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
 * Health service, allowing you to inspect backend for health issues, some basic statistics, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class HealthService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

  /**
   * Returns statistics from your backend about the number of
   * log items that exists grouped by type of item for the last 2 weeks.
   */
  public statisticsType() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<any[]>('/magic/modules/system/health/log-statistics');
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
      '/magic/modules/system/health/log-statistics-days' + query);
  }

  /**
   * Returns statistics about lines of code that has been generated
   * during system's existence.
   */
  public getLoc() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<any>('/magic/modules/system/health/loc-generated');
  }

  /**
   * Returns backend version of Magic.
   */
  public version() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<any>('/magic/modules/system/version');
  }
}

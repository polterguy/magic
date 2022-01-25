
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from '../../../services/http.service';

/**
 * Health service, allowing you to inspect backend for health issues, some basic statistics, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class DiagnosticsService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

  /**
   * Returns backend version of Magic.
   */
  public version() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<any>('/magic/system/version');
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
      '/magic/system/diagnostics/log-statistics-days' + query);
  }
}

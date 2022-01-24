
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
}

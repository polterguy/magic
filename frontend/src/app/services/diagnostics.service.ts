
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from './http.service';
import { SystemReport } from '../models/dashboard.model';

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
    return this.httpService.get<any>('/magic/system/version');
  }

  /**
   * Returns a report of the health from your backend.
   * 
   */
  public getSystemReport() {
    return this.httpService.get<SystemReport[]>('/magic/system/diagnostics/system-information');
  }
}

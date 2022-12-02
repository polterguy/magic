
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/_general/services/http.service';
import { SystemReport } from '../_models/dashboard.model';

// Application specific imports.

/**
 * Diagnostics service providing you with diagnostics information about your system.
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
   * Returns a report of the health from your backend.
   *
   */
  getSystemReport() {
    return this.httpService.get<SystemReport[]>('/magic/system/diagnostics/system-information');
  }
}

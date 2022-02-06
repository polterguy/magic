import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/services/http.service';
import { SystemReport } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

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
   public getSystemReport() {

    // Dynamically building our query according to arguments specificed.
    let url = '/magic/system/diagnostics/system-information';

    // Invoking backend and returning observable to caller.
    return this.httpService.get<SystemReport[]>(url);
  }
}

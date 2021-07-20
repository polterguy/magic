
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

// Application specific imports.
import { BazarApp } from '../models/bazar-app.model';

/**
 * Setup service, allows you to setup, read, and manipulate your configuration
 * settings.
 */
@Injectable({
  providedIn: 'root'
})
export class BazarService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpClient HTTP client needed to retrieve Bazar manifest from Server Gardens
   */
  constructor(private httpClient: HttpClient) { }

  /**
   * Lists all apps available in the external Bazar.
   */
  listApps() {

    let query = '?limit=10';

    // Invoking Bazar to list apps.
    return this.httpClient.get<BazarApp[]>(environment.bazarUrl +
      '/magic/modules/paypal/apps' +
      query);
  }
}

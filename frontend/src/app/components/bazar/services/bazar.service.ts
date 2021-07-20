
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { BazarApp } from '../models/bazar-app.model';
import { PurchaseStatus } from '../models/purchase-status.model';
import { ConfigService } from '../../config/services/config.service';

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
  constructor(
    private httpClient: HttpClient,
    private configService: ConfigService) { }

  /**
   * Lists all apps available in the external Bazar.
   */
  public listApps(filter: string, offset: number, limit: number) {

    // Dynamically creating our query parameter(s).
    let query = '?limit=' + limit;
    if (offset && offset !== 0) {
      query += '&offset=' + offset;
    }
    if (filter && filter !== '') {
      query += '&name.like=' + encodeURIComponent(filter + '%');
    }
    query += '&order=created&direction=desc';

    // Invoking Bazar to list apps.
    return this.httpClient.get<BazarApp[]>(environment.bazarUrl +
      '/magic/modules/paypal/apps' +
      query);
  }

  /**
   * Lists all apps available in the external Bazar.
   */
  public countApps(filter: string) {

    // Dynamically creating our query parameter(s).
    let query = '';
    if (filter && filter !== '') {
      query += '?name.like=' + encodeURIComponent(filter + '%');
    }

    // Invoking Bazar to list apps.
    return this.httpClient.get<Count>(environment.bazarUrl +
      '/magic/modules/paypal/apps-count' +
      query);
  }

  /**
   * Starts the purchasing workflow to allow user to purchase and
   * install application in his own Magic installation.
   * 
   * @param app Application user wants to purchase
   * @param email Customer's email address
   */
  public purchase(app: BazarApp, email: string) {

    // We now have the user's email address, hence invoking Bazar to start purchasing workflow.
    return this.httpClient.post<PurchaseStatus>(environment.bazarUrl +
      '/magic/modules/paypal/purchase', {
        product_id: app.id,
        customer_email: email
    });
  }
}


/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { BazarApp } from '../models/bazar-app.model';
import { Response } from 'src/app/models/response.model';
import { HttpService } from 'src/app/services/http.service';
import { PurchaseStatus } from '../models/purchase-status.model';
import { environment } from '../../../../environments/environment';

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
    private httpService: HttpService) { }

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

    /*
     * Notice, since we don't support anything nut modules in this
     * release, but we might support alternative types of components
     * in the future, we filter according to type === 'module' here,
     * to allow for future versions to support for instance 'template' etc,
     * without breaking old code as we implement it in the centralised Bazar
     * server.
     */
    query += '&type.eq=module';

    // Invoking Bazar to list apps.
    return this.httpClient.get<BazarApp[]>(environment.bazarUrl +
      '/magic/modules/bazar/apps' +
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

    /*
     * Notice, since we don't support anything nut modules in this
     * release, but we might support alternative types of components
     * in the future, we filter according to type === 'module' here,
     * to allow for future versions to support for instance 'template' etc,
     * without breaking old code as we implement it in the centralised Bazar
     * server.
     */
    if (query === '') {
      query += '?type.eq=module';
    } else {
      query += '&type.eq=module';
    }

    // Invoking Bazar to list apps.
    return this.httpClient.get<Count>(environment.bazarUrl +
      '/magic/modules/bazar/apps-count' +
      query);
  }

  /**
   * Starts the purchasing workflow to allow user to purchase and
   * install application in his own Magic installation.
   * 
   * @param app Application user wants to purchase
   * @param email Customer's email address
   * @param code Optional promo code user supplied before he clicked purchase
   */
  public purchase(app: BazarApp, email: string, promo_code?: string) {

    // Creating our payload.
    const payload: any = {
      product_id: app.id,
      customer_email: email,
      redirect_url: window.location.href.split('?')[0],
    };

    // Checking if user supplied a promo code.
    if (promo_code && promo_code !== '') {
      payload.promo_code = promo_code;
    }

    // We now have the user's email address, hence invoking Bazar to start purchasing workflow.
    return this.httpClient.post<PurchaseStatus>(
      environment.bazarUrl +
      '/magic/modules/bazar/purchase',
      payload);
  }

  /**
   * Checks to see if the payment for the specified download token has been accepted.
   * 
   * Notice, the token will only become accepted as the payment has been accepted by PayPal,
   * and PayPal has invoked our callback webhook.
   * 
   * @param token Download token to check
   */
  public appReady(token: string) {
    return this.httpClient.get<Response>(
      environment.bazarUrl +
      '/magic/modules/bazar/can-download?token=' +
      encodeURIComponent(token));
  }

  /**
   * Download the specified Bazar app into the current backend.
   * 
   * @param app Bazar app user wants to install
   * @param token Download token needed to download ZIP file from Bazar
   */
  public download(app: BazarApp, token: string) {

    // Invoking backend to actually download app.
    return this.httpService.post<Response>('/magic/modules/system/file-system/download', {
      url: environment.bazarUrl + '/magic/modules/bazar/download?token=' + token,
      name: app.folder_name
    });
  }

  /**
   * Downloads module to the local computer.
   * 
   * @param token Download token for module
   */
  public downloadLocally(token: string) {
    window.location.href = environment.bazarUrl + '/magic/modules/bazar/download?token=' + token;
  }

  /**
   * Installs an app on your current backend by running initialisation process,
   * executing startup files, etc.
   * 
   * @param folder Module to install
   */
  public install(folder: string) {

    // Invoking backend to actually install app.
    return this.httpService.put<Response>('/magic/modules/system/file-system/install', {
      folder: '/modules/' + folder + '/',
    });
  }
}

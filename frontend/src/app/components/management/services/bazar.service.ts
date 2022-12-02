
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { BazarApp } from '../../../models/bazar-app.model';
import { AppManifest } from '../../../models/app-manifest';
import { Response } from 'src/app/models/response.model';
import { HttpService } from 'src/app/_general/services/http.service';
import { environment } from '../../../../environments/environment';
import { FileService } from 'src/app/services--/file.service';
import { PurchaseStatus } from '../../../models/purchase-status.model';

/**
 * Bazar service allowing you to query Aista's Bazar, and/or install Bazar items locally on your
 * own server, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class BazarService {

  /**
   * Creates an instance of your service.
   *
   * @param httpClient HTTP client needed to retrieve Bazar manifest from Server Gardens
   * @param httpService Needed to retrieve data from backend
   * @param fileService Needed to be able to download bazar items
   */
  constructor(
    private httpClient: HttpClient,
    private httpService: HttpService,
    private fileService: FileService) { }

  /**
   * Retrieves the local manifests from your local installation.
   */
  localManifests() {
    return this.httpService.get<AppManifest[]>('/magic/system/bazar/app-manifests');
  }

  /**
   * Lists all apps available in the external Bazar.
   */
  listBazarItems(filter: string, offset: number, limit: number) {
    let query = '?limit=' + limit;
    if (offset && offset !== 0) {
      query += '&offset=' + offset;
    }
    if (filter && filter !== '') {
      query += '&name.like=' + encodeURIComponent(filter + '%');
    }
    query += '&order=created&direction=desc';

    /*
     * Notice, since we don't support anything but modules in this
     * release, but we might support alternative types of components
     * in the future, we filter according to type === 'module' here,
     * to allow for future versions to support for instance 'template' etc,
     * without breaking old code as we implement it in the centralised Bazar
     * server.
     */
    query += '&type.eq=module';
    return this.httpClient.get<BazarApp[]>(environment.bazarUrl + '/magic/modules/bazar/apps' + query);
  }

  /**
   * Returns specified app from Bazar.
   *
   * @param module_name Name of module
   */
  getBazarItem(module_name: string) {
    const query = '?folder_name.eq=' + encodeURIComponent(module_name);
    return this.httpClient.get<BazarApp[]>(environment.bazarUrl + '/magic/modules/bazar/apps' + query);
  }

  /**
   * Lists all apps available in the external Bazar.
   */
  countBazarItems(filter: string) {
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
    return this.httpClient.get<Count>(environment.bazarUrl + '/magic/modules/bazar/apps-count' + query);
  }

  /**
   * Subscribes the specified user to our newsletter.
   *
   * @param name Full name of user
   * @param email Email address belonging to user
   */
  subscribeToNewsletter(data: any) {
    return this.httpClient.post<Response>(environment.bazarUrl + '/magic/modules/bazar/subscribe', data);
  }

  /**
   * Starts the purchasing workflow to allow user to purchase and
   * install application in his own Magic installation.
   *
   * @param app Application user wants to purchase
   * @param name Customer's name
   * @param email Customer's email address
   * @param subscribe True if user wants to subscribe to our newsletter
   * @param promo_code Optional promo code user supplied before he clicked purchase
   */
  purchaseBazarItem(
    app: BazarApp,
    name: string,
    email: string,
    subscribe: boolean,
    promo_code?: string) {
    const payload: any = {
      product_id: app.id,
      name,
      customer_email: email,
      subscribe,
      redirect_url: window.location.href.split('?')[0],
    };
    if (promo_code && promo_code !== '') {
      payload.promo_code = promo_code;
    }
    return this.httpClient.post<PurchaseStatus>(environment.bazarUrl + '/magic/modules/bazar/purchase', payload);
  }

  /**
   * Checks to see if the payment for the specified download token has been accepted.
   *
   * Notice, the token will only become accepted as the payment has been accepted by PayPal,
   * and PayPal has invoked our callback webhook.
   *
   * @param token Download token to check
   */
  canDownloadBazarItem(token: string) {
    return this.httpClient.get<Response>(environment.bazarUrl + '/magic/modules/bazar/can-download?token=' + encodeURIComponent(token));
  }

  /**
   * Download the specified Bazar item from the Bazar and directly into the current backend.
   *
   * @param app Bazar app user wants to install
   * @param token Download token needed to download ZIP file from Bazar
   */
  downloadBazarItem(app: BazarApp, token: string) {
    return this.httpService.post<Response>('/magic/system/bazar/download-from-bazar', {
      url: environment.bazarUrl + '/magic/modules/bazar/download?token=' + token,
      name: app.folder_name
    });
  }

  /**
   * Updates the specified app by invoking Bazar.
   *
   * @param app App's manifest
   */
  updateBazarItem(app: AppManifest) {
    if (!app.token || app.token === '') {
      return throwError(() => new Error('No token found in app\'s manifest'));
    }
    return this.httpService.post<Response>('/magic/system/bazar/download-from-bazar', {
      url: environment.bazarUrl + '/magic/modules/bazar/download?token=' + app.token,
      name: app.module_name
    });
  }

  /**
   * Downloads module to the local computer.
   *
   * @param module_name Name of module to download
   */
  downloadBazarItemLocally(module_name: string) {

    /*
     * Notice, for some reasons I don't entirely understand, we'll need to wait a
     * second before we download the app, since otherwise the manifest.hl file won't be a part
     * of our downloaded ZIP file.
     */
    setTimeout(() => this.fileService.downloadFolder('/modules/' + module_name + '/'), 1000);
  }

  /**
   * Returns whether or not the application can be successfully installed or not.
   *
   * @param required_magic_version Minimum Magic version required by app to function correctly
   */
  canInstall(required_magic_version: string) {
    return this.httpService.get<Response>('/magic/system/bazar/can-install?required_magic_version=' + encodeURIComponent(required_magic_version));
  }

  /**
   * Installs an app on your current backend by running initialisation process,
   * executing startup files, etc.
   *
   * @param folder Module to install
   * @param app_version Version of app we're currently installing
   * @param name Friendly display name of app
   * @param token Installation token, required to be able to automatically update the app later
   */
  installBazarItem(folder: string, app_version: string, name: string, token: string) {
    return this.httpService.put<Response>('/magic/system/file-system/install', {
      folder: '/modules/' + folder + '/',
      app_version,
      name,
      token,
    });
  }
}

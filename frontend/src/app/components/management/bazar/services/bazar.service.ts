
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { BazarApp } from '../models/bazar-app.model';
import { AppManifest } from '../models/app-manifest';
import { Response } from 'src/app/models/response.model';
import { HttpService } from 'src/app/services/http.service';
import { FileService } from '../../../files/services/file.service';
import { PurchaseStatus } from '../models/purchase-status.model';
import { environment } from '../../../../../environments/environment';
import { LoaderService } from 'src/app/components/app/services/loader.service';

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
    private httpService: HttpService,
    private fileService: FileService,
    private loaderService: LoaderService) { }

  /**
   * Retrieves the latest Magic core version as published by the Bazar.
   */
  public version() {

    // Invoking Bazar service to retrieve its current version
    return this.httpClient.get<Response>(
      environment.bazarUrl +
      '/magic/modules/bazar/core-version');
  }

  /**
   * Retrieves the local manifests from your local installation.
   */
  public localManifests() {

    // Invoking backend to actually retrieve manifest.
    return this.httpService.get<AppManifest[]>('/magic/system/bazar/app-manifests');
  }

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
    return this.httpClient.get<BazarApp[]>(
      environment.bazarUrl +
      '/magic/modules/bazar/apps' +
      query);
  }

  /**
   * Returns specified app from Bazar.
   * 
   * @param module_name Name of module
   */
  public getApp(module_name: string) {
    this.loaderService.hide();
    // Dynamically building our query.
    const query = '?folder_name.eq=' + encodeURIComponent(module_name);

    // Invoking Bazar server to retrieve app.
    return this.httpClient.get<BazarApp[]>(
      environment.bazarUrl +
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
    return this.httpClient.get<Count>(
      environment.bazarUrl +
      '/magic/modules/bazar/apps-count' +
      query);
  }

  /**
   * Subscribes the specified user to our newsletter.
   * 
   * @param name Full name of user
   * @param email Email address belonging to user
   */
  public subscribe(name: string, email: string) {

    return this.httpClient.get<Response>(
      environment.bazarUrl +
      '/magic/modules/bazar/subscribe?name=' +
      encodeURIComponent(name) +
      '&email=' + encodeURIComponent(email));
  }

  /**
   * Starts the purchasing workflow to allow user to purchase and
   * install application in his own Magic installation.
   * 
   * @param app Application user wants to purchase
   * @param name Customer's name
   * @param email Customer's email address
   * @param subscribe True if user wants to subscribe to our newsletter
   * @param code Optional promo code user supplied before he clicked purchase
   */
  public purchase(
    app: BazarApp,
    name: string,
    email: string,
    subscribe: boolean,
    promo_code?: string) {

    // Creating our payload.
    const payload: any = {
      product_id: app.id,
      name,
      customer_email: email,
      subscribe,
      redirect_url: window.location.href.split('?')[0],
    };

    // Checking if user supplied a promo code.
    if (promo_code && promo_code !== '') {
      payload.promo_code = promo_code;
    }
    this.loaderService.show();
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
  public update(app: AppManifest) {

    // Sanity checking invocation.
    if (!app.token || app.token === '') {
      throw new Error('No token found in app\'s manifest')
    }

    // Invoking backend to actually download app.
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
  public downloadLocally(module_name: string) {

    /*
     * Notice, for some reasons I don't entirely understand, we'll need to wait a
     * second before we download the app, since otherwise the manifest.hl file won't be a part
     * of our downloaded ZIP file.
     */
    setTimeout(() => {

      // Zipping and downloading local app module.
      this.fileService.downloadFolder('/modules/' + module_name + '/');
    }, 1000)
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
  public install(folder: string, app_version: string, name: string, token: string) {

    // Invoking backend to actually install app.
    return this.httpService.put<Response>('/magic/system/file-system/install', {
      folder: '/modules/' + folder + '/',
      app_version,
      name,
      token,
    });
  }
}

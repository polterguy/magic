
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { HttpService } from 'src/app/_general/services/http.service';
import { FileService } from 'src/app/_general/services/file.service';
import { BazarApp } from 'src/app/models/bazar-app.model';
import { environment } from 'src/environments/environment';
import { AppManifest } from 'src/app/models/app-manifest';
import { MagicResponse } from '../models/magic-response.model';

/**
 * Bazar service allowing you to query Aista's Bazar, and/or install Bazar items locally on your
 * own server, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class BazarService {

  constructor(
    private httpClient: HttpClient,
    private httpService: HttpService,
    private fileService: FileService) { }

  installedPlugins() {

    return this.httpService.get<AppManifest[]>('/magic/system/bazar/app-manifests');
  }

  availablePlugins(filter: string, offset: number, limit: number) {

    let query = '?limit=' + limit;
    if (offset && offset !== 0) {
      query += '&offset=' + offset;
    }
    if (filter && filter !== '') {
      query += '&name.like=' + encodeURIComponent(filter + '%');
    }
    query += '&order=created&direction=desc&type.eq=module';
    return this.httpClient.get<BazarApp[]>(environment.bazarUrl + '/magic/modules/bazar/apps' + query);
  }

  getBazarItem(module_name: string) {

    const query = '?folder_name.eq=' + encodeURIComponent(module_name);
    return this.httpClient.get<BazarApp[]>(environment.bazarUrl + '/magic/modules/bazar/apps' + query);
  }

  countBazarItems(filter: string) {

    let query = '';
    if (filter && filter !== '') {
      query += '?name.like=' + encodeURIComponent(filter + '%');
    }

    if (query === '') {
      query += '?type.eq=module';
    } else {
      query += '&type.eq=module';
    }
    return this.httpClient.get<Count>(environment.bazarUrl + '/magic/modules/bazar/apps-count' + query);
  }

  downloadBazarItem(app: BazarApp) {

    return this.httpService.post<MagicResponse>('/magic/system/bazar/download-from-bazar', {
      url: environment.bazarUrl + '/magic/modules/bazar/download?product_id=' + app.id,
      name: app.folder_name
    });
  }

  downloadBazarItemLocally(module_name: string) {

    /*
     * Notice, for some reasons I don't entirely understand, we'll need to wait a
     * second before we download the app, since otherwise the manifest.hl file won't be a part
     * of our downloaded ZIP file.
     */
    setTimeout(() => this.fileService.downloadFolder('/modules/' + module_name + '/'), 1000);
  }

  canInstall(required_magic_version: string) {

    return this.httpService.get<MagicResponse>('/magic/system/bazar/can-install?required_magic_version=' + encodeURIComponent(required_magic_version));
  }

  installBazarItem(folder: string, app_version: string, name: string, token: string) {

    return this.httpService.put<MagicResponse>('/magic/system/file-system/install', {
      folder: '/modules/' + folder + '/',
      app_version,
      name,
      token,
    });
  }

  prompt(prompt: string, recaptch_response: string) {

    const url = environment.bazarUrl + '/magic/system/openai/prompt?prompt=' +
      encodeURIComponent(prompt) +
      '&type=polterguy_github_io' +
      '&recaptcha_response=' +
      encodeURIComponent(recaptch_response);
    return this.httpClient.get<MagicResponse>(url);
  }
}

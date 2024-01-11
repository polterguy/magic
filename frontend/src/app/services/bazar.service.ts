
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Application specific imports.
import { HttpService } from 'src/app/services/http.service';
import { BazarApp } from 'src/app/models/bazar-app.model';
import { environment } from 'src/environments/environment';
import { MagicResponse } from '../models/magic-response.model';
import { AppManifest } from '../models/app-manifest';

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
    private httpService: HttpService) { }

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

  installPlugin(app: BazarApp) {

    return this.httpService.post<MagicResponse>('/magic/system/bazar/install-plugin', {
      url: environment.bazarUrl + '/magic/modules/bazar/download?product_id=' + app.id,
      name: app.folder_name
    });
  }

  prompt(prompt: string, recaptch_response: string) {

    const url = environment.bazarUrl + '/magic/system/openai/prompt?prompt=' +
      encodeURIComponent(prompt) +
      '&type=magic-documentation' +
      '&recaptcha_response=' +
      encodeURIComponent(recaptch_response);
    return this.httpClient.get<MagicResponse>(url);
  }
}


/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { BackendService } from 'src/app/_general/services/backend.service';
import { HttpService } from 'src/app/_general/services/http.service';
import { MagicResponse } from '../models/magic-response.model';

/**
 * Assumption service, allowing you to retrieve, create and execute assumptions.
 */
@Injectable({
  providedIn: 'root'
})
export class AssumptionService {

  constructor(
    private httpService: HttpService,
    private backendService: BackendService) { }

  list(endpointPath: string = null, verb: string = null) {

    if (endpointPath) {
      return this.httpService.get<string[]>(
        '/magic/system/assumptions/query?endpoint=' +
        encodeURIComponent(endpointPath) +
        '&verb=' +
        encodeURIComponent(verb))
    } else {
      return this.httpService.get<string[]>('/magic/system/assumptions/list');
    }
  }

  create(
    filename: string,
    verb: string,
    url: string,
    status: number,
    description: string = null,
    payload: string = null,
    response: string = null,
    produces: string = 'application/json') {

    if (filename.indexOf('/') !== -1) {
      return throwError(() => new Error('Not a valid filename'));
    }
    filename = '/etc/tests/' + filename;
    if (!filename.endsWith('.hl')) {
      filename += '.hl';
    }
    const input: any = {
      filename,
      verb,
      url,
      status,
    };
    if (description) {
      input.description = description;
    }
    if (payload) {
      input.payload = payload;
    }
    if (response) {
      input.response = response;
    }
    if (produces) {
      input.produces = produces;
    }
    return this.httpService.post('/magic/system/assumptions/create', input);
  }

  execute(filename: string) {

    return this.httpService.get<MagicResponse>(
      '/magic/system/assumptions/execute?root_url=' +
      encodeURIComponent(this.backendService.active.url) +
      '&test_file=' +
      encodeURIComponent(filename));
  }
}

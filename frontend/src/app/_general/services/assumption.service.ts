
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { Response } from '../../models/response.model';
import { BackendService } from 'src/app/_general/services/backend.service';
import { HttpService } from 'src/app/_general/services/http.service';

/**
 * Assumption service, allowing you to retrieve, create and execute assumptions.
 */
@Injectable({
  providedIn: 'root'
})
export class AssumptionService {

  /**
   * Creates an instance of your service.
   *
   * @param httpService HTTP service to use for backend invocations
   * @param backendService Needed to extract root URL
   */
  constructor(
    private httpService: HttpService,
    private backendService: BackendService) { }

  /**
   * Returns a list of all assumption/integration tests the backend has stored.
   *
   * @param endpointPath If specified only returns tests belonging to endpoint specified
   * @param verb If specified only returns tests for specified path
   */
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

  /**
   * Saves the specified assumption/integration test according to the specified argument.
   *
   * @param filename Filename to save snippet as. Notice, assumes we're only given the filename, and not the entire path. The service is responsible for prepending the folder.
   * @param verb HTTP verb assumption is using during invocation towards URL
   * @param url HTTP URL assumption invokes
   * @param status HTTP status code assumption assumes invocation returns
   * @param description Descriptive text for assumption
   * @param payload Payload for HTTP invocation towards URL
   * @param response Response assumption assumes invocation towards URL will return
   * @param produces Content-Type assumption assumes invocation towards URL will return
   */
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

  /**
   * Executes the specified tests.
   *
   * @param filename Full path of test to execute
   */
  execute(filename: string) {
    return this.httpService.get<Response>(
      '/magic/system/assumptions/execute?root_url=' +
      encodeURIComponent(this.backendService.active.url) +
      '&test_file=' +
      encodeURIComponent(filename));
  }
}

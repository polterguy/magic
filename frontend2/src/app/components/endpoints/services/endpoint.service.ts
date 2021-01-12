
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { Endpoint } from '../models/endpoint.model';
import { Response } from 'src/app/models/response.model';
import { HttpService } from '../../../services/http.service';
import { FileService } from '../../files/services/file.service';
import { BackendService } from 'src/app/services/backend.service';

/**
 * Endpoint service, allowing you to retrieve meta data about your endpoints,
 * and invoke them generically.
 */
@Injectable({
  providedIn: 'root'
})
export class EndpointService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   * @param fileService Needed to create, query and load assumption/integration tests
   * @param backendService Needed to extract root URL
   */
  constructor(
    private httpService: HttpService,
    private fileService: FileService,
    private backendService: BackendService) { }

  /**
   * Retrieves meta data about the endpoints in your installation.
   */
  public endpoints() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<Endpoint[]>(
      '/magic/modules/system/endpoints/endpoints');
  }

  /**
   * Invokes the HTTP GET verb towards the specified URL.
   * 
   * @param url URL to invoke
   */
  public get(url: string) {
    return this.httpService.get<any>(url, {
      observe: 'response',
    });
  }

  /**
   * Invokes the HTTP DELETE verb towards the specified URL.
   * 
   * @param url URL to invoke
   */
  public delete(url: string) {
    return this.httpService.delete<any>(url, {
      observe: 'response',
    });
  }

  /**
   * Invokes the HTTP POST verb towards the specified URL, passing
   * in the specified payload.
   * 
   * @param url URL to invoke
   * @param args Payload to transmit to backend
   */
  public post(url: string, args: any) {
    return this.httpService.post<any>(url, args, {
      observe: 'response',
    });
  }

  /**
   * Invokes the HTTP PUT verb towards the specified URL, passing
   * in the specified payload.
   * 
   * @param url URL to invoke
   * @param args Payload to transmit to backend
   */
  public put(url: string, args: any) {
    return this.httpService.put<any>(url, args, {
      observe: 'response',
    });
  }

  /**
   * Invokes the HTTP PATCH verb towards the specified URL, passing
   * in the specified payload.
   * 
   * @param url URL to invoke
   * @param args Payload to transmit to backend
   */
  public patch(url: string, args: any) {
    return this.httpService.patch<any>(url, args, {
      observe: 'response',
    });
  }

  /**
   * Returns a list of all assumption/integration tests the backend has stored.
   */
  public tests() {
    return this.fileService.listFiles('/misc/tests/');
  }

  /**
   * Saves the specified assumption/integration test according to the specified argument.
   * 
   * @param filename Filename to save snippet as. Notice, assumes we're only given the filename, and not the entire path. The service is responsible for prepending the folder.
   * @param content Content of snippet
   */
  public saveTest(filename: string, content: string) {

    // Sanity checking invocation.
    if (filename.indexOf('/') !== -1) {
      throw throwError('Please provide me with only the filename, and not the folder');
    }

    // Making sure we put our file into the correct folder.
    filename = '/misc/tests/' + filename;
    if (!filename.endsWith('.hl')) {
      filename += '.hl';
    }

    // Returning result of invocation to file service.
    return this.fileService.saveFile(filename, content);
  }

  /**
   * Executes the specified tests.
   * 
   * @param filename Full path of test to execute
   */
  public executeTest(filename: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<Response>(
      '/magic/modules/system/diagnostics/execute-test?root_url=' +
      encodeURIComponent(this.backendService.current.url) +
      '&test_file=' +
      encodeURIComponent(filename));
  }

  /**
   * Retrieves the description for the specified test.
   * 
   * @param filename Full path of test to retriev description for
   */
  public getDescription(filename: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<Response>(
      '/magic/modules/system/diagnostics/assumption-test-description?test_file=' +
      encodeURIComponent(filename));
  }
}


/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { of, throwError } from 'rxjs';
import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { formatNumber } from '@angular/common';

// Utility component imports.
import { saveAs } from "file-saver";

// Application specific imports.
import { Count } from 'src/app/models/count.model';
import { Template } from '../models/template.model';
import { Endpoint } from '../models/endpoint.model';
import { Message } from 'src/app/models/message.model';
import { Response } from 'src/app/models/response.model';
import { SocketUser } from '../models/socket-user.model';
import { HttpService } from '../../../services/http.service';
import { FileService } from '../../files/services/file.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { LocResult } from '../../crudifier/models/loc-result.model';

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
    private backendService: BackendService,
    @Inject(LOCALE_ID) public locale: string,
    private feedbackService: FeedbackService) { }

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
   * @param responseType What response endpoint is assumed to return
   */
  public get(url: string, responseType: string = 'json') {
    return this.httpService.get<any>(url, {
      observe: 'response',
      responseType,
    });
  }

  /**
   * Invokes the HTTP DELETE verb towards the specified URL.
   * 
   * @param url URL to invoke
   * @param responseType What response endpoint is assumed to return
   */
  public delete(url: string, responseType: string = 'json') {
    return this.httpService.delete<any>(url, {
      observe: 'response',
      responseType,
    });
  }

  /**
   * Invokes the HTTP POST verb towards the specified URL, passing
   * in the specified payload.
   * 
   * @param url URL to invoke
   * @param args Payload to transmit to backend
   * @param responseType What response endpoint is assumed to return
   */
  public post(url: string, args: any, responseType: string = 'json') {
    return this.httpService.post<any>(url, args, {
      observe: 'response',
      responseType,
    });
  }

  /**
   * Invokes the HTTP PUT verb towards the specified URL, passing
   * in the specified payload.
   * 
   * @param url URL to invoke
   * @param args Payload to transmit to backend
   * @param responseType What response endpoint is assumed to return
   */
  public put(url: string, args: any, responseType: string = 'json') {
    return this.httpService.put<any>(url, args, {
      observe: 'response',
      responseType,
    });
  }

  /**
   * Invokes the HTTP PATCH verb towards the specified URL, passing
   * in the specified payload.
   * 
   * @param url URL to invoke
   * @param args Payload to transmit to backend
   * @param responseType What response endpoint is assumed to return
   */
  public patch(url: string, args: any, responseType: string = 'json') {
    return this.httpService.patch<any>(url, args, {
      observe: 'response',
      responseType,
    });
  }

  /**
   * Returns a list of all assumption/integration tests the backend has stored.
   * 
   * @param endpointPath If specified only returns tests belonging to endpoint specified
   * @param verb If specified only returns tests for specified path
   */
  public tests(endpointPath: string = null, verb: string = null) {

    // Checking if we have a filter condition.
    if (endpointPath) {

      // Filtering tests, to return only tests matching endpoint specified.
      return this.httpService.get<string[]>(
        '/magic/modules/system/endpoints/assumptions?endpoint=' +
        encodeURIComponent(endpointPath) +
        '&verb=' +
        encodeURIComponent(verb))

    } else {

      // Simple version, retrieving all files in assumption test folder.
      return this.fileService.listFiles('/misc/tests/');
    }
  }

  /**
   * Returns a list of all users currently connected to a socket.
   * 
   * @param filter Filter to apply for which connections to return to caller
   * @param offset Offset from where to start returning connections
   * @param limit Maximum number of items to return.
   */
   public socketUsers(filter: string, offset: number, limit: number) {

    // Building our query parameter(s).
    var query = '?offset=' + offset + '&limit=' + limit;
    if (filter) {
      query += '&filter=' + encodeURIComponent(filter);
    }

    // Simple version, retrieving all files in assumption test folder.
    return this.httpService.get<SocketUser[]>(
      '/magic/modules/system/misc/socket-users' + query);
  }

  /**
   * Returns the count of all users currently connected to a socket.
   * 
   * @param filter Filter to apply for which connections to return to caller
   */
   public socketUserCount(filter: string) {

    // Building our query parameter(s).
    var query = '';
    if (filter) {
      query += '?filter=' + encodeURIComponent(filter);
    }

    // Simple version, retrieving all files in assumption test folder.
    return this.httpService.get<Count>(
      '/magic/modules/system/misc/socket-users-count' + query);
  }

  /**
   * Transmits the specified message to the specified client.
   * 
   * @param msg What message to send
   * @param client What client (connection) to transmit the message to
   * @param roles What roles to publish message to
   * @param groups What groups to publish message to
   */
   public sendSocketMessage(msg: Message, client: string, roles: string, groups: string) {

    // Creating our invocation.
    client = client === null || client === '' ? null : client;
    roles = roles === null || roles === '' ? null : roles;
    groups = groups === null || groups === '' ? null : groups;

    // Sanity checking invocation.
    if ([client, roles, groups].filter(x => x !== null).length > 1) {
      of('You have to choose maximum one of client, roles or groups')
    }

    // Invoking backend returning observable to caller.
    return this.httpService.post<Response>(
      '/magic/modules/system/misc/send-socket-message', {
        client,
        roles,
        groups,
        name: msg.name,
        message: JSON.parse(msg.content),
      });
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
   */
  public createAssumption(
    filename: string,
    verb: string,
    url: string,
    status: number,
    description: string = null,
    payload: string = null,
    response: string = null,
    produces: string = 'application/json') {

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
    const input: any = {
      filename,
      verb,
      url,
      status,
    };

    // Checking if optional arguments were supplied.
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
    return this.httpService.post('/magic/modules/system/diagnostics/create-test', input);
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

  /**
   * Returns a list of all templates the backend has stored.
   */
  public templates() {

    // Filtering tests, to return only tests matching endpoint specified.
    return this.httpService.get<string[]>('/magic/modules/system/endpoints/templates');
  }

  /**
   * Returns the documentation/README.md file for the specified template.
   * 
   * @param name Name of template to retrieve README file for
   */
  public template(name: string) {

    // Filtering tests, to return only tests matching endpoint specified.
    return this.httpService.get<Template>(
      '/magic/modules/system/endpoints/template?name=' +
      encodeURIComponent(name));
  }

  /**
   * Returns the custom arguments associated with the specified template.
   * 
   * @param name Name of template to retrieve custom arguments for
   */
   public templateCustomArgs(name: string) {

    // Filtering tests, to return only tests matching endpoint specified.
    return this.httpService.get<any>(
      '/magic/modules/system/endpoints/template-args?name=' +
      encodeURIComponent(name));
  }

  /**
   * Generates a frontend and downloads to client as a ZIP file.
   * 
   * @param templateName Name of template to use
   * @param apiUrl API root URL to use when generating template
   * @param frontendUrl Frontend URL of where app is supposed to be deployed
   * @param email Email address of user required to renew SSL certificate
   * @param name Name of application
   * @param copyright Copyright notice to put at top of all files
   * @param endpoints Endpoints you want to embed into your result
   * @param args Custom args endpoint requires
   */
  public generate(
    templateName: string,
    apiUrl: string,
    frontendUrl: string,
    email: string,
    name: string,
    copyright: string,
    endpoints: any[],
    args: any) {

      // Invoking backend such that we download the result of invocation to client as a ZIP file.
      const payload = {
        templateName,
        apiUrl,
        frontendUrl,
        email,
        name,
        copyright,
        endpoints,
        args
      };
      this.httpService.downloadPost(
        '/magic/modules/system/endpoints/generate', payload).subscribe(res => {
  
          // Retrieving the filename, as provided by the server.
          const disp = res.headers.get('Content-Disposition');
          let filename = disp.split(';')[1].trim().split('=')[1].replace(/"/g, '');
          const file = new Blob([res.body]);

          // Providing feedback to user about LOC count operation resulted in.
          this.getLastLocCount().subscribe((loc: LocResult) => {

            // Providing feedback to user.
            this.feedbackService.showInfo(`${formatNumber(loc.loc, this.locale, '1.0')} number of lines of code generated`);
          });

          // Saving file.
          saveAs(file, filename);

        }, (error: any) => this.feedbackService.showError('Something went wrong while generating your app, check your log for details'));
  }

  /*
   * Private helper methods.
   */

  /*
   * Returns the number of lines of code that was generated the last time the generator ran.
   */
   private getLastLocCount() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<LocResult>('/magic/modules/system/endpoints/last-loc-count');
  }
}

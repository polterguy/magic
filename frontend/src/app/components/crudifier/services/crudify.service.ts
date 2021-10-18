
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { of } from 'rxjs';
import { Inject, Injectable, LOCALE_ID } from '@angular/core';

// Utility component imports.
import { saveAs } from "file-saver";

// Application specific imports.
import { Crudify } from '../models/crudify.model';
import { LocResult } from '../models/loc-result.model';
import { CustomSql } from '../models/custom-sql.model';
import { Response } from 'src/app/models/response.model';
import { HttpService } from '../../../services/http.service';
import { formatNumber } from '@angular/common';
import { FeedbackService } from 'src/app/services/feedback.service';
import { Template } from 'src/app/models/template.model';

/**
 * Crudify service, allows you to crudify your databases.
 */
@Injectable({
  providedIn: 'root'
})
export class CrudifyService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   * @param feedbackService Needed to provide feedback to user
   */
  constructor(
    private httpService: HttpService,
    private feedbackService: FeedbackService,
    @Inject(LOCALE_ID) public locale: string) { }

  /**
   * Returns all available input reactors from backend.
   */
  public getInputReactor() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<any[]>('/magic/modules/system/crudifier/input-reactors');
  }

  /**
   * Crudifies a database table for a specified HTTP verb.
   * 
   * @param data Input for process
   */
  public crudify(data: Crudify) {

    // Sanity checking invocation, returning early if we cannot generate endpoint.
    let generate = true;
    if (data.verb === 'post' && data.args.columns.length === 0 && data.args.primary.length === 0) {
      generate = false;
    }
    if (data.verb === 'put' && data.args.columns.length === 0) {
      generate = false;
    }
    if (data.verb === 'delete' && data.args.primary.length === 0) {
      generate = false;
    }
    if (!generate) {
      return of<LocResult>({
        loc: 0,
        result: 'Endpoint not created'
      });
    }

    // Invoking backend and returning observable to caller.
    return this.httpService.post<LocResult>('/magic/modules/system/crudifier/crudify', data);
  }

  /**
   * Generates an SQL endpoint for a specified HTTP verb.
   * 
   * @param data Input for process
   */
  public generateSqlEndpoint(data: CustomSql) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<Response>('/magic/modules/system/crudifier/custom-sql', data);
  }

  /**
   * 
   * 
   * @param domain Frontend/dashboard domain
   * @param apiDomain Backend/API domain - Typically api.xxx.domain
   */
  public generateDockerComposeFile(domain: string, apiDomain: string) {

    // Invoking backend such that we download results of invocation to client.
    const payload = {
      domain,
      apiDomain,
    };
    this.httpService.downloadPost(
      '/magic/modules/system/crudifier/generate-docker-compose', payload).subscribe(res => {

        // Retrieving the filename, as provided by the server.
        const disp = res.headers.get('Content-Disposition');
        let filename = disp.split(';')[1].trim().split('=')[1].replace(/"/g, '');
        const file = new Blob([res.body]);
        saveAs(file, filename);
      });
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
        '/magic/modules/system/crudifier/generate-frontend', payload).subscribe(res => {
  
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

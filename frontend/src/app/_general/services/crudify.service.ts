
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { of } from 'rxjs';
import { Inject, Injectable, LOCALE_ID } from '@angular/core';

// Utility component imports.
import { saveAs } from "file-saver";

// Application specific imports.
import { Template } from 'src/app/models/template.model';
import { GeneralService } from 'src/app/_general/services/general.service';
import { HttpService } from 'src/app/_general/services/http.service';
import { Crudify } from '../models/crudify.model';
import { LocResult } from '../models/loc-result.model';
import { CustomSql } from '../models/custom-sql.model';
import { MagicResponse } from '../models/magic-response.model';

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
   * @param locale Needed to format strings according to locale
   */
  constructor(
    private httpService: HttpService,
    private generalService: GeneralService,
    @Inject(LOCALE_ID) public locale: string) { }

  /**
   * Crudifies a database table for a specified HTTP verb.
   *
   * @param data Input for process
   */
  crudify(data: Crudify) {

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
    return this.httpService.post<LocResult>('/magic/system/crudifier/crudify', data);
  }

  /**
   * Generates an SQL endpoint for a specified HTTP verb.
   *
   * @param data Input for process
   */
  generateSqlEndpoint(data: CustomSql) {

    return this.httpService.post<MagicResponse>('/magic/system/crudifier/custom-sql', data);
  }

  /**
   * Returns a list of all templates the backend has stored.
   */
  templates() {

    return this.httpService.get<string[]>('/magic/system/crudifier/templates');
  }

  /**
   * Returns the documentation/README.md file for the specified template.
   *
   * @param name Name of template to retrieve README file for
   */
  template(name: string) {

    return this.httpService.get<Template>('/magic/system/crudifier/template?name=' + encodeURIComponent(name));
  }

  /**
   * Returns the custom arguments associated with the specified template.
   *
   * @param name Name of template to retrieve custom arguments for
   */
  templateCustomArgs(name: string) {

    return this.httpService.get<any>('/magic/system/crudifier/template-args?name=' + encodeURIComponent(name));
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
   * @param deployLocally If true frontend is deployed locally on server
   * @param args Custom args endpoint requires
   * @param onAfter Callback to be invoked once process is done
   */
  generate(
    templateName: string,
    apiUrl: string,
    name: string,
    copyright: string,
    endpoints: any[],
    deployLocally: boolean,
    args: any,
    onAfter: () => void = null,
    onError: () => void = null) {

    const payload = {
      templateName,
      apiUrl,
      name,
      copyright,
      endpoints,
      deployLocally,
      args
    };

    this.httpService.downloadPost('/magic/system/crudifier/generate-frontend', payload).subscribe({
      next: (res) => {

        const disp = res.headers.get('Content-Disposition');
        if (disp) {
          let filename = disp.split(';')[1].trim().split('=')[1].replace(/"/g, '');
          const file = new Blob([res.body]);
          saveAs(file, filename);
        }
        if (onAfter) {
          onAfter();
        }
      },
      error: () => {

        if (onError) {
          onError();
        }
      }
    });
  }
}

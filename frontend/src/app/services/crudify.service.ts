
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { of } from 'rxjs';
import { Inject, Injectable, LOCALE_ID } from '@angular/core';

// Application specific imports.
import { HttpService } from 'src/app/services/http.service';
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
   */
  constructor(
    private httpService: HttpService,
    @Inject(LOCALE_ID) public locale: string) { }

  /**
   * Crudifies a database table for a specified HTTP verb.
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
   */
  generateSqlEndpoint(data: CustomSql) {

    return this.httpService.post<MagicResponse>('/magic/system/crudifier/custom-sql', data);
  }

  getOpenAPISpec(url: string) {

    return this.httpService.raw.get(url);
  }

  generateOpenAPIWrappers(specification: string, moduleName: string, baseUrl: string) {

    return this.httpService.post<MagicResponse>('/magic/system/crudifier/open-api', {
      specification,
      moduleName,
      overwrite: true,
      baseUrl,
    });
  }
}

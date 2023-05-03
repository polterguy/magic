
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { Affected } from 'src/app/models/affected.model';
import { Count } from 'src/app/models/count.model';

// Application specific imports.
import { HttpService } from 'src/app/_general/services/http.service';
import { MagicResponse } from '../models/magic-response.model';

/**
 * OpenAI service, allowing user to interact with OpenAI.
 */
@Injectable({
  providedIn: 'root'
})
export class QueryArgService {

  /**
   * Creates QUERY parameters from the specified "args" argument given.
   *
   * Used by CRUD service methods to create the correct QUERY parameters
   * during invocations towards your backend.
   */
  public getQueryArgs(args: any) {

    let result = '';
    for(const idx in args || {}) {

      if (Object.prototype.hasOwnProperty.call(args, idx)) {

        const idxFilter = args[idx];
        if (idxFilter !== null && idxFilter !== undefined && idxFilter !== '') {

          if (result === '') {
            result += '?';
          } else {
            result += '&';
          }

          if (idx.endsWith('.like') && idxFilter.indexOf('%') === -1) {
            result += idx + '=' + encodeURIComponent(idxFilter + '%');
          } else {
            result += idx + '=' + encodeURIComponent(idxFilter);
          }
        }
      }
    }
    return result;
  }
}


/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

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
  public getQueryArgs(args: any, forced: string[] = []) {

    let result = '';
    for(const idx in args || {}) {

      if (Object.prototype.hasOwnProperty.call(args, idx)) {

        const idxFilter = args[idx];
        if (idxFilter !== null && idxFilter !== undefined && (idxFilter !== '' || forced[idx])) {

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

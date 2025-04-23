
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from 'src/app/services/http.service';
import { MagicResponse } from '../models/magic-response.model';
import { Observable } from 'rxjs';

/**
 * File service allowing you to read, download, upload, and delete files.
 */
@Injectable({
  providedIn: 'root'
})
export class WorkflowService {

  constructor(private httpService: HttpService) { }

  /**
   * Returns all workflows.
   */
  getWorkflows() {

    return this.httpService.get<any[]>('/magic/system/workflows/workflows');
  }

  /**
   * Returns all workflows.
   */
  getArgumentsForFile(file: string) {

    return this.httpService.get<any>(
      '/magic/system/workflows/get-arguments?file=' + 
      encodeURIComponent(file));
  }

  /**
   * Returns a list of all workflow actions.
   */
  getActions() {

    return this.httpService.get<any[]>('/magic/system/workflows/actions');
  }

  /**
   * Returns a list of all workflow snippets.
   */
  getSnippets() {

    return this.httpService.get<any[]>('/magic/system/workflows/snippets');
  }

  /**
   * Adds the specified args to the specified Hyperlambda and returns the transformed result.
   */
  getActionHyperlambda(filename: string, args: any = null) {

    return this.httpService.post<MagicResponse>(
      '/magic/system/workflows/get-hyperlambda', {
        filename,
        args,
      });
  }

  /**
   * Returns the arguments the specified workflow action can handle.
   */
  getArgumentsToAction(action: string, hyperlambda: string = null) {

    return this.httpService.post<any>('/magic/system/workflows/get-action-arguments', {
      'action-file': action,
      hyperlambda,
    });
  }

  /**
   * Applies the specified arguments to the specified Hyperlambda and returns to caller.
   */
  applyArguments(hyperlambda: string, description: string, args: any) {

    return this.httpService.post<MagicResponse>('/magic/system/workflows/apply-arguments', {
      hyperlambda,
      description,
      args,
    });
  }

  /**
   * Returns the arguments the specified Hyperlambda can handle.
   */
  getArguments(hyperlambda: string) {

    return this.httpService.post<any>('/magic/system/workflows/get-hyperlambda-arguments', {
      hyperlambda,
    });
  }

  /**
   * Returns the arguments the specified Hyperlambda can handle.
   */
  getArgumentsFromPath(path: string) {

    return new Observable<string>(observer => {
      this.httpService.post<any>('/magic/system/workflows/get-hyperlambda-arguments', {
        path,
      }).subscribe({

        next: (result: any) => {

          // Actual function invocation declaration.
          let func = '';

          // Verifying that file actually is a function.
          if (result.function === true) {

            // Building our AI function invocation declaration.
            func = result.description + '\n\n';
            func += '___\n';
            func += 'FUNCTION_INVOCATION[' + path + ']';
            if (result.args && result.args.length > 0) {
              func += ':\n';
              const tmpO = {};
              for (let idx = 0; idx < result.args.length; idx++) {
                tmpO[result.args[idx].name] = '[' + result.args[idx].type.toUpperCase() + '_VALUE]';
              }
              func += JSON.stringify(tmpO, null, 2) + '\n___\n\n### Description of arguments:\n\n';
              let hasSeenCrudFiltering = false;
              for (let idx = 0; idx < result.args.length; idx++) {
                const splits = result.args[idx].name.split('.');
                let add = true;
                switch (splits[splits.length - 1]) {
                  case 'eq':
                  case 'neq':
                  case 'like':
                  case 'mt':
                  case 'lt':
                  case 'mteq':
                  case 'lteq':
                    hasSeenCrudFiltering = true;
                    add = splits.length === 1;
                    break;
                }
                if (add) {
                  func += '* ' + result.args[idx].name;
                  if (result.args[idx].description) {
                    func += ' - ' + result.args[idx].description;
                  }
                  func += '\n';
                }
              }
              if (hasSeenCrudFiltering) {
                func += `
If any of the other arguments ends with:

* lt it implies 'less than'
* mt it implies 'more than'
* lteq it implies 'less than or equal to'
* mteq it implies 'more than or equal to'
* eq it implies 'equals to'
* neq it implies 'not equal to'
* like it implies a LIKE SQL type of query, with % being wildcard character
`;
              }
              func = func.trimEnd()
            } else {
              func += '\n___';
            }
            func = func.trim();
          }

          observer.next(func);
          observer.complete();
        },

        error: (error: any) => {

          observer.error(error);
          observer.complete();
        }
      });
    });
  }
}

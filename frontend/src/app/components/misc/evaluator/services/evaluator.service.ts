
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { Response } from '../../../../models/response.model';
import { HttpService } from '../../../../_general/services/http.service';
import { FileService } from 'src/app/services--/file.service';

/**
 * Hyperlambda evaluator service allowing you to evaluate Hyperlambda in
 * your backend.
 */
@Injectable({
  providedIn: 'root'
})
export class EvaluatorService {

  /**
   * Creates an instance of your service.
   *
   * @param httpService HTTP service to use for backend invocations
   * @param fileService Used to retrieve and update snippets from your backend
   */
  constructor(
    private httpService: HttpService,
    private fileService: FileService) { }

  /**
   * Evaluates a piece of Hyperlambda and returns its result.
   *
   * @param hyperlambda Hyperlambda to evaluate
   */
  execute(hyperlambda: string) {
    return this.httpService.post<Response>('/magic/system/evaluator/evaluate', {
      hyperlambda
    });
  }

  /**
   * Returns a list of all Hyperlambda snippets the backend has stored.
   */
  snippets() {
    return this.fileService.listFiles('/etc/snippets/');
  }

  /**
   * Loads a snippet from the backend.
   *
   * @param filename Filename (only, no extension or folder) of snippet to load
   */
  loadSnippet(filename: string) {
    if (filename.indexOf('/') !== -1) {
      return throwError(() => new Error('Not a valid filename'));
    }
    filename = '/etc/snippets/' + filename;
    if (!filename.endsWith('.hl')) {
      filename += '.hl';
    }
    return this.fileService.loadFile(filename);
  }

  /**
   * Saves the specified snippet according to the specified argument.
   *
   * @param filename Filename to save snippet as. Notice, assumes we're only given the filename, and not the entire path. The service is responsible for prepending the folder.
   * @param content Content of snippet
   */
  saveSnippet(filename: string, content: string) {
    if (filename.indexOf('/') !== -1) {
      return throwError(() => new Error('Not a valid filename'));
    }
    filename = '/etc/snippets/' + filename;
    if (!filename.endsWith('.hl')) {
      filename += '.hl';
    }
    return this.fileService.saveFile(filename, content);
  }
}

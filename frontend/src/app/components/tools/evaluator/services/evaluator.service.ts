
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { FileService } from 'src/app/services/tools/file.service';
import { Response } from '../../../../models/response.model';
import { HttpService } from '../../../../services/http.service';

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
  public execute(hyperlambda: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<Response>('/magic/system/evaluator/evaluate', {
      hyperlambda
    });
  }

  /**
   * Returns a list of all Hyperlambda snippets the backend has stored.
   */
  public snippets() {
    return this.fileService.listFiles('/etc/snippets/');
  }

  /**
   * Loads a snippet from the backend.
   * 
   * @param filename Filename (only, no extension or folder) of snippet to load
   */
  public loadSnippet(filename: string) {

    // Sanity checking invocation.
    if (filename.indexOf('/') !== -1) {
      throw throwError('Please provide me with only the filename, and not the folder');
    }

    // Making sure we use the correct folder.
    filename = '/etc/snippets/' + filename;
    if (!filename.endsWith('.hl')) {
      filename += '.hl';
    }

    // Returning result of invocation to file service.
    return this.fileService.loadFile(filename);
  }

  /**
   * Saves the specified snippet according to the specified argument.
   * 
   * @param filename Filename to save snippet as. Notice, assumes we're only given the filename, and not the entire path. The service is responsible for prepending the folder.
   * @param content Content of snippet
   */
  public saveSnippet(filename: string, content: string) {

    // Sanity checking invocation.
    if (filename.indexOf('/') !== -1) {
      throw throwError('Please provide me with only the filename, and not the folder');
    }

    // Making sure we put our file into the correct folder.
    filename = '/etc/snippets/' + filename;
    if (!filename.endsWith('.hl')) {
      filename += '.hl';
    }

    // Returning result of invocation to file service.
    return this.fileService.saveFile(filename, content);
  }
}

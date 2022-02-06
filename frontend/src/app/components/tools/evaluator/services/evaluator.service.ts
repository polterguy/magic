
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

// Application specific imports.
import { HttpService } from '../../../../services/http.service';
import { FileService } from '../../../files/services/file.service';
import { Response } from '../../../../models/response.model';

/**
 * Hyperlambda evaluator service allowing you to evaluate Hyperlambda in
 * your backend.
 */
@Injectable({
  providedIn: 'root'
})
export class EvaluatorService {

  // Used to 'cache' the server's vocabulary.
  private _vocabulary: string[] = [];

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
   * Returns server's Hyperlambda vocabulary to caller.
   */
  public vocabulary() {

    // Checking if we've already got the server's vocabulary.
    if (this._vocabulary.length > 0) {
      of(this._vocabulary); // Returning 'cache' result.
    }

    // Creating a new observable such that we can store the vocabulary in a field.
    return new Observable<string[]>((observer) => {

      // Invoking backend.
      this.httpService.get<string[]>('/magic/system/evaluator/vocabulary').subscribe((vocabulary: string[]) => {
        this._vocabulary = vocabulary;
        observer.next(vocabulary);
        observer.complete();
      }, (error: any) => {
        observer.error(error);
        observer.complete();
      });
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

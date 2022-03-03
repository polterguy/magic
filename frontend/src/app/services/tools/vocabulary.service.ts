
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from '../http.service';

/**
 * Hyperlambda vocabulary service allowiung you to apply autocomplete on Hyperlambda
 * CodeMirror instances.
 */
@Injectable({
  providedIn: 'root'
})
export class VocabularyService {

  // Used to 'cache' the server's vocabulary.
  private _vocabulary: string[] = [];

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

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
}

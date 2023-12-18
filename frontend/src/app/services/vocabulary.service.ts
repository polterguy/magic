
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/services/http.service';

// Application specific imports.

/**
 * Hyperlambda vocabulary service allowing you to retrieve all Hyperlambda slots existing in your backend.
 */
@Injectable({
  providedIn: 'root'
})
export class VocabularyService {

  private _vocabulary: string[] = [];

  /**
   * Creates an instance of your service.
   *
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

  /**
   * Returns all Hyperlambda keywords in context to caller.
   */
  get words() {

    return this._vocabulary;
  }

  /**
   * Returns server's Hyperlambda vocabulary to caller.
   */
  vocabulary() {

    if (this._vocabulary.length > 0) {
      of(this._vocabulary);
    }

    return new Observable<{vocabulary: string[], slots: string[]}>((observer) => {

      this.httpService.get<string[]>('/magic/system/evaluator/vocabulary').subscribe({
        next: (vocabulary: string[]) => {

          this._vocabulary = vocabulary;

          this.httpService.get<string[]>('/magic/system/evaluator/slots').subscribe({
            next: (slots: string[]) => {
    
              observer.next({vocabulary, slots});
              observer.complete();
            },
            error: (error: any) => {
    
              observer.error(error);
              observer.complete();
            }
          });
        },
        error: (error: any) => {

          observer.error(error);
          observer.complete();
        }
      });
    });
  }
}

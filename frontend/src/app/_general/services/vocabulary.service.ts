
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/_general/services/http.service';

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

    return new Observable<string[]>((observer) => {

      this.httpService.get<string[]>('/magic/system/evaluator/vocabulary').subscribe({
        next: (vocabulary: string[]) => {

          this._vocabulary = vocabulary;
          observer.next(vocabulary);
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

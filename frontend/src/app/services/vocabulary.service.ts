
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from '../_general/services/http.service';

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

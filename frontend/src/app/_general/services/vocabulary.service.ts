
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpService } from './http.service';

// Application specific imports.

/**
 * Hyperlambda vocabulary service allowing you to retrieve all Hyperlambda slots existing in your backend.
 */
@Injectable({
  providedIn: 'root'
})
export class VocabularyService {

  private _vocabulary: string[] = [];

  constructor(private httpService: HttpService) { }

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


/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from './http.service';
import { FileService } from './file.service';
import { Response } from '../models/response.model';

/**
 * Setup service, allows you to setup, read, and manipulate your configuration
 * settings.
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
    return this.httpService.post<Response>('/magic/modules/system/evaluator/evaluate', {
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
      this.httpService.get<string[]>('/magic/modules/system/evaluator/vocabulary').subscribe((vocabulary: string[]) => {
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
    return this.fileService.listFiles('/misc/snippets/');
  }
}

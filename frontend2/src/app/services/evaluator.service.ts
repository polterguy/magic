
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from './http.service';
import { Response } from '../models/response.model';

/**
 * Setup service, allows you to setup, read, and manipulate your configuration
 * settings.
 */
@Injectable({
  providedIn: 'root'
})
export class EvaluatorService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

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
}


/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse
} from "@angular/common/http";
import { throwError, Observable } from "rxjs";
import { catchError, finalize, map } from 'rxjs/operators';
import { GeneralService } from '../services/general.service';

@Injectable()
export class NetworkInterceptor implements HttpInterceptor {

  constructor(private generalService: GeneralService) { }

  intercept(request: HttpRequest<Response>, next: HttpHandler): Observable<HttpEvent<Response>> {
    /**
     * displaying loading progress bar
     * will be triggered on all http requests
     */
    this.generalService.showLoading();

    /**
     * TODO::: correction of error messages
     */
    return next.handle(request)
      .pipe(
        map(res => {
          return res
        }),
        catchError((error: HttpErrorResponse) => {
          let errorMsg = '';

          errorMsg = error.error.message || "Guru meditation, come back when Universe is in order!";
          this.generalService.showFeedback(errorMsg)

          return throwError(() => new Error(errorMsg))
        }),
        finalize(() => {
          // hide the loading progress bar
          this.generalService.hideLoading();
        }));
  }
}

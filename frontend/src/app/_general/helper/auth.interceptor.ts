
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private router: Router) { }

  handleError(error: HttpErrorResponse) {
    if (window.location.pathname !== '/authentication') {
      if (error.status === 401) {
        // this.authService.setJwtToken();
        this.router.navigateByUrl('/authentication');
      }
    }
    return throwError(() => error);
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let clone: any = request;
    return next.handle(clone)
      .pipe(
        catchError(err => this.handleError(err))
      );
  }
}

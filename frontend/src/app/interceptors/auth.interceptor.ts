
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest
} from '@angular/common/http';
import { BackendsStorageService } from '../services/backendsstorage.service';

/**
 * HTTP client Authorization interceptor, to attach JWT token to all HTTP requests.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {

  /**
   * Creates an instance of your service.
   *
   * @param backendsStorageService Needed to figure out which JWT token to associate with request, if any
   */
  constructor(private backendsStorageService: BackendsStorageService) { }

  /**
   * Intercepts all HTTP requests to associate an Authorization
   * HTTP header with the request, if possible.
   *
   * @param req HTTP request
   * @param next Next handler
   */
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const backends = this.backendsStorageService.backends.filter(x => req.url.startsWith(x.url));
    if (backends.length > 0 && backends[0]?.token?.expired === false) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', 'Bearer ' + backends[0].token.token)
      });
      return next.handle(authReq);

    } else {
      return next.handle(req);
    }
  }
}

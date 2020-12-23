
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest
} from '@angular/common/http';
import { BackendService } from '../backend.service';

/**
 * HTTP client Authorization interceptor, to attach JWT token to all HTTP requests.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {

  constructor(private backendService: BackendService) { }

  /**
   * Intercepts all HTTP requests to associate an Authorization
   * HTTP header with the request, if possible.
   * 
   * @param req HTTP request
   * @param next Next handler
   */
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler) {

    // Verifying we have a JWT token for current backend.
    const token = this.backendService.current.token;
    if (token) {

      // Clonging HTTP request, adding Authorisation header, and invoking next interceptor.
      const authReq = req.clone({headers: req.headers.set('Authorization', 'Bearer ' + token)});
      return next.handle(authReq);

    } else {

      // No token, hence simply invoking next interceptor without doing anything.
      return next.handle(req);
    }
  }
}
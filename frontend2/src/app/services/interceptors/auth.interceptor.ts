
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest
} from '@angular/common/http';
import { AuthService } from '../auth.service';
import { BackendService } from '../backend.service';

/**
 * HTTP client Authorization interceptor, to attach JWT token to all HTTP requests.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private backendService: BackendService) { }

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
    if (req.headers.has('Authorization')) {
      return next.handle(req);
    } else {
      const token = this.backendService.current.token;
      if (token) {
        const authReq = req.clone({headers: req.headers.set('Authorization', 'Bearer ' + token)});
        return next.handle(authReq);
      } else {
        return next.handle(req);
      }
    }
  }
}
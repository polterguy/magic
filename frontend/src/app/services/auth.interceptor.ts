
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular imports.
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest
} from '@angular/common/http';

// Application specific imports.
import { BackendService } from './backend.service';
import { MessageService } from './message.service';
import { Messages } from '../models/messages.model';

/**
 * HTTP client Authorization interceptor, to attach JWT token to all HTTP requests.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private backendService: BackendService,
    private messageService: MessageService) { }

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

      /*
       * Verifying token is not expired.
       * Notice, token might expire before we refresh token,
       * if for instance the refresh JWT token timer does not fire,
       * due to a develop machine having been hibernated, etc.
       */
      if (this.backendService.isTokenExpired(token)) {

        /*
         * Token was expired, nulling it, persisting backends,
         * and publishing logout message to other parts of the system.
         */
        this.backendService.current.token = null;
        this.backendService.persistBackends();
        this.messageService.sendMessage({
          name: Messages.USER_LOGGED_OUT,
        });

        // Making sure current invocation resolves to an error.
        return throwError('JWT token expired');
      }

      // Cloning HTTP request, adding Authorisation header, and invoking next in chain.
      const authReq = req.clone({
        headers: req.headers.set('Authorization', 'Bearer ' + token)
      });
      return next.handle(authReq);

    } else {

      /*
       * No token for invocation, hence simply invoking next
       * interceptor without doing anything.
       */
      return next.handle(req);
    }
  }
}
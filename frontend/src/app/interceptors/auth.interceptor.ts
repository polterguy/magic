
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest
} from '@angular/common/http';

// Application specific imports.
import { Backend } from '../models/backend.model';
import { Messages } from '../models/messages.model';
import { BackendService } from '../services/backend.service';
import { MessageService } from '../services/message.service';

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
   * @param backendService Needed to retrieve which backend we're actually using
   * @param messageService Needed to publish messages about authentication events
   */
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

    // Figuring out JWT token to use for invocation, if any.
    let backend: Backend = null;
    for (const idx of this.backendService.backends) {
      if (req.url.startsWith(idx.url)) {
        backend = idx;
      }
    }
    if (backend && backend.token) {

      /*
       * Verifying token is not expired.
       * Notice, token might expire before we refresh token,
       * if for instance the refresh JWT token timer does not fire,
       * due to a develop machine having been hibernated, etc.
       */
      if (backend.token.expired) {

        /*
         * Token was expired, nulling it, persisting backends,
         * and publishing logout message to other parts of the system.
         */
        backend.token = null;
        this.backendService.persistBackends();
        this.messageService.sendMessage({
          name: Messages.USER_LOGGED_OUT,
        });

        // Making sure current invocation resolves to an error.
        return throwError('JWT token expired');
      }

      // Cloning HTTP request, adding Authorisation header, and invoking next in chain.
      const authReq = req.clone({
        headers: req.headers.set('Authorization', 'Bearer ' + backend.token.token)
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

/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest
} from '@angular/common/http';

// Application specific imports.
import { Backend } from '../models/backend.model';
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
   * @param backendsListService Needed to figure out which JWT token to associate with request, if any
   */
  constructor(private backendsListService: BackendsStorageService) { }

  /**
   * Intercepts all HTTP requests to associate an Authorization
   * HTTP header with the request, if possible.
   * 
   * @param req HTTP request
   * @param next Next handler
   */
  intercept(req: HttpRequest<any>, next: HttpHandler) {

    // Figuring out JWT token to use for invocation, if any.
    let backend: Backend = null;
    for (const idx of this.backendsListService.backends) {
      if (req.url.startsWith(idx.url)) {
        backend = idx;
      }
    }
    if (backend?.token?.expired === false) {

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
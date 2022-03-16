
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Inject, Injectable, Injector } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest
} from '@angular/common/http';

// Application specific imports.
import { Backend } from '../models/backend.model';
import { BackendService } from '../services/backend.service';

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
   * @param injector Needed to resolve BackendService while avoiding circular DI dependencies
   */
  constructor(@Inject(Injector) private readonly injector: Injector) { }

  /**
   * Intercepts all HTTP requests to associate an Authorization
   * HTTP header with the request, if possible.
   * 
   * @param req HTTP request
   * @param next Next handler
   */
  intercept(req: HttpRequest<any>, next: HttpHandler) {

    // Retrieving backend service.
    const backendService = this.injector.get(BackendService);

    // Figuring out JWT token to use for invocation, if any.
    let backend: Backend = null;
    for (const idx of backendService.backends) {
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
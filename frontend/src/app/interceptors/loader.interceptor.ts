
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

// Angular imports.
import { Injectable } from "@angular/core";
import { tap, catchError } from 'rxjs/operators';
import {
  HttpRequest,
  HttpHandler,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';

// Application specific imports.
import { GeneralService } from "../_general/services/general.service";

/**
 * Our HTTP interceptor that changes the LoaderService's state according to whether or not
 * an Ajax request is currently going towards your backend.
 */
@Injectable({
  providedIn: 'root'
})
export class LoaderInterceptor implements HttpInterceptor {

  // We need to track how many "open" requests we currently have to support multiple requests at the same time.
  private static totalRequests = 0;

  /**
   * HTTP interceptor used to create Ajax loading animation during HTTP invocations
   * towards your backend.
   *
   * @param loadingService What loader service to use
   */
  constructor(public generalService: GeneralService) { }

  /**
   * Override from base class, actual implementation parts.
   *
   * @param request HTTP request for current instance
   * @param next Next handler for HTTP request
   */
  public intercept(request: HttpRequest<any>, next: HttpHandler) {
    this.increment();
    return next.handle(request).pipe(
      tap((res: any) => {
        if (res instanceof HttpResponse) {
          this.decrement();
        }
      }),
      catchError((err: any) => {
        this.decrement();
        throw err;
      })
    );
  }

  /**
   * Increments load count, and shows loader service
   * if this is the first increment.
   */
  public increment() {
    if (++LoaderInterceptor.totalRequests === 1) {
      this.generalService.showLoading();
    }
  }

  /**
   * Decrements the number of active requests, and if there are no
   * more requests we hide the loading service.
   */
  public decrement() {
    LoaderInterceptor.totalRequests = Math.max(--LoaderInterceptor.totalRequests, 0);
    if (LoaderInterceptor.totalRequests === 0) {
      this.generalService.hideLoading();
    }
  }

  /**
   * Forces the Ajax loader to become invisible.
   */
  public forceHide() {
    LoaderInterceptor.totalRequests = 0;
    this.generalService.hideLoading();
  }
}

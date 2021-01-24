
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
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
import { LoaderService } from 'src/app/components/app/services/loader.service';

/**
 * Our HTTP interceptor that changes the LoaderService's state according to whether or not
 * an Ajax request is currently going towards your backend.
 */
@Injectable({
  providedIn: 'root'
})
export class LoaderInterceptor implements HttpInterceptor {

  /*
   * Notice, to support multiple requests,
   * we need to track how many "open" requests we currently have.
   */
  private static totalRequests = 0;

  /**
   * HTTP interceptor used to create Ajax loading animation during HTTP invocations
   * towards your backend.
   * 
   * @param loadingService What loader service to use
   */
  constructor(public loadingService: LoaderService) { }

  /**
   * Override from base class, actual implementation parts.
   * 
   * @param request HTTP request for current instance
   * @param next Next handler for HTTP request
   */
  public intercept(request: HttpRequest<any>, next: HttpHandler) {

    // Incrementing total number of requests, and making sure we show loading service.
    this.increment();

    // Making sure we decrease total number of requests, as the response is returned, or an error occurs.
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
      this.loadingService.show();
    }
  }

  /**
   * Decrements the number of active requests, and if there are no
   * more requests we hide the loading service.
   */
  public decrement() {

    /*
     * Decrementing total number of requests, and checking if
     * request count is zero, and if so, we hide the loader.
     */
    LoaderInterceptor.totalRequests = Math.max(--LoaderInterceptor.totalRequests, 0);
    if (LoaderInterceptor.totalRequests === 0) {
      this.loadingService.hide();
    }
  }

  /**
   * Forces the Ajax loader to become invisible.
   */
  public forceHide() {
    LoaderInterceptor.totalRequests = 0;
    this.loadingService.hide();
  }
}
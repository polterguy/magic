/*
 * Magic, Copyright(c) Thomas Hansen 2019, thomas@servergardens.com, all rights reserved.
 * See the enclosed LICENSE file for details.
 */

import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { LoaderService } from './loader-service';

/*
 * Our HTTP interceptor that change sthe LoaderService's state according to whether or not
 * an Ajax request is currently going towards your backend API.
 */
@Injectable()
export class LoaderInterceptor implements HttpInterceptor {

  // Notice, to support multiple requests, we need to track how many "open" requests we currently have.
  private totalRequests = 0;

  constructor(public loadingService: LoaderService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler) {
    const isCount = request.url.endsWith('-count');
    if (!isCount) {
      this.totalRequests++;
      this.loadingService.show();
    }
    return next.handle(request).pipe(
      tap(res => {
        if (res instanceof HttpResponse) {
          if (!isCount) {
            this.decreaseRequests();
          }
        }
      }),
      catchError(err => {
        if (!isCount) {
          this.decreaseRequests();
        }
        throw err;
      })
    );
  }

  private decreaseRequests() {
    this.totalRequests--;
    if (this.totalRequests === 0) {
      this.loadingService.hide();
    }
  }
}
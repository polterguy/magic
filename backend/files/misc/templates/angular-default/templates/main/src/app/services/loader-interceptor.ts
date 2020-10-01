import { Injectable } from "@angular/core";
import { tap, catchError } from 'rxjs/operators';
import { LoaderService } from './loader-service';
import { HttpRequest, HttpHandler, HttpInterceptor, HttpResponse } from '@angular/common/http';

/**
 * Our HTTP interceptor that changes the LoaderService's state according to whether or not
 * an Ajax request is currently going towards your backend.
 */
@Injectable()
export class LoaderInterceptor implements HttpInterceptor {

  // Notice, to support multiple requests, we need to track how many "open" requests we currently have.
  private totalRequests = 0;

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
    const isCount = request.url.endsWith('-count');
    if (!isCount) {
      this.totalRequests++;
      this.loadingService.show();
    }
    return next.handle(request).pipe(
      tap((res: any) => {
        if (res instanceof HttpResponse) {
          if (!isCount) {
            this.decreaseRequests();
          }
        }
      }),
      catchError((err: any) => {
        if (!isCount) {
          this.decreaseRequests();
        }
        throw err;
      })
    );
  }

  // Decrements the number of active requests, and if 0 hides the Ajax animation.
  private decreaseRequests() {
    this.totalRequests--;
    if (this.totalRequests === 0) {
      this.loadingService.hide();
    }
  }
}

import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { LoaderService } from './loader-service';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {

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
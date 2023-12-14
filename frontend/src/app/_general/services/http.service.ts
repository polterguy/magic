
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Application specific imports.
import { BackendService } from './backend.service';

/**
 * HTTP service for invoking endpoints towards your currently active backend.
 */
@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(
    private httpClient: HttpClient,
    private backendService: BackendService) { }

  get<MagicResponse>(url: string, requestOptions: object = null) {

    if (!this.backendService.active) {
      return throwError(() => new Error('Not connected to a backend'));
    } else {
      if (!requestOptions) {
        return this.httpClient.get<MagicResponse>(this.backendService.active.url + url);
      } else {
        return this.httpClient.get<MagicResponse>(this.backendService.active.url + url, requestOptions);
      }
    }
  }

  download(url: string) {

    if (!this.backendService.active) {
      return throwError(() => new Error('Not connected to a backend'));
    } else {
      return this.httpClient.get(this.backendService.active.url + url, {
        observe: 'response',
        responseType: 'arraybuffer',
      });
    }
  }

  downloadPost(url: string, args: any) {

    if (!this.backendService.active) {
      return throwError(() => new Error('Not connected to a backend'));
    } else {
      return this.httpClient.post(this.backendService.active.url + url,
        args, {
        observe: 'response',
        responseType: 'arraybuffer',
      });
    }
  }

  post<MagicResponse>(url: string, req: any, requestOptions: object = null) {

    if (!this.backendService.active) {
      return throwError(() => new Error('Not connected to a backend'));
    } else {
      if (!requestOptions) {
        return this.httpClient.post<MagicResponse>(this.backendService.active.url + url, req);
      } else {
        return this.httpClient.post<MagicResponse>(this.backendService.active.url + url, req, requestOptions);
      }
    }
  }

  put<MagicResponse>(url: string, req: any, requestOptions: object = null) {

    if (!this.backendService.active) {
      return throwError(() => new Error('Not connected to a backend'));
    } else {
      if (!requestOptions) {
        return this.httpClient.put<MagicResponse>(this.backendService.active.url + url, req);
      } else {
        return this.httpClient.put<MagicResponse>(this.backendService.active.url + url, req, requestOptions);
      }
    }
  }

  patch<MagicResponse>(url: string, req: any, requestOptions: object = null) {

    if (!this.backendService.active) {
      return throwError(() => new Error('Not connected to a backend'));
    } else {
      if (!requestOptions) {
        return this.httpClient.patch<MagicResponse>(this.backendService.active.url + url, req);
      } else {
        return this.httpClient.patch<MagicResponse>(this.backendService.active.url + url, req, requestOptions);
      }
    }
  }

  delete<MagicResponse>(url: string, requestOptions: object = null) {

    if (!this.backendService.active) {
      return throwError(() => new Error('Not connected to a backend'));
    } else {
      if (!requestOptions) {
        return this.httpClient.delete<MagicResponse>(this.backendService.active.url + url);
      } else {
        return this.httpClient.delete<MagicResponse>(this.backendService.active.url + url, requestOptions);
      }
    }
  }
}

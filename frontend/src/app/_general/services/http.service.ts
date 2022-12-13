
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
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

  /**
   * Creates an instance of your service.
   *
   * @param httpClient HTTP client to use for HTTP invocations
   * @param backendService Backend service keeping track of currently connected backend
   */
  constructor(
    private httpClient: HttpClient,
    private backendService: BackendService) { }

  /**
   * Invokes the HTTP GET verb towards your specified URL
   * in your currently selected backend, and returns the result.
   *
   * @param url Backend URL to endpoint
   * @param requestOptions Request options for invocation
   */
  get<Response>(url: string, requestOptions: object = null) {
    if (!this.backendService.active) {
      return throwError(() => new Error('Not connected to a backend'));
    } else {
      if (!requestOptions) {
        return this.httpClient.get<Response>(this.backendService.active.url + url);
      } else {
        return this.httpClient.get<Response>(this.backendService.active.url + url, requestOptions);
      }
    }
  }

  /**
   * Invokes the HTTP GET verb towards your specified URL
   * in your currently selected backend, and returns the result.
   *
   * @param url Backend URL to endpoint
   */
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

  /**
   * Invokes the HTTP GET verb towards your specified URL
   * in your currently selected backend, and returns the result.
   *
   * @param url Backend URL to endpoint
   * @param args Payload to invocation
   */
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

  /**
   * Invokes the HTTP POST verb towards your specified URL
   * in your currently selected backend, passing in the specified
   * payload, and returns the result.
   *
   * @param url Backend URL of endpoint
   * @param req Request payload to post
   * @param requestOptions Request options for invocation
   */
  post<Response>(url: string, req: any, requestOptions: object = null) {
    if (!this.backendService.active) {
      return throwError(() => new Error('Not connected to a backend'));
    } else {
      if (!requestOptions) {
        return this.httpClient.post<Response>(this.backendService.active.url + url, req);
      } else {
        return this.httpClient.post<Response>(this.backendService.active.url + url, req, requestOptions);
      }
    }
  }

  /**
   * Invokes the HTTP PUT verb towards your specified URL
   * in your currently selected backend, passing in the specified
   * payload, and returns the result.
   *
   * @param url Backend URL of endpoint
   * @param req Request payload to post
   * @param requestOptions Request options for invocation
   */
  put<Response>(url: string, req: any, requestOptions: object = null) {
    if (!this.backendService.active) {
      return throwError(() => new Error('Not connected to a backend'));
    } else {
      if (!requestOptions) {
        return this.httpClient.put<Response>(this.backendService.active.url + url, req);
      } else {
        return this.httpClient.put<Response>(this.backendService.active.url + url, req, requestOptions);
      }
    }
  }

  /**
   * Invokes the HTTP PATCH verb towards your specified URL
   * in your currently selected backend, passing in the specified
   * payload, and returns the result.
   *
   * @param url Backend URL of endpoint
   * @param req Request payload to post
   * @param requestOptions Request options for invocation
   */
  patch<Response>(url: string, req: any, requestOptions: object = null) {
    if (!this.backendService.active) {
      return throwError(() => new Error('Not connected to a backend'));
    } else {
      if (!requestOptions) {
        return this.httpClient.patch<Response>(this.backendService.active.url + url, req);
      } else {
        return this.httpClient.patch<Response>(this.backendService.active.url + url, req, requestOptions);
      }
    }
  }

  /**
   * Invokes the HTTP DELETE verb towards your specified URL
   * in your currently selected backend, and returns the result.
   *
   * @param url Backend URL to endpoint
   * @param requestOptions Request options for invocation
   */
  delete<Response>(url: string, requestOptions: object = null) {
    if (!this.backendService.active) {
      return throwError(() => new Error('Not connected to a backend'));
    } else {
      if (!requestOptions) {
        return this.httpClient.delete<Response>(this.backendService.active.url + url);
      } else {
        return this.httpClient.delete<Response>(this.backendService.active.url + url, requestOptions);
      }
    }
  }
}

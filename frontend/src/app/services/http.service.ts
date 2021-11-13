
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
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
  public get<Response>(url: string, requestOptions: object = null) {

    // Making sure we're connected to a backend, and if not, resolving observable to its error callback.
    if (!this.backendService.connected) {

      // Oops, not connected to any backends.
      throw throwError('Not connected to any backend, please choose a backend before trying to invoke endpoints');

    } else {

      // Invoking backend's URL.
      if (!requestOptions) {
        return this.httpClient.get<Response>(this.backendService.current.url + url);
      } else {
        return this.httpClient.get<Response>(this.backendService.current.url + url, requestOptions);
      }
    }
  }

  /**
   * Invokes the HTTP GET verb towards your specified URL
   * in your currently selected backend, and returns the result.
   * 
   * @param url Backend URL to endpoint
   */
  public download(url: string) {

    // Making sure we're connected to a backend, and if not, resolving observable to its error callback.
    if (!this.backendService.connected) {

      // Oops, not connected to any backends.
      throw throwError('Not connected to any backend, please choose a backend before trying to invoke endpoints');

    } else {

      // Invoking backend's URL and resolving to the next subscriber.
      return this.httpClient.get(this.backendService.current.url + url, {
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
  public downloadPost(url: string, args: any) {

    // Making sure we're connected to a backend, and if not, resolving observable to its error callback.
    if (!this.backendService.connected) {

      // Oops, not connected to any backends.
      throw throwError('Not connected to any backend, please choose a backend before trying to invoke endpoints');

    } else {

      // Invoking backend's URL and resolving to the next subscriber.
      return this.httpClient.post(this.backendService.current.url + url,
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
  public post<Response>(url: string, req: any, requestOptions: object = null) {

    // Making sure we're connected to a backend, and if not, resolving observable to its error callback.
    if (!this.backendService.connected) {

      // Oops, not connected to any backends.
      throw throwError('Not connected to any backend, please choose a backend before trying to invoke endpoints');

    } else {

      // Invoking backend's URL.
      if (!requestOptions) {
        return this.httpClient.post<Response>(this.backendService.current.url + url, req);
      } else {
        return this.httpClient.post<Response>(this.backendService.current.url + url, req, requestOptions);
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
  public put<Response>(url: string, req: any, requestOptions: object = null) {

    // Making sure we're connected to a backend, and if not, resolving observable to its error callback.
    if (!this.backendService.connected) {

      // Oops, not connected to any backends.
      throw throwError('Not connected to any backend, please choose a backend before trying to invoke endpoints');

    } else {

      // Invoking backend's URL.
      if (!requestOptions) {
        return this.httpClient.put<Response>(this.backendService.current.url + url, req);
      } else {
        return this.httpClient.put<Response>(this.backendService.current.url + url, req, requestOptions);
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
  public patch<Response>(url: string, req: any, requestOptions: object = null) {

    // Making sure we're connected to a backend, and if not, resolving observable to its error callback.
    if (!this.backendService.connected) {

      // Oops, not connected to any backends.
      throw throwError('Not connected to any backend, please choose a backend before trying to invoke endpoints');

    } else {

      // Invoking backend's URL.
      if (!requestOptions) {
        return this.httpClient.patch<Response>(this.backendService.current.url + url, req);
      } else {
        return this.httpClient.patch<Response>(this.backendService.current.url + url, req, requestOptions);
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
  public delete<Response>(url: string, requestOptions: object = null) {

    // Making sure we're connected to a backend, and if not, resolving observable to its error callback.
    if (!this.backendService.connected) {

      // Oops, not connected to any backends.
      throw throwError('Not connected to any backend, please choose a backend before trying to invoke endpoints');

    } else {

      // Invoking backend's URL.
      if (!requestOptions) {
        return this.httpClient.delete<Response>(this.backendService.current.url + url);
      } else {
        return this.httpClient.delete<Response>(this.backendService.current.url + url, requestOptions);
      }
    }
  }
}

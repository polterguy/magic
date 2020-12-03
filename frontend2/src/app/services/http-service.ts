
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Application specific imports.
import { AuthService } from './auth.service';

/**
 * HTTP service for invoking endpoints towards your currently active backend.
 */
@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(
    private httpClient: HttpClient,
    private authService: AuthService) { }

    /**
     * Invokes the HTTP GET verb towards your specified URL
     * in your currently selected backend, and returns the result.
     * 
     * @param url Backend URL to endpoint
     */
  public get<Response>(url: string) {
    return new Observable<Response>(observer => {

      // Sanity checking invocation
      if (!this.authService.connected) {
        observer.error('Not connected to any backend, please choose or configure a backend before trying to invoke your backend');
        observer.complete();
      } else {
        this.httpClient.get<Response>(this.authService.current.url + url).subscribe(res => {
          observer.next(res);
          observer.complete();
        });
      }
    });
  }

  /**
     * Invokes the HTTP POST verb towards your specified URL
     * in your currently selected backend, passing in the specified
     * payload, and returns the result.
     * 
   * @param url Backend URL of endpoint
   * @param req Request payload to post
   */
  public post<Request, Response>(url: string, req: Request) {
    return new Observable<Response>(observer => {

      // Sanity checking invocation
      if (!this.authService.connected) {
        observer.error('Not connected to any backend, please choose or configure a backend before trying to invoke your backend');
        observer.complete();
      } else {
        this.httpClient.post<Response>(this.authService.current.url + url, req).subscribe(res => {
          observer.next(res);
          observer.complete();
        });
      }
    });
  }

  /**
     * Invokes the HTTP PUT verb towards your specified URL
     * in your currently selected backend, passing in the specified
     * payload, and returns the result.
     * 
   * @param url Backend URL of endpoint
   * @param req Request payload to post
   */
  public put<Request, Response>(url: string, req: Request) {
    return new Observable<Response>(observer => {

      // Sanity checking invocation
      if (!this.authService.connected) {
        observer.error('Not connected to any backend, please choose or configure a backend before trying to invoke your backend');
        observer.complete();
      } else {
        this.httpClient.put<Response>(this.authService.current.url + url, req).subscribe(res => {
          observer.next(res);
          observer.complete();
        });
      }
    });
  }

    /**
     * Invokes the HTTP DELETE verb towards your specified URL
     * in your currently selected backend, and returns the result.
     * 
     * @param url Backend URL to endpoint
     */
    public delete<Response>(url: string) {
      return new Observable<Response>(observer => {
  
        // Sanity checking invocation
        if (!this.authService.connected) {
          observer.error('Not connected to any backend, please choose or configure a backend before trying to invoke your backend');
          observer.complete();
        } else {
          this.httpClient.delete<Response>(this.authService.current.url + url).subscribe(res => {
            observer.next(res);
            observer.complete();
          });
        }
      });
    }
  }

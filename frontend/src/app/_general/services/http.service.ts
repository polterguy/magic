
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private http: HttpClient) { }

  // public get(url: string, data?: any, responseType: any = 'json'): Observable<any> {
  //   if (data) {
  //     return this.http.get(environment.backendUrl + url + data, { responseType: responseType });
  //   } else {
  //     return this.http.get(environment.backendUrl + url, { responseType: responseType });
  //   }
  // }
  // public post(url: string, data?: any, options?: any): Observable<any> {
  //   return this.http.post(environment.backendUrl + url, data, options);
  // }
  // public put(url: string, data: any, options?: any): Observable<any> {
  //   return this.http.put(environment.backendUrl + url, data, options);
  // }
  // public delete(url: string, data?: any): Observable<any> {
  //   return this.http.delete(environment.backendUrl + url, data);
  // }
}

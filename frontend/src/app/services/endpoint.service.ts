
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/services/http.service';

// Application specific imports.
import { Endpoint } from '../models/endpoint.model';

/**
 * Endpoint service, allowing you to retrieve meta data about your endpoints,
 * and invoke them generically.
 */
@Injectable({
  providedIn: 'root'
})
export class EndpointService {

  constructor(private httpService: HttpService) { }

  endpoints() {

    return this.httpService.get<Endpoint[]>('/magic/system/endpoints/list');
  }

  /**
   * Invokes URL using HTTP GET verb.
   */
  get(url: string, responseType: string = 'json') {

    return this.httpService.get<any>(url, {
      observe: 'response',
      responseType,
    });
  }

  /**
   * Invokes URL using HTTP DELETE verb.
   */
  delete(url: string, responseType: string = 'json') {

    return this.httpService.delete<any>(url, {
      observe: 'response',
      responseType,
    });
  }

  /**
   * Invokes URL using HTTP POST verb.
   */
  post(url: string, args: any, responseType: string = 'json') {

    return this.httpService.post<any>(url, args, {
      observe: 'response',
      responseType,
    });
  }

  /**
   * Invokes URL using HTTP PUT verb.
   */
  put(url: string, args: any, responseType: string = 'json') {

    return this.httpService.put<any>(url, args, {
      observe: 'response',
      responseType,
    });
  }

  /**
   * Invokes URL using HTTP PATCH verb.
   */
  patch(url: string, args: any, responseType: string = 'json') {

    return this.httpService.patch<any>(url, args, {
      observe: 'response',
      responseType,
    });
  }

  /**
   * Returns OpenAPI specification for the specified folder.
   */
  getOpenAPISpecification(folder: string) {

    return this.httpService.get<any>('/magic/system/endpoints/openapi?system=true&filter=' + encodeURIComponent(folder));
  }
}

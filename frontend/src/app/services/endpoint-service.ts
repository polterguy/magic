
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Endpoint } from '../models/endpoint';

@Injectable({
  providedIn: 'root'
})
export class EndpointService {

  constructor(private httpClient: HttpClient) { }

  public getAllEndpoints() {
    return this.httpClient.get<Endpoint[]>(environment.apiURL + 'magic/modules/system/endpoints/endpoints');
  }

  getEndpointMeta(url: string, verb: string) {
    return this.httpClient.get<any>(
      environment.apiURL +
      'magic/modules/system/endpoints/endpoint?url=' + encodeURI(url) +
      '&verb=' + encodeURI(verb));
  }

  executeGet(url: string) {
    return this.httpClient.get<any>(environment.apiURL + url);
  }

  executeDelete(url: string) {
    return this.httpClient.delete<any>(environment.apiURL + 'magic/modules/' + url);
  }

  executePost(url: string, args: any) {
    return this.httpClient.post<any>(environment.apiURL + 'magic/modules/' + url, args);
  }

  executePut(url: string, args: any) {
    return this.httpClient.put<any>(environment.apiURL + 'magic/modules/' + url, args);
  }
}

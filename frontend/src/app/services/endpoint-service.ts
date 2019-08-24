
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EndpointService {

  constructor(private httpClient: HttpClient) { }

  public getAllEndpoints() {
    return this.httpClient.get<string[]>(environment.apiURL + 'hl/system/endpoints');
  }

  getEndpointMeta(url: string, verb: string) {
    return this.httpClient.get<any>(
      environment.apiURL +
      'hl/system/endpoint?url=' + encodeURI(url) +
      '&verb=' + encodeURI(verb));
  }

  executeGet(url: string) {
    return this.httpClient.get<any>(environment.apiURL + 'hl/' + url);
  }

  executeDelete(url: string) {
    return this.httpClient.delete<any>(environment.apiURL + 'hl/' + url);
  }

  executePost(url: string, args: any) {
    return this.httpClient.post<any>(environment.apiURL + 'hl/' + url, args);
  }

  executePut(url: string, args: any) {
    return this.httpClient.put<any>(environment.apiURL + 'hl/' + url, args);
  }
}

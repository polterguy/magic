import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EndpointService {

  constructor(private httpClient: HttpClient) { }

  public getAllEndpoints(): Observable<string[]> {
    return this.httpClient.get<string[]>(environment.apiURL + 'hl/system/endpoints');
  }
}

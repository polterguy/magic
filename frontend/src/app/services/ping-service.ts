
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PingService {

  constructor(private httpClient: HttpClient) { }

  public ping() {
    return this.httpClient.get<any>(environment.apiURL + 'magic/modules/system/ping');
  }

  public version() {
    return this.httpClient.get<any>(environment.apiURL + 'magic/modules/system/version');
  }
}

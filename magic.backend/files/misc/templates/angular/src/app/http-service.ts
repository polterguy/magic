
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private httpClient: HttpClient) { }

  authenticate(username: string, password: string) {
    return this.httpClient.get<any>(
      environment.apiURL +
      'magic/modules/system/auth/authenticate?username=' +
      encodeURI(username) +
      '&password=' +
      encodeURI(password));
  }

  refreshTicket() {
    return this.httpClient.get<any>(environment.apiURL + 'magic/modules/system/auth/refresh-ticket');
  }
  
  getQueryArgs(args: any) {
    let result = '';
    for(const idx in args) {
      if (Object.prototype.hasOwnProperty.call(args, idx)) {
        if (result === '') {
          result += '?';
        } else {
          result += '&';
        }
        result += idx + '=' + encodeURIComponent(args[idx]);
      }
    }
    return result;
  }[[service-endpoints]]
}

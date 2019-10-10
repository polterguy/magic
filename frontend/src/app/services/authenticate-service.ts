
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthenticateService {

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
}

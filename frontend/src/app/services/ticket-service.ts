
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable } from 'rxjs';

export interface AccessToken {
  ticket: string;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {

  constructor(
    private jwtHelper: JwtHelperService,
    private httpClient: HttpClient) { }

  getBackendUrl() {
    const url = localStorage.getItem('backendUrl');
    if (url !== null && url !== undefined) {
      return url;
    }
    return environment.apiURL; // Default
  }

  setBackendUrl(url: string) {
    localStorage.setItem('backendUrl', url);
  }

  getTicket() {

    // Checking local storage if it has an access token.
    const accessTokenString = localStorage.getItem('accessToken');
    if (accessTokenString === null || accessTokenString === undefined) {
      return null; // No token in local storage.
    }

    // Converting to object, and verifying ticket is not expired.
    const accessTokenObject = JSON.parse(accessTokenString) as AccessToken;
    if (this.jwtHelper.isTokenExpired(accessTokenObject.ticket)) {

      // Ticket is expired, making sure we remove it, and returning null.
      localStorage.removeItem('accessToken');
      return null;
    }
    return accessTokenObject.ticket;
  }

  hasTicket() {
    return this.getTicket() !== null;
  }

  logout() {
    localStorage.removeItem('accessToken');
  }

  hasDefaultRootPassword() {
    return localStorage.getItem('hasDefaultPassword') === 'true';
  }

  getExpirationSeconds() {
    const ticket = this.getTicket();
    if (ticket == null) {
      return -1;
    }
    const expiration = this.jwtHelper.getTokenExpirationDate(ticket);
    const now = new Date();
    return (expiration.getTime() - now.getTime()) / 1000;
  }

  authenticate(username: string, password: string): Observable<boolean> {
    localStorage.setItem('hasDefaultPassword', password === 'root' && username === 'root' ? 'true' : 'false');
    return new Observable<any>(observer => {
      this.httpClient.get<any>(
        environment.apiURL +
        'magic/modules/system/auth/authenticate?username=' +
        encodeURI(username) +
        '&password=' +
        encodeURI(password)).subscribe(res => {
          localStorage.setItem('accessToken', JSON.stringify(res));
          observer.next(res);
          observer.complete();
        }, error => {
          localStorage.removeItem('accessToken');
          console.error(error);
          observer.error(error);
          observer.complete();
        });
    });
  }

  refreshTicket(): Observable<boolean> {
    return new Observable<any>(observer => {
      this.httpClient.get<any>(
        environment.apiURL +
        'magic/modules/system/auth/refresh-ticket').subscribe(res => {
          localStorage.setItem('accessToken', JSON.stringify(res));
          observer.next(res);
          observer.complete();
        }, error => {
          localStorage.removeItem('accessToken');
          console.error(error);
          observer.error(error);
          observer.complete();
        });
    });
  }
}

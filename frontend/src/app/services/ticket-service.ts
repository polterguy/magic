
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
    private httpClient: HttpClient,
    private ticketService: TicketService) { }

  getBackendUrl(): string {
    const url = localStorage.getItem('backendUrl');
    if (url !== null && url !== undefined) {
      return url;
    }
    return environment.apiURL; // Default
  }

  setBackendUrl(url: string): void {
    localStorage.setItem('backendUrl', url);
  }

  getTicket(): string {

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

  hasTicket(): boolean {
    return this.getTicket() !== null;
  }

  logout(): void {
    localStorage.removeItem('accessToken');
  }

  hasDefaultRootPassword(): boolean {
    return localStorage.getItem('hasDefaultPassword') === 'true';
  }

  // Returns the number of seconds until JWT token expires, or -1 if no token exists in local storage.
  getExpirationSeconds(): number {
    const ticket = this.getTicket();
    if (ticket == null) {
      return -1;
    }
    const expiration = this.jwtHelper.getTokenExpirationDate(ticket);
    const now = new Date();
    return Math.max(-1, (expiration.getTime() - now.getTime()) / 1000);
  }

  getDefaultDatabaseType(): string {
    const db = localStorage.getItem('defaultDatabaseType');
    if (db !== null && db !== undefined) {
      return db;
    }
    return null;
  }

  authenticate(username: string, password: string): Observable<any> {

    // Storing whether or not the default password is still being used.
    localStorage.setItem('hasDefaultPassword', password === 'root' && username === 'root' ? 'true' : 'false');
    return new Observable<any>(observer => {
      this.httpClient.get<any>(
        this.ticketService.getBackendUrl() +
        'magic/modules/system/auth/authenticate?username=' +
        encodeURI(username) +
        '&password=' +
        encodeURI(password)).subscribe(authenticateUserResult => {

          // Storing JWT token, and signaling completion.
          localStorage.setItem('accessToken', JSON.stringify(authenticateUserResult));
          observer.next(authenticateUserResult);
          observer.complete();

          // If root password is not default, we retrieve the default database type from backend.
          if (!this.hasDefaultRootPassword()) {

            this.httpClient.get<any>(
              this.ticketService.getBackendUrl() +
              'magic/modules/system/sql/default-database-type').subscribe(databaseTypeResult => {
                localStorage.setItem('defaultDatabaseType', databaseTypeResult.type);
              });
          }

        }, error => {

          // Oops, error!
          localStorage.removeItem('accessToken');
          console.error(error);
          observer.error(error);
          observer.complete();
        });
    });
  }

  refreshTicket(): Observable<any> {
    return new Observable<any>(observer => {
      this.httpClient.get<any>(
        this.ticketService.getBackendUrl() +
        'magic/modules/system/auth/refresh-ticket').subscribe(refreshTicketResult => {

          // Storing JWT token, and signaling completion.
          localStorage.setItem('accessToken', JSON.stringify(refreshTicketResult));
          observer.next(refreshTicketResult);
          observer.complete();
        }, error => {

          // Oops, error!
          localStorage.removeItem('accessToken');
          console.error(error);
          observer.error(error);
          observer.complete();
        });
    });
  }
}

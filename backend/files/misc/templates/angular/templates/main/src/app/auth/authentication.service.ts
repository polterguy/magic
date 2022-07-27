import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticateToken } from '@app/services/models/authenticate-token';
import { environment } from '@env/environment';
import { Observable, of, Subscriber } from 'rxjs';

import { Credentials, CredentialsService } from './credentials.service';

export interface LoginContext {
  username: string;
  password: string;
  remember?: boolean;
}

/**
 * Provides a base for authentication workflow.
 * The login/logout methods should be replaced with proper implementation.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  constructor(
    private httpClient: HttpClient,
    private credentialsService: CredentialsService) {}

  /**
   * Authenticates the user.
   * @param context The login parameters.
   * @return The user credentials.
   */
  login(context: LoginContext): Observable<Credentials> {
    return new Observable<Credentials>((observer: Subscriber<Credentials>) => {
      this.httpClient.get<AuthenticateToken>(
        environment.apiUrl +
        'magic/system/auth/authenticate?username=' +
        encodeURIComponent(context.username) +
        '&password=' +
        encodeURIComponent(context.password)).subscribe((res: AuthenticateToken) => {

          // Success.
          const data = {
            username: context.username,
            token: res.ticket,
          };
          this.credentialsService.setCredentials(data, context.remember);
          observer.next(data);
          observer.complete();

        }, (error: any) => {

          // Error.
          observer.error(error);
          observer.complete();
        });
      });
  }

  /**
   * Logs out the user and clear credentials.
   * @return True if the user was logged out successfully.
   */
  logout(): Observable<boolean> {
    // Customize credentials invalidation here
    this.credentialsService.setCredentials();
    return of(true);
  }
}

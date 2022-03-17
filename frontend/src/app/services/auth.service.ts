
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';

// Application specific imports.
import { HttpService } from './http.service';
import { Backend } from '../models/backend.model';
import { BackendService } from './backend.service';
import { Response } from 'src/app/models/response.model';
import { AuthenticateResponse } from '../components/management/auth/models/authenticate-response.model';

/**
 * Authentication service allowing you to authenticate towards the active backend.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _authenticated = new BehaviorSubject<boolean>(undefined);

  /**
   * To allow consumers to subscribe to authentication status changes.
   */
  authenticatedChanged = this._authenticated.asObservable();

  /**
   * Creates an instance of your service.
   * 
   * @param httpClient Needed to check if specified backend supports auto-auth
   * @param httpService Needed to create requests towards currently activated backend
   * @param backendService Needed to retrieve currently activated backend
   */
  constructor(
    private httpClient: HttpClient,
    private httpService: HttpService,
    private backendService: BackendService) { }

  /**
   * Verifies validity of token by invoking backend.
   */
  verifyTokenForCurrent() {
    if (!this.backendService.active?.token) {
      return throwError(() => new Error('No token to verify'));
    }
    return this.httpService.get<Response>('/magic/system/auth/verify-ticket');
  }

  /**
   * Invokes specified backend to check if auto-auth has been turned on.
   * 
   * @param url URL of backend to check
   */
  autoAuth(url: string) {
    return this.httpClient.get<Response>(url.replace(/\s/g, '').replace(/(\/)+$/, '') + '/magic/system/auth/auto-auth');
  }

  /**
   * Authenticates user towards current backend.
   * 
   * @param username Username
   * @param password Password
   * @param storePassword Whether or not passsword should be persisted into local storage
   */
  loginToCurrent(username: string, password: string, storePassword: boolean) {
    return new Observable<AuthenticateResponse>(observer => {
      let query = '';
      if (username && username !== '') {
        query += '?username=' + encodeURIComponent(username);
        query += '&password=' + encodeURIComponent(password);
      }

      this.httpService.get<AuthenticateResponse>('/magic/system/auth/authenticate' + query, {

          /*
           * Notice, if we're doing Windows automatic authentication,
           * we will not be given a username/password combination to this method, at which point
           * we'll have to make sure Angular passes in Windows credentials to endpoint.
           */
          withCredentials: query === '' ? true : false,

        }).subscribe((auth: AuthenticateResponse) => {

          const cur = new Backend(this.backendService.active.url, username, storePassword ? password : null, auth.ticket);
          this.backendService.upsertAndActivate(cur);
          this._authenticated.next(true);
          console.log({
            content: 'User successfully authenticated',
            username: username,
            backend: this.backendService.active.url,
          });
          observer.next(auth);
          observer.complete();

        }, (error: any) => {

          console.log({
            content: 'Could not authenticate towards backend',
            username: username,
            backend: this.backendService.active.url,
            error,
          });
          observer.error(error);
          observer.complete();
        });
    });
  }

  /**
   * Logs out the user from his currently active backend.
   * 
   * @param destroyPassword Whether or not password should be removed before persisting backend
   */
  logoutFromCurrent(destroyPassword: boolean) {
    if (this.backendService.active?.token) {
      const cur = new Backend(
        this.backendService.active.url,
        this.backendService.active.username,
        destroyPassword ? null : this.backendService.active.password);
      this.backendService.upsertAndActivate(cur);
      this.backendService.active.createAccessRights();
      this._authenticated.next(false);
    }
  }

  /**
   * Changes currently logged in user's password.
   * 
   * @param password New password for user
   */
  changePassword(password: string) {
    return this.httpService.put<Response>('/magic/system/auth/change-password', { password });
  }

  /**
   * Invokes the backend to have a reset password email being sent to user.
   * 
   * @param username Username of user to generate the email for
   * @param frontendUrl URL of frontend to use to build reset-password email from
   */
  sendResetPasswordEmail(username: string, frontendUrl: string) {
    return this.httpService.post<Response>('/magic/system/auth/send-reset-password-link', {
      username,
      frontendUrl,
    });
  }
}

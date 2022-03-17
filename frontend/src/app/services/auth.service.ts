
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

// Application specific imports.
import { HttpService } from './http.service';
import { Backend } from '../models/backend.model';
import { BackendService } from './backend.service';
import { Endpoint } from '../models/endpoint.model';
import { Messages } from 'src/app/models/messages.model';
import { Response } from 'src/app/models/response.model';
import { MessageService } from 'src/app/services/message.service';
import { AuthenticateResponse } from '../components/management/auth/models/authenticate-response.model';

/**
 * Authentication and authorization HTTP service.
 * 
 * This service will allow you to authenticate towards the active backend.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // To allow consumers to subscribe to authentication events.
  private _authenticated = new BehaviorSubject<boolean>(undefined);

  /**
   * Creates an instance of your service.
   * 
   * @param httpClient Dependency injected HTTP client to handle (raw) HTTP requests, without backend dependencies
   * @param httpService Dependency injected HTTP service to handle HTTP requests
   * @param messageService Needed to transmit message when user logs out
   * @param backendService Dependency injected backend service to handle currently selected backends
   */
  constructor(
    private httpClient: HttpClient,
    private httpService: HttpService,
    private messageService: MessageService,
    private backendService: BackendService) { }

  /**
   * To allow consumers to subscribe to authentication status changes.
   */
  authenticatedChanged = this._authenticated.asObservable();

  /**
   * Returns access rights for user.
   */
  get access() { return this.backendService.current.access; }

  /**
   * Returns true if user is authenticated towards backend.
   */
  get authenticated() : boolean {
    return this.backendService.current?.token && 
      !this.backendService.current.token.expired;
  }

  /**
   * Invokes specified backend to check if auto-auth has been turned on.
   * 
   * @param url URL of backend to check
   */
  autoAuth(url: string) {
    return this.httpClient.get<Response>(url + '/magic/system/auth/auto-auth');
   }

  /**
   * Authenticates user towards current backend.
   * 
   * @param username Username
   * @param password Password
   * @param storePassword Whether or not passsword should be persisted into local storage
   */
  login(username: string, password: string, storePassword: boolean) {

    // Returning new observer, chaining authentication and retrieval of endpoints.
    const url = this.backendService.current.url;
    return new Observable<AuthenticateResponse>(observer => {

      // Creating QUERY parameters.
      let query = '';
      if (username && username !== '') {
        query += '?username=' + encodeURIComponent(username);
        query += '&password=' + encodeURIComponent(password);
      }

      // Authenticating user.
      this.httpService.get<AuthenticateResponse>(
        '/magic/system/auth/authenticate' + query, {

          /*
           * Notice, if we're doing Windows automatic authentication,
           * we will not be given a username/password combination to this method, at which point
           * we'll have to make sure Angular passes in Windows credentials to endpoint.
           */
          withCredentials: query === '' ? true : false,

        }).subscribe((auth: AuthenticateResponse) => {

          // Setting backend we just authenticated towards to the active backend.
          const cur = new Backend(url, username, storePassword ? password : null, auth.ticket);
          this.backendService.setActive(cur);

          // Invoking next link in chain of observables.
          observer.next(auth);
          observer.complete();

          // Ensuring subscribers to authentication status is notified.
          this._authenticated.next(true);
          console.log({
            content: 'User successfully authenticated towards backend',
            username: username,
            backend: url,
          });

        }, (error: any) => {
          observer.error(error);
          observer.complete();
      });
    });
  }

  /**
   * Logs out the user from his currently active backend.
   * 
   * @param destroyPassword Whether or not password should be removed before persisting backend
   * @param showInfo Whether or not user should be shown information telling him he was successfully logged out or not
   */
  logout(destroyPassword: boolean, showInfo: boolean = true) {
    if (this.backendService.current?.token) {
      const cur = new Backend(this.backendService.current.url, this.backendService.current.username, destroyPassword ? null : this.backendService.current.password);
      this.backendService.setActive(cur);
      this.messageService.sendMessage({
        name: Messages.USER_LOGGED_OUT,
        content: showInfo,
      });
      this.createAccessRights();

      // Ensuring subscribers to authentication status is notified.
      this._authenticated.next(false);
    }
  }

  /**
   * Changes currently logged in user's password.
   * 
   * @param password New password for user
   */
  changePassword(password: string) {

    // Invoking backend returning observable to caller.
    return this.httpService.put<Response>('/magic/system/auth/change-password', {
      password
    });
  }

  /**
   * Verifies validity of token by invoking backend.
   */
  verifyToken() {

    // Invokes backend and returns observable to caller.
    return this.httpService.get<Response>('/magic/system/auth/verify-ticket');
  }

  /**
   * Registers a new user in the backend.
   * 
   * @param username User's email address
   * @param password Password user selected
   * @param frontendUrl Frontend's URL to use as root URL for confirming email address
   */
  register(username: string, password: string, frontendUrl: string) {

    // Invokes backend and returns observable to caller.
    return this.httpService.post<Response>(
      '/magic/system/auth/register', {
        username,
        password,
        frontendUrl,
      });
  }

  /**
   * Verifies validity of email address supplied during
   * registration by invoking backend.
   * 
   * @param username Username of user which is email address user supplied during registration
   * @param token Security token system generated for user to avoid user's registering other users' email addresses
   */
  verifyEmail(username: string, token: string) {

    // Invokes backend and returns observable to caller.
    return this.httpService.post<Response>(
      '/magic/system/auth/verify-email', {
        username,
        token,
      });
  }

  /**
   * Invokes the backend to have a reset password email being sent to user.
   * 
   * @param username Username of user to generate the email for
   * @param frontendUrl URL of frontend to use to build reset-password email from
   */
  sendResetPasswordEmail(username: string, frontendUrl: string) {

    // Invoking backend returning observable to caller.
    return this.httpService.post<Response>('/magic/system/auth/send-reset-password-link', {
      username,
      frontendUrl,
    });
  }

  /**
   * Creates access right object used to determine if user has access to specific parts of the app or not.
   */
  createAccessRights() {
    this.backendService.current.createAccessRights();
  }

  updateAuthStatus(newStatus: boolean) {
    this._authenticated.next(newStatus);
  }
}


/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { Backend } from '../../../models/backend.model';
import { Messages } from 'src/app/models/messages.model';
import { Endpoint } from '../../../models/endpoint.model';
import { HttpService } from '../../../services/http.service';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from '../../../services/backend.service';
import { AuthenticateResponse } from '../models/authenticate-response.model';

/**
 * Authentication and authorization HTTP service.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Used to figure out if user is authorised to access URLs or not.
  private _endpoints: Endpoint[] = [];

  /**
   * Creates an instance of your service.
   * 
   * @param httpService Dependency injected HTTP service to handle HTTP requests
   * @param messageService Needed to transmit message when user logs out
   * @param backendService Dependency injected backend service to handle currently selected backends
   */
  constructor(
    private httpService: HttpService,
    private messageService: MessageService,
    private backendService: BackendService) {

      // Checking if user has a token towards his current backend, and if the token is expired.
      if (this.backendService.connected &&
        this.backendService.current.token &&
        this.backendService.isTokenExpired(this.backendService.current.token)) {

        // Removing JWT token.
        this.backendService.current.token = null;
        this.backendService.persistBackends();

      } else if (this.backendService.connected && this.backendService.current.token) {

        // Token is not expired, hence we need to create a refresh token timer.
        this.createRefreshJWTTimer(this.backendService.current);
      }
    }

  /**
   * Returns true if user is authenticated towards backend.
   */
  public get authenticated() {
    return this.backendService.connected && this.backendService.current.token;
  }

  /**
   * Authenticates user towards specified backend.
   * 
   * @param username Username
   * @param password Password
   * @param storePassword Whether or not passsword should be persisted into local storage
   */
  public login(
    username: string,
    password: string,
    storePassword: boolean) {

    // Returning new observer, chaining authentication and retrieval of endpoints.
    return new Observable<AuthenticateResponse>(observer => {

      // Authenticating user.
      this.httpService.get<AuthenticateResponse>(
        '/magic/modules/system/auth/authenticate' +
        '?username=' + encodeURI(username) +
        '&password=' + encodeURI(password)).subscribe((auth: AuthenticateResponse) => {

          // Persisting backend data.
          this.backendService.current = {
            url: this.backendService.current.url,
            username,
            password: storePassword ? password : null,
            token: auth.ticket,
          };

          // Making sure we refresh JWT token just before it expires.
          this.createRefreshJWTTimer(this.backendService.current);

          // Invoking next link in chain of observables.
          observer.next(auth);
          observer.complete();

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
   */
  public logout(destroyPassword: boolean) {
    if (this.authenticated) {
      this.backendService.current.token = null;
      if (destroyPassword) {
        this.backendService.current.password = null;
      }
      this.backendService.persistBackends();
      this.messageService.sendMessage({
        name: Messages.USER_LOGGED_OUT,
      });
    }
  }

  /**
   * Retrieves endpoints for currently selected backend.
   */
  public getEndpoints() {

    // Returning new observer, chaining retrieval of endpoints and storing them locally.
    return new Observable<Endpoint[]>(observer => {

      // Invoking backend.
      this.httpService.get<Endpoint[]>(
        '/magic/modules/system/auth/endpoints').subscribe(res => {
        this._endpoints = res;
        observer.next(res);
        observer.complete();
      }, error => {
        observer.error(error);
        observer.complete();
      });
    });
  }

  /**
   * Returns a list of all roles currently authenticated
   * user belongs to, if any.
   */
  public roles() {

    // Verifying user is authenticated, and returning empty array if not.
    if (!this.authenticated) {
      return [];
    }

    // Parsing role field from JWT token, and splitting at ','.
    const payload = <string>atob(this.backendService.current.token.split('.')[1]);
    const roles = JSON.parse(payload).role;
    if (Array.isArray(roles)) {
      return roles;
    }
    return [roles];
  }

  /**
   * Returns true if user has access to the specified component.
   * In order to have access to a component, user has to have access to all component URLs.
   * 
   * @param component Name of component to check if user has access to
   */
  public hasAccess(component: string) {

    // Retrieving roles, and all endpoints matching path for specific component.
    const userRoles = this.roles();
    const componentEndpoints = this._endpoints.filter(x => x.path.indexOf(component) >= 0);
    if (componentEndpoints.length === 0) {
      return false; // No URL matching component's URL.
    }

    // Looping through all endpoints for component, and verifying user has access to all of them.
    for (var idx of componentEndpoints) {

      // Checking that component requires authorisation.
      if (!idx.auth || idx.auth.length === 0) {
        continue;
      }

      // Verifying user belongs to at least one of the roles required to invoke endpoint.
      if (idx.auth.filter(x => userRoles.indexOf(x) >= 0).length === 0) {
        return false;
      }
    }

    /*
     * User belongs to at least one of the roles required to invoke all
     * endoints for specified component, or component does not require authorisation
     * to be invoked.
     */
    return true;
  }

  /*
   * Private helper methods.
   */

  /**
   * Creates a refresh timer for a single backend's JWT token.
   * 
   * @param backend Which backend to create a refresh timer for.
   */
  public createRefreshJWTTimer(backend: Backend) {

    // Finding number of seconds until token expires.
    const exp = (JSON.parse(atob(backend.token.split('.')[1]))).exp;
    const now = Math.floor(new Date().getTime() / 1000);
    const delta = (exp - now) - 60; // One minute before expiration.

    // Creating a timer that kicks in 1 minute before token expires.
    setTimeout(() => {

      // Invoking the refresh token method for backend.
      this.refreshJWTToken(backend);
    }, Math.max(delta * 1000, 100));
  }

  /*
   * Will refresh the JWT token for the specified backend.
   */
  public refreshJWTToken(backend: Backend) {

    // Verifying user has not explicitly logged out before timer kicked in.
    if (backend.token) {

      // Invoking refresh JWT token endpoint.
      this.httpService.get<AuthenticateResponse>(
        '/magic/modules/system/auth/refresh-ticket').subscribe(res => {

        // Saving JWT token, and presisting all backends.
        backend.token = res.ticket;
        this.backendService.persistBackends();

        // Creating our next refresh JWT token timer.
        this.createRefreshJWTTimer(backend);

      }, () => {

        // Token could not be refreshed, destroying the existing token, and persisting all backends.
        console.error('JWT token could not be refreshed');
        backend.token = null;
        this.backendService.persistBackends();
      });
    }
  }
}
